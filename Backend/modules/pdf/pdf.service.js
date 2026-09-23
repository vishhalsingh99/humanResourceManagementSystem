import Tenant from '../../repositories/tenant.repository.js';
import CompanySettings from '../../repositories/companySettings.repository.js';
import EmployeeAttendanceSchedule from '../../repositories/employeeAttendanceSchedule.repository.js';
import * as salaryCalculator from '../../services/salaryCalculator.js';
import { ApiError } from '../../utils/ApiError.js';
import { renderEmployeeForm, renderEmployeeList, renderPayslip } from './pdf.templates.js';

const buildPublicFileUrl = (req, filePath) => {
  const normalizedPath = String(filePath || '').trim();
  if (!normalizedPath) return '';
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

  const relativePath = normalizedPath.replace(/^\/+/, '');
  return `${req.protocol}://${req.get('host')}/${relativePath}`;
};

// Resolve the tenant id from the logged-in user so every PDF can use the correct company branding.
const getTenantId = async (authUser) => {
  if (authUser?.tenantId || authUser?.tenant_id) {
    return authUser.tenantId || authUser.tenant_id;
  }

  if (authUser?.role !== 'admin') return null;

  const tenant = await Tenant.findByAdminUserId(authUser.id);
  return tenant?.id || null;
};

// Fetch the tenant company once per PDF request and pass the result into the renderer.
const getCompanyForRequest = async (req) => {
  const tenantId = await getTenantId(req.user);

  if (!tenantId) {
    throw new ApiError(428, 'Company onboarding is required before generating PDFs');
  }

  const onboarding = await Tenant.findOnboardingByTenantId(tenantId);

  if (!onboarding?.company) {
    throw new ApiError(404, 'Company onboarding not found');
  }

  return {
    ...onboarding.company,
    logoPreview: buildPublicFileUrl(req, onboarding.company.logoPreview),
  };
};

export const renderEmployeeFormPageService = async (req) => {
  if (!req.body?.employee) {
    throw new ApiError(400, 'Employee data is required');
  }

  const company = await getCompanyForRequest(req);
  const employee = { ...req.body.employee };
  const settings = await CompanySettings.getRaw();
  const schedule = employee.id
    ? await EmployeeAttendanceSchedule.findCurrent(employee.id)
    : null;
  employee.workSchedule = schedule || {
    startTime: String(settings.office_start_time || '').slice(0, 5),
    endTime: String(settings.office_end_time || '').slice(0, 5),
    effectiveFrom: employee.join_date || employee.joinDate || null,
  };

  return renderEmployeeForm(employee, company);
};

export const renderEmployeeListPageService = async (req) => {
  const employees = Array.isArray(req.body?.employees) ? req.body.employees : [];
  const company = await getCompanyForRequest(req);
  return renderEmployeeList(employees, company);
};

export const renderPayslipPageService = async (req) => {
  const isPrivileged = req.user?.permissions?.includes('payroll.view_all');
  const linkedEmployee = await salaryCalculator.getEmployeeForUser(req.user);

  if (!isPrivileged && Number(linkedEmployee?.id) !== Number(req.params.employeeId)) {
    throw new ApiError(403, 'You do not have access to this payslip');
  }

  const dashboard = await salaryCalculator.calculateSalary({
    employeeId: req.params.employeeId,
    month: req.query.month,
    year: req.query.year,
  });

  const company = await getCompanyForRequest(req);
  return renderPayslip(dashboard, company);
};
