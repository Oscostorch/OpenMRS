import React, { useEffect, useState } from 'react';
import api from '../services/api';

function escapeCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toSafeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

export default function ReportsPage() {
  const [encryptedPatients, setEncryptedPatients] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [diagnosisSummary, setDiagnosisSummary] = useState([]);
  const [diagnosisPatients, setDiagnosisPatients] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [loading, setLoading] = useState(true);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [expandedPatients, setExpandedPatients] = useState({});

  const diagnosisOptions = [
    'Malaria',
    'Typhoid Fever',
    'Diabetes',
    'Hypertension',
    'Pneumonia',
    'Tuberculosis',
    'Asthma',
    'Cholera',
    'HIV/AIDS',
    'Peptic Ulcer'
  ];

  const loadReports = async () => {
    try {
      const [reportPatientsRes, recordsRes, patientsRes, diagnosisSummaryRes] = await Promise.all([
        api.get('/api/reports/encrypted-patients').catch(() => null),
        api.get('/api/reports/all-records').catch(() => null),
        api.get('/api/patients').catch(() => null),
        api.get('/api/reports/diagnosis-summary').catch(() => null),
      ]);

      const reportPatients = reportPatientsRes?.data?.patients || [];
      const allPatients = patientsRes?.data?.patients || [];
      const summary = diagnosisSummaryRes?.data?.diagnoses || [];

      let patientRows = reportPatients;
      let flatRecords = recordsRes?.data?.records || [];
      setDiagnosisSummary(summary);

      if (allPatients.length > 0) {
        const detailedRows = await Promise.all(
          allPatients.map(async (patient) => {
            try {
              const detailRes = await api.get(`/api/patients/${patient.id}`);
              const detail = detailRes.data.patient || {};
              const records = detail.encryptedRecords || [];
              const recordMap = {};

              records.forEach((record) => {
                if (!recordMap[record.record_type]) {
                  recordMap[record.record_type] = {
                    ciphertext: record.ciphertext,
                    algorithm: record.algorithm || 'simulated-he',
                    created_at: record.created_at,
                  };
                }
              });

              return {
                id: patient.id,
                patient_id: patient.patient_id,
                encrypted_record_count: records.length,
                record_types: records.map((record) => record.record_type),
                records,
                algorithm: records.length > 0 ? (records[0].algorithm || 'simulated-he') : null,
                created_at: detail.created_at || patient.created_at,
                first_name: recordMap.first_name || null,
                last_name: recordMap.last_name || null,
                gender: recordMap.gender || null,
                date_of_birth: recordMap.date_of_birth || null,
                national_id: recordMap.national_id || null,
                phone: recordMap.phone || null,
                address: recordMap.address || null,
                blood_group: recordMap.blood_group || null,
                allergies: recordMap.allergies || null,
                diagnosis: recordMap.diagnosis || null,
                prescription: recordMap.prescription || null,
                medical_history: recordMap.medical_history || null,
                doctor_notes: recordMap.doctor_notes || null,
                lab_results: recordMap.lab_results || null,
              };
            } catch {
              return {
                id: patient.id,
                patient_id: patient.patient_id,
                encrypted_record_count: 0,
                record_types: [],
                records: [],
                algorithm: null,
                created_at: patient.created_at,
              };
            }
          })
        );

        if (detailedRows.length > 0) {
          patientRows = detailedRows;
          if (!flatRecords.length) {
            flatRecords = detailedRows.flatMap((patient) =>
              (patient.records || []).map((record, index) => ({
                record_id: record.id || `${patient.id}-${index + 1}`,
                patient_id: patient.patient_id,
                record_type: record.record_type,
                ciphertext: record.ciphertext,
                algorithm: record.algorithm || 'simulated-he',
                created_at: record.created_at,
              }))
            );
          }
        }
      }

      setEncryptedPatients(patientRows);
      setAllRecords(flatRecords);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const refreshDiagnosisSummary = async () => {
    setSummaryRefreshing(true);
    try {
      const res = await api.get('/api/reports/diagnosis-summary');
      setDiagnosisSummary(res.data.diagnoses || []);
    } catch (e) {
      console.error('Failed to refresh diagnosis summary:', e);
    } finally {
      setSummaryRefreshing(false);
    }
  };

  const loadDiagnosisReport = async (label) => {
    if (!label) return;
    setDiagnosisLoading(true);
    setSelectedDiagnosis(label);
    setActiveTab('diagnosis');
    try {
      const res = await api.get('/api/reports/diagnosis', { params: { label } });
      setDiagnosisPatients(res.data.patients || []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load diagnosis report');
      setDiagnosisPatients([]);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const renderEncryptedCell = (field) => {
    if (!field) {
      return <span className="text-muted">-</span>;
    }

    return (
      <div>
        <span className="badge bg-success me-1">ENCRYPTED</span>
        <code className="small" style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>
          {field.ciphertext}
        </code>
      </div>
    );
  };

  const renderRecordTypes = (recordTypes) => {
    if (!Array.isArray(recordTypes) || recordTypes.length === 0) {
      return <span className="text-muted">-</span>;
    }

    return (
      <div className="d-flex flex-wrap gap-1">
        {recordTypes.map((type) => (
          <span key={type} className="badge bg-secondary text-truncate" style={{ maxWidth: '140px' }}>
            {type}
          </span>
        ))}
      </div>
    );
  };

  const renderDiagnosisButton = (label) => {
    const summaryItem = diagnosisSummary.find((item) => item.label === label);
    const count = summaryItem ? summaryItem.count : 0;
    const isActive = selectedDiagnosis === label;

    return (
      <button
        key={label}
        type="button"
        className={`btn ${isActive ? 'btn-primary' : 'btn-outline-primary'} text-start`}
        onClick={() => loadDiagnosisReport(label)}
      >
        <div className="d-flex justify-content-between align-items-center gap-3">
          <span>{label}</span>
          <span className={`badge ${isActive ? 'bg-light text-primary' : 'bg-primary'}`}>{count}</span>
        </div>
      </button>
    );
  };

  const sortedDiagnosisOptions = [...diagnosisOptions].sort((a, b) => {
    const aCount = diagnosisSummary.find((item) => item.label === a)?.count || 0;
    const bCount = diagnosisSummary.find((item) => item.label === b)?.count || 0;
    return bCount - aCount || a.localeCompare(b);
  });

  const togglePatient = (patientId) => {
    setExpandedPatients((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  const renderInlineRecords = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      return <div className="text-muted small">No encrypted records available for this patient.</div>;
    }

    return (
      <div className="mt-2 p-2 rounded border bg-light">
        <div className="small text-muted mb-2">Encrypted record details</div>
        <div className="table-responsive">
          <table className="table table-sm table-bordered mb-0">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ciphertext</th>
                <th>Algorithm</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={`${record.record_type}-${record.created_at}`}>
                  <td>
                    <span className="badge bg-warning text-dark">{record.record_type}</span>
                  </td>
                  <td style={{ maxWidth: '420px' }}>
                    <code className="small" style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>
                      {record.ciphertext}
                    </code>
                  </td>
                  <td>
                    <code>{record.algorithm || 'N/A'}</code>
                  </td>
                  <td className="small">{toSafeDate(record.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const downloadCSV = () => {
    const headers = [
      'ID',
      'Patient ID',
      'First Name',
      'Last Name',
      'Gender',
      'Date of Birth',
      'National ID',
      'Phone',
      'Address',
      'Blood Group',
      'Allergies',
      'Diagnosis',
      'Prescription',
      'Medical History',
      'Doctor Notes',
      'Lab Results',
      'Record Types',
      'Encrypted Record Count',
      'Algorithm',
    ];

    const rows = encryptedPatients.map((p) => [
      p.id,
      p.patient_id,
      p.first_name ? 'ENCRYPTED' : '-',
      p.last_name ? 'ENCRYPTED' : '-',
      p.gender ? 'ENCRYPTED' : '-',
      p.date_of_birth ? 'ENCRYPTED' : '-',
      p.national_id ? 'ENCRYPTED' : '-',
      p.phone ? 'ENCRYPTED' : '-',
      p.address ? 'ENCRYPTED' : '-',
      p.blood_group ? 'ENCRYPTED' : '-',
      p.allergies ? 'ENCRYPTED' : '-',
      p.diagnosis ? 'ENCRYPTED' : '-',
      p.prescription ? 'ENCRYPTED' : '-',
      p.medical_history ? 'ENCRYPTED' : '-',
      p.doctor_notes ? 'ENCRYPTED' : '-',
      p.lab_results ? 'ENCRYPTED' : '-',
      (p.record_types || []).join('; '),
      p.encrypted_record_count,
      p.algorithm || 'N/A',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encrypted-patients-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const data = JSON.stringify(encryptedPatients, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encrypted-patients-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRecordsCSV = () => {
    const headers = ['Record ID', 'Patient ID', 'Record Type', 'Ciphertext', 'Algorithm', 'Created At'];
    const rows = allRecords.map((r) => [
      r.record_id,
      r.patient_id,
      r.record_type,
      r.ciphertext,
      r.algorithm || 'N/A',
      r.created_at,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-encrypted-records-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRecordsJSON = () => {
    const data = JSON.stringify(allRecords, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-encrypted-records-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-muted">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Unified Encrypted Patients Report</h3>
          <p className="text-muted mb-0">
            All patient records are encrypted, and only <strong>Patient ID</strong> is visible in plain text.
            All other fields (first_name, last_name, gender, date_of_birth, national_id, phone,
            address, blood_group, allergies, diagnosis, prescription, medical_history,
            doctor_notes, lab_results) are encrypted.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
            type="button"
          >
            <strong>Patients View</strong>
            <span className="badge bg-secondary ms-2">{encryptedPatients.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
            type="button"
          >
            <strong>Records View</strong>
            <span className="badge bg-secondary ms-2">{allRecords.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'diagnosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnosis')}
            type="button"
          >
            <strong>Diagnosis View</strong>
            <span className="badge bg-secondary ms-2">{diagnosisOptions.length}</span>
          </button>
        </li>
      </ul>

      {activeTab === 'patients' && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="table table-hover table-bordered table-sm">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>ID</th>
                    <th>Patient ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Gender</th>
                    <th>Date of Birth</th>
                    <th>National ID</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Blood Group</th>
                    <th>Allergies</th>
                    <th>Diagnosis</th>
                    <th>Prescription</th>
                    <th>Medical History</th>
                    <th>Doctor Notes</th>
                    <th>Lab Results</th>
                    <th>Record Types</th>
                    <th>Encrypted Records</th>
                    <th>Algorithm</th>
                  </tr>
                </thead>
                <tbody>
                  {encryptedPatients.length > 0 ? (
                    encryptedPatients.map((p) => (
                      <React.Fragment key={p.id}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-semibold"
                              onClick={() => togglePatient(p.id)}
                            >
                              {expandedPatients[p.id] ? 'Hide' : 'Show'}
                            </button>
                            <span className="ms-2">{p.id}</span>
                          </td>
                          <td>
                            <code>{p.patient_id}</code>
                          </td>
                          <td>{renderEncryptedCell(p.first_name)}</td>
                          <td>{renderEncryptedCell(p.last_name)}</td>
                          <td>{renderEncryptedCell(p.gender)}</td>
                          <td>{renderEncryptedCell(p.date_of_birth)}</td>
                          <td>{renderEncryptedCell(p.national_id)}</td>
                          <td>{renderEncryptedCell(p.phone)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.address)}</td>
                          <td>{renderEncryptedCell(p.blood_group)}</td>
                          <td>{renderEncryptedCell(p.allergies)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.diagnosis)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.prescription)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.medical_history)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.doctor_notes)}</td>
                          <td style={{ maxWidth: '150px' }}>{renderEncryptedCell(p.lab_results)}</td>
                          <td style={{ maxWidth: '220px' }}>{renderRecordTypes(p.record_types)}</td>
                          <td>
                            <span className="badge bg-info">{p.encrypted_record_count}</span>
                          </td>
                          <td>
                            <code>{p.algorithm || 'N/A'}</code>
                          </td>
                        </tr>
                        {expandedPatients[p.id] && (
                          <tr>
                            <td colSpan="19">{renderInlineRecords(p.records)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="19" className="text-muted text-center">
                        No patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">All Encrypted Records</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-success btn-sm" onClick={downloadRecordsCSV} disabled={allRecords.length === 0}>
                  Download CSV
                </button>
                <button className="btn btn-primary btn-sm" onClick={downloadRecordsJSON} disabled={allRecords.length === 0}>
                  Download JSON
                </button>
              </div>
            </div>

            <p className="text-muted small mb-3">
              Each row represents a single encrypted field record. Only <strong>Patient ID</strong> is visible in plain text.
              The <code>ciphertext</code> column contains the encrypted value.
            </p>

            <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="table table-hover table-bordered table-sm">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Record ID</th>
                    <th>Patient ID</th>
                    <th>Record Type</th>
                    <th>Ciphertext</th>
                    <th>Algorithm</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecords.length > 0 ? (
                    allRecords.map((r) => (
                      <tr key={r.record_id}>
                        <td>{r.record_id}</td>
                        <td>
                          <code>{r.patient_id}</code>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark">{r.record_type}</span>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <span className="badge bg-success me-1">ENCRYPTED</span>
                          <code className="small" style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>
                            {r.ciphertext}
                          </code>
                        </td>
                        <td>
                          <code>{r.algorithm || 'N/A'}</code>
                        </td>
                        <td className="small">{toSafeDate(r.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-muted text-center">
                        No encrypted records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h5 className="card-title mb-1">Diagnosis Reports</h5>
                <p className="text-muted small mb-0">
                  Click a diagnosis to view all matching patients and their encrypted records.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={refreshDiagnosisSummary}
                disabled={summaryRefreshing}
              >
                {summaryRefreshing ? 'Refreshing...' : 'Refresh Counts'}
              </button>
            </div>

            <div className="row g-2 mb-3">
              {sortedDiagnosisOptions.map((label) => (
                <div className="col-12 col-md-6 col-lg-4" key={label}>
                  {renderDiagnosisButton(label)}
                </div>
              ))}
            </div>

            {diagnosisLoading ? (
              <div className="text-muted">Loading diagnosis report...</div>
            ) : selectedDiagnosis ? (
              <>
                <div className="alert alert-info">
                  Showing encrypted records for patients diagnosed with <strong>{selectedDiagnosis}</strong>.
                </div>
                <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <table className="table table-hover table-bordered table-sm">
                    <thead className="sticky-top bg-white">
                      <tr>
                        <th>Patient ID</th>
                        <th>Encrypted Records</th>
                        <th>Record Types</th>
                        <th>Algorithm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisPatients.length > 0 ? (
                        diagnosisPatients.map((p) => (
                          <React.Fragment key={p.id}>
                            <tr>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-link p-0 text-decoration-none fw-semibold"
                                  onClick={() => togglePatient(p.id)}
                                >
                                  {expandedPatients[p.id] ? 'Hide' : 'Show'}
                                </button>
                                <span className="ms-2"><code>{p.patient_id}</code></span>
                              </td>
                              <td>
                                <span className="badge bg-info">{p.encrypted_record_count}</span>
                              </td>
                              <td style={{ maxWidth: '220px' }}>{renderRecordTypes(p.record_types)}</td>
                              <td>
                                <code>{p.algorithm || 'N/A'}</code>
                              </td>
                            </tr>
                            {expandedPatients[p.id] && (
                              <tr>
                                <td colSpan="4">{renderInlineRecords(p.records)}</td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-muted text-center">
                            No patients found for this diagnosis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-muted">Choose a diagnosis above to see matching patient records.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
