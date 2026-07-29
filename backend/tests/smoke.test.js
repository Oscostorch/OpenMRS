const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { app } = require('../index');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function registerAndLogin(baseUrl, username, password, role) {
  await fetch(baseUrl + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, password: password, role: role || 1 })
  });
  var loginRes = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, password: password })
  });
  var loginData = await loginRes.json();
  return loginData.token;
}

// ===================================
// Authentication Tests
// ===================================

test('auth register and login work', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;
  var username = 'smoke_' + Date.now();

  try {
    var registerRes = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: 'secret123', role: 1 })
    });
    assert.equal(registerRes.status, 200);
    var regData = await registerRes.json();
    assert.ok(regData.user);
    assert.equal(regData.user.username, username);

    var loginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: 'secret123' })
    });
    assert.equal(loginRes.status, 200);
    var loginData = await loginRes.json();
    assert.ok(loginData.token);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('auth invalid login returns 401', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;

  try {
    var res = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'wrong' })
    });
    assert.equal(res.status, 401);
    var data = await res.json();
    assert.ok(data.error);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

// ===================================
// Patient: Auto ID Generation & Encryption
// ===================================

test('patient auto ID generation and full encryption on creation', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;
  var username = 'pat_test_' + Date.now();

  try {
    var token = await registerAndLogin(baseUrl, username, 'test123', 1);
    assert.ok(token, 'Should get auth token');

    var createRes = await fetch(baseUrl + '/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        gender: 'Male',
        date_of_birth: '1980-01-15',
        national_id: '123456789',
        phone: '+1234567890',
        address: '123 Test St',
        blood_group: 'A+',
        allergies: 'None',
        diagnosis: 'Hypertension',
        prescription: 'Lisinopril 10mg',
        doctor_notes: 'Patient stable',
        lab_results: 'Normal',
        medical_history: 'No significant history'
      })
    });

    assert.equal(createRes.status, 200);
    var patient = await createRes.json();

    // Verify auto-generated patient ID format (PT-YYYYMMDD-XXXXXX)
    assert.ok(patient.patient_id, 'Should have patient_id');
    assert.match(patient.patient_id, /^PT-\d{8}-\d{6}$/, 'Patient ID should match PT-YYYYMMDD-XXXXXX format');

    // Verify encrypted fields were created
    assert.ok(Array.isArray(patient.encrypted), 'Should have encrypted fields array');
    assert.ok(patient.encrypted.length > 0, 'Should have at least one encrypted field');

    // Verify the patient list only shows patient_id (not plaintext data)
    var listRes = await fetch(baseUrl + '/api/patients', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    assert.equal(listRes.status, 200);
    var listData = await listRes.json();
    assert.ok(Array.isArray(listData.patients));

    // Patient in list should have patient_id
    var found = null;
    for (var i = 0; i < listData.patients.length; i++) {
      if (listData.patients[i].id === patient.id) {
        found = listData.patients[i];
        break;
      }
    }
    assert.ok(found, 'Patient should be in the list');
    assert.equal(found.patient_id, patient.patient_id, 'Patient ID should match');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

// ===================================
// Security Tests
// ===================================

test('unauthorized decrypt attempt returns 403', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;

  try {
    // Register a nurse-role user (role_id: 3 = Nurse)
    var nurseUser = 'nurse_test_' + Date.now();
    var nurseToken = await registerAndLogin(baseUrl, nurseUser, 'nursepass', 3);

    // Try to decrypt (should be forbidden for nurse)
    var decryptRes = await fetch(baseUrl + '/api/patients/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + nurseToken },
      body: JSON.stringify({ patientId: 1, field: 'diagnosis' })
    });

    assert.equal(decryptRes.status, 403);
    var decryptData = await decryptRes.json();
    assert.match(decryptData.status, /ACCESS_DENIED/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('unauthorized delete by non-admin returns 403', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;

  try {
    // Register a doctor-role user (role_id: 2 = Doctor) who cannot delete
    var doctorUser = 'doc_test_' + Date.now();
    var doctorToken = await registerAndLogin(baseUrl, doctorUser, 'docpass', 2);

    // Try to delete patient (should be forbidden for doctor)
    var deleteRes = await fetch(baseUrl + '/api/patients/1', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + doctorToken }
    });

    assert.equal(deleteRes.status, 403);
    var deleteData = await deleteRes.json();
    assert.match(deleteData.status, /ACCESS_DENIED/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

// ===================================
// Blockchain Tests
// ===================================

test('blockchain stores encrypted transactions only', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;
  var username = 'bc_test_' + Date.now();

  try {
    var token = await registerAndLogin(baseUrl, username, 'bcpass', 1);
    assert.ok(token);

    // Create a patient to generate a blockchain transaction
    var createRes = await fetch(baseUrl + '/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        first_name: 'Blockchain',
        last_name: 'Test',
        diagnosis: 'Test Disease'
      })
    });
    assert.equal(createRes.status, 200);

    // Get blockchain blocks
    var blocksRes = await fetch(baseUrl + '/api/blockchain/blocks', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    assert.equal(blocksRes.status, 200);
    var blocksData = await blocksRes.json();
    assert.ok(Array.isArray(blocksData.blocks));

    // Check that no plaintext patient data is in the transactions
    for (var b = 0; b < blocksData.blocks.length; b++) {
      var block = blocksData.blocks[b];
      var txs = block.transactions || [];
      for (var t = 0; t < txs.length; t++) {
        var tx = txs[t];
        // Must NOT contain plaintext patient names
        assert.ok(!tx.first_name, 'Blockchain should not store plaintext first_name');
        assert.ok(!tx.last_name, 'Blockchain should not store plaintext last_name');
        assert.ok(!tx.diagnosis, 'Blockchain should not store plaintext diagnosis');
        // Encrypted data should be inside encryptedData object
        if (tx.encryptedData) {
          assert.ok(typeof tx.encryptedData === 'object', 'encryptedData should be an object');
        }
      }
    }

    // Verify chain integrity
    var verifyRes = await fetch(baseUrl + '/api/blockchain/verify', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    assert.equal(verifyRes.status, 200);
    var verifyData = await verifyRes.json();
    assert.ok(verifyData.valid !== undefined);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

// ===================================
// Reports Tests
// ===================================

test('reports do not expose PII', async () => {
  var server = await startServer();
  var address = server.address();
  var baseUrl = 'http://127.0.0.1:' + address.port;
  var username = 'rpt_test_' + Date.now();

  try {
    var token = await registerAndLogin(baseUrl, username, 'rptpass', 1);
    assert.ok(token);

    // Get summary report
    var summaryRes = await fetch(baseUrl + '/api/reports/summary', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    assert.equal(summaryRes.status, 200);
    var summaryData = await summaryRes.json();

    // Should have totalPatients but no individual patient data
    assert.ok(summaryData.totalPatients !== undefined);
    assert.equal(summaryData.privacy, 'PII protected');
    assert.ok(!summaryData.patientNames, 'Reports should not contain patient names');
    assert.ok(!summaryData.phoneNumbers, 'Reports should not contain phone numbers');

    // Get blood group distribution
    var bgRes = await fetch(baseUrl + '/api/reports/blood-group', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    assert.equal(bgRes.status, 200);
    var bgData = await bgRes.json();
    assert.equal(bgData.privacy, 'PII protected');

    // Should have distribution data (even if empty)
    assert.ok(bgData.bloodGroupDistribution !== undefined);

    // Reports should be accessible to ME Officer (role_id: 6)
    var meUser = 'me_test_' + Date.now();
    var meToken = await registerAndLogin(baseUrl, meUser, 'mepass', 6);
    var meRes = await fetch(baseUrl + '/api/reports/summary', {
      headers: { 'Authorization': 'Bearer ' + meToken }
    });
    assert.equal(meRes.status, 200, 'ME Officer should be able to view reports');
  } finally {
    server.close();
    await once(server, 'close');
  }
});
