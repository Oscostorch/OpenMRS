import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [bloodGroup, setBloodGroup] = useState(null);
  const [ageRange, setAgeRange] = useState(null);
  const [diseases, setDiseases] = useState(null);
  const [prescriptions, setPrescriptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [summaryRes, bgRes, ageRes, disRes, prescRes] = await Promise.all([
          api.get('/api/reports/summary'),
          api.get('/api/reports/blood-group'),
          api.get('/api/reports/age-range'),
          api.get('/api/reports/diseases'),
          api.get('/api/reports/prescriptions')
        ]);
        setSummary(summaryRes.data);
        setBloodGroup(bgRes.data);
        setAgeRange(ageRes.data);
        setDiseases(disRes.data);
        setPrescriptions(prescRes.data);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return <div className="container mt-4"><div className="text-muted">Loading reports...</div></div>;
  }

  const renderSummary = () => (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Total Patients</h6>
              <h3>{summary?.totalPatients || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Encrypted Records</h6>
              <h3>{summary?.totalEncryptedRecords || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Audit Events</h6>
              <h3>{summary?.totalAuditLogs || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Blockchain Blocks</h6>
              <h3>{summary?.totalBlocks || 0}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="alert alert-info">
        <strong>🔒 Privacy Protected:</strong> {summary?.note || 'No patient identities exposed.'}
      </div>
      {summary?.recordTypeBreakdown && (
        <div className="card">
          <div className="card-body">
            <h5>Record Type Breakdown</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead><tr><th>Field</th><th>Count</th></tr></thead>
                <tbody>
                  {Object.entries(summary.recordTypeBreakdown).map(([type, count]) => (
                    <tr key={type}><td>{type}</td><td>{count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBloodGroup = () => (
    <div className="card">
      <div className="card-body">
        <h5>Blood Group Distribution</h5>
        <p className="text-muted">Total Patients: {bloodGroup?.totalPatients || 0}</p>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead><tr><th>Blood Group</th><th>Count</th></tr></thead>
            <tbody>
              {bloodGroup?.bloodGroupDistribution && Object.keys(bloodGroup.bloodGroupDistribution).length > 0 ? (
                Object.entries(bloodGroup.bloodGroupDistribution).map(([group, count]) => (
                  <tr key={group}><td>{group}</td><td>{count}</td></tr>
                ))
              ) : (
                <tr><td colSpan="2" className="text-muted">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="alert alert-success mt-2 mb-0">
          <strong>🔒 {bloodGroup?.privacy || 'PII protected'}</strong> — {bloodGroup?.note || ''}
        </div>
      </div>
    </div>
  );

  const renderAgeRange = () => (
    <div className="card">
      <div className="card-body">
        <h5>Age Range Distribution</h5>
        <p className="text-muted">Total Patients: {ageRange?.totalPatients || 0}</p>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead><tr><th>Age Range</th><th>Count</th></tr></thead>
            <tbody>
              {ageRange?.ageRangeDistribution && Object.keys(ageRange.ageRangeDistribution).length > 0 ? (
                Object.entries(ageRange.ageRangeDistribution).map(([range, count]) => (
                  <tr key={range}><td>{range}</td><td>{count}</td></tr>
                ))
              ) : (
                <tr><td colSpan="2" className="text-muted">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="alert alert-success mt-2 mb-0">
          <strong>🔒 {ageRange?.privacy || 'PII protected'}</strong> — {ageRange?.note || ''}
        </div>
      </div>
    </div>
  );

  const renderDiseases = () => (
    <div className="card">
      <div className="card-body">
        <h5>Disease / Diagnosis Statistics</h5>
        <p className="text-muted">Total Patients: {diseases?.totalPatients || 0}</p>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead><tr><th>Diagnosis</th><th>Count</th></tr></thead>
            <tbody>
              {diseases?.diseaseStatistics && Object.keys(diseases.diseaseStatistics).length > 0 ? (
                Object.entries(diseases.diseaseStatistics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([disease, count]) => (
                    <tr key={disease}><td>{disease}</td><td>{count}</td></tr>
                  ))
              ) : (
                <tr><td colSpan="2" className="text-muted">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="alert alert-success mt-2 mb-0">
          <strong>🔒 {diseases?.privacy || 'PII protected'}</strong> — {diseases?.note || ''}
        </div>
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="card">
      <div className="card-body">
        <h5>Prescription Statistics</h5>
        <p className="text-muted">Total Patients: {prescriptions?.totalPatients || 0}</p>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead><tr><th>Medication</th><th>Count</th></tr></thead>
            <tbody>
              {prescriptions?.prescriptionStatistics && Object.keys(prescriptions.prescriptionStatistics).length > 0 ? (
                Object.entries(prescriptions.prescriptionStatistics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([med, count]) => (
                    <tr key={med}><td>{med}</td><td>{count}</td></tr>
                  ))
              ) : (
                <tr><td colSpan="2" className="text-muted">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="alert alert-success mt-2 mb-0">
          <strong>🔒 {prescriptions?.privacy || 'PII protected'}</strong> — {prescriptions?.note || ''}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <h3>Privacy-Preserving Reports</h3>
      <p className="text-muted">
        Healthcare statistics computed from encrypted data. No patient identities are exposed.
      </p>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'bloodgroup' ? 'active' : ''}`} onClick={() => setActiveTab('bloodgroup')}>Blood Group</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'agerange' ? 'active' : ''}`} onClick={() => setActiveTab('agerange')}>Age Range</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'diseases' ? 'active' : ''}`} onClick={() => setActiveTab('diseases')}>Diseases</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>Prescriptions</button>
        </li>
      </ul>

      {activeTab === 'summary' && renderSummary()}
      {activeTab === 'bloodgroup' && renderBloodGroup()}
      {activeTab === 'agerange' && renderAgeRange()}
      {activeTab === 'diseases' && renderDiseases()}
      {activeTab === 'prescriptions' && renderPrescriptions()}

      <div className="mt-4 p-3 bg-light rounded">
        <h6>🔒 Privacy Guarantee</h6>
        <p className="mb-0 small">
          All reports are generated from encrypted patient records. The system aggregates data 
          without ever exposing individual patient identities such as names, phone numbers, 
          national IDs, or addresses. This demonstrates privacy-preserving analytics for 
          healthcare research.
        </p>
      </div>
    </div>
  );
}

