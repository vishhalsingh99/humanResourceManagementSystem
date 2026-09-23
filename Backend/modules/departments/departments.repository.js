import { pool } from '../../config/databases.js';

const makeDepartmentCode = (name = '') =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12) || `DEPT${Date.now()}`;

const normalizeDepartment = (departmentData = {}) => {
  const name = departmentData.name || departmentData.department_name;
  const code = departmentData.code || departmentData.department_code || makeDepartmentCode(name);

  return {
    department_name: name,
    department_code: code,
    
    // employee_capacity: Number(departmentData.employees || departmentData.employee_capacity || 0),
    // office_location: departmentData.location || departmentData.office_location || null,
    status: departmentData.status || 'Active',
    description: departmentData.description || null
  };
};

const toApiDepartment = (department = {}) => ({
  ...department,
  department_name: department.department_name,
  department_code: department.department_code,
  
});

class Department {
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM departments ORDER BY department_name ASC');
      return rows.map(toApiDepartment);
    } catch (error) {
      throw new Error('Failed to fetch departments: ' + error.message);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM departments WHERE id = ?', [id]);
      return rows[0] ? toApiDepartment(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to fetch department: ' + error.message);
    }
  }

  static async create(departmentData) {
    try {
      const department = normalizeDepartment(departmentData);

      const [existing] = await pool.execute(
        'SELECT * FROM departments WHERE LOWER(department_name) = LOWER(?) LIMIT 1',
        [department.department_name]
      );

      if (existing[0]) {
        return toApiDepartment(existing[0]);
      }

      const [result] = await pool.execute(
        `INSERT INTO departments
          (department_name, department_code, status, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          department.department_name,
          department.department_code,
          
          department.status,
          department.description
        ]
      );

      return toApiDepartment({ id: result.insertId, ...department });
    } catch (error) {
      throw new Error('Failed to create department: ' + error.message);
    }
  }

  static async update(id, departmentData) {
    try {
      const department = normalizeDepartment(departmentData);

      await pool.execute(
        `UPDATE departments
         SET department_name = ?, department_code = ?,      status = ?, description = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          department.department_name,
          department.department_code,
          
          department.status,
          department.description,
          id
        ]
      );

      return toApiDepartment({ id, ...department });
    } catch (error) {
      throw new Error('Failed to update department: ' + error.message);
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete department: ' + error.message);
    }
  }
}

export default Department;