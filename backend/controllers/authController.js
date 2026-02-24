const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const registerParticipant = async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeName, contactNumber } = req.body;

    // Validate participantType
    if (!participantType || (participantType !== 'IIIT' && participantType !== 'Non-IIIT')) {
      return res.status(400).json({ 
        message: 'Participant type must be either "IIIT" or "Non-IIIT"',
        received: participantType
      });
    }

    if (participantType === 'IIIT') {
      const emailDomain = email.split('@')[1];
      if (emailDomain !== 'students.iiit.ac.in' && emailDomain !== 'iiit.ac.in') {
        return res.status(400).json({ message: 'IIIT participants must use IIIT email' });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'participant',
      participantType,
      collegeName,
      contactNumber
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      participantType: user.participantType,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    let user;
    let role;

    if (loginType === 'organizer') {
      user = await Organizer.findOne({ contactEmail: email });
      role = 'organizer';
    } else {
      user = await User.findOne({ email });
      role = user?.role;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if organizer account is approved/active
    if (loginType === 'organizer' && !user.isApproved) {
      return res.status(403).json({ message: 'Account has been disabled. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, role);

    res.json({
      _id: user._id,
      email: loginType === 'organizer' ? user.contactEmail : user.email,
      role: role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, interests, followedOrganizers } = req.body;

    if (req.user.role === 'participant') {
      const user = await User.findById(req.user._id);
      
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (contactNumber) user.contactNumber = contactNumber;
      if (collegeName) user.collegeName = collegeName;
      if (interests) user.interests = interests;
      if (followedOrganizers) user.followedOrganizers = followedOrganizers;

      await user.save();
      res.json(user);
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerParticipant,
  login,
  getProfile,
  updateProfile
};
