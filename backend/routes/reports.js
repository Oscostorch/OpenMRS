const express = require('express');
const router = express.Router();
const { getSummary, getBloodGroup, getEncryptedPatients, getAllRecords, getRecentEncrypted, getDiagnosisSummary, getDiagnosisReport } = require('../controllers/reportsController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

router.get('/summary', authenticateToken, getSummary);
router.get('/blood-group', authenticateToken, getBloodGroup);
router.get('/encrypted-patients', authenticateToken, requirePermission('reports.view'), getEncryptedPatients);
router.get('/all-records', authenticateToken, requirePermission('reports.view'), getAllRecords);
router.get('/diagnosis-summary', authenticateToken, requirePermission('reports.view'), getDiagnosisSummary);
router.get('/diagnosis', authenticateToken, requirePermission('reports.view'), getDiagnosisReport);
router.get('/recent-encrypted', authenticateToken, getRecentEncrypted);

module.exports = router;
