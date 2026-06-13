const { PrismaClient } = require('@prisma/client');
const { sendPushNotification } = require('../config/firebase-admin');

const prisma = new PrismaClient();

/**
 * Create a notification and emit via Socket.IO + FCM
 * @param {object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} params.type - e.g., REQUEST_UPDATE, AGENT_UPDATE, SYSTEM
 * @param {object} params.data - Extra payload
 * @param {object} io - Socket.IO server instance
 */
async function createNotification({ userId, title, message, type, data = {} }, io) {
  // Save to database
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data,
    },
  });

  // Emit via Socket.IO (if user is online)
  if (io) {
    io.to(`user:${userId}`).emit('NEW_NOTIFICATION', {
      id: notification.id,
      title,
      message,
      type,
      data,
      createdAt: notification.createdAt,
    });
  }

  // Send push notification via FCM
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });

  if (user?.fcmToken) {
    await sendPushNotification(user.fcmToken, title, message, {
      type,
      notificationId: notification.id,
      ...data,
    });
  }

  return notification;
}

/**
 * Get user's notifications
 */
async function getUserNotifications(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return { notifications, total, unreadCount };
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Save FCM token for a user
 */
async function saveFcmToken(userId, token) {
  return prisma.user.update({
    where: { id: userId },
    data: { fcmToken: token },
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  saveFcmToken,
};
