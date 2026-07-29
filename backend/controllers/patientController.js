const db = require('../config/db');
const enc = require('../../encryption/engine');
const chain = require('../../blockchain/chain');

/**
 * Log an audit trail entry for any patient operation.
 */
async function logAudit({ userId, username, roleId, action, patientId, status = 'SUCCESS', ipAddress = '', oldValue = '', newValue = '' }) {
  try {
    const oldHash = db.computeHash ? db.computeHash(String(oldValue || '')) : null;
    const newHash = db.computeHash ? db.computeHash(String(newValue || '')) : null;

    await db.query(
      `INSERT INTO audit_logs(time, user_id, username, role_id, action, patient_id, status, ip_address, old_hash, new_hash) 
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [new Date(), userId || null, username || 'unknown', roleId || null, action, patientId || null, status, ipAddress, oldHash, newHash]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

/**
 * Encrypts all sensitive patient fields.
 */
async function encryptPatientFields(patientData) {
  const sensitiveFields = {
    first_name: patientData.first_name,
    last_name: patientData.last_name,
    gender: patientData.gender,
    date_of_birth: patientData.date_of_birth,
    national_id: patientData.national_id,
    phone: patientData.phone,
    address: patientData.address,
    blood_group: patientData.blood_group,
    allergies: patientData.allergies,
    diagnosis: patientData.diagnosis,
    prescription: patientData.prescription,
    medical_history: patientData.medical_history,
    doctor_notes: patientData.doctor_notes,
    lab_results: patientData.lab_results,
  };

  const encryptedFields = [];
  const algorithm = 'simulated-he';
  const keyRef = `key-${Date.now()}`;

  for (const [field, value] of Object.entries(sensitiveFields)) {
    if (value !== undefined && value !== null && value !== '') {
      const encResult = await enc.encrypt(String(value));
      encryptedFields.push({
        record_type: field,
        ciphertext: encResult.ciphertext,
        algorithm,
        key_reference: keyRef,
        meta: { timeMs: encResult.timeMs }
      });
    }
  }

  return encryptedFields;
}

/**
 * Get list of patients (only patient_id visible)
 */
exports.getPatients = async (req, res) => {
  try {
    const result = await db.query('SELECT id, patient_id FROM patients ORDER BY id DESC LIMIT 100', []);
    const patients = result.rows || [];

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'VIEW',
      patientId: null,
      ipAddress: req.ip
    });

    res.json({ patients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get a single patient by ID with encrypted fields
 */
exports.getPatient = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    const patient = result.rows[0];
    if (!patient) return res.status(404).json({ error: 'Not found' });

    const encResult = await db.query('SELECT * FROM encrypted_records WHERE patient_id = $1', [id]);
    const encryptedRecords = encResult.rows || [];

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'VIEW',
      patientId: id,
      ipAddress: req.ip
    });

    res.json({
      patient: {
        id: patient.id,
        patient_id: patient.patient_id,
        encryptedRecords: encryptedRecords.map(r => ({
          record_type: r.record_type,
          ciphertext: r.ciphertext,
          algorithm: r.algorithm || 'simulated-he',
          created_at: r.created_at
        }))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Create a new patient with auto-generated ID and full encryption
 */
exports.createPatient = async (req, res) => {
  try {
    const patientId = db.generatePatientId ? db.generatePatientId() : `PT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const insertResult = await db.query(
      'INSERT INTO patients(patient_id) VALUES($1) RETURNING id',
      [patientId]
    );
    const pid = insertResult.rows[0].id;

    const encryptedFields = await encryptPatientFields(req.body);

    for (const field of encryptedFields) {
      await db.query(
        'INSERT INTO encrypted_records(patient_id, record_type, ciphertext, algorithm, key_reference, meta) VALUES($1, $2, $3, $4, $5, $6)',
        [pid, field.record_type, field.ciphertext, field.algorithm, field.key_reference, field.meta]
      );
    }

    try {
      await chain.addTransaction({
        tx_type: 'Patient Registration',
        user_id: req.user?.userId,
        patient_id: pid,
        payload: {
          patientId: patientId,
          action: 'CREATE',
          encryptedData: encryptedFields.reduce((acc, f) => {
            acc[f.record_type] = f.ciphertext;
            return acc;
          }, {}),
          performedBy: req.user?.username || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Blockchain add tx failed', e.message);
    }

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'CREATE',
      patientId: pid,
      ipAddress: req.ip,
      newValue: patientId
    });

    res.json({
      id: pid,
      patient_id: patientId,
      encrypted: encryptedFields.map(f => ({ field: f.record_type, timeMs: f.meta.timeMs })),
      message: 'Patient created successfully. All sensitive data is encrypted.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update a patient
 */
exports.updatePatient = async (req, res) => {
  try {
    const id = req.params.id;
    const fields = req.body;

    const existingResult = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    const existingPatient = existingResult.rows[0];
    if (!existingPatient) return res.status(404).json({ error: 'Not found' });

    const encryptedFields = await encryptPatientFields(fields);

    for (const field of encryptedFields) {
      await db.query(
        'INSERT INTO encrypted_records(patient_id, record_type, ciphertext, algorithm, key_reference, meta) VALUES($1, $2, $3, $4, $5, $6)',
        [id, field.record_type, field.ciphertext, field.algorithm, field.key_reference, field.meta]
      );
    }

    try {
      await chain.addTransaction({
        tx_type: 'Patient Update',
        user_id: req.user?.userId,
        patient_id: id,
        payload: {
          patientId: existingPatient.patient_id,
          action: 'UPDATE',
          encryptedData: encryptedFields.reduce((acc, f) => {
            acc[f.record_type] = f.ciphertext;
            return acc;
          }, {}),
          performedBy: req.user?.username || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Blockchain add tx failed', e.message);
    }

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'UPDATE',
      patientId: id,
      ipAddress: req.ip,
      oldValue: existingPatient.patient_id,
      newValue: JSON.stringify(encryptedFields.map(f => f.record_type))
    });

    res.json({
      success: true,
      encrypted: encryptedFields.map(f => ({ field: f.record_type })),
      message: 'Patient updated. All new data is encrypted.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete a patient
 */
exports.deletePatient = async (req, res) => {
  try {
    const id = req.params.id;
    const existingResult = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    const existingPatient = existingResult.rows[0];
    if (!existingPatient) return res.status(404).json({ error: 'Not found' });

    await db.query('DELETE FROM patients WHERE id = $1', [id]);

    try {
      await chain.addTransaction({
        tx_type: 'Patient Deletion',
        user_id: req.user?.userId,
        patient_id: id,
        payload: {
          patientId: existingPatient.patient_id,
          action: 'DELETE',
          performedBy: req.user?.username || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Blockchain add tx failed', e.message);
    }

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'DELETE',
      patientId: id,
      ipAddress: req.ip,
      oldValue: existingPatient.patient_id
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Decrypt a patient's specific field
 */
exports.decryptPatientField = async (req, res) => {
  try {
    const { patientId, field } = req.body;
    if (!patientId || !field) {
      return res.status(400).json({ error: 'patientId and field are required' });
    }

    const encResult = await db.query(
      'SELECT * FROM encrypted_records WHERE patient_id = $1 AND record_type = $2 ORDER BY created_at DESC LIMIT 1',
      [patientId, field]
    );
    const record = encResult.rows[0];
    if (!record) return res.status(404).json({ error: 'Encrypted record not found' });

    const decrypted = await enc.decrypt(record.ciphertext);

    await logAudit({
      userId: req.user?.userId,
      username: req.user?.username,
      roleId: req.user?.roleId,
      action: 'DECRYPT',
      patientId: patientId,
      ipAddress: req.ip
    });

    res.json({
      field,
      plaintext: decrypted.plaintext,
      timeMs: decrypted.timeMs,
      algorithm: record.algorithm || 'simulated-he'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

