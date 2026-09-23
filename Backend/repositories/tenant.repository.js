import { masterPool } from '../config/databases.js';

const toApiTenant = (tenant = {}) => ({
  id: tenant.id,
  adminUserId: tenant.admin_user_id,
  companyName: tenant.company_name,
  databaseName: tenant.database_name,
  subscriptionPlan: tenant.subscription_plan,
  status: tenant.status,
  createdAt: tenant.created_at,
  updatedAt: tenant.updated_at
});

const toApiOnboarding = (rows = {}) => ({
  profile_completed: Boolean(rows.profile_id),
  company_completed: Boolean(rows.company_id),
  subscription_completed: Boolean(rows.subscription_id),
  onboarding_completed: Boolean(rows.id && rows.database_name),
  profile: rows.profile_id ? {
    firstName: rows.first_name || '',
    lastName: rows.last_name || '',
    email: rows.profile_email || '',
    mobile: rows.profile_mobile || '',
    address: rows.profile_address || '',
    city: rows.city || '',
    state: rows.profile_state || '',
    district: rows.profile_district || '',
    state_id: rows.profile_state_id || '',
    district_id: rows.profile_district_id || '',
    pincode: rows.profile_pincode || ''
  } : {},
  company: rows.company_id ? {
    companyName: rows.company_company_name || rows.company_name || '',
    email: rows.company_email || '',
    mobile: rows.company_mobile || '',
    pincode: rows.company_pincode || '',
    website: rows.website || '',
    state: rows.company_state || '',
    district: rows.company_district || '',
    state_id: rows.company_state_id || '',
    district_id: rows.company_district_id || '',
    address: rows.company_address || '',
    logoPreview: rows.logo_preview || '',
    emailVerified: Boolean(rows.company_email)
  } : {},
  subscription: rows.plan_id || rows.subscription_plan || 'basic'
});

class Tenant {
  static async findByAdminUserId(adminUserId) {
    const [rows] = await masterPool.execute(
      'SELECT * FROM tenants WHERE admin_user_id = ? LIMIT 1',
      [adminUserId]
    );

    return rows[0] ? toApiTenant(rows[0]) : null;
  }

  static async upsertTenant(adminUserId, payload) {
    const { companyName, databaseName, subscriptionPlan } = payload;

    await masterPool.execute(
      `INSERT INTO tenants (
        admin_user_id,
        company_name,
        database_name,
        subscription_plan,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        subscription_plan = VALUES(subscription_plan),
        status = 'active',
        updated_at = NOW()`,
      [adminUserId, companyName, databaseName, subscriptionPlan]
    );

    return this.findByAdminUserId(adminUserId);
  }

  static async upsertProfile(tenantId, adminUserId, profile = {}) {
    await masterPool.execute(
      `INSERT INTO tenant_profiles (
        tenant_id,
        admin_user_id,
        first_name,
        last_name,
        email,
        mobile,
        address,
        city,
        state,
        district,
        state_id,
        district_id,
        pincode,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        mobile = VALUES(mobile),
        address = VALUES(address),
        city = VALUES(city),
        state = VALUES(state),
        district = VALUES(district),
        state_id = VALUES(state_id),
        district_id = VALUES(district_id),
        pincode = VALUES(pincode),
        updated_at = NOW()`,
      [
        tenantId,
        adminUserId,
        profile.firstName || null,
        profile.lastName || null,
        profile.email || null,
        profile.mobile || null,
        profile.address || null,
        profile.city || null,
        profile.state || null,
        profile.district || null,
        profile.state_id || null,
        profile.district_id || null,
        profile.pincode || null
      ]
    );
  }

  static async upsertCompany(tenantId, adminUserId, company = {}) {
    await masterPool.execute(
      `INSERT INTO tenant_companies (
        tenant_id,
        admin_user_id,
        company_name,
        email,
        mobile,
        pincode,
        website,
        state,
        district,
        state_id,
        district_id,
        address,
        logo_preview,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        email = VALUES(email),
        mobile = VALUES(mobile),
        pincode = VALUES(pincode),
        website = VALUES(website),
        state = VALUES(state),
        district = VALUES(district),
        state_id = VALUES(state_id),
        district_id = VALUES(district_id),
        address = VALUES(address),
        logo_preview = VALUES(logo_preview),
        updated_at = NOW()`,
      [
        tenantId,
        adminUserId,
        company.companyName,
        company.email || null,
        company.mobile || null,
        company.pincode || null,
        company.website || null,
        company.state || null,
        company.district || null,
        company.state_id || null,
        company.district_id || null,
        company.address || null,
        company.logoPreview || null
      ]
    );
  }

  static async upsertSubscription(tenantId, adminUserId, planId) {
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
      VALUES (?, ?, ?, 'active', NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        plan_id = VALUES(plan_id),
        status = 'active',
        updated_at = NOW()`,
      [tenantId, adminUserId, planId]
    );
  }

  static async upsertOnboarding(adminUserId, payload) {
    const tenant = await this.upsertTenant(adminUserId, payload);

    await this.upsertProfile(tenant.id, adminUserId, payload.profile);
    await this.upsertCompany(tenant.id, adminUserId, payload.company);
    await this.upsertSubscription(tenant.id, adminUserId, payload.subscriptionPlan);

    return tenant;
  }

  static async findOnboardingByTenantId(tenantId) {
    const [rows] = await masterPool.execute(
      `SELECT
        tenants.*,
        tenant_profiles.id AS profile_id,
        tenant_profiles.first_name,
        tenant_profiles.last_name,
        tenant_profiles.email AS profile_email,
        tenant_profiles.mobile AS profile_mobile,
        tenant_profiles.address AS profile_address,
        tenant_profiles.city,
        tenant_profiles.state AS profile_state,
        tenant_profiles.district AS profile_district,
        tenant_profiles.state_id AS profile_state_id,
        tenant_profiles.district_id AS profile_district_id,
        tenant_profiles.pincode AS profile_pincode,
        tenant_companies.id AS company_id,
        tenant_companies.company_name AS company_company_name,
        tenant_companies.email AS company_email,
        tenant_companies.mobile AS company_mobile,
        tenant_companies.pincode AS company_pincode,
        tenant_companies.website,
        tenant_companies.state AS company_state,
        tenant_companies.district AS company_district,
        tenant_companies.state_id AS company_state_id,
        tenant_companies.district_id AS company_district_id,
        tenant_companies.address AS company_address,
        tenant_companies.logo_preview,
        tenant_subscriptions.id AS subscription_id,
        tenant_subscriptions.plan_id
       FROM tenants
       LEFT JOIN tenant_profiles ON tenant_profiles.tenant_id = tenants.id
       LEFT JOIN tenant_companies ON tenant_companies.tenant_id = tenants.id
       LEFT JOIN tenant_subscriptions ON tenant_subscriptions.tenant_id = tenants.id
       WHERE tenants.id = ?
       LIMIT 1`,
      [tenantId]
    );

    return rows[0] ? toApiOnboarding(rows[0]) : null;
  }
}

export default Tenant;