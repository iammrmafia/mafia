const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'like_post',
            'comment_post',
            'reply_comment',
            'mention',
            'tag',
            'follow',
            'connection_request',
            'connection_accepted',
            'share_post',
            'story_view',
            'story_reaction',
            'message',
            'group_invite',
            'post_milestone'
        ],
        required: true,
        index: true
    },
    content: {
        text: String,
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        },
        story: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Story'
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation'
        }
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    actionUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// Static methods
notificationSchema.statics.createNotification = async function(data) {
    // Avoid duplicate notifications
    const existing = await this.findOne({
        recipient: data.recipient,
        sender: data.sender,
        type: data.type,
        'content.post': data.content?.post,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // within last 5 minutes
    });

    if (existing) {
        return existing;
    }

    return await this.create(data);
};

notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
    return await this.updateMany(
        { _id: { $in: notificationIds }, recipient: userId },
        { isRead: true, readAt: Date.now() }
    );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: Date.now() }
    );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
