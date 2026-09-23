import axios from 'axios';

export function createEmployee(payload) {
  return axios.post('/api/employees', payload);
}

export function updateEmployee(id, payload) {
  return axios.put(`/api/employees/${id}`, payload);
}

export function uploadEmployeeResume(file) {
  const formData = new FormData();
  formData.append('resume', file);
  return axios.post('/api/employees/resume-upload', formData);
}

export function deleteEmployee(id) {
  return axios.delete(`/api/employees/${id}`);
}

export function updateEmployeeStatus(id, status) {
  return axios.patch(`/api/employees/${id}/status`, { status });
}
