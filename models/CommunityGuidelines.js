const mongoose = require('mongoose');

const communityGuidelinesSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        unique: true
    },
    effectiveDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Core Guidelines Categories
    guidelines: {
        // 1. Violence and Criminal Behavior
        violenceAndCriminal: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: {
                    type: String,
                    enum: ['low', 'medium', 'high', 'critical']
                }
            }],
            prohibitedContent: [String],
            exceptions: [String]
        },
        
        // 2. Safety and Harmful Content
        safetyAndHarm: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            prohibitedContent: [String]
        },
        
        // 3. Bullying and Harassment
        bullyingAndHarassment: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            protectedGroups: [String]
        },
        
        // 4. Privacy and Personal Information
        privacyAndPersonalInfo: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            prohibitedSharing: [String]
        },
        
        // 5. Hate Speech and Discrimination
        hateSpeechAndDiscrimination: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            protectedCharacteristics: [String]
        },
        
        // 6. Spam and Fake Engagement
        spamAndFakeEngagement: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            prohibitedActivities: [String]
        },
        
        // 7. Intellectual Property
        intellectualProperty: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            copyrightPolicy: String,
            trademarkPolicy: String
        },
        
        // 8. Misinformation and False News
        misinformationAndFalseNews: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            factCheckingProcess: String
        },
        
        // 9. Adult Content and Nudity
        adultContentAndNudity: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            allowedContent: [String],
            prohibitedContent: [String]
        },
        
        // 10. Authenticity and Identity
        authenticityAndIdentity: {
            title: String,
            description: String,
            rules: [{
                rule: String,
                examples: [String],
                severity: String
            }],
            impersonationPolicy: String
        }
    },
    
    // Enforcement Actions
    enforcementActions: [{
        violationType: String,
        firstOffense: {
            action: {
                type: String,
                enum: ['warning', 'content_removal', 'temporary_restriction', 'temporary_ban', 'permanent_ban']
            },
            duration: Number, // in days
            description: String
        },
        secondOffense: {
            action: String,
            duration: Number,
            description: String
        },
        thirdOffense: {
            action: String,
            duration: Number,
            description: String
        },
        appealable: {
            type: Boolean,
            default: true
        }
    }],
    
    // Appeal Process
    appealProcess: {
        description: String,
        timeframe: String,
        steps: [String],
        reviewCriteria: [String]
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Static method to get active guidelines
communityGuidelinesSchema.statics.getActiveGuidelines = async function() {
    return await this.findOne({ isActive: true }).sort({ effectiveDate: -1 });
};

const CommunityGuidelines = mongoose.model('CommunityGuidelines', communityGuidelinesSchema);

module.exports = CommunityGuidelines;
