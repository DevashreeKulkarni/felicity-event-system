const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    // Either userId (participant/admin) or organizerId is set
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        default: null
    },
    senderName: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['participant', 'organizer'],
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
