const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

/**
 * Generate a random 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP using bcrypt
 */
async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify a plain OTP against its hash
 */
async function verifyOtp(plainOtp, hashedOtp) {
  return bcrypt.compare(plainOtp, hashedOtp);
}

/**
 * Get OTP expiry date from now
 */
function getOtpExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + env.OTP_EXPIRY_MINUTES);
  return expiry;
}

module.exports = { generateOtp, hashOtp, verifyOtp, getOtpExpiry };
