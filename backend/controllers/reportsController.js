const db = require('../config/db');

/**
 * Get patient count by blood group
 * Processes encrypted data to extract blood group distribution
 * without exposing individual patient information.
 */
exports.getBloodGroupDistribution = async (req, res) => {
  try {
    // Fetch all encrypted_records with record_type = 'blood_group'
    const encResult = await db.query(
      "SELECT * FROM encrypted_records WHERE record_type = 'blood_group' ORDER BY created_at DESC LIMIT 1000",
      []
    );
    const records = encResult.rows || [];

    // Decrypt blood group values to aggregate (in a real HE system, this would be done homomorphically)
    const enc = require('../../encryption/engine');
    const distribution = {};

    for (const record of records) {
      try {
        const decrypted = await enc.decrypt(record.ciphertext);
        const bg = String(decrypted.plaintext || 'Unknown').trim();
        distribution[bg] = (distribution[bg] || 0) + 1;
      } catch (e) {
        // Skip records that can't be decrypted
      }
    }

    // Also check patients table for fallback blood_group data
    const patientResult = await db.query('SELECT * FROM patients', []);
    const patients = patientResult.rows || [];

    res.json({
      totalPatients: patients.length,
      bloodGroupDistribution: distribution,
      privacy: 'PII protected',
      note: 'Blood group data processed from encrypted records. No patient identities exposed.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get patient count by age range
 * Groups patients into age ranges without exposing individual ages.
 */
exports.getAgeRangeDistribution = async (req, res) => {
  try {
    const encResult = await db.query(
      "SELECT * FROM encrypted_records WHERE record_type = 'date_of_birth' ORDER BY created_at DESC LIMIT 1000",
      []
    );
    const records = encResult.rows || [];

    const enc = require('../../encryption/engine');
    const ageRanges = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };

    const currentYear = new Date().getFullYear();

    for (const record of records) {
      try {
        const decrypted = await enc.decrypt(record.ciphertext);
        const dob = String(decrypted.plaintext || '');
        if (dob) {
          const birthYear = new Date(dob).getFullYear();
          if (!isNaN(birthYear)) {
            const age = currentYear - birthYear;
            if (age <= 18) ageRanges['0-18']++;
            else if (age <= 35) ageRanges['19-35']++;
            else if (age <= 50) ageRanges['36-50']++;
            else if (age <= 65) ageRanges['51-65']++;
            else ageRanges['65+']++;
          }
        }
      } catch (e) {
        // Skip un-decodable records
      }
    }

    const patientResult = await db.query('SELECT count(*) FROM patients', []);
    const total = Number(patientResult.rows[0]?.count || 0);

    res.json({
      totalPatients: total,
      ageRangeDistribution: ageRanges,
      privacy: 'PII protected',
      note: 'Age ranges computed from encrypted date of birth records. No individual ages exposed.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get disease/ diagnosis statistics
 * Aggregates diagnosis data from encrypted records.
 */
exports.getDiseaseStatistics = async (req, res) => {
  try {
    const encResult = await db.query(
      "SELECT * FROM encrypted_records WHERE record_type = 'diagnosis' ORDER BY created_at DESC LIMIT 2000",
      []
    );
    const records = encResult.rows || [];

    const enc = require('../../encryption/engine');
    const diseaseCounts = {};

    for (const record of records) {
      try {
        const decrypted = await enc.decrypt(record.ciphertext);
        const diagnosis = String(decrypted.plaintext || '').trim();
        if (diagnosis) {
          // Normalize: split by comma for multiple diagnoses
          const diagnoses = diagnosis.split(',').map(d => d.trim());
          for (const d of diagnoses) {
            if (d) {
              diseaseCounts[d] = (diseaseCounts[d] || 0) + 1;
            }
          }
        }
      } catch (e) {
        // Skip un-decodable records
      }
    }

    const patientResult = await db.query('SELECT count(*) FROM patients', []);
    const total = Number(patientResult.rows[0]?.count || 0);

    res.json({
      totalPatients: total,
      diseaseStatistics: diseaseCounts,
      privacy: 'PII protected',
      note: 'Diagnosis data aggregated from encrypted records. No patient identities exposed.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get prescription statistics
 * Aggregates prescription data from encrypted records.
 */
exports.getPrescriptionStatistics = async (req, res) => {
  try {
    const encResult = await db.query(
      "SELECT * FROM encrypted_records WHERE record_type = 'prescription' ORDER BY created_at DESC LIMIT 2000",
      []
    );
    const records = encResult.rows || [];

    const enc = require('../../encryption/engine');
    const medicationCounts = {};

    for (const record of records) {
      try {
        const decrypted = await enc.decrypt(record.ciphertext);
        const prescription = String(decrypted.plaintext || '').trim();
        if (prescription) {
          // Split by common delimiters
          const medications = prescription.split(/[,;]/).map(m => m.trim());
          for (const med of medications) {
            if (med) {
              medicationCounts[med] = (medicationCounts[med] || 0) + 1;
            }
          }
        }
      } catch (e) {
        // Skip un-decodable records
      }
    }

    const patientResult = await db.query('SELECT count(*) FROM patients', []);
    const total = Number(patientResult.rows[0]?.count || 0);

    res.json({
      totalPatients: total,
      prescriptionStatistics: medicationCounts,
      privacy: 'PII protected',
      note: 'Prescription data aggregated from encrypted records. No patient identities exposed.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get comprehensive summary of all reports
 */
exports.getSummary = async (req, res) => {
  try {
    const patientResult = await db.query('SELECT count(*) FROM patients', []);
    const totalPatients = Number(patientResult.rows[0]?.count || 0);

    const encResult = await db.query(
      "SELECT * FROM encrypted_records ORDER BY created_at DESC LIMIT 5000",
      []
    );
    const allRecords = encResult.rows || [];

    // Count record types
    const recordTypeCounts = {};
    for (const record of allRecords) {
      const type = record.record_type || 'unknown';
      recordTypeCounts[type] = (recordTypeCounts[type] || 0) + 1;
    }

    const auditResult = await db.query('SELECT count(*) FROM audit_logs', []);
    const totalAuditLogs = Number(auditResult.rows[0]?.count || 0);

    const blockResult = await db.query('SELECT count(*) FROM blockchain_blocks', []);
    const totalBlocks = Number(blockResult.rows[0]?.count || 0);

    res.json({
      totalPatients,
      totalEncryptedRecords: allRecords.length,
      totalAuditLogs,
      totalBlocks,
      recordTypeBreakdown: recordTypeCounts,
      privacy: 'PII protected',
      note: 'Summary statistics only. No patient identities exposed.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

