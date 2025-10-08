const mongoose = require('mongoose');

const contentModerationSchema = new mongoose.Schema({
    content: {
        contentType: {
            type: String,
            enum: ['post', 'comment', 'message', 'story', 'user_profile'],
            required: true
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        contentOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    
    // AI/Automated Moderation
    aiModeration: {
        processed: {
            type: Boolean,
            default: false
        },
        processedAt: Date,
        
        // Text Analysis
        textAnalysis: {
            toxicity: Number,
            severeToxicity: Number,
            identityAttack: Number,
            insult: Number,
            profanity: Number,
            threat: Number,
            sexuallyExplicit: Number
        },
        
        // Image/Video Analysis
        visualAnalysis: {
            adultContent: Number,
            violence: Number,
            racy: Number,
            medical: Number,
            spoofed: Number
        },
        
        // Detected Issues
        detectedViolations: [{
            category: String,
            confidence: Number,
            severity: String
        }],
        
        // Overall Risk Score
        riskScore: {
            type: Number,
            min: 0,
            max: 100
        },
        
        recommendation: {
            type: String,
            enum: ['approve', 'review', 'remove', 'warn']
        }
    },
    
    // Human Review
    humanReview: {
        required: {
            type: Boolean,
            default: false
        },
        reviewed: {
            type: Boolean,
            default: false
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        reviewNotes: String,
        decision: {
            type: String,
            enum: ['approved', 'removed', 'warning_added', 'age_restricted', 'requires_context']
        },
        decisionReason: String
    },
    
    // Final Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'flagged', 'removed', 'under_review'],
        default: 'pending',
        index: true
    },
    
    // Actions Taken
    actionsTaken: [{
        action: {
            type: String,
            enum: [
                'content_removed',
                'content_blurred',
                'warning_label_added',
                'age_restricted',
                'reach_limited',
                'no_action'
            ]
        },
        reason: String,
        takenAt: {
            type: Date,
            default: Date.now
        },
        takenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Sensitivity Labels
    sensitivityLabels: [{
        type: String,
        enum: [
            'graphic_violence',
            'adult_content',
            'sensitive_topic',
            'disturbing_content',
            'political_content',
            'medical_content'
        ]
    }],
    
    // Age Restriction
    ageRestricted: {
        type: Boolean,
        default: false
    },
    
    minimumAge: {
        type: Number,
        default: 13
    },
    
    // Visibility
    visibility: {
        type: String,
        enum: ['public', 'limited', 'hidden', 'removed'],
        default: 'public'
    },
    
    // Appeal
    appealed: {
        type: Boolean,
        default: false
    },
    
    appealDetails: {
        appealedAt: Date,
        appealReason: String,
        appealStatus: String,
        appealDecision: String
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
contentModerationSchema.index({ 'content.contentId': 1, 'content.contentType': 1 });
contentModerationSchema.index({ status: 1, 'aiModeration.riskScore': -1 });
contentModerationSchema.index({ 'humanReview.required': 1, 'humanReview.reviewed': 1 });

// Static methods
contentModerationSchema.statics.getContentRequiringReview = async function(limit = 50) {
    return await this.find({
        'humanReview.required': true,
        'humanReview.reviewed': false
    })
        .sort({ 'aiModeration.riskScore': -1, createdAt: 1 })
        .limit(limit)
        .populate('content.contentOwner', 'fullName email');
};

contentModerationSchema.statics.getHighRiskContent = async function(threshold = 70) {
    return await this.find({
        'aiModeration.riskScore': { $gte: threshold },
        status: { $in: ['pending', 'under_review'] }
    })
        .sort({ 'aiModeration.riskScore': -1 })
        .populate('content.contentOwner', 'fullName email');
};

// Methods
contentModerationSchema.methods.approveContent = async function(reviewerId) {
    this.status = 'approved';
    this.humanReview.reviewed = true;
    this.humanReview.reviewedBy = reviewerId;
    this.humanReview.reviewedAt = Date.now();
    this.humanReview.decision = 'approved';
    this.visibility = 'public';
    return await this.save();
};

contentModerationSchema.methods.removeContent = async function(reviewerId, reason) {
    this.status = 'removed';
    this.humanReview.reviewed = true;
    this.humanReview.reviewedBy = reviewerId;
    this.humanReview.reviewedAt = Date.now();
    this.humanReview.decision = 'removed';
    this.humanReview.decisionReason = reason;
    this.visibility = 'removed';
    this.actionsTaken.push({
        action: 'content_removed',
        reason: reason,
        takenBy: reviewerId
    });
    return await this.save();
};

const ContentModeration = mongoose.model('ContentModeration', contentModerationSchema);

module.exports = ContentModeration;
