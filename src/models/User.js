const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name must not exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    profileImage: {
  type: String,
  default: ''
      },

    aadharNumber: {
      type: String,
      required: [true, 'Aadhar number is required'],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v);
        },
        message: 'Aadhar number must be exactly 12 digits',
      },
    },

    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either user or admin',
      },
      default: 'user',
    },

    isVerified: {
  type: Boolean,
  default: false,
},

otp: {
  type: String,
  select: false,
},

otpExpiry: {
  type: Date,
  select: false,
},

    branchName: {
      type: String,
      default: 'Indore Main Branch',
    },

    ifscCode: {
      type: String,
      default: 'SBIN0001234',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('accounts', {
  ref: 'Account',
  localField: '_id',
  foreignField: 'userId',
});

userSchema.index({ email: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const saltRounds =
    parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

  this.password = await bcrypt.hash(
    this.password,
    saltRounds
  );
});

userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return await bcrypt.compare(
    candidatePassword,
    this.password
  );
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);