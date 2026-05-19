import {
  RATING_ALLOWED_CHARS_REGEX,
  RATING_DUPLICATED_SEPARATOR_REGEX,
  RATING_EDITABLE_REGEX
} from './regex';

const MAX_RATING = 5;
const MAX_RATING_INPUT_LENGTH = 4;

export function sanitizeRatingInput(nextInput: string, previousInput: string): string {
  const sanitized = nextInput
    .replace(RATING_ALLOWED_CHARS_REGEX, '')
    .replace(RATING_DUPLICATED_SEPARATOR_REGEX, '$1$2')
    .slice(0, MAX_RATING_INPUT_LENGTH);

  if (!sanitized) return '';

  if (!RATING_EDITABLE_REGEX.test(sanitized)) return previousInput;

  const normalized = sanitized.replace(',', '.');
  const numericPart = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  const numericValue = Number(numericPart);
  if (!Number.isNaN(numericValue) && numericValue > MAX_RATING) return previousInput;

  return sanitized;
}
