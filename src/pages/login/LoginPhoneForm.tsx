import { ArrowRight, Loader2, Phone } from 'lucide-react';
import { FIELD_LABEL_CLASS_SPACED } from '../../styles/pageClasses';

interface LoginPhoneFormProps {
  digits: string;
  error: string;
  loading: boolean;
  isPhoneValid: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onDigitsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const errorBoxClass = 'field-error-box';
const primaryButtonClass =
  'login-accent-glow relative flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 text-base font-semibold text-[#0F172A] transition-[filter,opacity,box-shadow] duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export function LoginPhoneForm({
  digits,
  error,
  loading,
  isPhoneValid,
  onSubmit,
  onDigitsChange
}: LoginPhoneFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={FIELD_LABEL_CLASS_SPACED}>Номер телефону</label>
        <div className="login-field-outline flex items-center overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B]">
          <div className="flex items-center gap-2 border-r border-white/10 px-4 py-4">
            <Phone className="h-4 w-4 text-white" aria-hidden />
            <span className="font-mono text-lg text-white">+380</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="XXXXXXXXX"
            value={digits}
            onChange={onDigitsChange}
            required
            className="min-w-0 flex-1 bg-transparent px-4 py-4 font-mono text-lg text-white outline-none placeholder:text-slate-500"
          />
        </div>
        {error ? <div className={`${errorBoxClass} mt-5`}>{error}</div> : null}
      </div>

      <button type="submit" disabled={loading || !isPhoneValid} className={primaryButtonClass}>
        <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
          Отримати код
          <ArrowRight className="h-5 w-5" />
        </span>
        {loading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : null}
      </button>

      <p className="text-center text-sm text-slate-400">Ви отримаєте одноразовий код підтвердження.</p>
    </form>
  );
}
