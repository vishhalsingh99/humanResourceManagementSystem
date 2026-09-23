export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Short Leave', 'Absent', 'Holiday', 'Half Day'];
export const ITEMS_PER_PAGE = 10;

export const STATUS_TONES = {
  Present: 'green',
  Absent: 'red',
  Late: 'yellow',
  'Short Leave': 'blue',
  Holiday: 'blue',
  Sunday: 'slate',
  'Half Day': 'blue',
};

export const CALENDAR_STATUS_COLORS = {
  Present: '#22c55e',
  Absent: '#ef4444',
  Leave: '#eab308',
  Holiday: '#3b82f6',
  Sunday: '#6b7280',
  'Short Leave': '#8b5cf6',
};

export const createEmptyForm = () => ({
  employee_id: '', date: new Date().toISOString().slice(0, 10), check_in: '', check_out: '',
  status: 'Present', overtime: '', notes: '',
});

export const createEmptyCriteria = () => ({ department: '', designation: '', date: new Date().toISOString().slice(0, 10) });
