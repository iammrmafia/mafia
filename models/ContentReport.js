const mongoose = require('mongoose');

const contentReportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // What is being reported
    reportedContent: {
        contentType: {
            type: String,
            enum: ['post', 'comment', 'message', 'story', 'user_profile', 'conversation'],
            required: true
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'reportedContent.contentType'
        },
        contentOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        contentSnapshot: {
            text: String,
            mediaUrls: [String],
            timestamp: Date
        }
    },
    
    // Report Details
    reportReason: {
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
            'other'
        ],
        required: true,
        index: true
    },
    
    reportSubcategory: {
        type: String
    },
    
    description: {
        type: String,
        maxlength: 1000
    },
    
    evidence: [{
        type: {
            type: String,
            enum: ['screenshot', 'link', 'text']
        },
        content: String,
        url: String
    }],
    
    // Review Status
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
        default: 'pending',
        index: true
    },
    
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    
    // Review Information
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    reviewedAt: {
        type: Date
    },
    
    reviewNotes: {
        type: String
    },
    
    decision: {
        action: {
            type: String,
            enum: [
                'no_action',
                'content_removed',
                'content_warning_added',
                'user_warned',
                'user_restricted',
                'user_suspended',
                'user_banned',
                'escalated_to_legal'
            ]
        },
        reason: String,
        actionTakenAt: Date,
        appealDeadline: Date
    },
    
    // AI Moderation
    aiModeration: {
        flagged: {
            type: Boolean,
            default: false
        },
        confidence: Number,
        categories: [String],
        processedAt: Date
    },
    
    // Appeal Information
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
        appealReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        appealDecision: String,
        appealDecisionAt: Date
    },
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    
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

// Indexes for efficient queries
contentReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
contentReportSchema.index({ 'reportedContent.contentOwner': 1, status: 1 });
contentReportSchema.index({ reporter: 1, createdAt: -1 });

// Static methods
contentReportSchema.statics.getPendingReports = async function(limit = 50) {
    return await this.find({ status: 'pending' })
        .sort({ priority: -1, createdAt: 1 })
        .limit(limit)
        .populate('reporter reportedContent.contentOwner', 'fullName email profile.profilePicture');
};

contentReportSchema.statics.getReportsByUser = async function(userId) {
    return await this.find({ 'reportedContent.contentOwner': userId })
        .sort({ createdAt: -1 })
        .populate('reporter', 'fullName');
};

// Methods
contentReportSchema.methods.escalate = async function() {
    this.status = 'escalated';
    this.priority = 'critical';
    this.updatedAt = Date.now();
    return await this.save();
};

contentReportSchema.methods.resolve = async function(decision, reviewerId) {
    this.status = 'resolved';
    this.reviewedBy = reviewerId;
    this.reviewedAt = Date.now();
    this.decision = {
        ...decision,
        actionTakenAt: Date.now(),
        appealDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    return await this.save();
};

const ContentReport = mongoose.model('ContentReport', contentReportSchema);

module.exports = ContentReport;
