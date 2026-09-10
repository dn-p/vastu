const express = require('express');
const { getTasksByProject, getTaskById, createTask } = require('../controllers/tasks.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.post('/project/:projectId', requireRole('PM'), createTask);

module.exports = router;
