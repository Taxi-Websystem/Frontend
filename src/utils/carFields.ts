import { NON_CYRILLIC_COLOR_REGEX, NON_LATIN_CAR_REGEX } from './regex';
import { capitalizeTokens } from './textCapitalize';

const NORMALIZED_MAKE_CASE: Record<string, string> = {
  bmw: 'BMW',
  gmc: 'GMC',
  byd: 'BYD',
  mg: 'MG',
  ram: 'RAM',
  mclaren: 'McLaren',
  mercedesbenz: 'Mercedes-Benz',
  landrover: 'Land Rover',
  alfaromeo: 'Alfa Romeo',
  rollsroyce: 'Rolls-Royce'
};

function makeKey(value: string): string {
  return value.toLocaleLowerCase('en-US').replace(/[\s-]+/g, '');
}

export function sanitizeCarBrandOrModel(value: string): string {
  return capitalizeTokens(value, {
    locale: 'en-US',
    stripRegex: NON_LATIN_CAR_REGEX
  });
}

export function sanitizeCarMake(value: string): string {
  const base = sanitizeCarBrandOrModel(value);
  if (!base) return '';
  return NORMALIZED_MAKE_CASE[makeKey(base)] ?? base;
}

export function sanitizeCarColorUa(value: string): string {
  return capitalizeTokens(value, {
    locale: 'uk-UA',
    stripRegex: NON_CYRILLIC_COLOR_REGEX,
    wordSeparators: ['-']
  });
}
