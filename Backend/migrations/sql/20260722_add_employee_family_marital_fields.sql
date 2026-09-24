ALTER TABLE employees ADD COLUMN marital_status ENUM('Single', 'Married', 'Divorced') NULL;

ALTER TABLE employees ADD COLUMN spouse_name VARCHAR(255) NULL;

UPDATE employees
SET spouse_name = NULL
WHERE marital_status IS NULL OR marital_status <> 'Married';
