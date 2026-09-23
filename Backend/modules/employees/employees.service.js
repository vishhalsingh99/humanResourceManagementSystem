import bcrypt from 'bcryptjs';
import Employee from '../../repositories/employee.repository.js';
import EmployeeAttendanceSchedule, { validateSchedule } from '../../repositories/employeeAttendanceSchedule.repository.js';
import CompanySettings from '../../repositories/companySettings.repository.js';
import User from '../../repositories/user.repository.js';
import EmailVerification from '../../repositories/emailVerification.repository.js';
import Tenant from '../../repositories/tenant.repository.js';
import Role from '../../repositories/role.repository.js';
import { getEmployeeLimitMessage, getSubscriptionPlan } from '../../config/subscriptionPlans.js';
import { sendWelcomeEmployeeEmail, sendPasswordResetEmail } from '../../utils/emailService.js';
import { ApiError } from '../../utils/ApiError.js';

const isDuplicateLoginError = (error) => (
  (error?.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error?.message || ''))
  && /login_id|unique_user_tenant_login_id/i.test(error?.message || '')
);

const isDuplicateEmailError = (error) => (
  (error?.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error?.message || ''))
  && /email/i.test(error?.message || '')
);

const duplicateLoginError = (companyId, employeeLoginId) => new ApiError(
  409,
  'Employee login ID already exists for this company',
  { code: 'EMPLOYEE_LOGIN_ID_EXISTS', company_id: companyId, employee_login_id: employeeLoginId }
);

const duplicateEmailError = (email) => new ApiError(
  409,
  'Employee email already has a login account',
  { code: 'EMPLOYEE_EMAIL_EXISTS', email }
);

const getRequestedEmployeeLoginId = (body = {}) => {
  const value = body.employee_login_id || body.loginId || body.login_id;
  return value ? String(value).trim() : '';
};

const getCompanyNameForRequest = async (tenantId) => {
  if (!tenantId) return 'your company';

  try {
    const onboarding = await Tenant.findOnboardingByTenantId(tenantId);
    return onboarding?.company?.companyName || 'your company';
  } catch (error) {
    console.error('Failed to load company name for email notification:', error.message);
    return 'your company';
  }
};

const logEmailFailure = (notificationName, result) => {
  if (result?.success) return;
  console.warn(`${notificationName} email was not sent: ${result?.message || 'Unknown email error'}`);
};

const getSchedulePayload = (body = {}, fallbackEffectiveFrom = null) => ({
  startTime: body.workStartTime || body.start_time,
  endTime: body.workEndTime || body.end_time,
  graceMinutes: body.graceMinutes ?? body.grace_minutes ?? 0,
  effectiveFrom: body.scheduleEffectiveFrom || body.effective_from || fallbackEffectiveFrom,
  effectiveTo: body.scheduleEffectiveTo || body.effective_to || null,
});

const hasSchedulePayload = (body = {}) => Boolean(
  body.workStartTime || body.start_time || body.workEndTime || body.end_time
);

export const getEmployeesService = async (statusFilter, companyId) => {
  const employees = await Employee.findAll(statusFilter);
  const users = await User.findByEmployeeIds(employees.map((employee) => employee.id), companyId);
  const usersByEmployeeId = new Map(users.map((user) => [Number(user.employee_id), user]));
  const roleIds = [...new Set(users.map((user) => Number(user.role_id)).filter(Boolean))];
  const roles = await Promise.all(roleIds.map((roleId) => Role.findById(roleId)));
  const rolesById = new Map(roles.filter(Boolean).map((role) => [Number(role.id), role]));
  const companySettings = await CompanySettings.getRaw();

  return Promise.all(employees.map(async (employee) => {
    const user = usersByEmployeeId.get(Number(employee.id));
    const role = rolesById.get(Number(user?.role_id));
    const schedule = await EmployeeAttendanceSchedule.findCurrent(employee.id);
    return {
      ...employee,
      workSchedule: schedule || {
        startTime: String(companySettings.office_start_time || '').slice(0, 5),
        endTime: String(companySettings.office_end_time || '').slice(0, 5),
        graceMinutes: Number(companySettings.grace_time || 0),
        effectiveFrom: employee.join_date ? String(employee.join_date).slice(0, 10) : null,
        status: 'DEFAULT',
      },
      roleId: user?.role_id || null,
      roleName: role?.name || null,
      permissions: role?.permissions || [],
    };
  }));
};

export const getMyProfileService = async (employeeId) => {
  if (!employeeId) {
    throw new ApiError(404, 'Employee profile is not linked to this login');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Employee profile not found');
  }

  return employee;
};

export const changePasswordService = async (authUser, { currentPassword, newPassword, confirmPassword }) => {
  const employeeId = authUser?.employeeId || authUser?.employee_id;

  if (!employeeId || authUser?.role !== 'employee') {
    throw new ApiError(403, 'Only employees can change their password here');
  }

  const user = await User.findByIdWithPassword(authUser.id);
  if (!user || user.role !== 'employee' || Number(user.employee_id) !== Number(employeeId)) {
    throw new ApiError(404, 'Employee login account not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(user.id, hashedPassword);

  return { message: 'Password changed successfully. Please use your new password the next time you sign in.' };
};

export const createEmployeeService = async (authUser, body, companyId) => {
  const { name, first_name, joinDate, join_date } = body;
  const email = String(body.email || '').trim().toLowerCase();
  const loginPassword = body.loginPassword || body.password;
  const requestedLoginId = getRequestedEmployeeLoginId(body);

  const employeeName = name || first_name;
  const employeeJoinDate = joinDate || join_date;
  const schedulePayload = hasSchedulePayload(body) ? getSchedulePayload(body, employeeJoinDate) : null;

  if (!companyId) {
    throw new ApiError(428, 'Company onboarding is required before creating employees');
  }

  if (schedulePayload) {
    try {
      validateSchedule(schedulePayload);
    } catch (error) {
      throw new ApiError(400, error.message);
    }
  }

  const emailVerified = await EmailVerification.isEmailVerified(email, 'employee_email');
  if (!emailVerified) {
    throw new ApiError(400, 'Employee email must be verified before creating account', {
      code: 'EMAIL_NOT_VERIFIED',
      email,
    });
  }

  try {
    const plan = getSubscriptionPlan(body.subscriptionPlan);

    if (plan.employeeLimit) {
      const employeeCount = await Employee.countAll();

      if (employeeCount >= plan.employeeLimit) {
        throw new ApiError(403, getEmployeeLimitMessage(plan), {
          code: 'EMPLOYEE_LIMIT_REACHED',
          plan: plan.name,
          employeeLimit: plan.employeeLimit,
          employeeCount,
          upgradeTo: plan.upgradeTo,
        });
      }
    }

    const employeeCode = body.employeeId || body.employee_id || await Employee.generateNextEmployeeId();
    const employeeLoginId = requestedLoginId || employeeCode;
    const requestedRoleId = Number(body.roleId || body.role_id);
    let roleId = Number.isFinite(requestedRoleId) && requestedRoleId > 0 ? requestedRoleId : null;

    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) throw new ApiError(404, 'Role not found');
    } else {
      const defaultRole = await Role.findEmployeeRole();
      roleId = defaultRole?.id;
    }

    // Login IDs are unique only inside a company/tenant. Another company may reuse the same ID.
    const existingLogin = await User.findByLoginIdForTenant(employeeLoginId, companyId);
    if (existingLogin) {
      throw duplicateLoginError(companyId, employeeLoginId);
    }

    const existingEmail = await User.findByEmailOnly(email);
    if (existingEmail) {
      throw duplicateEmailError(email);
    }

    const employee = await Employee.create({
      ...body,
      email,
      name: employeeName,
      employeeId: employeeCode,
      joinDate: employeeJoinDate,
    });

    if (hasSchedulePayload(body)) {
      await EmployeeAttendanceSchedule.saveForEmployee(employee.id, getSchedulePayload(body, employeeJoinDate));
    }

    try {
      await User.create({
        name: employee.name,
        email: employee.email,
        password: loginPassword,
        role: 'employee',
        roleId,
        employeeId: employee.id,
        loginId: employeeLoginId,
        tenantId: companyId,
        tenantDatabase: authUser.tenantDatabase || authUser.tenant_database,
        onboardingCompleted: true,
      });
    } catch (userCreateError) {
      await Employee.delete(employee.id);
      throw userCreateError;
    }

    const companyName = await getCompanyNameForRequest(companyId);
    const welcomeEmailResult = await sendWelcomeEmployeeEmail({
      email: employee.email,
      employeeName: employee.name,
      companyName,
      loginId: employeeLoginId,
      temporaryPassword: loginPassword,
    });
    logEmailFailure('Welcome employee', welcomeEmailResult);

    return employee;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (isDuplicateLoginError(err)) {
      throw duplicateLoginError(companyId, requestedLoginId || body.employeeId || body.employee_id);
    }
    if (isDuplicateEmailError(err)) {
      throw duplicateEmailError(email);
    }
    throw err;
  }
};

export const updateEmployeeService = async (authUser, employeeId, body, companyId) => {
  const { name, first_name, joinDate, join_date } = body;

  const employeeName = name || first_name;
  const employeeJoinDate = joinDate || join_date;

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const employeeCode = employee.employeeId || `EMP${String(employee.id).padStart(3, '0')}`;

  if (!companyId) {
    throw new ApiError(428, 'Company onboarding is required before updating employees');
  }

  if (hasSchedulePayload(body)) {
    try {
      validateSchedule(getSchedulePayload(body, employeeJoinDate));
    } catch (error) {
      throw new ApiError(400, error.message);
    }
  }

  const existingUser = await User.findByEmployeeId(employeeId, companyId);
  const nextLoginId = getRequestedEmployeeLoginId(body) || employeeCode;
  const nextPassword = body.loginPassword || body.password;

  try {
    // Keep the same company-scoped uniqueness rule when employee login IDs are edited.
    const duplicateLogin = await User.findByLoginIdForTenant(nextLoginId, companyId, {
      excludeUserId: existingUser?.id,
    });
    if (duplicateLogin) {
      throw duplicateLoginError(companyId, nextLoginId);
    }

    // Update employee only after all login validation has passed.
    const updatedEmployee = await Employee.update(employeeId, {
      ...body,
      name: employeeName,
      employeeId: employeeCode,
      joinDate: employeeJoinDate,
    });

    if (hasSchedulePayload(body)) {
      await EmployeeAttendanceSchedule.saveForEmployee(employeeId, getSchedulePayload(body, employeeJoinDate));
    }

    const requestedRoleId = Number(body.roleId || body.role_id || existingUser?.role_id);
    let roleId = Number.isFinite(requestedRoleId) && requestedRoleId > 0 ? requestedRoleId : null;
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) throw new ApiError(404, 'Role not found');
    } else {
      const defaultRole = await Role.findEmployeeRole();
      roleId = defaultRole?.id || null;
    }

    if (existingUser) {
      await User.update(existingUser.id, {
        name: employeeName,
        email: body.email,
        role: 'employee',
        roleId,
        employeeId,
        loginId: nextLoginId,
        password: nextPassword || undefined,
      });

      if (nextPassword) {
        const passwordResetEmailResult = await sendPasswordResetEmail({
          email: body.email,
          employeeName,
          temporaryPassword: nextPassword,
        });
        logEmailFailure('Password reset', passwordResetEmailResult);
      }
    } else if (nextPassword) {
      await User.create({
        name: employeeName,
        email: body.email,
        password: nextPassword,
        role: 'employee',
        roleId,
        employeeId,
        loginId: nextLoginId,
        tenantId: companyId,
        tenantDatabase: authUser.tenantDatabase || authUser.tenant_database,
        onboardingCompleted: true,
      });

      const companyName = await getCompanyNameForRequest(companyId);
      const welcomeEmailResult = await sendWelcomeEmployeeEmail({
        email: body.email,
        employeeName,
        companyName,
        loginId: nextLoginId,
        temporaryPassword: nextPassword,
      });
      logEmailFailure('Welcome employee', welcomeEmailResult);
    }

    return updatedEmployee;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (isDuplicateLoginError(err)) {
      throw duplicateLoginError(companyId, getRequestedEmployeeLoginId(body));
    }
    if (isDuplicateEmailError(err)) {
      throw duplicateEmailError(body.email);
    }
    throw err;
  }
};

export const updateEmployeeStatusService = async (employeeId, status, companyId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  if (!companyId) {
    throw new ApiError(428, 'Company onboarding is required before updating employees');
  }

  await Employee.updateStatus(employeeId, status);
  // Keep the linked login account in sync so the inactive-status login gate takes effect immediately.
  await User.updateStatusByEmployeeId(employeeId, companyId, status);

  return { id: Number(employeeId), status };
};

export const deleteEmployeeService = async (employeeId, companyId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const existingUser = await User.findByEmployeeId(employeeId, companyId);
  if (existingUser) {
    await User.delete(existingUser.id);
  }
  await Employee.delete(employeeId);

  return { message: 'Employee deleted' };
};
