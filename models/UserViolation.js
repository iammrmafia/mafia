const mongoose = require('mongoose');

const userViolationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    violationType: {
        type: String,
        enum: [
            'violence_criminal',
            'hate_speech',
            'harassment_bullying',
            'spam',
            'misinformation',
            'adult_content',
            'privacy_violation',
            'intellectual_property',
            'impersonation',
            'self_harm',
            'terrorism',
            'child_safety',
            'community_standards',
            'terms_of_service'
        ],
        required: true,
        index: true
    },
    
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    relatedContent: {
        contentType: String,
        contentId: mongoose.Schema.Types.ObjectId,
        contentSnapshot: String
    },
    
    relatedReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContentReport'
    },
    
    // Enforcement Action
    action: {
        type: {
            type: String,
            enum: [
                'warning',
                'content_removal',
                'feature_restriction',
                'temporary_suspension',
                'permanent_ban',
                'account_deletion'
            ],
            required: true
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        restrictions: [{
            feature: {
                type: String,
                enum: ['posting', 'commenting', 'messaging', 'story_creation', 'live_streaming', 'all']
            },
            until: Date
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    
    // Strike System (like Meta's)
    strikeCount: {
        type: Number,
        default: 1
    },
    
    // Notification to User
    userNotified: {
        type: Boolean,
        default: false
    },
    
    notificationSentAt: Date,
    
    // Appeal
    appeal: {
        isAppealed: {
            type: Boolean,
            default: false
        },
        appealReason: String,
        appealedAt: Date,
        appealStatus: {
            type: String,
            enum: ['pending', 'under_review', 'upheld', 'overturned']
        },
        appealDecision: String,
        appealDecisionAt: Date,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // Issued By
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    issuedBySystem: {
        type: Boolean,
        default: false
    },
    
    // Expiration
    expiresAt: {
        type: Date,
        index: true
    },
    
    isExpired: {
        type: Boolean,
        default: false
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
userViolationSchema.index({ user: 1, 'action.isActive': 1 });
userViolationSchema.index({ user: 1, violationType: 1, createdAt: -1 });
userViolationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
userViolationSchema.statics.getUserViolations = async function(userId, activeOnly = false) {
    const query = { user: userId };
    if (activeOnly) {
        query['action.isActive'] = true;
    }
    return await this.find(query).sort({ createdAt: -1 });
};

userViolationSchema.statics.getActiveRestrictions = async function(userId) {
    return await this.find({
        user: userId,
        'action.isActive': true,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    });
};

userViolationSchema.statics.getUserStrikeCount = async function(userId) {
    const violations = await this.find({
        user: userId,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    });
    return violations.reduce((sum, v) => sum + v.strikeCount, 0);
};

// Methods
userViolationSchema.methods.expire = async function() {
    this.action.isActive = false;
    this.isExpired = true;
    return await this.save();
};

userViolationSchema.methods.submitAppeal = async function(reason) {
    this.appeal = {
        isAppealed: true,
        appealReason: reason,
        appealedAt: Date.now(),
        appealStatus: 'pending'
    };
    return await this.save();
};

const UserViolation = mongoose.model('UserViolation', userViolationSchema);

module.exports = UserViolation;
