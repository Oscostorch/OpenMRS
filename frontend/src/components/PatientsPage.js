import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient_id: '',
    national_id: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    date_of_birth: '',
    phone: '',
    address: '',
    blood_group: 'O+',
    allergies: '',
    sensitiveFields: {
      diagnosis: '',
      prescription: '',
      doctor_notes: '',
      lab_results: '',
      medical_history: ''
    }
  });
  const [message, setMessage] = useState('');

  const loadPatients = async () => {
    const res = await api.get('/api/patients');
    setPatients(res.data.patients || []);
  };

  useEffect(() => { loadPatients(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('sensitive.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, sensitiveFields: { ...prev.sensitiveFields, [key]: value } }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/patients', form);
      setMessage('Patient saved successfully');
      setForm({
        patient_id: '',
        national_id: '',
        first_name: '',
        last_name: '',
        gender: 'Male',
        date_of_birth: '',
        phone: '',
        address: '',
        blood_group: 'O+',
        allergies: '',
        sensitiveFields: {
          diagnosis: '',
          prescription: '',
          doctor_notes: '',
          lab_results: '',
          medical_history: ''
        }
      });
      loadPatients();
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Save failed');
    }
  };

  return (
    <div className="container mt-4">
      <h3>Patient Management</h3>
      {message && <div className="alert alert-info">{message}</div>}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Patient List</h5>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>DOB</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.first_name} {patient.last_name}</td>
                      <td>{patient.gender}</td>
                      <td>{patient.date_of_birth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Register Patient</h5>
              <form onSubmit={submit}>
                <input className="form-control mb-2" name="patient_id" placeholder="Patient ID" value={form.patient_id} onChange={handleChange} />
                <input className="form-control mb-2" name="national_id" placeholder="National ID" value={form.national_id} onChange={handleChange} />
                <input className="form-control mb-2" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} />
                <input className="form-control mb-2" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} />
                <select className="form-select mb-2" name="gender" value={form.gender} onChange={handleChange}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <input className="form-control mb-2" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                <input className="form-control mb-2" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
                <input className="form-control mb-2" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
                <input className="form-control mb-2" name="blood_group" placeholder="Blood Group" value={form.blood_group} onChange={handleChange} />
                <input className="form-control mb-2" name="allergies" placeholder="Allergy" value={form.allergies} onChange={handleChange} />
                <textarea className="form-control mb-2" name="sensitive.diagnosis" placeholder="Diagnosis" value={form.sensitiveFields.diagnosis} onChange={handleChange} />
                <textarea className="form-control mb-2" name="sensitive.prescription" placeholder="Prescription" value={form.sensitiveFields.prescription} onChange={handleChange} />
                <textarea className="form-control mb-2" name="sensitive.doctor_notes" placeholder="Doctor Notes" value={form.sensitiveFields.doctor_notes} onChange={handleChange} />
                <textarea className="form-control mb-2" name="sensitive.lab_results" placeholder="Lab Results" value={form.sensitiveFields.lab_results} onChange={handleChange} />
                <textarea className="form-control mb-2" name="sensitive.medical_history" placeholder="Medical History" value={form.sensitiveFields.medical_history} onChange={handleChange} />
                <button className="btn btn-primary w-100">Save Patient</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
