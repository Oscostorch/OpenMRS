const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query('INSERT INTO users(username, password_hash, role_id) VALUES($1, $2, $3) RETURNING id, username', [username, hashed, role || 2]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Login user
 */
/**
 * List all users
 */
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users', []);
    const users = (result.rows || []).map(u => ({
      id: u.id,
      username: u.username,
      role_id: u.role_id,
      created_at: u.created_at
    }));
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

    if (!username || !password) {
      await db.query(
        'INSERT INTO audit_logs(time, user_id, username, role_id, action, patient_id, status, ip_address, old_hash, new_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [new Date(), null, username || 'unknown', null, 'LOGIN', null, 'FAILED', clientIp, null, null]
      );
      return res.status(400).json({ error: 'Missing fields' });
    }

    const userRes = await db.query('SELECT id, username, password_hash, role_id FROM users WHERE username = $1', [username]);
    const user = userRes.rows[0];

    if (!user) {
      await db.query(
        'INSERT INTO audit_logs(time, user_id, username, role_id, action, patient_id, status, ip_address, old_hash, new_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [new Date(), null, username, null, 'LOGIN', null, 'FAILED', clientIp, null, null]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await db.query(
        'INSERT INTO audit_logs(time, user_id, username, role_id, action, patient_id, status, ip_address, old_hash, new_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [new Date(), user.id, user.username, user.role_id, 'LOGIN', null, 'FAILED', clientIp, null, null]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, roleId: user.role_id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });

    // Log successful login
    await db.query(
      'INSERT INTO audit_logs(time, user_id, username, role_id, action, patient_id, status, ip_address, old_hash, new_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [new Date(), user.id, user.username, user.role_id, 'LOGIN', null, 'SUCCESS', clientIp, null, null]
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
