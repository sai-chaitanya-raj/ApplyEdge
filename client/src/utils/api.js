import axios from 'axios';

// In development: CRA proxy in package.json forwards /api → localhost:5000
// In production (Render Free): calls the public backend URL directly via REACT_APP_API_URL
// In standard Docker: defaults to Nginx proxy relative /api URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;