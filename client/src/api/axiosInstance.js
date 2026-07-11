import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ck_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ck_token');
      localStorage.removeItem('ck_admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
