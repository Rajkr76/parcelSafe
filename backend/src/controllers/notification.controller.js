const notificationService = require('../services/notification.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get user notifications
 * GET /api/notifications
 */
async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    logger.error('Get notifications error:', err);
    next(err);
  }
}

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, null, 'Notification marked as read');
  } catch (err) {
    logger.error('Mark as read error:', err);
    next(err);
  }
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    logger.error('Mark all as read error:', err);
    next(err);
  }
}

/**
 * Save FCM token
 * POST /api/notifications/fcm-token
 */
async function saveFcmToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return error(res, 'Token is required', 400);

    await notificationService.saveFcmToken(req.user.id, token);
    return success(res, null, 'FCM token saved');
  } catch (err) {
    logger.error('Save FCM token error:', err);
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, saveFcmToken };
