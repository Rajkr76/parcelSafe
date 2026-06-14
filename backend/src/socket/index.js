const { Server } = require('socket.io');
const { socketAuth } = require('./auth');
const { handleConnection } = require('./handlers');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Initialize Socket.IO server
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL?.replace(/\/+$/, ''), 'http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  io.use(socketAuth);

  // Connection handler
  io.on('connection', handleConnection);

  logger.info('✓ Socket.IO initialized');
  return io;
}

module.exports = { initializeSocket };
