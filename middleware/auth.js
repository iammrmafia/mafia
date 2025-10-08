const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user is active
        if (user.membershipStatus === 'suspended' || user.membershipStatus === 'cancelled') {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is suspended or cancelled' 
            });
        }

        req.user = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            membershipStatus: user.membershipStatus
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Check if user has active membership
const requireActiveMembership = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.membershipStatus !== 'active') {
            return res.status(403).json({ 
                success: false, 
                message: 'Active membership required' 
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Check if user is admin/moderator
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        const adminRoles = ['godfather', 'underboss', 'consigliere'];
        if (!adminRoles.includes(user.profile.familyRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin privileges required' 
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (user) {
                req.user = {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    username: user.username
                };
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticateToken,
    requireActiveMembership,
    requireAdmin,
    optionalAuth
};
