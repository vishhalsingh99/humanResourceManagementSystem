import api from './axios';

export const getNetworkInfo = () =>
  api.get('/attendance/network-info');

export const getTodayAttendance = () =>
  api.get('/attendance/today');

export const employeeCheckIn = () =>
  api.post('/attendance/check-in');

export const employeeCheckOut = () =>
  api.post('/attendance/check-out');
