import React, { useState } from 'react';
import api from '../services/api';

export default function EncryptionDemo(){
  const [plaintext, setPlaintext] = useState('');
  const [ciphertext, setCiphertext] = useState('');
  const [decryptResult, setDecryptResult] = useState(null);
  const [cipherList, setCipherList] = useState([]);
  const [avgResult, setAvgResult] = useState(null);

  const doEncrypt = async () => {
    const res = await api.post('/api/encryption/encrypt', { plaintext });
    setCiphertext(res.data.ciphertext);
    setCipherList(prev => [res.data.ciphertext, ...prev]);
  };

  const doDecrypt = async () => {
    const res = await api.post('/api/encryption/decrypt', { ciphertext });
    setDecryptResult(res.data.plaintext);
  };

  const doAverage = async () => {
    const res = await api.post('/api/encryption/encrypted-average', { ciphertexts: cipherList.slice(0,10) });
    setAvgResult({ ciphertext: res.data.ciphertext, timeMs: res.data.timeMs, count: res.data.count });
  };

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Encrypt Plaintext</h5>
          <textarea className="form-control mb-2" value={plaintext} onChange={e=>setPlaintext(e.target.value)} rows={3} />
          <button className="btn btn-primary me-2" onClick={doEncrypt}>Encrypt</button>
          <button className="btn btn-secondary" onClick={()=>{setPlaintext('')}}>Clear</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Ciphertext</h5>
          <textarea className="form-control mb-2" value={ciphertext} onChange={e=>setCiphertext(e.target.value)} rows={3} />
          <button className="btn btn-success me-2" onClick={doDecrypt}>Decrypt</button>
          {decryptResult !== null && <div className="mt-2"><strong>Plaintext:</strong> {String(decryptResult)}</div>}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Ciphertext List (recent)</h5>
          <div className="mb-2">
            <button className="btn btn-outline-primary me-2" onClick={doAverage}>Average Top 10</button>
            <button className="btn btn-outline-secondary" onClick={()=>{setCipherList([]); setAvgResult(null);}}>Clear</button>
          </div>
          <ul className="list-group">
            {cipherList.map((c, i) => <li key={i} className="list-group-item"><code style={{wordBreak:'break-all'}}>{c}</code></li>)}
            {cipherList.length===0 && <li className="list-group-item text-muted">No ciphertexts yet</li>}
          </ul>
          {avgResult && <div className="mt-3"><strong>Average result:</strong> <code style={{wordBreak:'break-all'}}>{avgResult.ciphertext}</code> (count: {avgResult.count}, timeMs: {avgResult.timeMs})</div>}
        </div>
      </div>
    </div>
  );
}
