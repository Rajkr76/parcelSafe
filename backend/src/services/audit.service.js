const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Log an admin action
 */
async function logAction(adminId, action, target, details = null) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      target,
      details,
    },
  });
}

/**
 * Get audit logs with pagination
 */
async function getAuditLogs(page = 1, limit = 50, filters = {}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.adminId) {
    where.adminId = filters.adminId;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

module.exports = { logAction, getAuditLogs };
