import axios from 'axios';

// In development: CRA proxy in package.json forwards /api → localhost:5000
// In production (Render Free): calls the public backend URL directly via REACT_APP_API_URL
// In standard Docker: defaults to Nginx proxy relative /api URL
let baseUrl = process.env.REACT_APP_API_URL || '/api';

// Robust safety check: ensure the baseURL ends with '/api' if it's an external URL
if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = `${baseUrl.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL: baseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;