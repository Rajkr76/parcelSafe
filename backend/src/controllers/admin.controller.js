const { PrismaClient } = require('@prisma/client');
const analyticsService = require('../services/analytics.service');
const auditService = require('../services/audit.service');
const { createNotification } = require('../services/notification.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get admin dashboard stats
 * GET /api/admin/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const stats = await analyticsService.getDashboardStats();
    return success(res, stats);
  } catch (err) {
    logger.error('Admin dashboard error:', err);
    next(err);
  }
}

/**
 * Get all users
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, registrationNo: true,
          hostel: true, profilePhoto: true, role: true, suspended: true,
          profileCompleted: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, { users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('Get users error:', err);
    next(err);
  }
}

/**
 * Get user details
 * GET /api/admin/users/:id
 */
async function getUserDetails(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        agent: true,
        requests: {
          include: {
            assignment: {
              include: {
                agent: {
                  include: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
            timeline: { orderBy: { createdAt: 'asc' } },
            rating: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return error(res, 'User not found', 404);

    return success(res, user);
  } catch (err) {
    logger.error('Get user details error:', err);
    next(err);
  }
}

/**
 * Update user status (suspend/activate)
 * PATCH /api/admin/users/:id
 */
async function updateUserStatus(req, res, next) {
  try {
    const { suspended } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { suspended },
    });

    await auditService.logAction(
      req.user.id,
      suspended ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      req.params.id,
      { userName: user.name, userEmail: user.email }
    );

    return success(res, user, `User ${suspended ? 'suspended' : 'activated'}`);
  } catch (err) {
    logger.error('Update user status error:', err);
    next(err);
  }
}

/**
 * Delete user (soft delete)
 * DELETE /api/admin/users/:id
 */
async function deleteUser(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    await auditService.logAction(req.user.id, 'USER_DELETED', req.params.id, {
      userName: user.name,
      userEmail: user.email,
    });

    return success(res, null, 'User deleted');
  } catch (err) {
    logger.error('Delete user error:', err);
    next(err);
  }
}

/**
 * Get all agents
 * GET /api/admin/agents
 */
async function getAgents(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { registrationNo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, name: true, email: true, registrationNo: true,
              hostel: true, profilePhoto: true, suspended: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.agent.count({ where }),
    ]);

    return success(res, { agents, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('Get agents error:', err);
    next(err);
  }
}

/**
 * Get agent details
 * GET /api/admin/agents/:id
 */
async function getAgentDetails(req, res, next) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        assignments: {
          include: {
            request: {
              include: {
                student: { select: { name: true, hostel: true } },
                timeline: { orderBy: { createdAt: 'asc' } },
                rating: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        ratingsReceived: {
          include: {
            rater: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) return error(res, 'Agent not found', 404);

    return success(res, agent);
  } catch (err) {
    logger.error('Get agent details error:', err);
    next(err);
  }
}

/**
 * Update agent status (approve/reject/suspend)
 * PATCH /api/admin/agents/:id
 */
async function updateAgentStatus(req, res, next) {
  try {
    const { status } = req.body;
    const io = req.app.get('io');

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const actionMap = {
      APPROVED: 'AGENT_APPROVED',
      REJECTED: 'AGENT_REJECTED',
      SUSPENDED: 'AGENT_SUSPENDED',
    };

    await auditService.logAction(req.user.id, actionMap[status], req.params.id, {
      agentName: agent.user.name,
      agentEmail: agent.user.email,
    });

    // Notify agent
    const notifMap = {
      APPROVED: { title: 'Agent Approved', message: 'Your agent registration has been approved! You can now accept delivery requests.' },
      REJECTED: { title: 'Agent Rejected', message: 'Your agent registration has been rejected. Please contact support.' },
      SUSPENDED: { title: 'Agent Suspended', message: 'Your agent account has been suspended.' },
    };

    await createNotification({
      userId: agent.user.id,
      title: notifMap[status].title,
      message: notifMap[status].message,
      type: 'AGENT_UPDATE',
      data: { agentId: agent.id, status },
    }, io);

    if (io) {
      const event = status === 'APPROVED' ? 'AGENT_APPROVED' : 'AGENT_REJECTED';
      io.to(`user:${agent.user.id}`).emit(event, { agentId: agent.id, status });
    }

    return success(res, agent, `Agent ${status.toLowerCase()}`);
  } catch (err) {
    logger.error('Update agent status error:', err);
    next(err);
  }
}

/**
 * Delete agent
 * DELETE /api/admin/agents/:id
 */
async function deleteAgent(req, res, next) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!agent) return error(res, 'Agent not found', 404);

    await prisma.$transaction([
      prisma.agent.delete({ where: { id: req.params.id } }),
      prisma.user.update({
        where: { id: agent.userId },
        data: { role: 'STUDENT' },
      }),
    ]);

    await auditService.logAction(req.user.id, 'AGENT_DELETED', req.params.id, {
      agentName: agent.user.name,
    });

    return success(res, null, 'Agent deleted');
  } catch (err) {
    logger.error('Delete agent error:', err);
    next(err);
  }
}

/**
 * Get all requests (admin)
 * GET /api/admin/requests
 */
async function getAllRequests(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { deletedAt: null };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { parcelName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true } },
          assignment: {
            include: {
              agent: {
                include: {
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.request.count({ where }),
    ]);

    return success(res, { requests, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('Get all requests error:', err);
    next(err);
  }
}

/**
 * Get analytics
 * GET /api/admin/analytics
 */
async function getAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getAnalytics();
    return success(res, analytics);
  } catch (err) {
    logger.error('Get analytics error:', err);
    next(err);
  }
}

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const result = await auditService.getAuditLogs(parseInt(page), parseInt(limit), { action });
    return success(res, result);
  } catch (err) {
    logger.error('Get audit logs error:', err);
    next(err);
  }
}

module.exports = {
  getDashboard,
  getUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getAgents,
  getAgentDetails,
  updateAgentStatus,
  deleteAgent,
  getAllRequests,
  getAnalytics,
  getAuditLogs,
};
