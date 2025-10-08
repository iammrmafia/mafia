const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users (admin only - add authentication middleware in production)
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
            .select('-stripeCustomerId -stripePaymentIntentId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeMembers = await User.countDocuments({ membershipStatus: 'active' });
        const pendingMembers = await User.countDocuments({ membershipStatus: 'pending' });
        const totalRevenue = await User.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$membershipFee' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeMembers,
                pendingMembers,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-stripeCustomerId -stripePaymentIntentId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

module.exports = router;
