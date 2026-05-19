import { DIGITS_ONLY_REGEX } from './regex';

export const UA_PHONE_PREFIX = '+380';
export const UA_PHONE_LOCAL_DIGITS_LENGTH = 9;

export function parseUaPhoneDigitsInput(rawValue: string): string {
  return rawValue.replace(DIGITS_ONLY_REGEX, '').slice(0, UA_PHONE_LOCAL_DIGITS_LENGTH);
}

export function extractUaPhoneDigitsFromE164(phoneNumber: string): string {
  return phoneNumber.startsWith(UA_PHONE_PREFIX)
    ? phoneNumber.slice(UA_PHONE_PREFIX.length)
    : phoneNumber;
}

export function formatUaPhoneE164(localDigits: string): string {
  return `${UA_PHONE_PREFIX}${localDigits}`;
}

export function isUaPhoneLocalComplete(localDigits: string): boolean {
  return localDigits.length === UA_PHONE_LOCAL_DIGITS_LENGTH;
}

export const UA_PHONE_LENGTH_ERROR = 'Номер телефону має містити 9 цифр після +380.';

export function extractUaPhoneDigitsFromStoredValue(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(DIGITS_ONLY_REGEX, '');
  if (digitsOnly.startsWith('380')) {
    return digitsOnly.slice(3, 3 + UA_PHONE_LOCAL_DIGITS_LENGTH);
  }

  return digitsOnly.slice(-UA_PHONE_LOCAL_DIGITS_LENGTH);
}
