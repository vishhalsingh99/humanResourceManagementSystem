import Leave from './leave.repository.js';
import Employee from '../../repositories/employee.repository.js';
import * as salaryCalculator from '../../services/salaryCalculator.js';
import {
  getCarryForwardHistory as fetchCarryForwardHistory,
  upsertManualCarryForward,
} from '../../services/leaveBalanceService.js';
import { loadPermissions } from '../../middlewares/requirePermission.js';
import { ApiError } from '../../utils/ApiError.js';

// Mutates authUser.permissions in place (same object as req.user) so repeated
// calls within one request don't reload permissions, matching the original
// controller's caching behavior.
const userHasPermission = async (authUser, permissionKey) => {
  if (authUser?.role === 'admin' || authUser?.role === 'SUPER_ADMIN') return true;
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  authUser.permissions = permissions;
  return permissions.includes(permissionKey);
};

export const getLeaveBalanceService = async (authUser, employeeId, month, year) => {
  const authenticatedEmployeeId = authUser?.employeeId || authUser?.employee_id;
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  authUser.permissions = permissions;
  if (!permissions.includes('leave.view_all') && (!permissions.includes('leave.view') || employeeId !== Number(authenticatedEmployeeId))) {
    throw new ApiError(403, 'You can only view your own leave balance');
  }

  const dashboard = await salaryCalculator.calculateSalary({
    employeeId,
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
  });
  return dashboard.leave;
};

export const getCarryForwardHistoryService = async (employeeId, throughMonth, throughYear) => {
  if (!employeeId) {
    throw new ApiError(400, 'Employee is required');
  }
  return fetchCarryForwardHistory({ employeeId, throughYear, throughMonth });
};

export const saveCarryForwardService = async (authUserId, employeeId, month, year, carryForwardBalance) => {
  if (!employeeId || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    throw new ApiError(400, 'Employee, month and year are required');
  }
  if (!Number.isFinite(carryForwardBalance) || carryForwardBalance < 0) {
    throw new ApiError(400, 'Carry-forward leave must be a non-negative number');
  }

  return upsertManualCarryForward({
    employeeId,
    year,
    month,
    carryForwardBalance,
    actorId: authUserId || null,
  });
};

export const getLeavesService = async (authUser) => {
  const employeeId = authUser?.employeeId || authUser?.employee_id;
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  authUser.permissions = permissions;

  if (permissions.includes('leave.view_all')) {
    return Leave.findAll();
  }

  if (permissions.includes('leave.view')) {
    if (!employeeId) {
      throw new ApiError(404, 'Employee profile is not linked to this login');
    }
    return Leave.findByemployee_id(employeeId);
  }

  throw new ApiError(403, 'You do not have permission to view leave requests');
};

export const getLeavesByEmployeeService = async (authUser, employeeId) => {
  const authenticatedEmployeeId = authUser?.employeeId || authUser?.employee_id;
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  authUser.permissions = permissions;

  if (!permissions.includes('leave.view_all') && (!permissions.includes('leave.view') || String(employeeId) !== String(authenticatedEmployeeId))) {
    throw new ApiError(403, 'You can only view your own leave requests');
  }

  return Leave.findByemployee_id(employeeId);
};

export const createLeaveService = async (authUser, body) => {
  const authenticatedEmployeeId = authUser?.employeeId || authUser?.employee_id;
  const isCompanyAdmin = authUser?.role === 'admin' || authUser?.role === 'SUPER_ADMIN';
  const requestedEmployeeId = body.employee_id ?? body.employeeId ?? authenticatedEmployeeId;

  if (!isCompanyAdmin && String(requestedEmployeeId) !== String(authenticatedEmployeeId)) {
    throw new ApiError(403, 'You can create leave requests only for yourself');
  }

  const leaveData = {
    employee_id: !isCompanyAdmin ? authenticatedEmployeeId : requestedEmployeeId,
    leave_type: body.leave_type ?? body.leaveType ?? null,
    start_date: body.start_date ?? body.startDate ?? null,
    end_date: body.end_date ?? body.endDate ?? null,
    reason: body.reason ?? null,
    approved_by: body.approved_by ?? body.approvedBy ?? null,
  };

  if (!leaveData.employee_id || !leaveData.leave_type || !leaveData.start_date || !leaveData.end_date) {
    throw new ApiError(400, 'Employee, Leave Type, Start Date and End Date are required');
  }

  const employee = await Employee.findById(leaveData.employee_id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  if (employee.status === 'inactive') {
    throw new ApiError(403, 'Cannot create a leave request for an inactive employee');
  }

  return Leave.create(leaveData);
};

export const updateLeaveService = async (authUser, id, body) => {
  const leave = await Leave.findById(id);
  if (!leave) throw new ApiError(404, 'Leave not found');

  const authenticatedEmployeeId = authUser?.employeeId || authUser?.employee_id;
  const canManageLeave = await userHasPermission(authUser, 'leave.approve');
  if (authUser?.role === 'employee' && !canManageLeave && String(leave.employee_id) !== String(authenticatedEmployeeId)) {
    throw new ApiError(403, 'You can only update your own leave requests');
  }
  if (authUser?.role === 'employee' && !canManageLeave && leave.status !== 'Pending') {
    throw new ApiError(403, 'Approved or rejected leave requests cannot be changed');
  }

  const {
    status,
    approvedBy,
    approved_by,
    rejectionReason,
    rejection_reason,
    adminRemark,
    remarks,
    ...details
  } = body || {};
  const updateData = { ...details };

  if (status) {
    const requiredPermission = status === 'Rejected' ? 'leave.reject' : 'leave.approve';
    if (!await userHasPermission(authUser, requiredPermission)) {
      throw new ApiError(403, 'Only users with leave approval permission can approve or reject leave requests');
    }
    updateData.status = status;
    updateData.approvedBy = approvedBy || approved_by || authUser?.id || null;
    updateData.approvedDate = status !== 'Pending' ? new Date().toISOString().split('T')[0] : null;
  } else if (!await userHasPermission(authUser, 'leave.apply')) {
    throw new ApiError(403, 'You do not have permission to update leave requests');
  } else if (authUser?.role === 'employee') {
    updateData.employee_id = authenticatedEmployeeId;
    updateData.status = 'Pending';
    updateData.approvedBy = null;
    updateData.approvedDate = null;
  }

  const updatedLeave = await Leave.update(id, updateData);
  return updatedLeave;
};

export const deleteLeaveService = async (authUser, id) => {
  const leave = await Leave.findById(id);
  if (!leave) throw new ApiError(404, 'Leave not found');

  const authenticatedEmployeeId = authUser?.employeeId || authUser?.employee_id;
  if (authUser?.role === 'employee' && String(leave.employee_id) !== String(authenticatedEmployeeId)) {
    throw new ApiError(403, 'You can only delete your own leave requests');
  }
  if (authUser?.role === 'employee' && leave.status !== 'Pending') {
    throw new ApiError(403, 'Approved or rejected leave requests cannot be deleted');
  }

  await Leave.delete(id);
  return { message: 'Leave deleted' };
};
