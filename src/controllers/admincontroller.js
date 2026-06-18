const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { apiResponse } = require('../utils/helpers');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalAccounts = await Account.countDocuments();

    const totalTransactions =
      await Transaction.countDocuments();

    const accounts = await Account.find();

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );

    return apiResponse(
      res,
      200,
      'Admin dashboard data',
      {
        totalUsers,
        totalAccounts,
        totalTransactions,
        totalBalance,
      }
    );
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('accounts');

    return apiResponse(
      res,
      200,
      'Users fetched successfully',
      users
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
};