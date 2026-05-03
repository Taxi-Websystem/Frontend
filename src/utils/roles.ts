import type { AppRole } from './auth';

/** Відповідає порядку enum UserRole на бекенді (Driver = 0, …). */
const ROLE_BY_ORDINAL: AppRole[] = ['Driver', 'Manager', 'SuperAdmin'];

/**
 * Нормалізує роль з API: сервер може віддавати рядок або число (enum).
 */
export function parseApiRole(value: unknown): AppRole {
  if (value === 'Driver' || value === 'Manager' || value === 'SuperAdmin') {
    return value;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < ROLE_BY_ORDINAL.length) {
    return ROLE_BY_ORDINAL[value]!;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 0 && n < ROLE_BY_ORDINAL.length) {
      return ROLE_BY_ORDINAL[n]!;
    }
  }
  return 'Driver';
}

export const roleLabelMap: Record<AppRole, string> = {
  SuperAdmin: 'Адмін',
  Manager: 'Менеджер',
  Driver: 'Водій'
};

export function getRoleLabel(role: AppRole): string {
  return roleLabelMap[role] ?? role;
}
