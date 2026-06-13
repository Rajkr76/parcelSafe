const { z } = require('zod');

const createRequestSchema = z.object({
  parcelName: z.string().min(1, 'Parcel name is required').max(200),
  courierCompany: z.string().min(1, 'Courier company is required').max(100),
  trackingNumber: z.string().max(100).optional().or(z.literal('')),
  hostel: z.string().min(1, 'Hostel is required'),
  rewardAmount: z.number().min(0, 'Reward must be positive').max(10000),
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
});

const rateRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(500).optional().or(z.literal('')),
});

module.exports = { createRequestSchema, verifyOtpSchema, rateRequestSchema };
