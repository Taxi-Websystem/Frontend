export type DriverActiveRideStatus = 'Accepted' | 'InRide';

export const DRIVER_CANCEL_WINDOW_MS = 3 * 60 * 1000;

export const driverPrimaryActionClass =
  'manager-accent-glow manager-primary-btn relative inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export const pendingCancelHintText =
  'Скасувати замовлення можна протягом 3 хвилин після прийняття.';

export interface PendingRide {
  id: number;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  driverProfit: number | null;
}

export interface ActiveRide {
  id: number;
  status: DriverActiveRideStatus;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  driverProfit: number | null;
  startTime: string | null;
  acceptedAt: string | null;
  cancelSecondsRemaining: number;
  canCancel: boolean;
}
