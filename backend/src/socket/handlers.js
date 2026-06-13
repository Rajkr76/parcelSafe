const logger = require('../utils/logger');

/**
 * Handle socket connection events
 */
function handleConnection(socket) {
  const userId = socket.userId;
  logger.info(`Socket connected: ${userId}`);

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join role-based room
  socket.join(`role:${socket.userRole}`);

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${userId} (${reason})`);
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for ${userId}:`, error);
  });
}

module.exports = { handleConnection };
