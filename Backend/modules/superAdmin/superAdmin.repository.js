import { masterPool, getTenantPool } from '../../config/databases.js';

const ALLOWED_COMPANY_SORTS = new Set(['company_name', 'created_at', 'status', 'subscription_plan', 'database_name']);

class SuperAdmin {
  static async countTenantEmployees(databaseName) {
    if (!databaseName) return 0;
    try {
      const tenantPool = getTenantPool(databaseName);
      const [rows] = await tenantPool.execute('SELECT COUNT(*) AS count FROM employees');
      return Number(rows[0]?.count || 0);
    } catch (error) {
      console.error(`Unable to count employees for ${databaseName}:`, error.message);
      return 0;
    }
  }

  static async findCompanies({ search = '', status = '', plan = '', sort = 'created_at', order = 'desc' } = {}) {
    const filters = [];
    const params = [];

    if (search) {
      filters.push(`(
        tenants.company_name LIKE ?
        OR tenants.database_name LIKE ?
        OR users.name LIKE ?
        OR users.email LIKE ?
        OR tenant_companies.email LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    if (status) {
      filters.push('tenants.status = ?');
      params.push(status);
    }

    if (plan) {
      filters.push('(tenant_subscriptions.plan_id = ? OR tenants.subscription_plan = ?)');
      params.push(plan, plan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sortColumn = ALLOWED_COMPANY_SORTS.has(sort) ? sort : 'created_at';
    const sortDirection = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const [rows] = await masterPool.execute(
      `SELECT
        tenants.*,
        users.name AS admin_name,
        users.email AS admin_email,
        tenant_companies.email AS company_email,
        tenant_companies.logo_preview,
        tenant_subscriptions.plan_id,
        tenant_subscriptions.status AS subscription_status
       FROM tenants
       LEFT JOIN users ON users.id = tenants.admin_user_id
       LEFT JOIN tenant_companies ON tenant_companies.tenant_id = tenants.id
       LEFT JOIN tenant_subscriptions ON tenant_subscriptions.tenant_id = tenants.id
       ${whereClause}
       ORDER BY tenants.${sortColumn} ${sortDirection}`,
      params
    );

    return rows;
  }

  static async findRecentAuditLogs(limit) {
    const [rows] = await masterPool.execute(
      `SELECT logs.*, tenants.company_name
       FROM super_admin_audit_logs logs
       LEFT JOIN tenants ON tenants.id = logs.company_id
       ORDER BY logs.login_time DESC
       LIMIT ${Number(limit)}`
    );
    return rows;
  }

  static async insertAuditLog({ companyId, superAdminId, action, ip, browser }) {
    await masterPool.execute(
      `INSERT INTO super_admin_audit_logs (
        company_id,
        super_admin_id,
        action,
        ip_address,
        browser,
        login_time
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [companyId || null, superAdminId || 1, action, ip, browser]
    );
  }

  static async updateTenantStatus(id, status) {
    const [result] = await masterPool.execute(
      'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async deactivateTenant(id) {
    const [result] = await masterPool.execute(
      "UPDATE tenants SET status = 'inactive', updated_at = NOW() WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findTenantById(id) {
    const [rows] = await masterPool.execute('SELECT * FROM tenants WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async upsertSubscription({ tenantId, adminUserId, planId, status }) {
    await masterPool.execute(
      `INSERT INTO tenant_subscriptions (
        tenant_id,
        admin_user_id,
        plan_id,
        status,
        started_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        plan_id = VALUES(plan_id),
        status = VALUES(status),
        updated_at = NOW()`,
      [tenantId, adminUserId, planId, status]
    );
    await masterPool.execute(
      'UPDATE tenants SET subscription_plan = ?, updated_at = NOW() WHERE id = ?',
      [planId, tenantId]
    );
  }

  static async getGlobalSettings() {
    const [rows] = await masterPool.execute('SELECT * FROM global_settings WHERE id = 1 LIMIT 1');
    return rows[0] || {};
  }

  static async upsertGlobalSettings({
    applicationName,
    applicationLogo,
    smtpSettings,
    storageSettings,
    jwtExpiry,
    maintenanceMode,
    trialDays,
  }) {
    await masterPool.execute(
      `INSERT INTO global_settings (
        id,
        application_name,
        application_logo,
        smtp_settings,
        storage_settings,
        jwt_expiry,
        maintenance_mode,
        trial_days,
        updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        application_name = VALUES(application_name),
        application_logo = VALUES(application_logo),
        smtp_settings = VALUES(smtp_settings),
        storage_settings = VALUES(storage_settings),
        jwt_expiry = VALUES(jwt_expiry),
        maintenance_mode = VALUES(maintenance_mode),
        trial_days = VALUES(trial_days),
        updated_at = NOW()`,
      [
        applicationName,
        applicationLogo,
        JSON.stringify(smtpSettings || {}),
        JSON.stringify(storageSettings || {}),
        jwtExpiry,
        Boolean(maintenanceMode),
        Number(trialDays || 14),
      ]
    );
  }
}

export default SuperAdmin;
