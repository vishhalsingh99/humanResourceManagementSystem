-- Employee login IDs must be unique within a company, not globally.
-- Run this against the master database that contains the users table.

SET @login_id_unique_index := (
  SELECT index_name
  FROM information_schema.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND non_unique = 0
    AND index_name <> 'PRIMARY'
  GROUP BY index_name
  HAVING COUNT(*) = 1 AND MAX(column_name = 'login_id') = 1
  LIMIT 1
);

SET @drop_login_id_unique_sql := IF(
  @login_id_unique_index IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE users DROP INDEX `', @login_id_unique_index, '`')
);

PREPARE drop_login_id_unique_stmt FROM @drop_login_id_unique_sql;
EXECUTE drop_login_id_unique_stmt;
DEALLOCATE PREPARE drop_login_id_unique_stmt;

SET @tenant_login_unique_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'unique_user_tenant_login_id'
);

SET @add_tenant_login_unique_sql := IF(
  @tenant_login_unique_exists > 0,
  'SELECT 1',
  'ALTER TABLE users ADD UNIQUE KEY unique_user_tenant_login_id (tenant_id, login_id)'
);

PREPARE add_tenant_login_unique_stmt FROM @add_tenant_login_unique_sql;
EXECUTE add_tenant_login_unique_stmt;
DEALLOCATE PREPARE add_tenant_login_unique_stmt;
