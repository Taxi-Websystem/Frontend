import { compactAddressLabel } from '../../../utils/geo';
import { toDatetimeLocalValue } from '../../../utils/datetime';
import type { RideStatus } from '../../../utils/rideStatus';

export interface RideFormState {
  driverId: string;
  status: RideStatus;
  ratingInput: string;
  fromAddress: string;
  toAddress: string;
  fromLatitude: number | null;
  fromLongitude: number | null;
  toLatitude: number | null;
  toLongitude: number | null;
  startTime: string;
  endTime: string;
  distanceKm: string;
}

export const defaultRideForm: RideFormState = {
  driverId: '',
  status: 'Created',
  ratingInput: '',
  fromAddress: '',
  toAddress: '',
  fromLatitude: null,
  fromLongitude: null,
  toLatitude: null,
  toLongitude: null,
  startTime: '',
  endTime: '',
  distanceKm: ''
};

export function rideItemToFormState(ride: {
  driverId: number | null;
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
  distanceKm: number;
}): RideFormState {
  return {
    driverId: ride.driverId ? String(ride.driverId) : '',
    status: ride.status,
    ratingInput: ride.rating != null ? String(ride.rating) : '',
    fromAddress: compactAddressLabel(ride.fromAddress),
    toAddress: compactAddressLabel(ride.toAddress),
    fromLatitude: ride.fromLatitude ?? null,
    fromLongitude: ride.fromLongitude ?? null,
    toLatitude: ride.toLatitude ?? null,
    toLongitude: ride.toLongitude ?? null,
    startTime: toDatetimeLocalValue(ride.startTime),
    endTime: toDatetimeLocalValue(ride.endTime),
    distanceKm: String(ride.distanceKm ?? 0)
  };
}

export function buildRideSubmitPayload(form: RideFormState) {
  return {
    driverId: form.driverId ? Number(form.driverId) : null,
    status: form.status,
    rating: form.ratingInput ? Number(form.ratingInput.replace(',', '.')) : null,
    fromAddress: compactAddressLabel(form.fromAddress),
    toAddress: compactAddressLabel(form.toAddress),
    fromLatitude: form.fromLatitude,
    fromLongitude: form.fromLongitude,
    toLatitude: form.toLatitude,
    toLongitude: form.toLongitude,
    startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
    endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
    distanceKm: Number(form.distanceKm.replace(',', '.'))
  };
}
