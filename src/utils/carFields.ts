import { LETTER_ONLY_REGEX, NON_CYRILLIC_COLOR_REGEX, NON_LATIN_CAR_REGEX } from './regex';

const NORMALIZED_MAKE_CASE: Record<string, string> = {
  bmw: 'BMW',
  gmc: 'GMC',
  byd: 'BYD',
  mg: 'MG',
  ram: 'RAM',
  mclaren: 'McLaren',
  mercedesbenz: 'Mercedes-Benz',
  landrover: 'Land Rover',
  alfaromeo: 'Alfa Romeo',
  rollsroyce: 'Rolls-Royce'
};

function makeKey(value: string): string {
  return value.toLocaleLowerCase('en-US').replace(/[\s-]+/g, '');
}

export function sanitizeCarBrandOrModel(value: string): string {
  const sanitized = value.replace(NON_LATIN_CAR_REGEX, '');
  if (!sanitized) return '';

  const lowered = sanitized.toLocaleLowerCase('en-US');
  let shouldCapitalize = true;
  let result = '';

  for (const char of lowered) {
    const isLetter = LETTER_ONLY_REGEX.test(char);
    if (isLetter && shouldCapitalize) {
      result += char.toLocaleUpperCase('en-US');
      shouldCapitalize = false;
      continue;
    }

    result += char;

    if (char === '-' || char === ' ') {
      shouldCapitalize = true;
    } else if (isLetter) {
      shouldCapitalize = false;
    }
  }

  return result;
}

export function sanitizeCarMake(value: string): string {
  const base = sanitizeCarBrandOrModel(value);
  if (!base) return '';
  return NORMALIZED_MAKE_CASE[makeKey(base)] ?? base;
}

export function sanitizeCarColorUa(value: string): string {
  const sanitized = value.replace(NON_CYRILLIC_COLOR_REGEX, '');
  if (!sanitized) return '';

  const lowered = sanitized.toLocaleLowerCase('uk-UA');
  let shouldCapitalize = true;
  let result = '';

  for (const char of lowered) {
    const isLetter = LETTER_ONLY_REGEX.test(char);
    if (isLetter && shouldCapitalize) {
      result += char.toLocaleUpperCase('uk-UA');
      shouldCapitalize = false;
      continue;
    }

    result += char;
    if (char === '-') {
      shouldCapitalize = true;
    } else if (isLetter) {
      shouldCapitalize = false;
    }
  }

  return result;
}
