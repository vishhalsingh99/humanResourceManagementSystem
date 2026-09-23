INSERT INTO permissions (module, action, permission_key, description, created_at) VALUES
('Attendance', 'view_all', 'attendance.view_all', 'View All Employee Attendance', NOW()),
('Leave', 'view_all', 'leave.view_all', 'View All Employee Leave', NOW())
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);