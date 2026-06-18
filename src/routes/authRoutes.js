const express = require('express');
const router = express.Router();
const {
  register,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
//const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', upload.single('profileImage'), register);

// POST /api/auth/verify-register-otp
router.post('/verify-register-otp', verifyRegisterOtp);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/verify-login-otp
router.post('/verify-login-otp', verifyLoginOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;