import test from 'node:test';
import assert from 'node:assert/strict';
import { getAttendanceEmployeeId } from './attendanceHelpers.js';

test('getAttendanceEmployeeId resolves the canonical employee id from attendance records', () => {
  assert.equal(getAttendanceEmployeeId({ employee_id: 42 }), 42);
  assert.equal(getAttendanceEmployeeId({ employeeId: '17' }), 17);
  assert.equal(getAttendanceEmployeeId({ employee: { id: 9 } }), 9);
  assert.equal(getAttendanceEmployeeId({ employee: { employee_id: '23' } }), 23);
  assert.equal(getAttendanceEmployeeId({ employee: { employeeId: '31' } }), 31);
  assert.equal(getAttendanceEmployeeId({ employeeID: '88' }), 88);
  assert.equal(getAttendanceEmployeeId({ employee_id: '0', employeeId: '12' }), 12);
  assert.equal(getAttendanceEmployeeId({ employee_id: '' }), null);
  assert.equal(getAttendanceEmployeeId({}), null);
});
