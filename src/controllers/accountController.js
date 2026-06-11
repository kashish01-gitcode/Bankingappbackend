const Account = require('../models/Account');
const { apiResponse } = require('../utils/helpers');

// GET /api/accounts
const getMyAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: -1 });

    if (!accounts.length) {
      return apiResponse(res, 404, 'No accounts found for this user.');
    }

    return apiResponse(res, 200, 'Accounts retrieved.', { accounts });
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:accountNumber
const getAccountByNumber = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
      userId: req.user._id,
    });

    if (!account) {
      return apiResponse(res, 404, 'Account not found or access denied.');
    }

    return apiResponse(res, 200, 'Account retrieved.', { account });
  } catch (error) {
    next(error);
  }
};

// POST /api/accounts
const createAccount = async (req, res, next) => {
  try {
    const { accountType, currency } = req.body;

    const account = await Account.create({
      userId: req.user._id,
      accountType: accountType || 'savings',
      currency: currency || 'INR',
    });

    return apiResponse(res, 201, 'Account created successfully.', { account });
  } catch (error) {
    next(error);
  }
};

// GET /api/accounts/:accountNumber/balance
const getBalance = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber,
      userId: req.user._id,
    }).select('accountNumber balance currency accountType isActive');

    if (!account) {
      return apiResponse(res, 404, 'Account not found or access denied.');
    }

    return apiResponse(res, 200, 'Balance retrieved.', {
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
      accountType: account.accountType,
      isActive: account.isActive,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyAccounts, getAccountByNumber, createAccount, getBalance };