-- PostgreSQL schema for OpenMRS-Sim (simplified)

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(64) UNIQUE,
  national_id VARCHAR(64),
  first_name VARCHAR(150),
  last_name VARCHAR(150),
  gender VARCHAR(10),
  date_of_birth DATE,
  phone VARCHAR(50),
  address TEXT,
  blood_group VARCHAR(10),
  allergies TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE encrypted_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  record_type VARCHAR(100),
  ciphertext TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE blockchain_blocks (
  id SERIAL PRIMARY KEY,
  block_number INTEGER,
  timestamp TIMESTAMP DEFAULT now(),
  transactions JSONB,
  previous_hash TEXT,
  current_hash TEXT,
  nonce BIGINT,
  signature TEXT
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  block_id INTEGER REFERENCES blockchain_blocks(id),
  tx_type VARCHAR(100),
  user_id INTEGER REFERENCES users(id),
  patient_id INTEGER REFERENCES patients(id),
  payload JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  time TIMESTAMP DEFAULT now(),
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  action VARCHAR(255),
  patient_id INTEGER REFERENCES patients(id),
  status VARCHAR(50),
  ip_address VARCHAR(100),
  hash TEXT
);

CREATE TABLE encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(150),
  public_key TEXT,
  private_key_encrypted TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- seed minimal roles
INSERT INTO roles(name, description) VALUES ('Administrator', 'Full access'), ('Doctor','Doctor role'), ('Nurse','Nurse role');
