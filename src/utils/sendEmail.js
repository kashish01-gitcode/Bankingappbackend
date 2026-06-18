const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp, purpose) => {
  const subject =
    purpose === 'register'
      ? 'Verify your Banking App account'
      : 'Your Banking App login OTP';

  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>🏦 Banking App</h2>
      <p>${purpose === 'register' ? 'Use this OTP to verify your account:' : 'Use this OTP to complete your login:'}</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes. If you did not request this, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Banking App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendOtpEmail;