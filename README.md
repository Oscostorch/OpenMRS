# OpenMRS-Sim

OpenMRS-Sim is a lightweight research prototype for an electronic medical record (EMR) experience that combines patient management, a simple blockchain audit trail, and a homomorphic-encryption-inspired privacy layer. It is meant as a teaching and prototyping application rather than a production-ready healthcare platform.

## Overview

This project demonstrates how a hospital information system might integrate:

- user authentication and basic role-based access
- patient record management
- encrypted storage of sensitive medical fields
- a simple blockchain explorer and verification flow
- a UI for navigating the demo experience

The work is tied to the research theme of improving patient privacy and data integrity for healthcare systems.

## Tech stack

- Frontend: React, React Router, Bootstrap, Axios
- Backend: Node.js and Express
- Database: PostgreSQL (preferred) with an in-memory fallback for local demos
- Privacy modules: simulated homomorphic encryption and a simple proof-of-work blockchain

## Project structure

- backend/: Express API, routes, controllers, and auth logic
- frontend/: React web app with dashboard, patient, encryption, and blockchain views
- database/: PostgreSQL schema and seed data
- encryption/: simulated encryption engine and privacy operations
- blockchain/: simple chain implementation and block verification
- documentation/: architecture notes and supporting documents

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL (optional; the backend will fall back to an in-memory store if it is unavailable)

## Getting started

### 1. Start the database (optional)

If you want to use PostgreSQL locally, start the provided container:

```bash
docker compose -f docker-compose.yml up -d postgres
```

### 2. Start the backend

```bash
cd backend
npm install
npm start
```

The API runs on port 3001 by default. If you want it to match the frontend proxy configuration, start it on port 4000 instead:

```bash
PORT=4000 npm start
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Demo accounts

The backend seeds a few demo users when it starts:

- admin / admin123
- doctor / doctor123
- nurse / nurse123
- pharmacist / pharma123

## Main features

- Authentication: register and log in through the backend API
- Patients: view, create, update, and delete patient records
- Sensitive records: encrypt medical fields such as diagnosis and notes
- Encryption demo: encrypt, decrypt, and compute a simple encrypted average
- Blockchain explorer: inspect mined blocks and verify chain integrity

## API highlights

The backend exposes endpoints under the following areas:

- /api/auth/register and /api/auth/login
- /api/patients for patient CRUD operations
- /api/encryption/encrypt, /api/encryption/decrypt, and /api/encryption/encrypted-average
- /api/blockchain/blocks and /api/blockchain/verify

## Notes

This repository is intentionally a simulation for research and demonstration purposes. The encryption engine and blockchain implementation are simplified and should not be treated as production-grade security or distributed ledger systems.

## Development notes

If you want to explore the docs and design notes, start with the documentation folder and the incremental plan described there.
