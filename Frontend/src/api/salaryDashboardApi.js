import axios from 'axios';

export const getMySalaryDashboard = (params) =>
  axios.get('/api/salary-dashboard/me', { params });

export const getEmployeeSalaryDashboard = (employeeId, params) =>
  axios.get(`/api/salary-dashboard/employees/${employeeId}`, { params });

export const getMonthlySalaryReport = (params) =>
  axios.get('/api/salary-dashboard/reports/monthly', { params });

export const generateMonthlyPayroll = (payload) =>
  axios.post('/api/salary-dashboard/payroll/generate', payload);

export const downloadPayslip = (employeeId, params) =>
  axios.get(`/api/pdf/payslip/${employeeId}`, {
    params,
    responseType: 'text',
  });
