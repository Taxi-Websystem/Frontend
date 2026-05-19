import type { StatusPulseKind } from '../../../components/StatusPulseDot';
import { sanitizeCarColorUa } from '../../../utils/carFields';
import { formatLicensePlateInput, LICENSE_PLATE_REGEX } from '../../../utils/licensePlate';
import { sanitizeNameUa } from '../../../utils/nameFields';
import {
  extractUaPhoneDigitsFromE164,
  formatUaPhoneE164,
  isUaPhoneLocalComplete
} from '../../../utils/phone';
import type { UserStatus } from '../../../utils/userStatus';

export interface DriverListItem {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  carMake?: string;
  carModel?: string;
  carColor?: string;
  licensePlate?: string;
  role: 'Driver';
  userStatus?: UserStatus | number;
  tripCount: number;
  averageRating: number | null;
}

export interface DriverFormState {
  phoneDigits: string;
  name: string;
  carMake: string;
  carModel: string;
  carColor: string;
  licensePlate: string;
  userStatus: UserStatus;
  profileRole: 'Driver' | 'Manager';
}

export const defaultDriverForm: DriverFormState = {
  phoneDigits: '',
  name: '',
  carMake: '',
  carModel: '',
  carColor: '',
  licensePlate: '',
  userStatus: 'Offline',
  profileRole: 'Driver'
};

export const driverStatusToCode: Record<UserStatus, number> = {
  Offline: 0,
  Online: 1,
  InRide: 2,
  Break: 3
};

export function driverStatusToPulseKind(status: UserStatus): StatusPulseKind {
  if (status === 'Online') return 'online';
  if (status === 'InRide') return 'inRide';
  if (status === 'Break') return 'created';
  return 'offline';
}

export function normalizeDriverStatus(input: UserStatus | number | undefined, index: number): UserStatus {
  if (
    typeof input === 'string' &&
    (input === 'Online' || input === 'InRide' || input === 'Offline' || input === 'Break')
  ) {
    return input;
  }
  if (typeof input === 'number') {
    if (input === 1) return 'Online';
    if (input === 2) return 'InRide';
    if (input === 3) return 'Break';
    return 'Offline';
  }

  return (['Online', 'InRide', 'Offline', 'Break'] as UserStatus[])[index % 4];
}

export function formatDriverRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2);
}

export function computeDriverStats(items: DriverListItem[]) {
  let active = 0;
  let totalTrips = 0;
  const ratings: number[] = [];
  items.forEach((item, index) => {
    const status = normalizeDriverStatus(item.userStatus, index);
    if (status === 'Online' || status === 'InRide') active += 1;
    totalTrips += item.tripCount ?? 0;
    if (item.averageRating != null && typeof item.averageRating === 'number') {
      ratings.push(item.averageRating);
    }
  });
  const avgRating =
    ratings.length > 0 ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2) : null;
  return { active, totalTrips, avgRating };
}

export function driverItemToFormState(item: DriverListItem, index: number): DriverFormState {
  return {
    phoneDigits: extractUaPhoneDigitsFromE164(item.phoneNumber),
    name: sanitizeNameUa(item.name),
    carMake: item.carMake ?? '',
    carModel: item.carModel ?? '',
    carColor: sanitizeCarColorUa(item.carColor ?? ''),
    licensePlate: formatLicensePlateInput(item.licensePlate ?? ''),
    userStatus: normalizeDriverStatus(item.userStatus, index),
    profileRole: 'Driver'
  };
}

export function isDriverFormValid(form: DriverFormState): boolean {
  const plateOk = LICENSE_PLATE_REGEX.test(form.licensePlate.trim());
  return (
    isUaPhoneLocalComplete(form.phoneDigits) &&
    form.name.trim().length > 0 &&
    form.carMake.trim().length > 0 &&
    form.carModel.trim().length > 0 &&
    form.carColor.trim().length > 0 &&
    form.licensePlate.trim().length === 8 &&
    plateOk
  );
}

export function isDuplicateDriverPhone(
  editing: DriverListItem | null,
  duplicateDriver: DriverListItem | undefined,
  phoneNumber: string
): boolean {
  if (!duplicateDriver) return false;
  if (!editing) return true;
  return editing.phoneNumber !== phoneNumber;
}

export function buildDriverSavePayload(
  form: DriverFormState,
  isCreateMode: boolean
): {
  phoneNumber: string;
  name: string;
  carMake: string | null;
  carModel: string | null;
  carColor: string | null;
  licensePlate: string | null;
  role: 'Driver' | 'Manager';
  userStatus: number;
} {
  return {
    phoneNumber: formatUaPhoneE164(form.phoneDigits),
    name: form.name,
    carMake: form.carMake || null,
    carModel: form.carModel || null,
    carColor: form.carColor || null,
    licensePlate: form.licensePlate || null,
    role: (isCreateMode ? 'Driver' : form.profileRole) as 'Driver' | 'Manager',
    userStatus: driverStatusToCode[isCreateMode ? 'Online' : form.userStatus]
  };
}
