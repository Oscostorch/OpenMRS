/**
 * Smart Contract Access Control Simulation
 * 
 * Implements unauthorized action protection using blockchain smart-contract concepts.
 * Since OpenMRS-Sim is a research prototype, this module simulates
 * smart-contract-based authorization rules.
 * 
 * All denied actions are recorded as blockchain audit transactions
 * for tamper-evident access logging.
 */

const crypto = require('crypto');

// Permission mapping based on role IDs
const ROLE_PERMISSIONS = {
  // Admin (role_id: 1) — Full access
  1: [
    'patient.create', 'patient.view', 'patient.update', 'patient.delete',
    'patient.decrypt', 'encryption.manage', 'reports.view', 'audit.view',
    'blockchain.view', 'users.manage'
  ],
  // Doctor (role_id: 2) — Clinical operations + decrypt
  2: [
    'patient.create', 'patient.view', 'patient.update',
    'patient.decrypt', 'encryption.manage', 'blockchain.view'
  ],
  // Nurse (role_id: 3) — View only
  3: [
    'patient.view', 'blockchain.view'
  ],
  // Pharmacist (role_id: 4) — View prescriptions
  4: [
    'patient.view', 'blockchain.view'
  ],
  // Data Manager (role_id: 5) — Encrypted data, reports, audit
  5: [
    'patient.view', 'reports.view', 'audit.view', 'blockchain.view'
  ],
  // ME Officer (role_id: 6) — Reports only
  6: [
    'reports.view', 'blockchain.view'
  ],
};

/**
 * Permission denied log storage (in-memory blockchain of denied actions)
 */
const deniedActionLog = [];

/**
 * Check if a user role has permission to perform a specific action.
 * 
 * @param {number} roleId - The user's role ID
 * @param {string} permissionCode - The permission code to check
 * @returns {Object} { allowed: boolean, status: string, message: string }
 */
function checkPermission(roleId, permissionCode) {
  const allowedPermissions = ROLE_PERMISSIONS[roleId] || [];
  
  if (allowedPermissions.includes(permissionCode)) {
    return {
      allowed: true,
      status: 'ACCESS_GRANTED',
      message: 'Action authorized by smart contract'
    };
  }

  return {
    allowed: false,
    status: 'ACCESS_DENIED',
    message: 'Unauthorized action rejected by smart contract'
  };
}

/**
 * Authorize an action — throws if denied, returns true if allowed.
 * 
 * @param {number} roleId - The user's role ID
 * @param {string} permissionCode - The permission code to check
 * @param {Object} userInfo - { userId, username } for logging
 * @throws {Error} If action is denied
 * @returns {boolean} true if authorized
 */
function authorizeAction(roleId, permissionCode, userInfo = {}) {
  const result = checkPermission(roleId, permissionCode);
  
  if (!result.allowed) {
    // Record the denied action
    denyAction({
      action: permissionCode,
      user: userInfo.username || 'unknown',
      userId: userInfo.userId || null,
      roleId: roleId,
      attemptedOperation: permissionCode,
      timestamp: new Date().toISOString()
    });
    
    const error = new Error(result.message);
    error.statusCode = 403;
    error.status = 'ACCESS_DENIED';
    throw error;
  }
  
  return true;
}

/**
 * Record a denied action in the blockchain audit log.
 * 
 * @param {Object} details - { action, user, userId, roleId, attemptedOperation, timestamp }
 * @returns {Object} The recorded denial entry
 */
function denyAction(details = {}) {
  const entry = {
    id: deniedActionLog.length + 1,
    type: 'ACCESS_DENIED',
    action: details.action || 'UNKNOWN',
    user: details.user || 'unknown',
    userId: details.userId || null,
    roleId: details.roleId || null,
    attemptedOperation: details.attemptedOperation || 'UNKNOWN',
    timestamp: details.timestamp || new Date().toISOString(),
    hash: crypto.createHash('sha256')
      .update(`${details.action}|${details.user}|${details.timestamp}`)
      .digest('hex')
  };
  
  deniedActionLog.push(entry);
  
  // Also add to in-memory blockchain transactions if available
  try {
    const chain = require('./chain');
    // Fire-and-forget: log to blockchain if possible
    chain.addTransaction({
      tx_type: 'ACCESS_DENIED',
      user_id: details.userId,
      patient_id: null,
      payload: {
        action: details.action,
        user: details.user,
        attemptedOperation: details.attemptedOperation,
        timestamp: details.timestamp
      }
    }).catch(() => {});
  } catch (e) {
    // Chain not available, denial is still logged in memory
  }
  
  return entry;
}

/**
 * Get the full denied action log.
 * @returns {Array} List of denied action entries
 */
function getDeniedActionLog() {
  return [...deniedActionLog];
}

/**
 * Express middleware to check permission via smart contract.
 * 
 * @param {string} permissionCode - The permission code required
 * @returns {Function} Express middleware
 */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: 'ACCESS_DENIED',
        message: 'Authentication required'
      });
    }

    try {
      authorizeAction(user.roleId, permissionCode, {
        userId: user.userId,
        username: user.username || `user_${user.userId}`
      });
      next();
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        status: error.status || 'ACCESS_DENIED',
        message: error.message,
        attemptedOperation: permissionCode
      });
    }
  };
}

module.exports = {
  checkPermission,
  authorizeAction,
  denyAction,
  getDeniedActionLog,
  requirePermission,
  ROLE_PERMISSIONS
};

