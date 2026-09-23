import { pool as defaultPool } from './config/databases.js';

let targetPool = defaultPool;

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const [rows] = await targetPool.execute(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  if (rows[0].count === 0) {
    await targetPool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await targetPool.execute(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await targetPool.execute(
    `SELECT COUNT(*) AS count FROM information_schema.STATISTICS WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tableName, indexName]
  );

  return rows[0].count > 0;
};

const dropSingleColumnUniqueIndexes = async (tableName, columnName) => {
  const [indexes] = await targetPool.execute(
    `SELECT index_name
     FROM information_schema.STATISTICS
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND non_unique = 0
       AND index_name <> 'PRIMARY'
     GROUP BY index_name
     HAVING COUNT(*) = 1 AND MAX(column_name = ?) = 1`,
    [tableName, columnName]
  );

  // Older installs created users.login_id as a global UNIQUE column. Drop only that
  // single-column unique index so company-scoped duplicates can be stored safely.
  for (const index of indexes) {
    if (!index.index_name) {
      console.log('Skipping invalid index:', index);
      continue;
    }

    const safeIndexName = index.index_name.replace(/`/g, '``');

    await targetPool.execute(
      `ALTER TABLE ${tableName} DROP INDEX \`${safeIndexName}\``
    );
  }
};

const createTables = async (pool = defaultPool, options = {}) => {
  targetPool = pool;
  const {
    includeMasterTables = false,
    includeTenantTables = false
  } = options;

  try {
    if (includeMasterTables) {
      // Users table
      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'employee') DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await addColumnIfMissing('users', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('users', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      await addColumnIfMissing('users', 'employee_id', 'employee_id INT NULL');
      await addColumnIfMissing('users', 'role_id', 'role_id INT NULL');
      await addColumnIfMissing('users', 'login_id', 'login_id VARCHAR(100) NULL');
      await addColumnIfMissing('users', 'tenant_id', 'tenant_id INT NULL');
      await addColumnIfMissing('users', 'tenant_database', 'tenant_database VARCHAR(100) NULL');
      await addColumnIfMissing('users', 'onboarding_completed', 'onboarding_completed BOOLEAN DEFAULT FALSE');
      await addColumnIfMissing('users', 'status', "status ENUM('active', 'inactive') DEFAULT 'active'");
      await dropSingleColumnUniqueIndexes('users', 'login_id');
      if (!await indexExists('users', 'unique_user_tenant_login_id')) {
        await targetPool.execute('ALTER TABLE users ADD UNIQUE KEY unique_user_tenant_login_id (tenant_id, login_id)');
      }
      
      await targetPool.execute(`  
        CREATE TABLE IF NOT EXISTS states (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE
        )
      `);

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS districts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          state_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          UNIQUE KEY unique_district_state_name (state_id, name),
          FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
        )
      `);

      // Pending signups table
      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS pending_signups (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'employee') DEFAULT 'admin',
          otp VARCHAR(6) NOT NULL,
          otp_expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS tenants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_user_id INT NOT NULL UNIQUE,
          company_name VARCHAR(255) NOT NULL,
          database_name VARCHAR(100) NOT NULL UNIQUE,
          subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic',
          status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS tenant_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL UNIQUE,
          admin_user_id INT NOT NULL UNIQUE,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          email VARCHAR(255),
          mobile VARCHAR(30),
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          district VARCHAR(100),
          pincode VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS tenant_companies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL UNIQUE,
          admin_user_id INT NOT NULL UNIQUE,
          company_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          mobile VARCHAR(30),
          pincode VARCHAR(20),
          website VARCHAR(255),
          state VARCHAR(100),
          district VARCHAR(100),
          address TEXT,
          logo_preview MEDIUMTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      await addColumnIfMissing('tenant_companies', 'website', 'website VARCHAR(255) NULL');
      await addColumnIfMissing('tenant_profiles', 'state_id', 'state_id INT NULL');
      await addColumnIfMissing('tenant_profiles', 'district_id', 'district_id INT NULL');
      await addColumnIfMissing('tenant_companies', 'state_id', 'state_id INT NULL');
      await addColumnIfMissing('tenant_companies', 'district_id', 'district_id INT NULL');
      await addColumnIfMissing('tenant_companies', 'logo_preview', 'logo_preview MEDIUMTEXT NULL');

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS tenant_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL UNIQUE,
          admin_user_id INT NOT NULL UNIQUE,
          plan_id VARCHAR(50) NOT NULL DEFAULT 'basic',
          status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
          FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      // Super Admin Audit Logs table
      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_id INT NULL,
          super_admin_id INT NOT NULL,
          action VARCHAR(100) NOT NULL,
          ip_address VARCHAR(100),
          browser TEXT,
          login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          logout_time DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES tenants(id) ON DELETE SET NULL
        )
      `);
      await addColumnIfMissing('super_admin_audit_logs', 'company_id', 'company_id INT NULL');
      await addColumnIfMissing('super_admin_audit_logs', 'super_admin_id', 'super_admin_id INT NOT NULL');
      await addColumnIfMissing('super_admin_audit_logs', 'action', 'action VARCHAR(100) NOT NULL');
      await addColumnIfMissing('super_admin_audit_logs', 'ip_address', 'ip_address VARCHAR(100) NULL');
      await addColumnIfMissing('super_admin_audit_logs', 'browser', 'browser TEXT NULL');
      await addColumnIfMissing('super_admin_audit_logs', 'login_time', 'login_time DATETIME DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('super_admin_audit_logs', 'logout_time', 'logout_time DATETIME NULL');

      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS global_settings (
          id INT PRIMARY KEY DEFAULT 1,
          application_name VARCHAR(255) DEFAULT 'HRMS',
          application_logo TEXT,
          smtp_settings JSON NULL,
          storage_settings JSON NULL,
          jwt_expiry VARCHAR(50) DEFAULT '7d',
          maintenance_mode BOOLEAN DEFAULT FALSE,
          trial_days INT DEFAULT 14,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await addColumnIfMissing('global_settings', 'application_name', "application_name VARCHAR(255) DEFAULT 'HRMS'");
      await addColumnIfMissing('global_settings', 'application_logo', 'application_logo TEXT NULL');
      await addColumnIfMissing('global_settings', 'smtp_settings', 'smtp_settings JSON NULL');
      await addColumnIfMissing('global_settings', 'storage_settings', 'storage_settings JSON NULL');
      await addColumnIfMissing('global_settings', 'jwt_expiry', "jwt_expiry VARCHAR(50) DEFAULT '7d'");
      await addColumnIfMissing('global_settings', 'maintenance_mode', 'maintenance_mode BOOLEAN DEFAULT FALSE');
      await addColumnIfMissing('global_settings', 'trial_days', 'trial_days INT DEFAULT 14');
      await targetPool.execute(
        "INSERT INTO global_settings (id, application_name, jwt_expiry, maintenance_mode, trial_days) VALUES (1, 'HRMS', '7d', FALSE, 14) ON DUPLICATE KEY UPDATE id = id"
      );
    }
    if (includeTenantTables) {
      // Employees table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        email VARCHAR(255),
        department VARCHAR(100),
        designation VARCHAR(100),
        join_date DATE,
        previousSalary DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
      await addColumnIfMissing('employees', 'employee_id', 'employee_id VARCHAR(100)');
      await addColumnIfMissing('employees', 'phone', 'phone VARCHAR(20)');
      await addColumnIfMissing('employees', 'email', 'email VARCHAR(255)');
      await addColumnIfMissing('employees', 'department', 'department VARCHAR(100)');
      await addColumnIfMissing('employees', 'designation', 'designation VARCHAR(100)');
      await addColumnIfMissing('employees', 'join_date', 'join_date DATE');
      await addColumnIfMissing('employees', 'previousSalary', 'previousSalary DECIMAL(10,2)');
      if (await columnExists('employees', 'employeeId')) {
        await targetPool.execute('UPDATE employees SET employee_id = employeeId WHERE employee_id IS NULL');
      }
      await addColumnIfMissing('employees', 'dob', 'dob DATE');
      await addColumnIfMissing('employees', 'gender', "gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male'");
      await addColumnIfMissing('employees', 'bloodGroup', 'bloodGroup VARCHAR(20)');
      await addColumnIfMissing('employees', 'fatherName', 'fatherName VARCHAR(255)');
      await addColumnIfMissing('employees', 'motherName', 'motherName VARCHAR(255)');
      await addColumnIfMissing('employees', 'marital_status', "marital_status ENUM('Single', 'Married', 'Divorced') NULL");
      await addColumnIfMissing('employees', 'spouse_name', 'spouse_name VARCHAR(255) NULL');
      await addColumnIfMissing('employees', 'emergencyContact', 'emergencyContact VARCHAR(20)');
      await addColumnIfMissing('employees', 'currentAddress', 'currentAddress TEXT');
      await addColumnIfMissing('employees', 'permanentAddress', 'permanentAddress TEXT');
      await addColumnIfMissing('employees', 'previousCompany', 'previousCompany VARCHAR(255)');
      await addColumnIfMissing('employees', 'experience', 'experience VARCHAR(100)');
      await addColumnIfMissing('employees', 'salary', 'salary DECIMAL(10,2)');
      await addColumnIfMissing('employees', 'reasonForLeaving', 'reasonForLeaving TEXT');
      await addColumnIfMissing('employees', 'skills', 'skills TEXT');
      await addColumnIfMissing('employees', 'reviewNotes', 'reviewNotes TEXT');
      await addColumnIfMissing('employees', 'aadhaarNumber', 'aadhaarNumber VARCHAR(12)');
      await addColumnIfMissing('employees', 'panNumber', 'panNumber VARCHAR(10)');
      await addColumnIfMissing('employees', 'resumeFile', 'resumeFile VARCHAR(255)');
      await addColumnIfMissing('employees', 'accountholder', 'accountholder VARCHAR(255)');
      await addColumnIfMissing('employees', 'bankName', 'bankName VARCHAR(255)');
      await addColumnIfMissing('employees', 'bankAccountNo', 'bankAccountNo VARCHAR(100)');
      await addColumnIfMissing('employees', 'ifscCode', 'ifscCode VARCHAR(50)');
      await addColumnIfMissing('employees', 'status', "status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'");
      await addColumnIfMissing('employees', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('employees', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_role_name (name)
      )
    `);
      await addColumnIfMissing('roles', 'description', 'description TEXT');
      await addColumnIfMissing('roles', 'is_system', 'is_system BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('roles', 'created_by', 'created_by INT NULL');
      await addColumnIfMissing('roles', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('roles', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module VARCHAR(80) NOT NULL,
        action VARCHAR(80) NOT NULL,
        permission_key VARCHAR(160) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

      // Leave table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type ENUM('Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
      await addColumnIfMissing('leaves', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('leaves', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      await addColumnIfMissing('leaves', 'approved_by', 'approved_by INT NULL');
      await addColumnIfMissing('leaves', 'approved_date', 'approved_date DATE NULL');
      await targetPool.execute(
        "ALTER TABLE leaves MODIFY COLUMN leave_type ENUM('Sick', 'Casual', 'Annual', 'Maternity', 'Paternity', 'Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave') NOT NULL"
      );
      await targetPool.execute(
        "UPDATE leaves SET leave_type = CONCAT(leave_type, ' Leave') WHERE leave_type IN ('Sick', 'Casual', 'Annual', 'Maternity', 'Paternity')"
      );
      await targetPool.execute(
        "ALTER TABLE leaves MODIFY COLUMN leave_type ENUM('Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave') NOT NULL"
      );


      // Attendance table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status ENUM('Present', 'Absent', 'Late', 'Holiday', 'Short Leave', 'Half Day') DEFAULT 'Present',
        overtime DECIMAL(5, 2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_date (employee_id, date)
      )
    `);
      await addColumnIfMissing('attendance', 'employee', 'employee  VARCHAR(255)');
      await addColumnIfMissing('attendance', 'overtime', 'overtime DECIMAL(5, 2)');
      await addColumnIfMissing('attendance', 'notes', 'notes TEXT');
      await addColumnIfMissing('attendance', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('attendance', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      await addColumnIfMissing('attendance', 'source', "source VARCHAR(50) DEFAULT 'manual'");
      await addColumnIfMissing('attendance', 'network_ip', 'network_ip VARCHAR(45)');
      await addColumnIfMissing('attendance', 'device_info', 'device_info TEXT');
      await targetPool.execute(
        "ALTER TABLE attendance MODIFY COLUMN status ENUM('Present', 'Absent', 'Late', 'Holiday', 'Short Leave', 'Half Day') DEFAULT 'Present'"
      );

      // Company settings table
      await targetPool.execute(`
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
        short_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        short_leave_duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.00,
        short_leaves_for_half_day INT NOT NULL DEFAULT 3,
        short_leave_reset_period ENUM('Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly',
        paid_leave_days INT NULL DEFAULT 1,
        attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple',
        wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        camera_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
      await addColumnIfMissing('company_settings', 'office_start_time', "office_start_time TIME NOT NULL DEFAULT '09:30:00'");
      await addColumnIfMissing('company_settings', 'office_end_time', "office_end_time TIME NOT NULL DEFAULT '18:30:00'");
      await addColumnIfMissing('company_settings', 'grace_time', 'grace_time INT NOT NULL DEFAULT 10');
      await addColumnIfMissing('company_settings', 'half_day_after', "half_day_after TIME NOT NULL DEFAULT '13:30:00'");
      await addColumnIfMissing('company_settings', 'minimum_work_hours', 'minimum_work_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00');
      await addColumnIfMissing('company_settings', 'week_off', "week_off VARCHAR(50) NOT NULL DEFAULT 'Sunday'");
      await addColumnIfMissing('company_settings', 'break_start', "break_start TIME NULL DEFAULT '13:00:00'");
      await addColumnIfMissing('company_settings', 'break_end', "break_end TIME NULL DEFAULT '14:00:00'");
      await addColumnIfMissing('company_settings', 'short_leave_time', 'short_leave_time INT NULL DEFAULT 2');
      await addColumnIfMissing('company_settings', 'short_leave_enabled', 'short_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('company_settings', 'short_leave_duration_hours', 'short_leave_duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.00');
      await addColumnIfMissing('company_settings', 'short_leaves_for_half_day', 'short_leaves_for_half_day INT NOT NULL DEFAULT 3');
      await addColumnIfMissing('company_settings', 'short_leave_reset_period', "short_leave_reset_period ENUM('Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly'");
      await addColumnIfMissing('company_settings', 'paid_leave_days', 'paid_leave_days INT NULL DEFAULT 1');
      await addColumnIfMissing('company_settings', 'attendance_type', "attendance_type ENUM('Wi-Fi', 'Fingerprint', 'Camera', 'Multiple') NOT NULL DEFAULT 'Multiple'");
      await addColumnIfMissing('company_settings', 'wifi_enabled', 'wifi_enabled BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('company_settings', 'wifi_allowed_ips', 'wifi_allowed_ips JSON DEFAULT NULL');
      await addColumnIfMissing('company_settings', 'fingerprint_enabled', 'fingerprint_enabled BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('company_settings', 'camera_enabled', 'camera_enabled BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('company_settings', 'sandwich_leave_enabled', 'sandwich_leave_enabled BOOLEAN NOT NULL DEFAULT FALSE');
      await addColumnIfMissing('company_settings', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('company_settings', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      await targetPool.execute(
        `INSERT INTO company_settings (
          id,
          office_start_time,
          office_end_time,
          grace_time,
          half_day_after,
          minimum_work_hours,
          week_off,
          break_start,
          break_end,
          short_leave_time,
          short_leave_enabled,
          short_leave_duration_hours,
          short_leaves_for_half_day,
          short_leave_reset_period,
          attendance_type,
          paid_leave_days,
          wifi_enabled,
          fingerprint_enabled,
          camera_enabled,
          sandwich_leave_enabled,
          created_at,
          updated_at
        )
        VALUES (1, '09:30:00', '18:30:00', 10, '13:30:00', 8.00, 'Sunday', '13:00:00', '14:00:00', 2, FALSE, 1.00, 3, 'Monthly', 'Multiple', 1, FALSE, FALSE, FALSE, FALSE, NOW(), NOW())
        ON DUPLICATE KEY UPDATE id = id`
      );

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS company_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS company_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

      // Meetings table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        location VARCHAR(255),
        organizer_id INT,
        attendees TEXT,
        status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);
      await addColumnIfMissing('meetings', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('meetings', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      // Payroll table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        basic_salary DECIMAL(10, 2) NOT NULL,
        allowances DECIMAL(10, 2) DEFAULT 0,
        deductions DECIMAL(10, 2) DEFAULT 0,
        net_salary DECIMAL(10, 2) NOT NULL,
        payment_date DATE,
        status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_employee_month_year (employee_id, month, year)
      )
    `);
      await addColumnIfMissing('payroll', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('payroll', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      // Salary calculation snapshots table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS salary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        monthly_salary DECIMAL(10, 2) NOT NULL,
        total_days INT NOT NULL,
        daily_salary DECIMAL(10, 2) NOT NULL,
        present_days DECIMAL(5, 2) DEFAULT 0,
        absent_days DECIMAL(5, 2) DEFAULT 0,
        half_days DECIMAL(5, 2) DEFAULT 0,
        leave_days DECIMAL(5, 2) DEFAULT 0,
        sandwich_leave_days DECIMAL(5, 2) DEFAULT 0,
        late_count INT DEFAULT 0,
        overtime_hours DECIMAL(7, 2) DEFAULT 0,
        salary_deductions DECIMAL(10, 2) DEFAULT 0,
        bonus DECIMAL(10, 2) DEFAULT 0,
        final_salary DECIMAL(10, 2) NOT NULL,
        payroll_status ENUM('Not Generated', 'Pending', 'Paid', 'Failed') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE KEY unique_salary_employee_month_year (employee_id, month, year)
      )
    `);
      await addColumnIfMissing('salary', 'monthly_salary', 'monthly_salary DECIMAL(10, 2) NOT NULL');
      await addColumnIfMissing('salary', 'total_days', 'total_days INT NOT NULL');
      await addColumnIfMissing('salary', 'daily_salary', 'daily_salary DECIMAL(10, 2) NOT NULL');
      await addColumnIfMissing('salary', 'present_days', 'present_days DECIMAL(5, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'absent_days', 'absent_days DECIMAL(5, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'half_days', 'half_days DECIMAL(5, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'leave_days', 'leave_days DECIMAL(5, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'sandwich_leave_days', 'sandwich_leave_days DECIMAL(5, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'late_count', 'late_count INT DEFAULT 0');
      await addColumnIfMissing('salary', 'overtime_hours', 'overtime_hours DECIMAL(7, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'salary_deductions', 'salary_deductions DECIMAL(10, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'bonus', 'bonus DECIMAL(10, 2) DEFAULT 0');
      await addColumnIfMissing('salary', 'final_salary', 'final_salary DECIMAL(10, 2) NOT NULL');
      await addColumnIfMissing('salary', 'payroll_status', "payroll_status ENUM('Not Generated', 'Pending', 'Paid', 'Failed') DEFAULT 'Pending'");
      await addColumnIfMissing('salary', 'paid_leave_balance', 'paid_leave_balance DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'paid_leave_used', 'paid_leave_used DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'paid_leave_used_for_absent', 'paid_leave_used_for_absent DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'paid_leave_used_for_half_days', 'paid_leave_used_for_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'unpaid_half_days', 'unpaid_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'unpaid_leave_days', 'unpaid_leave_days DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'monthly_leave_credit', 'monthly_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1');
      await addColumnIfMissing('salary', 'carry_forward_balance', 'carry_forward_balance DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('salary', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('salary', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS leave_balance_history (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        balance_month DATE NOT NULL,
        opening_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
        monthly_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1,
        paid_leave_used DECIMAL(8,2) NOT NULL DEFAULT 0,
        paid_leave_used_for_absent DECIMAL(8,2) NOT NULL DEFAULT 0,
        paid_leave_used_for_half_days DECIMAL(8,2) NOT NULL DEFAULT 0,
        unpaid_leave_days DECIMAL(8,2) NOT NULL DEFAULT 0,
        unpaid_half_days DECIMAL(8,2) NOT NULL DEFAULT 0,
        carry_forward_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
        closing_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
        source VARCHAR(40) NOT NULL DEFAULT 'PAYROLL',
        calculated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_leave_balance_employee_month (employee_id, balance_month),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
      await addColumnIfMissing('leave_balance_history', 'paid_leave_used_for_absent', 'paid_leave_used_for_absent DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('leave_balance_history', 'paid_leave_used_for_half_days', 'paid_leave_used_for_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
      await addColumnIfMissing('leave_balance_history', 'unpaid_half_days', 'unpaid_half_days DECIMAL(8,2) NOT NULL DEFAULT 0');
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS leave_balance_transactions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        balance_month DATE NOT NULL,
        transaction_type ENUM('MONTHLY_CREDIT', 'PAID_LEAVE_USAGE', 'ADJUSTMENT') NOT NULL,
        quantity DECIMAL(8,2) NOT NULL,
        reference_type VARCHAR(40) NOT NULL,
        reference_id BIGINT NULL,
        idempotency_key VARCHAR(160) NOT NULL,
        metadata JSON NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_leave_balance_transaction (employee_id, idempotency_key),
        KEY idx_leave_transaction_employee_month (employee_id, balance_month),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

      // Departments table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL,
        department_code VARCHAR(20) NOT NULL UNIQUE,
      
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);



      await addColumnIfMissing('departments', 'department_code', 'department_code VARCHAR(20) NULL UNIQUE');
      await addColumnIfMissing('departments', 'description', 'description TEXT');
      await addColumnIfMissing('departments', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('departments', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

      // Designations table
      await targetPool.execute(`
      CREATE TABLE IF NOT EXISTS designations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        department_id INT NULL,
        department_name VARCHAR(100) NULL,
        designation_code VARCHAR(20) UNIQUE,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
      await addColumnIfMissing('designations', 'department_id', 'department_id INT NULL');
      await addColumnIfMissing('designations', 'department_name', 'department_name VARCHAR(100) NULL');
      await addColumnIfMissing('designations', 'designation_code', 'designation_code VARCHAR(20) NULL UNIQUE');
      await addColumnIfMissing('designations', 'description', 'description TEXT');
      await addColumnIfMissing('designations', 'status', "status ENUM('Active', 'Inactive') DEFAULT 'Active'");
      await addColumnIfMissing('designations', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('designations', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
     
 


    }

    // Email Verifications table (Master database only)
    if (includeMasterTables) {
      await targetPool.execute(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          email VARCHAR(255) NOT NULL,
          verification_type ENUM('employee_email', 'company_email', 'email_change') NOT NULL,
          otp VARCHAR(6) NOT NULL,
          otp_expires_at DATETIME NOT NULL,
          verified_email VARCHAR(255),
          verified_at DATETIME,
          is_verified BOOLEAN DEFAULT FALSE,
          attempts INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_email_type (email, verification_type),
          INDEX idx_user_verification (user_id, verification_type),
          INDEX idx_otp_expires (otp_expires_at)
        )
      `);
      await addColumnIfMissing('email_verifications', 'id', 'id INT AUTO_INCREMENT PRIMARY KEY');
      await addColumnIfMissing('email_verifications', 'user_id', 'user_id INT');
      await addColumnIfMissing('email_verifications', 'email', 'email VARCHAR(255) NOT NULL');
      await addColumnIfMissing('email_verifications', 'verification_type', "verification_type ENUM('employee_email', 'company_email', 'email_change') NOT NULL");
      await addColumnIfMissing('email_verifications', 'otp', 'otp VARCHAR(6) NOT NULL');
      await addColumnIfMissing('email_verifications', 'otp_expires_at', 'otp_expires_at DATETIME NOT NULL');
      await addColumnIfMissing('email_verifications', 'verified_email', 'verified_email VARCHAR(255)');
      await addColumnIfMissing('email_verifications', 'verified_at', 'verified_at DATETIME');
      await addColumnIfMissing('email_verifications', 'is_verified', 'is_verified BOOLEAN DEFAULT FALSE');
      await addColumnIfMissing('email_verifications', 'attempts', 'attempts INT DEFAULT 0');
      await addColumnIfMissing('email_verifications', 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await addColumnIfMissing('email_verifications', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }

    console.log('✓ All database tables created successfully.');
  } catch (error) {
    console.error('✗ Error creating tables:', error.message);
    throw error;
  }
};

export { createTables };