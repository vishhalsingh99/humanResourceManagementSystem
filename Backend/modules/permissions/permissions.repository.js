import { pool } from '../../config/databases.js';

const toApiPermission = (permission = {}) => ({
  id: permission.id,
  module: permission.module,
  action: permission.action,
  permissionKey: permission.permission_key || permission.permissionKey,
  permission_key: permission.permission_key || permission.permissionKey,
  description: permission.description,
  createdAt: permission.created_at,
});

class Permission {
  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM permissions ORDER BY module ASC, action ASC'
    );
    return rows.map(toApiPermission);
  }

  static async findByKeys(permissionKeys = [], connection = pool) {
    if (!permissionKeys.length) return [];
    const placeholders = permissionKeys.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT * FROM permissions WHERE permission_key IN (${placeholders})`,
      permissionKeys
    );
    return rows;
  }
}

export default Permission;