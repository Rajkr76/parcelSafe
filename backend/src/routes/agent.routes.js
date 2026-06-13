const express = require('express');
const { registerAgent, getAgentProfile, updateAgent } = require('../controllers/agent.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { agentRegisterSchema } = require('../validators/agent.schema');

const router = express.Router();

router.use(authenticate);

router.post('/register', validate(agentRegisterSchema), registerAgent);
router.get('/me', getAgentProfile);
router.patch('/me', updateAgent);

module.exports = router;
