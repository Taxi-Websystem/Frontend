import {
  FEE_PERCENT_DECIMAL_REGEX,
  NON_NEGATIVE_DECIMAL_REGEX
} from '../../../utils/financialInput';
import type { FinancialSettingsResponse, TariffFormState } from './settingsTypes';

export function tariffResponseToForm(row: FinancialSettingsResponse): TariffFormState {
  return {
    baseFare: String(row.baseFare),
    costPerKm: String(row.costPerKm),
    platformFixedFee: String(row.platformFixedFee),
    feePercent: String(Number((row.platformFeePercentage * 100).toFixed(2)))
  };
}

export function isTariffFormValid(form: TariffFormState): boolean {
  const baseFareRaw = form.baseFare.trim();
  const costPerKmRaw = form.costPerKm.trim();
  const platformFixedFeeRaw = form.platformFixedFee.trim();
  const feePercentRaw = form.feePercent.trim();

  return (
    NON_NEGATIVE_DECIMAL_REGEX.test(baseFareRaw.replace(',', '.')) &&
    NON_NEGATIVE_DECIMAL_REGEX.test(costPerKmRaw.replace(',', '.')) &&
    NON_NEGATIVE_DECIMAL_REGEX.test(platformFixedFeeRaw.replace(',', '.')) &&
    FEE_PERCENT_DECIMAL_REGEX.test(feePercentRaw.replace(',', '.'))
  );
}

export function tariffFormToPayload(form: TariffFormState) {
  return {
    baseFare: Number(form.baseFare.trim().replace(',', '.')),
    costPerKm: Number(form.costPerKm.trim().replace(',', '.')),
    platformFixedFee: Number(form.platformFixedFee.trim().replace(',', '.')),
    platformFeePercentage: Number(form.feePercent.trim().replace(',', '.')) / 100
  };
}
