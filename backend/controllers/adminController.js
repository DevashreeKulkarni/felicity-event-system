const bcrypt = require('bcryptjs');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { sendPasswordResetEmail } = require('../utils/emailService');

const createOrganizer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create organizers' });
    }

    const { organizerName, category, description, contactNumber } = req.body;

    const contactEmail = `${organizerName.toLowerCase().replace(/\s+/g, '')}@felicity.com`;
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1@';

    const organizerExists = await Organizer.findOne({ contactEmail });
    if (organizerExists) {
      return res.status(400).json({ message: 'Organizer already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const organizer = await Organizer.create({
      organizerName,
      category,
      description,
      contactEmail,
      password: hashedPassword,
      contactNumber
    });

    res.status(201).json({
      message: 'Organizer created successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        contactEmail: organizer.contactEmail,
        category: organizer.category
      },
      credentials: {
        email: contactEmail,
        password: tempPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .select('-password')
      .sort('organizerName');

    res.json({ organizers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrganizer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete organizers' });
    }

    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Delete all events created by this organizer
    const organizerEvents = await Event.find({ organizerId: req.params.id });
    const eventIds = organizerEvents.map(event => event._id);

    // Delete all registrations for those events
    if (eventIds.length > 0) {
      await Registration.deleteMany({ eventId: { $in: eventIds } });
    }

    // Delete all events
    await Event.deleteMany({ organizerId: req.params.id });

    // Delete the organizer
    await Organizer.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Organizer and all associated data deleted successfully',
      eventsDeleted: eventIds.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('organizerId', 'organizerName contactEmail category')
      .sort('-createdAt');
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveResetRequest = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed' });

    const newPassword = Math.random().toString(36).slice(-8) + 'A1@';
    const hashed = await bcrypt.hash(newPassword, 10);

    const organizer = await Organizer.findByIdAndUpdate(request.organizerId, { password: hashed }, { new: true });

    request.status = 'Approved';
    request.newPassword = newPassword;
    await request.save();

    // Email the new password to the organizer (non-blocking)
    sendPasswordResetEmail(
      organizer.contactEmail,
      organizer.organizerName,
      newPassword
    ).catch(err => console.error('Reset email error:', err.message));

    res.json({ message: 'Approved', newPassword, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectResetRequest = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'Rejected';
    request.adminComment = req.body.comment || '';
    await request.save();

    res.json({ message: 'Rejected', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrganizer,
  getAllOrganizers,
  deleteOrganizer,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest
};
