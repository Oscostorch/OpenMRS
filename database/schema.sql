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
  algorithm VARCHAR(50) DEFAULT 'simulated-he',
  key_reference VARCHAR(150),
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
  username VARCHAR(150),
  role_id INTEGER REFERENCES roles(id),
  action VARCHAR(255),
  patient_id INTEGER REFERENCES patients(id),
  status VARCHAR(50),
  ip_address VARCHAR(100),
  old_hash TEXT,
  new_hash TEXT
);

CREATE TABLE encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(150),
  public_key TEXT,
  private_key_encrypted TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150),
  description TEXT
);

CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE encryption_metrics (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(64),
  algorithm VARCHAR(100) DEFAULT 'simulated-he',
  encrypted_fields INTEGER DEFAULT 0,
  latency_ms DOUBLE PRECISION DEFAULT 0,
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP DEFAULT now(),
  created_by INTEGER REFERENCES users(id)
);

-- seed minimal roles
INSERT INTO roles(name, description) VALUES ('Administrator', 'Full access'), ('Doctor','Doctor role'), ('Nurse','Nurse role'), ('Pharmacist', 'Pharmacist role'), ('Data Manager', 'Data management and reports'), ('ME Officer', 'Monitoring and evaluation');

-- seed permissions
INSERT INTO permissions(code, name, description) VALUES
('patient.create', 'Create Patient', 'Create new patient records'),
('patient.view', 'View Patient', 'View patient information'),
('patient.update', 'Update Patient', 'Update patient records'),
('patient.delete', 'Delete Patient', 'Delete patient records'),
('patient.decrypt', 'Decrypt Patient Data', 'Decrypt sensitive patient fields'),
('encryption.manage', 'Manage Encryption', 'Perform encryption operations'),
('reports.view', 'View Reports', 'View anonymized reports'),
('audit.view', 'View Audit Logs', 'View audit trail'),
('blockchain.view', 'View Blockchain', 'View blockchain explorer'),
('users.manage', 'Manage Users', 'Manage user accounts');
