import { pool } from '../../config/databases.js';

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave',];
const LEGACY_LEAVE_TYPES = ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity'];

const ensureLeaveTypeSchema = async () => {
  const [columns] = await pool.execute(
    `SELECT COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE table_schema = DATABASE() AND table_name = 'leaves' AND column_name = 'leave_type'
     LIMIT 1`
  );
  const columnType = String(columns[0]?.columnType || '');
  const normalizedColumnType = columnType.toLowerCase();

  if (!columnType || (normalizedColumnType.includes("'unpaid leave'") && !normalizedColumnType.includes("'sick'"))) {
    return;
  }

  const compatibleTypes = [...LEGACY_LEAVE_TYPES, ...LEAVE_TYPES]
    .map((type) => `'${type}'`)
    .join(', ');
  const currentTypes = LEAVE_TYPES.map((type) => `'${type}'`).join(', ');

  await pool.execute(`ALTER TABLE leaves MODIFY COLUMN leave_type ENUM(${compatibleTypes}) NOT NULL`);
  await pool.execute(
    `UPDATE leaves
     SET leave_type = CONCAT(leave_type, ' Leave')
     WHERE leave_type IN ('Sick', 'Casual', 'Annual', 'Maternity', 'Paternity')`
  );
  await pool.execute(`ALTER TABLE leaves MODIFY COLUMN leave_type ENUM(${currentTypes}) NOT NULL`);
};

const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / millisecondsPerDay) + 1;
};

const enrichLeave = (leave = {}) => {
  const employeeName = leave.employee_name || null;
  const employeeCode = leave.employee_code || null;
  const employeeEmail = leave.employee_email || null;

  return {
    ...leave,
    employeeId: leave.employee_id,
    employeeName,
    employeeCode,
    employeeEmail,
    leaveDays: calculateLeaveDays(leave.start_date, leave.end_date),
    days: calculateLeaveDays(leave.start_date, leave.end_date),
    employee: {
      id: leave.employee_id,
      name: employeeName,
      employee_id: employeeCode,
      email: employeeEmail,
    },
  };
};

const normalizeLeaveData = (leaveData = {}) => {
  const leave = {};

  if (leaveData.employee_id !== undefined || leaveData.employeeId !== undefined) {
    leave.employee_id = leaveData.employee_id || leaveData.employeeId;
  }
  if (leaveData.leave_type !== undefined || leaveData.leaveType !== undefined) {
    leave.leave_type = leaveData.leave_type || leaveData.leaveType;
  }
  if (leaveData.start_date !== undefined || leaveData.startDate !== undefined) {
    leave.start_date = leaveData.start_date || leaveData.startDate;
  }
  if (leaveData.end_date !== undefined || leaveData.endDate !== undefined) {
    leave.end_date = leaveData.end_date || leaveData.endDate;
  }
  if (leaveData.reason !== undefined) leave.reason = leaveData.reason || null;
  if (leaveData.status !== undefined) leave.status = leaveData.status;
  if (leaveData.approved_by !== undefined || leaveData.approvedBy !== undefined) {
    leave.approved_by = leaveData.approved_by || leaveData.approvedBy || null;
  }
  if (leaveData.approved_date !== undefined || leaveData.approvedDate !== undefined) {
    leave.approved_date = leaveData.approved_date || leaveData.approvedDate || null;
  }

  return leave;
};

const leaveSelect = `
  SELECT
    l.*,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    e.email AS employee_email
  FROM leaves l
  LEFT JOIN employees e ON l.employee_id = e.id
`;

class Leave {
  // Get all leaves
  static async findAll() {
    try {
      await ensureLeaveTypeSchema();
      const [rows] = await pool.execute(
        `${leaveSelect} ORDER BY l.created_at DESC`
      );
      return rows.map(enrichLeave);
    } catch (error) {
      throw new Error('Failed to fetch leaves: ' + error.message);
    }
  }

  // Get leave by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `${leaveSelect} WHERE l.id = ?`,
        [id]
      );
      return rows[0] ? enrichLeave(rows[0]) : null;
    } catch (error) {
      throw new Error('Failed to fetch leave: ' + error.message);
    }
  }

  // Create new leave
static async create(leaveData) {
  try {
    await ensureLeaveTypeSchema();

    const leave = normalizeLeaveData(leaveData);

    if (!leave.employee_id) {
      throw new Error('Employee ID is required');
    }

    if (!leave.leave_type) {
      throw new Error('Leave Type is required');
    }

    if (!leave.start_date) {
      throw new Error('Start Date is required');
    }

    if (!leave.end_date) {
      throw new Error('End Date is required');
    }

    const [result] = await pool.execute(
      `INSERT INTO leaves
      (
        employee_id,
        leave_type,
        start_date,
        end_date,
        reason,
        status,
        approved_by,
        approved_date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        leave.employee_id,
        leave.leave_type,
        leave.start_date,
        leave.end_date,
        leave.reason || null,
        leave.status || 'Pending',
        leave.approved_by || null,
        leave.approved_date || null,
      ]
    );

    return this.findById(result.insertId);
  } catch (error) {
    console.error('LEAVE CREATE ERROR:', error);
    throw new Error('Failed to create leave: ' + error.message);
  }
}

  // Update leave
  static async update(id, leaveData) {
    try {
      const leave = normalizeLeaveData(leaveData);
      const allowedColumns = ['employee_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'approved_date'];
      const updates = allowedColumns
        .filter((column) => Object.prototype.hasOwnProperty.call(leave, column) && leave[column] !== undefined)
        .map((column) => [column, leave[column]]);

      if (updates.length > 0) {
        const assignments = updates.map(([column]) => `${column} = ?`).join(', ');
        const values = updates.map(([, value]) => value);
        await pool.execute(
          `UPDATE leaves SET ${assignments}, updated_at = NOW() WHERE id = ?`,
          [...values, id]
        );
      }

      return this.findById(id);
    } catch (error) {
      throw new Error('Failed to update leave: ' + error.message);
    }
  }

  // Delete leave
  static async delete(id) {
    try {
      await pool.execute('DELETE FROM leaves WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to delete leave: ' + error.message);
    }
  }

  // Get leaves by employee ID
  static async findByemployee_id(employee_id) {
    try {
      const [rows] = await pool.execute(
        `${leaveSelect} WHERE l.employee_id = ? ORDER BY l.created_at DESC`,
        [employee_id]
      );
      return rows.map(enrichLeave);
    } catch (error) {
      throw new Error('Failed to fetch leaves: ' + error.message);
    }
  }
}

export default Leave;