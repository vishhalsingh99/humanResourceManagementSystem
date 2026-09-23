const DEFAULT_PERMISSIONS = [
  ['Employee', 'view', 'employee.view', 'View Employees'],
  ['Employee', 'create', 'employee.create', 'Create Employees'],
  ['Employee', 'edit', 'employee.edit', 'Edit Employees'],
  ['Employee', 'delete', 'employee.delete', 'Delete Employees'],
  ['Attendance', 'view', 'attendance.view', 'View Attendance'],
  ['Attendance', 'view_all', 'attendance.view_all', 'View All Employee Attendance'],
  ['Attendance', 'mark', 'attendance.mark', 'Mark Attendance'],
  ['Attendance', 'edit', 'attendance.edit', 'Edit Attendance'],
  ['Attendance', 'delete', 'attendance.delete', 'Delete Attendance'],
  ['Leave', 'view', 'leave.view', 'View Leave'],
  ['Leave', 'view_all', 'leave.view_all', 'View All Employee Leave'],
  ['Leave', 'apply', 'leave.apply', 'Apply Leave'],
  ['Leave', 'approve', 'leave.approve', 'Approve Leave'],
  ['Leave', 'reject', 'leave.reject', 'Reject Leave'],
  ['Leave', 'delete', 'leave.delete', 'Delete Leave'],
  ['Payroll', 'view', 'payroll.view', 'View Payroll'],
  ['Payroll', 'view_all', 'payroll.view_all', 'View All Employee Payroll'],
  ['Payroll', 'generate', 'payroll.generate', 'Generate Payroll'],
  ['Payroll', 'edit', 'payroll.edit', 'Edit Payroll'],
  ['Payroll', 'delete', 'payroll.delete', 'Delete Payroll'],
  ['Meeting', 'view', 'meeting.view', 'View Meetings'],
  ['Meeting', 'create', 'meeting.create', 'Create Meetings'],
  ['Meeting', 'edit', 'meeting.edit', 'Edit Meetings'],
  ['Meeting', 'delete', 'meeting.delete', 'Delete Meetings'],
  ['Documents', 'view', 'documents.view', 'View Documents'],
  ['Documents', 'upload', 'documents.upload', 'Upload Documents'],
  ['Documents', 'edit', 'documents.edit', 'Edit Documents'],
  ['Documents', 'delete', 'documents.delete', 'Delete Documents'],
  ['Reports', 'view', 'reports.view', 'View Reports'],
  ['Reports', 'export', 'reports.export', 'Export Reports'],
  ['Settings', 'view', 'settings.view', 'View Settings'],
  ['Settings', 'edit', 'settings.edit', 'Edit Settings'],
];

const EMPLOYEE_DEFAULT_PERMISSIONS = [
  'attendance.view',
  'leave.view',
  'leave.apply',
  'payroll.view',
  'documents.view',
  'documents.upload',
];

const COMPANY_ADMIN_PERMISSIONS = DEFAULT_PERMISSIONS.map((permission) => permission[2]);

export {
  DEFAULT_PERMISSIONS,
  EMPLOYEE_DEFAULT_PERMISSIONS,
  COMPANY_ADMIN_PERMISSIONS,
};