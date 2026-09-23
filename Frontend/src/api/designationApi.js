import api from './axios';

export const createDesignation = (payload) => api.post('/designations', payload);
export const updateDesignation = (id, payload) => api.put(`/designations/${id}`, payload);
export const deleteDesignation = (id) => api.delete(`/designations/${id}`);
