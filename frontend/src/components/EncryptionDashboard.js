import React, { useState } from 'react';
import EncryptionDemo from './EncryptionDemo';

export default function EncryptionDashboard() {
  const [demoMode, setDemoMode] = useState('standard'); // 'standard' | 'patient'

  return (
    <div className="container mt-4">
      <h3>Encryption Dashboard</h3>
      <p className="text-muted">
        Demonstrates simulated homomorphic encryption operations. All patient data is encrypted 
        before storage — only authorized roles (Admin, Doctor) can decrypt.
      </p>

      <div className="mb-3">
        <div className="btn-group" role="group">
          <button
            className={`btn ${demoMode === 'standard' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDemoMode('standard')}
          >
            Standard Demo
          </button>
          <button
            className={`btn ${demoMode === 'patient' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setDemoMode('patient')}
          >
            Patient Record Demo
          </button>
        </div>
      </div>

      {demoMode === 'standard' ? (
        <EncryptionDemo />
      ) : (
        <PatientEncryptionDemo />
      )}
    </div>
  );
}

/**
 * Patient Record Encryption Demo — shows before/after encryption comparison
 */
function PatientEncryptionDemo() {
  const [patientData, setPatientData] = useState({
    name: 'John Doe',
    age: '45',
    diagnosis: 'Diabetes Type 2',
    prescription: 'Metformin 500mg',
    notes: 'Patient responding well to treatment'
  });

  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const doEncrypt = async () => {
    setLoading(true);
    setMessage('');
    const api = (await import('../services/api')).default;
    const encrypted = {};

    try {
      for (const [field, value] of Object.entries(patientData)) {
        if (value) {
          const res = await api.post('/api/encryption/encrypt', { plaintext: String(value) });
          encrypted[field] = res.data.ciphertext;
        }
      }
      setEncryptedData(encrypted);
      setDecryptedData(null);
      setMessage('✅ All fields encrypted successfully.');
    } catch (error) {
      setMessage('❌ Encryption failed: ' + (error?.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const doDecrypt = async () => {
    if (!encryptedData) return;
    setLoading(true);
    setMessage('');
    const api = (await import('../services/api')).default;
    const decrypted = {};

    try {
      for (const [field, ciphertext] of Object.entries(encryptedData)) {
        const res = await api.post('/api/encryption/decrypt', { ciphertext });
        decrypted[field] = res.data.plaintext;
      }
      setDecryptedData(decrypted);
      setMessage('✅ All fields decrypted successfully.');
    } catch (error) {
      if (error?.response?.status === 403) {
        setMessage('🔒 ACCESS DENIED: You do not have permission to decrypt this patient information.');
      } else {
        setMessage('❌ Decryption failed: ' + (error?.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Patient Record Encryption Demo</h5>
          <p className="text-muted small">
            Enter sample patient data, then click "Encrypt" to see how fields are transformed.
            <br />
            <strong>Note:</strong> Only users with ADMIN or DOCTOR roles can decrypt.
          </p>

          <div className="row">
            <div className="col-md-6">
              <div className="card border-primary">
                <div className="card-header bg-primary text-white">
                  <strong>BEFORE ENCRYPTION (Plaintext)</strong>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <label className="form-label small">Name</label>
                    <input className="form-control form-control-sm" name="name" value={patientData.name} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Age</label>
                    <input className="form-control form-control-sm" name="age" value={patientData.age} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Diagnosis</label>
                    <input className="form-control form-control-sm" name="diagnosis" value={patientData.diagnosis} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Prescription</label>
                    <input className="form-control form-control-sm" name="prescription" value={patientData.prescription} onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Doctor Notes</label>
                    <input className="form-control form-control-sm" name="notes" value={patientData.notes} onChange={handleChange} />
                  </div>
                  <button className="btn btn-primary w-100 mt-2" onClick={doEncrypt} disabled={loading}>
                    {loading ? 'Processing...' : '🔒 Encrypt Data'}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <strong>AFTER ENCRYPTION (Ciphertext)</strong>
                </div>
                <div className="card-body">
                  {encryptedData ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          {Object.entries(encryptedData).map(([field, cipher]) => (
                            <tr key={field}>
                              <td className="text-muted" style={{ width: '100px' }}>{field}</td>
                              <td><code style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>{cipher}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-muted p-3 text-center">
                      No encrypted data yet. Fill in the fields and click "Encrypt Data".
                    </div>
                  )}

                  <button className="btn btn-success w-100 mt-2" onClick={doDecrypt} disabled={loading || !encryptedData}>
                    {loading ? 'Processing...' : '🔓 Decrypt Data'}
                  </button>

                  {decryptedData && (
                    <div className="mt-3 p-2 bg-light rounded">
                      <strong>Decrypted Values:</strong>
                      <div className="table-responsive mt-1">
                        <table className="table table-sm table-borderless mb-0">
                          <tbody>
                            {Object.entries(decryptedData).map(([field, value]) => (
                              <tr key={field}>
                                <td className="text-muted">{field}</td>
                                <td><strong>{String(value)}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!encryptedData && !decryptedData && (
                    <div className="alert alert-info mt-2 mb-0 small">
                      🔒 In production, only ADMIN and DOCTOR roles can decrypt patient information.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`alert ${message.includes('❌') || message.includes('DENIED') ? 'alert-danger' : 'alert-success'} mt-3 mb-0`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

