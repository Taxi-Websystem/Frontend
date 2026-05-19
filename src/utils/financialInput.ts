import {
  DECIMAL_ALLOWED_CHARS_REGEX,
  DECIMAL_EDITABLE_REGEX,
  FEE_PERCENT_DECIMAL_REGEX,
  NON_NEGATIVE_DECIMAL_REGEX,
  RATING_DUPLICATED_SEPARATOR_REGEX
} from './regex';

export { FEE_PERCENT_DECIMAL_REGEX, NON_NEGATIVE_DECIMAL_REGEX };

function exceedsMaxDecimalValue(value: string, maxValue: number): boolean {
  const normalized = value.replace(',', '.');
  const numericPart = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  if (numericPart.length === 0) return false;

  const numericValue = Number(numericPart);
  return !Number.isNaN(numericValue) && numericValue > maxValue;
}

export function sanitizeDecimalInput(
  nextInput: string,
  previousInput: string,
  maxValue?: number
): string {
  const sanitized = nextInput
    .replace(DECIMAL_ALLOWED_CHARS_REGEX, '')
    .replace(RATING_DUPLICATED_SEPARATOR_REGEX, '$1$2');

  if (!sanitized) return '';

  if (!DECIMAL_EDITABLE_REGEX.test(sanitized)) return previousInput;

  if (maxValue != null && exceedsMaxDecimalValue(sanitized, maxValue)) {
    return previousInput;
  }

  return sanitized;
}
