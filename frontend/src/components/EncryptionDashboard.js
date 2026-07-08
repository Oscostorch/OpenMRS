import React from 'react';
import EncryptionDemo from './EncryptionDemo';

export default function EncryptionDashboard(){
  return (
    <div className="container mt-4">
      <h3>Encryption Dashboard</h3>
      <p className="text-muted">Demonstrates simulated homomorphic encryption operations (encrypt, decrypt, average) using the backend engine.</p>
      <EncryptionDemo />
    </div>
  );
}
