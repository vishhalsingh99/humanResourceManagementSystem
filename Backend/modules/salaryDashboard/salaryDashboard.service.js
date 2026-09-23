import * as salaryCalculator from '../../services/salaryCalculator.js';
import { loadPermissions } from '../../middlewares/requirePermission.js';
import { ApiError } from '../../utils/ApiError.js';

const canAccessEmployee = async (authUser, permissions, employeeId) => {
  if (permissions.includes('payroll.view_all')) return true;
  const employee = await salaryCalculator.getEmployeeForUser(authUser);
  return employee && Number(employee.id) === Number(employeeId);
};

export const getMySalaryDashboardService = async (authUser, period) => {
  const employee = await salaryCalculator.getEmployeeForUser(authUser);
  if (!employee) {
    throw new ApiError(404, 'No employee profile is linked to this login email');
  }

  return salaryCalculator.calculateSalary({ employeeId: employee.id, ...period });
};

export const getEmployeeSalaryDashboardService = async (authUser, employeeId, period) => {
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  if (!(await canAccessEmployee(authUser, permissions, employeeId))) {
    throw new ApiError(403, 'You do not have access to this salary dashboard');
  }

  return salaryCalculator.calculateSalary({ employeeId, ...period });
};

export const generateMonthlyPayrollService = ({ employeeId, month, year, status }) => (
  salaryCalculator.generatePayroll({ employeeId, month, year, status })
);

export const getMonthlySalaryReportService = async (authUser, period) => {
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  if (!permissions.includes('payroll.view_all')) {
    throw new ApiError(403, 'You do not have permission to view all employee payroll');
  }
  return salaryCalculator.getMonthlyReport(period);
};
