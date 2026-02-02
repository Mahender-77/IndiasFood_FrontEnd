import axios from 'axios';

// ✅ Determine API base URL based on environment
const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.MODE);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Important for CORS with credentials
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('API No Response:', {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Error in setting up request
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;