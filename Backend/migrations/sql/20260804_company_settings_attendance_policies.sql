CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  office_start_time TIME NOT NULL DEFAULT '09:30:00',
  office_end_time TIME NOT NULL DEFAULT '18:30:00',
  grace_time INT NOT NULL DEFAULT 10,
  half_day_after TIME NOT NULL DEFAULT '13:30:00',
  minimum_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  week_off VARCHAR(50) NOT NULL DEFAULT 'Sunday',
  break_start TIME NULL DEFAULT '13:00:00',
  break_end TIME NULL DEFAULT '14:00:00',
  short_leave_time INT NULL DEFAULT 2,
  paid_leave_days INT NULL DEFAULT 1,
  attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple',
  wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  camera_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE company_settings ADD COLUMN office_start_time TIME NOT NULL DEFAULT '09:30:00';
ALTER TABLE company_settings ADD COLUMN office_end_time TIME NOT NULL DEFAULT '18:30:00';
ALTER TABLE company_settings ADD COLUMN grace_time INT NOT NULL DEFAULT 10;
ALTER TABLE company_settings ADD COLUMN half_day_after TIME NOT NULL DEFAULT '13:30:00';
ALTER TABLE company_settings ADD COLUMN minimum_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00;
ALTER TABLE company_settings ADD COLUMN week_off VARCHAR(50) NOT NULL DEFAULT 'Sunday';
ALTER TABLE company_settings ADD COLUMN break_start TIME NULL DEFAULT '13:00:00';
ALTER TABLE company_settings ADD COLUMN break_end TIME NULL DEFAULT '14:00:00';
ALTER TABLE company_settings ADD COLUMN short_leave_time INT NULL DEFAULT 2;
ALTER TABLE company_settings ADD COLUMN paid_leave_days INT NULL DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple';
ALTER TABLE company_settings ADD COLUMN wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN camera_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE company_settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE company_settings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

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
  attendance_type,
  paid_leave_days,
  wifi_enabled,
  fingerprint_enabled,
  camera_enabled,
  sandwich_leave_enabled,
  created_at,
  updated_at
)
VALUES (1, '09:30:00', '18:30:00', 10, '13:30:00', 8.00, 'Sunday', '13:00:00', '14:00:00', 'Multiple', 1, FALSE, FALSE, FALSE, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS company_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);