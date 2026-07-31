import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encryptedRecords, setEncryptedRecords] = useState([]);
  const [decryptedFields, setDecryptedFields] = useState({});
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    national_id: '',
    phone: '',
    address: '',
    blood_group: 'O+',
    allergies: '',
    diagnosis: '',
    prescription: '',
    doctor_notes: '',
    lab_results: '',
    medical_history: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      const res = await api.get('/api/patients');
      setPatients(res.data.patients || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, []);

  const loadPatientDetails = async (id) => {
    try {
      const res = await api.get(`/api/patients/${id}`);
      const patient = res.data.patient;
      setSelectedPatient(patient);
      setEncryptedRecords(patient.encryptedRecords || []);
      setDecryptedFields({});
    } catch (error) {
      console.error('Failed to load patient details:', error);
    }
  };

  const handleDecrypt = async (field) => {
    if (!selectedPatient) return;
    try {
      const res = await api.post('/api/patients/decrypt', {
        patientId: selectedPatient.id,
        field: field
      });
      setDecryptedFields(prev => ({ ...prev, [field]: res.data.plaintext }));
    } catch (error) {
      if (error?.response?.status === 403) {
        setDecryptedFields(prev => ({ ...prev, [field]: '🔒 ACCESS DENIED - Insufficient permissions' }));
      } else {
        setDecryptedFields(prev => ({ ...prev, [field]: 'Decryption failed' }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/patients', form);
      setMessage(`Patient created successfully! ID: ${res.data.patient_id} 🔒 All data encrypted.`);
      setForm({
        first_name: '', last_name: '', gender: 'Male', date_of_birth: '',
        national_id: '', phone: '', address: '', blood_group: 'O+', allergies: '',
        diagnosis: '', prescription: '', doctor_notes: '', lab_results: '', medical_history: ''
      });
      loadPatients();
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Save failed');
    }
  };

  const getRecordTypeLabel = (type) => {
    const labels = {
      first_name: 'First Name', last_name: 'Last Name', gender: 'Gender',
      date_of_birth: 'Date of Birth', national_id: 'National ID', phone: 'Phone',
      address: 'Address', blood_group: 'Blood Group', allergies: 'Allergies',
      diagnosis: 'Diagnosis', prescription: 'Prescription', doctor_notes: 'Doctor Notes',
      lab_results: 'Lab Results', medical_history: 'Medical History'
    };
    return labels[type] || type;
  };

  return (
    <div className="container mt-4">
      <h3>Patient Management</h3>
      {message && <div className="alert alert-info">{message}</div>}
      <div className="row g-4">
        {/* Patient List */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Patient List</h5>
              {loading ? (
                <div className="text-muted">Loading patients...</div>
              ) : (
                <div className="list-group">
                  {patients.length === 0 ? (
                    <div className="list-group-item text-muted">No patients registered</div>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                        onClick={() => loadPatientDetails(patient.id)}
                      >
                        <div>
                          <strong>{patient.patient_id}</strong>
                          <br /><small className="text-muted">🔒 Encrypted</small>
                        </div>
                        <span className="badge bg-success rounded-pill">View</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Patient Details */}
          {selectedPatient && (
            <div className="card mt-3">
              <div className="card-body">
                <h5 className="card-title">
                  Patient: {selectedPatient.patient_id}
                  <span className="ms-2 badge bg-warning text-dark">🔒 Encrypted Data</span>
                </h5>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Ciphertext (click to decrypt)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encryptedRecords.map((rec, i) => (
                        <tr key={i}>
                          <td>{getRecordTypeLabel(rec.record_type)}</td>
                          <td>
                            <code style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                              {rec.ciphertext.substring(0, 40)}...
                            </code>
                            <button
                              className="btn btn-sm btn-outline-primary ms-2"
                              onClick={() => handleDecrypt(rec.record_type)}
                            >
                              🔓 Decrypt
                            </button>
                            {decryptedFields[rec.record_type] && (
                              <div className="mt-1 p-1 bg-light rounded">
                                <strong>Plaintext:</strong> {decryptedFields[rec.record_type]}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Register New Patient</h5>
              <p className="text-muted small">
                Patient ID is generated automatically. All patient data is encrypted before storage.
              </p>
              <form onSubmit={submit}>
                <div className="row">
                  <div className="col-md-6">
                    <input className="form-control mb-2" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} />
                    <input className="form-control mb-2" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} />
                    <select className="form-select mb-2" name="gender" value={form.gender} onChange={handleChange}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <input className="form-control mb-2" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                    <input className="form-control mb-2" name="national_id" placeholder="National ID" value={form.national_id} onChange={handleChange} />
                    <input className="form-control mb-2" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
                    <input className="form-control mb-2" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
                    <input className="form-control mb-2" name="blood_group" placeholder="Blood Group" value={form.blood_group} onChange={handleChange} />
                    <input className="form-control mb-2" name="allergies" placeholder="Allergies" value={form.allergies} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <select className="form-select mb-2" name="diagnosis" value={form.diagnosis} onChange={handleChange}>
                      <option value="">Select Diagnosis</option>
                      <option>Malaria</option>
                      <option>Typhoid Fever</option>
                      <option>Diabetes</option>
                      <option>Hypertension</option>
                      <option>Pneumonia</option>
                      <option>Tuberculosis</option>
                      <option>Asthma</option>
                      <option>Cholera</option>
                      <option>HIV/AIDS</option>
                      <option>Peptic Ulcer</option>
                    </select>
                    <textarea className="form-control mb-2" name="prescription" placeholder="Prescription" rows={2} value={form.prescription} onChange={handleChange} />
                    <textarea className="form-control mb-2" name="doctor_notes" placeholder="Doctor Notes" rows={2} value={form.doctor_notes} onChange={handleChange} />
                    <textarea className="form-control mb-2" name="lab_results" placeholder="Lab Results" rows={2} value={form.lab_results} onChange={handleChange} />
                    <textarea className="form-control mb-2" name="medical_history" placeholder="Medical History" rows={2} value={form.medical_history} onChange={handleChange} />
                  </div>
                </div>
                <button className="btn btn-primary w-100 mt-2">🔒 Register & Encrypt Patient</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

