const express = require('express');
const { submitProgress, getProgressByTask, approveProgress } = require('../controllers/progress.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.post('/task/:taskId', upload.array('photos', 5), submitProgress);
router.get('/task/:taskId', getProgressByTask);
router.patch('/:id/approve', requireRole('PM'), approveProgress);

module.exports = router;
