import { LETTER_ONLY_REGEX } from './regex';

interface CapitalizeTokensOptions {
  locale: string;
  stripRegex?: RegExp;
  wordSeparators?: string[];
  isLetter?: RegExp;
}

export function capitalizeTokens(value: string, options: CapitalizeTokensOptions): string {
  const {
    locale,
    stripRegex,
    wordSeparators = ['-', ' '],
    isLetter = LETTER_ONLY_REGEX
  } = options;

  const sanitized = stripRegex ? value.replace(stripRegex, '') : value;
  if (!sanitized) return '';

  const lowered = sanitized.toLocaleLowerCase(locale);
  let shouldCapitalize = true;
  let result = '';

  for (const char of lowered) {
    const isLetterChar = isLetter.test(char);
    if (isLetterChar && shouldCapitalize) {
      result += char.toLocaleUpperCase(locale);
      shouldCapitalize = false;
      continue;
    }

    result += char;

    if (wordSeparators.includes(char)) {
      shouldCapitalize = true;
    } else if (isLetterChar) {
      shouldCapitalize = false;
    }
  }

  return result;
}
