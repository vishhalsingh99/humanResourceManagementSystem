import { pool } from '../config/databases.js';
import CompanySettings from './companySettings.repository.js';

const dateOnly = (value) => String(value || '').slice(0, 10);
const timeOnly = (value) => String(value || '').slice(0, 8);

const validateSchedule = ({ startTime, endTime, effectiveFrom, effectiveTo, graceMinutes = 0 }) => {
  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const from = dateOnly(effectiveFrom);
  const to = effectiveTo ? dateOnly(effectiveTo) : null;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(start) || !/^\d{2}:\d{2}(:\d{2})?$/.test(end)) {
    throw new Error('Working start time and end time are required');
  }
  if (start >= end) throw new Error('Working end time must be after start time');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error('Effective from date is required');
  if (to && to < from) throw new Error('Effective to date must be on or after effective from date');
  if (!Number.isInteger(Number(graceMinutes)) || Number(graceMinutes) < 0) {
    throw new Error('Grace minutes must be greater than or equal to 0');
  }
  return { start, end, from, to, grace: Number(graceMinutes) };
};

const toApi = (row) => row ? ({
  id: row.id,
  employeeId: row.employee_id,
  startTime: timeOnly(row.start_time),
  endTime: timeOnly(row.end_time),
  graceMinutes: Number(row.grace_minutes || 0),
  effectiveFrom: dateOnly(row.effective_from),
  effectiveTo: row.effective_to ? dateOnly(row.effective_to) : null,
  status: row.status,
}) : null;

const toSettings = (settings, row) => ({
  ...settings,
  office_start_time: timeOnly(row.start_time),
  office_end_time: timeOnly(row.end_time),
});

class EmployeeAttendanceSchedule {
  static async findForDate(employeeId, date) {
    const [rows] = await pool.execute(
      `SELECT * FROM employee_attendance_schedules
       WHERE employee_id = ? AND status = 'ACTIVE'
         AND effective_from <= ?
         AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY effective_from DESC, id DESC LIMIT 1`,
      [employeeId, dateOnly(date), dateOnly(date)]
    );
    return rows[0] || null;
  }

  static async getSettingsForDate(employeeId, date, settings = null) {
    const companySettings = settings || await CompanySettings.getRaw();
    const schedule = await this.findForDate(employeeId, date);
    return { settings: schedule ? toSettings(companySettings, schedule) : companySettings, schedule: toApi(schedule) };
  }

  static async findCurrent(employeeId, date = new Date()) {
    const row = await this.findForDate(employeeId, dateOnly(date));
    return toApi(row);
  }

  static async saveForEmployee(employeeId, data = {}) {
    const normalized = validateSchedule(data);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE employee_attendance_schedules
         SET effective_to = DATE_SUB(?, INTERVAL 1 DAY), updated_at = NOW()
         WHERE employee_id = ? AND status = 'ACTIVE' AND effective_from < ?
           AND (effective_to IS NULL OR effective_to >= ?)`,
        [normalized.from, employeeId, normalized.from, normalized.from]
      );
      await connection.query(
        `INSERT INTO employee_attendance_schedules
          (employee_id, start_time, end_time, grace_minutes, effective_from, effective_to, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
        [employeeId, normalized.start, normalized.end, normalized.grace, normalized.from, normalized.to]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return this.findCurrent(employeeId, normalized.from);
  }
}

export default EmployeeAttendanceSchedule;
export { validateSchedule };