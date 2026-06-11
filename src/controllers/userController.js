const User = require('../models/User');
const Account = require('../models/Account');
const { apiResponse } = require('../utils/helpers');

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'accounts',
      select: 'accountNumber balance accountType currency isActive createdAt',
    });

    return apiResponse(res, 200, 'Profile retrieved.', { user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['fullName'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return apiResponse(res, 400, 'No valid fields provided. Allowed: fullName.');
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return apiResponse(res, 200, 'Profile updated successfully.', { user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return apiResponse(res, 400, 'Current and new password are required.');
    }

    if (newPassword.length < 8) {
      return apiResponse(res, 400, 'New password must be at least 8 characters.');
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return apiResponse(res, 401, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    return apiResponse(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

// GET /api/users/admin/all  (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate({ path: 'accounts', select: 'accountNumber balance accountType isActive currency' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return apiResponse(
      res,
      200,
      'Users retrieved.',
      { users },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/users/admin/:id  (Admin only)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'accounts',
      select: 'accountNumber balance accountType isActive currency createdAt',
    });

    if (!user) return apiResponse(res, 404, 'User not found.');

    return apiResponse(res, 200, 'User retrieved.', { user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/admin/:id/status  (Admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return apiResponse(res, 400, '"isActive" must be true or false.');
    }

    const user = await User.findById(req.params.id);
    if (!user) return apiResponse(res, 404, 'User not found.');

    if (user._id.equals(req.user._id)) {
      return apiResponse(res, 400, 'Admins cannot deactivate their own account.');
    }

    user.isActive = isActive;
    await user.save({ validateBeforeSave: false });

    await Account.updateMany({ userId: user._id }, { isActive });

    const action = isActive ? 'reactivated' : 'deactivated';
    return apiResponse(res, 200, `User account has been ${action}.`, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  toggleUserStatus,
};