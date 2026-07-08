import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function BlockchainExplorer(){
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const res = await api.get('/api/blockchain/blocks');
    setBlocks(Array.isArray(res.data.blocks) ? res.data.blocks : []);
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="container mt-4">
      <h3>Blockchain Explorer</h3>
      <div className="row">
        <div className="col-md-5">
          <ul className="list-group">
            {Array.isArray(blocks) ? blocks.map(b => (
              <li key={b.block_number} className="list-group-item d-flex justify-content-between align-items-start" style={{cursor:'pointer'}} onClick={()=>setSelected(b)}>
                <div>
                  <div><strong>Block #{b.block_number}</strong></div>
                  <small className="text-muted">txs: {b.transactions?.length || 0} • {new Date(b.timestamp).toLocaleString()}</small>
                </div>
                <span className="badge bg-secondary">{b.current_hash?.slice(0,8)}</span>
              </li>
            )) : null}
            {(!Array.isArray(blocks) || blocks.length === 0) && <li className="list-group-item text-muted">No blocks found</li>}
          </ul>
        </div>
        <div className="col-md-7">
          {selected ? (
            <div className="card">
              <div className="card-body">
                <h5>Block #{selected.block_number}</h5>
                <p><strong>Hash:</strong> <code style={{wordBreak:'break-all'}}>{selected.current_hash}</code></p>
                <p><strong>Prev:</strong> <code style={{wordBreak:'break-all'}}>{selected.previous_hash}</code></p>
                <p><strong>Nonce:</strong> {selected.nonce}</p>
                <p><strong>Transactions:</strong></p>
                <ul className="list-group">
                  {(Array.isArray(selected.transactions) ? selected.transactions : []).map((tx, i) => <li key={i} className="list-group-item"><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(tx,null,2)}</pre></li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body text-muted">Select a block to view details</div></div>
          )}
        </div>
      </div>
    </div>
  );
}
