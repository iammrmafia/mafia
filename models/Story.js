const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: {
            type: String,
            enum: ['image', 'video', 'text'],
            required: true
        },
        url: String,
        thumbnail: String,
        text: String,
        backgroundColor: String,
        duration: {
            type: Number,
            default: 5 // seconds
        }
    },
    privacy: {
        type: String,
        enum: ['public', 'family', 'friends', 'custom'],
        default: 'public'
    },
    customViewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    viewers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    viewsCount: {
        type: Number,
        default: 0
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    music: {
        title: String,
        artist: String,
        url: String
    },
    location: {
        name: String,
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired stories

// Pre-save middleware to set expiration
storySchema.pre('save', function(next) {
    if (this.isNew) {
        // Stories expire after 24 hours
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    next();
});

// Methods
storySchema.methods.addView = async function(userId) {
    const alreadyViewed = this.viewers.some(v => v.user.toString() === userId.toString());
    if (!alreadyViewed) {
        this.viewers.push({ user: userId, viewedAt: Date.now() });
        this.viewsCount += 1;
        await this.save();
    }
    return this;
};

storySchema.methods.addReaction = async function(userId, emoji) {
    // Remove existing reaction from this user
    this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
    // Add new reaction
    this.reactions.push({ user: userId, emoji, createdAt: Date.now() });
    await this.save();
    return this;
};

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
