ALTER TABLE users ADD COLUMN role_id INT NULL;
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';
