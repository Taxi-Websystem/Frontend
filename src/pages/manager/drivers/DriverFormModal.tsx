import { Loader2, Save, X } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import CarAutocomplete from '../../../components/CarAutocomplete';
import ModalPortal from '../../../components/ModalPortal';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa, sanitizeCarMake } from '../../../utils/carFields';
import { formatLicensePlateInput } from '../../../utils/licensePlate';
import { sanitizeNameUa } from '../../../utils/nameFields';
import { parseUaPhoneDigitsInput } from '../../../utils/phone';
import { getRoleLabel } from '../../../utils/roles';
import { searchCarColorsUa } from '../../../utils/carColors';
import { searchCarMakes, searchCarModels } from '../../../utils/vehicleCatalog';
import { FIELD_LABEL_CLASS } from '../../../styles/pageClasses';
import type { DriverFormState } from './driverHelpers';

interface DriverFormModalProps {
  isOpen: boolean;
  isCreateMode: boolean;
  canPromoteToManager: boolean;
  isFormValid: boolean;
  saving: boolean;
  form: DriverFormState;
  setForm: Dispatch<SetStateAction<DriverFormState>>;
  formError: string;
  phoneError: string;
  setPhoneError: (message: string) => void;
  editingTitle: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function DriverFormModal({
  isOpen,
  isCreateMode,
  canPromoteToManager,
  isFormValid,
  saving,
  form,
  setForm,
  formError,
  phoneError,
  setPhoneError,
  editingTitle,
  onClose,
  onSubmit
}: DriverFormModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/80 p-4 sm:items-center sm:p-6">
        <div className="mx-auto my-6 w-full max-w-md rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{editingTitle}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {formError ? <div className="field-error-box">{formError}</div> : null}
            {!isCreateMode &&
              (canPromoteToManager ? (
                <label className={FIELD_LABEL_CLASS}>
                  Роль
                  <select
                    value={form.profileRole}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        profileRole: event.target.value as 'Driver' | 'Manager'
                      }))
                    }
                    className="field-select mt-2"
                  >
                    <option value="Driver">{getRoleLabel('Driver')}</option>
                    <option value="Manager">{getRoleLabel('Manager')}</option>
                  </select>
                </label>
              ) : (
                <label className={FIELD_LABEL_CLASS}>
                  Роль
                  <select
                    value="Driver"
                    disabled
                    className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Driver">{getRoleLabel('Driver')}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                </label>
              ))}

            <label className={FIELD_LABEL_CLASS}>
              Ім&apos;я
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: sanitizeNameUa(event.target.value)
                  }))
                }
                className="mt-2 field-input"
                placeholder="Олексій"
              />
              <p className="mt-1 text-xs text-slate-400">Українською (кирилиця)</p>
            </label>

            <label className={FIELD_LABEL_CLASS}>
              Номер телефону
              <div className="manager-phone-field mt-2">
                <span className="manager-phone-field__prefix">+380</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={9}
                  value={form.phoneDigits}
                  onChange={(event) => {
                    setPhoneError('');
                    setForm((previous) => ({
                      ...previous,
                      phoneDigits: parseUaPhoneDigitsInput(event.target.value)
                    }));
                  }}
                  className="manager-phone-field__input"
                  placeholder="XXXXXXXXX"
                />
              </div>
              {phoneError ? <p className="field-error-hint">{phoneError}</p> : null}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <CarAutocomplete
                required
                label="Марка авто"
                value={form.carMake}
                placeholder="Toyota"
                hint="Англійською (латиниця)"
                search={searchCarMakes}
                normalize={sanitizeCarMake}
                onChange={(next) =>
                  setForm((previous) => {
                    const sameMake = next.trim().toLowerCase() === previous.carMake.trim().toLowerCase();
                    return {
                      ...previous,
                      carMake: next,
                      carModel: sameMake ? previous.carModel : ''
                    };
                  })
                }
              />
              <CarAutocomplete
                required
                label="Модель авто"
                value={form.carModel}
                disabled={!form.carMake.trim()}
                placeholder="Camry"
                hint="Англійською (латиниця)"
                search={(query) => searchCarModels(form.carMake, query)}
                normalize={sanitizeCarBrandOrModel}
                onChange={(next) =>
                  setForm((previous) => ({
                    ...previous,
                    carModel: next
                  }))
                }
              />
            </div>

            <CarAutocomplete
              required
              label="Колір авто"
              value={form.carColor}
              placeholder="Чорний"
              hint="Українською (кирилиця)"
              search={searchCarColorsUa}
              normalize={sanitizeCarColorUa}
              onChange={(next) =>
                setForm((previous) => ({
                  ...previous,
                  carColor: next
                }))
              }
            />

            <label className={FIELD_LABEL_CLASS}>
              Номер авто
              <input
                value={form.licensePlate}
                onChange={(event) => {
                  const formattedLicensePlate = formatLicensePlateInput(event.target.value);
                  setForm((previous) => ({ ...previous, licensePlate: formattedLicensePlate }));
                }}
                maxLength={8}
                inputMode="text"
                className="mt-2 field-input"
                placeholder="BC9193OB"
              />
              <p className="mt-1 text-xs text-slate-400">Формат: 2 літери, 4 цифри, 2 літери</p>
            </label>

            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="manager-accent-glow manager-primary-btn relative mt-1 w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
