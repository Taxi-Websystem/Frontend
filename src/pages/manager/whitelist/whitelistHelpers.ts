import type { AppRole } from '../../../utils/auth';

export type WhitelistRole = AppRole;

export interface WhitelistEntry {
  id: number;
  phoneNumber: string;
  role: WhitelistRole;
  isActive: boolean;
  createdAt: string;
}

export interface WhitelistFormState {
  phoneDigits: string;
  role: WhitelistRole;
  isActive: boolean;
}

export const defaultWhitelistForm: WhitelistFormState = {
  phoneDigits: '',
  role: 'Driver',
  isActive: true
};

export function canEditWhitelistEntry(
  entry: WhitelistEntry,
  isSuperAdmin: boolean,
  currentUserId: number | null
): boolean {
  if (isSuperAdmin) return true;
  return entry.role === 'Driver' && entry.id !== currentUserId;
}

export function canDeleteWhitelistEntry(entry: WhitelistEntry, isSuperAdmin: boolean): boolean {
  return entry.role !== 'SuperAdmin' && (isSuperAdmin || entry.role === 'Driver');
}

export function isDuplicateWhitelistPhone(
  editing: WhitelistEntry | null,
  duplicateEntry: WhitelistEntry | undefined,
  phoneNumber: string
): boolean {
  if (!duplicateEntry) return false;
  if (!editing) return true;
  return editing.phoneNumber !== phoneNumber;
}
