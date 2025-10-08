const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get feed posts (with pagination)
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.user.id;

        // Get user's connections to show their posts
        const Connection = require('../models/Connection');
        const connections = await Connection.getConnections(userId);
        const connectionIds = connections.map(conn => 
            conn.requester.toString() === userId ? conn.recipient : conn.requester
        );

        // Include user's own posts and connections' posts
        const posts = await Post.find({
            author: { $in: [...connectionIds, userId] },
            isArchived: false,
            privacy: { $in: ['public', 'friends', 'family'] }
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('author', 'fullName username profile.profilePicture profile.familyRole')
            .populate('content.taggedUsers', 'fullName username')
            .populate({
                path: 'comments',
                options: { limit: 3, sort: { createdAt: -1 } },
                populate: { path: 'author', select: 'fullName username profile.profilePicture' }
            });

        const count = await Post.countDocuments({
            author: { $in: [...connectionIds, userId] },
            isArchived: false
        });

        res.json({
            success: true,
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a post
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { content, privacy = 'public' } = req.body;
        const userId = req.user.id;

        const post = await Post.create({
            author: userId,
            content,
            privacy
        });

        // Update user's post count
        await User.findByIdAndUpdate(userId, { $inc: { 'stats.postsCount': 1 } });

        // Notify tagged users
        if (content.taggedUsers && content.taggedUsers.length > 0) {
            for (const taggedUserId of content.taggedUsers) {
                await Notification.createNotification({
                    recipient: taggedUserId,
                    sender: userId,
                    type: 'tag',
                    content: { post: post._id }
                });
            }
        }

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'fullName username profile.profilePicture profile.familyRole');

        res.status(201).json({
            success: true,
            post: populatedPost
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single post
router.get('/:postId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('author', 'fullName username profile.profilePicture profile.familyRole')
            .populate('content.taggedUsers', 'fullName username')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'fullName username profile.profilePicture' }
            });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Increment view count
        await post.incrementViews();

        res.json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update post
router.put('/:postId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Save edit history
        post.editHistory.push({
            content: post.content.text,
            editedAt: new Date()
        });

        post.content = { ...post.content, ...req.body.content };
        post.isEdited = true;
        await post.save();

        res.json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Post.findByIdAndDelete(req.params.postId);
        await Comment.deleteMany({ post: req.params.postId });
        await User.findByIdAndUpdate(req.user.id, { $inc: { 'stats.postsCount': -1 } });

        res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Like a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        await post.addLike(req.user.id);

        // Notify post author
        if (post.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: post.author,
                sender: req.user.id,
                type: 'like_post',
                content: { post: post._id }
            });
        }

        res.json({ success: true, likesCount: post.likesCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Unlike a post
router.delete('/:postId/like', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        await post.removeLike(req.user.id);

        res.json({ success: true, likesCount: post.likesCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add comment to post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
    try {
        const { text, media, parentComment } = req.body;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = await Comment.create({
            post: req.params.postId,
            author: req.user.id,
            content: { text, media },
            parentComment
        });

        // Update post
        post.comments.push(comment._id);
        post.commentsCount += 1;
        await post.save();

        // Update parent comment if it's a reply
        if (parentComment) {
            await Comment.findByIdAndUpdate(parentComment, {
                $push: { replies: comment._id },
                $inc: { repliesCount: 1 }
            });
        }

        // Notify post author
        if (post.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: post.author,
                sender: req.user.id,
                type: 'comment_post',
                content: { post: post._id, comment: comment._id }
            });
        }

        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'fullName username profile.profilePicture');

        res.status(201).json({ success: true, comment: populatedComment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get comments for a post
router.get('/:postId/comments', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find({
            post: req.params.postId,
            parentComment: null,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('author', 'fullName username profile.profilePicture')
            .populate({
                path: 'replies',
                populate: { path: 'author', select: 'fullName username profile.profilePicture' }
            });

        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Share a post
router.post('/:postId/share', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        post.shares.push({ user: req.user.id });
        post.sharesCount += 1;
        await post.save();

        // Notify post author
        if (post.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: post.author,
                sender: req.user.id,
                type: 'share_post',
                content: { post: post._id }
            });
        }

        res.json({ success: true, sharesCount: post.sharesCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
