import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Interceptor de requisição: injeta token JWT em todas as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guicell_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: redireciona para login se token expirar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if ((error.response?.status === 401 || error.response?.status === 403) && !isLoginRequest) {
      localStorage.removeItem('guicell_token');
      localStorage.removeItem('guicell_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
