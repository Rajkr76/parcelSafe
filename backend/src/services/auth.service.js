const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const prisma = new PrismaClient();

/**
 * Find or create user from OAuth data
 */
async function findOrCreateUser(email, name, image) {
  let user = await prisma.user.findUnique({
    where: { email },
    include: { agent: true },
  });

  // Check if user should be admin
  const isAdmin = env.ADMIN_EMAILS.includes(email);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        profilePhoto: image,
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        profileCompleted: isAdmin, // Admins don't need onboarding
      },
      include: { agent: true },
    });
  } else if (isAdmin && user.role !== 'ADMIN') {
    // Promote to admin if in admin emails list
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN', profileCompleted: true },
      include: { agent: true },
    });
  }

  return user;
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: { agent: true },
  });
}

/**
 * Update user profile (onboarding)
 */
async function updateProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      profileCompleted: true,
    },
    include: { agent: true },
  });
}

module.exports = { findOrCreateUser, generateToken, getUserById, updateProfile };
