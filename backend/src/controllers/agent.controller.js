const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Register as an agent
 * POST /api/agents/register
 */
async function registerAgent(req, res, next) {
  try {
    const { name, registrationNo, hostel } = req.body;

    // Check if already an agent
    const existingAgent = await prisma.agent.findUnique({
      where: { userId: req.user.id },
    });

    if (existingAgent) {
      return error(res, 'Already registered as agent', 409);
    }

    // Check registration number uniqueness
    if (registrationNo) {
      const existing = await prisma.user.findUnique({
        where: { registrationNo },
      });
      if (existing && existing.id !== req.user.id) {
        return error(res, 'Registration number already in use', 409);
      }
    }

    // Update user profile and create agent record
    const [user, agent] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          name,
          registrationNo,
          hostel,
          role: 'AGENT',
          profileCompleted: true,
        },
      }),
      prisma.agent.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
        },
      }),
    ]);

    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
      agent: {
        id: agent.id,
        status: agent.status,
      },
    }, 'Agent registration submitted. Awaiting admin approval.', 201);
  } catch (err) {
    logger.error('Agent registration error:', err);
    next(err);
  }
}

/**
 * Get current agent profile
 * GET /api/agents/me
 */
async function getAgentProfile(req, res, next) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true,
            registrationNo: true, hostel: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!agent) {
      return error(res, 'Agent profile not found', 404);
    }

    return success(res, {
      id: agent.id,
      status: agent.status,
      avgRating: agent.avgRating,
      totalRatings: agent.totalRatings,
      deliveryCount: agent.deliveryCount,
      failedCount: agent.failedCount,
      collegeIdPhoto: agent.collegeIdPhoto,
      user: agent.user,
      createdAt: agent.createdAt,
    });
  } catch (err) {
    logger.error('Get agent profile error:', err);
    next(err);
  }
}

/**
 * Update agent college ID photo
 * PATCH /api/agents/me
 */
async function updateAgent(req, res, next) {
  try {
    const { collegeIdPhoto } = req.body;

    const agent = await prisma.agent.update({
      where: { userId: req.user.id },
      data: { collegeIdPhoto },
    });

    return success(res, agent, 'Agent profile updated');
  } catch (err) {
    logger.error('Update agent error:', err);
    next(err);
  }
}

module.exports = { registerAgent, getAgentProfile, updateAgent };
