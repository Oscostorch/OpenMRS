import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, blocks: 0, encrypted: 0, appointments: 0 });
  const [recentEncrypted, setRecentEncrypted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setUser(jwtDecode(token));
      } catch (e) {}
    }

    const load = async () => {
      try {
        const [patientsRes, blocksRes, recentRes] = await Promise.all([
          api.get('/api/patients'),
          api.get('/api/blockchain/blocks'),
          api.get('/api/dashboard/recent-encrypted')
        ]);
        setStats({
          patients: patientsRes.data.patients?.length || 0,
          blocks: blocksRes.data.blocks?.length || 0,
          encrypted: recentRes.data.records?.length || 0,
          appointments: 0,
        });
        setRecentEncrypted(recentRes.data.records || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="container mt-4">
      <div className="hero-panel p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-1">Clinical Dashboard</h3>
            {user && <p className="mb-0 opacity-75">Welcome, <strong>{user.username || 'User'}</strong></p>}
            <p className="mb-0 opacity-75">Secure patient records, encryption, and blockchain trail</p>
          </div>
          <div>
            <Link className="btn btn-light text-primary me-2" to="/patients">Manage Patients</Link>
            <Link className="btn btn-light text-primary" to="/reports">View Full Report</Link>
          </div>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading dashboard...</div> : (
        <>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Total Patients</h6>
                  <h3>{stats.patients}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Encrypted Records</h6>
                  <h3>{stats.encrypted}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Blockchain Blocks</h6>
                  <h3>{stats.blocks}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted">Today's Appointments</h6>
                  <h3>{stats.appointments}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Recent Encrypted Patients</h5>
                <Link className="btn btn-sm btn-outline-primary" to="/reports">View Full Report &rarr;</Link>
              </div>
              {recentEncrypted.length > 0 ? (
                <div className="table-responsive mt-3">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Record Type</th>
                        <th>Algorithm</th>
                        <th>Encrypted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEncrypted.map((rec) => (
                        <tr key={rec.id}>
                          <td>{rec.patient_code}</td>
                          <td><span className="badge bg-info">{rec.record_type}</span></td>
                          <td><code>{rec.algorithm}</code></td>
                          <td>{new Date(rec.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mt-2 mb-0">No encrypted records yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
