const express = require('express');
const ctrl = require('../controllers/request.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createRequestSchema, verifyOtpSchema, rateRequestSchema } = require('../validators/request.schema');

const router = express.Router();

router.use(authenticate);

// Student creates request
router.post('/', authorize('STUDENT'), validate(createRequestSchema), ctrl.createRequest);

// Get requests (role-aware)
router.get('/', ctrl.getRequests);

// Get request by ID
router.get('/:id', ctrl.getRequest);

// Agent accepts request
router.patch('/:id/accept', authorize('AGENT'), ctrl.acceptRequest);

// Student confirms photo
router.patch('/:id/confirm-photo', authorize('STUDENT'), ctrl.confirmPhoto);

// Agent marks out for delivery
router.patch('/:id/out-for-delivery', authorize('AGENT'), ctrl.outForDelivery);

// Agent verifies OTP
router.post('/:id/verify-otp', authorize('AGENT'), validate(verifyOtpSchema), ctrl.verifyOtp);

// Student cancels request
router.patch('/:id/cancel', authorize('STUDENT'), ctrl.cancelRequest);

// Student regenerates OTP
router.post('/:id/regenerate-otp', authorize('STUDENT'), ctrl.regenerateOtp);

// Student rates agent
router.post('/:id/rate', authorize('STUDENT'), validate(rateRequestSchema), ctrl.rateRequest);

module.exports = router;
