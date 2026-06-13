const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth
 */
function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
}

module.exports = { socketAuth };
