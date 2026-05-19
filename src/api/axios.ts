import axios from 'axios';

export { getApiErrorMessage, getApiErrorPayload } from './errors';
export type { ApiErrorPayload } from './errors';

export const api = axios.create({
  baseURL: 'http://localhost:5021/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
