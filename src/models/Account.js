const mongoose = require('mongoose');

const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100000 + Math.random() * 900000).toString();
  return `ACC${timestamp}${random}`;
};

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountNumber: {
      type: String,
      unique: true,
      default: generateAccountNumber,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    accountType: {
      type: String,
      enum: ['savings', 'checking'],
      default: 'savings',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ userId: 1 });

accountSchema.methods.toJSON = function () {
  const account = this.toObject();
  delete account.__v;
  return account;
};

module.exports = mongoose.model('Account', accountSchema);