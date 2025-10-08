const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic Information
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    address: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }
    },
    
    // Profile Information
    profile: {
        bio: {
            type: String,
            maxlength: 500
        },
        profilePicture: {
            type: String,
            default: null
        },
        coverPhoto: {
            type: String,
            default: null
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
        },
        location: {
            city: String,
            state: String,
            country: String
        },
        website: String,
        occupation: String,
        familyRole: {
            type: String,
            enum: ['godfather', 'underboss', 'consigliere', 'caporegime', 'soldier', 'associate', 'member'],
            default: 'member'
        }
    },
    
    // Social Stats
    stats: {
        postsCount: {
            type: Number,
            default: 0
        },
        followersCount: {
            type: Number,
            default: 0
        },
        followingCount: {
            type: Number,
            default: 0
        },
        connectionsCount: {
            type: Number,
            default: 0
        }
    },
    
    // Privacy Settings
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'family', 'friends', 'private'],
            default: 'public'
        },
        showEmail: {
            type: Boolean,
            default: false
        },
        showPhone: {
            type: Boolean,
            default: false
        },
        allowMessages: {
            type: String,
            enum: ['everyone', 'connections', 'nobody'],
            default: 'everyone'
        },
        allowTagging: {
            type: Boolean,
            default: true
        }
    },
    
    // Account Settings
    settings: {
        language: {
            type: String,
            default: 'en'
        },
        timezone: String,
        emailNotifications: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: true
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false
        }
    },
    
    // Membership Information
    referredBy: {
        type: String,
        default: null
    },
    membershipStatus: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'cancelled'],
        default: 'pending'
    },
    membershipDate: {
        type: Date,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripeCustomerId: {
        type: String,
        default: null
    },
    stripePaymentIntentId: {
        type: String,
        default: null
    },
    membershipFee: {
        type: Number,
        default: 500
    },
    
    // Account Status
    isVerified: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to activate membership
userSchema.methods.activateMembership = function() {
    this.membershipStatus = 'active';
    this.paymentStatus = 'completed';
    this.membershipDate = new Date();
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
