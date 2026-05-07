export const DIGITS_ONLY_REGEX = /\D/g;
export const NON_LETTER_OR_DIGIT_REGEX = /[^\d\p{L}]/gu;
export const RATING_ALLOWED_CHARS_REGEX = /[^0-9.,]/g;
export const RATING_DUPLICATED_SEPARATOR_REGEX = /([.,])(.*)\1+/g;
export const RATING_EDITABLE_REGEX = /^\d(?:[.,]\d{0,2})?$/;

export const NON_LATIN_CAR_REGEX = /[^A-Za-z0-9\s-]/g;
export const NON_CYRILLIC_COLOR_REGEX = /[^\p{sc=Cyrillic}-]/gu;
export const NON_CYRILLIC_NAME_REGEX = /[^\p{sc=Cyrillic}'’-]/gu;
export const MULTIPLE_SPACES_REGEX = /\s{2,}/g;
export const LEADING_SPACES_REGEX = /^\s+/g;
export const LETTER_ONLY_REGEX = /\p{L}/u;
export const DIGIT_ONLY_CHAR_REGEX = /\d/u;
export const ANY_WHITESPACE_REGEX = /\s/gu;

export const LICENSE_PLATE_UA_REGEX = /^[\p{L}]{2}\d{4}[\p{L}]{2}$/u;
export const RATING_1_TO_5_DECIMAL_REGEX = /^(?:[1-4](?:[.,]\d{1,2})?|5(?:[.,]0{1,2})?)$/;

export const JWT_BASE64URL_DASH_REGEX = /-/g;
export const JWT_BASE64URL_UNDERSCORE_REGEX = /_/g;
export const DIGITS_STRING_REGEX = /^\d+$/;
