import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAttendanceStatus, getResetRange } from '../repositories/attendance.repository.js';
import { validateSchedule } from '../repositories/employeeAttendanceSchedule.repository.js';

const settings = {
  office_start_time: '09:00:00',
  grace_time: 10,
  half_day_after: '13:30:00',
  minimum_work_hours: 8,
  short_leave_enabled: true,
  short_leave_duration_hours: 2,
  short_leaves_for_half_day: 3,
  short_leave_reset_period: 'Monthly',
};

const statusAt = (check_in, count = 0, overrides = {}) => calculateAttendanceStatus({ check_in, status: 'Present' }, { ...settings, ...overrides }, count);

test('short leave uses the grace boundary and duration window correctly', () => {
  assert.equal(statusAt('09:00'), 'Present');
  assert.equal(statusAt('09:10'), 'Present');
  assert.equal(statusAt('09:11'), 'Short Leave');
  assert.equal(statusAt('10:00'), 'Short Leave');
  assert.equal(statusAt('11:00'), 'Short Leave');
  assert.equal(statusAt('11:01'), 'Half Day');
});

test('the monthly short leave limit is enforced per employee per period', () => {
  assert.equal(statusAt('09:11', 0), 'Short Leave');
  assert.equal(statusAt('09:11', 1), 'Short Leave');
  assert.equal(statusAt('09:11', 2), 'Short Leave');
  assert.equal(statusAt('09:11', 3), 'Half Day');
  assert.equal(statusAt('11:01', 3), 'Half Day');
});

test('monthly reset ranges do not mix short-leave usage between months', () => {
  assert.deepEqual(getResetRange('2026-08-31', 'Monthly'), { start: '2026-08-01', end: '2026-08-31' });
  assert.deepEqual(getResetRange('2026-09-05', 'Monthly'), { start: '2026-09-01', end: '2026-09-30' });
  assert.equal(statusAt('09:11', 0), 'Short Leave');
  assert.equal(statusAt('09:11', 3, { short_leave_reset_period: 'Monthly' }), 'Half Day');
});

test('yearly reset starts a new period on january 1', () => {
  assert.deepEqual(getResetRange('2026-01-15', 'Yearly'), { start: '2026-01-01', end: '2026-12-31' });
  assert.deepEqual(getResetRange('2026-12-31', 'Yearly'), { start: '2026-01-01', end: '2026-12-31' });
});

test('disabled short leave keeps the normal late status', () => {
  assert.equal(calculateAttendanceStatus({ check_in: '09:11', status: 'Present' }, { ...settings, short_leave_enabled: false }, 0), 'Late');
});

test('different employees keep separate short leave quotas', () => {
  const employeeA = { employee_id: 1 };
  const employeeB = { employee_id: 2 };
  assert.equal(calculateAttendanceStatus({ ...employeeA, check_in: '09:11', status: 'Present' }, settings, 2), 'Short Leave');
  assert.equal(calculateAttendanceStatus({ ...employeeB, check_in: '09:11', status: 'Present' }, settings, 0), 'Short Leave');
  assert.equal(calculateAttendanceStatus({ ...employeeA, check_in: '09:11', status: 'Present' }, settings, 3), 'Half Day');
});

test('short leave status follows the configured duration when the setting changes', () => {
  const originalSettings = { ...settings, short_leave_duration_hours: 2 };
  assert.equal(calculateAttendanceStatus({ check_in: '11:00', status: 'Present' }, originalSettings, 0), 'Short Leave');
  assert.equal(calculateAttendanceStatus({ check_in: '11:01', status: 'Present' }, originalSettings, 0), 'Half Day');

  const updatedSettings = { ...originalSettings, short_leave_duration_hours: 1 };
  assert.equal(calculateAttendanceStatus({ check_in: '10:00', status: 'Present' }, updatedSettings, 0), 'Short Leave');
  assert.equal(calculateAttendanceStatus({ check_in: '10:01', status: 'Present' }, updatedSettings, 0), 'Half Day');
});

test('minimum work hours cannot override a valid short leave inside the configured window', () => {
  const record = { check_in: '09:30', check_out: '18:00', status: 'Present' };
  const result = calculateAttendanceStatus(record, { ...settings, minimum_work_hours: 9 }, 0);
  assert.equal(result, 'Short Leave');
});

test('legacy monthly field aliases remain compatible', () => {
  assert.equal(calculateAttendanceStatus({ check_in: '09:11', status: 'Present' }, { ...settings, short_leave_enabled: true, short_leaves_for_half_day: undefined, short_leave_limit: 3 }, 0), 'Short Leave');
  assert.equal(calculateAttendanceStatus({ check_in: '09:11', status: 'Present' }, { ...settings, short_leave_enabled: true, monthly_short_leave_limit: 2 }, 2), 'Half Day');
});

test('same attendance rule uses each employee schedule start time', () => {
  const employeeASettings = { ...settings, office_start_time: '10:00:00' };
  const employeeBSettings = { ...settings, office_start_time: '09:00:00' };
  assert.equal(calculateAttendanceStatus({ check_in: '10:10', status: 'Present' }, employeeASettings, 0), 'Present');
  assert.equal(calculateAttendanceStatus({ check_in: '10:10', status: 'Present' }, employeeBSettings, 0), 'Short Leave');
});

test('employee schedule validation enforces time order and effective date', () => {
  assert.deepEqual(validateSchedule({ startTime: '10:00', endTime: '19:00', effectiveFrom: '2026-09-01', graceMinutes: 10 }), {
    start: '10:00', end: '19:00', from: '2026-09-01', to: null, grace: 10,
  });
  assert.throws(() => validateSchedule({ startTime: '19:00', endTime: '10:00', effectiveFrom: '2026-09-01' }), /after start time/);
  assert.throws(() => validateSchedule({ startTime: '10:00', endTime: '19:00', effectiveFrom: '2026-09-01', graceMinutes: -1 }), /greater than or equal to 0/);
});
