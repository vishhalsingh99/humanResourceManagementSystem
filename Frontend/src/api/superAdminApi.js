import axios from 'axios';

export const getSuperAdminDashboard = () => axios.get('/api/super-admin/dashboard');

export const getCompanies = (params = {}) => axios.get('/api/super-admin/companies', { params });

export const getCompany = (id) => axios.get(`/api/super-admin/companies/${id}`);

export const updateCompanyStatus = (id, status) => (
  axios.patch(`/api/super-admin/companies/${id}/status`, { status })
);

export const deleteCompany = (id) => axios.delete(`/api/super-admin/companies/${id}`);

export const impersonateCompanyAdmin = (id) => (
  axios.post(`/api/super-admin/companies/${id}/impersonate`)
);

export const updateCompanySubscription = (id, payload) => (
  axios.put(`/api/super-admin/companies/${id}/subscription`, payload)
);

export const getAuditLogs = () => axios.get('/api/super-admin/audit-logs');

export const getGlobalSettings = () => axios.get('/api/super-admin/settings');

export const updateGlobalSettings = (payload) => axios.put('/api/super-admin/settings', payload);
