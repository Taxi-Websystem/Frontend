import { ANY_WHITESPACE_REGEX, NON_CYRILLIC_NAME_REGEX } from './regex';

export function sanitizeNameUa(value: string): string {
  const sanitized = value
    .replace(NON_CYRILLIC_NAME_REGEX, '')
    .replace(ANY_WHITESPACE_REGEX, '');

  if (!sanitized) return '';
  const lowered = sanitized.toLocaleLowerCase('uk-UA');
  let result = '';
  let shouldCapitalize = true;

  for (const char of lowered) {
    if (shouldCapitalize && /\p{L}/u.test(char)) {
      result += char.toLocaleUpperCase('uk-UA');
      shouldCapitalize = false;
      continue;
    }

    result += char;
    if (char === '-') {
      shouldCapitalize = true;
    } else if (/\p{L}/u.test(char)) {
      shouldCapitalize = false;
    }
  }

  return result;
}
