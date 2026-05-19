export interface FinancialSettingsResponse {
  baseFare: number;
  costPerKm: number;
  platformFixedFee: number;
  platformFeePercentage: number;
}

export interface TariffFormState {
  baseFare: string;
  costPerKm: string;
  platformFixedFee: string;
  feePercent: string;
}

export interface ManagerOption {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
  role: 'SuperAdmin' | 'Manager' | 'Driver';
}

export const defaultTariffForm: TariffFormState = {
  baseFare: '',
  costPerKm: '',
  platformFixedFee: '',
  feePercent: ''
};

export const FINANCIAL_INPUT_CLASS =
  'mt-2 field-input manager-field-outline bg-[#1E293B] tabular-nums disabled:cursor-not-allowed disabled:opacity-60';
