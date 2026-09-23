import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getMySalaryDashboardService,
  getEmployeeSalaryDashboardService,
  generateMonthlyPayrollService,
  getMonthlySalaryReportService,
} from './salaryDashboard.service.js';

const getPeriod = (req) => ({ month: req.query.month, year: req.query.year });

export const getMySalaryDashboard = asyncHandler(async (req, res) => {
  res.json(await getMySalaryDashboardService(req.user, getPeriod(req)));
});

export const getEmployeeSalaryDashboard = asyncHandler(async (req, res) => {
  res.json(await getEmployeeSalaryDashboardService(req.user, req.params.employeeId, getPeriod(req)));
});

export const generateMonthlyPayroll = asyncHandler(async (req, res) => {
  const { employeeId, employee_id, month, year, status } = req.body || {};
  res.status(201).json(await generateMonthlyPayrollService({
    employeeId: employeeId || employee_id,
    month,
    year,
    status,
  }));
});

export const getMonthlySalaryReport = asyncHandler(async (req, res) => {
  res.json(await getMonthlySalaryReportService(req.user, getPeriod(req)));
});
