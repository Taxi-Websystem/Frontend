export type UserStatus = 'Offline' | 'Online' | 'InRide' | 'Break';

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  Online: 'Онлайн',
  InRide: 'У дорозі',
  Offline: 'Офлайн',
  Break: 'Перерва'
};

export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status] ?? status;
}

export function parseUserStatus(value: string | number | undefined): UserStatus {
  if (value === 'Online' || value === 1) return 'Online';
  if (value === 'InRide' || value === 2) return 'InRide';
  if (value === 'Break' || value === 3) return 'Break';
  return 'Offline';
}
