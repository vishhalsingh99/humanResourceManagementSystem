import { CALENDAR_STATUS_COLORS } from './constants';

export const normalizeText = (value) => String(value || '').trim().toLowerCase();
export const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');
export const getEmployeeCode = (employee) => employee?.employeeId || employee?.employee_id || '-';

export const getAttendanceEmployeeId = (record = {}) => {
  const candidates = [
    record.employee_id,
    record.employeeId,
    record.employee?.id,
    record.employee?.employee_id,
    record.employee?.employeeId,
    record.employeeID,
    record.employee_id || record.employeeId,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  return null;
};

export const getAttendancePayload = ({ employee_id, date, check_in, check_out, status, overtime, notes }, emptyValuesAsNull = false) => ({
  employeeId: employee_id,
  date,
  checkIn: emptyValuesAsNull ? check_in || null : check_in,
  checkOut: emptyValuesAsNull ? check_out || null : check_out,
  status: status || 'Present',
  ...(overtime !== undefined && { overtime }),
  notes: emptyValuesAsNull ? notes || null : notes,
});

export const getRecordEmployee = (record, employeeById) => {
  const employeeId = getAttendanceEmployeeId(record);
  if (!employeeId) return undefined;
  return employeeById.get(Number(employeeId));
};

export const createCalendarEvents = (records) => records.map((record) => ({
  title: record.status,
  start: record.date,
  backgroundColor: CALENDAR_STATUS_COLORS[record.status] || '#f97316',
}));
