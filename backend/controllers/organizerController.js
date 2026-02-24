const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');

const updateOrganizerProfile = async (req, res) => {
  try {
    if (!req.user.organizerName) {
      return res.status(403).json({ message: 'Only organizers can access this' });
    }

    const { organizerName, category, description, contactNumber, discordWebhook } = req.body;

    const organizer = await Organizer.findById(req.user._id);

    if (organizerName) organizer.organizerName = organizerName;
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (contactNumber) organizer.contactNumber = contactNumber;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

    await organizer.save();

    res.json({
      _id: organizer._id,
      organizerName: organizer.organizerName,
      category: organizer.category,
      description: organizer.description,
      contactEmail: organizer.contactEmail,
      contactNumber: organizer.contactNumber,
      discordWebhook: organizer.discordWebhook
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ eventId: req.params.id });

    const analytics = {
      totalRegistrations: registrations.length,
      activeRegistrations: registrations.filter(r => r.status === 'Registered').length,
      cancelledRegistrations: registrations.filter(r => r.status === 'Cancelled').length,
      attendanceMarked: registrations.filter(r => r.attendance.marked).length,
      totalRevenue: registrations
        .filter(r => r.paymentStatus === 'Paid' || r.paymentStatus === 'Free')
        .length * event.registrationFee,
      paidRegistrations: registrations.filter(r => r.paymentStatus === 'Paid').length,
      pendingPayments: registrations.filter(r => r.paymentStatus === 'Pending').length,
      freeRegistrations: registrations.filter(r => r.paymentStatus === 'Free').length
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizerAnalytics = async (req, res) => {
  try {
    if (!req.user.organizerName) {
      return res.status(403).json({ message: 'Only organizers can access this' });
    }

    const events = await Event.find({ organizerId: req.user._id });
    const eventIds = events.map(e => e._id);

    const registrations = await Registration.find({ eventId: { $in: eventIds } });

    const completedEvents = events.filter(e => e.status === 'Completed' || e.status === 'Closed');

    const analytics = {
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === 'Published').length,
      ongoingEvents: events.filter(e => e.status === 'Ongoing').length,
      completedEvents: completedEvents.length,
      totalRegistrations: registrations.length,
      totalAttendance: registrations.filter(r => r.attendance.marked).length,
      totalRevenue: registrations
        .map(r => {
          const event = events.find(e => e._id.toString() === r.eventId.toString());
          return (r.paymentStatus === 'Paid' || r.paymentStatus === 'Free') && event ? event.registrationFee : 0;
        })
        .reduce((sum, fee) => sum + fee, 0)
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ eventId: req.params.id })
      .populate('userId', 'firstName lastName email contactNumber');

    if (!registrations || registrations.length === 0) {
      return res.status(404).json({ message: 'No registrations found' });
    }

    const csvData = registrations
      .filter(reg => reg.userId) // Filter out any registrations without user data
      .map(reg => ({
        firstName: reg.userId.firstName || 'N/A',
        lastName: reg.userId.lastName || 'N/A',
        email: reg.userId.email || 'N/A',
        contactNumber: reg.userId.contactNumber || 'N/A',
        ticketId: reg.ticketId || 'N/A',
        registrationDate: reg.registrationDate ? new Date(reg.registrationDate).toLocaleString() : 'N/A',
        paymentStatus: reg.paymentStatus || 'N/A',
        status: reg.status || 'N/A',
        attendanceMarked: reg.attendance?.marked ? 'Yes' : 'No',
        attendanceTime: reg.attendance?.timestamp ? new Date(reg.attendance.timestamp).toLocaleString() : 'N/A'
      }));

    let csv = 'First Name,Last Name,Email,Contact Number,Ticket ID,Registration Date,Payment Status,Status,Attendance Marked,Attendance Time\n';
    csvData.forEach(row => {
      csv += `"${row.firstName}","${row.lastName}","${row.email}","${row.contactNumber}","${row.ticketId}","${row.registrationDate}","${row.paymentStatus}","${row.status}","${row.attendanceMarked}","${row.attendanceTime}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${event.eventName.replace(/\s+/g, '-')}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    if (!req.user.organizerName) {
      return res.status(403).json({ message: 'Only organizers can request password reset' });
    }
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const existing = await PasswordResetRequest.findOne({
      organizerId: req.user._id,
      status: 'Pending'
    });
    if (existing) return res.status(400).json({ message: 'You already have a pending reset request' });

    const request = await PasswordResetRequest.create({
      organizerId: req.user._id,
      reason
    });
    res.status(201).json({ message: 'Reset request submitted', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateOrganizerProfile,
  getEventAnalytics,
  getOrganizerAnalytics,
  exportParticipants,
  requestPasswordReset
};
