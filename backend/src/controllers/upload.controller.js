const { uploadImage } = require('../services/imagekit.service');
const { PrismaClient } = require('@prisma/client');
const requestService = require('../services/request.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Upload profile photo
 * POST /api/upload/profile-photo
 */
async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const result = await uploadImage(
      req.file.buffer,
      `profile-${req.user.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
      '/profiles'
    );

    // Update user profile photo
    await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto: result.url },
    });

    return success(res, { url: result.url }, 'Profile photo uploaded');
  } catch (err) {
    logger.error('Upload profile photo error:', err);
    next(err);
  }
}

/**
 * Upload college ID photo
 * POST /api/upload/college-id
 */
async function uploadCollegeId(req, res, next) {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const result = await uploadImage(
      req.file.buffer,
      `college-id-${req.user.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
      '/college-ids'
    );

    // Update agent college ID photo
    await prisma.agent.update({
      where: { userId: req.user.id },
      data: { collegeIdPhoto: result.url },
    });

    return success(res, { url: result.url }, 'College ID uploaded');
  } catch (err) {
    logger.error('Upload college ID error:', err);
    next(err);
  }
}

/**
 * Upload parcel photo
 * POST /api/upload/parcel-photo/:requestId
 */
async function uploadParcelPhoto(req, res, next) {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const result = await uploadImage(
      req.file.buffer,
      `parcel-${req.params.requestId}-${Date.now()}.${req.file.originalname.split('.').pop()}`,
      '/parcel-photos'
    );

    const io = req.app.get('io');
    const request = await requestService.uploadParcelPhoto(
      req.params.requestId,
      req.user.agent.id,
      result.url,
      result.fileId,
      io
    );

    return success(res, { url: result.url, request }, 'Parcel photo uploaded');
  } catch (err) {
    if (err.message.includes('Not assigned') || err.message.includes('Invalid status')) {
      return error(res, err.message, 400);
    }
    logger.error('Upload parcel photo error:', err);
    next(err);
  }
}

module.exports = { uploadProfilePhoto, uploadCollegeId, uploadParcelPhoto };
