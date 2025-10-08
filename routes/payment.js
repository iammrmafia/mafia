const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Create payment intent
router.post('/create-payment-intent', [
    body('email').isEmail().normalizeEmail(),
    body('amount').isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { amount, email } = req.body;

        // Create a PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            receipt_email: email,
            metadata: {
                service: 'Mafia Inc. Membership',
                membershipFee: amount
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment Intent Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
});

// Process registration with payment
router.post('/register-and-pay', [
    body('fullName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('cardToken').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            fullName,
            email,
            phone,
            address,
            city,
            state,
            referredBy,
            cardToken
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Create Stripe customer
        const customer = await stripe.customers.create({
            email: email,
            name: fullName,
            phone: phone,
            address: {
                line1: address,
                city: city,
                state: state,
                country: 'US'
            }
        });

        // Create payment intent and charge
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 50000, // $500.00 in cents
            currency: 'usd',
            customer: customer.id,
            payment_method: cardToken,
            confirm: true,
            receipt_email: email,
            description: 'The Mafia Inc. - Lifetime Membership Fee',
            metadata: {
                fullName: fullName,
                membershipType: 'Lifetime'
            }
        });

        // Create user in database
        const newUser = new User({
            fullName,
            email,
            phone,
            address: {
                street: address,
                city,
                state
            },
            referredBy: referredBy || null,
            stripeCustomerId: customer.id,
            stripePaymentIntentId: paymentIntent.id,
            membershipFee: 500
        });

        // If payment succeeded, activate membership
        if (paymentIntent.status === 'succeeded') {
            await newUser.activateMembership();
        }

        await newUser.save();

        res.json({
            success: true,
            message: 'Registration and payment successful',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                membershipStatus: newUser.membershipStatus,
                membershipDate: newUser.membershipDate
            },
            payment: {
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        
        // Handle Stripe errors
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                success: false,
                message: 'Card payment failed',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Verify payment status
router.get('/verify-payment/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.json({
            success: true,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
});

module.exports = router;
