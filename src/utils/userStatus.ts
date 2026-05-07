export type UserStatus = 'Offline' | 'Online' | 'InRide';

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  Online: 'Онлайн',
  InRide: 'У дорозі',
  Offline: 'Офлайн'
};

export function getUserStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status];
}
