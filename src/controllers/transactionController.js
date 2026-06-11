const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { apiResponse, getPagination } = require('../utils/helpers');

// POST /api/transactions/deposit
const deposit = async (req, res, next) => {
  try {
    const { accountNumber, amount, description } = req.body;

    if (!accountNumber || !amount) {
      return apiResponse(res, 400, 'Account number and amount are required.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return apiResponse(res, 400, 'Amount must be a positive number.');
    }

    const account = await Account.findOne({
      accountNumber,
      userId: req.user._id,
    });

    if (!account) {
      return apiResponse(res, 404, 'Account not found or access denied.');
    }

    if (!account.isActive) {
      return apiResponse(res, 403, 'This account is inactive. Contact support.');
    }

    account.balance = parseFloat((account.balance + parsedAmount).toFixed(2));
    await account.save();

    const transaction = await Transaction.create({
      type: 'deposit',
      amount: parsedAmount,
      receiverAccountId: account._id,
      receiverAccountNumber: account.accountNumber,
      balanceAfterTransaction: account.balance,
      description: description || 'Deposit',
      status: 'completed',
    });

    return apiResponse(res, 201, 'Deposit successful.', {
      transaction,
      newBalance: account.balance,
    });
  } catch (error) {
    next(error);
  }
};
// POST /api/transactions/withdraw
const withdraw = async (req, res, next) => {
  try {
    const { accountNumber, amount, description } = req.body;

    if (!accountNumber || !amount) {
      return apiResponse(res, 400, 'Account number and amount are required.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return apiResponse(res, 400, 'Amount must be a positive number.');
    }

    const account = await Account.findOne({
      accountNumber,
      userId: req.user._id,
    });

    if (!account) {
      return apiResponse(res, 404, 'Account not found or access denied.');
    }

    if (!account.isActive) {
      return apiResponse(res, 403, 'This account is inactive. Contact support.');
    }

    if (account.balance < parsedAmount) {
      return apiResponse(res, 422, `Insufficient funds. Available balance: ${account.balance} ${account.currency}`);
    }

    account.balance = parseFloat((account.balance - parsedAmount).toFixed(2));
    await account.save();

    const transaction = await Transaction.create({
      type: 'withdrawal',
      amount: parsedAmount,
      senderAccountId: account._id,
      senderAccountNumber: account.accountNumber,
      balanceAfterTransaction: account.balance,
      description: description || 'Withdrawal',
      status: 'completed',
    });

    return apiResponse(res, 201, 'Withdrawal successful.', {
      transaction,
      newBalance: account.balance,
    });
  } catch (error) {
    next(error);
  }
};
// POST /api/transactions/transfer
const transfer = async (req, res, next) => {
  try {
    const { fromAccountNumber, toAccountNumber, amount, description } = req.body;

    if (!fromAccountNumber || !toAccountNumber || !amount) {
      return apiResponse(res, 400, 'fromAccountNumber, toAccountNumber, and amount are required.');
    }

    if (fromAccountNumber === toAccountNumber) {
      return apiResponse(res, 400, 'Cannot transfer to the same account.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return apiResponse(res, 400, 'Amount must be a positive number.');
    }

    const senderAccount = await Account.findOne({
      accountNumber: fromAccountNumber,
      userId: req.user._id,
    });

    if (!senderAccount) {
      return apiResponse(res, 404, 'Sender account not found or access denied.');
    }

    if (!senderAccount.isActive) {
      return apiResponse(res, 403, 'Sender account is inactive.');
    }

    if (senderAccount.balance < parsedAmount) {
      return apiResponse(res, 422, `Insufficient funds. Available balance: ${senderAccount.balance} ${senderAccount.currency}`);
    }

    const receiverAccount = await Account.findOne({
      accountNumber: toAccountNumber,
      isActive: true,
    });

    if (!receiverAccount) {
      return apiResponse(res, 404, 'Receiver account not found or is inactive.');
    }

    senderAccount.balance = parseFloat((senderAccount.balance - parsedAmount).toFixed(2));
    receiverAccount.balance = parseFloat((receiverAccount.balance + parsedAmount).toFixed(2));

    await senderAccount.save();
    await receiverAccount.save();

    const transaction = await Transaction.create({
      type: 'transfer',
      amount: parsedAmount,
      senderAccountId: senderAccount._id,
      senderAccountNumber: senderAccount.accountNumber,
      receiverAccountId: receiverAccount._id,
      receiverAccountNumber: receiverAccount.accountNumber,
      balanceAfterTransaction: senderAccount.balance,
      description: description || 'Transfer',
      status: 'completed',
    });

    return apiResponse(res, 201, 'Transfer successful.', {
      transaction,
      senderNewBalance: senderAccount.balance,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions
const getMyTransactions = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).select('_id accountNumber');
    if (!accounts.length) {
      return apiResponse(res, 200, 'No transactions found.', { transactions: [] });
    }

    const accountIds = accounts.map((a) => a._id);

    const filter = {
      $or: [
        { senderAccountId: { $in: accountIds } },
        { receiverAccountId: { $in: accountIds } },
      ],
    };

    if (req.query.type && ['deposit', 'withdrawal', 'transfer'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    if (req.query.status) filter.status = req.query.status;

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const { page, limit, skip } = getPagination(req.query);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return apiResponse(
      res,
      200,
      'Transactions retrieved.',
      { transactions },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).select('_id');
    const accountIds = accounts.map((a) => a._id);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [
        { senderAccountId: { $in: accountIds } },
        { receiverAccountId: { $in: accountIds } },
      ],
    });

    if (!transaction) {
      return apiResponse(res, 404, 'Transaction not found or access denied.');
    }

    return apiResponse(res, 200, 'Transaction retrieved.', { transaction });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/admin/all  (Admin only)
const getAllTransactions = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.type && ['deposit', 'withdrawal', 'transfer'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    if (req.query.status) filter.status = req.query.status;

    if (req.query.accountNumber) {
      filter.$or = [
        { senderAccountNumber: req.query.accountNumber },
        { receiverAccountNumber: req.query.accountNumber },
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const { page, limit, skip } = getPagination(req.query);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return apiResponse(
      res,
      200,
      'All transactions retrieved.',
      { transactions },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deposit,
  withdraw,
  transfer,
  getMyTransactions,
  getTransactionById,
  getAllTransactions,
};