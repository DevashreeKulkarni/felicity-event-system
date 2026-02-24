const Message = require('../models/Message');
const Registration = require('../models/Registration');

// GET /api/forum/:eventId/messages — any authenticated user
const getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const messages = await Message.find({ eventId, isDeleted: false })
            .sort({ isPinned: -1, createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/forum/messages/:messageId — organizer only
const deleteMessage = async (req, res) => {
    try {
        console.log('Deleting message:', req.params.messageId);
        const msg = await Message.findById(req.params.messageId);
        if (!msg) return res.status(404).json({ message: 'Message not found' });

        msg.isDeleted = true;
        await msg.save();

        // Broadcast deletion to all clients in the forum room
        const io = req.app.get('io');
        if (io) {
            const roomId = `forum:${msg.eventId.toString()}`;
            console.log('Broadcasting deletion to room:', roomId);
            io.to(roomId).emit('message-deleted', { messageId: msg._id.toString() });
        }

        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error('Delete error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/forum/messages/:messageId/pin — organizer only
const togglePin = async (req, res) => {
    try {
        console.log('Toggling pin for message:', req.params.messageId);
        const msg = await Message.findById(req.params.messageId);
        if (!msg) return res.status(404).json({ message: 'Message not found' });

        msg.isPinned = !msg.isPinned;
        await msg.save();

        // Broadcast pin toggle to all clients in the forum room
        const io = req.app.get('io');
        if (io) {
            const roomId = `forum:${msg.eventId.toString()}`;
            console.log('Broadcasting pin to room:', roomId);
            io.to(roomId).emit('message-pinned', {
                messageId: msg._id.toString(),
                isPinned: msg.isPinned
            });
        }

        res.json({ isPinned: msg.isPinned });
    } catch (err) {
        console.error('Pin error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMessages, deleteMessage, togglePin };
