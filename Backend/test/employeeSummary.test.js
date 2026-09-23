import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSummaryPeriod, countWorkingDays, isWeekOffDate } from '../repositories/attendance.repository.js';

test('DOJ month range starts on the DOJ when the selected month contains the join date', () => {
  const period = buildSummaryPeriod({ join_date: '2026-04-22' }, '2026-04');
  assert.equal(period.start, '2026-04-22');
  assert.equal(period.end, '2026-04-30');
  assert.equal(period.days.length, 9);
});

test('months after DOJ keep the full month range', () => {
  const period = buildSummaryPeriod({ join_date: '2026-04-22' }, '2026-05');
  assert.equal(period.start, '2026-05-01');
  assert.equal(period.end, '2026-05-31');
});

test('months before DOJ are excluded from the summary', () => {
  const period = buildSummaryPeriod({ join_date: '2026-04-22' }, '2026-03');
  assert.equal(period.start, null);
  assert.equal(period.end, null);
  assert.equal(period.valid, false);
});

test('Sunday is treated as a week off by default', () => {
  assert.equal(isWeekOffDate('2026-08-02', 'Sunday'), true);
  assert.equal(isWeekOffDate('2026-08-03', 'Sunday'), false);
});

test('working days count calendar office days independent of attendance status', () => {
  assert.equal(countWorkingDays({
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    weekOff: 'Sunday',
    holidayDates: new Set(['2026-08-15']),
    joinDate: '2026-08-01',
  }), 25);
  assert.equal(countWorkingDays({
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    weekOff: 'Sunday',
    holidayDates: new Set(),
    joinDate: '2026-08-20',
  }), 10);
});
