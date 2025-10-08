const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        text: {
            type: String,
            required: true,
            maxlength: 2000
        },
        media: {
            type: String,
            url: String
        }
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    repliesCount: {
        type: Number,
        default: 0
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
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Methods
commentSchema.methods.addLike = async function(userId) {
    const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
    if (!alreadyLiked) {
        this.likes.push({ user: userId });
        this.likesCount += 1;
        await this.save();
    }
    return this;
};

commentSchema.methods.removeLike = async function(userId) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
    this.likesCount = this.likes.length;
    await this.save();
    return this;
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
