import { pool } from '../../config/databases.js';
import * as salaryCalculator from '../../services/salaryCalculator.js';
class Payroll {
  // Get all payrolls with employee details
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
SELECT
    p.*,
    e.name AS employee_name,
    e.department,
    e.salary AS employee_salary
FROM payroll p
LEFT JOIN employees e
    ON e.id = p.employee_id
ORDER BY p.created_at DESC
`);

      // Map database fields to match frontend expectations
   const payrolls = await Promise.all(
  rows.map(async (row) => {
    const dashboard = await salaryCalculator.calculateSalary({
      employeeId: row.employee_id,
      month: row.month,
      year: row.year,
    });

    return {
      _id: row.id,
      id: row.id,
      employeeId: row.employee_id,
      employee_id: row.employee_id,

      month: row.month,
      year: row.year,

      basic_salary: row.basic_salary,
      allowances: row.allowances,

      deductions: dashboard.salary.totalDeductions,
      net_salary: dashboard.salary.netSalary,

      payment_date: row.payment_date,
      status: row.status,

      presentDays: dashboard.attendance.presentDays,
      absentDays: dashboard.attendance.absentDays,
      leaveDays: dashboard.leave.totalLeaveDays,

      employee: {
        id: row.employee_id,
        name: row.employee_name,
        department: row.department,
        salary: row.employee_salary,
      },

      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  })
);

return payrolls;
    } catch (error) {
      throw new Error('Failed to fetch payrolls: ' + error.message);
    }
  }

  // Get payroll by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, e.name as employee_name, e.department, e.salary as employee_salary
        FROM payroll p
        LEFT JOIN employees e ON p.employee_id = e.id
        WHERE p.id = ?
      `, [id]);

      if (!rows[0]) return null;

      const row = rows[0];
      return {
        _id: row.id,
        id: row.id,
        employeeId: row.employee_id,
        employee_id: row.employee_id,
        month: row.month,
        year: row.year,
        basic_salary: row.basic_salary,
        allowances: row.allowances,
        deductions: row.deductions,
        net_salary: row.net_salary,
        payment_date: row.payment_date,
        status: row.status,
        employee: {
          _id: row.id,
          id: row.id,
          name: row.employee_name,
          department: row.department,
          salary: row.employee_salary,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      throw new Error('Failed to fetch payroll: ' + error.message);
    }
  }

  // Create new payroll
  static async create(payrollData) {
    try {
      const { employeeId, month, year, basic_salary, allowances, deductions, net_salary, status } = payrollData;
      const [result] = await pool.execute(
        'INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, NOW(), NOW())',
        [employeeId, month, year, basic_salary, allowances || 0, deductions || 0, net_salary, status || 'Pending']
      );

      // Return the created payroll with employee details
      return this.findById(result.insertId);
    } catch (error) {
      throw new Error('Failed to create payroll: ' + error.message);
    }
  }

  // Update payroll
  static async update(id, payrollData) {
    try {
      const { month, year, basic_salary, allowances, deductions, net_salary, status } = payrollData;
      await pool.execute(
        'UPDATE payroll SET month = ?, year = ?, basic_salary = ?, allowances = ?, deductions = ?, net_salary = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [month, year, basic_salary, allowances, deductions, net_salary, status, id]
      );
      return this.findById(id);
    } catch (error) {
      throw new Error('Failed to update payroll: ' + error.message);
    }
  }

  // Delete payroll
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM payroll WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete payroll: ' + error.message);
    }
  }
}

export default Payroll;