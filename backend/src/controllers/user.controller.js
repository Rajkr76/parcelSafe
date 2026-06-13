const { PrismaClient } = require('@prisma/client');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get current user profile
 * GET /api/users/me
 */
async function getProfile(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    return success(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      registrationNo: user.registrationNo,
      hostel: user.hostel,
      profilePhoto: user.profilePhoto,
      role: user.role,
      profileCompleted: user.profileCompleted,
      agent: user.agent ? {
        id: user.agent.id,
        status: user.agent.status,
        avgRating: user.agent.avgRating,
        totalRatings: user.agent.totalRatings,
        deliveryCount: user.agent.deliveryCount,
        failedCount: user.agent.failedCount,
        collegeIdPhoto: user.agent.collegeIdPhoto,
      } : null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    logger.error('Get profile error:', err);
    next(err);
  }
}

/**
 * Update user profile (onboarding)
 * PATCH /api/users/me/onboarding
 */
async function completeOnboarding(req, res, next) {
  try {
    const { name, registrationNo, hostel, profilePhoto } = req.body;

    // Check if registration number already exists
    if (registrationNo) {
      const existing = await prisma.user.findUnique({
        where: { registrationNo },
      });
      if (existing && existing.id !== req.user.id) {
        return error(res, 'Registration number already in use', 409);
      }
    }

    const user = await authService.updateProfile(req.user.id, {
      name,
      registrationNo,
      hostel,
      profilePhoto,
    });

    return success(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      registrationNo: user.registrationNo,
      hostel: user.hostel,
      profilePhoto: user.profilePhoto,
      role: user.role,
      profileCompleted: user.profileCompleted,
    }, 'Profile updated successfully');
  } catch (err) {
    logger.error('Onboarding error:', err);
    next(err);
  }
}

/**
 * Update user profile
 * PATCH /api/users/me
 */
async function updateProfile(req, res, next) {
  try {
    const { name, hostel, profilePhoto } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(hostel && { hostel }),
        ...(profilePhoto && { profilePhoto }),
      },
    });

    return success(res, user, 'Profile updated');
  } catch (err) {
    logger.error('Update profile error:', err);
    next(err);
  }
}

module.exports = { getProfile, completeOnboarding, updateProfile };
