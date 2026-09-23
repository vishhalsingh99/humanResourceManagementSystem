CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_name (name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(80) NOT NULL,
  permission_key VARCHAR(160) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

INSERT INTO permissions (module, action, permission_key, description, created_at) VALUES
('Employee', 'view', 'employee.view', 'View Employees', NOW()),
('Employee', 'create', 'employee.create', 'Create Employees', NOW()),
('Employee', 'edit', 'employee.edit', 'Edit Employees', NOW()),
('Employee', 'delete', 'employee.delete', 'Delete Employees', NOW()),
('Attendance', 'view', 'attendance.view', 'View Attendance', NOW()),
('Attendance', 'mark', 'attendance.mark', 'Mark Attendance', NOW()),
('Attendance', 'edit', 'attendance.edit', 'Edit Attendance', NOW()),
('Attendance', 'delete', 'attendance.delete', 'Delete Attendance', NOW()),
('Leave', 'view', 'leave.view', 'View Leave', NOW()),
('Leave', 'apply', 'leave.apply', 'Apply Leave', NOW()),
('Leave', 'approve', 'leave.approve', 'Approve Leave', NOW()),
('Leave', 'reject', 'leave.reject', 'Reject Leave', NOW()),
('Leave', 'delete', 'leave.delete', 'Delete Leave', NOW()),
('Payroll', 'view', 'payroll.view', 'View Payroll', NOW()),
('Payroll', 'generate', 'payroll.generate', 'Generate Payroll', NOW()),
('Payroll', 'edit', 'payroll.edit', 'Edit Payroll', NOW()),
('Payroll', 'delete', 'payroll.delete', 'Delete Payroll', NOW()),
('Meeting', 'view', 'meeting.view', 'View Meetings', NOW()),
('Meeting', 'create', 'meeting.create', 'Create Meetings', NOW()),
('Meeting', 'edit', 'meeting.edit', 'Edit Meetings', NOW()),
('Meeting', 'delete', 'meeting.delete', 'Delete Meetings', NOW()),
('Documents', 'view', 'documents.view', 'View Documents', NOW()),
('Documents', 'upload', 'documents.upload', 'Upload Documents', NOW()),
('Documents', 'edit', 'documents.edit', 'Edit Documents', NOW()),
('Documents', 'delete', 'documents.delete', 'Delete Documents', NOW()),
('Reports', 'view', 'reports.view', 'View Reports', NOW()),
('Reports', 'export', 'reports.export', 'Export Reports', NOW()),
('Settings', 'view', 'settings.view', 'View Settings', NOW()),
('Settings', 'edit', 'settings.edit', 'Edit Settings', NOW())
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

INSERT INTO roles (name, description, is_system, created_at, updated_at)
VALUES ('Employee', 'Default employee access', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_system = TRUE;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
INNER JOIN permissions ON permissions.permission_key IN (
  'attendance.view',
  'attendance.mark',
  'leave.view',
  'leave.apply',
  'payroll.view',
  'documents.view',
  'documents.upload'
)
WHERE roles.name = 'Employee';
