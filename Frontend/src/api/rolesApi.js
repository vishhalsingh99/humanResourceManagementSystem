import api from './axios';

export const getRoles = () => api.get('/roles');
export const createRole = (payload) => api.post('/roles', payload);
export const updateRole = (id, payload) => api.put(`/roles/${id}`, payload);
export const deleteRole = (id) => api.delete(`/roles/${id}`);
export const getPermissions = () => api.get('/permissions');
