const db = require('../config/db');

/**
 * Get audit logs with optional filters
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 200, action, patient_id, user_id } = req.query;
    let sql = 'SELECT * FROM audit_logs ORDER BY time DESC LIMIT $1';
    const params = [Number(limit) || 200];

    // For in-memory mode, the handler already sorts and limits
    const result = await db.query(sql, params);
    let logs = result.rows || [];

    // Apply optional filters in-memory (since in-memory mode doesn't support WHERE clauses extensively)
    if (action) {
      logs = logs.filter(l => l.action && l.action.toUpperCase() === action.toUpperCase());
    }
    if (patient_id) {
      const pid = Number(patient_id);
      logs = logs.filter(l => l.patient_id === pid);
    }
    if (user_id) {
      const uid = Number(user_id);
      logs = logs.filter(l => l.user_id === uid);
    }

    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get audit log summary (counts by action type)
 */
exports.getAuditSummary = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM audit_logs ORDER BY time DESC LIMIT 1000', []);
    const logs = result.rows || [];

    const summary = {
      total: logs.length,
      byAction: {},
      byRole: {},
      recentActions: logs.slice(0, 20).map(l => ({
        time: l.time,
        username: l.username,
        action: l.action,
        status: l.status
      }))
    };

    for (const log of logs) {
      const action = log.action || 'UNKNOWN';
      summary.byAction[action] = (summary.byAction[action] || 0) + 1;

      const role = log.role_id ? `role_${log.role_id}` : 'unknown';
      summary.byRole[role] = (summary.byRole[role] || 0) + 1;
    }

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

