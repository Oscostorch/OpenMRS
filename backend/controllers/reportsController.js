const db = require('../config/db');
const enc = require('../../encryption/engine');

const DIAGNOSIS_OPTIONS = [
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

function getDiagnosisLabel(meta) {
  if (!meta) return null;
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta);
    } catch (e) {
      return null;
    }
  }
  return meta.diagnosis_label || null;
}

async function resolveDiagnosisLabel(record) {
  const labelFromMeta = getDiagnosisLabel(record?.meta);
  if (labelFromMeta) return labelFromMeta;

  if (!record || record.record_type !== 'diagnosis' || !record.ciphertext) {
    return null;
  }

  try {
    const decrypted = await enc.decrypt(record.ciphertext);
    const plaintext = String(decrypted?.plaintext || '').trim();
    return plaintext || null;
  } catch (e) {
    return null;
  }
}

async function loadEncryptedPatientsAndRecords() {
  const patientsResult = await db.query('SELECT id, patient_id, created_at FROM patients ORDER BY id DESC LIMIT 200', []);
  const recordsResult = await db.query('SELECT * FROM encrypted_records ORDER BY id DESC LIMIT 500', []);
  return {
    patients: patientsResult.rows || [],
    records: recordsResult.rows || []
  };
}

/**
 * GET /api/reports/summary
 * Returns summary statistics with PII protected
 */
exports.getSummary = async (req, res) => {
  try {
    const patResult = await db.query('SELECT count(*) FROM patients');
    const totalPatients = Number(patResult.rows[0]?.count || 0);
    res.json({
      totalPatients,
      privacy: 'PII protected'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/reports/blood-group
 * Returns blood group distribution with PII protected
 */
exports.getBloodGroup = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM patients');
    const patients = result.rows || [];
    const distribution = {};
    for (const p of patients) {
      const bg = p.blood_group || 'Unknown';
      distribution[bg] = (distribution[bg] || 0) + 1;
    }
    res.json({
      bloodGroupDistribution: distribution,
      privacy: 'PII protected'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/reports/encrypted-patients
 * Returns a list of patients with all their fields encrypted (ciphertext).
 * Only patient_id is shown in plain text.
 * All other fields (first_name, last_name, gender, date_of_birth,
 * national_id, phone, address, blood_group, allergies, diagnosis,
 * prescription, medical_history, doctor_notes, lab_results) are
 * shown as encrypted ciphertext.
 */
exports.getEncryptedPatients = async (req, res) => {
  try {
    const ALL_FIELDS = [
      'first_name', 'last_name', 'gender', 'date_of_birth', 'national_id',
      'phone', 'address', 'blood_group', 'allergies',
      'diagnosis', 'prescription', 'medical_history', 'doctor_notes', 'lab_results'
    ];

    // Get all patients (only patient_id from patients table, everything else from encrypted_records)
    const patientsResult = await db.query('SELECT id, patient_id, created_at FROM patients ORDER BY id DESC LIMIT 200', []);
    const patients = patientsResult.rows || [];

    // Enrich with encrypted record details
    const enriched = [];
    for (const patient of patients) {
      const encResult = await db.query('SELECT * FROM encrypted_records WHERE patient_id = $1', [patient.id]);
      const records = encResult.rows || [];

      // Build a map of record_type -> ciphertext
      const encryptedMap = {};
      for (const rec of records) {
        if (!encryptedMap[rec.record_type]) {
          encryptedMap[rec.record_type] = {
            ciphertext: rec.ciphertext || 'N/A',
            algorithm: rec.algorithm || 'simulated-he',
            created_at: rec.created_at
          };
        }
      }

      const enrichedPatient = {
        id: patient.id,
        patient_id: patient.patient_id,
        encrypted_record_count: records.length,
        record_types: records.map(r => r.record_type),
        records: records.map(r => ({
          record_type: r.record_type,
          ciphertext: r.ciphertext,
          algorithm: r.algorithm || 'simulated-he',
          created_at: r.created_at
        })),
        algorithm: records.length > 0 ? (records[0].algorithm || 'simulated-he') : null,
        created_at: patient.created_at
      };

      // Add all fields — only patient_id is plain text, everything else is encrypted
      for (const field of ALL_FIELDS) {
        if (encryptedMap[field]) {
          enrichedPatient[field] = encryptedMap[field];
        } else {
          enrichedPatient[field] = null;
        }
      }

      enriched.push(enrichedPatient);
    }

    res.json({ patients: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/reports/all-records
 * Returns ALL encrypted records as flat rows — only patient_id is visible in plain text.
 * Every record (field) is shown with its ciphertext.
 */
exports.getAllRecords = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        er.id AS record_id,
        p.patient_id,
        er.record_type,
        er.ciphertext,
        er.algorithm,
        er.created_at
      FROM encrypted_records er
      JOIN patients p ON p.id = er.patient_id
      ORDER BY er.id DESC
      LIMIT 200
    `);
    const records = result.rows || [];
    res.json({ records });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/dashboard/recent-encrypted
 * Returns the most recently encrypted patient records for the dashboard
 */
exports.getRecentEncrypted = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM encrypted_records ORDER BY id DESC LIMIT 10');
    const records = result.rows || [];

    // Enrich with patient IDs
    const enriched = [];
    for (const rec of records) {
      const patientResult = await db.query('SELECT patient_id FROM patients WHERE id = $1', [rec.patient_id]);
      enriched.push({
        id: rec.id,
        patient_id: rec.patient_id,
        patient_code: patientResult.rows[0]?.patient_id || 'Unknown',
        record_type: rec.record_type,
        algorithm: rec.algorithm || 'simulated-he',
        created_at: rec.created_at
      });
    }

    res.json({ records: enriched });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/reports/diagnosis-summary
 * Returns counts for the configured diagnosis options
 */
exports.getDiagnosisSummary = async (req, res) => {
  try {
    const { records } = await loadEncryptedPatientsAndRecords();
    const counts = {};
    for (const option of DIAGNOSIS_OPTIONS) {
      counts[option] = 0;
    }

    for (const record of records) {
      if (record.record_type !== 'diagnosis') continue;
      const label = await resolveDiagnosisLabel(record);
      if (label && counts.hasOwnProperty(label)) {
        counts[label] += 1;
      }
    }

    res.json({
      diagnoses: DIAGNOSIS_OPTIONS.map((label) => ({
        label,
        count: counts[label] || 0
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/reports/diagnosis?label=Malaria
 * Returns patients whose encrypted diagnosis matches the selected label.
 */
exports.getDiagnosisReport = async (req, res) => {
  try {
    const label = String(req.query.label || '').trim();
    if (!label) {
      return res.status(400).json({ error: 'label is required' });
    }
    if (!DIAGNOSIS_OPTIONS.includes(label)) {
      return res.status(400).json({ error: 'Invalid diagnosis label' });
    }

    const { patients, records } = await loadEncryptedPatientsAndRecords();

    const matched = [];
    for (const patient of patients) {
      const patientRecords = records.filter((record) => Number(record.patient_id) === Number(patient.id));
      const diagnosisRecord = patientRecords.find((record) => {
        return record.record_type === 'diagnosis' && getDiagnosisLabel(record.meta) === label;
      });
      let matchedDiagnosisRecord = diagnosisRecord;

      if (!matchedDiagnosisRecord) {
        for (const record of patientRecords) {
          if (record.record_type !== 'diagnosis') continue;
          const resolved = await resolveDiagnosisLabel(record);
          if (resolved === label) {
            matchedDiagnosisRecord = record;
            break;
          }
        }
      }

      if (!matchedDiagnosisRecord) continue;

      matched.push({
        id: patient.id,
        patient_id: patient.patient_id,
        diagnosis_label: label,
        diagnosis_ciphertext: matchedDiagnosisRecord.ciphertext,
        encrypted_record_count: patientRecords.length,
        record_types: patientRecords.map((record) => record.record_type),
        records: patientRecords.map((record) => ({
          id: record.id,
          record_type: record.record_type,
          ciphertext: record.ciphertext,
          algorithm: record.algorithm || 'simulated-he',
          created_at: record.created_at
        })),
        created_at: patient.created_at
      });
    }

    res.json({
      diagnosis: label,
      totalPatients: matched.length,
      patients: matched
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
