const ImageKit = require('imagekit');
const env = require('../config/env');

let imagekit = null;

function getImageKit() {
  if (!imagekit) {
    if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY) {
      console.warn('⚠ ImageKit credentials not configured. Uploads will fail.');
      return null;
    }
    imagekit = new ImageKit({
      publicKey: env.IMAGEKIT_PUBLIC_KEY,
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    });
    console.log('✓ ImageKit initialized');
  }
  return imagekit;
}

/**
 * Upload file buffer to ImageKit
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} folder - e.g., '/profiles', '/college-ids', '/parcel-photos'
 */
async function uploadImage(fileBuffer, fileName, folder = '/') {
  const ik = getImageKit();
  if (!ik) {
    throw new Error('ImageKit not configured');
  }

  const result = await ik.upload({
    file: fileBuffer,
    fileName,
    folder,
    tags: ['parcelsafe'],
  });

  return {
    url: result.url,
    fileId: result.fileId,
    thumbnailUrl: result.thumbnailUrl,
  };
}

/**
 * Delete file from ImageKit
 */
async function deleteImage(fileId) {
  const ik = getImageKit();
  if (!ik || !fileId) return;

  try {
    await ik.deleteFile(fileId);
  } catch (error) {
    console.error('ImageKit delete error:', error.message);
  }
}

module.exports = { uploadImage, deleteImage };
