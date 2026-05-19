import type { AppRole } from './auth';
import { DIGITS_STRING_REGEX } from './regex';

const ROLE_BY_ORDINAL: AppRole[] = ['Driver', 'Manager', 'SuperAdmin'];

function parseRoleOrdinal(value: number): AppRole | null {
  if (!Number.isInteger(value) || value < 0 || value >= ROLE_BY_ORDINAL.length) {
    return null;
  }

  return ROLE_BY_ORDINAL[value];
}

export function parseApiRole(value: unknown): AppRole {
  if (value === 'Driver' || value === 'Manager' || value === 'SuperAdmin') {
    return value;
  }

  if (typeof value === 'number') {
    const roleByOrdinal = parseRoleOrdinal(value);
    if (roleByOrdinal) return roleByOrdinal;
  }

  if (typeof value === 'string' && DIGITS_STRING_REGEX.test(value)) {
    const roleByOrdinal = parseRoleOrdinal(Number(value));
    if (roleByOrdinal) return roleByOrdinal;
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
