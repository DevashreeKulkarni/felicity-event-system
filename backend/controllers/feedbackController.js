const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const eventId = req.params.id;

        // Only participants can submit feedback
        if (!req.user.firstName) {
            return res.status(403).json({ message: 'Only participants can submit feedback' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.status !== 'Completed') {
            return res.status(400).json({ message: 'Feedback can only be submitted for completed events' });
        }

        // Verify participant was registered (but store no identity in feedback)
        const registration = await Registration.findOne({ userId: req.user._id, eventId });
        if (!registration) {
            return res.status(403).json({ message: 'You must be registered for this event to submit feedback' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const feedback = await Feedback.create({ eventId, rating, comment });
        res.status(201).json({ message: 'Feedback submitted anonymously', feedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEventFeedback = async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Only the organizer of this event or admin can view feedback
        if (req.user.organizerName) {
            if (event.organizerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this feedback' });
            }
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const feedbacks = await Feedback.find({ eventId }).sort('-createdAt');
        const avgRating = feedbacks.length
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
            : null;

        res.json({ feedbacks, avgRating, total: feedbacks.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitFeedback, getEventFeedback };
