/**
 * Permission Matrix — granular access control based on user roles.
 * 
 * Maps each role to the set of allowed operations.
 * This is the enterprise-style role management layer.
 */

const PERMISSION_MATRIX = {
  // Administrator — full access to everything
  ADMIN: {
    id: 1,
    name: 'Administrator',
    description: 'Full access',
    permissions: [
      'patient.create', 'patient.view', 'patient.update', 'patient.delete',
      'patient.decrypt', 'encryption.manage', 'reports.view', 'audit.view',
      'blockchain.view', 'users.manage'
    ],
    canDecrypt: true,
    canDelete: true,
    canManageUsers: true
  },
  // Doctor — clinical operations
  DOCTOR: {
    id: 2,
    name: 'Doctor',
    description: 'Create patient, update patient, decrypt authorized patient data',
    permissions: [
      'patient.create', 'patient.view', 'patient.update',
      'patient.decrypt', 'encryption.manage', 'blockchain.view'
    ],
    canDecrypt: true,
    canDelete: false,
    canManageUsers: false
  },
  // Nurse — view assigned patient information
  NURSE: {
    id: 3,
    name: 'Nurse',
    description: 'View assigned patient information',
    permissions: [
      'patient.view', 'blockchain.view'
    ],
    canDecrypt: false,
    canDelete: false,
    canManageUsers: false
  },
  // Pharmacist — view prescriptions
  PHARMACIST: {
    id: 4,
    name: 'Pharmacist',
    description: 'View prescriptions',
    permissions: [
      'patient.view', 'blockchain.view'
    ],
    canDecrypt: false,
    canDelete: false,
    canManageUsers: false
  },
  // Data Manager — encrypted data management, reports, audit
  DATA_MANAGER: {
    id: 5,
    name: 'Data Manager',
    description: 'Encrypted data management, reports, audit',
    permissions: [
      'patient.view', 'reports.view', 'audit.view', 'blockchain.view'
    ],
    canDecrypt: false,
    canDelete: false,
    canManageUsers: false
  },
  // ME Officer — reports only
  ME_OFFICER: {
    id: 6,
    name: 'ME Officer',
    description: 'Monitoring and evaluation — reports and statistics only',
    permissions: [
      'reports.view', 'blockchain.view'
    ],
    canDecrypt: false,
    canDelete: false,
    canManageUsers: false
  }
};

/**
 * Get the role configuration by role ID
 * @param {number} roleId
 * @returns {Object|null} Role config or null
 */
function getRoleById(roleId) {
  return Object.values(PERMISSION_MATRIX).find(r => r.id === Number(roleId)) || null;
}

/**
 * Get the role configuration by role name
 * @param {string} roleName
 * @returns {Object|null} Role config or null
 */
function getRoleByName(roleName) {
  return PERMISSION_MATRIX[roleName?.toUpperCase()] || null;
}

/**
 * Check if a role has a specific permission
 * @param {number|string} roleId
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(roleId, permission) {
  const role = getRoleById(roleId);
  if (!role) return false;
  return role.permissions.includes(permission);
}

/**
 * Get all permissions for a role
 * @param {number} roleId
 * @returns {string[]}
 */
function getPermissions(roleId) {
  const role = getRoleById(roleId);
  return role ? [...role.permissions] : [];
}

/**
 * Express middleware to enforce role-based permission
 * @param {string} permissionCode
 * @returns {Function}
 */
function requirePermissionMW(permissionCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'ACCESS_DENIED',
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.roleId, permissionCode)) {
      return res.status(403).json({
        status: 'ACCESS_DENIED',
        message: `Unauthorized action rejected by smart contract. Role ${req.user.roleId} does not have "${permissionCode}" permission.`,
        attemptedOperation: permissionCode,
        userRole: req.user.roleId
      });
    }

    next();
  };
}

module.exports = {
  PERMISSION_MATRIX,
  getRoleById,
  getRoleByName,
  hasPermission,
  getPermissions,
  requirePermission: requirePermissionMW
};

