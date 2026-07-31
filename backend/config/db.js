const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://openmrs:openmrs@localhost:5432/openmrs_db',
});

const MEMORY_DB_PATH = path.join(__dirname, '..', 'data', 'memory-db.json');

const memoryState = {
  roles: [
    { id: 1, name: 'Administrator', description: 'Full access' },
    { id: 2, name: 'Doctor', description: 'Doctor role' },
    { id: 3, name: 'Nurse', description: 'Nurse role' },
    { id: 4, name: 'Pharmacist', description: 'Pharmacist role' },
    { id: 5, name: 'Data Manager', description: 'Data management and reports' },
    { id: 6, name: 'ME Officer', description: 'Monitoring and evaluation' },
  ],
  permissions: [
    { id: 1, code: 'patient.create', name: 'Create Patient' },
    { id: 2, code: 'patient.view', name: 'View Patient' },
    { id: 3, code: 'patient.update', name: 'Update Patient' },
    { id: 4, code: 'patient.delete', name: 'Delete Patient' },
    { id: 5, code: 'patient.decrypt', name: 'Decrypt Patient Data' },
    { id: 6, code: 'encryption.manage', name: 'Manage Encryption' },
    { id: 7, code: 'reports.view', name: 'View Reports' },
    { id: 8, code: 'audit.view', name: 'View Audit Logs' },
    { id: 9, code: 'blockchain.view', name: 'View Blockchain' },
    { id: 10, code: 'users.manage', name: 'Manage Users' },
  ],
  role_permissions: [],
  users: [],
  patients: [],
  encrypted_records: [],
  blockchain_blocks: [],
  transactions: [],
  audit_logs: [],
  encryption_keys: [],
  encryption_metrics: [],
};

let memoryInitialized = false;
let patientIdCounter = 0;

function getDefaultMemoryState() {
  return {
    roles: [
      { id: 1, name: 'Administrator', description: 'Full access' },
      { id: 2, name: 'Doctor', description: 'Doctor role' },
      { id: 3, name: 'Nurse', description: 'Nurse role' },
      { id: 4, name: 'Pharmacist', description: 'Pharmacist role' },
      { id: 5, name: 'Data Manager', description: 'Data management and reports' },
      { id: 6, name: 'ME Officer', description: 'Monitoring and evaluation' },
    ],
    permissions: [
      { id: 1, code: 'patient.create', name: 'Create Patient' },
      { id: 2, code: 'patient.view', name: 'View Patient' },
      { id: 3, code: 'patient.update', name: 'Update Patient' },
      { id: 4, code: 'patient.delete', name: 'Delete Patient' },
      { id: 5, code: 'patient.decrypt', name: 'Decrypt Patient Data' },
      { id: 6, code: 'encryption.manage', name: 'Manage Encryption' },
      { id: 7, code: 'reports.view', name: 'View Reports' },
      { id: 8, code: 'audit.view', name: 'View Audit Logs' },
      { id: 9, code: 'blockchain.view', name: 'View Blockchain' },
      { id: 10, code: 'users.manage', name: 'Manage Users' },
    ],
    role_permissions: [],
    users: [],
    patients: [],
    encrypted_records: [],
    blockchain_blocks: [],
    transactions: [],
    audit_logs: [],
    encryption_keys: [],
    encryption_metrics: [],
  };
}

function resetMemoryState() {
  var defaults = getDefaultMemoryState();
  for (var key in defaults) {
    if (defaults.hasOwnProperty(key)) {
      memoryState[key] = defaults[key];
    }
  }
  memoryInitialized = false;
  patientIdCounter = 0;
}

function persistMemoryState() {
  try {
    fs.mkdirSync(path.dirname(MEMORY_DB_PATH), { recursive: true });
    fs.writeFileSync(
      MEMORY_DB_PATH,
      JSON.stringify({
        memoryState: memoryState,
        patientIdCounter: patientIdCounter,
      }, null, 2)
    );
  } catch (error) {
    console.warn('Could not persist in-memory database store:', error.message);
  }
}

function loadMemoryState() {
  try {
    if (!fs.existsSync(MEMORY_DB_PATH)) {
      return false;
    }

    var raw = fs.readFileSync(MEMORY_DB_PATH, 'utf8');
    if (!raw) {
      return false;
    }

    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    var source = parsed.memoryState || parsed;
    var defaults = getDefaultMemoryState();
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)) {
        memoryState[key] = Array.isArray(source[key]) ? source[key] : defaults[key];
      }
    }
    patientIdCounter = Number(parsed.patientIdCounter || 0);
    memoryInitialized = true;
    return true;
  } catch (error) {
    console.warn('Could not load persisted in-memory database store:', error.message);
    return false;
  }
}

function seedMemoryState() {
  if (memoryInitialized) return;
  if (loadMemoryState()) return;
  memoryInitialized = true;

  // Seed role_permissions
  var rp = [
    { id: 1, role_id: 1, permission_id: 1 }, { id: 2, role_id: 1, permission_id: 2 },
    { id: 3, role_id: 1, permission_id: 3 }, { id: 4, role_id: 1, permission_id: 4 },
    { id: 5, role_id: 1, permission_id: 5 }, { id: 6, role_id: 1, permission_id: 6 },
    { id: 7, role_id: 1, permission_id: 7 }, { id: 8, role_id: 1, permission_id: 8 },
    { id: 9, role_id: 1, permission_id: 9 }, { id: 10, role_id: 1, permission_id: 10 },
    { id: 11, role_id: 2, permission_id: 1 }, { id: 12, role_id: 2, permission_id: 2 },
    { id: 13, role_id: 2, permission_id: 3 }, { id: 14, role_id: 2, permission_id: 5 },
    { id: 15, role_id: 3, permission_id: 2 },
    { id: 16, role_id: 4, permission_id: 2 },
    { id: 17, role_id: 5, permission_id: 2 }, { id: 18, role_id: 5, permission_id: 7 }, { id: 19, role_id: 5, permission_id: 8 },
    { id: 20, role_id: 6, permission_id: 7 },
  ];
  memoryState.role_permissions = rp;

  // Seed all 6 demo users with proper bcrypt hashes
  if (memoryState.users.length === 0) {
    var demoUsers = [
      { id: 1, username: 'admin', password: 'admin123', role_id: 1 },
      { id: 2, username: 'doctor', password: 'doctor123', role_id: 2 },
      { id: 3, username: 'nurse', password: 'nurse123', role_id: 3 },
      { id: 4, username: 'pharmacist', password: 'pharma123', role_id: 4 },
      { id: 5, username: 'data_manager', password: 'dm123', role_id: 5 },
      { id: 6, username: 'me_officer', password: 'me123', role_id: 6 },
    ];
    for (var u = 0; u < demoUsers.length; u++) {
      var du = demoUsers[u];
      memoryState.users.push({
        id: du.id,
        username: du.username,
        password_hash: bcrypt.hashSync(du.password, 10),
        role_id: du.role_id,
        created_at: new Date(),
      });
    }
  }

  persistMemoryState();
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function buildRows(tableName, items) {
  return { rows: items, rowCount: items.length };
}

function generatePatientId() {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');
  var dateStr = '' + y + m + d;
  patientIdCounter++;
  var rand = String(patientIdCounter).padStart(6, '0');
  return 'PT-' + dateStr + '-' + rand;
}

function computeHash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function parseBlock(block) {
  if (!block) return block;
  var txs = block.transactions;
  if (typeof txs === 'string') {
    try { txs = JSON.parse(txs); } catch(e) { txs = []; }
  }
  if (!Array.isArray(txs)) { txs = []; }
  var result = {};
  for (var key in block) {
    if (block.hasOwnProperty(key)) {
      result[key] = block[key];
    }
  }
  result.transactions = txs;
  return result;
}

function handleMemoryQuery(text, params) {
  seedMemoryState();
  var sql = normalizeText(text);
  var values = Array.isArray(params) ? params : [];

  if (sql.indexOf('SELECT * FROM permissions') === 0) {
    return Promise.resolve(buildRows('permissions', memoryState.permissions.slice()));
  }
  if (sql.indexOf('SELECT * FROM role_permissions') === 0) {
    return Promise.resolve(buildRows('role_permissions', memoryState.role_permissions.slice()));
  }
  if (sql.indexOf('SELECT p.code FROM permissions p JOIN role_permissions rp') === 0) {
    var roleId = Number(values[0]);
    var perms = [];
    for (var i = 0; i < memoryState.role_permissions.length; i++) {
      var rp = memoryState.role_permissions[i];
      if (rp.role_id === roleId) {
        for (var j = 0; j < memoryState.permissions.length; j++) {
          if (memoryState.permissions[j].id === rp.permission_id) {
            perms.push(memoryState.permissions[j]);
          }
        }
      }
    }
    return Promise.resolve(buildRows('permissions', perms));
  }
  if (sql.indexOf('SELECT * FROM audit_logs ORDER BY time DESC LIMIT') === 0) {
    var limit = Number(values[0] || 200);
    var rows = memoryState.audit_logs.slice().sort(function(a, b) {
      return new Date(b.time) - new Date(a.time);
    }).slice(0, limit);
    return Promise.resolve(buildRows('audit_logs', rows));
  }
  if (sql.indexOf('INSERT INTO audit_logs') === 0) {
    var entry = {
      id: memoryState.audit_logs.length + 1,
      time: values[0] || new Date(),
      user_id: values[1] || null,
      username: values[2] || 'unknown',
      role_id: values[3] || null,
      action: values[4] || '',
      patient_id: values[5] || null,
      status: values[6] || 'SUCCESS',
      ip_address: values[7] || '',
      old_hash: values[8] || null,
      new_hash: values[9] || null,
    };
    memoryState.audit_logs.push(entry);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: entry.id }], rowCount: 1 });
  }
  if (sql.indexOf('SELECT count(*) FROM blockchain_blocks') === 0) {
    return Promise.resolve(buildRows('blockchain_blocks', [{ count: memoryState.blockchain_blocks.length }]));
  }
  if (sql.indexOf('SELECT * FROM blockchain_blocks ORDER BY block_number DESC LIMIT') === 0) {
    var limit = Number(values[0] || 100);
    var rows = memoryState.blockchain_blocks.slice().sort(function(a, b) {
      return b.block_number - a.block_number;
    }).slice(0, limit).map(parseBlock);
    return Promise.resolve(buildRows('blockchain_blocks', rows));
  }
  if (sql.indexOf('SELECT * FROM blockchain_blocks ORDER BY block_number ASC') === 0) {
    var rows = memoryState.blockchain_blocks.slice().sort(function(a, b) {
      return a.block_number - b.block_number;
    }).map(parseBlock);
    return Promise.resolve(buildRows('blockchain_blocks', rows));
  }
  if (sql.indexOf('SELECT * FROM blockchain_blocks WHERE block_number =') === 0) {
    var blockNumber = Number(values[0]);
    var row = null;
    for (var i = 0; i < memoryState.blockchain_blocks.length; i++) {
      if (memoryState.blockchain_blocks[i].block_number === blockNumber) {
        row = memoryState.blockchain_blocks[i];
        break;
      }
    }
    return Promise.resolve(buildRows('blockchain_blocks', row ? [parseBlock(row)] : []));
  }
  if (sql.indexOf('SELECT * FROM patients WHERE patient_id =') === 0) {
    var patientId = String(values[0]);
    var row = null;
    for (var i = 0; i < memoryState.patients.length; i++) {
      if (memoryState.patients[i].patient_id === patientId) {
        row = memoryState.patients[i];
        break;
      }
    }
    return Promise.resolve(buildRows('patients', row ? [row] : []));
  }
  if (sql.indexOf('SELECT id, patient_id FROM patients ORDER BY id DESC LIMIT') === 0) {
    var limit = Number(values[0] || 100);
    var rows = memoryState.patients.slice().sort(function(a, b) {
      return b.id - a.id;
    }).slice(0, limit).map(function(p) {
      return { id: p.id, patient_id: p.patient_id };
    });
    return Promise.resolve(buildRows('patients', rows));
  }
  if (sql.indexOf('SELECT id, patient_id, created_at FROM patients ORDER BY id DESC LIMIT') === 0) {
    var limit = Number(values[0] || 100);
    var rows = memoryState.patients.slice().sort(function(a, b) {
      return b.id - a.id;
    }).slice(0, limit).map(function(p) {
      return { id: p.id, patient_id: p.patient_id, created_at: p.created_at };
    });
    return Promise.resolve(buildRows('patients', rows));
  }
  if (sql.indexOf('SELECT * FROM patients WHERE id =') === 0) {
    var id = Number(values[0]);
    var row = null;
    for (var i = 0; i < memoryState.patients.length; i++) {
      if (memoryState.patients[i].id === id) {
        row = memoryState.patients[i];
        break;
      }
    }
    return Promise.resolve(buildRows('patients', row ? [row] : []));
  }
  if (sql.indexOf('SELECT count(*) FROM patients') === 0) {
    return Promise.resolve(buildRows('patients', [{ count: memoryState.patients.length }]));
  }
  if (sql.indexOf('SELECT id, username, password_hash, role_id FROM users WHERE username =') === 0) {
    var username = values[0];
    var row = null;
    for (var i = 0; i < memoryState.users.length; i++) {
      if (memoryState.users[i].username === username) {
        row = memoryState.users[i];
        break;
      }
    }
    return Promise.resolve(buildRows('users', row ? [row] : []));
  }
if (sql.indexOf('SELECT id, username, role_id FROM users WHERE id =') === 0) {
    var id = Number(values[0]);
    var row = null;
    for (var i = 0; i < memoryState.users.length; i++) {
      if (memoryState.users[i].id === id) {
        row = memoryState.users[i];
        break;
      }
    }
    return Promise.resolve(buildRows('users', row ? [{ id: row.id, username: row.username, role_id: row.role_id, created_at: row.created_at }] : []));
  }
  if (sql.indexOf('SELECT id, username, role_id FROM users') === 0) {
    return Promise.resolve(buildRows('users', memoryState.users.slice().map(function(u) {
      return { id: u.id, username: u.username, role_id: u.role_id, created_at: u.created_at };
    })));
  }
  if (sql.indexOf('SELECT * FROM users') === 0) {
    return Promise.resolve(buildRows('users', memoryState.users.slice()));
  }
  if (sql.indexOf('INSERT INTO users') === 0) {
    var username = values[0];
    var passwordHash = values[1];
    var roleId = values[2] || 2;
    var user = { id: memoryState.users.length + 1, username: username, password_hash: passwordHash, role_id: roleId, created_at: new Date() };
    memoryState.users.push(user);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: user.id, username: user.username }], rowCount: 1 });
  }
  if (sql.indexOf('INSERT INTO patients') === 0) {
    var newPatientId = generatePatientId();
    var pid = values[0] || newPatientId;
    var patient = { id: memoryState.patients.length + 1, patient_id: pid, created_at: new Date() };
    memoryState.patients.push(patient);
    patientIdCounter = Math.max(patientIdCounter, patient.id);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: patient.id, patient_id: patient.patient_id }], rowCount: 1 });
  }
  if (sql.indexOf('SELECT * FROM encrypted_records WHERE patient_id') === 0) {
    var pid = Number(values[0]);
    var rows = [];
    for (var i = 0; i < memoryState.encrypted_records.length; i++) {
      if (memoryState.encrypted_records[i].patient_id === pid) {
        rows.push(memoryState.encrypted_records[i]);
      }
    }
    return Promise.resolve(buildRows('encrypted_records', rows));
  }
  if (sql.indexOf('SELECT * FROM encrypted_records ORDER BY id DESC LIMIT') === 0) {
    var limit = Number(values[0] || 10);
    var rows = memoryState.encrypted_records.slice().sort(function(a, b) {
      return b.id - a.id;
    }).slice(0, limit);
    return Promise.resolve(buildRows('encrypted_records', rows));
  }
  if (sql.indexOf('INSERT INTO encrypted_records') === 0) {
    var entry = {
      id: memoryState.encrypted_records.length + 1,
      patient_id: values[0], record_type: values[1], ciphertext: values[2],
      algorithm: values[3] || 'simulated-he', key_reference: values[4] || null,
      meta: values[5] || {}, created_at: new Date()
    };
    memoryState.encrypted_records.push(entry);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: entry.id }], rowCount: 1 });
  }
  if (sql.indexOf('SELECT er.id AS record_id, p.patient_id, er.record_type, er.ciphertext, er.algorithm, er.created_at FROM encrypted_records er JOIN patients p ON p.id = er.patient_id ORDER BY er.id DESC LIMIT') === 0) {
    var limit = Number(values[0] || 200);
    var joined = [];
    for (var i = memoryState.encrypted_records.length - 1; i >= 0; i--) {
      var rec = memoryState.encrypted_records[i];
      var patient = null;
      for (var j = 0; j < memoryState.patients.length; j++) {
        if (memoryState.patients[j].id === rec.patient_id) {
          patient = memoryState.patients[j];
          break;
        }
      }
      if (patient) {
        joined.push({
          record_id: rec.id,
          patient_id: patient.patient_id,
          record_type: rec.record_type,
          ciphertext: rec.ciphertext,
          algorithm: rec.algorithm,
          created_at: rec.created_at
        });
      }
      if (joined.length >= limit) break;
    }
    return Promise.resolve(buildRows('encrypted_records', joined));
  }
  if (sql.indexOf('INSERT INTO blockchain_blocks') === 0) {
    var txs = values[2];
    if (typeof txs === 'object') { txs = JSON.stringify(txs); }
    var block = {
      id: memoryState.blockchain_blocks.length + 1,
      block_number: Number(values[0]), timestamp: values[1], transactions: txs,
      previous_hash: values[3], current_hash: values[4], nonce: Number(values[5]), signature: values[6] || null
    };
    memoryState.blockchain_blocks.push(block);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: block.id }], rowCount: 1 });
  }
  if (sql.indexOf('INSERT INTO transactions') === 0) {
    var tx = { id: memoryState.transactions.length + 1, block_id: values[0], tx_type: values[1], user_id: values[2], patient_id: values[3], payload: values[4], created_at: new Date() };
    memoryState.transactions.push(tx);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: tx.id }], rowCount: 1 });
  }
  if (sql.indexOf('UPDATE patients SET') === 0) {
    var id = Number(values[values.length - 1]);
    var patient = null;
    for (var i = 0; i < memoryState.patients.length; i++) {
      if (memoryState.patients[i].id === id) { patient = memoryState.patients[i]; break; }
    }
    if (patient) {
      var setPart = sql.match(/SET\s+(.+)\s+WHERE/i);
      if (setPart) {
        var assignments = setPart[1].split(',').map(function(item) { return item.trim(); });
        for (var a = 0; a < assignments.length; a++) {
          var parts = assignments[a].split(' = ');
          if (parts.length > 0 && values[a] !== undefined) { patient[parts[0]] = values[a]; }
        }
      }
    }
    persistMemoryState();
    return Promise.resolve({ rows: [], rowCount: 1 });
  }
  if (sql.indexOf('DELETE FROM patients') === 0) {
    var id = Number(values[0]);
    var filtered = [];
    for (var i = 0; i < memoryState.patients.length; i++) {
      if (memoryState.patients[i].id !== id) { filtered.push(memoryState.patients[i]); }
    }
    memoryState.patients = filtered;
    persistMemoryState();
    return Promise.resolve({ rows: [], rowCount: 1 });
  }
  if (sql.indexOf('SELECT * FROM patients') === 0) {
    return Promise.resolve(buildRows('patients', memoryState.patients.slice()));
  }
  if (sql.indexOf('SELECT * FROM encryption_metrics') === 0) {
    return Promise.resolve(buildRows('encryption_metrics', memoryState.encryption_metrics.slice()));
  }
  if (sql.indexOf('INSERT INTO encryption_metrics') === 0) {
    var entry = {
      id: memoryState.encryption_metrics.length + 1,
      patient_id: values[0] || null,
      algorithm: values[1] || 'simulated-he',
      encrypted_fields: Number(values[2]) || 0,
      latency_ms: Number(values[3]) || 0,
      started_at: values[4] || new Date(),
      completed_at: values[5] || new Date(),
      created_by: values[6] || null
    };
    memoryState.encryption_metrics.push(entry);
    persistMemoryState();
    return Promise.resolve({ rows: [{ id: entry.id }], rowCount: 1 });
  }
  return Promise.resolve({ rows: [], rowCount: 0 });
}

async function query(text) {
  var params = arguments.length > 1 ? arguments[1] : [];
  if (process.env.FORCE_MEMORY_DB === 'true') {
    return handleMemoryQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.warn('Falling back to in-memory database store:', error.message);
    return handleMemoryQuery(text, params);
  }
}

async function ensureDefaultAdminUser() {
  try {
    var roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', ['Administrator']);
    var roleId = roleRes.rows[0] ? roleRes.rows[0].id : 1;
    var newRoles = [
      ['Pharmacist', 'Pharmacist role'], ['Data Manager', 'Data management and reports'],
      ['ME Officer', 'Monitoring and evaluation']
    ];
    for (var r = 0; r < newRoles.length; r++) {
      await pool.query('INSERT INTO roles(name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING', newRoles[r]);
    }
    var permissionSeeds = [
      ['patient.create', 'Create Patient', 'Create new patient records'],
      ['patient.view', 'View Patient', 'View patient information'],
      ['patient.update', 'Update Patient', 'Update patient records'],
      ['patient.delete', 'Delete Patient', 'Delete patient records'],
      ['patient.decrypt', 'Decrypt Patient Data', 'Decrypt sensitive patient fields'],
      ['encryption.manage', 'Manage Encryption', 'Perform encryption operations'],
      ['reports.view', 'View Reports', 'View anonymized reports'],
      ['audit.view', 'View Audit Logs', 'View audit trail'],
      ['blockchain.view', 'View Blockchain', 'View blockchain explorer'],
      ['users.manage', 'Manage Users', 'Manage user accounts']
    ];
    for (var i = 0; i < permissionSeeds.length; i++) {
      await pool.query('INSERT INTO permissions(code, name, description) VALUES($1, $2, $3) ON CONFLICT DO NOTHING', permissionSeeds[i]);
    }
    var usersToSeed = [
      { username: 'admin', password: 'admin123', roleId: roleId },
      { username: 'doctor', password: 'doctor123', roleId: 2 },
      { username: 'nurse', password: 'nurse123', roleId: 3 },
      { username: 'pharmacist', password: 'pharma123', roleId: 4 },
      { username: 'data_manager', password: 'dm123', roleId: 5 },
      { username: 'me_officer', password: 'me123', roleId: 6 }
    ];
    for (var j = 0; j < usersToSeed.length; j++) {
      var user = usersToSeed[j];
      var existing = await pool.query('SELECT id FROM users WHERE username = $1', [user.username]);
      if (existing.rowCount > 0) continue;
      var passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query('INSERT INTO users(username, password_hash, role_id) VALUES($1, $2, $3)', [user.username, passwordHash, user.roleId]);
    }
    console.log('Seeded demo users: admin/admin123, doctor/doctor123, nurse/nurse123, pharmacist/pharma123, data_manager/dm123, me_officer/me123');
  } catch (error) {
    console.warn('Could not seed demo users:', error.message);
  }
}

module.exports = {
  query: query,
  pool: pool,
  computeHash: computeHash,
  generatePatientId: generatePatientId,
  initDb: async function() {
  if (process.env.FORCE_MEMORY_DB === 'true') {
    console.log('Forcing in-memory database mode');
    seedMemoryState();
    persistMemoryState();
    return { mode: 'memory' };
  }
  try {
    await pool.query('SELECT NOW()');
    await ensureDefaultAdminUser();
      return { mode: 'postgres' };
  } catch (error) {
    console.warn('PostgreSQL not available; using in-memory database store.');
    seedMemoryState();
    persistMemoryState();
    return { mode: 'memory' };
  }
  }
};
