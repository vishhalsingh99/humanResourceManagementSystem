INSERT INTO permissions (module, action, permission_key, description, created_at)
VALUES ('Payroll', 'view_all', 'payroll.view_all', 'View All Employee Payroll', NOW())
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);