import { getApiErrorMessage, getApiErrorPayload } from '../api/errors';

export const PHONE_DUPLICATE_MESSAGE = 'Номер телефону вже зареєстровано в системі.';

export interface SubmitFieldErrors {
  phone?: string;
  general?: string;
}

export function getSubmitFieldErrors(err: unknown, fallback: string): SubmitFieldErrors {
  const errorPayload = getApiErrorPayload(err);
  if (errorPayload?.code === 'PHONE_TAKEN') {
    return { phone: errorPayload.message ?? PHONE_DUPLICATE_MESSAGE };
  }

  return { general: getApiErrorMessage(err, fallback) };
}
