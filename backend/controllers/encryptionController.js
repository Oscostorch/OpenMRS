const enc = require('../../encryption/engine');
const db = require('../config/db');

const recentEncryptionMetrics = [];

async function recordEncryptionMetric({ patientId = null, algorithm = 'simulated-he', encryptedFields = 1, latencyMs = 0, startedAt = new Date(), completedAt = new Date(), createdBy = null }) {
  try {
    const metric = {
      patient_id: patientId,
      algorithm,
      encrypted_fields: encryptedFields,
      latency_ms: Number(latencyMs) || 0,
      started_at: startedAt,
      completed_at: completedAt,
      created_by: createdBy
    };

    recentEncryptionMetrics.unshift(metric);
    if (recentEncryptionMetrics.length > 500) {
      recentEncryptionMetrics.pop();
    }

    await db.query(
      `INSERT INTO encryption_metrics(patient_id, algorithm, encrypted_fields, latency_ms, started_at, completed_at, created_by)
       VALUES($1, $2, $3, $4, $5, $6, $7)`,
      [patientId, algorithm, encryptedFields, latencyMs, startedAt, completedAt, createdBy]
    );
  } catch (error) {
    console.error('Failed to record encryption metric:', error.message);
  }
}

exports.encrypt = async (req, res) => {
  try {
    const { plaintext } = req.body;
    if (plaintext === undefined) return res.status(400).json({ error: 'plaintext required' });
    const r = await enc.encrypt(plaintext);
    await recordEncryptionMetric({
      encryptedFields: 1,
      latencyMs: r.timeMs,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdBy: req.user?.userId || null
    });
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.decrypt = async (req, res) => {
  try {
    const { ciphertext } = req.body;
    if (!ciphertext) return res.status(400).json({ error: 'ciphertext required' });
    const r = await enc.decrypt(ciphertext);
    await recordEncryptionMetric({
      encryptedFields: 1,
      latencyMs: r.timeMs,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdBy: req.user?.userId || null
    });
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.encryptedAverage = async (req, res) => {
  try {
    const { ciphertexts } = req.body;
    if (!Array.isArray(ciphertexts)) return res.status(400).json({ error: 'ciphertexts array required' });
    const r = await enc.averageEncrypted(ciphertexts);
    await recordEncryptionMetric({
      encryptedFields: ciphertexts.length,
      latencyMs: r.timeMs,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdBy: req.user?.userId || null
    });
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/encryption/performance
 * Returns encryption latency metrics from the encryption_metrics table
 */
exports.getPerformance = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM encryption_metrics ORDER BY id DESC LIMIT 200');
    const dbRows = result.rows || [];
    const cachedRows = recentEncryptionMetrics.slice();
    const rows = [];
    const seen = new Set();

    for (const row of dbRows.concat(cachedRows)) {
      const key = [
        row.patient_id ?? '',
        row.algorithm ?? '',
        row.encrypted_fields ?? '',
        row.latency_ms ?? '',
        row.started_at ?? '',
        row.completed_at ?? '',
        row.created_by ?? ''
      ].join('|');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      rows.push(row);
    }

    // Compute aggregate stats
    const totalOps = rows.length;
    const latencies = rows.map(r => Number(r.latency_ms) || 0);
    const activeRows = rows.filter(r => (Number(r.latency_ms) || 0) > 0);
    const activeLatencies = activeRows.length > 0
      ? activeRows.map(r => Number(r.latency_ms) || 0)
      : latencies;
    const latest = rows[0] || null;
    const avgLatency = totalOps > 0
      ? Number((activeLatencies.reduce((s, r) => s + r, 0) / activeLatencies.length).toFixed(3))
      : 0;
    const maxLatency = totalOps > 0
      ? Number(Math.max(...activeLatencies).toFixed(3))
      : 0;
    const minLatency = totalOps > 0
      ? Number(Math.min(...activeLatencies).toFixed(3))
      : 0;

    res.json({
      metrics: rows,
      total_operations: totalOps,
      active_operations: activeRows.length,
      avg_latency_ms: avgLatency,
      min_latency_ms: minLatency,
      max_latency_ms: maxLatency,
      latest_operation: latest ? {
        id: latest.id,
        patient_id: latest.patient_id,
        latency_ms: Number(latest.latency_ms) || 0,
        algorithm: latest.algorithm || 'simulated-he',
        created_at: latest.created_at
      } : null,
      summary: { totalOps, avgLatency, maxLatency, minLatency }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
