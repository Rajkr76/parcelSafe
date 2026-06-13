const { PrismaClient } = require('@prisma/client');
const { generateOtp, hashOtp } = require('../utils/otp');

const prisma = new PrismaClient();

/**
 * Generate and store OTP for a request
 */
async function createOtp(requestId) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await prisma.otpVerification.upsert({
    where: { requestId },
    update: {
      otpHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      verified: false,
      attempts: 0,
    },
    create: {
      requestId,
      otpHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return otp;
}

/**
 * Get OTP status for a request (without revealing the actual OTP)
 */
async function getOtpStatus(requestId) {
  const otpRecord = await prisma.otpVerification.findUnique({
    where: { requestId },
  });

  if (!otpRecord) return null;

  return {
    verified: otpRecord.verified,
    expired: new Date() > otpRecord.expiresAt,
    attempts: otpRecord.attempts,
    expiresAt: otpRecord.expiresAt,
  };
}

module.exports = { createOtp, getOtpStatus };
