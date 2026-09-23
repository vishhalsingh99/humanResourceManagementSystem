import { pool } from '../config/databases.js';

const normalizeEmployee = (employeeData = {}) => {
  const employeeId = employeeData.employeeId || employeeData.employee_id;
  const joinDate = employeeData.joinDate || employeeData.join_date;
  const currentAddress = employeeData.currentAddress || employeeData.address || null;
  const bankAccountNo = employeeData.bankAccountNo || employeeData.bankAccountNumber || null;
  const maritalStatus = employeeData.maritalStatus || employeeData.marital_status || null;
  const spouseName = maritalStatus === 'Married'
    ? (String(employeeData.spouseName || employeeData.spouse_name || '').trim() || null)
    : null;

  return {
    name: employeeData.name,
    employee_id: employeeId,
    dob: employeeData.dob || null,
    gender: employeeData.gender || 'male',
    bloodGroup: employeeData.bloodGroup || null,
    fatherName: employeeData.fatherName || null,
    motherName: employeeData.motherName || null,
    marital_status: maritalStatus,
    spouse_name: spouseName,
    phone: employeeData.phone,
    emergencyContact: employeeData.emergencyContact || null,
    email: employeeData.email,
    currentAddress,
    permanentAddress: employeeData.permanentAddress || null,
    previousCompany: employeeData.previousCompany || null,
    experience: employeeData.experience || null,
    salary: employeeData.salary || null,
    previousSalary: employeeData.previousSalary || null,
    reasonForLeaving: employeeData.reasonForLeaving || null,
    department: employeeData.department,
    designation: employeeData.designation,
    join_date: joinDate || null,
    skills: employeeData.skills || null,
    reviewNotes: employeeData.reviewNotes || employeeData.Review || null,
    aadhaarNumber: employeeData.aadhaarNumber ? String(employeeData.aadhaarNumber).trim() : null,
    panNumber: employeeData.panNumber ? String(employeeData.panNumber).trim().toUpperCase() : null,
    resumeFile: employeeData.resumeFile || null,
    accountholder: employeeData.accountholder || null,
    bankName: employeeData.bankName || null,
    bankAccountNo: bankAccountNo ? String(bankAccountNo).trim() : null,
    ifscCode: employeeData.ifscCode ? String(employeeData.ifscCode).trim().toUpperCase() : null,
  };
};
     

const toApiEmployee = (employee = {}) => ({
  ...employee,
  employeeId: employee.employee_id || employee.employeeId,
  maritalStatus: employee.marital_status || employee.maritalStatus,
  spouseName: employee.spouse_name || employee.spouseName,
  bankAccountNumber: employee.bankAccountNo,
  Review: employee.reviewNotes
});

class Employee {
  static async generateNextEmployeeId() {
    try {
      const [rows] = await pool.execute(
        `SELECT employee_id
         FROM employees
         WHERE employee_id REGEXP '^EMP[0-9]+$'
         ORDER BY CAST(SUBSTRING(employee_id, 4) AS UNSIGNED) DESC
         LIMIT 1`
      );

      const lastNumber = rows[0]?.employee_id
        ? Number(rows[0].employee_id.replace('EMP', ''))
        : 0;

      return `EMP${String(lastNumber + 1).padStart(3, '0')}`;
    } catch (error) {
      throw new Error('Failed to generate employee ID: ' + error.message);
    }
  }

  // Get all employees, optionally filtered by status ('active' | 'inactive')
  static async findAll(status) {
    try {
      const query = ['active', 'inactive'].includes(status)
        ? 'SELECT * FROM employees WHERE status = ? ORDER BY created_at DESC'
        : 'SELECT * FROM employees ORDER BY created_at DESC';
      const params = ['active', 'inactive'].includes(status) ? [status] : [];

      const [rows] = await pool.execute(query, params);
      return rows.map(toApiEmployee);
    } catch (error) {
      throw new Error('Failed to fetch employees: ' + error.message);
    }
  }

  static async countAll() {
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM employees');
      return Number(rows[0]?.count || 0);
    } catch (error) {
      throw new Error('Failed to count employees: ' + error.message);
    }
  }

  // Get employee by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM employees WHERE id = ?',
        [id]
      );
      return rows[0] ? toApiEmployee(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to fetch employee: ' + error.message);
    }
  }

  // Create new employee
  static async create(employeeData) {
    try {
      const employeeId = employeeData.employeeId
        || employeeData.employee_id
        || await this.generateNextEmployeeId();
      const employee = normalizeEmployee({
        ...employeeData,
        employeeId
      });
      const columns = Object.keys(employee);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((column) => employee[column]);

      const [result] = await pool.execute(
        `INSERT INTO employees (${columns.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`,
        values
      );
      return toApiEmployee({ id: result.insertId, ...employee });
    } catch (error) {
      throw new Error('Failed to create employee: ' + error.message);
    }
  }

  // Update employee
  static async update(id, employeeData) {
    try {
      const employee = normalizeEmployee(employeeData);
      const columns = Object.keys(employee);
      const assignments = columns.map((column) => `${column} = ?`).join(', ');
      const values = columns.map((column) => employee[column]);

      await pool.execute(
        `UPDATE employees SET ${assignments}, updated_at = NOW() WHERE id = ?`,
        [...values, id]
      );
      return toApiEmployee({ id, ...employee });
    } catch (error) {
      throw new Error('Failed to update employee: ' + error.message);
    }
  }

  // Update employee status (active/inactive) without touching other fields
  static async updateStatus(id, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE employees SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error('Failed to update employee status: ' + error.message);
    }
  }

  // Delete employee
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM employees WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete employee: ' + error.message);
    }
  }

  // Get employee by employee ID
  static async findByEmployeeId(employeeId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM employees WHERE employee_id = ?',
        [employeeId]
      );
      return rows[0] ? toApiEmployee(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to fetch employee: ' + error.message);
    }
  }
}

export default Employee;