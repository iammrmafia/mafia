const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        text: {
            type: String,
            maxlength: 5000
        },
        media: [{
            type: {
                type: String,
                enum: ['image', 'video', 'gif'],
                required: true
            },
            url: {
                type: String,
                required: true
            },
            thumbnail: String,
            width: Number,
            height: Number,
            duration: Number // for videos
        }],
        location: {
            name: String,
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere'
            }
        },
        feeling: String,
        taggedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    privacy: {
        type: String,
        enum: ['public', 'family', 'friends', 'private'],
        default: 'public'
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likesCount: {
        type: Number,
        default: 0,
        index: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    commentsCount: {
        type: Number,
        default: 0
    },
    shares: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharesCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedAt: Date
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
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

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likesCount: -1, createdAt: -1 });
postSchema.index({ 'content.taggedUsers': 1 });

// Methods
postSchema.methods.addLike = async function(userId) {
    const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
    if (!alreadyLiked) {
        this.likes.push({ user: userId });
        this.likesCount += 1;
        await this.save();
    }
    return this;
};

postSchema.methods.removeLike = async function(userId) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
    this.likesCount = this.likes.length;
    await this.save();
    return this;
};

postSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
    return this;
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
