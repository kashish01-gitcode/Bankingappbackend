const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { apiResponse } = require('../utils/helpers');

// Verify JWT and attach user to req.user
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return apiResponse(res, 401, 'Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return apiResponse(res, 401, 'Token is no longer valid. User not found.');
    }

    if (!user.isActive) {
      return apiResponse(res, 403, 'Your account has been deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiResponse(res, 401, 'Token has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      return apiResponse(res, 401, 'Invalid token. Please log in again.');
    }
    next(error);
  }
};

// Restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return apiResponse(
        res,
        403,
        `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };