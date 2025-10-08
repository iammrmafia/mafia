const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Check if email exists
router.post('/check-email', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        res.json({
            success: true,
            exists: !!user,
            message: user ? 'Email already registered' : 'Email available'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking email',
            error: error.message
        });
    }
});

// Get user by email
router.get('/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email })
            .select('-stripeCustomerId -stripePaymentIntentId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                membershipStatus: user.membershipStatus,
                membershipDate: user.membershipDate,
                paymentStatus: user.paymentStatus
            }
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
