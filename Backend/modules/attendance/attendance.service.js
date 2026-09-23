import Attendance, { buildSummaryPeriod, isWeekOffDate, countWorkingDays } from '../../repositories/attendance.repository.js';
import Employee from '../../repositories/employee.repository.js';
import CompanySettings from '../../repositories/companySettings.repository.js';
import { pool } from '../../config/databases.js';
import { getEmployeeForUser } from '../../services/salaryCalculator.js';
import { loadPermissions } from '../../middlewares/requirePermission.js';
import { getClientIp, normalizeIp, verifyOfficeNetwork, getNetworkDebugInfo } from '../../services/attendanceNetworkService.js';
import { buildAttendanceSummaryPdf } from './attendance.pdf.js';
import { ApiError } from '../../utils/ApiError.js';

const normalizeDate = (value) => {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
};

const toMinutes = (value) => {
  if (!value) return 0;
  const [hours = '0', minutes = '0', seconds = '0'] = String(value).split(':');
  return (Number(hours) * 60) + Number(minutes) + (Number(seconds) > 0 ? Math.round(Number(seconds) / 60) : 0);
};

const getWorkingMinutes = (record = {}) => {
  const checkIn = record.check_in || record.checkIn;
  const checkOut = record.check_out || record.checkOut;
  if (!checkIn || !checkOut) return 0;
  const start = toMinutes(checkIn);
  const end = toMinutes(checkOut);
  return end > start ? end - start : 0;
};

const formatHours = (value) => {
  const totalMinutes = Number(value) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (!hours && !minutes) return '0h 0m';
  const hourText = hours ? `${hours}h` : '';
  const minuteText = minutes ? `${minutes}m` : '';
  return [hourText, minuteText].filter(Boolean).join(' ');
};

// Mutates authUser.permissions in place (same object as req.user) so repeated
// calls within one request don't reload permissions.
const getAttendancePermissions = async (authUser) => {
  const permissions = authUser?.permissions || await loadPermissions({ user: authUser });
  authUser.permissions = permissions;
  return permissions;
};

const defaultMonthRange = () => {
  const today = new Date();
  const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  return { defaultStart, defaultEnd };
};

const currentMonthKey = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

const todayDateStr = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const nowTimeStr = () => {
  const today = new Date();
  return `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
};

export const getNetworkInfoService = (authUser, req) => {
  const clientIp = getClientIp(req);
  const normalizedIp = normalizeIp(clientIp);

  const response = { success: true, ip: normalizedIp || clientIp };

  // Admin-only diagnostics for debugging reverse-proxy IP detection issues.
  // Never expose raw socket/header info to regular employees.
  if (authUser?.role === 'admin') {
    Object.assign(response, getNetworkDebugInfo(req));
  }

  return response;
};

export const getAttendanceService = async (authUser) => {
  const permissions = await getAttendancePermissions(authUser);
  if (permissions.includes('attendance.view_all')) {
    return Attendance.findAll();
  }

  if (!permissions.includes('attendance.view')) {
    throw new ApiError(403, 'You do not have permission to view attendance');
  }

  const employee = await getEmployeeForUser(authUser);
  if (!employee) throw new ApiError(404, 'Employee profile not linked to this login');

  return Attendance.findByEmployeeId(employee.id);
};

export const getWorkingDaysService = async (authUser, query) => {
  const permissions = await getAttendancePermissions(authUser);
  if (!permissions.includes('attendance.view') && !permissions.includes('attendance.view_all')) {
    throw new ApiError(403, 'You do not have permission to view working days');
  }

  const { defaultStart, defaultEnd } = defaultMonthRange();
  const startDate = normalizeDate(query.startDate) || defaultStart;
  const endDate = normalizeDate(query.endDate) || defaultEnd;
  if (startDate > endDate) throw new ApiError(400, 'Invalid working-day range');

  const employeeId = Number(query.employeeId || 0);
  let joinDate = null;
  if (employeeId) {
    if (!permissions.includes('attendance.view_all')) {
      const employeeForUser = await getEmployeeForUser(authUser);
      if (!employeeForUser || Number(employeeForUser.id) !== employeeId) {
        throw new ApiError(403, 'You can view only your working days');
      }
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee not found');
    joinDate = normalizeDate(employee.join_date || employee.joinDate);
  }

  const settings = await CompanySettings.getRaw();
  const holidayQuery = employeeId
    ? 'SELECT DISTINCT date FROM attendance WHERE employee_id = ? AND status = \'Holiday\' AND date BETWEEN ? AND ?'
    : 'SELECT DISTINCT date FROM attendance WHERE status = \'Holiday\' AND date BETWEEN ? AND ?';
  const holidayParams = employeeId ? [employeeId, startDate, endDate] : [startDate, endDate];
  const [holidayRows] = await pool.execute(holidayQuery, holidayParams);
  const holidayDates = new Set(holidayRows.map((row) => normalizeDate(row.date)).filter(Boolean));

  return {
    startDate,
    endDate,
    workingDays: countWorkingDays({ startDate, endDate, weekOff: settings.week_off, holidayDates, joinDate }),
  };
};

export const getAttendanceByEmployeeService = async (authUser, employeeId) => {
  const permissions = await getAttendancePermissions(authUser);
  if (!permissions.includes('attendance.view_all')) {
    if (!permissions.includes('attendance.view')) {
      throw new ApiError(403, 'You do not have permission to view attendance');
    }
    const employee = await getEmployeeForUser(authUser);
    if (!employee) throw new ApiError(404, 'Employee profile not linked to this login');
    if (Number(employee.id) !== Number(employeeId)) {
      throw new ApiError(403, 'You can view only your attendance');
    }
  }

  return Attendance.findByEmployeeId(employeeId);
};

const buildSummaryPayload = async (employeeId, employee, month, settings) => {
  const period = buildSummaryPeriod(employee, month);

  const emptySummary = {
    calendarDays: 0,
    workingDays: 0,
    presentDays: 0,
    halfDays: 0,
    absentDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    holidays: 0,
    weekOffs: 0,
    lateDays: 0,
    shortLeaveDays: 0,
    totalWorkingHours: 0,
    overtimeHours: 0,
    requiredWorkingHours: 0,
    actualWorkingHours: 0,
    shortHours: 0,
  };

  if (!period.valid || !period.start || !period.end) {
    return {
      employee: {
        id: employee.id,
        employeeCode: employee.employee_id || employee.employeeId,
        name: employee.name,
        dateOfJoining: normalizeDate(employee.join_date || employee.joinDate),
      },
      period: {
        month,
        startDate: null,
        endDate: null,
        start: null,
        end: null,
      },
      summary: emptySummary,
      dailyAttendance: [],
    };
  }

  const [attendanceRows] = await pool.execute(
    `SELECT *
     FROM attendance
     WHERE employee_id = ? AND date BETWEEN ? AND ?
     ORDER BY date ASC, id ASC`,
    [employeeId, period.start, period.end]
  );

  const [leaveRows] = await pool.execute(
    `SELECT *
     FROM leaves
     WHERE employee_id = ?
       AND status = 'Approved'
       AND start_date <= ?
       AND end_date >= ?
     ORDER BY start_date ASC`,
    [employeeId, period.end, period.start]
  );

  const attendanceMap = new Map(attendanceRows.map((record) => [normalizeDate(record.date), record]));
  const holidayDates = new Set(attendanceRows.filter((record) => record.status === 'Holiday').map((record) => normalizeDate(record.date)).filter(Boolean));
  const leaveDates = new Map();

  leaveRows.forEach((leave) => {
    const start = normalizeDate(leave.start_date);
    const end = normalizeDate(leave.end_date);
    if (!start || !end) return;
    let cursor = start;
    while (cursor <= end) {
      if (cursor >= period.start && cursor <= period.end) {
        leaveDates.set(cursor, leave);
      }
      const next = new Date(`${cursor}T00:00:00`);
      next.setDate(next.getDate() + 1);
      cursor = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-');
    }
  });

  let totalWorkingMinutes = 0;
  let overtimeMinutes = 0;

  const dailyAttendance = await Promise.all(period.days.map(async (dateValue) => {
    const resolvedSettings = await Attendance.getSettingsForDate(employeeId, dateValue, settings);
    const daySettings = resolvedSettings.settings;
    const attendanceRecord = attendanceMap.get(dateValue);
    const leaveRecord = leaveDates.get(dateValue);
    const isWeekOff = isWeekOffDate(dateValue, daySettings.week_off || 'Sunday');
    const isHoliday = holidayDates.has(dateValue);
    const dateStatus = (() => {
      if (isWeekOff) return 'Week Off';
      if (isHoliday) return 'Holiday';
      if (leaveRecord) return leaveRecord.leave_type === 'Unpaid Leave' ? 'Unpaid Leave' : 'Paid Leave';
      if (attendanceRecord) return attendanceRecord.status || 'Present';
      return 'Absent';
    })();

    const workingMinutes = attendanceRecord ? getWorkingMinutes(attendanceRecord) : 0;
    totalWorkingMinutes += workingMinutes;
    overtimeMinutes += Number(attendanceRecord?.overtime || 0);

    return {
      date: dateValue,
      day: new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      checkIn: attendanceRecord?.check_in || '--',
      checkOut: attendanceRecord?.check_out || '--',
      workingHours: attendanceRecord && attendanceRecord.check_in && attendanceRecord.check_out ? formatHours(workingMinutes) : '--',
      lateBy: attendanceRecord?.check_in ? (attendanceRecord.status === 'Late' ? formatHours((toMinutes(attendanceRecord.check_in) - (toMinutes(daySettings.office_start_time || '09:30:00') + Number(daySettings.grace_time || 0)))) : '-') : '-',
      status: dateStatus,
      remarks: attendanceRecord?.notes || (leaveRecord ? leaveRecord.leave_type : ''),
      workSchedule: resolvedSettings.schedule,
    };
  }));

  const summary = {
    calendarDays: period.days.length,
    workingDays: period.days.filter((dateValue) => !isWeekOffDate(dateValue, settings.week_off || 'Sunday') && !holidayDates.has(dateValue)).length,
    presentDays: dailyAttendance.filter((item) => item.status === 'Present').length,
    halfDays: dailyAttendance.filter((item) => item.status === 'Half Day').length,
    absentDays: dailyAttendance.filter((item) => item.status === 'Absent').length,
    paidLeaveDays: dailyAttendance.filter((item) => item.status === 'Paid Leave').length,
    unpaidLeaveDays: dailyAttendance.filter((item) => item.status === 'Unpaid Leave').length,
    holidays: dailyAttendance.filter((item) => item.status === 'Holiday').length,
    weekOffs: dailyAttendance.filter((item) => item.status === 'Week Off').length,
    lateDays: dailyAttendance.filter((item) => item.status === 'Late').length,
    shortLeaveDays: dailyAttendance.filter((item) => item.status === 'Short Leave').length,
    totalWorkingHours: Number((totalWorkingMinutes / 60).toFixed(2)),
    overtimeHours: Number((overtimeMinutes * 60 / 60).toFixed(2)),
    requiredWorkingHours: Number((Number(settings.minimum_work_hours || 0) * Math.max(0, dailyAttendance.filter((item) => item.status !== 'Week Off' && item.status !== 'Holiday').length)).toFixed(2)),
    actualWorkingHours: Number((totalWorkingMinutes / 60).toFixed(2)),
    shortHours: Number(Math.max(0, Number(settings.minimum_work_hours || 0) * Math.max(0, dailyAttendance.filter((item) => item.status !== 'Week Off' && item.status !== 'Holiday').length) - (totalWorkingMinutes / 60)).toFixed(2)),
  };

  return {
    employee: {
      id: employee.id,
      employeeCode: employee.employee_id || employee.employeeId,
      name: employee.name,
      dateOfJoining: normalizeDate(employee.join_date || employee.joinDate),
    },
    period: {
      month,
      startDate: period.start,
      endDate: period.end,
      start: period.start,
      end: period.end,
    },
    summary,
    dailyAttendance,
  };
};

export const getEmployeeAttendanceSummaryService = async (authUser, employeeId, month) => {
  const permissions = await getAttendancePermissions(authUser);

  if (!employeeId) {
    throw new ApiError(400, 'Employee ID is required');
  }

  if (!permissions.includes('attendance.view_all')) {
    if (!permissions.includes('attendance.view')) {
      throw new ApiError(403, 'You do not have permission to view attendance summary');
    }
    const employee = await getEmployeeForUser(authUser);
    if (!employee) throw new ApiError(404, 'Employee profile not linked to this login');
    if (Number(employee.id) !== employeeId) {
      throw new ApiError(403, 'You can view only your attendance summary');
    }
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const resolvedMonth = String(month || '').slice(0, 7) || currentMonthKey();
  const settings = await CompanySettings.getRaw();
  return buildSummaryPayload(employeeId, employee, resolvedMonth, settings);
};

export const exportEmployeeAttendanceSummaryPdfService = async (authUser, employeeId, month) => {
  const permissions = await getAttendancePermissions(authUser);
  if (!permissions.includes('attendance.view_all') && !permissions.includes('attendance.view')) {
    throw new ApiError(403, 'You do not have permission to export attendance summary');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const resolvedMonth = String(month || '').slice(0, 7) || currentMonthKey();
  const settings = await CompanySettings.getRaw();
  const payload = await buildSummaryPayload(employeeId, employee, resolvedMonth, settings);
  const companyName = authUser?.tenantName || 'Company';
  const pdf = await buildAttendanceSummaryPdf(payload, companyName);

  return { pdf, payload, month: resolvedMonth };
};

export const exportEmployeeAttendanceSummaryExcelService = async (authUser, employeeId, month) => {
  const permissions = await getAttendancePermissions(authUser);
  if (!permissions.includes('attendance.view_all') && !permissions.includes('attendance.view')) {
    throw new ApiError(403, 'You do not have permission to export attendance summary');
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  const resolvedMonth = String(month || '').slice(0, 7) || currentMonthKey();
  const settings = await CompanySettings.getRaw();
  const payload = await buildSummaryPayload(employeeId, employee, resolvedMonth, settings);

  const rows = [
    ['Employee Name', payload.employee.name],
    ['Employee Code', payload.employee.employeeCode],
    ['DOJ', payload.employee.dateOfJoining],
    ['Month', payload.period.month],
    [],
    ['Metric', 'Value'],
    ...Object.entries(payload.summary).map(([key, value]) => [key, String(value)]),
    [],
    ['Date', 'Day', 'Check In', 'Check Out', 'Working Hours', 'Late By', 'Status', 'Remarks'],
    ...(payload.dailyAttendance || []).map((row) => [row.date, row.day, row.checkIn, row.checkOut, row.workingHours, row.lateBy, row.status, row.remarks || '']),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

  return { csv, month: resolvedMonth };
};

export const getEmployeesForAttendanceDateService = async (authUser, date, department, designation) => {
  const selectedAttendanceDate = String(date).slice(0, 10);

  const permissions = await getAttendancePermissions(authUser);
  if (!permissions.includes('attendance.mark') && !permissions.includes('attendance.edit')) {
    throw new ApiError(403, 'You do not have permission to mark attendance');
  }

  return Attendance.getEmployeesForAttendanceDate(selectedAttendanceDate, department || null, designation || null);
};

export const createAttendanceService = async (body) => {
  const { employeeId, employee_id, date, checkIn, check_in, checkOut, check_out, status, overtime, notes } = body;
  const selectedEmployeeId = employeeId || employee_id;

  const employee = await Employee.findById(selectedEmployeeId);
  if (!employee) throw new ApiError(404, 'Employee not found');

  if (employee.status === 'inactive') {
    throw new ApiError(403, 'Inactive employees cannot mark attendance.');
  }

  const attDate = String(date).slice(0, 10);
  const dojDate = employee.join_date ? String(employee.join_date).slice(0, 10) : null;

  if (dojDate && attDate < dojDate) {
    throw new ApiError(400, `Attendance cannot be marked before employee's date of joining (${dojDate})`);
  }

  const [result] = await pool.execute(
    `INSERT INTO attendance
     (employee_id, date, check_in, check_out, status, overtime, notes, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', NOW(), NOW())`,
    [
      selectedEmployeeId,
      date,
      checkIn || check_in || null,
      checkOut || check_out || null,
      status || 'Present',
      overtime || null,
      notes || null,
    ]
  );

  await Attendance.recalculateForPeriod(selectedEmployeeId, date);
  return Attendance.findById(result.insertId);
};

export const updateAttendanceService = async (id, body) => {
  const attendance = await Attendance.findById(id);
  if (!attendance) throw new ApiError(404, 'Attendance not found');

  const { date, employee_id, employeeId } = body;
  const newEmployeeId = employee_id || employeeId;
  const newDate = date;

  if (newEmployeeId || newDate) {
    const empId = newEmployeeId || attendance.employee_id;
    const attDate = newDate ? String(newDate).slice(0, 10) : String(attendance.date).slice(0, 10);

    const employee = await Employee.findById(empId);
    if (!employee) throw new ApiError(404, 'Employee not found');

    const dojDate = employee.join_date ? String(employee.join_date).slice(0, 10) : null;
    if (dojDate && attDate < dojDate) {
      throw new ApiError(400, `Attendance cannot be marked before employee's date of joining (${dojDate})`);
    }
  }

  return Attendance.update(id, body);
};

export const deleteAttendanceService = async (id) => {
  const attendance = await Attendance.findById(id);
  if (!attendance) throw new ApiError(404, 'Attendance not found');

  await Attendance.delete(id);
  return { message: 'Attendance deleted' };
};

export const getTodayAttendanceService = async (authUser) => {
  const employee = await getEmployeeForUser(authUser);
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  const dateStr = todayDateStr();

  const [rows] = await pool.execute(
    'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
    [employee.id, dateStr]
  );

  if (rows.length === 0) {
    return { success: true, attendance: null };
  }

  return { success: true, attendance: await Attendance.findById(rows[0].id) };
};

export const employeeCheckInService = async (authUser, req) => {
  const employee = await getEmployeeForUser(authUser);
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  if (employee.status === 'inactive') {
    throw new ApiError(403, 'Inactive employees cannot mark attendance.');
  }

  const dateStr = todayDateStr();

  const [existingRows] = await pool.execute(
    'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
    [employee.id, dateStr]
  );

  if (existingRows.length > 0) {
    const existingAttendance = await Attendance.findById(existingRows[0].id);
    throw new ApiError(409, 'Attendance already marked for today', { attendance: existingAttendance });
  }

  const settings = await CompanySettings.getRaw();

  const networkVerification = verifyOfficeNetwork(req, settings);
  if (!networkVerification.allowed) {
    throw new ApiError(403, networkVerification.reason || 'Cannot mark attendance from this network', {
      success: false,
      message: networkVerification.reason || 'Attendance can only be marked from the approved office network.',
      clientIp: networkVerification.clientIp,
    });
  }

  const timeStr = nowTimeStr();

  const [result] = await pool.execute(
    `INSERT INTO attendance
     (employee_id, date, check_in, status, source, network_ip, created_at, updated_at)
     VALUES (?, ?, ?, 'Present', 'wifi', ?, NOW(), NOW())`,
    [employee.id, dateStr, timeStr, networkVerification.clientIp]
  );

  await Attendance.recalculateForPeriod(employee.id, dateStr, settings);

  const attendance = await Attendance.findById(result.insertId);

  return { success: true, message: 'Attendance checked in successfully', attendance };
};

export const employeeCheckOutService = async (authUser, req) => {
  const employee = await getEmployeeForUser(authUser);
  if (!employee) throw new ApiError(404, 'Employee profile not found');

  const dateStr = todayDateStr();

  const [attendanceRows] = await pool.execute(
    'SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND date = ?',
    [employee.id, dateStr]
  );

  if (attendanceRows.length === 0) {
    throw new ApiError(400, 'No check-in found for today');
  }

  const attendance = attendanceRows[0];
  if (attendance.check_out) {
    throw new ApiError(409, 'Checkout already recorded for today');
  }

  const settings = await CompanySettings.getRaw();

  const networkVerification = verifyOfficeNetwork(req, settings);
  if (!networkVerification.allowed) {
    throw new ApiError(403, networkVerification.reason || 'Cannot mark attendance from this network', {
      success: false,
      message: networkVerification.reason || 'Attendance can only be marked from the approved office network.',
      clientIp: networkVerification.clientIp,
    });
  }

  const timeStr = nowTimeStr();

  await pool.execute(
    `UPDATE attendance
     SET check_out = ?, network_ip = ?, updated_at = NOW()
     WHERE id = ?`,
    [timeStr, networkVerification.clientIp, attendance.id]
  );

  await Attendance.recalculateForPeriod(employee.id, dateStr, settings);

  const updatedAttendance = await Attendance.findById(attendance.id);

  return { success: true, message: 'Attendance checked out successfully', attendance: updatedAttendance };
};
