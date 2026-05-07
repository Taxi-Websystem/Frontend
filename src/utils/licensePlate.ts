import { DIGIT_ONLY_CHAR_REGEX, LETTER_ONLY_REGEX, LICENSE_PLATE_UA_REGEX } from './regex';

export const LICENSE_PLATE_REGEX = LICENSE_PLATE_UA_REGEX;

export function formatLicensePlateInput(value: string): string {
  const chars = Array.from(value.toLocaleUpperCase('uk-UA'));
  let formatted = '';

  for (const char of chars) {
    if (formatted.length < 2) {
      if (LETTER_ONLY_REGEX.test(char)) {
        formatted += char;
      }
      continue;
    }

    if (formatted.length < 6) {
      if (DIGIT_ONLY_CHAR_REGEX.test(char)) {
        formatted += char;
      }
      continue;
    }

    if (formatted.length < 8) {
      if (LETTER_ONLY_REGEX.test(char)) {
        formatted += char;
      }
    }

    if (formatted.length === 8) break;
  }

  return formatted;
}
