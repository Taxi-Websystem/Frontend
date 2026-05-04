import { JWT_BASE64URL_DASH_REGEX, JWT_BASE64URL_UNDERSCORE_REGEX } from './regex';

export type AppRole = 'SuperAdmin' | 'Manager' | 'Driver';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = atob(
      payloadBase64
        .replace(JWT_BASE64URL_DASH_REGEX, '+')
        .replace(JWT_BASE64URL_UNDERSCORE_REGEX, '/')
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getCurrentRole(): AppRole | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const role = (payload[ROLE_CLAIM] ?? payload.role) as AppRole | undefined;
  return role ?? null;
}

export function getCurrentUserId(): number | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const userId = payload[NAME_ID_CLAIM] ?? payload.sub;
  if (!userId) return null;

  const parsed = Number(userId);
  return Number.isNaN(parsed) ? null : parsed;
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}
