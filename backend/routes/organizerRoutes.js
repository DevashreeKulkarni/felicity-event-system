const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  updateOrganizerProfile,
  getEventAnalytics,
  getOrganizerAnalytics,
  exportParticipants,
  requestPasswordReset
} = require('../controllers/organizerController');

router.put('/profile', protect, restrictTo('organizer'), updateOrganizerProfile);
router.get('/analytics', protect, restrictTo('organizer'), getOrganizerAnalytics);
router.get('/event/:id/analytics', protect, restrictTo('organizer'), getEventAnalytics);
router.get('/event/:id/export', protect, restrictTo('organizer'), exportParticipants);
router.post('/reset-request', protect, restrictTo('organizer'), requestPasswordReset);

module.exports = router;

