import api from '../../../api/axios';

export function fetchAllEmployees() {
  return api.get('/employees', { params: { status: 'all' } });
}

export function createEmployee(payload) {
  return api.post('/employees', payload);
}

export function updateEmployee(id, payload) {
  return api.put(`/employees/${id}`, payload);
}

export function uploadEmployeeResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/employees/resume-upload', formData);
}

export function deleteEmployee(id) {
  return api.delete(`/employees/${id}`);
}

export function updateEmployeeStatus(id, status) {
  return api.patch(`/employees/${id}/status`, { status });
}
