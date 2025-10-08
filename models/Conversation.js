const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    groupInfo: {
        name: String,
        description: String,
        avatar: String,
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    mutedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        mutedUntil: Date
    }],
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    deletedBy: [{
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
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'participants': 1, 'lastMessageAt': -1 });

// Static methods
conversationSchema.statics.findOrCreateDirectConversation = async function(user1Id, user2Id) {
    let conversation = await this.findOne({
        type: 'direct',
        participants: { $all: [user1Id, user2Id], $size: 2 }
    });

    if (!conversation) {
        conversation = await this.create({
            participants: [user1Id, user2Id],
            type: 'direct'
        });
    }

    return conversation;
};

conversationSchema.statics.createGroupConversation = async function(creatorId, participantIds, groupInfo) {
    const allParticipants = [creatorId, ...participantIds];
    
    return await this.create({
        participants: allParticipants,
        type: 'group',
        groupInfo: {
            ...groupInfo,
            admins: [creatorId],
            createdBy: creatorId
        }
    });
};

// Methods
conversationSchema.methods.incrementUnreadCount = function(userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    this.unreadCount.set(userId.toString(), currentCount + 1);
    return this.save();
};

conversationSchema.methods.resetUnreadCount = function(userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
