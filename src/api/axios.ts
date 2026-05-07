import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5021/api',
});

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const message = (err.response.data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (err.response.status === 403) {
      return 'Доступ заборонено. Можливо, спроба видалити обліковий запис адміністратора або недостатньо прав.';
    }
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
