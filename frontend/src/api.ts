import axios, { AxiosError } from 'axios';

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
  timeout: 60000, // 60 seconds timeout for slow mobile networks (Claro)
});

// Interceptor para agregar el token dinámicamente en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log para debugging en móvil
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de red y reintentar
api.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Log detallado del error para debugging
    if (error.code === 'ECONNABORTED') {
      console.error('❌ [API Timeout] La petición tardó más de 60 segundos');
      console.error('URL:', originalRequest?.url);
      console.error('Esto puede ser por red celular lenta (Claro)');
    } else if (error.message === 'Network Error') {
      console.error('❌ [Network Error] No se pudo conectar al backend');
      console.error('URL base:', baseURL);
      console.error('Verificar que el backend esté corriendo');
    } else if (error.response) {
      console.error(`❌ [API Error ${error.response.status}] ${originalRequest?.url}`);
    }
    
    // Retry automático para timeouts (solo una vez)
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Reintentando petición...');
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export default api;
