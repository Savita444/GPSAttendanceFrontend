import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { default: mockAdapter } = await import('../mocks/adapter.js');
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (location.pathname !== '/login') location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
