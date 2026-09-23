import { Router } from 'express';
import {
  getNetworkInfo,
  getTodayAttendance,
  getEmployeesForAttendanceDate,
  getAttendance,
  getWorkingDays,
  getAttendanceByEmployee,
  getEmployeeAttendanceSummary,
  exportEmployeeAttendanceSummaryPdf,
  exportEmployeeAttendanceSummaryExcel,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  employeeCheckIn,
  employeeCheckOut,
} from './attendance.controller.js';
import { authMiddleware } from '../../middlewares/authe.js';
import { requirePermission, requireAnyPermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { createAttendanceSchema, getEmployeesForAttendanceDateSchema } from './attendance.schema.js';

const router = Router();

// Attendance routes
router.use(authMiddleware);

router.get('/network-info', getNetworkInfo);
router.get('/today', getTodayAttendance);

router.get('/search/by-date', requireAnyPermission(['attendance.mark', 'attendance.edit']), validate(getEmployeesForAttendanceDateSchema, 'query'), getEmployeesForAttendanceDate);
router.get('/', requireAnyPermission(['attendance.view', 'attendance.view_all']), getAttendance);
router.get('/working-days', requireAnyPermission(['attendance.view', 'attendance.view_all']), getWorkingDays);
router.get('/employee/:employeeId', requireAnyPermission(['attendance.view', 'attendance.view_all']), getAttendanceByEmployee);
router.get('/employee/:employeeId/summary', requireAnyPermission(['attendance.view', 'attendance.view_all']), getEmployeeAttendanceSummary);
router.get('/employee/:employeeId/summary/pdf', requireAnyPermission(['attendance.view', 'attendance.view_all']), exportEmployeeAttendanceSummaryPdf);
router.get('/employee/:employeeId/summary/export-pdf', requireAnyPermission(['attendance.view', 'attendance.view_all']), exportEmployeeAttendanceSummaryPdf);
router.get('/employee/:employeeId/summary/export-excel', requireAnyPermission(['attendance.view', 'attendance.view_all']), exportEmployeeAttendanceSummaryExcel);

router.post('/check-in', employeeCheckIn);
router.post('/check-out', employeeCheckOut);

router.post('/', requirePermission('attendance.mark'), validate(createAttendanceSchema), createAttendance);
router.put('/:id', requirePermission('attendance.edit'), updateAttendance);
router.delete('/:id', requirePermission('attendance.delete'), deleteAttendance);

export default router;
