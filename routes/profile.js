const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get user profile
router.get('/:userId', optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password -stripeCustomerId -stripePaymentIntentId');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check privacy settings
        const isOwnProfile = req.user && req.user.id === req.params.userId;
        const isPublic = user.privacy.profileVisibility === 'public';

        if (!isOwnProfile && !isPublic) {
            // Check if they are connected
            if (req.user) {
                const connection = await Connection.findOne({
                    $or: [
                        { requester: req.user.id, recipient: req.params.userId, status: 'accepted' },
                        { requester: req.params.userId, recipient: req.user.id, status: 'accepted' }
                    ]
                });

                if (!connection && user.privacy.profileVisibility === 'friends') {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'This profile is private' 
                    });
                }
            } else {
                return res.status(403).json({ 
                    success: false, 
                    message: 'This profile is private' 
                });
            }
        }

        // Get connection status if logged in
        let connectionStatus = null;
        if (req.user && req.user.id !== req.params.userId) {
            const connection = await Connection.findOne({
                $or: [
                    { requester: req.user.id, recipient: req.params.userId },
                    { requester: req.params.userId, recipient: req.user.id }
                ]
            });
            connectionStatus = connection ? connection.status : 'none';
        }

        res.json({ 
            success: true, 
            user,
            connectionStatus,
            isOwnProfile
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['fullName', 'username', 'phone', 'profile', 'privacy', 'settings'];
        
        const user = await User.findById(req.user.id);

        // Apply updates
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                    user[key] = { ...user[key], ...updates[key] };
                } else {
                    user[key] = updates[key];
                }
            }
        }

        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's posts
router.get('/:userId/posts', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = req.params.userId;

        // Check if user can view posts
        const user = await User.findById(userId);
        const isOwnProfile = req.user && req.user.id === userId;

        let privacyFilter = ['public'];
        if (isOwnProfile) {
            privacyFilter = ['public', 'friends', 'family', 'private'];
        } else if (req.user) {
            // Check connection
            const connection = await Connection.findOne({
                $or: [
                    { requester: req.user.id, recipient: userId, status: 'accepted' },
                    { requester: userId, recipient: req.user.id, status: 'accepted' }
                ]
            });
            if (connection) {
                privacyFilter = ['public', 'friends'];
            }
        }

        const posts = await Post.find({
            author: userId,
            isArchived: false,
            privacy: { $in: privacyFilter }
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('author', 'fullName username profile.profilePicture profile.familyRole');

        const count = await Post.countDocuments({
            author: userId,
            isArchived: false,
            privacy: { $in: privacyFilter }
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

// Search users
router.get('/search/users', authenticateToken, async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query must be at least 2 characters' 
            });
        }

        const users = await User.find({
            $or: [
                { fullName: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ],
            'privacy.profileVisibility': { $in: ['public', 'friends'] }
        })
            .select('fullName username profile.profilePicture profile.bio profile.familyRole stats')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get suggested connections
router.get('/suggestions/connections', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        // Get user's existing connections
        const connections = await Connection.find({
            $or: [
                { requester: userId },
                { recipient: userId }
            ]
        });

        const connectedUserIds = connections.map(conn => 
            conn.requester.toString() === userId ? conn.recipient : conn.requester
        );

        // Find users not connected
        const suggestions = await User.find({
            _id: { $nin: [...connectedUserIds, userId] },
            membershipStatus: 'active',
            'privacy.profileVisibility': { $in: ['public', 'friends'] }
        })
            .select('fullName username profile.profilePicture profile.bio profile.familyRole stats')
            .limit(limit * 1);

        res.json({ success: true, suggestions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update online status
router.put('/me/status', authenticateToken, async (req, res) => {
    try {
        const { isOnline } = req.body;
        
        await User.findByIdAndUpdate(req.user.id, {
            isOnline,
            lastSeen: Date.now()
        });

        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
