const express = require('express');
const router = express.Router();
const {
  deposit,
  withdraw,
  transfer,
  getMyTransactions,
  getTransactionById,
  getAllTransactions,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const { transactionLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// @route   POST /api/transactions/deposit
// @desc    Deposit money into an account
// @access  Private
router.post('/deposit', transactionLimiter, deposit);

// @route   POST /api/transactions/withdraw
// @desc    Withdraw money from an account
// @access  Private
router.post('/withdraw', transactionLimiter, withdraw);

// @route   POST /api/transactions/transfer
// @desc    Transfer money between accounts
// @access  Private
router.post('/transfer', transactionLimiter, transfer);

// @route   GET /api/transactions
// @desc    Get paginated transaction history (filterable)
// @access  Private
router.get('/', getMyTransactions);

// @route   GET /api/transactions/admin/all
// @desc    Admin: Get all transactions with pagination & filters
// @access  Private (Admin only)
router.get('/admin/all', authorize('admin'), getAllTransactions);

// @route   GET /api/transactions/:id
// @desc    Get a single transaction by ID
// @access  Private
router.get('/:id', getTransactionById);

module.exports = router;
