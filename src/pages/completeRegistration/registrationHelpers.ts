import type { AppRole } from '../../utils/auth';

export interface AuthMe {
  phoneNumber: string;
  name: string;
  carBrand: string | null;
  carModel: string | null;
  carColor: string | null;
  licensePlate: string | null;
  role: string;
}

export function getRegistrationRoleLabel(role: AppRole): string {
  if (role === 'SuperAdmin') return 'Адміністратор';
  if (role === 'Manager') return 'Менеджер';
  return 'Водій';
}

export function getProfileProgress(
  isDriver: boolean,
  isManagerOrAdmin: boolean,
  phoneReady: boolean,
  isNameFilled: boolean,
  isCarBrandFilled: boolean,
  isCarModelFilled: boolean,
  isCarColorFilled: boolean,
  isLicensePlateValid: boolean
): { completedFields: number; totalFields: number } {
  if (isDriver) {
    const completedFields = [
      phoneReady,
      isNameFilled,
      isCarBrandFilled,
      isCarModelFilled,
      isCarColorFilled,
      isLicensePlateValid
    ].filter(Boolean).length;
    return { completedFields, totalFields: 6 };
  }

  if (isManagerOrAdmin) {
    const completedFields = [phoneReady, isNameFilled].filter(Boolean).length;
    return { completedFields, totalFields: 2 };
  }

  return { completedFields: 0, totalFields: 0 };
}
