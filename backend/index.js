const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const encryptionRoutes = require('./routes/encryption');
const blockchainRoutes = require('./routes/blockchain');
const auditRoutes = require('./routes/audit');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

const DEFAULT_PORT = 3001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const startServer = async (port, retriesLeft = 10) => {
  await db.initDb();
  const server = app.listen(port, () => {
    console.log(`Backend running on port ${server.address().port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying ${nextPort}...`);
      server.close(() => startServer(nextPort, retriesLeft - 1));
      return;
    }

    console.error(error);
    process.exit(1);
  });
};

if (require.main === module) {
  startServer(PORT);
}

module.exports = { app, startServer };
