import test from 'node:test';
import assert from 'node:assert/strict';
import { allocatePaidLeave, buildDailyPayrollResults, calculateHalfDayBreakdown } from '../services/salaryCalculator.js';

const money = (value) => Number(Number(value).toFixed(2));

test('half-day policy covers paid leave without double counting', () => {
  const dailySalary = 322.58;
  const result = calculateHalfDayBreakdown({
    totalHalfDays: 4,
    paidLeaveBalance: 1,
    onePaidLeaveCoversHalfDays: 2,
    halfDayDeductionPercent: 50,
    halfDayEnabled: true,
    paidLeaveCanCoverHalfDay: true,
    enablePaidLeave: true,
    dailySalary,
  });

  assert.equal(result.coveredHalfDays, 2);
  assert.equal(result.unpaidHalfDays, 2);
  assert.equal(money(result.halfDayDeduction), 322.58);
});

test('remaining paid leave does not get reused for half days after a full-day paid leave', () => {
  const result = calculateHalfDayBreakdown({
    totalHalfDays: 4,
    paidLeaveBalance: 0,
    paidLeaveUsedForFullDays: 1,
    onePaidLeaveCoversHalfDays: 2,
    halfDayDeductionPercent: 50,
    halfDayEnabled: true,
    paidLeaveCanCoverHalfDay: true,
    enablePaidLeave: true,
    dailySalary: 322.58,
  });

  assert.equal(result.coveredHalfDays, 0);
  assert.equal(result.unpaidHalfDays, 4);
  assert.equal(money(result.halfDayDeduction), 645.16);
});

test('absences consume paid leave before half days', () => {
  const result = allocatePaidLeave({
    availablePaidLeave: 2,
    absentDays: 1,
    halfDays: 2,
    absentCanUsePaidLeave: true,
    paidLeaveCanCoverHalfDay: true,
    onePaidLeaveCoversHalfDays: 2,
  });

  assert.equal(result.paidLeaveUsedForAbsent, 1);
  assert.equal(result.paidLeaveUsedForHalfDays, 1);
  assert.equal(result.unpaidAbsentDays, 0);
  assert.equal(result.unpaidHalfDays, 0);
  assert.equal(result.totalPaidLeaveUsed, 2);
});

test('paid leave cannot be reused when absent coverage is disabled', () => {
  const result = allocatePaidLeave({ availablePaidLeave: 2, absentDays: 1, absentCanUsePaidLeave: false });

  assert.equal(result.paidLeaveUsedForAbsent, 0);
  assert.equal(result.unpaidAbsentDays, 1);
  assert.equal(result.remainingPaidLeave, 2);
});

test('daily payroll projection applies paid leave in priority order once', () => {
  const results = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-05' },
    attendanceRecords: [
      { date: '2026-09-01', status: 'Present' },
      { date: '2026-09-02', status: 'Absent' },
      { date: '2026-09-03', status: 'Half Day' },
      { date: '2026-09-04', status: 'Present' },
    ],
    leaveRecords: [{ leave_type: 'Sick Leave', start_date: '2026-09-04', end_date: '2026-09-04' }],
    settings: {
      enable_paid_leave: true,
      absent_can_use_paid_leave: true,
      paid_leave_can_cover_half_day: true,
      one_paid_leave_covers_half_days: 2,
    },
    availablePaidLeave: 2,
  });

  assert.equal(results.find((result) => result.date === '2026-09-04').paidLeaveUsedFor, 'approved-leave');
  assert.equal(results.find((result) => result.date === '2026-09-02').paidLeaveUsedFor, 'absent');
  assert.equal(results.find((result) => result.date === '2026-09-03').paidLeaveUsed, 0);
  assert.equal(results.find((result) => result.date === '2026-09-05').attendanceStatus, 'Absent');
  assert.equal(results.filter((result) => result.paidLeaveUsed > 0).length, 2);
});

test('daily payroll projection keeps future dates out of the calculation period', () => {
  const results = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-05' },
    attendanceRecords: [
      { date: '2026-09-06', status: 'Present' },
    ],
  });

  assert.equal(results.some((result) => result.date === '2026-09-06'), false);
  assert.equal(results.length, 5);
});

test('approved paid leave takes precedence over absent attendance', () => {
  const [result] = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-01' },
    attendanceRecords: [{ date: '2026-09-01', status: 'Absent' }],
    leaveRecords: [{ leave_type: 'Sick Leave', start_date: '2026-09-01', end_date: '2026-09-01' }],
    availablePaidLeave: 1,
  });

  assert.equal(result.isApprovedPaidLeave, true);
  assert.equal(result.isAbsent, false);
  assert.equal(result.isApprovedUnpaidLeave, false);
  assert.equal(result.paidLeaveUsed, 1);
});

test('approved leave without balance becomes unpaid leave instead of absent', () => {
  const [result] = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-01' },
    attendanceRecords: [{ date: '2026-09-01', status: 'Absent' }],
    leaveRecords: [{ leave_type: 'Sick Leave', start_date: '2026-09-01', end_date: '2026-09-01' }],
    availablePaidLeave: 0,
  });

  assert.equal(result.isApprovedPaidLeave, false);
  assert.equal(result.isApprovedUnpaidLeave, true);
  assert.equal(result.isAbsent, false);
  assert.equal(result.payrollStatus, 'Unpaid Leave');
});

test('actual absent and half-day statuses remain distinct without approved leave', () => {
  const results = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-02' },
    attendanceRecords: [
      { date: '2026-09-01', status: 'Absent' },
      { date: '2026-09-02', status: 'Half Day' },
    ],
    availablePaidLeave: 0,
  });

  assert.equal(results[0].isAbsent, true);
  assert.equal(results[0].isHalfDay, false);
  assert.equal(results[1].isAbsent, false);
  assert.equal(results[1].isHalfDay, true);
});

test('approved leave takes precedence over half-day attendance', () => {
  const [result] = buildDailyPayrollResults({
    period: { start: '2026-09-01', end: '2026-09-01' },
    attendanceRecords: [{ date: '2026-09-01', status: 'Half Day' }],
    leaveRecords: [{ leave_type: 'Sick Leave', start_date: '2026-09-01', end_date: '2026-09-01' }],
    availablePaidLeave: 1,
  });

  assert.equal(result.isApprovedPaidLeave, true);
  assert.equal(result.isHalfDay, false);
  assert.equal(result.paidLeaveUsedFor, 'approved-leave');
});
