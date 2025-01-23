const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// Get message statistics
router.get('/stats', async (req, res) => {
    try {
        const totalMessages = await Contact.countDocuments({ progress: 'inProgress' });
        const newMessages = await Contact.countDocuments({ progress: 'inProgress' });

        res.json({
            totalMessages,
            newMessages
        });
    } catch (error) {
        console.error('Error getting message stats:', error);
        res.status(500).json({ error: 'Failed to get message statistics' });
    }
});

// Get messages with optional filter
router.get('/check', async (req, res) => {
    try {
        const status = req.query.status || 'active';
        let query = {};
        
        if (status === 'all') {
            // No filter - show all messages
        } else if (status === 'done') {
            query.progress = 'done';
        } else {
            // Default to showing only active (inProgress) messages
            query.progress = 'inProgress';
        }

        const messages = await Contact.find(query)
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Update message status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['inProgress', 'done'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            { progress: status },
            { new: true }
        );
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        console.error('Error updating message status:', error);
        res.status(500).json({ error: 'Failed to update message status' });
    }
});

// Delete message
router.delete('/:id', async (req, res) => {
    try {
        const message = await Contact.findByIdAndDelete(req.params.id);
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

module.exports = router;
