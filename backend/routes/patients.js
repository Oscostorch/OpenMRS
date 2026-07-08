const express = require('express');
const router = express.Router();
const { getPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', authorizeRoles([]), getPatients);
router.post('/', authorizeRoles([]), createPatient);
router.get('/:id', authorizeRoles([]), getPatient);
router.put('/:id', authorizeRoles([]), updatePatient);
router.delete('/:id', authorizeRoles([1]), deletePatient); // only admin by default

module.exports = router;
