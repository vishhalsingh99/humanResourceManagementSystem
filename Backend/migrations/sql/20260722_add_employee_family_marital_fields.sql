SET @marital_status_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND column_name = 'marital_status'
);

SET @add_marital_status_sql := IF(
  @marital_status_exists > 0,
  'SELECT 1',
  "ALTER TABLE employees ADD COLUMN marital_status ENUM('Single', 'Married', 'Divorced') NULL"
);

PREPARE add_marital_status_stmt FROM @add_marital_status_sql;
EXECUTE add_marital_status_stmt;
DEALLOCATE PREPARE add_marital_status_stmt;

SET @spouse_name_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'employees'
    AND column_name = 'spouse_name'
);

SET @add_spouse_name_sql := IF(
  @spouse_name_exists > 0,
  'SELECT 1',
  'ALTER TABLE employees ADD COLUMN spouse_name VARCHAR(255) NULL'
);

PREPARE add_spouse_name_stmt FROM @add_spouse_name_sql;
EXECUTE add_spouse_name_stmt;
DEALLOCATE PREPARE add_spouse_name_stmt;

UPDATE employees
SET spouse_name = NULL
WHERE marital_status IS NULL OR marital_status <> 'Married';
