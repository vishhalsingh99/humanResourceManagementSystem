import jwt from 'jsonwebtoken';
import User from '../../repositories/user.repository.js';
import { JWT_SECRET } from '../../middlewares/authe.js';
import SuperAdmin from './superAdmin.repository.js';
import { ApiError } from '../../utils/ApiError.js';

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getRequestMeta = (req) => ({
  ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null,
  browser: req.headers['user-agent'] || null,
});

const logAudit = async (req, companyId, action) => {
  const { ip, browser } = getRequestMeta(req);
  await SuperAdmin.insertAuditLog({ companyId, superAdminId: req.user?.id, action, ip, browser });
};

const normalizeCompany = (row) => ({
  id: row.id,
  companyName: row.company_name,
  companyAdmin: row.admin_name,
  adminEmail: row.admin_email,
  email: row.company_email || row.admin_email,
  plan: row.plan_id || row.subscription_plan || 'basic',
  employees: Number(row.employee_count || 0),
  databaseName: row.database_name,
  logo: row.logo_preview,
  status: row.status,
  subscriptionStatus: row.subscription_status || 'active',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getCompaniesRows = async (filters) => {
  const rows = await SuperAdmin.findCompanies(filters);
  return Promise.all(rows.map(async (row) => normalizeCompany({
    ...row,
    employee_count: await SuperAdmin.countTenantEmployees(row.database_name),
  })));
};

export const getDashboardService = async () => {
  const companies = await getCompaniesRows();
  const auditRows = await SuperAdmin.findRecentAuditLogs(5);

  const totalEmployees = companies.reduce((total, company) => total + company.employees, 0);
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((company) => company.status === 'active').length,
    inactiveCompanies: companies.filter((company) => ['inactive', 'suspended'].includes(company.status)).length,
    trialCompanies: companies.filter((company) => company.plan === 'trial').length,
    totalEmployees,
    activeSubscriptions: companies.filter((company) => company.subscriptionStatus === 'active').length,
    expiredSubscriptions: companies.filter((company) => ['inactive', 'cancelled', 'expired'].includes(company.subscriptionStatus)).length,
    monthlyRevenue: 0,
  };

  return {
    stats,
    recentCompanies: companies.slice(0, 5),
    recentAuditLogs: auditRows,
  };
};

export const getCompaniesService = async (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const companies = await getCompaniesRows({
    search: String(query.search || '').trim(),
    status: String(query.status || '').trim(),
    plan: String(query.plan || '').trim(),
    sort: String(query.sort || 'created_at'),
    order: String(query.order || 'desc'),
  });
  const start = (page - 1) * limit;

  return {
    data: companies.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: companies.length,
      totalPages: Math.max(Math.ceil(companies.length / limit), 1),
    },
  };
};

export const getCompanyService = async (id) => {
  const companies = await getCompaniesRows();
  const company = companies.find((item) => item.id === Number(id));
  if (!company) throw new ApiError(404, 'Company not found');
  return company;
};

export const updateCompanyStatusService = async (req, id, status) => {
  const updated = await SuperAdmin.updateTenantStatus(id, status);
  if (!updated) throw new ApiError(404, 'Company not found');

  await logAudit(req, id, status === 'active' ? 'ACTIVATE_COMPANY' : 'SUSPEND_COMPANY');
  return { message: 'Company status updated successfully' };
};

export const deleteCompanyService = async (req, id) => {
  const updated = await SuperAdmin.deactivateTenant(id);
  if (!updated) throw new ApiError(404, 'Company not found');

  await logAudit(req, id, 'DELETE_COMPANY');
  return { message: 'Company deactivated successfully' };
};

export const impersonateCompanyAdminService = async (req, id) => {
  const company = await SuperAdmin.findTenantById(id);
  if (!company) throw new ApiError(404, 'Company not found');
  if (company.status !== 'active') throw new ApiError(403, 'Only active companies can be impersonated');

  const admin = await User.findById(company.admin_user_id);
  if (!admin || admin.role !== 'admin') {
    throw new ApiError(404, 'Company admin not found');
  }

  const superAdminId = req.user?.id || 1;
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: 'admin',
      tenantId: company.id,
      database: company.database_name,
      tenantDatabase: company.database_name,
      isImpersonation: true,
      superAdminId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await logAudit(req, company.id, 'LOGIN_AS_ADMIN');

  return {
    message: 'Impersonation token generated successfully',
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      tenantId: company.id,
      tenantDatabase: company.database_name,
      onboarding_completed: true,
      isImpersonation: true,
      superAdminId,
    },
    company: normalizeCompany({ ...company, admin_name: admin.name, admin_email: admin.email }),
  };
};

export const updateSubscriptionService = async (req, id, planId, status = 'active') => {
  const company = await SuperAdmin.findTenantById(id);
  if (!company) throw new ApiError(404, 'Company not found');

  await SuperAdmin.upsertSubscription({
    tenantId: company.id,
    adminUserId: company.admin_user_id,
    planId,
    status,
  });

  await logAudit(req, company.id, 'UPDATE_SUBSCRIPTION');
  return { message: 'Subscription updated successfully' };
};

export const getAuditLogsService = () => SuperAdmin.findRecentAuditLogs(200);

export const getGlobalSettingsService = async () => {
  const settings = await SuperAdmin.getGlobalSettings();
  return {
    applicationName: settings.application_name || 'HRMS',
    applicationLogo: settings.application_logo || '',
    smtpSettings: parseJson(settings.smtp_settings, {}),
    storageSettings: parseJson(settings.storage_settings, {}),
    jwtExpiry: settings.jwt_expiry || '7d',
    maintenanceMode: Boolean(settings.maintenance_mode),
    trialDays: Number(settings.trial_days || 14),
  };
};

export const updateGlobalSettingsService = async (body) => {
  const {
    applicationName = 'HRMS',
    applicationLogo = '',
    smtpSettings = {},
    storageSettings = {},
    jwtExpiry = '7d',
    maintenanceMode = false,
    trialDays = 14,
  } = body;

  await SuperAdmin.upsertGlobalSettings({
    applicationName,
    applicationLogo,
    smtpSettings,
    storageSettings,
    jwtExpiry,
    maintenanceMode,
    trialDays,
  });

  return { message: 'Global settings updated successfully' };
};
