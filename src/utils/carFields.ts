/** Марка та модель: лише латиниця (англійська), цифри, пробіл і дефіс */
const NON_LATIN_CAR = /[^A-Za-z0-9\s\-]/g;

/** Колір: лише кирилиця та пробіли */
const NON_CYRILLIC_COLOR = /[^\p{sc=Cyrillic}\s]/gu;

export function sanitizeCarBrandOrModel(value: string): string {
  return value.replace(NON_LATIN_CAR, '');
}

export function sanitizeCarColorUa(value: string): string {
  return value.replace(NON_CYRILLIC_COLOR, '');
}
