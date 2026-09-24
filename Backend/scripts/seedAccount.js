import '../config/env.js';
import bcrypt from 'bcryptjs';
import { dbConfig, masterPool } from '../config/databases.js';
import { createTables } from '../db.js';

const account = {
  name: process.env.SEED_ACCOUNT_NAME || 'HRMS Admin',
  email: process.env.SEED_ACCOUNT_EMAIL || 'admin@example.com',
  password: process.env.SEED_ACCOUNT_PASSWORD || 'Admin@12345',
  companyName: process.env.SEED_COMPANY_NAME || 'Example Company',
};

export const seedAccount = async ({ initializeSchema = true, logCredentials = true } = {}) => {
  if (initializeSchema) {
    await createTables(masterPool, {
      includeMasterTables: true,
      includeTenantTables: true,
    });
  }

  const passwordHash = await bcrypt.hash(account.password, 10);
  await masterPool.execute(
    `INSERT INTO users (
      name, email, password, role, login_id, tenant_database,
      onboarding_completed, status, created_at, updated_at
    ) VALUES (?, ?, ?, 'admin', ?, ?, TRUE, 'active', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password = VALUES(password),
      role = 'admin',
      login_id = VALUES(login_id),
      tenant_database = VALUES(tenant_database),
      onboarding_completed = TRUE,
      status = 'active',
      updated_at = NOW()`,
    [account.name, account.email, passwordHash, account.email, dbConfig.database]
  );

  const [users] = await masterPool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [account.email]
  );
  const adminId = users[0]?.id;

  await masterPool.execute(
    `INSERT INTO tenants (
      admin_user_id, company_name, database_name, subscription_plan, status
    ) VALUES (?, ?, ?, 'basic', 'active')
    ON DUPLICATE KEY UPDATE
      company_name = VALUES(company_name),
      database_name = VALUES(database_name),
      status = 'active',
      updated_at = NOW()`,
    [adminId, account.companyName, dbConfig.database]
  );

  const [tenants] = await masterPool.execute(
    'SELECT id FROM tenants WHERE admin_user_id = ? LIMIT 1',
    [adminId]
  );
  const tenantId = tenants[0]?.id;

  await masterPool.execute(
    `INSERT INTO tenant_companies (tenant_id, admin_user_id, company_name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), updated_at = NOW()`,
    [tenantId, adminId, account.companyName]
  );

  await masterPool.execute(
    `INSERT INTO tenant_subscriptions (tenant_id, admin_user_id, plan_id, status)
     VALUES (?, ?, 'basic', 'active')
     ON DUPLICATE KEY UPDATE plan_id = 'basic', status = 'active', updated_at = NOW()`,
    [tenantId, adminId]
  );

  console.log(`Seeded account: ${account.email}`);
  console.log(`Company: ${account.companyName}`);
  if (logCredentials) {
    console.log(`Password: ${account.password}`);
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    await seedAccount();
  } catch (error) {
    console.error('Account seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await masterPool.end();
  }
}