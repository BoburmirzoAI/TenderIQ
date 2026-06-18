import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh'];

api.interceptors.request.use((config) => {
  const url = config.url || '';
  if (AUTH_ENDPOINTS.some((p) => url.includes(p))) {
    delete config.headers.Authorization;
    return config;
  }
  const token = localStorage.getItem('tiq_admin_access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('tiq_admin_refresh');
        if (refresh) {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
          const newAccess = res.data?.data?.access_token;
          if (newAccess) {
            localStorage.setItem('tiq_admin_access', newAccess);
            orig.headers.Authorization = `Bearer ${newAccess}`;
            return api(orig);
          }
        }
      } catch {
        // refresh failed
      }
      localStorage.removeItem('tiq_admin_access');
      localStorage.removeItem('tiq_admin_refresh');
      localStorage.removeItem('tiq_admin_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
