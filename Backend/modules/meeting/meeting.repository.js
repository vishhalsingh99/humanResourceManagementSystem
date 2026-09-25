import { pool } from '../../config/databases.js';

const SELECT_WITH_JOINS = `
  SELECT
    m.*,
    attendee.id   AS attendee_id,
    attendee.name AS attendee_name,
    attendee.department AS attendee_department,
    organizer.id   AS organizer_employee_id,
    organizer.name AS organizer_name,
    organizer.department AS organizer_department
  FROM meetings m
  LEFT JOIN employees attendee ON attendee.id = CAST(NULLIF(m.attendees, '') AS UNSIGNED)
  LEFT JOIN employees organizer ON organizer.id = m.organizer_id
`;

const toApiMeeting = (row) => ({
  id: row.id,
  _id: row.id,
  title: row.title,
  notes: row.description,
  description: row.description,
  date: row.date,
  time: row.time,
  location: row.location,
  status: row.status,
  employee: row.attendee_id ? {
    id: row.attendee_id,
    _id: row.attendee_id,
    name: row.attendee_name,
    department: row.attendee_department,
  } : null,
  organizer: row.organizer_employee_id ? {
    id: row.organizer_employee_id,
    _id: row.organizer_employee_id,
    name: row.organizer_name,
    department: row.organizer_department,
  } : null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

class Meeting {
  static async findAll() {
    const [rows] = await pool.execute(`${SELECT_WITH_JOINS} ORDER BY m.date DESC, m.time DESC, m.id DESC`);
    return rows.map(toApiMeeting);
  }

  static async findById(id) {
    const [rows] = await pool.execute(`${SELECT_WITH_JOINS} WHERE m.id = ? LIMIT 1`, [id]);
    return rows[0] ? toApiMeeting(rows[0]) : null;
  }

  static async create({ title, description, date, time, location, organizerId, attendeeId, status }) {
    const [result] = await pool.execute(
      `INSERT INTO meetings (title, description, date, time, location, organizer_id, attendees, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description || null,
        date,
        time,
        location || null,
        organizerId || null,
        attendeeId != null ? String(attendeeId) : null,
        status || 'Scheduled',
      ]
    );
    return Meeting.findById(result.insertId);
  }

  static async update(id, { title, description, date, time, location, organizerId, attendeeId, status }) {
    await pool.execute(
      `UPDATE meetings
       SET title = ?, description = ?, date = ?, time = ?, location = ?, organizer_id = ?, attendees = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        description || null,
        date,
        time,
        location || null,
        organizerId || null,
        attendeeId != null ? String(attendeeId) : null,
        status || 'Scheduled',
        id,
      ]
    );
    return Meeting.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM meetings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default Meeting;
