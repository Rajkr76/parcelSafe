const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get dashboard overview stats
 */
async function getDashboardStats() {
  const [
    totalUsers,
    totalAgents,
    pendingApprovals,
    activeRequests,
    completedDeliveries,
    failedDeliveries,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
    prisma.agent.count(),
    prisma.agent.count({ where: { status: 'PENDING' } }),
    prisma.request.count({
      where: {
        status: { in: ['REQUEST_CREATED', 'AGENT_ACCEPTED', 'PARCEL_PHOTO_UPLOADED', 'USER_CONFIRMED', 'OUT_FOR_DELIVERY'] },
        deletedAt: null,
      },
    }),
    prisma.request.count({ where: { status: 'DELIVERED', deletedAt: null } }),
    prisma.request.count({ where: { status: 'FAILED', deletedAt: null } }),
  ]);

  return {
    totalUsers,
    totalAgents,
    pendingApprovals,
    activeRequests,
    completedDeliveries,
    failedDeliveries,
  };
}

/**
 * Get analytics data
 */
async function getAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    requestsToday,
    deliveriesToday,
    avgDeliveryTime,
    hostelStats,
    topAgents,
    totalRequests,
    totalDelivered,
    totalFailed,
  ] = await Promise.all([
    // Requests today
    prisma.request.count({
      where: { createdAt: { gte: today }, deletedAt: null },
    }),
    // Deliveries today
    prisma.request.count({
      where: { status: 'DELIVERED', updatedAt: { gte: today }, deletedAt: null },
    }),
    // Average delivery time (from creation to delivered)
    prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60) as avg_minutes
      FROM requests
      WHERE status = 'DELIVERED' AND "deletedAt" IS NULL
    `,
    // Most active hostel
    prisma.request.groupBy({
      by: ['hostel'],
      _count: { id: true },
      where: { deletedAt: null },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    // Top agents
    prisma.agent.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: { select: { name: true, profilePhoto: true } },
      },
      orderBy: { deliveryCount: 'desc' },
      take: 5,
    }),
    // Total requests
    prisma.request.count({ where: { deletedAt: null } }),
    prisma.request.count({ where: { status: 'DELIVERED', deletedAt: null } }),
    prisma.request.count({ where: { status: 'FAILED', deletedAt: null } }),
  ]);

  const avgMinutes = avgDeliveryTime[0]?.avg_minutes || 0;
  const successRate = totalRequests > 0 ? ((totalDelivered / totalRequests) * 100).toFixed(1) : 0;
  const failureRate = totalRequests > 0 ? ((totalFailed / totalRequests) * 100).toFixed(1) : 0;

  return {
    requestsToday,
    deliveriesToday,
    avgDeliveryTime: Math.round(avgMinutes),
    successRate: parseFloat(successRate),
    failureRate: parseFloat(failureRate),
    mostActiveHostels: hostelStats.map((h) => ({
      hostel: h.hostel,
      count: h._count.id,
    })),
    topAgents: topAgents.map((a) => ({
      name: a.user.name,
      profilePhoto: a.user.profilePhoto,
      deliveryCount: a.deliveryCount,
      avgRating: a.avgRating,
    })),
  };
}

module.exports = { getDashboardStats, getAnalytics };
