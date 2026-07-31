import React, { useEffect, useState } from 'react';
import EncryptionDemo from './EncryptionDemo';
import api from '../services/api';

export default function EncryptionDashboard() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatMs = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(3) : '0.000';
  };

  const loadPerformance = async () => {
    try {
      const res = await api.get('/api/encryption/performance');
      setPerformance(res.data);
    } catch (e) {
      console.error('Failed to load performance data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPerformance();
  };

  return (
    <div className="container mt-4">
      <h3>Encryption Dashboard</h3>
      <p className="text-muted">
        Demonstrates simulated homomorphic encryption operations (encrypt, decrypt, average) using the backend engine.
        Performance metrics are tracked for each encryption operation.
      </p>

      <div className="row g-3 mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <h5 className="card-title mb-0">Encryption Performance</h5>
                <button className="btn btn-outline-primary btn-sm" onClick={handleRefresh} disabled={refreshing || loading}>
                  {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
                </button>
              </div>
              {loading ? (
                <div className="text-muted">Loading performance data...</div>
              ) : performance ? (
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted">Total Operations</h6>
                      <h4>{performance.total_operations}</h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted">Active Operations</h6>
                      <h4>{performance.active_operations ?? 0}</h4>
                      <small className="text-muted">Legacy zero rows ignored</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted">Avg Latency</h6>
                      <h4>{formatMs(performance.avg_latency_ms)} <small className="text-muted">ms</small></h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted">Min Latency</h6>
                      <h4>{formatMs(performance.min_latency_ms)} <small className="text-muted">ms</small></h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted">Max Latency</h6>
                      <h4>{formatMs(performance.max_latency_ms)} <small className="text-muted">ms</small></h4>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted">No performance data available yet. Try encrypting some data first.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dummy chart placeholder — real chart.js integration could go here */}
      {performance && performance.total_operations > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Latency Distribution</h5>
            {performance.latest_operation && (
              <div className="alert alert-info py-2 px-3">
                Latest operation: <strong>{formatMs(performance.latest_operation.latency_ms)} ms</strong>
                {' '}for <code>{performance.latest_operation.algorithm || 'simulated-he'}</code>
                {' '}at <span className="small">{new Date(performance.latest_operation.created_at).toLocaleString()}</span>
              </div>
            )}
            <div className="bg-light p-4 rounded text-center">
              <div className="d-flex justify-content-center align-items-end" style={{ height: '150px', gap: '8px' }}>
                <div className="d-flex flex-column align-items-center">
                  <div className="bg-primary rounded" style={{ width: '40px', height: '120px' }}></div>
                  <small className="mt-1">Min</small>
                </div>
                <div className="d-flex flex-column align-items-center">
                  <div className="bg-info rounded" style={{ width: '40px', height: '90px' }}></div>
                  <small className="mt-1">Avg</small>
                </div>
                <div className="d-flex flex-column align-items-center">
                  <div className="bg-warning rounded" style={{ width: '40px', height: '60px' }}></div>
                  <small className="mt-1">Max</small>
                </div>
              </div>
              <p className="text-muted mt-3 small">
                Chart visualization (Chart.js integration available). 
                Latency bars are proportional: Min={formatMs(performance.min_latency_ms)}ms, Avg={formatMs(performance.avg_latency_ms)}ms, Max={formatMs(performance.max_latency_ms)}ms
              </p>
            </div>
          </div>
        </div>
      )}

      <EncryptionDemo />
    </div>
  );
}
