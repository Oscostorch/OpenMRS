import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import EncryptionDashboard from './components/EncryptionDashboard';
import BlockchainExplorer from './components/BlockchainExplorer';
import Dashboard from './components/Dashboard';
import PatientsPage from './components/PatientsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">OpenMRS-Sim</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link" to="/">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/patients">Patients</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/encryption">Encryption</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/blockchain">Blockchain</Link></li>
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                {token ? (
                  <button className="btn btn-outline-light btn-sm" onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>Logout</button>
                ) : (
                  <Link className="nav-link" to="/login">Login</Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="/encryption" element={<ProtectedRoute><EncryptionDashboard /></ProtectedRoute>} />
        <Route path="/blockchain" element={<ProtectedRoute><BlockchainExplorer /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
