import Payroll from './payroll.repository.js';
import { loadPermissions } from '../../middlewares/requirePermission.js';
import { ApiError } from '../../utils/ApiError.js';

export const getPayrollsService = async (authUser) => {
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  if (!permissions.includes('payroll.view_all')) {
    throw new ApiError(403, 'You do not have permission to view all employee payroll');
  }
  return Payroll.findAll();
};

export const createPayrollService = ({ employee, month, year, basic_salary, allowances, deductions, net_salary, status }) => (
  Payroll.create({
    employeeId: employee,
    month,
    year: parseInt(year),
    basic_salary: parseFloat(basic_salary),
    allowances: parseFloat(allowances) || 0,
    deductions: parseFloat(deductions) || 0,
    net_salary: parseFloat(net_salary),
    status: status || 'PAID',
  })
);

export const updatePayrollService = async (id, body) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  return Payroll.update(id, body);
};

export const deletePayrollService = async (id) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new ApiError(404, 'Payroll not found');
  await Payroll.delete(id);
  return { message: 'Payroll deleted' };
};
