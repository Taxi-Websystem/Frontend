import { LETTER_ONLY_REGEX, NON_CYRILLIC_COLOR_REGEX, NON_LATIN_CAR_REGEX } from './regex';

export function sanitizeCarBrandOrModel(value: string): string {
  const sanitized = value.replace(NON_LATIN_CAR_REGEX, '');
  if (!sanitized) return '';
  return sanitized.charAt(0).toLocaleUpperCase('en-US') + sanitized.slice(1);
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
