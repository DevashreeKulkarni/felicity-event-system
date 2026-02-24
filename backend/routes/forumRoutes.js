const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage, togglePin } = require('../controllers/forumController');
const { protect, restrictTo } = require('../middleware/auth');

// Get all messages for an event (any logged-in user)
router.get('/:eventId/messages', protect, getMessages);

// Organizer moderation actions
router.delete('/messages/:messageId', protect, restrictTo('organizer'), deleteMessage);
router.put('/messages/:messageId/pin', protect, restrictTo('organizer'), togglePin);

module.exports = router;
