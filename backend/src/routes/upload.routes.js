const express = require('express');
const ctrl = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rate-limit');

const router = express.Router();

router.use(authenticate);
router.use(uploadLimiter);

router.post('/profile-photo', upload.single('photo'), ctrl.uploadProfilePhoto);
router.post('/college-id', authorize('AGENT'), upload.single('photo'), ctrl.uploadCollegeId);
router.post('/parcel-photo/:requestId', authorize('AGENT'), upload.single('photo'), ctrl.uploadParcelPhoto);

module.exports = router;
