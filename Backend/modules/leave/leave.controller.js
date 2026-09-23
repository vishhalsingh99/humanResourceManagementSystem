import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getLeaveBalanceService,
  getCarryForwardHistoryService,
  saveCarryForwardService,
  getLeavesService,
  getLeavesByEmployeeService,
  createLeaveService,
  updateLeaveService,
  deleteLeaveService,
} from './leave.service.js';

export const getLeaveBalance = asyncHandler(async (req, res) => {
  const result = await getLeaveBalanceService(
    req.user,
    Number(req.params.employee_id),
    Number(req.query.month),
    Number(req.query.year),
  );
  res.json(result);
});

export const getCarryForwardHistory = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employee_id);
  const throughMonth = Number(req.query.month) || undefined;
  const throughYear = Number(req.query.year) || undefined;
  res.json(await getCarryForwardHistoryService(employeeId, throughMonth, throughYear));
});

export const saveCarryForward = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employee_id);
  const month = Number(req.body.month);
  const year = Number(req.body.year);
  const carryForwardBalance = Number(req.body.carryForwardBalance ?? req.body.carry_forward_balance);
  res.json(await saveCarryForwardService(req.user?.id, employeeId, month, year, carryForwardBalance));
});

export const getLeaves = asyncHandler(async (req, res) => {
  res.json(await getLeavesService(req.user));
});

export const getLeavesByEmployee = asyncHandler(async (req, res) => {
  res.json(await getLeavesByEmployeeService(req.user, req.params.employee_id));
});

export const createLeave = asyncHandler(async (req, res) => {
  const leave = await createLeaveService(req.user, req.body);
  res.status(201).json({ success: true, leave });
});

export const updateLeave = asyncHandler(async (req, res) => {
  res.json(await updateLeaveService(req.user, req.params.id, req.body));
});

export const deleteLeave = asyncHandler(async (req, res) => {
  res.json(await deleteLeaveService(req.user, req.params.id));
});
