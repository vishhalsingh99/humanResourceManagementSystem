import { pool } from '../config/databases.js';
import CompanySettings from './companySettings.repository.js';
import EmployeeAttendanceSchedule from './employeeAttendanceSchedule.repository.js';

const NON_WORKING_STATUSES = new Set(['Absent', 'Holiday', 'Leave', 'Paid Leave', 'Sunday']);
const dateKey = (value) => {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
};
const weekdayName = (dateString) => {
  const key = dateKey(dateString);
  if (!key) return '';
  const day = new Date(`${key}T00:00:00`);
  if (Number.isNaN(day.getTime())) return '';
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.getDay()];
};
const isWeekOffDate = (dateString, weekOff = 'Sunday') => {
  const key = dateKey(dateString);
  if (!key) return false;
  return weekdayName(key) === (weekOff || 'Sunday');
};
const countWorkingDays = ({ startDate, endDate, weekOff, holidayDates = new Set(), joinDate = null }) => {
  const start = joinDate && joinDate > startDate ? joinDate : startDate;
  let total = 0;
  for (let current = start; current && current <= endDate;) {
    if (!isWeekOffDate(current, weekOff) && !holidayDates.has(current)) total += 1;
    const next = new Date(`${current}T00:00:00`);
    next.setDate(next.getDate() + 1);
    current = [
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, '0'),
      String(next.getDate()).padStart(2, '0'),
    ].join('-');
  }
  return total;
};
const buildSummaryPeriod = (employee, monthValue) => {
  const month = String(monthValue || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { month, start: null, end: null, days: [], valid: false };
  }

  const [year, monthNumber] = month.split('-');
  const startDate = `${year}-${monthNumber}-01`;
  const lastDay = new Date(Number(year), Number(monthNumber), 0).getDate();
  const endDate = `${year}-${monthNumber}-${String(lastDay).padStart(2, '0')}`;
  const joinDate = dateKey(employee?.join_date);

  if (joinDate && endDate < joinDate) {
    return { month, start: null, end: null, days: [], valid: false, joinDate, monthStart: startDate, monthEnd: endDate };
  }

  const start = joinDate && startDate < joinDate ? joinDate : startDate;
  const end = endDate;

  if (start > end) {
    return { month, start: null, end: null, days: [], valid: false, joinDate, monthStart: startDate, monthEnd: endDate };
  }

  const days = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    const next = new Date(`${current}T00:00:00`);
    next.setDate(next.getDate() + 1);
    current = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, '0'), String(next.getDate()).padStart(2, '0')].join('-');
  }

  return { month, start, end, days, valid: true, joinDate, monthStart: startDate, monthEnd: endDate };
};
const timeToMinutes = (time) => {
  if (!time) return null;
  const [hours = '0', minutes = '0'] = String(time).split(':');
  const h = Number(hours);
  const m = Number(minutes);
  return Number.isNaN(h) || Number.isNaN(m) ? null : (h * 60) + m;
};
const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || minutes <= 0) return '-';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours && remainder ? `${hours}h ${remainder}m` : hours ? `${hours}h` : `${remainder}m`;
};
const dateOnly = (value) => String(value || '').slice(0, 10);
const getResetRange = (date, resetPeriod) => {
  const [year, month] = dateOnly(date).split('-');
  if (resetPeriod === 'Yearly') return { start: `${year}-01-01`, end: `${year}-12-31` };
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
};

// Helper: Validate employee DOJ against attendance date
const validateEmployeeDOJ = (employee, attendanceDate) => {
  if (!employee || !employee.join_date) {
    return true; // No DOJ set, allow attendance
  }
  const dojDate = String(employee.join_date || '').slice(0, 10); // YYYY-MM-DD
  const attDate = String(attendanceDate || '').slice(0, 10); // YYYY-MM-DD
  return attDate >= dojDate; // Employee eligible if attendance date >= DOJ
};

const getShortLeaveLimit = (settings = {}) => Number(
  settings.monthly_short_leave_limit
  ?? settings.monthlyShortLeaveLimit
  ?? settings.short_leave_limit
  ?? settings.short_leaves_for_half_day
  ?? settings.shortLeavesForHalfDay
  ?? 0
);

const getShortLeaveEnd = (settings = {}) => {
  const officeStart = timeToMinutes(settings.office_start_time);
  const durationHours = Number(settings.short_leave_duration_hours || 0);
  if (officeStart === null || durationHours <= 0) return null;
  return officeStart + (durationHours * 60);
};

const isShortLeaveCandidate = (record = {}, settings = {}) => {
  if (!settings.short_leave_enabled || NON_WORKING_STATUSES.has(record.status)) return false;
  const checkIn = timeToMinutes(record.check_in);
  const officeStart = timeToMinutes(settings.office_start_time);
  const graceMinutes = Number(settings.grace_time || 0);
  const shortLeaveEnd = getShortLeaveEnd(settings);
  if (checkIn === null || officeStart === null || shortLeaveEnd === null) return false;
  return checkIn > officeStart + graceMinutes && checkIn <= shortLeaveEnd;
};

// Shared base calculation. Short Leave is handled before generic minimum-work/half-day rules
// for late arrivals inside the configured short-leave window.
const calculateBaseStatus = (record = {}, settings = {}) => {
  if (NON_WORKING_STATUSES.has(record.status)) return record.status;
  const checkIn = timeToMinutes(record.check_in);
  const checkOut = timeToMinutes(record.check_out);
  const officeStart = timeToMinutes(settings.office_start_time);
  const halfDayAfter = timeToMinutes(settings.half_day_after);
  const graceMinutes = Number(settings.grace_time || 0);
  const shortLeaveEnd = getShortLeaveEnd(settings);
  const worked = checkIn !== null && checkOut !== null && checkOut >= checkIn ? checkOut - checkIn : null;

  // Manual non-check-in records (for example an approved Half Day) must retain
  // their existing attendance state; only check-in based records are recalculated.
  if (checkIn === null && record.status) return record.status;
  if (checkIn === null) return 'Present';

  if (checkIn <= officeStart + graceMinutes) return 'Present';

  if (settings.short_leave_enabled && isShortLeaveCandidate(record, settings)) {
    return 'Late';
  }

  if (shortLeaveEnd !== null && checkIn > shortLeaveEnd) return 'Half Day';

  if (halfDayAfter !== null && checkIn >= halfDayAfter) return 'Half Day';
  if (worked !== null && Number(settings.minimum_work_hours || 0) > 0 && worked < Number(settings.minimum_work_hours) * 60) return 'Half Day';
  if (officeStart !== null && checkIn > officeStart + graceMinutes) return 'Late';
  return 'Present';
};

const calculateAttendanceStatus = (record, settings, shortLeaveCount = 0) => {
  const baseStatus = calculateBaseStatus(record, settings);
  if (baseStatus !== 'Late' || !settings.short_leave_enabled) return baseStatus;

  const checkIn = timeToMinutes(record.check_in);
  const officeStart = timeToMinutes(settings.office_start_time);
  const shortLeaveEnd = getShortLeaveEnd(settings);
  if (checkIn === null || officeStart === null || shortLeaveEnd === null || checkIn > shortLeaveEnd) return 'Half Day';

  const limit = getShortLeaveLimit(settings);
  return limit > 0 && shortLeaveCount < limit ? 'Short Leave' : 'Half Day';
};

const enrichAttendance = (record = {}, settings = {}, schedule = null) => {
  const checkIn = timeToMinutes(record.check_in);
  const checkOut = timeToMinutes(record.check_out);
  const officeStart = timeToMinutes(settings.office_start_time);
  const worked = checkIn !== null && checkOut !== null && checkOut >= checkIn ? checkOut - checkIn : null;
  const lateBy = checkIn !== null && officeStart !== null && checkIn > officeStart + Number(settings.grace_time || 0)
    ? checkIn - (officeStart + Number(settings.grace_time || 0)) : 0;
  return {
    ...record,
    employeeId: record.employee_id, employeeName: record.employee_name, employeeCode: record.employee_code,
    total_work_minutes: worked, total_work_hours: worked === null ? null : Number((worked / 60).toFixed(2)), totalWorkHours: formatMinutes(worked),
    late_by_minutes: lateBy, lateByMinutes: lateBy, lateBy: formatMinutes(lateBy),
    shortLeaveEnabled: Boolean(settings.short_leave_enabled), isShortLeave: record.status === 'Short Leave',
    shortLeaveHalfDayApplied: Boolean(settings.short_leave_enabled && record.status === 'Half Day' && isShortLeaveCandidate(record, settings)),
    shortLeaveDurationHours: Number(settings.short_leave_duration_hours || 0),
    monthlyShortLeaveLimit: getShortLeaveLimit(settings),
    shortLeaveResetPeriod: settings.short_leave_reset_period || 'Monthly',
    minimum_work_hours: Number(settings.minimum_work_hours || 0), office_start_time: settings.office_start_time,
    grace_time: Number(settings.grace_time || 0), paid_leave_days: Number(settings.paid_leave_days || 0), half_day_after: settings.half_day_after,
    office_end_time: settings.office_end_time,
    workSchedule: schedule,
  };
};
const attendanceSelect = 'SELECT a.*, e.name AS employee_name, e.employee_id AS employee_code FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id';

class Attendance {
  static async getSettingsForDate(employeeId, date, settings = null) {
    return EmployeeAttendanceSchedule.getSettingsForDate(employeeId, date, settings);
  }

  static async recalculateForPeriod(employeeId, date, settings = null) {
    const activeSettings = settings || await CompanySettings.getRaw();
    const { start, end } = getResetRange(date, activeSettings.short_leave_reset_period);
    const [rows] = await pool.execute('SELECT id, date, check_in, check_out, status FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC, id ASC', [employeeId, start, end]);
    let shortLeaveCount = 0;
    for (const row of rows) {
      const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(employeeId, row.date, activeSettings);
      const status = calculateAttendanceStatus(row, resolved.settings, shortLeaveCount);
      if (status === 'Short Leave') shortLeaveCount += 1;
      if (status !== row.status) await pool.execute('UPDATE attendance SET status = ?, updated_at = NOW() WHERE id = ?', [status, row.id]);
    }
  }
  static async recalculateAllStatuses() {
    const settings = await CompanySettings.getRaw();
    const [rows] = await pool.execute('SELECT DISTINCT employee_id, date FROM attendance');
    const periods = new Set();
    for (const row of rows) {
      const range = getResetRange(row.date, settings.short_leave_reset_period);
      const key = `${row.employee_id}:${range.start}`;
      if (!periods.has(key)) { periods.add(key); await this.recalculateForPeriod(row.employee_id, row.date, settings); }
    }
  }
  static async findAll() {
    try {
      const [rows] = await pool.execute(`${attendanceSelect} ORDER BY a.date DESC, a.id DESC`);
      const settings = await CompanySettings.getRaw();
      return Promise.all(rows.map(async (row) => {
        const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(row.employee_id, row.date, settings);
        return enrichAttendance(row, resolved.settings, resolved.schedule);
      }));
    }
    catch (error) { throw new Error(`Failed to fetch attendance: ${error.message}`); }
  }
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`${attendanceSelect} WHERE a.id = ?`, [id]);
      if (!rows[0]) return null;
      const settings = await CompanySettings.getRaw();
      const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(rows[0].employee_id, rows[0].date, settings);
      return enrichAttendance(rows[0], resolved.settings, resolved.schedule);
    }
    catch (error) { throw new Error(`Failed to fetch attendance: ${error.message}`); }
  }
  static async findByEmployeeId(employeeId) {
    try {
      const [rows] = await pool.execute(`${attendanceSelect} WHERE a.employee_id = ? ORDER BY a.date DESC, a.id DESC`, [employeeId]);
      const settings = await CompanySettings.getRaw();
      return Promise.all(rows.map(async (row) => {
        const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(row.employee_id, row.date, settings);
        return enrichAttendance(row, resolved.settings, resolved.schedule);
      }));
    }
    catch (error) { throw new Error(`Failed to fetch attendance: ${error.message}`); }
  }
  static async create({ employeeId, date, checkIn, checkOut, status, overtime, notes }) {
    try {
      const settings = await CompanySettings.getRaw();
      const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(employeeId, date, settings);
      const initialStatus = calculateBaseStatus({ check_in: checkIn || null, check_out: checkOut || null, status: status || 'Present' }, resolved.settings);
      const [result] = await pool.execute('INSERT INTO attendance (employee_id, date, check_in, check_out, status, overtime, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())', [employeeId, date, checkIn || null, checkOut || null, initialStatus, overtime || null, notes || null]);
      await this.recalculateForPeriod(employeeId, date, settings);
      return this.findById(result.insertId);
    } catch (error) { throw new Error(`Failed to create attendance: ${error.message}`); }
  }
  static async update(id, data) {
    try {
      const { employeeId, employee_id, date, checkIn, check_in, checkOut, check_out, status, overtime, notes } = data;
      const employee = employeeId || employee_id; const inTime = checkIn || check_in || null; const outTime = checkOut || check_out || null;
      const existing = await this.findById(id); const settings = await CompanySettings.getRaw();
      const resolved = await EmployeeAttendanceSchedule.getSettingsForDate(employee, date, settings);
      const initialStatus = calculateBaseStatus({ check_in: inTime, check_out: outTime, status: status || 'Present' }, resolved.settings);
      await pool.execute('UPDATE attendance SET employee_id = ?, date = ?, check_in = ?, check_out = ?, status = ?, overtime = ?, notes = ?, updated_at = NOW() WHERE id = ?', [employee, date, inTime, outTime, initialStatus, overtime || null, notes || null, id]);
      if (existing) await this.recalculateForPeriod(existing.employeeId, existing.date, settings);
      await this.recalculateForPeriod(employee, date, settings);
      return this.findById(id);
    } catch (error) { throw new Error(`Failed to update attendance: ${error.message}`); }
  }
  static async delete(id) {
    try { const existing = await this.findById(id); await pool.execute('DELETE FROM attendance WHERE id = ?', [id]); if (existing) await this.recalculateForPeriod(existing.employeeId, existing.date); return true; }
    catch (error) { throw new Error(`Failed to delete attendance: ${error.message}`); }
  }

  // Get employees eligible for attendance on a given date (filtered by DOJ)
  static async getEmployeesForAttendanceDate(attendanceDate, department = null, designation = null) {
    try {
      const selectedAttendanceDate = String(attendanceDate || '').slice(0, 10);
      let query = `
        SELECT e.id, e.name, e.employee_id, e.department, e.designation, e.join_date
        FROM employees e
        WHERE (e.join_date IS NULL OR DATE(e.join_date) <= DATE(?))
          AND e.status = 'active'
      `;
      const params = [selectedAttendanceDate];

      if (department) {
        query += ` AND e.department = ?`;
        params.push(department);
      }

      if (designation) {
        query += ` AND e.designation = ?`;
        params.push(designation);
      }

      query += ` ORDER BY e.name ASC`;

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Failed to fetch employees for attendance date: ${error.message}`);
    }
  }
}

export default Attendance;
export { validateEmployeeDOJ };
export { calculateAttendanceStatus };
export { getResetRange };
export { buildSummaryPeriod };
export { isWeekOffDate };
export { countWorkingDays };
export { weekdayName };