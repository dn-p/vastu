const express = require('express');
const { 
  getInventoryByProject, 
  addMaterialToProject, 
  logMaterial, 
  getMaterialLogs 
} = require('../controllers/inventory.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/project/:projectId', getInventoryByProject);
router.post('/project/:projectId', requireRole('PM', 'ADMIN_LOGISTIK'), addMaterialToProject);
router.post('/:inventoryId/log', requireRole('ADMIN_LOGISTIK', 'MANDOR'), logMaterial);
router.get('/:inventoryId/logs', getMaterialLogs);

module.exports = router;
