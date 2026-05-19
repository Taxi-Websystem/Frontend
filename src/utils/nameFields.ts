import { ANY_WHITESPACE_REGEX, NON_CYRILLIC_NAME_REGEX } from './regex';
import { capitalizeTokens } from './textCapitalize';

export function sanitizeNameUa(value: string): string {
  const sanitized = value
    .replace(NON_CYRILLIC_NAME_REGEX, '')
    .replace(ANY_WHITESPACE_REGEX, '');

  if (!sanitized) return '';

  return capitalizeTokens(sanitized, {
    locale: 'uk-UA',
    wordSeparators: ['-'],
    isLetter: /\p{L}/u
  });
}
