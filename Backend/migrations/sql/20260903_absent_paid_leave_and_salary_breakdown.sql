SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'company_settings' AND column_name = 'absent_can_use_paid_leave'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE company_settings ADD COLUMN absent_can_use_paid_leave BOOLEAN NOT NULL DEFAULT FALSE');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'salary' AND column_name = 'paid_leave_used_for_absent'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE salary ADD COLUMN paid_leave_used_for_absent DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'salary' AND column_name = 'paid_leave_used_for_half_days'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE salary ADD COLUMN paid_leave_used_for_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'salary' AND column_name = 'unpaid_half_days'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE salary ADD COLUMN unpaid_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'leave_balance_history' AND column_name = 'paid_leave_used_for_absent'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE leave_balance_history ADD COLUMN paid_leave_used_for_absent DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'leave_balance_history' AND column_name = 'paid_leave_used_for_half_days'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE leave_balance_history ADD COLUMN paid_leave_used_for_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE() AND table_name = 'leave_balance_history' AND column_name = 'unpaid_half_days'
);
SET @add_column_sql := IF(@column_exists > 0, 'SELECT 1', 'ALTER TABLE leave_balance_history ADD COLUMN unpaid_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;
