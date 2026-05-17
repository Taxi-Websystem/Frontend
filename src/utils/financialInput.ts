import {
  DECIMAL_ALLOWED_CHARS_REGEX,
  DECIMAL_EDITABLE_REGEX,
  FEE_PERCENT_DECIMAL_REGEX,
  NON_NEGATIVE_DECIMAL_REGEX,
  RATING_DUPLICATED_SEPARATOR_REGEX
} from './regex';

export { FEE_PERCENT_DECIMAL_REGEX, NON_NEGATIVE_DECIMAL_REGEX };

/** Як sanitizeRatingInput — фільтр символів, проміжний ввід, опційний max. */
export function sanitizeDecimalInput(
  nextValue: string,
  currentValue: string,
  maxValue?: number
): string {
  const sanitized = nextValue
    .replace(DECIMAL_ALLOWED_CHARS_REGEX, '')
    .replace(RATING_DUPLICATED_SEPARATOR_REGEX, '$1$2');

  if (!sanitized) return '';

  if (!DECIMAL_EDITABLE_REGEX.test(sanitized)) return currentValue;

  if (maxValue != null) {
    const normalized = sanitized.replace(',', '.');
    const forNumber = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
    if (forNumber.length > 0) {
      const numeric = Number(forNumber);
      if (!Number.isNaN(numeric) && numeric > maxValue) return currentValue;
    }
  }

  return sanitized;
}
