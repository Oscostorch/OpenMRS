const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditSummary } = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../../blockchain/accessControl');

// All audit routes require authentication + audit.view permission
router.use(authenticateToken);

router.get('/', requirePermission('audit.view'), getAuditLogs);
router.get('/summary', requirePermission('audit.view'), getAuditSummary);

module.exports = router;

