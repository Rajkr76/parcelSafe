const express = require('express');
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.patch('/:id/read', ctrl.markAsRead);
router.patch('/read-all', ctrl.markAllAsRead);
router.post('/fcm-token', ctrl.saveFcmToken);

module.exports = router;
