const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  toggleUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get authenticated user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PATCH /api/users/profile
// @desc    Update authenticated user profile
// @access  Private
router.patch('/profile', updateProfile);

// @route   PATCH /api/users/change-password
// @desc    Change authenticated user password
// @access  Private
router.patch('/change-password', changePassword);

// ── Admin routes ───────────────────────────────

// @route   GET /api/users/admin/all
// @desc    Admin: Get all users with balances
// @access  Private (Admin only)
router.get('/admin/all', authorize('admin'), getAllUsers);

// @route   GET /api/users/admin/:id
// @desc    Admin: Get user by ID
// @access  Private (Admin only)
router.get('/admin/:id', authorize('admin'), getUserById);

// @route   PATCH /api/users/admin/:id/status
// @desc    Admin: Activate or deactivate a user account
// @access  Private (Admin only)
router.patch('/admin/:id/status', authorize('admin'), toggleUserStatus);

module.exports = router;
