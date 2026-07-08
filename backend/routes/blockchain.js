const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const controller = require('../controllers/blockchainController');

router.get('/blocks', authenticateToken, controller.getBlocks);
router.get('/blocks/:number', authenticateToken, controller.getBlock);
router.post('/verify', authenticateToken, controller.verify);

module.exports = router;
