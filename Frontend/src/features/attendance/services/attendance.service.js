import axios from 'axios';

const attendanceUrl = '/api/attendance';

export const getEmployeesForAttendanceDate = (date, department = '', designation = '') =>
  axios.get(`${attendanceUrl}/search/by-date`, { params: { date, department, designation } });
export const createAttendance = (payload) => axios.post(attendanceUrl, payload);
export const updateAttendance = (id, payload) => axios.put(`${attendanceUrl}/${id}`, payload);
export const removeAttendance = (id) => axios.delete(`${attendanceUrl}/${id}`);
export const getEmployeeAttendance = (employeeId, params) =>
  axios.get(`${attendanceUrl}/employee/${employeeId}`, { params });
export const getWorkingDays = (params) =>
  axios.get(`${attendanceUrl}/working-days`, { params });
