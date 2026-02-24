const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  discordWebhook: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organizer', organizerSchema);
