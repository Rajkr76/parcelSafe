const express = require('express');
const { getProfile, completeOnboarding, updateProfile } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.patch('/me/onboarding', completeOnboarding);

module.exports = router;
