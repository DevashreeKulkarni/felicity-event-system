const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getUserRegistrations,
  cancelRegistration,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
  toggleAttendance
} = require('../controllers/registrationController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, registerForEvent);
router.get('/my-registrations', protect, getUserRegistrations);
router.put('/:id/cancel', protect, cancelRegistration);

// Phase 5: Manual attendance toggle
router.put('/:id/toggle-attendance', protect, restrictTo('organizer'), toggleAttendance);

// Phase 6: Merchandise payment
router.post('/:id/upload-proof', protect, upload.single('paymentProof'), uploadPaymentProof);
router.put('/:id/approve-payment', protect, restrictTo('organizer'), approvePayment);
router.put('/:id/reject-payment', protect, restrictTo('organizer'), rejectPayment);

module.exports = router;

