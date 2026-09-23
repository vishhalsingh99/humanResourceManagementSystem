-- Migration for Wi-Fi Network Attendance
-- Adds support for office IP verification


-- Add source column
ALTER TABLE attendance
ADD COLUMN source VARCHAR(50) DEFAULT 'manual';


-- Add network IP column
ALTER TABLE attendance
ADD COLUMN network_ip VARCHAR(45);


-- Add device information column
ALTER TABLE attendance
ADD COLUMN device_info TEXT;


-- Add allowed Wi-Fi IPs to company settings
ALTER TABLE company_settings
ADD COLUMN wifi_allowed_ips JSON DEFAULT NULL;


-- Create index for source
CREATE INDEX idx_attendance_source
ON attendance(source);


-- Create index for network IP
CREATE INDEX idx_attendance_network_ip
ON attendance(network_ip);