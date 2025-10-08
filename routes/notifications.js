const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const userId = req.user.id;

        const query = { recipient: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('sender', 'fullName username profile.profilePicture')
            .populate('content.post')
            .populate('content.comment');

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        await Notification.markAsRead([req.params.notificationId], req.user.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.notificationId,
            recipient: req.user.id
        });

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
