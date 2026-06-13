const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const env = require('../config/env');

const prisma = new PrismaClient();

/**
 * Authenticate requests by verifying JWT token from Authorization header.
 * Attaches user object to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { agent: true },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.suspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
}

module.exports = { authenticate };
