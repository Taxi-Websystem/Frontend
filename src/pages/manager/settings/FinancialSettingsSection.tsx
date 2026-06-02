import { Loader2, Save } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { sanitizeDecimalInput } from '../../../utils/financialInput';
import { FIELD_LABEL_CLASS, ORDER_CARD_CLASS } from '../../../styles/pageClasses';
import { FINANCIAL_INPUT_CLASS, type TariffFormState } from './settingsTypes';

interface FinancialSettingsSectionProps {
  isSuperAdmin: boolean;
  loading: boolean;
  saving: boolean;
  error: string;
  form: TariffFormState;
  setForm: Dispatch<SetStateAction<TariffFormState>>;
  isFormValid: boolean;
  onSubmit: (event: FormEvent) => void;
}

export function FinancialSettingsSection({
  isSuperAdmin,
  loading,
  saving,
  error,
  form,
  setForm,
  isFormValid,
  onSubmit
}: FinancialSettingsSectionProps) {
  return (
    <div className={ORDER_CARD_CLASS}>
      <h3 className="text-sm font-semibold text-white">Фінансові налаштування</h3>
      <p className="mt-1 text-xs text-slate-400">Налаштування для розрахунку вартості поїздок.</p>

      {error ? <div className="field-error-box mt-4">{error}</div> : null}

      {loading ? (
        <div className="mt-4 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={FIELD_LABEL_CLASS}>
              Подача (грн)
              <input
                type="text"
                inputMode="decimal"
                disabled={!isSuperAdmin}
                value={form.baseFare}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    baseFare: sanitizeDecimalInput(event.target.value, previous.baseFare)
                  }))
                }
                className={FINANCIAL_INPUT_CLASS}
              />
            </label>
            <label className={FIELD_LABEL_CLASS}>
              Вартість за км (грн)
              <input
                type="text"
                inputMode="decimal"
                disabled={!isSuperAdmin}
                value={form.costPerKm}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    costPerKm: sanitizeDecimalInput(event.target.value, previous.costPerKm)
                  }))
                }
                className={FINANCIAL_INPUT_CLASS}
              />
            </label>
            <label className={FIELD_LABEL_CLASS}>
              Фіксований збір (грн)
              <input
                type="text"
                inputMode="decimal"
                disabled={!isSuperAdmin}
                value={form.platformFixedFee}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    platformFixedFee: sanitizeDecimalInput(event.target.value, previous.platformFixedFee)
                  }))
                }
                className={FINANCIAL_INPUT_CLASS}
              />
            </label>
            <label className={FIELD_LABEL_CLASS}>
              Комісія (%)
              <input
                type="text"
                inputMode="decimal"
                disabled={!isSuperAdmin}
                value={form.feePercent}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    feePercent: sanitizeDecimalInput(event.target.value, previous.feePercent, 100)
                  }))
                }
                className={FINANCIAL_INPUT_CLASS}
              />
            </label>
          </div>

          {isSuperAdmin ? (
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="manager-accent-glow manager-primary-btn relative mt-2 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
            >
              <span className={`inline-flex items-center gap-2 ${saving ? 'invisible' : ''}`}>
                <Save size={16} />
                Зберегти
              </span>
              {saving ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              ) : null}
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}
