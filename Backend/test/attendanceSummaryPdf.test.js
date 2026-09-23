import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAttendanceSummaryPdf } from '../modules/attendance/attendance.pdf.js';

const summaryPayload = {
  employee: {
    id: 7,
    employeeCode: 'EMP001',
    name: 'ssagyhil',
    dateOfJoining: '2026-04-22'
  },
  period: {
    month: '2026-08'
  },
  summary: {
    calendarDays: 31,
    workingDays: 23,
    presentDays: 18,
    halfDays: 2,
    absentDays: 1,
    paidLeaveDays: 4,
    unpaidLeaveDays: 0,
    holidays: 1,
    weekOffs: 4,
    lateDays: 2,
    shortLeaveDays: 1,
    totalWorkingHours: 144,
    overtimeHours: 3.5
  },
  dailyAttendance: [
    {
      date: '2026-08-01',
      day: 'Sat',
      checkIn: '09:15',
      checkOut: '18:00',
      workingHours: '8h 45m',
      lateBy: '0h 0m',
      status: 'Present',
      remarks: ''
    }
  ]
};

test('attendance summary PDF generator creates a real PDF binary', async () => {
  const buffer = await buildAttendanceSummaryPdf(summaryPayload, 'Acme Corp');

  assert.ok(Buffer.isBuffer(buffer));
  assert.match(buffer.toString('ascii', 0, 5), /^%PDF/);
  assert.ok(buffer.length > 1000);
});

test('attendance summary PDF stays at two pages for a normal 31-day month', async () => {
  const monthDays = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const date = `2026-08-${String(day).padStart(2, '0')}`;
    const dayName = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
    return {
      date,
      day: dayName,
      checkIn: '09:15',
      checkOut: '18:00',
      workingHours: '8h 45m',
      lateBy: '0h 0m',
      status: day % 7 === 0 ? 'Present' : 'Present',
      remarks: ''
    };
  });

  const pdf = await buildAttendanceSummaryPdf({ ...summaryPayload, dailyAttendance: monthDays }, 'Acme Corp');
  const pageCount = (pdf.toString('ascii').match(/\/Type \/Page\b/g) || []).length;

  assert.equal(pageCount, 2, `Expected 2 pages for a normal month but found ${pageCount}`);
  assert.equal(monthDays.length, 31);
  assert.ok(pdf.length > 2000);
});
