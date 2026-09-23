ALTER TABLE company_settings ADD COLUMN short_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN short_leaves_for_half_day INT NOT NULL DEFAULT 3;
ALTER TABLE company_settings ADD COLUMN short_leave_reset_period ENUM('Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly';
