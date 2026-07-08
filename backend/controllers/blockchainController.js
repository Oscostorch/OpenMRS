const chain = require('../../blockchain/chain');

exports.getBlocks = async (req, res) => {
  try {
    const blocks = await chain.getBlocks(200);
    res.json({ blocks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getBlock = async (req, res) => {
  try {
    const num = Number(req.params.number);
    const block = await chain.getBlockByNumber(num);
    if (!block) return res.status(404).json({ error: 'Not found' });
    res.json({ block });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verify = async (req, res) => {
  try {
    const r = await chain.verifyChain();
    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
