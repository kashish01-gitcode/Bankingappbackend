const express = require('express');

const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
} = require('../controllers/admincontroller');

const {
  protect,
  authorize,
} = require('../middleware/auth');

router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  getDashboardStats
);

router.get(
  '/users',
  protect,
  authorize('admin'),
  getAllUsers
);

module.exports = router;