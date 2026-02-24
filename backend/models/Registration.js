const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Registered', 'Completed', 'Cancelled'],
    default: 'Registered'
  },
  paymentStatus: {
    type: String,
    enum: ['Free', 'Pending', 'PendingVerification', 'Paid', 'Rejected'],
    default: 'Free'
  },
  paymentProof: {
    url: String,
    uploadedAt: Date
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attendance: {
    marked: {
      type: Boolean,
      default: false
    },
    timestamp: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Registration', registrationSchema);
