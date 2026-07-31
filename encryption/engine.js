/**
 * Simulated Homomorphic Encryption Engine
 * - Provides encrypt/decrypt and simulated homomorphic ops
 * - Designed as an abstraction layer so real HE libs can replace it later
 * - All operations return startedAt / completedAt timestamps for latency tracking
 */

const { performance } = require('perf_hooks');

function base64Encode(obj) {
  const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Buffer.from(s).toString('base64');
}

function base64Decode(str) {
  try {
    const s = Buffer.from(str, 'base64').toString('utf8');
    // try parse JSON
    try { return JSON.parse(s); } catch (e) { return s; }
  } catch (e) { return null; }
}

function elapsedMs(start) {
  const ms = performance.now() - start;
  return Math.max(Number(ms.toFixed(3)), 0.05);
}

function simulateWork(iterations = 50000) {
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc = (acc + i) % 97;
  }
  return acc;
}

/**
 * Encrypt a plaintext value
 * @param {*} plaintext
 * @returns {{ ciphertext: string, timeMs: number, startedAt: string, completedAt: string }}
 */
async function encrypt(plaintext) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  // Simulate CPU work for encryption
  simulateWork();
  const ciphertext = base64Encode({ ts: Date.now(), v: plaintext });
  const completedAt = new Date().toISOString();
  return { ciphertext, timeMs: elapsedMs(t0), startedAt, completedAt };
}

/**
 * Decrypt a ciphertext back to plaintext
 * @param {string} ciphertext
 * @returns {{ plaintext: *, timeMs: number, startedAt: string, completedAt: string }}
 */
async function decrypt(ciphertext) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  simulateWork();
  const obj = base64Decode(ciphertext);
  const val = (obj && obj.v !== undefined) ? obj.v : obj;
  const completedAt = new Date().toISOString();
  return { plaintext: val, timeMs: elapsedMs(t0), startedAt, completedAt };
}

/**
 * Simulate addition on ciphertexts (homomorphic addition)
 * @param {string} cipherA
 * @param {string} cipherB
 * @returns {{ ciphertext: string, timeMs: number, startedAt: string, completedAt: string }}
 */
async function addEncrypted(cipherA, cipherB) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  simulateWork();
  const a = base64Decode(cipherA);
  const b = base64Decode(cipherB);
  const aVal = (a && a.v !== undefined) ? a.v : a;
  const bVal = (b && b.v !== undefined) ? b.v : b;
  let res;
  if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
    res = Number(aVal) + Number(bVal);
  } else {
    res = `${aVal}|${bVal}`;
  }
  const ciphertext = base64Encode({ ts: Date.now(), v: res });
  const completedAt = new Date().toISOString();
  return { ciphertext, timeMs: elapsedMs(t0), startedAt, completedAt };
}

/**
 * Simulate multiplication on ciphertexts (homomorphic multiplication)
 * @param {string} cipherA
 * @param {string} cipherB
 * @returns {{ ciphertext: (string|null), timeMs: number, startedAt: string, completedAt: string }}
 */
async function multiplyEncrypted(cipherA, cipherB) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  simulateWork();
  const a = base64Decode(cipherA);
  const b = base64Decode(cipherB);
  const aVal = (a && a.v !== undefined) ? a.v : a;
  const bVal = (b && b.v !== undefined) ? b.v : b;
  let res;
  if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
    res = Number(aVal) * Number(bVal);
  } else {
    res = null; // undefined for non-numeric
  }
  const ciphertext = base64Encode({ ts: Date.now(), v: res });
  const completedAt = new Date().toISOString();
  return { ciphertext, timeMs: elapsedMs(t0), startedAt, completedAt };
}

/**
 * Compute average over a list of ciphertexts (homomorphic average)
 * @param {string[]} ciphertexts
 * @returns {{ ciphertext: string, timeMs: number, count: number, startedAt: string, completedAt: string }}
 */
async function averageEncrypted(ciphertexts = []) {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  simulateWork();
  const vals = ciphertexts.map(c => {
    const d = base64Decode(c);
    return (d && d.v !== undefined) ? Number(d.v) : NaN;
  }).filter(v => !isNaN(v));
  const avg = vals.length ? (vals.reduce((s, x) => s + x, 0) / vals.length) : null;
  const ciphertext = base64Encode({ ts: Date.now(), v: avg });
  const completedAt = new Date().toISOString();
  return { ciphertext, timeMs: elapsedMs(t0), count: vals.length, startedAt, completedAt };
}

module.exports = {
  encrypt,
  decrypt,
  addEncrypted,
  multiplyEncrypted,
  averageEncrypted,
};

