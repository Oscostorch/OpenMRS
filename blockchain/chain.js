const crypto = require('crypto');
const db = require('../backend/config/db');

const DIFFICULTY = 2; // number of leading zeros for proof-of-work

function computeHash(block) {
  const str = `${block.block_number}|${block.timestamp}|${JSON.stringify(block.transactions)}|${block.previous_hash}|${block.nonce}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function getLatestBlock() {
  const res = await db.query('SELECT * FROM blockchain_blocks ORDER BY block_number DESC LIMIT 1');
  return res.rows[0];
}

async function createGenesisIfMissing() {
  const res = await db.query('SELECT count(*) FROM blockchain_blocks');
  const cnt = Number(res.rows[0].count || 0);
  if (cnt === 0) {
    const genesis = {
      block_number: 0,
      timestamp: new Date(),
      transactions: [],
      previous_hash: '0',
      nonce: 0,
    };
    genesis.current_hash = computeHash(genesis);
    await db.query('INSERT INTO blockchain_blocks(block_number, timestamp, transactions, previous_hash, current_hash, nonce) VALUES($1,$2,$3,$4,$5,$6)', [genesis.block_number, genesis.timestamp, genesis.transactions, genesis.previous_hash, genesis.current_hash, genesis.nonce]);
    return genesis;
  }
  return null;
}

async function mineBlock(transactions) {
  const latest = await getLatestBlock();
  const nextNumber = latest ? latest.block_number + 1 : 1;
  const previousHash = latest ? latest.current_hash : '0';
  const timestamp = new Date();
  let nonce = 0;
  let block = { block_number: nextNumber, timestamp, transactions, previous_hash: previousHash, nonce };
  let hash = computeHash(block);
  const target = '0'.repeat(DIFFICULTY);
  while (!hash.startsWith(target)) {
    nonce++;
    block.nonce = nonce;
    hash = computeHash(block);
  }
  block.current_hash = hash;
  // persist block
  const res = await db.query('INSERT INTO blockchain_blocks(block_number, timestamp, transactions, previous_hash, current_hash, nonce) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [block.block_number, block.timestamp, block.transactions, block.previous_hash, block.current_hash, block.nonce]);
  const blockId = res.rows[0].id;
  // persist individual transactions in transactions table
  for (const tx of transactions) {
    await db.query('INSERT INTO transactions(block_id, tx_type, user_id, patient_id, payload) VALUES($1,$2,$3,$4,$5)', [blockId, tx.tx_type, tx.user_id || null, tx.patient_id || null, tx.payload || {}]);
  }
  return block;
}

async function addTransaction(tx) {
  // tx: { tx_type, user_id, patient_id, payload }
  // For simplicity, mine a block per transaction
  await createGenesisIfMissing();
  const block = await mineBlock([tx]);
  return block;
}

async function getBlocks(limit = 100) {
  const res = await db.query('SELECT * FROM blockchain_blocks ORDER BY block_number DESC LIMIT $1', [limit]);
  return res.rows;
}

async function getBlockByNumber(number) {
  const res = await db.query('SELECT * FROM blockchain_blocks WHERE block_number = $1', [number]);
  return res.rows[0];
}

async function verifyChain() {
  const res = await db.query('SELECT * FROM blockchain_blocks ORDER BY block_number ASC');
  const rows = res.rows;
  for (let i = 0; i < rows.length; i++) {
    const b = rows[i];
    const clone = { block_number: b.block_number, timestamp: b.timestamp, transactions: b.transactions, previous_hash: b.previous_hash, nonce: b.nonce };
    const hash = computeHash(clone);
    if (hash !== b.current_hash) return { valid: false, at: b.block_number };
    if (i > 0) {
      if (b.previous_hash !== rows[i-1].current_hash) return { valid: false, at: b.block_number };
    }
  }
  return { valid: true };
}

module.exports = { addTransaction, getBlocks, getBlockByNumber, verifyChain };
