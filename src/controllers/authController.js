const User = require('../models/User');
const Account = require('../models/Account');
const { generateToken, apiResponse } = require('../utils/helpers');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const sendOtpEmail = require('../utils/sendEmail');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, accountType, aadharNumber } = req.body;
    const profileImage = req.file ? req.file.filename : '';

    if (!fullName || !email || !password || !aadharNumber) {
      return apiResponse(res, 400, 'Full name, email, password and Aadhar number are required.');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return apiResponse(res, 409, 'An account with this email already exists.');
    }

    const existingAadhar = await User.findOne({ aadharNumber });
    if (existingAadhar) {
      return apiResponse(res, 409, 'This Aadhar number is already registered.');
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry();

    const user = await User.create({
      fullName,
      email,
      password,
      role: assignedRole,
      aadharNumber,
      profileImage,
      branchName: 'Indore Main Branch',
      ifscCode: 'SBIN0001234',
      isVerified: false,
      otp,
      otpExpiry,
    });

    await Account.create({
      userId: user._id,
      accountType: accountType || 'savings',
      currency: 'INR',
      branchName: 'Indore Main Branch',
      ifscCode: 'SBIN0001234',
    });

    await sendOtpEmail(user.email, otp, 'register');

    return apiResponse(res, 201, 'OTP sent to your email. Please verify to complete registration.', {
      email: user.email,
      purpose: 'register',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-register-otp
const verifyRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return apiResponse(res, 400, 'Email and OTP are required.');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) return apiResponse(res, 404, 'User not found.');
    if (user.isVerified) return apiResponse(res, 400, 'Account already verified. Please login.');
    if (!user.otp || user.otp !== otp) return apiResponse(res, 400, 'Invalid OTP.');
    if (user.otpExpiry < new Date()) return apiResponse(res, 400, 'OTP has expired. Please request a new one.');

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    const account = await Account.findOne({ userId: user._id });
    const token = generateToken(user._id, user.role);

    return apiResponse(res, 200, 'Account verified successfully.', { token, user, account });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return apiResponse(res, 400, 'Account number/email and password are required.');
    }

    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
    } else {
      const account = await Account.findOne({ accountNumber: identifier });
      if (account) user = await User.findById(account.userId).select('+password');
    }

    if (!user || !(await user.comparePassword(password))) {
      return apiResponse(res, 401, 'Invalid account number/email or password.');
    }

    if (!user.isActive) {
      return apiResponse(res, 403, 'Your account has been deactivated. Contact support.');
    }

    if (!user.isVerified) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpiry = getOtpExpiry();
      await user.save({ validateBeforeSave: false });
      await sendOtpEmail(user.email, otp, 'register');

      return apiResponse(res, 403, 'Account not verified. A new OTP has been sent to your email.', {
        email: user.email,
        purpose: 'register',
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = getOtpExpiry();
    await user.save({ validateBeforeSave: false });
    await sendOtpEmail(user.email, otp, 'login');

    return apiResponse(res, 200, 'OTP sent to your registered email.', {
      email: user.email,
      purpose: 'login',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-login-otp
const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return apiResponse(res, 400, 'Email and OTP are required.');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) return apiResponse(res, 404, 'User not found.');
    if (!user.otp || user.otp !== otp) return apiResponse(res, 400, 'Invalid OTP.');
    if (user.otpExpiry < new Date()) return apiResponse(res, 400, 'OTP has expired. Please login again to get a new one.');

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);
    return apiResponse(res, 200, 'Login successful.', { token, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) return apiResponse(res, 400, 'Email and purpose are required.');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return apiResponse(res, 404, 'User not found.');

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = getOtpExpiry();
    await user.save({ validateBeforeSave: false });
    await sendOtpEmail(user.email, otp, purpose);

    return apiResponse(res, 200, 'OTP resent to your email.');
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

module.exports = { register, verifyRegisterOtp, login, verifyLoginOtp, resendOtp, getMe };