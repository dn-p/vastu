const express = require('express');
const { getMaterials, createMaterial } = require('../controllers/materials.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getMaterials);
router.post('/', requireRole('PM', 'ADMIN_LOGISTIK'), createMaterial);

module.exports = router;
