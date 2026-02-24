const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
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
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    default: 'participant'
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
    required: function() {
      return this.role === 'participant';
    }
  },
  collegeName: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  interests: [{
    type: String
  }],
  followedOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
