import axios from 'axios';

const stripApiSuffix = (value) => String(value || '').replace(/\/+$/, '').replace(/(?:\/api)+$/, '');
const backendUrl = stripApiSuffix(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5003');
const API_URL = `${stripApiSuffix(import.meta.env.VITE_API_URL || backendUrl)}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrmsToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { API_URL };
export default api;
