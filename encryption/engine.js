/**
 * Simulated Homomorphic Encryption Engine
 * - Provides encrypt/decrypt and simulated homomorphic ops
 * - Designed as an abstraction layer so real HE libs can replace it later
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

async function encrypt(plaintext) {
  const t0 = performance.now();
  // Simulate CPU work for encryption
  const ciphertext = base64Encode({ ts: Date.now(), v: plaintext });
  const t1 = performance.now();
  return { ciphertext, timeMs: Math.round(t1 - t0) };
}

async function decrypt(ciphertext) {
  const t0 = performance.now();
  const obj = base64Decode(ciphertext);
  const val = (obj && obj.v !== undefined) ? obj.v : obj;
  const t1 = performance.now();
  return { plaintext: val, timeMs: Math.round(t1 - t0) };
}

// Simulate addition on ciphertexts by decoding, adding numerics, and re-encrypting result
async function addEncrypted(cipherA, cipherB) {
  const t0 = performance.now();
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
  const t1 = performance.now();
  return { ciphertext, timeMs: Math.round(t1 - t0) };
}

async function multiplyEncrypted(cipherA, cipherB) {
  const t0 = performance.now();
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
  const t1 = performance.now();
  return { ciphertext, timeMs: Math.round(t1 - t0) };
}

async function averageEncrypted(ciphertexts = []) {
  const t0 = performance.now();
  const vals = ciphertexts.map(c => {
    const d = base64Decode(c);
    return (d && d.v !== undefined) ? Number(d.v) : NaN;
  }).filter(v => !isNaN(v));
  const avg = vals.length ? (vals.reduce((s, x) => s + x, 0) / vals.length) : null;
  const ciphertext = base64Encode({ ts: Date.now(), v: avg });
  const t1 = performance.now();
  return { ciphertext, timeMs: Math.round(t1 - t0), count: vals.length };
}

module.exports = {
  encrypt,
  decrypt,
  addEncrypted,
  multiplyEncrypted,
  averageEncrypted,
};
