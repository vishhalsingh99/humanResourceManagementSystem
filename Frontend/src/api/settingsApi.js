import api from './axios';

export const getCompanySettings = () =>
  api.get('/settings/company');

export const updateCompanySettings = (payload) =>
  api.put('/settings/company', payload);

export const getCompanyPolicies = () =>
  api.get('/settings/policies');

export const createCompanyPolicy = (payload) =>
  api.post('/settings/policies', payload);

export const updateCompanyPolicy = (id, payload) =>
  api.put(`/settings/policies/${id}`, payload);

export const deleteCompanyPolicy = (id) =>
  api.delete(`/settings/policies/${id}`);

export const getCompanyRules = () =>
  api.get('/settings/rules');

export const createCompanyRule = (payload) =>
  api.post('/settings/rules', payload);

export const updateCompanyRule = (id, payload) =>
  api.put(`/settings/rules/${id}`, payload);

export const deleteCompanyRule = (id) =>
  api.delete(`/settings/rules/${id}`);
