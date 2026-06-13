const express = require('express');
const ctrl = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { updateAgentStatusSchema, updateUserStatusSchema } = require('../validators/admin.schema');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Users
router.get('/users', ctrl.getUsers);
router.get('/users/:id', ctrl.getUserDetails);
router.patch('/users/:id', validate(updateUserStatusSchema), ctrl.updateUserStatus);
router.delete('/users/:id', ctrl.deleteUser);

// Agents
router.get('/agents', ctrl.getAgents);
router.get('/agents/:id', ctrl.getAgentDetails);
router.patch('/agents/:id', validate(updateAgentStatusSchema), ctrl.updateAgentStatus);
router.delete('/agents/:id', ctrl.deleteAgent);

// Requests
router.get('/requests', ctrl.getAllRequests);

// Analytics
router.get('/analytics', ctrl.getAnalytics);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
