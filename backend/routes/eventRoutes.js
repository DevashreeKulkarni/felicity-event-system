const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getEventParticipants
} = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/auth');
const { submitFeedback, getEventFeedback } = require('../controllers/feedbackController');
const {
  markAttendance,
  getAttendance,
  getMerchandisePayments
} = require('../controllers/registrationController');

router.post('/', protect, createEvent);
router.get('/', protect, getEvents);
router.get('/organizer/my-events', protect, getOrganizerEvents);
router.get('/:id', protect, getEventById);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.get('/:id/participants', protect, getEventParticipants);
router.post('/:id/feedback', protect, submitFeedback);
router.get('/:id/feedback', protect, getEventFeedback);

// Phase 5: Attendance
router.post('/:id/scan', protect, restrictTo('organizer'), markAttendance);
router.get('/:id/attendance', protect, restrictTo('organizer'), getAttendance);

// Phase 6: Merchandise payments
router.get('/:id/payments', protect, restrictTo('organizer'), getMerchandisePayments);

module.exports = router;

