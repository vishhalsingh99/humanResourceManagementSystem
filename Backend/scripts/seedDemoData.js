import bcrypt from 'bcryptjs';
import { dbConfig, masterPool } from '../config/databases.js';

const demoEmployee = {
  name: process.env.SEED_EMPLOYEE_NAME || 'Aarav Sharma',
  email: process.env.SEED_EMPLOYEE_EMAIL || 'employee@example.com',
  password: process.env.SEED_EMPLOYEE_PASSWORD || 'Demo@12345',
  phone: process.env.SEED_EMPLOYEE_PHONE || '9876543210',
};

export const seedDemoData = async () => {
  const [departments] = await masterPool.execute(
    `INSERT INTO departments (department_name, department_code, status, description)
     VALUES ('Engineering', 'ENG', 'Active', 'Product and platform engineering')
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'Active'`,
  );
  const departmentId = departments.insertId;

  const [designations] = await masterPool.execute(
    `INSERT INTO designations (name, department_id, department_name, designation_code, description, status)
     VALUES ('Software Engineer', ?, 'Engineering', 'SWE', 'Demo employee designation', 'Active')
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), department_id = VALUES(department_id), status = 'Active'`,
    [departmentId]
  );
  const designationId = designations.insertId;

  const [employees] = await masterPool.execute(
    `INSERT INTO employees (
      name, employee_id, dob, gender, bloodGroup, fatherName, motherName,
      marital_status, phone, email, department, designation, join_date,
      currentAddress, permanentAddress, salary, status, created_at, updated_at
    ) VALUES (?, 'EMP001', '1995-04-12', 'Male', 'O+', 'Rajesh Sharma', 'Sunita Sharma',
      'Single', ?, ?, 'Engineering', 'Software Engineer', CURDATE(),
      'Bengaluru', 'Bengaluru', 75000, 'active', NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      id = LAST_INSERT_ID(id), name = VALUES(name), phone = VALUES(phone),
      email = VALUES(email), department = VALUES(department), designation = VALUES(designation),
      salary = VALUES(salary), status = 'active', updated_at = NOW()`,
    [demoEmployee.name, demoEmployee.phone, demoEmployee.email]
  );
  const employeeId = employees.insertId;
  const passwordHash = await bcrypt.hash(demoEmployee.password, 10);

  await masterPool.execute(
    `INSERT INTO users (
      name, email, password, role, employee_id, login_id, tenant_id,
      tenant_database, onboarding_completed, status, created_at, updated_at
    )
    SELECT ?, ?, ?, 'employee', ?, ?, t.id, ?, TRUE, 'active', NOW(), NOW()
    FROM tenants t
    WHERE t.database_name = ?
    LIMIT 1
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), password = VALUES(password), employee_id = VALUES(employee_id),
      tenant_id = VALUES(tenant_id), tenant_database = VALUES(tenant_database),
      onboarding_completed = TRUE, status = 'active', updated_at = NOW()`,
    [demoEmployee.name, demoEmployee.email, passwordHash, employeeId, demoEmployee.email, dbConfig.database, dbConfig.database]
  );

  await masterPool.execute(
    `INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
     VALUES (?, CURDATE(), '09:30:00', '18:30:00', 'Present', 'Demo attendance record')
     ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), check_out = VALUES(check_out), status = 'Present'`,
    [employeeId]
  );

  const [existingLeave] = await masterPool.execute(
    `SELECT id FROM leaves WHERE employee_id = ? AND reason = 'Demo leave request' LIMIT 1`,
    [employeeId]
  );
  if (!existingLeave.length) {
    await masterPool.execute(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, 'Casual Leave', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Demo leave request', 'Pending')`,
      [employeeId]
    );
  }

  const [existingMeeting] = await masterPool.execute(
    `SELECT id FROM meetings WHERE title = 'Engineering Stand-up' AND organizer_id = ? LIMIT 1`,
    [employeeId]
  );
  if (!existingMeeting.length) {
    await masterPool.execute(
      `INSERT INTO meetings (title, description, date, time, location, organizer_id, status)
       VALUES ('Engineering Stand-up', 'Demo team sync meeting', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'Conference Room', ?, 'Scheduled')`,
      [employeeId]
    );
  }

  await masterPool.execute(
    `INSERT INTO payroll (
      employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status
    ) VALUES (?, DATE_FORMAT(CURDATE(), '%M'), YEAR(CURDATE()), 75000, 5000, 2000, 78000, CURDATE(), 'Pending')
    ON DUPLICATE KEY UPDATE basic_salary = VALUES(basic_salary), net_salary = VALUES(net_salary), status = 'Pending'`,
    [employeeId]
  );

  void designationId;
  console.log(`Seeded demo employee: ${demoEmployee.email}`);
};
