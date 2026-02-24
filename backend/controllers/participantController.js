const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

const followOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.organizerId || req.body.organizerId;

    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can follow organizers' });
    }

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Already following this organizer' });
    }

    user.followedOrganizers.push(organizerId);
    await user.save();

    res.json({ message: 'Successfully followed organizer', followedOrganizers: user.followedOrganizers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unfollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can unfollow organizers' });
    }

    const user = await User.findById(req.user._id);
    
    const index = user.followedOrganizers.indexOf(organizerId);
    if (index === -1) {
      return res.status(400).json({ message: 'Not following this organizer' });
    }

    user.followedOrganizers.splice(index, 1);
    await user.save();

    res.json({ message: 'Successfully unfollowed organizer', followedOrganizers: user.followedOrganizers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrganizerById = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id).select('-password');
    
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const now = new Date();
    const upcomingEvents = await Event.find({
      organizerId: req.params.id,
      status: { $in: ['Published', 'Ongoing'] },
      eventStartDate: { $gte: now }
    }).select('eventName eventType eventStartDate registrationDeadline status');

    const pastEvents = await Event.find({
      organizerId: req.params.id,
      status: { $in: ['Completed', 'Closed'] }
    }).select('eventName eventType eventStartDate status');

    res.json({
      organizer,
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTrendingEvents = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const Registration = require('../models/Registration');
    
    const trendingRegistrations = await Registration.aggregate([
      {
        $match: {
          registrationDate: { $gte: oneDayAgo },
          status: 'Registered'
        }
      },
      {
        $group: {
          _id: '$eventId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const eventIds = trendingRegistrations.map(item => item._id);
    
    const events = await Event.find({
      _id: { $in: eventIds },
      status: { $in: ['Published', 'Ongoing'] }
    }).populate('organizerId', 'organizerName category');

    const eventsWithCount = events.map(event => {
      const regData = trendingRegistrations.find(r => r._id.toString() === event._id.toString());
      return {
        ...event.toObject(),
        recentRegistrations: regData ? regData.count : 0
      };
    });

    eventsWithCount.sort((a, b) => b.recentRegistrations - a.recentRegistrations);

    res.json(eventsWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    const bcrypt = require('bcryptjs');
    let user;

    if (req.user.role === 'organizer') {
      user = await Organizer.findById(req.user._id);
    } else {
      user = await User.findById(req.user._id);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find({ isApproved: true })
      .select('-password')
      .sort('organizerName');
    
    res.json({ organizers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowedOrganizers = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can access this' });
    }

    const user = await User.findById(req.user._id)
      .populate('followedOrganizers', '-password');
    
    res.json({ organizers: user.followedOrganizers || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  followOrganizer,
  unfollowOrganizer,
  getOrganizerById,
  getTrendingEvents,
  changePassword,
  getAllOrganizers,
  getFollowedOrganizers
};
