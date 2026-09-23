import api from './axios';

export const getLeaveBalance = (employeeId, params) => api.get(`/leaves/balance/${employeeId}`, { params });
export const getCarryForwardHistory = (employeeId, params) => api.get(`/leaves/carry-forward/${employeeId}`, { params });
export const saveCarryForward = (employeeId, payload) => api.put(`/leaves/carry-forward/${employeeId}`, payload);
