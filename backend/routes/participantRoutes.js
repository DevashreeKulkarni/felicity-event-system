const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  followOrganizer,
  unfollowOrganizer,
  getOrganizerById,
  getTrendingEvents,
  changePassword,
  getAllOrganizers,
  getFollowedOrganizers
} = require('../controllers/participantController');

router.get('/organizers', protect, getAllOrganizers);
router.get('/followed-organizers', protect, getFollowedOrganizers);
router.post('/follow', protect, followOrganizer);
router.post('/follow/:organizerId', protect, followOrganizer);
router.delete('/unfollow/:organizerId', protect, unfollowOrganizer);
router.get('/organizer/:id', protect, getOrganizerById);
router.get('/trending', protect, getTrendingEvents);
router.put('/change-password', protect, changePassword);

module.exports = router;
