const express = require('express');
const router = express.Router();
const { encrypt, decrypt, encryptedAverage } = require('../controllers/encryptionController');
const { authenticateToken } = require('../middleware/auth');

router.post('/encrypt', authenticateToken, encrypt);
router.post('/decrypt', authenticateToken, decrypt);
router.post('/encrypted-average', authenticateToken, encryptedAverage);

module.exports = router;
