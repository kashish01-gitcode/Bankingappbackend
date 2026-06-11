const User = require('../models/User');
const Account = require('../models/Account');
const { generateToken, apiResponse } = require('../utils/helpers');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    console.log('register hit', typeof next);
    const { fullName, email, password, role, accountType } = req.body;

    if (!fullName || !email || !password) {
      return apiResponse(res, 400, 'Full name, email, and password are required.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return apiResponse(res, 409, 'An account with this email already exists.');
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({ fullName, email, password, role: assignedRole });

    // Auto-create an account for the new user
    const account = await Account.create({
      userId: user._id,
      accountType: accountType || 'savings',
      currency: 'INR',
    });

    const token = generateToken(user._id, user.role);

    return apiResponse(res, 201, 'Registration successful.', {
      token,
      user,
      account,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiResponse(res, 400, 'Email and password are required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return apiResponse(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return apiResponse(res, 403, 'Your account has been deactivated. Contact support.');
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    return apiResponse(res, 200, 'Login successful.', { token, user });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('accounts');
    return apiResponse(res, 200, 'Profile retrieved.', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };