const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true
  },
  eligibility: {
    type: String,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    required: true
  },
  registrationFee: {
    type: Number,
    required: true,
    default: 0
  },
  venue: {
    type: String,
    trim: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  eventTags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
    default: 'Draft'
  },
  customForm: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  merchandiseDetails: {
    itemDetails: String,
    stockQuantity: Number,
    purchaseLimit: Number
  },
  currentRegistrations: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
