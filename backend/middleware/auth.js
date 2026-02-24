const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'participant' || decoded.role === 'admin') {
        req.user = await User.findById(decoded.id).select('-password');
      } else if (decoded.role === 'organizer') {
        req.user = await Organizer.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role || (req.user.organizerName ? 'organizer' : null);

    if (!roles.includes(userRole)) {
      console.warn(`Permission Denied: User role "${userRole}" not in required roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    console.log(`Permission Granted: Role "${userRole}" matches [${roles.join(', ')}]`);
    next();
  };
};

module.exports = { protect, restrictTo };
