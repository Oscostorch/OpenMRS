const express = require('express');
const router = express.Router();
const { getPatients, getPatient, createPatient, updatePatient, deletePatient, decryptPatientField } = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { requirePermission } = require('../../blockchain/accessControl');

router.use(authenticateToken);

router.get('/', authorizeRoles([]), getPatients);
router.post('/', authorizeRoles([]), createPatient);
router.post('/decrypt', requirePermission('patient.decrypt'), decryptPatientField);
router.get('/:id', authorizeRoles([]), getPatient);
router.put('/:id', authorizeRoles([]), updatePatient);
router.delete('/:id', requirePermission('patient.delete'), deletePatient);

module.exports = router;

