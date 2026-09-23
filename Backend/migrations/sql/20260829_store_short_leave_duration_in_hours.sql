SET @has_short_leave_duration_hours := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'company_settings'
    AND column_name = 'short_leave_duration_hours'
);

SET @add_hours_sql := IF(
  @has_short_leave_duration_hours = 0,
  'ALTER TABLE company_settings ADD COLUMN short_leave_duration_hours DECIMAL(4,2) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE add_hours_stmt FROM @add_hours_sql;
EXECUTE add_hours_stmt;
DEALLOCATE PREPARE add_hours_stmt;

SET @has_short_leave_duration_minutes := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE table_schema = DATABASE()
    AND table_name = 'company_settings'
    AND column_name = 'short_leave_duration_minutes'
);

SET @copy_minutes_sql := IF(
  @has_short_leave_duration_minutes > 0,
  'UPDATE company_settings SET short_leave_duration_hours = short_leave_duration_minutes / 60 WHERE short_leave_duration_minutes IS NOT NULL AND short_leave_duration_minutes > 0',
  'SELECT 1'
);
PREPARE copy_minutes_stmt FROM @copy_minutes_sql;
EXECUTE copy_minutes_stmt;
DEALLOCATE PREPARE copy_minutes_stmt;
