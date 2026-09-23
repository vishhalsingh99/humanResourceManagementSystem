import bcryptjs from 'bcryptjs';
import { masterPool as pool } from '../config/databases.js';

class User {
  // Get all users
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, role_id, employee_id, login_id, tenant_id, tenant_database, onboarding_completed, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to fetch users: ' + error.message);
    }
  }

  // Get user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, role_id, employee_id, login_id, tenant_id, tenant_database, onboarding_completed, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  static async findByIdWithPassword(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  // Get user by email (including password for authentication)
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ? OR login_id = ?',
        [email, email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  static async findByLoginId(loginId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE login_id = ? OR email = ?',
        [loginId, loginId]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  static async findByEmployeeId(employeeId , tenantId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE employee_id = ? AND tenant_id = ?',
        [employeeId, tenantId]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch employee user: ' + error.message);
    }
  }

  static async findByEmployeeIds(employeeIds = [], tenantId) {
    try {
      const ids = employeeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
      if (!ids.length || !tenantId) return [];
      const placeholders = ids.map(() => '?').join(', ');
      const [rows] = await pool.execute(
        `SELECT * FROM users WHERE employee_id IN (${placeholders}) AND tenant_id = ?`,
        [...ids, tenantId]
      );
      return rows;
    } catch (error) {
      throw new Error('Failed to fetch employee users: ' + error.message);
    }
  }

  static async findByLoginIdOnly(loginId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE login_id = ?',
        [loginId]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  static async findByLoginIdForTenant(loginId, tenantId, options = {}) {
    try {
      const { excludeUserId = null } = options;
      let query = 'SELECT * FROM users WHERE login_id = ? AND tenant_id = ?';
      const params = [loginId, tenantId];

      // Used by employee update so the current employee can keep their own login ID.
      if (excludeUserId) {
        query += ' AND id <> ?';
        params.push(excludeUserId);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch tenant login: ' + error.message);
    }
  }

  static async findByEmailOnly(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const {
        email,
        password,
        role = 'admin',
        employeeId = null,
        loginId = null,
        tenantId = null,
        tenantDatabase = null,
        onboardingCompleted = false,
        roleId = null
      } = userData;

      // Hash password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      const [result] = await pool.execute(
        `INSERT INTO users (
          name,
          email,
          password,
          role,
          role_id,
          employee_id,
          login_id,
          tenant_id,
          tenant_database,
          onboarding_completed,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userData.name, email, hashedPassword, role, roleId, employeeId, loginId, tenantId, tenantDatabase, onboardingCompleted]
      );

      return {
        id: result.insertId,
        name: userData.name,
        email,
        role,
        roleId,
        employeeId,
        loginId,
        tenantId,
        tenantDatabase,
        onboardingCompleted,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  static async createWithHashedPassword(userData) {
    try {
      const { name, email, password, role = 'admin' } = userData;

      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [name, email, password, role]
      );

      return {
        id: result.insertId,
        name,
        email,
        role,
        tenantId: null,
        tenantDatabase: null,
        onboardingCompleted: false,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  static async createPendingSignup(userData, otp) {
    try {
      const { name, email, password, role = 'admin' } = userData;
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await pool.execute(
        `INSERT INTO pending_signups (name, email, password, role, otp, otp_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password = VALUES(password),
          role = VALUES(role),
          otp = VALUES(otp),
          otp_expires_at = VALUES(otp_expires_at),
          updated_at = NOW()`,
        [name, email, hashedPassword, role, otp, expiresAt]
      );

      return true;
    } catch (error) {
      throw new Error('Failed to save pending signup: ' + error.message);
    }
  }

  static async verifyPendingSignup(email, otp) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM pending_signups WHERE email = ?',
        [email]
      );

      if (!rows[0]) {
        return { valid: false, message: 'Signup request not found' };
      }

      const pendingSignup = rows[0];

      if (new Date() > new Date(pendingSignup.otp_expires_at)) {
        return { valid: false, message: 'OTP has expired' };
      }

      if (pendingSignup.otp !== otp) {
        return { valid: false, message: 'Invalid OTP' };
      }

      return {
        valid: true,
        message: 'OTP verified successfully',
        pendingSignup
      };
    } catch (error) {
      throw new Error('Failed to verify signup OTP: ' + error.message);
    }
  }

  static async deletePendingSignup(email) {
    try {
      await pool.execute('DELETE FROM pending_signups WHERE email = ?', [email]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete pending signup: ' + error.message);
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const { name, email, password, role, roleId = null, employeeId = null, loginId = null } = userData;
      let query = 'UPDATE users SET name = ?, email = ?, role = ?, role_id = ?, employee_id = ?, login_id = ?, updated_at = NOW()';
      let params = [name, email, role, roleId, employeeId, loginId];

      if (password) {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);
        query = 'UPDATE users SET name = ?, email = ?, password = ?, role = ?, role_id = ?, employee_id = ?, login_id = ?, updated_at = NOW()';
        params = [name, email, hashedPassword, role, roleId, employeeId, loginId];
      }

      query += ' WHERE id = ?';
      params.push(id);

      await pool.execute(query, params);

      return {
        id,
        name,
        email,
        role,
        roleId,
        employeeId,
        loginId,
        updated_at: new Date()
      };
    } catch (error) {
      throw new Error('Failed to update user: ' + error.message);
    }
  }

  static async attachTenant(id, tenantId, tenantDatabase) {
    try {
      await pool.execute(
        'UPDATE users SET tenant_id = ?, tenant_database = ?, onboarding_completed = TRUE, updated_at = NOW() WHERE id = ?',
        [tenantId, tenantDatabase, id]
      );

      return this.findById(id);
    } catch (error) {
      throw new Error('Failed to attach tenant: ' + error.message);
    }
  }

  static async assignRoleToEmployee(employeeId, tenantId, roleId) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET role_id = ?, updated_at = NOW() WHERE employee_id = ? AND tenant_id = ?',
        [roleId, employeeId, tenantId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to assign employee role: ' + error.message);
    }
  }

  // Update the login account's status for a given employee, scoped to their tenant
  static async updateStatusByEmployeeId(employeeId, tenantId, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET status = ?, updated_at = NOW() WHERE employee_id = ? AND tenant_id = ?',
        [status, employeeId, tenantId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update employee login status: ' + error.message);
    }
  }

  // Delete user
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  }

  // Generate OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Set OTP for user
  static async setOTP(email, otp) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await pool.execute(
        'UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?',
        [otp, expiresAt, email]
      );
      return true;
    } catch (error) {
      throw new Error('Failed to set OTP: ' + error.message);
    }
  }

  // Verify OTP
  static async verifyOTP(email, otp) {
    try {
      const [rows] = await pool.execute(
        'SELECT otp, otp_expires_at FROM users WHERE email = ?',
        [email]
      );

      if (!rows[0]) {
        return { valid: false, message: 'User not found' };
      }

      const { otp: storedOTP, otp_expires_at } = rows[0];

      if (!storedOTP || !otp_expires_at) {
        return { valid: false, message: 'No OTP found' };
      }

      if (new Date() > new Date(otp_expires_at)) {
        return { valid: false, message: 'OTP has expired' };
      }

      if (storedOTP !== otp) {
        return { valid: false, message: 'Invalid OTP' };
      }

      // Clear OTP after successful verification
      await pool.execute(
        'UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = ?',
        [email]
      );

      return { valid: true, message: 'OTP verified successfully' };
    } catch (error) {
      throw new Error('Failed to verify OTP: ' + error.message);
    }
  }

  // Reset password
  static async resetPassword(email, newPassword) {
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);

      await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, email]
      );

      return true;
    } catch (error) {
      throw new Error('Failed to reset password: ' + error.message);
    }
  }

  static async updatePassword(id, hashedPassword) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update password: ' + error.message);
    }
  }

  // Update user email
  static async updateEmail(userId, newEmail) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?',
        [newEmail, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update email: ' + error.message);
    }
  }
}

export default User;