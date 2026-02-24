const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createOrganizer,
  getAllOrganizers,
  deleteOrganizer,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest
} = require('../controllers/adminController');

router.post('/organizers', protect, restrictTo('admin'), createOrganizer);
router.get('/organizers', protect, getAllOrganizers);
router.delete('/organizers/:id', protect, restrictTo('admin'), deleteOrganizer);

router.get('/reset-requests', protect, restrictTo('admin'), getResetRequests);
router.put('/reset-requests/:id/approve', protect, restrictTo('admin'), approveResetRequest);
router.put('/reset-requests/:id/reject', protect, restrictTo('admin'), rejectResetRequest);

module.exports = router;

