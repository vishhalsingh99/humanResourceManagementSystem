INSERT INTO permissions (module, action, permission_key, description, created_at)
VALUES ('Attendance', 'mark', 'attendance.mark', 'Mark Attendance', NOW())
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM roles
INNER JOIN permissions ON permissions.permission_key = 'attendance.mark'
WHERE roles.name = 'Employee';