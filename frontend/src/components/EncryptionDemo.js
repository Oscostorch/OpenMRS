import React, { useState } from 'react';
import api from '../services/api';

export default function EncryptionDemo() {
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptResult, setDecryptResult] = useState(null);
  const [cipherList, setCipherList] = useState([]);
  const [avgResult, setAvgResult] = useState(null);
  const [encryptTime, setEncryptTime] = useState(null);

  const formatMs = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(3) : '0.000';
  };

  const doEncrypt = async () => {
    if (!plaintext) return;
    const res = await api.post('/api/encryption/encrypt', { plaintext });
    setCiphertext(res.data.ciphertext);
    setEncryptTime(res.data.timeMs);
    setCipherList(prev => [res.data.ciphertext, ...prev]);
    setDecryptResult(null);
  };

  const doDecrypt = async () => {
    if (!ciphertext) return;
    try {
      const res = await api.post('/api/encryption/decrypt', { ciphertext });
      setDecryptResult(res.data.plaintext);
    } catch (error) {
      if (error?.response?.status === 403) {
        setDecryptResult('🔒 ACCESS DENIED: You do not have permission to decrypt.');
      } else {
        setDecryptResult('Decryption failed');
      }
    }
  };

  const doAverage = async () => {
    if (cipherList.length === 0) return;
    const res = await api.post('/api/encryption/encrypted-average', { ciphertexts: cipherList.slice(0, 10) });
    setAvgResult({ ciphertext: res.data.ciphertext, timeMs: res.data.timeMs, count: res.data.count });
  };

  return (
    <div>
      {/* Encrypt Section */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">1. Encrypt Plaintext</h5>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Input (Plaintext)</label>
              <textarea className="form-control mb-2" value={plaintext} onChange={e => setPlaintext(e.target.value)} rows={3} placeholder="Enter text to encrypt..." />
              <button className="btn btn-primary me-2" onClick={doEncrypt}>🔒 Encrypt</button>
              <button className="btn btn-secondary" onClick={() => { setPlaintext(''); setCiphertext(''); setDecryptResult(null); setEncryptTime(null); }}>Clear</button>
            </div>
            <div className="col-md-6">
              <label className="form-label">Result (Ciphertext)</label>
              <textarea className="form-control mb-2" value={ciphertext} readOnly rows={3} placeholder="Encrypted output will appear here..." />
              {encryptTime !== null && <small className="text-muted">Encryption time: {formatMs(encryptTime)}ms</small>}
            </div>
          </div>
        </div>
      </div>

      {/* Decrypt Section */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">2. Decrypt Ciphertext</h5>
          <textarea className="form-control mb-2" value={ciphertext} onChange={e => setCiphertext(e.target.value)} rows={2} placeholder="Paste ciphertext to decrypt..." />
          <button className="btn btn-success me-2" onClick={doDecrypt}>🔓 Decrypt</button>
          {decryptResult !== null && (
            <div className="mt-2 p-2 bg-light rounded">
              <strong>Decrypted Plaintext:</strong> {String(decryptResult)}
            </div>
          )}
        </div>
      </div>

      {/* Homomorphic Average Section */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">3. Encrypted Average (Homomorphic Operation)</h5>
          <p className="text-muted small">
            Demonstrates computing the average of numeric values while they remain encrypted.
            Decrypt → compute → re-encrypt (simulated homomorphic encryption).
          </p>
          <div className="mb-2">
            <button className="btn btn-outline-primary me-2" onClick={doAverage}>📊 Average Top 10</button>
            <button className="btn btn-outline-secondary" onClick={() => { setCipherList([]); setAvgResult(null); }}>Clear List</button>
          </div>
          <div className="row">
            <div className="col-md-7">
              <h6>Ciphertext List (recent)</h6>
              <ul className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {cipherList.map((c, i) => <li key={i} className="list-group-item"><code style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{c}</code></li>)}
                {cipherList.length === 0 && <li className="list-group-item text-muted">No ciphertexts yet. Encrypt some values first.</li>}
              </ul>
            </div>
            <div className="col-md-5">
              <h6>Result</h6>
              {avgResult ? (
                <div className="p-2 bg-light rounded">
                  <p className="mb-1"><strong>Average (encrypted):</strong></p>
                  <code style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{avgResult.ciphertext}</code>
                  <p className="mt-2 mb-0 small text-muted">
                    Count: {avgResult.count} | Time: {formatMs(avgResult.timeMs)}ms
                  </p>
                </div>
              ) : (
                <div className="text-muted p-2">Click "Average Top 10" to compute</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="alert alert-warning">
        <strong>🔒 Security Notice:</strong> This encryption is simulated (Base64 + JSON encoding) for demonstration purposes.
        In a production system, this would use actual homomorphic encryption libraries.
        Decryption is restricted to ADMIN and DOCTOR roles via the smart contract access control.
      </div>
    </div>
  );
}

