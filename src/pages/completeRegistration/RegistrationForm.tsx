import { ArrowRight, Loader2, Save } from 'lucide-react';

export type RegistrationFormVariant = 'registration' | 'settings';
import type { FormEvent } from 'react';
import CarAutocomplete from '../../components/CarAutocomplete';
import { FormFieldSpinner } from '../../components/FormFieldSpinner';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa, sanitizeCarMake } from '../../utils/carFields';
import { formatLicensePlateInput } from '../../utils/licensePlate';
import { sanitizeNameUa } from '../../utils/nameFields';
import { extractUaPhoneDigitsFromStoredValue } from '../../utils/phone';
import { searchCarColorsUa } from '../../utils/carColors';
import { searchCarMakes, searchCarModels } from '../../utils/vehicleCatalog';
import { FIELD_LABEL_CLASS_SPACED } from '../../styles/pageClasses';

interface RegistrationFormProps {
  profileLoaded: boolean;
  phoneNumber: string;
  name: string;
  carBrand: string;
  carModel: string;
  carColor: string;
  licensePlate: string;
  isDriver: boolean;
  error: string;
  loading: boolean;
  canSubmit: boolean;
  onNameChange: (value: string) => void;
  onCarBrandChange: (value: string) => void;
  onCarModelChange: (value: string) => void;
  onCarColorChange: (value: string) => void;
  onLicensePlateChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  variant?: RegistrationFormVariant;
}

const hintTextClass = 'mt-1 text-xs text-slate-400';
const primaryButtonClass =
  'manager-accent-glow manager-primary-btn mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export function RegistrationForm({
  profileLoaded,
  phoneNumber,
  name,
  carBrand,
  carModel,
  carColor,
  licensePlate,
  isDriver,
  error,
  loading,
  canSubmit,
  onNameChange,
  onCarBrandChange,
  onCarModelChange,
  onCarColorChange,
  onLicensePlateChange,
  onSubmit,
  variant = 'registration'
}: RegistrationFormProps) {
  const phoneDigitsLocal = extractUaPhoneDigitsFromStoredValue(phoneNumber);
  const isSettings = variant === 'settings';
  const profileLoading = !profileLoaded;

  return (
    <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
      <div>
        <label className={FIELD_LABEL_CLASS_SPACED}>Номер телефону</label>
        {profileLoaded ? (
          <div className="manager-phone-field mt-2 opacity-60">
            <span className="manager-phone-field__prefix">+380</span>
            <input
              type="text"
              disabled
              value={phoneDigitsLocal}
              placeholder="XXXXXXXXX"
              className="manager-phone-field__input"
              autoComplete="off"
              readOnly
            />
          </div>
        ) : (
          <div className="pointer-events-none manager-phone-field mt-2 select-none opacity-60" aria-busy>
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-4">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />
            </div>
          </div>
        )}
      </div>

      <label className={FIELD_LABEL_CLASS_SPACED}>
        Ім&apos;я
        {profileLoading ? (
          <FormFieldSpinner className="mt-2" />
        ) : (
          <input
            required
            autoFocus={name.length === 0}
            value={name}
            onChange={(event) => onNameChange(sanitizeNameUa(event.target.value))}
            className="mt-2 field-input"
            placeholder="Олексій"
            autoComplete="off"
            name="driver-profile-name"
          />
        )}
        <p className={hintTextClass}>Українською (кирилиця)</p>
      </label>

      {isDriver ? (
        <>
          <CarAutocomplete
            required
            label="Марка авто"
            value={carBrand}
            placeholder="Toyota"
            hint="Англійською (латиниця)"
            search={searchCarMakes}
            normalize={sanitizeCarMake}
            onChange={onCarBrandChange}
            profileLoading={profileLoading}
          />
          <CarAutocomplete
            required
            label="Модель авто"
            value={carModel}
            disabled={!carBrand.trim()}
            placeholder="Camry"
            hint="Англійською (латиниця)"
            search={(query) => searchCarModels(carBrand, query)}
            normalize={sanitizeCarBrandOrModel}
            onChange={onCarModelChange}
            profileLoading={profileLoading}
          />
          <CarAutocomplete
            required
            label="Колір авто"
            value={carColor}
            placeholder="Чорний"
            hint="Українською (кирилиця)"
            search={searchCarColorsUa}
            normalize={sanitizeCarColorUa}
            onChange={onCarColorChange}
            profileLoading={profileLoading}
          />
          <label className={FIELD_LABEL_CLASS_SPACED}>
            Номер авто
            {profileLoading ? (
              <FormFieldSpinner className="mt-2" />
            ) : (
              <input
                required
                value={licensePlate}
                onChange={(event) => onLicensePlateChange(formatLicensePlateInput(event.target.value))}
                maxLength={8}
                inputMode="text"
                className="mt-2 field-input"
                placeholder="BC9193OB"
                autoComplete="off"
                name="driver-license-plate"
              />
            )}
            <p className={hintTextClass}>Формат: 2 літери, 4 цифри, 2 літери</p>
          </label>
        </>
      ) : null}

      {error ? <div className="field-error-box">{error}</div> : null}

      <button
        type="submit"
        disabled={loading || !canSubmit || profileLoading}
        className={
          isSettings
            ? 'manager-accent-glow manager-primary-btn relative mt-2 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto'
            : `${primaryButtonClass} relative disabled:opacity-100`
        }
      >
        <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
          <Save size={isSettings ? 16 : 20} className={isSettings ? undefined : 'h-5 w-5'} />
          {isSettings ? 'Зберегти' : 'Зберегти і продовжити'}
          {!isSettings ? <ArrowRight className="h-5 w-5" /> : null}
        </span>
        {loading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : null}
      </button>
    </form>
  );
}
