import axios from 'axios';

// In development: CRA proxy in package.json forwards /api → localhost:5000
// In Docker/production: Nginx proxy forwards /api → backend container
const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;