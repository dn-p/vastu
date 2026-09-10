const express = require('express');
const { getProjects, getProjectById, createProject, updateProject } = require('../controllers/projects.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole('PM'), createProject);
router.patch('/:id', requireRole('PM'), updateProject);

module.exports = router;
