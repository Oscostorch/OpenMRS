import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [summary, setSummary] = useState(null);

  const loadLogs = async () => {
    try {
      const res = await api.get('/api/audit');
      setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.get('/api/audit/summary');
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error('Failed to load audit summary:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, []);

  const filteredLogs = filter
    ? logs.filter(l =>
        (l.action && l.action.toLowerCase().includes(filter.toLowerCase())) ||
        (l.username && l.username.toLowerCase().includes(filter.toLowerCase())) ||
        (l.status && l.status.toLowerCase().includes(filter.toLowerCase()))
      )
    : logs;

  return (
    <div className="container mt-4">
      <h3>Audit Trail</h3>
      <p className="text-muted">Complete activity history for all patient operations</p>

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Total Events</h6>
                <h3>{summary.total}</h3>
              </div>
            </div>
          </div>
          {Object.entries(summary.byAction || {}).slice(0, 3).map(([action, count]) => (
            <div className="col-md-3" key={action}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">{action}</h6>
                  <h3>{count}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Filter by action, user, or status..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-muted">Loading audit logs...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Patient ID</th>
                <th>Status</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted text-center">No audit logs found</td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={log.id || i}>
                    <td>{log.time ? new Date(log.time).toLocaleString() : '-'}</td>
                    <td>{log.username || `user_${log.user_id}`}</td>
                    <td>{log.role_id ? `Role ${log.role_id}` : '-'}</td>
                    <td>
                      <span className={`badge ${log.action === 'ACCESS_DENIED' ? 'bg-danger' : 'bg-primary'}`}>
                        {log.action || '-'}
                      </span>
                    </td>
                    <td>{log.patient_id ? `#${log.patient_id}` : '-'}</td>
<td>
                      <span className={`badge ${log.status === 'SUCCESS' ? 'bg-success' : log.status === 'FAILED' || log.status === 'DENIED' ? 'bg-danger' : 'bg-secondary'}`}>
                        {log.status || 'N/A'}
                      </span>
                    </td>
                    <td><code>{log.ip_address || '-'}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="mt-3">
          <h6>Recent Actions (last 20)</h6>
          <ol className="list-group list-group-numbered">
            {(summary?.recentActions || []).map((action, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <strong>{action.action}</strong> by <em>{action.username || 'unknown'}</em>
                  <br /><small className="text-muted">{action.time ? new Date(action.time).toLocaleString() : ''}</small>
                </div>
<span className={`badge ${action.status === 'SUCCESS' ? 'bg-success' : action.status === 'FAILED' || action.status === 'DENIED' ? 'bg-danger' : 'bg-secondary'}`}>
                  {action.status || 'N/A'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

