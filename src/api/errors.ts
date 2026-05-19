import axios from 'axios';

const FORBIDDEN_MESSAGE =
  'Доступ заборонено. Можливо, спроба видалити обліковий запис адміністратора або недостатньо прав.';

export interface ApiErrorPayload {
  message?: string;
  code?: string;
}

export function getApiErrorPayload(err: unknown): ApiErrorPayload | null {
  if (!axios.isAxiosError(err) || !err.response?.data || typeof err.response.data !== 'object') {
    return null;
  }

  const errorData = err.response.data as { message?: unknown; code?: unknown };
  const message =
    typeof errorData.message === 'string' && errorData.message.trim()
      ? errorData.message.trim()
      : undefined;
  const code = typeof errorData.code === 'string' ? errorData.code : undefined;

  if (!message && !code) return null;
  return { message, code };
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const errorPayload = getApiErrorPayload(err);
  if (errorPayload?.message) return errorPayload.message;

  if (axios.isAxiosError(err) && err.response?.status === 403) {
    return FORBIDDEN_MESSAGE;
  }

  return fallback;
}
