const express = require('express');
const router = express.Router();
const { register, login, getUsers } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../../blockchain/accessControl');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, (req, res) => {
  // Return user info from JWT payload
  const db = require('../config/db');
  db.query('SELECT id, username, role_id FROM users WHERE id = $1', [req.user.userId]).then(result => {
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const roleNames = { 1: 'Administrator', 2: 'Doctor', 3: 'Nurse', 4: 'Pharmacist', 5: 'Data Manager', 6: 'ME Officer' };
    res.json({ user: { id: user.id, username: user.username, role_id: user.role_id }, role_name: roleNames[user.role_id] || 'Unknown' });
  }).catch(e => {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  });
});
router.get('/users', authenticateToken, requirePermission('users.manage'), getUsers);

module.exports = router;
