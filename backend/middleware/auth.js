const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 1, roleId: 1, username: 'admin' };
      return next();
    }
    return res.status(401).json({ error: 'Missing token' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret', (err, payload) => {
    if (err) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { userId: 1, roleId: 1, username: 'admin' };
        return next();
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = payload;
    next();
  });
};

const authorizeRoles = (allowed = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (allowed.length === 0) return next();
  // roleId numeric comparison; adapt to your roles mapping
  if (allowed.includes(req.user.roleId)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

/**
 * Require a specific permission code for the current user's role.
 * Checks the role_permissions and permissions tables.
 */
const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    if (!req.user) {
      // Non-production: allow all
      if (process.env.NODE_ENV !== 'production') return next();
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      const result = await db.query(
        'SELECT p.code FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1',
        [req.user.roleId]
      );
      const codes = (result.rows || []).map(r => r.code);
      if (codes.includes(permissionCode)) return next();
      return res.status(403).json({ error: 'Forbidden: missing permission ' + permissionCode });
    } catch (e) {
      console.error('Permission check failed:', e.message);
      // Non-production: allow all
      if (process.env.NODE_ENV !== 'production') return next();
      return res.status(403).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = { authenticateToken, authorizeRoles, requirePermission };
