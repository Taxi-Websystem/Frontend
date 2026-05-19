import type { RideStatus } from '../../../utils/rideStatus';
import type { UserStatus } from '../../../utils/userStatus';

export interface RideItem {
  id: number;
  driverId: number | null;
  driverName: string | null;
  driverPhoneNumber: string | null;
  status: RideStatus;
  rating: number | null;
  fromAddress: string;
  toAddress: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toLatitude?: number | null;
  toLongitude?: number | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  distanceKm: number;
  price: number;
  driverProfit: number | null;
}

export interface DriverOption {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
  userStatus?: UserStatus | number;
}

export interface RideStatusCounts {
  active: number;
  completed: number;
  canceled: number;
}
