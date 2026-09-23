import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getEmployeesService,
  getMyProfileService,
  changePasswordService,
  createEmployeeService,
  updateEmployeeService,
  updateEmployeeStatusService,
  deleteEmployeeService,
} from './employees.service.js';

const getAuthenticatedCompanyId = (req) => (
  req.user?.tenantId
  || req.user?.tenant_id
  || req.body?.company_id
  || req.body?.companyId
);

export const uploadResume = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Resume file is required' });
  }

  res.status(201).json({
    resumeFile: `/uploads/resumes/${req.file.filename}`,
  });
};

export const getEmployees = asyncHandler(async (req, res) => {
  const statusFilter = ['active', 'inactive'].includes(req.query?.status) ? req.query.status : undefined;
  const result = await getEmployeesService(statusFilter, getAuthenticatedCompanyId(req));
  res.json(result);
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const employeeId = req.user?.employeeId || req.user?.employee_id;
  const result = await getMyProfileService(employeeId);
  res.json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await changePasswordService(req.user, req.body);
  res.json(result);
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await createEmployeeService(req.user, req.body, getAuthenticatedCompanyId(req));
  res.status(201).json(employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await updateEmployeeService(req.user, req.params.id, req.body, getAuthenticatedCompanyId(req));
  res.json(employee);
});

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const result = await updateEmployeeStatusService(req.params.id, req.body.status, getAuthenticatedCompanyId(req));
  res.json(result);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await deleteEmployeeService(req.params.id, getAuthenticatedCompanyId(req));
  res.json(result);
});
