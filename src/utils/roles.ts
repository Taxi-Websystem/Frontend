import type { AppRole } from './auth';

export const roleLabelMap: Record<AppRole, string> = {
  SuperAdmin: 'Адмін',
  Manager: 'Менеджер',
  Driver: 'Водій'
};

export function getRoleLabel(role: AppRole): string {
  return roleLabelMap[role] ?? role;
}
