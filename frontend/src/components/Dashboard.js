import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, blocks: 0, encrypted: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [patientsRes, blocksRes] = await Promise.all([
          api.get('/api/patients'),
          api.get('/api/blockchain/blocks')
        ]);
        setStats({
          patients: patientsRes.data.patients?.length || 0,
          blocks: blocksRes.data.blocks?.length || 0,
          encrypted: 0,
          appointments: 0,
        });
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
            <p className="mb-0 opacity-75">Secure patient records, encryption, and blockchain trail</p>
          </div>
          <Link className="btn btn-light text-primary" to="/patients">Manage Patients</Link>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading dashboard...</div> : (
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
      )}
    </div>
  );
}
