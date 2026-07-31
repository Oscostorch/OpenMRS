const express = require('express');
const router = express.Router();
const { encrypt, decrypt, encryptedAverage, getPerformance } = require('../controllers/encryptionController');
const { authenticateToken } = require('../middleware/auth');

router.post('/encrypt', authenticateToken, encrypt);
router.post('/decrypt', authenticateToken, decrypt);
router.post('/encrypted-average', authenticateToken, encryptedAverage);
router.get('/performance', authenticateToken, getPerformance);

module.exports = router;
