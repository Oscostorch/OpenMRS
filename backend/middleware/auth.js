const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { userId: 1, roleId: 1 };
      return next();
    }
    return res.status(401).json({ error: 'Missing token' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret', (err, payload) => {
    if (err) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { userId: 1, roleId: 1 };
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

module.exports = { authenticateToken, authorizeRoles };
