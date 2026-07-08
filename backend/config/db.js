const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'openmrs'}:${process.env.POSTGRES_PASSWORD || 'openmrs'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'openmrs_db'}`,
});

const memoryState = {
  roles: [
    { id: 1, name: 'Administrator', description: 'Full access' },
    { id: 2, name: 'Doctor', description: 'Doctor role' },
    { id: 3, name: 'Nurse', description: 'Nurse role' },
  ],
  users: [],
  patients: [],
  encrypted_records: [],
  blockchain_blocks: [],
  transactions: [],
  audit_logs: [],
  encryption_keys: [],
};

let memoryInitialized = false;

function seedMemoryState() {
  if (memoryInitialized) return;
  memoryInitialized = true;
  if (memoryState.users.length === 0) {
    memoryState.users.push({
      id: 1,
      username: 'admin',
      password_hash: '$2b$10$3GfP4VY9mVhB5a6Y4F2sD.w1AqQ9M9Yw5mY4q3fT2M3zQf7G5jZ6',
      role_id: 1,
      created_at: new Date(),
    });
  }
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function buildRows(tableName, items) {
  return { rows: items, rowCount: items.length };
}

function handleMemoryQuery(text, params = []) {
  seedMemoryState();
  const sql = normalizeText(text);
  const values = Array.isArray(params) ? params : [];

  if (sql.startsWith('SELECT count(*) FROM blockchain_blocks')) {
    return Promise.resolve(buildRows('blockchain_blocks', [{ count: memoryState.blockchain_blocks.length }]));
  }

  if (sql.startsWith('SELECT * FROM blockchain_blocks ORDER BY block_number DESC LIMIT')) {
    const limit = Number(values[0] || 100);
    const rows = [...memoryState.blockchain_blocks].sort((a, b) => b.block_number - a.block_number).slice(0, limit);
    return Promise.resolve(buildRows('blockchain_blocks', rows));
  }

  if (sql.startsWith('SELECT * FROM blockchain_blocks ORDER BY block_number ASC')) {
    const rows = [...memoryState.blockchain_blocks].sort((a, b) => a.block_number - b.block_number);
    return Promise.resolve(buildRows('blockchain_blocks', rows));
  }

  if (sql.startsWith('SELECT * FROM blockchain_blocks WHERE block_number =')) {
    const blockNumber = Number(values[0]);
    const row = memoryState.blockchain_blocks.find((item) => item.block_number === blockNumber);
    return Promise.resolve(buildRows('blockchain_blocks', row ? [row] : []));
  }

  if (sql.startsWith('SELECT * FROM patients WHERE id =')) {
    const id = Number(values[0]);
    const row = memoryState.patients.find((item) => item.id === id);
    return Promise.resolve(buildRows('patients', row ? [row] : []));
  }

  if (sql.startsWith('SELECT id, patient_id, first_name, last_name, gender, date_of_birth FROM patients ORDER BY id DESC LIMIT')) {
    const limit = Number(values[0] || 100);
    const rows = [...memoryState.patients].sort((a, b) => b.id - a.id).slice(0, limit);
    return Promise.resolve(buildRows('patients', rows));
  }

  if (sql.startsWith('SELECT id, username, password_hash, role_id FROM users WHERE username =')) {
    const username = values[0];
    const row = memoryState.users.find((item) => item.username === username);
    return Promise.resolve(buildRows('users', row ? [row] : []));
  }

  if (sql.startsWith('INSERT INTO users')) {
    const username = values[0];
    const passwordHash = values[1];
    const roleId = values[2] ?? 2;
    const user = { id: memoryState.users.length + 1, username, password_hash: passwordHash, role_id: roleId, created_at: new Date() };
    memoryState.users.push(user);
    return Promise.resolve({ rows: [{ id: user.id, username }], rowCount: 1 });
  }

  if (sql.startsWith('INSERT INTO patients')) {
    const patient = {
      id: memoryState.patients.length + 1,
      patient_id: values[0],
      national_id: values[1],
      first_name: values[2],
      last_name: values[3],
      gender: values[4],
      date_of_birth: values[5],
      phone: values[6],
      address: values[7],
      blood_group: values[8],
      allergies: values[9],
      created_at: new Date(),
    };
    memoryState.patients.push(patient);
    return Promise.resolve({ rows: [{ id: patient.id }], rowCount: 1 });
  }

  if (sql.startsWith('INSERT INTO encrypted_records')) {
    const entry = {
      id: memoryState.encrypted_records.length + 1,
      patient_id: values[0],
      record_type: values[1],
      ciphertext: values[2],
      meta: values[3],
      created_at: new Date(),
    };
    memoryState.encrypted_records.push(entry);
    return Promise.resolve({ rows: [{ id: entry.id }], rowCount: 1 });
  }

  if (sql.startsWith('INSERT INTO blockchain_blocks')) {
    const block = {
      id: memoryState.blockchain_blocks.length + 1,
      block_number: Number(values[0]),
      timestamp: values[1],
      transactions: values[2],
      previous_hash: values[3],
      current_hash: values[4],
      nonce: Number(values[5]),
      signature: values[6] || null,
    };
    memoryState.blockchain_blocks.push(block);
    return Promise.resolve({ rows: [{ id: block.id }], rowCount: 1 });
  }

  if (sql.startsWith('INSERT INTO transactions')) {
    const tx = {
      id: memoryState.transactions.length + 1,
      block_id: values[0],
      tx_type: values[1],
      user_id: values[2],
      patient_id: values[3],
      payload: values[4],
      created_at: new Date(),
    };
    memoryState.transactions.push(tx);
    return Promise.resolve({ rows: [{ id: tx.id }], rowCount: 1 });
  }

  if (sql.startsWith('UPDATE patients SET')) {
    const id = Number(values[values.length - 1]);
    const patient = memoryState.patients.find((item) => item.id === id);
    if (patient) {
      const setPart = sql.match(/SET\s+(.+)\s+WHERE/i);
      if (setPart) {
        const assignments = setPart[1].split(',').map((item) => item.trim());
        assignments.forEach((assignment, index) => {
          const [field] = assignment.split(' = ');
          if (field) {
            patient[field] = values[index];
          }
        });
      }
    }
    return Promise.resolve({ rows: [], rowCount: 1 });
  }

  if (sql.startsWith('DELETE FROM patients')) {
    const id = Number(values[0]);
    memoryState.patients = memoryState.patients.filter((item) => item.id !== id);
    return Promise.resolve({ rows: [], rowCount: 1 });
  }

  if (sql.startsWith('SELECT * FROM patients')) {
    return Promise.resolve(buildRows('patients', [...memoryState.patients]));
  }

  return Promise.resolve({ rows: [], rowCount: 0 });
}

async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.warn('Falling back to in-memory database store:', error.message);
    return handleMemoryQuery(text, params);
  }
}

async function ensureDefaultAdminUser() {
  try {
    const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', ['Administrator']);
    const roleId = roleRes.rows[0]?.id || 1;
    const usersToSeed = [
      { username: 'admin', password: 'admin123', roleId },
      { username: 'doctor', password: 'doctor123', roleId: 2 },
      { username: 'nurse', password: 'nurse123', roleId: 3 },
      { username: 'pharmacist', password: 'pharma123', roleId: 4 },
    ];

    for (const user of usersToSeed) {
      const existing = await pool.query('SELECT id FROM users WHERE username = $1', [user.username]);
      if (existing.rowCount > 0) continue;
      const passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query('INSERT INTO users(username, password_hash, role_id) VALUES($1, $2, $3)', [user.username, passwordHash, user.roleId]);
    }

    console.log('Seeded demo users: admin/admin123, doctor/doctor123, nurse/nurse123, pharmacist/pharma123');
  } catch (error) {
    console.warn('Could not seed demo users:', error.message);
  }
}

module.exports = {
  query,
  pool,
  initDb: async () => {
    try {
      await pool.query('SELECT NOW()');
      await ensureDefaultAdminUser();
      return { mode: 'postgres' };
    } catch (error) {
      console.warn('PostgreSQL not available; using in-memory database store.');
      seedMemoryState();
      return { mode: 'memory' };
    }
  },
};
