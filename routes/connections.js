const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Send connection request
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { recipientId, connectionType = 'friend' } = req.body;
        const requesterId = req.user.id;

        if (requesterId === recipientId) {
            return res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
        }

        const connection = await Connection.sendRequest(requesterId, recipientId, connectionType);

        // Notify recipient
        await Notification.createNotification({
            recipient: recipientId,
            sender: requesterId,
            type: 'connection_request',
            content: {}
        });

        res.status(201).json({ success: true, connection });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Accept connection request
router.put('/accept/:connectionId', authenticateToken, async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection request not found' });
        }

        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Connection.acceptRequest(req.params.connectionId);

        // Update both users' connection counts
        await User.findByIdAndUpdate(connection.requester, { $inc: { 'stats.connectionsCount': 1 } });
        await User.findByIdAndUpdate(connection.recipient, { $inc: { 'stats.connectionsCount': 1 } });

        // Notify requester
        await Notification.createNotification({
            recipient: connection.requester,
            sender: req.user.id,
            type: 'connection_accepted',
            content: {}
        });

        res.json({ success: true, message: 'Connection accepted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Decline connection request
router.delete('/decline/:connectionId', authenticateToken, async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection request not found' });
        }

        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        connection.status = 'declined';
        await connection.save();

        res.json({ success: true, message: 'Connection declined' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's connections
router.get('/my-connections', authenticateToken, async (req, res) => {
    try {
        const connections = await Connection.getConnections(req.user.id, 'accepted');
        res.json({ success: true, connections });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get pending connection requests
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        const requests = await Connection.find({
            recipient: req.user.id,
            status: 'pending'
        })
            .populate('requester', 'fullName username profile.profilePicture profile.familyRole')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get sent connection requests
router.get('/sent', authenticateToken, async (req, res) => {
    try {
        const requests = await Connection.find({
            requester: req.user.id,
            status: 'pending'
        })
            .populate('recipient', 'fullName username profile.profilePicture profile.familyRole')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove connection
router.delete('/:connectionId', authenticateToken, async (req, res) => {
    try {
        const connection = await Connection.findById(req.params.connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        const userId = req.user.id;
        if (connection.requester.toString() !== userId && connection.recipient.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update both users' connection counts
        await User.findByIdAndUpdate(connection.requester, { $inc: { 'stats.connectionsCount': -1 } });
        await User.findByIdAndUpdate(connection.recipient, { $inc: { 'stats.connectionsCount': -1 } });

        await Connection.findByIdAndDelete(req.params.connectionId);

        res.json({ success: true, message: 'Connection removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Follow a user (one-way connection)
router.post('/follow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        if (followerId === followingId) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        const connection = await Connection.sendRequest(followerId, followingId, 'follower');

        // Auto-accept for follower type
        await Connection.acceptRequest(connection._id);

        // Update counts
        await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': 1 } });
        await User.findByIdAndUpdate(followingId, { $inc: { 'stats.followersCount': 1 } });

        // Notify user
        await Notification.createNotification({
            recipient: followingId,
            sender: followerId,
            type: 'follow',
            content: {}
        });

        res.json({ success: true, message: 'User followed' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Unfollow a user
router.delete('/unfollow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        const connection = await Connection.findOne({
            requester: followerId,
            recipient: followingId,
            connectionType: 'follower'
        });

        if (!connection) {
            return res.status(404).json({ success: false, message: 'Not following this user' });
        }

        await Connection.findByIdAndDelete(connection._id);

        // Update counts
        await User.findByIdAndUpdate(followerId, { $inc: { 'stats.followingCount': -1 } });
        await User.findByIdAndUpdate(followingId, { $inc: { 'stats.followersCount': -1 } });

        res.json({ success: true, message: 'User unfollowed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get followers
router.get('/followers/:userId', authenticateToken, async (req, res) => {
    try {
        const followers = await Connection.find({
            recipient: req.params.userId,
            connectionType: 'follower',
            status: 'accepted'
        })
            .populate('requester', 'fullName username profile.profilePicture profile.familyRole')
            .sort({ createdAt: -1 });

        res.json({ success: true, followers: followers.map(f => f.requester) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get following
router.get('/following/:userId', authenticateToken, async (req, res) => {
    try {
        const following = await Connection.find({
            requester: req.params.userId,
            connectionType: 'follower',
            status: 'accepted'
        })
            .populate('recipient', 'fullName username profile.profilePicture profile.familyRole')
            .sort({ createdAt: -1 });

        res.json({ success: true, following: following.map(f => f.recipient) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
