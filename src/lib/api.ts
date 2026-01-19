import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_BASE_URL
    : '/api';



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
