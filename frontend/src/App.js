import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login';
import EncryptionDashboard from './components/EncryptionDashboard';
import AuditPage from './components/AuditPage';
import BlockchainExplorer from './components/BlockchainExplorer';
import Dashboard from './components/Dashboard';
import PatientsPage from './components/PatientsPage';
import ReportsPage from './components/ReportsPage';
import UsersPage from './components/UsersPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const token = localStorage.getItem('token');
  let user = null;
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      // Invalid token
    }
  }

  const roleNames = { 1: 'Administrator', 2: 'Doctor', 3: 'Nurse', 4: 'Pharmacist', 5: 'Data Manager', 6: 'ME Officer' };
  const roleName = user ? (roleNames[user.roleId] || 'User') : 'User';

  const hasPermission = (code) => {
    // In production this would check user.permissions; for dev we allow all
    return true;
  };

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
              <li className="nav-item"><Link className="nav-link" to="/audit">Audit</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/reports">Reports</Link></li>
              {user && Number(user.roleId) === 1 && (
                <li className="nav-item"><Link className="nav-link" to="/users">Users</Link></li>
              )}
            </ul>
            <ul className="navbar-nav align-items-center">
              {user ? (
                <>
                  <li className="nav-item dropdown">
                    <button className="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                      <span className="badge bg-info me-1">{roleName}</span> {user.username || 'User'}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><span className="dropdown-item-text text-muted">Role: {roleName}</span></li>
                      <li><span className="dropdown-item-text text-muted">ID: {user.userId}</span></li>
                    </ul>
                  </li>
                  <li className="nav-item ms-2">
                    <button className="btn btn-danger btn-sm" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
              )}
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
        <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
