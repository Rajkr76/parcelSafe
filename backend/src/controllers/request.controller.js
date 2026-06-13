const requestService = require('../services/request.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Create a new parcel request
 * POST /api/requests
 */
async function createRequest(req, res, next) {
  try {
    const io = req.app.get('io');
    const result = await requestService.createRequest(req.user.id, req.body, io);

    return success(res, {
      request: result.request,
      otp: result.otp, // Show OTP to student once
    }, 'Request created successfully. Save your OTP for delivery verification.', 201);
  } catch (err) {
    logger.error('Create request error:', err);
    next(err);
  }
}

/**
 * Get requests based on role
 * GET /api/requests
 */
async function getRequests(req, res, next) {
  try {
    const { status, hostel } = req.query;
    let requests;

    if (req.user.role === 'STUDENT') {
      requests = await requestService.getStudentRequests(req.user.id, status);
    } else if (req.user.role === 'AGENT') {
      if (req.query.available === 'true') {
        requests = await requestService.getAvailableRequests(hostel);
      } else {
        requests = await requestService.getAgentRequests(req.user.agent?.id, status);
      }
    }

    return success(res, requests);
  } catch (err) {
    logger.error('Get requests error:', err);
    next(err);
  }
}

/**
 * Get request by ID
 * GET /api/requests/:id
 */
async function getRequest(req, res, next) {
  try {
    const request = await requestService.getRequestById(req.params.id);
    if (!request) return error(res, 'Request not found', 404);

    // Check access
    if (req.user.role === 'STUDENT' && request.studentId !== req.user.id) {
      return error(res, 'Access denied', 403);
    }
    if (req.user.role === 'AGENT' && request.assignment?.agentId !== req.user.agent?.id) {
      // Agents can see available requests too
      if (request.status !== 'REQUEST_CREATED') {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, request);
  } catch (err) {
    logger.error('Get request error:', err);
    next(err);
  }
}

/**
 * Agent accepts a request
 * PATCH /api/requests/:id/accept
 */
async function acceptRequest(req, res, next) {
  try {
    if (!req.user.agent || req.user.agent.status !== 'APPROVED') {
      return error(res, 'Agent not approved', 403);
    }

    const io = req.app.get('io');
    const request = await requestService.acceptRequest(req.params.id, req.user.agent.id, io);

    return success(res, request, 'Request accepted');
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('no longer') || err.message.includes('already')) {
      return error(res, err.message, 400);
    }
    logger.error('Accept request error:', err);
    next(err);
  }
}

/**
 * Student confirms parcel photo
 * PATCH /api/requests/:id/confirm-photo
 */
async function confirmPhoto(req, res, next) {
  try {
    const io = req.app.get('io');
    const request = await requestService.confirmPhoto(req.params.id, req.user.id, io);

    return success(res, request, 'Photo confirmed');
  } catch (err) {
    if (err.message.includes('Not your') || err.message.includes('No photo')) {
      return error(res, err.message, 400);
    }
    logger.error('Confirm photo error:', err);
    next(err);
  }
}

/**
 * Mark request as out for delivery
 * PATCH /api/requests/:id/out-for-delivery
 */
async function outForDelivery(req, res, next) {
  try {
    const io = req.app.get('io');
    const request = await requestService.markOutForDelivery(req.params.id, req.user.agent.id, io);

    return success(res, request, 'Marked as out for delivery');
  } catch (err) {
    if (err.message.includes('Not assigned') || err.message.includes('not confirmed')) {
      return error(res, err.message, 400);
    }
    logger.error('Out for delivery error:', err);
    next(err);
  }
}

/**
 * Verify OTP and complete delivery
 * POST /api/requests/:id/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const io = req.app.get('io');
    const request = await requestService.verifyDeliveryOtp(
      req.params.id,
      req.user.agent.id,
      req.body.otp,
      io
    );

    return success(res, request, 'Delivery verified and completed!');
  } catch (err) {
    if (err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('exceeded')) {
      return error(res, err.message, 400);
    }
    logger.error('Verify OTP error:', err);
    next(err);
  }
}

/**
 * Cancel a request
 * PATCH /api/requests/:id/cancel
 */
async function cancelRequest(req, res, next) {
  try {
    const io = req.app.get('io');
    const request = await requestService.cancelRequest(req.params.id, req.user.id, io);

    return success(res, request, 'Request cancelled');
  } catch (err) {
    if (err.message.includes('Not your') || err.message.includes('Cannot cancel')) {
      return error(res, err.message, 400);
    }
    logger.error('Cancel request error:', err);
    next(err);
  }
}

/**
 * Rate an agent
 * POST /api/requests/:id/rate
 */
async function rateRequest(req, res, next) {
  try {
    const io = req.app.get('io');
    const rating = await requestService.rateAgent(
      req.params.id,
      req.user.id,
      req.body.rating,
      req.body.review,
      io
    );

    return success(res, rating, 'Rating submitted');
  } catch (err) {
    if (err.message.includes('Not your') || err.message.includes('Already rated') || err.message.includes('only rate')) {
      return error(res, err.message, 400);
    }
    logger.error('Rate request error:', err);
    next(err);
  }
}

/**
 * Regenerate OTP for a request
 * POST /api/requests/:id/regenerate-otp
 */
async function regenerateOtp(req, res, next) {
  try {
    const result = await requestService.regenerateOtp(req.params.id, req.user.id);
    return success(res, result, 'OTP regenerated successfully');
  } catch (err) {
    if (err.message.includes('Not your') || err.message.includes('Cannot regenerate')) {
      return error(res, err.message, 400);
    }
    logger.error('Regenerate OTP error:', err);
    next(err);
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  acceptRequest,
  confirmPhoto,
  outForDelivery,
  verifyOtp,
  cancelRequest,
  rateRequest,
  regenerateOtp,
};
