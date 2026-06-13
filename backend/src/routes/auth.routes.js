const express = require('express');
const { syncUser } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { syncSchema } = require('../validators/auth.schema');
const { authLimiter } = require('../middleware/rate-limit');

const router = express.Router();

router.post('/sync', authLimiter, validate(syncSchema), syncUser);

module.exports = router;
