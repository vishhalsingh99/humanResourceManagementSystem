import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getPayrollsService,
  createPayrollService,
  updatePayrollService,
  deletePayrollService,
} from './payroll.service.js';

export const getPayrolls = asyncHandler(async (req, res) => {
  res.json(await getPayrollsService(req.user));
});

export const createPayroll = asyncHandler(async (req, res) => {
  res.status(201).json(await createPayrollService(req.body));
});

export const updatePayroll = asyncHandler(async (req, res) => {
  res.json(await updatePayrollService(req.params.id, req.body));
});

export const deletePayroll = asyncHandler(async (req, res) => {
  res.json(await deletePayrollService(req.params.id));
});
