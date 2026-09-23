import { pool } from '../../config/databases.js';

const makeDesignationCode = (name = '') =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12) || `DESG${Date.now()}`;

const normalizeDesignation = (designationData = {}) => {
  const name = (designationData.name || designationData.designation_name || '').trim();
  const code = designationData.code || designationData.designation_code || makeDesignationCode(name);
  const departmentId = designationData.department_id || designationData.departmentId || null;
  const departmentName = designationData.department_name || designationData.departmentName || designationData.department || null;

  return {
    name,
    department_id: departmentId || null,
    department_name: departmentName || null,
    designation_code: code,
    description: designationData.description || null,
    status: designationData.status || 'Active',
  };
};

const toApiDesignation = (designation = {}) => ({
  ...designation,
  code: designation.designation_code,
  departmentId: designation.department_id,
  departmentName: designation.department_name,
});

class Designation {
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          d.*,
          COALESCE(dep.department_name, d.department_name) AS department_name
        FROM designations d
        LEFT JOIN departments dep ON dep.id = d.department_id
        ORDER BY COALESCE(dep.department_name, d.department_name), d.name ASC
      `);
      return rows.map(toApiDesignation);
    } catch (error) {
      throw new Error('Failed to fetch designations: ' + error.message);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT
          d.*,
          COALESCE(dep.department_name, d.department_name) AS department_name
        FROM designations d
        LEFT JOIN departments dep ON dep.id = d.department_id
        WHERE d.id = ?
      `, [id]);
      return rows[0] ? toApiDesignation(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to fetch designation: ' + error.message);
    }
  }

  static async create(designationData = {}) {
    try {
      const designation = normalizeDesignation(designationData);

      const [existing] = await pool.execute(
        `SELECT * FROM designations
         WHERE LOWER(name) = LOWER(?)
           AND (
             (? IS NULL AND department_id IS NULL AND (department_name IS NULL OR LOWER(department_name) = LOWER(?)))
             OR department_id = ?
             OR LOWER(department_name) = LOWER(?)
           )
         LIMIT 1`,
        [
          designation.name,
          designation.department_id,
          designation.department_name,
          designation.department_id,
          designation.department_name,
        ]
      );

      if (existing[0]) {
        return toApiDesignation(existing[0]);
      }

      const [result] = await pool.execute(
        'INSERT INTO designations (name, department_id, department_name, designation_code, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          designation.name,
          designation.department_id,
          designation.department_name,
          designation.designation_code,
          designation.description,
          designation.status
        ]
      );

      return toApiDesignation({ id: result.insertId, ...designation });
    } catch (error) {
      throw new Error('Failed to create designation: ' + error.message);
    }
  }

  static async update(id, designationData = {}) {
    try {
      const designation = normalizeDesignation(designationData);

      await pool.execute(
        'UPDATE designations SET name = ?, department_id = ?, department_name = ?, designation_code = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [
          designation.name,
          designation.department_id,
          designation.department_name,
          designation.designation_code,
          designation.description,
          designation.status,
          id
        ]
      );

      return toApiDesignation({ id, ...designation });
    } catch (error) {
      throw new Error('Failed to update designation: ' + error.message);
    }
  }

  static async delete(id) {
    try {
      await pool.execute('DELETE FROM designations WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete designation: ' + error.message);
    }
  }
}

export default Designation;