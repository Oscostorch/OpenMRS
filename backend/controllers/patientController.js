const db = require('../config/db');
const enc = require('../../encryption/engine');
const chain = require('../../blockchain/chain');

exports.getPatients = async (req, res) => {
  try {
    const result = await db.query('SELECT id, patient_id, first_name, last_name, gender, date_of_birth FROM patients ORDER BY id DESC LIMIT 100');
    res.json({ patients: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ patient: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { patient_id, national_id, first_name, last_name, gender, date_of_birth, phone, address, blood_group, allergies } = req.body;
    const result = await db.query(
      `INSERT INTO patients(patient_id, national_id, first_name, last_name, gender, date_of_birth, phone, address, blood_group, allergies)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [patient_id, national_id, first_name, last_name, gender, date_of_birth, phone, address, blood_group, allergies]
    );
    const pid = result.rows[0].id;

    // handle sensitive fields: encrypt and store in encrypted_records
    const sensitive = req.body.sensitiveFields || {};
    const sensitiveKeys = ['diagnosis','prescription','doctor_notes','lab_results','medical_history'];
    const encResults = [];
    for (const k of sensitiveKeys) {
      if (sensitive[k]) {
        const encRes = await enc.encrypt(sensitive[k]);
        await db.query('INSERT INTO encrypted_records(patient_id, record_type, ciphertext, meta) VALUES($1,$2,$3,$4)', [pid, k, encRes.ciphertext, { timeMs: encRes.timeMs }]);
        encResults.push({ field: k, timeMs: encRes.timeMs });
      }
    }

    // record blockchain transaction
    try {
      await chain.addTransaction({ tx_type: 'Patient Registration', user_id: req.user?.userId, patient_id: pid, payload: { patient: { id: pid, patient_id }, encrypted: encResults } });
    } catch (e) { console.error('blockchain add tx failed', e); }

    res.json({ id: pid, encrypted: encResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    // Separate sensitiveFields from normal fields
    const sensitive = fields.sensitiveFields || {};
    delete fields.sensitiveFields;

    const sets = [];
    const values = [];
    let idx = 1;
    for (const k in fields) {
      sets.push(`${k} = $${idx}`);
      values.push(fields[k]);
      idx++;
    }
    if (sets.length > 0) {
      values.push(id);
      const sql = `UPDATE patients SET ${sets.join(', ')} WHERE id = $${idx}`;
      await db.query(sql, values);
    }

    // encrypt any provided sensitive fields and append to encrypted_records
    const sensitiveKeys = ['diagnosis','prescription','doctor_notes','lab_results','medical_history'];
    const encResults = [];
    for (const k of sensitiveKeys) {
      if (sensitive[k]) {
        const encRes = await enc.encrypt(sensitive[k]);
        await db.query('INSERT INTO encrypted_records(patient_id, record_type, ciphertext, meta) VALUES($1,$2,$3,$4)', [id, k, encRes.ciphertext, { timeMs: encRes.timeMs }]);
        encResults.push({ field: k, timeMs: encRes.timeMs });
      }
    }

    try {
      await chain.addTransaction({ tx_type: 'Patient Update', user_id: req.user?.userId, patient_id: id, payload: { fields: fields, encrypted: encResults } });
    } catch (e) { console.error('blockchain add tx failed', e); }

    res.json({ success: true, encrypted: encResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM patients WHERE id = $1', [id]);
    try {
      await chain.addTransaction({ tx_type: 'Patient Deletion', user_id: req.user?.userId, patient_id: id, payload: {} });
    } catch (e) { console.error('blockchain add tx failed', e); }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
