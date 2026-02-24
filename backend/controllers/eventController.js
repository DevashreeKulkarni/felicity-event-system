const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');

// ==========================================
// CREATE EVENT - CLEAN VERSION
// ==========================================
const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventDescription,
      eventType,
      eligibility,
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationLimit,
      registrationFee,
      venue,
      eventTags,
      customForm,
      merchandiseDetails,
      status
    } = req.body;

    // Validate user is an organizer
    if (!req.user.organizerName) {
      return res.status(403).json({ message: 'Only organizers can create events' });
    }

    // Create event - status will be whatever is passed, or 'Draft' if not provided
    const event = await Event.create({
      eventName,
      eventDescription,
      eventType,
      eligibility,
      registrationDeadline,
      eventStartDate,
      eventEndDate,
      registrationLimit,
      registrationFee: registrationFee || 0,
      venue: venue || '',
      organizerId: req.user._id,
      eventTags: eventTags || [],
      customForm: customForm || [],
      merchandiseDetails,
      status: status || 'Draft'
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// GET ALL EVENTS
// ==========================================
const getEvents = async (req, res) => {
  try {
    const { search, eventType, eligibility, startDate, endDate, followedOnly } = req.query;
    let query = { status: { $in: ['Published', 'Ongoing'] } };

    if (search) {
      const matchingOrganizers = await Organizer.find(
        { organizerName: { $regex: search, $options: 'i' } },
        '_id'
      );
      const organizerIds = matchingOrganizers.map(o => o._id);
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { eventDescription: { $regex: search, $options: 'i' } },
        { organizerId: { $in: organizerIds } }
      ];
    }

    if (eventType) query.eventType = eventType;
    if (eligibility) query.eligibility = eligibility;

    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    if (followedOnly === 'true' && req.user.followedOrganizers) {
      query.organizerId = { $in: req.user.followedOrganizers };
    }

    const events = await Event.find(query)
      .populate('organizerId', 'organizerName category')
      .sort('-createdAt');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// GET EVENT BY ID
// ==========================================
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// UPDATE EVENT
// ==========================================
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    if (event.status === 'Draft') {
      const hasRegistrations = await Registration.exists({ eventId: event._id });
      const updates = { ...req.body };
      if (hasRegistrations) delete updates.customForm;
      Object.assign(event, updates);
    } else if (event.status === 'Published') {
      const allowedUpdates = ['eventDescription', 'registrationDeadline', 'registrationLimit', 'status'];
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
    } else if (event.status === 'Ongoing' || event.status === 'Completed') {
      if (req.body.status) {
        event.status = req.body.status;
      } else {
        return res.status(400).json({ message: 'Can only update status for ongoing/completed events' });
      }
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// DELETE EVENT
// ==========================================
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    if (event.status !== 'Draft') {
      return res.status(400).json({ message: 'Can only delete draft events' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// GET ORGANIZER'S EVENTS
// ==========================================
const getOrganizerEvents = async (req, res) => {
  try {
    if (!req.user.organizerName) {
      return res.status(403).json({ message: 'Only organizers can access this' });
    }

    const events = await Event.find({ organizerId: req.user._id })
      .sort('-createdAt');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// GET EVENT PARTICIPANTS
// ==========================================
const getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ eventId: req.params.id })
      .populate('userId', 'firstName lastName email contactNumber')
      .sort('-registrationDate');

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getEventParticipants
};
