const enc = require('../../encryption/engine');

exports.encrypt = async (req, res) => {
  try {
    const { plaintext } = req.body;
    if (plaintext === undefined) return res.status(400).json({ error: 'plaintext required' });
    const r = await enc.encrypt(plaintext);
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.decrypt = async (req, res) => {
  try {
    const { ciphertext } = req.body;
    if (!ciphertext) return res.status(400).json({ error: 'ciphertext required' });
    const r = await enc.decrypt(ciphertext);
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.encryptedAverage = async (req, res) => {
  try {
    const { ciphertexts } = req.body;
    if (!Array.isArray(ciphertexts)) return res.status(400).json({ error: 'ciphertexts array required' });
    const r = await enc.averageEncrypted(ciphertexts);
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
