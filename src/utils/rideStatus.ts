import type { StatusPulseKind } from './statusPulse';

export type RideStatus = 'Created' | 'Accepted' | 'InRide' | 'Completed' | 'Canceled';

export function getRideStatusDisplay(status: RideStatus): { label: string; kind: StatusPulseKind } {
  if (status === 'Completed') return { label: 'Завершена', kind: 'online' };
  if (status === 'Canceled') return { label: 'Скасована', kind: 'offline' };
  if (status === 'InRide') return { label: 'У дорозі', kind: 'inRide' };
  if (status === 'Accepted') return { label: 'Прийнята', kind: 'accepted' };
  return { label: 'Створена', kind: 'created' };
}
