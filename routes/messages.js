const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId,
            deletedBy: { $ne: userId }
        })
            .populate('participants', 'fullName username profile.profilePicture isOnline lastSeen')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get or create direct conversation
router.post('/conversations/direct', authenticateToken, async (req, res) => {
    try {
        const { recipientId } = req.body;
        const userId = req.user.id;

        if (userId === recipientId) {
            return res.status(400).json({ success: false, message: 'Cannot message yourself' });
        }

        const conversation = await Conversation.findOrCreateDirectConversation(userId, recipientId);
        
        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'fullName username profile.profilePicture isOnline lastSeen');

        res.json({ success: true, conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create group conversation
router.post('/conversations/group', authenticateToken, async (req, res) => {
    try {
        const { participantIds, groupInfo } = req.body;
        const userId = req.user.id;

        if (!participantIds || participantIds.length < 1) {
            return res.status(400).json({ success: false, message: 'At least 2 participants required' });
        }

        const conversation = await Conversation.createGroupConversation(
            userId,
            participantIds,
            groupInfo
        );

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'fullName username profile.profilePicture');

        res.status(201).json({ success: true, conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        // Verify user is participant
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const messages = await Message.find({
            conversation: req.params.conversationId,
            deletedFor: { $ne: userId }
        })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('sender', 'fullName username profile.profilePicture')
            .populate('content.replyTo');

        // Mark messages as read
        const unreadMessages = messages.filter(msg => 
            msg.sender.toString() !== userId && 
            !msg.readBy.some(r => r.user.toString() === userId)
        );

        for (const message of unreadMessages) {
            await message.markAsRead(userId);
        }

        // Reset unread count
        await conversation.resetUnreadCount(userId);

        res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    try {
        const { text, media, replyTo } = req.body;
        const userId = req.user.id;

        // Verify user is participant
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation || !conversation.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const message = await Message.create({
            conversation: req.params.conversationId,
            sender: userId,
            content: { text, media, replyTo }
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = Date.now();

        // Increment unread count for other participants
        for (const participantId of conversation.participants) {
            if (participantId.toString() !== userId) {
                await conversation.incrementUnreadCount(participantId);
                
                // Create notification
                await Notification.createNotification({
                    recipient: participantId,
                    sender: userId,
                    type: 'message',
                    content: { conversation: conversation._id }
                });
            }
        }

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'fullName username profile.profilePicture');

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const { deleteForEveryone } = req.body;

        if (deleteForEveryone && message.sender.toString() === req.user.id) {
            message.isDeleted = true;
            await message.save();
        } else {
            message.deletedFor.push(req.user.id);
            await message.save();
        }

        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add reaction to message
router.post('/messages/:messageId/react', authenticateToken, async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await message.addReaction(req.user.id, emoji);

        res.json({ success: true, reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark conversation as read
router.put('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        await conversation.resetUnreadCount(req.user.id);

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Archive conversation
router.put('/conversations/:conversationId/archive', authenticateToken, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (!conversation.archivedBy.includes(req.user.id)) {
            conversation.archivedBy.push(req.user.id);
            await conversation.save();
        }

        res.json({ success: true, message: 'Conversation archived' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mute conversation
router.put('/conversations/:conversationId/mute', authenticateToken, async (req, res) => {
    try {
        const { duration } = req.body; // in hours
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const mutedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

        conversation.mutedBy = conversation.mutedBy.filter(
            m => m.user.toString() !== req.user.id
        );
        conversation.mutedBy.push({
            user: req.user.id,
            mutedUntil
        });

        await conversation.save();

        res.json({ success: true, message: 'Conversation muted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
