const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const crypto = require('crypto');
const path = require('path');
const { sendTicketEmail } = require('../utils/emailService');
const { sendDiscordNotification } = require('../utils/discordService');

const registerForEvent = async (req, res) => {
  try {
    const { eventId, formData } = req.body;

    if (req.user.organizerName) {
      return res.status(403).json({ message: 'Organizers cannot register for events' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'Published') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    if (event.currentRegistrations >= event.registrationLimit) {
      return res.status(400).json({ message: 'Registration limit reached' });
    }

    const existingRegistration = await Registration.findOne({
      userId: req.user._id,
      eventId: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const ticketId = `TICKET-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // For merchandise events, payment must be verified before ticket is issued
    const isMerchandise = event.eventType === 'Merchandise';
    const paymentStatus = isMerchandise ? 'Pending' : (event.registrationFee > 0 ? 'Pending' : 'Free');

    const registration = await Registration.create({
      userId: req.user._id,
      eventId: eventId,
      ticketId: ticketId,
      formData: formData || {},
      paymentStatus
    });

    event.currentRegistrations += 1;
    await event.save();

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('eventId', 'eventName eventType eventStartDate eventEndDate venue registrationFee merchandiseDetails')
      .populate('userId', 'firstName lastName email');

    // Only send ticket email for non-merchandise (merchandise gets ticket after payment approval)
    if (!isMerchandise) {
      const participantName = `${populatedRegistration.userId.firstName} ${populatedRegistration.userId.lastName}`;
      sendTicketEmail(
        populatedRegistration.userId.email,
        participantName,
        {
          eventName: populatedRegistration.eventId.eventName,
          eventType: populatedRegistration.eventId.eventType,
          eventStartDate: populatedRegistration.eventId.eventStartDate,
          venue: populatedRegistration.eventId.venue,
          registrationFee: populatedRegistration.eventId.registrationFee
        },
        ticketId
      ).catch(err => console.error('Email error:', err.message));
    }

    // Discord notification
    const organizer = await Organizer.findById(event.organizerId);
    if (organizer && organizer.discordWebhook) {
      sendDiscordNotification(
        organizer.discordWebhook,
        {
          eventName: populatedRegistration.eventId.eventName,
          registrationFee: populatedRegistration.eventId.registrationFee,
          currentRegistrations: event.currentRegistrations
        },
        {
          firstName: populatedRegistration.userId.firstName,
          lastName: populatedRegistration.userId.lastName,
          email: populatedRegistration.userId.email,
          ticketId: ticketId
        }
      ).catch(err => console.error('Discord error:', err.message));
    }

    res.status(201).json(populatedRegistration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserRegistrations = async (req, res) => {
  try {
    if (req.user.organizerName) {
      return res.status(403).json({ message: 'Only participants can access this' });
    }

    const registrations = await Registration.find({ userId: req.user._id })
      .populate('eventId')
      .sort('-registrationDate');

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    registration.status = 'Cancelled';
    await registration.save();

    const event = await Event.findById(registration.eventId);
    if (event) {
      event.currentRegistrations -= 1;
      await event.save();
    }

    res.json({ message: 'Registration cancelled', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 5: Mark attendance by scanning QR / ticket ID
const markAttendance = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Verify organizer owns this event
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const registration = await Registration.findOne({ ticketId, eventId })
      .populate('userId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid ticket — not registered for this event' });
    }

    if (registration.attendance && registration.attendance.marked) {
      return res.status(400).json({
        success: false,
        message: 'Already scanned',
        participant: `${registration.userId.firstName} ${registration.userId.lastName}`,
        scannedAt: registration.attendance.timestamp
      });
    }

    registration.attendance = { marked: true, timestamp: new Date() };
    await registration.save();

    res.json({
      success: true,
      message: 'Attendance marked',
      participant: `${registration.userId.firstName} ${registration.userId.lastName}`,
      ticketId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 5: Get attendance list for an event
const getAttendance = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const registrations = await Registration.find({ eventId, status: { $ne: 'Cancelled' } })
      .populate('userId', 'firstName lastName email')
      .sort('registrationDate');

    const total = registrations.length;
    const scanned = registrations.filter(r => r.attendance && r.attendance.marked).length;

    res.json({ registrations, total, scanned });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 5: Manual toggle attendance
const toggleAttendance = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId');

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const event = await Event.findById(registration.eventId);
    if (!event || event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const currentlyMarked = registration.attendance && registration.attendance.marked;
    registration.attendance = {
      marked: !currentlyMarked,
      timestamp: !currentlyMarked ? new Date() : null
    };
    await registration.save();

    res.json({ success: true, attendance: registration.attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 6: Participant uploads payment proof
const uploadPaymentProof = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId', 'eventType');

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    if (registration.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (registration.eventId.eventType !== 'Merchandise') {
      return res.status(400).json({ message: 'Payment proof only for merchandise events' });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    registration.paymentProof = {
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };
    registration.paymentStatus = 'PendingVerification';
    await registration.save();

    res.json({ message: 'Payment proof uploaded', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 6: Organizer gets pending payments for their event
const getMerchandisePayments = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    const registrations = await Registration.find({
      eventId,
      paymentStatus: { $in: ['Pending', 'PendingVerification', 'Paid', 'Rejected'] }
    }).populate('userId', 'firstName lastName email').sort('-createdAt');

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 6: Organizer approves payment → decrement stock, set Paid
const approvePayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId');

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const event = await Event.findById(registration.eventId);
    if (!event || event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (registration.paymentStatus !== 'PendingVerification') {
      return res.status(400).json({ message: 'No pending proof to approve' });
    }

    // Decrement merchandise stock
    if (event.merchandiseDetails && event.merchandiseDetails.stockQuantity > 0) {
      event.merchandiseDetails.stockQuantity -= 1;
      await event.save();
    }

    registration.paymentStatus = 'Paid';
    await registration.save();

    res.json({ message: 'Payment approved', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phase 6: Organizer rejects payment
const rejectPayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId');

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const event = await Event.findById(registration.eventId);
    if (!event || event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    registration.paymentStatus = 'Rejected';
    await registration.save();

    res.json({ message: 'Payment rejected', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerForEvent,
  getUserRegistrations,
  cancelRegistration,
  markAttendance,
  getAttendance,
  toggleAttendance,
  uploadPaymentProof,
  getMerchandisePayments,
  approvePayment,
  rejectPayment
};
