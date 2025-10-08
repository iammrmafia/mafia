const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get stories feed
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's connections
        const connections = await Connection.getConnections(userId);
        const connectionIds = connections.map(conn => 
            conn.requester.toString() === userId ? conn.recipient : conn.requester
        );

        // Get active stories from connections and self
        const stories = await Story.find({
            author: { $in: [...connectionIds, userId] },
            isActive: true,
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate('author', 'fullName username profile.profilePicture');

        // Group stories by author
        const groupedStories = stories.reduce((acc, story) => {
            const authorId = story.author._id.toString();
            if (!acc[authorId]) {
                acc[authorId] = {
                    author: story.author,
                    stories: [],
                    hasViewed: false
                };
            }
            acc[authorId].stories.push(story);
            
            // Check if user has viewed all stories from this author
            const allViewed = acc[authorId].stories.every(s => 
                s.viewers.some(v => v.user.toString() === userId)
            );
            acc[authorId].hasViewed = allViewed;
            
            return acc;
        }, {});

        res.json({ 
            success: true, 
            stories: Object.values(groupedStories) 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a story
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { content, privacy = 'public', customViewers, music, location } = req.body;
        const userId = req.user.id;

        const story = await Story.create({
            author: userId,
            content,
            privacy,
            customViewers,
            music,
            location
        });

        const populatedStory = await Story.findById(story._id)
            .populate('author', 'fullName username profile.profilePicture');

        res.status(201).json({ success: true, story: populatedStory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's stories
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const stories = await Story.find({
            author: req.params.userId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: 1 })
            .populate('author', 'fullName username profile.profilePicture')
            .populate('viewers.user', 'fullName username profile.profilePicture');

        res.json({ success: true, stories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// View a story
router.post('/:storyId/view', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId);

        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        // Check if story has expired
        if (story.expiresAt < new Date()) {
            story.isActive = false;
            await story.save();
            return res.status(410).json({ success: false, message: 'Story has expired' });
        }

        await story.addView(req.user.id);

        // Notify story author (if not viewing own story)
        if (story.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: story.author,
                sender: req.user.id,
                type: 'story_view',
                content: { story: story._id }
            });
        }

        res.json({ success: true, viewsCount: story.viewsCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// React to a story
router.post('/:storyId/react', authenticateToken, async (req, res) => {
    try {
        const { emoji } = req.body;
        const story = await Story.findById(req.params.storyId);

        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        await story.addReaction(req.user.id, emoji);

        // Notify story author
        if (story.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: story.author,
                sender: req.user.id,
                type: 'story_reaction',
                content: { story: story._id }
            });
        }

        res.json({ success: true, reactions: story.reactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reply to a story
router.post('/:storyId/reply', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        const story = await Story.findById(req.params.storyId);

        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        story.replies.push({
            user: req.user.id,
            text,
            createdAt: Date.now()
        });

        await story.save();

        // Notify story author
        if (story.author.toString() !== req.user.id) {
            await Notification.createNotification({
                recipient: story.author,
                sender: req.user.id,
                type: 'story_reaction',
                content: { story: story._id }
            });
        }

        res.json({ success: true, replies: story.replies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a story
router.delete('/:storyId', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId);

        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (story.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Story.findByIdAndDelete(req.params.storyId);

        res.json({ success: true, message: 'Story deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get story viewers
router.get('/:storyId/viewers', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId)
            .populate('viewers.user', 'fullName username profile.profilePicture');

        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (story.author.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, viewers: story.viewers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
