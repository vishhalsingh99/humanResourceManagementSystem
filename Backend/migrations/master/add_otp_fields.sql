-- Add OTP fields to users table
ALTER TABLE users
ADD COLUMN otp VARCHAR(6) NULL,
ADD COLUMN otp_expires_at DATETIME NULL;

-- Add index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Add index for OTP expiration cleanup
CREATE INDEX idx_users_otp_expires_at ON users(otp_expires_at);