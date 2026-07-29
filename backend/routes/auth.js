const express = require('express');
const router = express.Router();
const { register, login, getUsers } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../../blockchain/accessControl');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, requirePermission('users.manage'), getUsers);

module.exports = router;
