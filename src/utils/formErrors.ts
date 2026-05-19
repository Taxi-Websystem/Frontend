import axios from 'axios';
import { getApiErrorMessage } from '../api/axios';

export const PHONE_DUPLICATE_MESSAGE = 'Номер телефону вже зареєстровано в системі.';

export interface SubmitFieldErrors {
  phone?: string;
  general?: string;
}

export function getSubmitFieldErrors(err: unknown, fallback: string): SubmitFieldErrors {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data as { message?: unknown; code?: unknown };
    const message =
      typeof data.message === 'string' && data.message.trim() ? data.message.trim() : fallback;

    if (data.code === 'PHONE_TAKEN') {
      return { phone: message };
    }
  }

  return { general: getApiErrorMessage(err, fallback) };
}
