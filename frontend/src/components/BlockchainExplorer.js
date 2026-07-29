import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function BlockchainExplorer() {
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/api/blockchain/blocks');
      setBlocks(Array.isArray(res.data.blocks) ? res.data.blocks : []);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const doVerify = async () => {
    try {
      const res = await api.post('/api/blockchain/verify');
      setVerifyResult(res.data);
    } catch (error) {
      setVerifyResult({ valid: false, error: error.message });
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container mt-4">
      <h3>Blockchain Explorer</h3>

      {/* Privacy Warning */}
      <div className="alert alert-warning d-flex align-items-center" role="alert">
        <span className="fs-4 me-2">⚠️</span>
        <div>
          <strong>Privacy Notice:</strong> This blockchain contains <strong>encrypted healthcare records only</strong>.
          Plaintext patient information is never stored on the chain.
        </div>
      </div>

      <div className="mb-3">
        <button className="btn btn-outline-primary me-2" onClick={load}>🔄 Refresh</button>
        <button className="btn btn-outline-success" onClick={doVerify}>✓ Verify Chain</button>
        {verifyResult && (
          <span className={`ms-3 badge ${verifyResult.valid ? 'bg-success' : 'bg-danger'}`}>
            {verifyResult.valid ? 'Chain Integrity Verified ✓' : `Chain Tampered at block ${verifyResult.at}`}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-muted">Loading blockchain...</div>
      ) : (
        <div className="row">
          <div className="col-md-5">
            <ul className="list-group" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {blocks.length === 0 ? (
                <li className="list-group-item text-muted">No blocks mined yet</li>
              ) : (
                blocks.map(b => (
                  <li
                    key={b.block_number}
                    className={`list-group-item d-flex justify-content-between align-items-start ${selected?.block_number === b.block_number ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(b)}
                  >
                    <div>
                      <div><strong>Block #{b.block_number}</strong></div>
                      <small className="text-muted">
                        {b.transactions?.length || 0} tx(s) • {b.timestamp ? new Date(b.timestamp).toLocaleString() : 'N/A'}
                      </small>
                      {b.transactions && b.transactions.length > 0 && (
                        <div className="mt-1">
                          <small className="text-muted">
                            Patient IDs: {b.transactions.map(tx => tx.patientId || tx.patient_id || 'N/A').filter(Boolean).join(', ')}
                          </small>
                        </div>
                      )}
                    </div>
                    <span className="badge bg-secondary">{b.current_hash?.slice(0, 10)}...</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="col-md-7">
            {selected ? (
              <div className="card">
                <div className="card-body">
                  <h5>Block #{selected.block_number}</h5>
                  <p><strong>Timestamp:</strong> {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : 'N/A'}</p>
                  <p><strong>Current Hash:</strong> <code style={{ wordBreak: 'break-all' }}>{selected.current_hash}</code></p>
                  <p><strong>Previous Hash:</strong> <code style={{ wordBreak: 'break-all' }}>{selected.previous_hash}</code></p>
                  <p><strong>Nonce:</strong> {selected.nonce}</p>

                  <h6>Encrypted Transactions ({selected.transactions?.length || 0})</h6>
                  {(!selected.transactions || selected.transactions.length === 0) ? (
                    <div className="text-muted">Genesis block — no transactions</div>
                  ) : (
                    <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {(Array.isArray(selected.transactions) ? selected.transactions : []).map((tx, i) => (
                        <div key={i} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <strong>{tx.action || tx.tx_type || 'Transaction'}</strong>
                            <small className="text-muted">{tx.performedBy || tx.user || 'Unknown'}</small>
                          </div>
                          <div className="mt-1">
                            <strong>Patient ID:</strong> {tx.patientId || tx.patient_id || 'N/A'}
                          </div>
                          {tx.encryptedData && (
                            <div className="mt-1">
                              <strong>Encrypted Fields:</strong>
                              <div className="table-responsive mt-1">
                                <table className="table table-sm table-borderless mb-0">
                                  <tbody>
                                    {Object.entries(tx.encryptedData).map(([key, value]) => (
                                      <tr key={key}>
                                        <td className="text-muted" style={{ width: '120px' }}>{key}</td>
                                        <td><code style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>{String(value).substring(0, 50)}...</code></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          <small className="text-muted d-block mt-1">
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : ''}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-muted">
                  <p>Select a block to view encrypted transaction details.</p>
                  <p className="mb-0"><strong>🔒 All patient data on this blockchain is encrypted.</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

