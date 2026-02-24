const Event = require('../models/Event');

/**
 * Middleware to automatically update event statuses based on dates
 * Runs on every request to keep statuses up-to-date
 */
const autoUpdateEventStatus = async (req, res, next) => {
  try {
    const now = new Date();

    // Update Published → Ongoing (event has started)
    await Event.updateMany(
      {
        status: 'Published',
        eventStartDate: { $lte: now },
        eventEndDate: { $gt: now }
      },
      {
        $set: { status: 'Ongoing' }
      }
    );

    // Update Ongoing → Completed (event has ended)
    await Event.updateMany(
      {
        status: 'Ongoing',
        eventEndDate: { $lte: now }
      },
      {
        $set: { status: 'Completed' }
      }
    );

    // Also check Published events that have ended (in case they never went to Ongoing)
    await Event.updateMany(
      {
        status: 'Published',
        eventEndDate: { $lte: now }
      },
      {
        $set: { status: 'Completed' }
      }
    );

    next();
  } catch (error) {
    console.error('Auto status update error:', error);
    next(); // Continue even if status update fails
  }
};

/**
 * Manual function to update a specific event's status
 */
const updateEventStatus = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) return null;

    const now = new Date();
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);

    let newStatus = event.status;

    if (event.status === 'Published' && now >= startDate && now < endDate) {
      newStatus = 'Ongoing';
    } else if ((event.status === 'Published' || event.status === 'Ongoing') && now >= endDate) {
      newStatus = 'Completed';
    }

    if (newStatus !== event.status) {
      event.status = newStatus;
      await event.save();
      console.log(`Event ${event.eventName} status updated to ${newStatus}`);
    }

    return event;
  } catch (error) {
    console.error('Update event status error:', error);
    return null;
  }
};

module.exports = {
  autoUpdateEventStatus,
  updateEventStatus
};
