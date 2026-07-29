const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../../blockchain/accessControl');
const {
  getBloodGroupDistribution,
  getAgeRangeDistribution,
  getDiseaseStatistics,
  getPrescriptionStatistics,
  getSummary
} = require('../controllers/reportsController');

// All report routes require authentication + reports.view permission
router.use(authenticateToken);

router.get('/blood-group', requirePermission('reports.view'), getBloodGroupDistribution);
router.get('/age-range', requirePermission('reports.view'), getAgeRangeDistribution);
router.get('/diseases', requirePermission('reports.view'), getDiseaseStatistics);
router.get('/prescriptions', requirePermission('reports.view'), getPrescriptionStatistics);
router.get('/summary', requirePermission('reports.view'), getSummary);

module.exports = router;

