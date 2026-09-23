import { pool, dbConfig } from '../config/databases.js';
import { DEFAULT_PERMISSIONS, EMPLOYEE_DEFAULT_PERMISSIONS } from '../config/rbac.js';

const masterDatabase = String(dbConfig.database || 'hrsystem').replace(/`/g, '``');

const toApiRole = (role = {}) => ({
  id: role.id,
  name: role.name,
  description: role.description || '',
  isSystem: Boolean(role.is_system || role.isSystem),
  userCount: Number(role.user_count || role.userCount || 0),
  status: role.status || 'Active',
  createdBy: role.created_by || role.createdBy,
  createdAt: role.created_at,
  updatedAt: role.updated_at,
  permissions: role.permissions || [],
});

class Role {
  static async ensureDefaults() {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const [module, action, permissionKey, description] of DEFAULT_PERMISSIONS) {
        await connection.execute(
          `INSERT INTO permissions (module, action, permission_key, description, created_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE module = VALUES(module), action = VALUES(action), description = VALUES(description)`,
          [module, action, permissionKey, description]
        );
      }

      const [employeeRoleRows] = await connection.execute(
        `SELECT id FROM roles WHERE name = 'Employee' LIMIT 1`
      );

      let employeeRoleId = employeeRoleRows[0]?.id;
      if (!employeeRoleId) {
        const [result] = await connection.execute(
          `INSERT INTO roles (name, description, is_system, created_at, updated_at)
           VALUES ('Employee', 'Default employee access', TRUE, NOW(), NOW())`
        );
        employeeRoleId = result.insertId;
      }

      await connection.execute(
        `DELETE role_permissions
         FROM role_permissions
         INNER JOIN permissions ON permissions.id = role_permissions.permission_id
         WHERE role_permissions.role_id = ? AND permissions.permission_key = 'attendance.mark'`,
        [employeeRoleId]
      );

      const placeholders = EMPLOYEE_DEFAULT_PERMISSIONS.map(() => '?').join(', ');
      const [permissions] = await connection.execute(
        `SELECT id FROM permissions WHERE permission_key IN (${placeholders})`,
        EMPLOYEE_DEFAULT_PERMISSIONS
      );

      for (const permission of permissions) {
        await connection.execute(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
          [employeeRoleId, permission.id]
        );
      }

      await connection.commit();
      return employeeRoleId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll() {
    await this.ensureDefaults();
    const [rows] = await pool.execute(
      `SELECT roles.*, COUNT(users.id) AS user_count
       FROM roles
       LEFT JOIN \`${masterDatabase}\`.users users
        ON users.role_id = roles.id
        AND users.tenant_database = DATABASE()
        AND users.status <> 'inactive'
       GROUP BY roles.id
       ORDER BY roles.is_system DESC, roles.name ASC`
    );
    return rows.map(toApiRole);
  }

  static async findById(id) {
    await this.ensureDefaults();
    const [rows] = await pool.execute('SELECT * FROM roles WHERE id = ? LIMIT 1', [id]);
    if (!rows[0]) return null;
    const permissions = await this.getPermissions(id);
    return toApiRole({ ...rows[0], permissions });
  }

  static async findByName(name) {
    const [rows] = await pool.execute('SELECT * FROM roles WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
    return rows[0] ? toApiRole(rows[0]) : null;
  }

  static async findEmployeeRole() {
    const id = await this.ensureDefaults();
    return this.findById(id);
  }

  static async getPermissions(roleId) {
    const [rows] = await pool.execute(
      `SELECT permissions.*
       FROM role_permissions
       INNER JOIN permissions ON permissions.id = role_permissions.permission_id
       WHERE role_permissions.role_id = ?
       ORDER BY permissions.module ASC, permissions.action ASC`,
      [roleId]
    );
    return rows.map((permission) => permission.permission_key);
  }

  static async getPermissionDetails(roleId) {
    const [rows] = await pool.execute(
      `SELECT permissions.*
       FROM role_permissions
       INNER JOIN permissions ON permissions.id = role_permissions.permission_id
       WHERE role_permissions.role_id = ?
       ORDER BY permissions.module ASC, permissions.action ASC`,
      [roleId]
    );
    return rows.map((permission) => ({
      id: permission.id,
      module: permission.module,
      action: permission.action,
      permissionKey: permission.permission_key,
      description: permission.description,
    }));
  }

  static async create({ name, description = '', permissions = [], createdBy = null }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute('SELECT id FROM roles WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
      if (existing[0]) {
        const error = new Error('Role name already exists');
        error.statusCode = 409;
        throw error;
      }

      const [result] = await connection.execute(
        `INSERT INTO roles (name, description, is_system, created_by, created_at, updated_at)
         VALUES (?, ?, FALSE, ?, NOW(), NOW())`,
        [name, description, createdBy]
      );

      await this.replacePermissions(result.insertId, permissions, connection);
      await connection.commit();
      return this.findById(result.insertId); 
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, { name, description = '', permissions = [] }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [roles] = await connection.execute('SELECT * FROM roles WHERE id = ? LIMIT 1', [id]);
      const role = roles[0];
      if (!role) {
        const error = new Error('Role not found');
        error.statusCode = 404;
        throw error;
      }
      if (role.is_system) {
        const error = new Error('Protected system roles cannot be modified');
        error.statusCode = 403;
        throw error;
      }

      const [duplicates] = await connection.execute(
        'SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
        [name, id]
      );
      if (duplicates[0]) {
        const error = new Error('Role name already exists');
        error.statusCode = 409;
        throw error;
      }

      await connection.execute(
        'UPDATE roles SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
        [name, description, id]
      );
      await this.replacePermissions(id, permissions, connection);
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async replacePermissions(roleId, permissionKeys = [], connection = pool) {
    const uniqueKeys = [...new Set(permissionKeys.map((key) => String(key || '').trim()).filter(Boolean))];
    await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    if (!uniqueKeys.length) return;

    const placeholders = uniqueKeys.map(() => '?').join(', ');
    const [permissions] = await connection.execute(
      `SELECT id, permission_key FROM permissions WHERE permission_key IN (${placeholders})`,
      uniqueKeys
    );

    if (permissions.length !== uniqueKeys.length) {
      const foundKeys = new Set(permissions.map((permission) => permission.permission_key));
      const missing = uniqueKeys.filter((key) => !foundKeys.has(key));
      const error = new Error(`Permission not found: ${missing.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    for (const permission of permissions) {
      await connection.execute(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId, permission.id]
      );
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [roles] = await connection.execute('SELECT * FROM roles WHERE id = ? LIMIT 1', [id]);
      const role = roles[0];
      if (!role) {
        const error = new Error('Role not found');
        error.statusCode = 404;
        throw error;
      }
      if (role.is_system) {
        const error = new Error('Protected system roles cannot be deleted');
        error.statusCode = 403;
        throw error;
      }

      const [assigned] = await connection.execute(
        `SELECT COUNT(*) AS count
         FROM \`${masterDatabase}\`.users
         WHERE role_id = ? AND tenant_database = DATABASE() AND status <> 'inactive'`,
        [id]
      );
      if (Number(assigned[0]?.count || 0) > 0) {
        const error = new Error('Cannot delete role while it is assigned to employees.');
        error.statusCode = 409;
        throw error;
      }

      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      await connection.execute('DELETE FROM roles WHERE id = ?', [id]);
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default Role;