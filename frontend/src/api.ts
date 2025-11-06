import axios from 'axios';

// Use environment variable for API URL ONLY if explicitly set
// Otherwise use relative path '/api' which goes through Vite proxy
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Export base URL for use in fetch() calls
// Returns empty string to use relative URLs (proxy)
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout for mobile networks
});

// Interceptor para agregar el token dinámicamente en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - red muy lenta o sin conexión');
    } else if (error.message === 'Network Error') {
      console.error('Network Error - verificar URL del backend:', baseURL);
    }
    return Promise.reject(error);
  }
);

export default api;
