export function formatDate(date) {
  if (!date) return '-';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString();
}

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formats a YYYY-MM-DD (or ISO) date string as "DD MMM YYYY" (e.g. 23 Apr 2026)
// without going through Date's local-timezone getters, which can shift the day.
export function formatJoinDate(date) {
  if (!date) return '-';

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
  if (!match) return '-';

  const [, year, month, day] = match;
  const monthName = MONTH_ABBREVIATIONS[Number(month) - 1];
  if (!monthName) return '-';

  return `${day} ${monthName} ${year}`;
}

export function getEmployeeCode(employee) {
  return employee.employeeId || employee.employee_id || '-';
}

export function getDetailValue(employee, field) {
  const value = typeof field === 'function' ? field(employee) : employee[field];
  return value === undefined || value === null || value === '' ? '-' : value;
}

export function normalizeEmployeeForEdit(employee, emptyForm) {
  const maritalStatus = employee.maritalStatus || employee.marital_status || '';
  const schedule = employee.workSchedule || {};

  return {
    ...emptyForm,
    ...employee,
    maritalStatus,
    spouseName: maritalStatus === 'Married' ? (employee.spouseName || employee.spouse_name || '') : '',
    join_date: employee.join_date ? String(employee.join_date).slice(0, 10) : '',
    dob: employee.dob ? String(employee.dob).slice(0, 10) : '',
    workStartTime: schedule.startTime || '',
    workEndTime: schedule.endTime || '',
    scheduleEffectiveFrom: schedule.effectiveFrom || (employee.join_date ? String(employee.join_date).slice(0, 10) : ''),
  };
}

export function filterEmployees(employees, search, statusFilter = 'all') {
  const term = search.toLowerCase();

  return employees.filter((employee) => {
    const matchesSearch =
      employee.name?.toLowerCase().includes(term) ||
      (employee.employeeId || employee.employee_id || '').toLowerCase().includes(term) ||
      (employee.phone || '').includes(search);

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return employee.status !== 'inactive';
    if (statusFilter === 'inactive') return employee.status === 'inactive';
    return true;
  });
}
