const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'blocked'],
        default: 'pending',
        index: true
    },
    connectionType: {
        type: String,
        enum: ['friend', 'family', 'associate', 'follower'],
        default: 'friend'
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

// Compound indexes for efficient queries
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

// Static methods
connectionSchema.statics.sendRequest = async function(requesterId, recipientId, type = 'friend') {
    // Check if connection already exists
    const existing = await this.findOne({
        $or: [
            { requester: requesterId, recipient: recipientId },
            { requester: recipientId, recipient: requesterId }
        ]
    });

    if (existing) {
        throw new Error('Connection already exists');
    }

    return await this.create({
        requester: requesterId,
        recipient: recipientId,
        connectionType: type,
        status: 'pending'
    });
};

connectionSchema.statics.acceptRequest = async function(requestId) {
    const connection = await this.findById(requestId);
    if (!connection) throw new Error('Connection request not found');
    
    connection.status = 'accepted';
    connection.updatedAt = Date.now();
    return await connection.save();
};

connectionSchema.statics.getConnections = async function(userId, status = 'accepted') {
    return await this.find({
        $or: [
            { requester: userId, status },
            { recipient: userId, status }
        ]
    }).populate('requester recipient', 'fullName email profilePicture');
};

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
