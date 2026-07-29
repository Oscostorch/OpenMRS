import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get('/api/auth/users');
        setUsers(res.data.users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const roleNames = {
    1: 'Administrator', 2: 'Doctor', 3: 'Nurse',
    4: 'Pharmacist', 5: 'Data Manager', 6: 'ME Officer'
  };

  const roleBadges = {
    1: 'bg-danger', 2: 'bg-primary', 3: 'bg-success',
    4: 'bg-warning text-dark', 5: 'bg-info text-dark', 6: 'bg-secondary'
  };

  return (
    <div className="container mt-4">
      <h3>User Management</h3>
      <p className="text-muted">System users and their role assignments</p>

      {loading ? (
        <div className="text-muted">Loading users...</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="4" className="text-muted text-center">No users found</td></tr>
                  ) : (
                    users.map((user, i) => (
                      <tr key={user.id || i}>
                        <td>{user.id}</td>
                        <td><strong>{user.username}</strong></td>
                        <td>
                          <span className={`badge ${roleBadges[user.role_id] || 'bg-secondary'}`}>
                            {roleNames[user.role_id] || `Role ${user.role_id}`}
                          </span>
                        </td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 card">
        <div className="card-body">
          <h5>Demo Accounts</h5>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr><th>Username</th><th>Password</th><th>Role</th></tr>
              </thead>
              <tbody>
                <tr><td>admin</td><td>admin123</td><td><span className="badge bg-danger">Administrator</span></td></tr>
                <tr><td>doctor</td><td>doctor123</td><td><span className="badge bg-primary">Doctor</span></td></tr>
                <tr><td>nurse</td><td>nurse123</td><td><span className="badge bg-success">Nurse</span></td></tr>
                <tr><td>pharmacist</td><td>pharma123</td><td><span className="badge bg-warning text-dark">Pharmacist</span></td></tr>
                <tr><td>data_manager</td><td>dm123</td><td><span className="badge bg-info text-dark">Data Manager</span></td></tr>
                <tr><td>me_officer</td><td>me123</td><td><span className="badge bg-secondary">ME Officer</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

