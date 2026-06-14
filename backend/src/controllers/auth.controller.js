const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Sync user from NextAuth session
 * POST /api/auth/sync
 */
async function syncUser(req, res, next) {
  try {
    const { email, name, image } = req.body;

    if(!email?.endsWith("@vitbhopal.ac.in") &&
    !email?.endsWith("@gmail.com")){
  return res.status(403).json({
    message: "Only VIT Bhopal email addresses are allowed",
  });
}
    const user = await authService.findOrCreateUser(email, name, image);
    const token = authService.generateToken(user);

    return success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted,
        profilePhoto: user.profilePhoto,
        hostel: user.hostel,
        registrationNo: user.registrationNo,
        suspended: user.suspended,
        agent: user.agent ? {
          id: user.agent.id,
          status: user.agent.status,
          avgRating: user.agent.avgRating,
          deliveryCount: user.agent.deliveryCount,
        } : null,
      },
    }, 'User synced successfully');
  } catch (err) {
    logger.error('Auth sync error:', err);
    next(err);
  }
}

module.exports = { syncUser };
