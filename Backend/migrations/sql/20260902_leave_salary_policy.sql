ALTER TABLE company_settings
  ADD COLUMN enable_paid_leave BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN monthly_paid_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1,
  ADD COLUMN carry_forward_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN maximum_carry_forward_days DECIMAL(8,2) NULL,
  ADD COLUMN paid_leave_expiry ENUM('NEVER', 'MONTHLY', 'FINANCIAL_YEAR', 'CUSTOM') NOT NULL DEFAULT 'NEVER',
  ADD COLUMN approved_leave_is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN paid_leave_can_cover_half_day BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN half_day_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 50,
  ADD COLUMN unpaid_leave_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN absent_deduction_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN half_day_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN half_day_paid_percentage DECIMAL(5,2) NOT NULL DEFAULT 50,
  ADD COLUMN one_paid_leave_covers_half_days DECIMAL(5,2) NOT NULL DEFAULT 2;

INSERT INTO company_settings (
  id,
  office_start_time,
  office_end_time,
  grace_time,
  half_day_after,
  minimum_work_hours,
  week_off,
  break_start,
  break_end,
  short_leave_time,
  short_leave_enabled,
  short_leave_duration_hours,
  short_leaves_for_half_day,
  short_leave_reset_period,
  paid_leave_days,
  enable_paid_leave,
  monthly_paid_leave_credit,
  carry_forward_enabled,
  maximum_carry_forward_days,
  paid_leave_expiry,
  approved_leave_is_paid,
  paid_leave_can_cover_half_day,
  half_day_deduction_percent,
  unpaid_leave_deduction_percent,
  absent_deduction_percent,
  half_day_enabled,
  half_day_paid_percentage,
  one_paid_leave_covers_half_days,
  attendance_type,
  wifi_enabled,
  fingerprint_enabled,
  camera_enabled,
  sandwich_leave_enabled,
  created_at,
  updated_at
)
VALUES (
  1,
  '09:30:00', '18:30:00', 10, '13:30:00', 8.00, 'Sunday', '13:00:00', '14:00:00',
  2, FALSE, 1.00, 3, 'Monthly', 1, TRUE, 1, TRUE, NULL, 'NEVER', TRUE, TRUE,
  50, 100, 100, TRUE, 50, 2, 'Multiple', FALSE, FALSE, FALSE, FALSE,
  NOW(), NOW()
)
ON DUPLICATE KEY UPDATE id = id;

UPDATE company_settings
SET
  enable_paid_leave = COALESCE(enable_paid_leave, TRUE),
  monthly_paid_leave_credit = COALESCE(monthly_paid_leave_credit, paid_leave_days),
  carry_forward_enabled = COALESCE(carry_forward_enabled, TRUE),
  maximum_carry_forward_days = COALESCE(maximum_carry_forward_days, NULL),
  paid_leave_expiry = COALESCE(paid_leave_expiry, 'NEVER'),
  approved_leave_is_paid = COALESCE(approved_leave_is_paid, TRUE),
  paid_leave_can_cover_half_day = COALESCE(paid_leave_can_cover_half_day, TRUE),
  half_day_deduction_percent = COALESCE(half_day_deduction_percent, 50),
  unpaid_leave_deduction_percent = COALESCE(unpaid_leave_deduction_percent, 100),
  absent_deduction_percent = COALESCE(absent_deduction_percent, 100),
  half_day_enabled = COALESCE(half_day_enabled, TRUE),
  half_day_paid_percentage = COALESCE(half_day_paid_percentage, 50),
  one_paid_leave_covers_half_days = COALESCE(one_paid_leave_covers_half_days, 2)
WHERE id = 1;

CREATE TABLE IF NOT EXISTS leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_credit DECIMAL(8,2) NOT NULL DEFAULT 0,
  annual_credit DECIMAL(8,2) NULL,
  allow_half_day BOOLEAN NOT NULL DEFAULT TRUE,
  carry_forward_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_type_code (tenant_id, code)
);