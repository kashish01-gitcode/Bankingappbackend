const express = require('express');
const router = express.Router();
const {
  getMyAccounts,
  getAccountByNumber,
  createAccount,
  getBalance,
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/accounts
// @desc    Get all accounts for the authenticated user
// @access  Private
router.get('/', getMyAccounts);

// @route   POST /api/accounts
// @desc    Create a new account for the authenticated user
// @access  Private
router.post('/', createAccount);

// @route   GET /api/accounts/:accountNumber
// @desc    Get account by account number
// @access  Private
router.get('/:accountNumber', getAccountByNumber);

// @route   GET /api/accounts/:accountNumber/balance
// @desc    Get account balance
// @access  Private
router.get('/:accountNumber/balance', getBalance);

module.exports = router;
