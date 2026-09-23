-- Existing tenants can have an ENUM status column created before Short Leave
-- existed.  Expand it before the attendance service writes the new status.
ALTER TABLE attendance
  MODIFY COLUMN status ENUM('Present', 'Absent', 'Late', 'Holiday', 'Short Leave', 'Half Day') DEFAULT 'Present';
