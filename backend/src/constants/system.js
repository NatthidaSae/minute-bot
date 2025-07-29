/**
 * System constants for automated processes
 */

// System user ID for all automated meeting inserts
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

// System user details
const SYSTEM_USER = {
  id: SYSTEM_USER_ID,
  name: 'System',
  email: 'system@automated.local'
};

module.exports = {
  SYSTEM_USER_ID,
  SYSTEM_USER
};