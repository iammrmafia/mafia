const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    sender: {
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
                enum: ['image', 'video', 'audio', 'file', 'gif', 'sticker']
            },
            url: String,
            thumbnail: String,
            filename: String,
            size: Number
        }],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        forwarded: {
            type: Boolean,
            default: false
        }
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
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveredTo: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Methods
messageSchema.methods.markAsRead = async function(userId) {
    const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
    if (!alreadyRead) {
        this.readBy.push({ user: userId, readAt: Date.now() });
        await this.save();
    }
    return this;
};

messageSchema.methods.addReaction = async function(userId, emoji) {
    // Remove existing reaction from this user
    this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
    // Add new reaction
    this.reactions.push({ user: userId, emoji });
    await this.save();
    return this;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
