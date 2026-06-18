const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOtpExpiry = () => new Date(Date.now() + 10 * 60 * 1000); // 10 min

module.exports = { generateOtp, getOtpExpiry };