const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    senderAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    receiverAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    senderAccountNumber: {
      type: String,
      default: null,
    },
    receiverAccountNumber: {
      type: String,
      default: null,
    },
    balanceAfterTransaction: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must not exceed 200 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
transactionSchema.index({ senderAccountId: 1, createdAt: -1 });
transactionSchema.index({ receiverAccountId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

transactionSchema.methods.toJSON = function () {
  const tx = this.toObject();
  delete tx.__v;
  return tx;
};

module.exports = mongoose.model('Transaction', transactionSchema);