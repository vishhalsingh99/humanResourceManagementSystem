import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getNetworkInfoService,
  getAttendanceService,
  getWorkingDaysService,
  getAttendanceByEmployeeService,
  getEmployeeAttendanceSummaryService,
  exportEmployeeAttendanceSummaryPdfService,
  exportEmployeeAttendanceSummaryExcelService,
  getEmployeesForAttendanceDateService,
  createAttendanceService,
  updateAttendanceService,
  deleteAttendanceService,
  getTodayAttendanceService,
  employeeCheckInService,
  employeeCheckOutService,
} from './attendance.service.js';

export const getNetworkInfo = asyncHandler(async (req, res) => {
  res.json(getNetworkInfoService(req.user, req));
});

export const getAttendance = asyncHandler(async (req, res) => {
  res.json(await getAttendanceService(req.user));
});

export const getWorkingDays = asyncHandler(async (req, res) => {
  res.json(await getWorkingDaysService(req.user, req.query));
});

export const getAttendanceByEmployee = asyncHandler(async (req, res) => {
  res.json(await getAttendanceByEmployeeService(req.user, req.params.employeeId));
});

export const getEmployeeAttendanceSummary = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  res.json(await getEmployeeAttendanceSummaryService(req.user, employeeId, req.query.month));
});

export const exportEmployeeAttendanceSummaryPdf = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const { pdf, payload, month } = await exportEmployeeAttendanceSummaryPdfService(req.user, employeeId, req.query.month);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-summary-${payload.employee.employeeCode || employeeId}-${month}.pdf"`);
  res.send(pdf);
});

export const exportEmployeeAttendanceSummaryExcel = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const { csv, month } = await exportEmployeeAttendanceSummaryExcelService(req.user, employeeId, req.query.month);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-summary-${employeeId}-${month}.csv"`);
  res.send(csv);
});

export const getEmployeesForAttendanceDate = asyncHandler(async (req, res) => {
  const { date, department, designation } = req.query;
  res.json(await getEmployeesForAttendanceDateService(req.user, date, department, designation));
});

export const createAttendance = asyncHandler(async (req, res) => {
  res.status(201).json(await createAttendanceService(req.body));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  res.json(await updateAttendanceService(req.params.id, req.body));
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  res.json(await deleteAttendanceService(req.params.id));
});

export const getTodayAttendance = asyncHandler(async (req, res) => {
  res.json(await getTodayAttendanceService(req.user));
});

export const employeeCheckIn = asyncHandler(async (req, res) => {
  res.status(201).json(await employeeCheckInService(req.user, req));
});

export const employeeCheckOut = asyncHandler(async (req, res) => {
  res.json(await employeeCheckOutService(req.user, req));
});
