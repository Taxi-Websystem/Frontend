import type { AppRole } from '../../../utils/auth';
import { sanitizeNameUa } from '../../../utils/nameFields';
import { extractUaPhoneDigitsFromE164, isUaPhoneLocalComplete } from '../../../utils/phone';
import type { UserStatus } from '../../../utils/userStatus';

export interface ManagerProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  role: AppRole;
  status: Exclude<UserStatus, 'InRide'>;
}

export interface ManagerFormState {
  phoneDigits: string;
  name: string;
  editRole: 'Manager' | 'Driver';
}

export const defaultManagerForm: ManagerFormState = {
  phoneDigits: '',
  name: '',
  editRole: 'Manager'
};

export function canEditManagerRole(editing: ManagerProfile, currentUserId: number | null): boolean {
  return editing.role === 'Manager' && currentUserId !== null && editing.userId !== currentUserId;
}

export function canEditManagerRow(
  item: ManagerProfile,
  canManage: boolean,
  canEditSelfAsManager: boolean,
  currentUserId: number | null
): boolean {
  if (item.id <= 0) return false;
  const isSuperAdminRow = item.role === 'SuperAdmin';
  const isOwnRecord = currentUserId === item.userId;
  return canManage ? !isSuperAdminRow || isOwnRecord : canEditSelfAsManager && isOwnRecord;
}

export function canDeleteManagerRow(item: ManagerProfile, canManage: boolean): boolean {
  return canManage && item.id > 0 && item.role !== 'SuperAdmin';
}

export function isDuplicateManagerPhone(
  editing: ManagerProfile | null,
  duplicateManager: ManagerProfile | undefined,
  phoneNumber: string
): boolean {
  if (!duplicateManager) return false;
  if (!editing) return true;
  return editing.phoneNumber !== phoneNumber;
}

export function managerItemToFormState(item: ManagerProfile): ManagerFormState {
  return {
    phoneDigits: extractUaPhoneDigitsFromE164(item.phoneNumber),
    name: sanitizeNameUa(item.name),
    editRole: 'Manager'
  };
}

export function isManagerFormValid(
  form: ManagerFormState,
  phoneRequiredForSubmit: boolean
): boolean {
  const phoneOk = isUaPhoneLocalComplete(form.phoneDigits);
  return form.name.trim().length > 0 && (!phoneRequiredForSubmit || phoneOk);
}

export function isManagerPhoneFieldDisabled(
  editing: ManagerProfile | null,
  phoneRequiredForSubmit: boolean,
  currentUserId: number | null
): boolean {
  return (
    !phoneRequiredForSubmit ||
    Boolean(editing && editing.role === 'SuperAdmin' && editing.userId !== currentUserId)
  );
}
