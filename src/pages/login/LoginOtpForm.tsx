import { ArrowRight, ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import { FIELD_LABEL_CLASS_SPACED } from '../../styles/pageClasses';

interface LoginOtpFormProps {
  code: string;
  error: string;
  loading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCodeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackToPhone: () => void;
}

const errorBoxClass = 'field-error-box';
const primaryButtonClass =
  'login-accent-glow relative flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 text-base font-semibold text-[#0F172A] transition-[filter,opacity,box-shadow] duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export function LoginOtpForm({ code, error, loading, onSubmit, onCodeChange, onBackToPhone }: LoginOtpFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={FIELD_LABEL_CLASS_SPACED}>Код підтвердження</label>
        <div className="login-field-outline relative overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={onCodeChange}
            required
            autoFocus
            className="w-full bg-transparent py-4 pl-11 pr-11 text-center font-mono text-lg tabular-nums tracking-[0.2em] text-white outline-none placeholder:text-slate-500"
          />
        </div>
        {error ? <div className={`${errorBoxClass} mt-5`}>{error}</div> : null}
      </div>

      <button type="submit" disabled={loading || code.length !== 6} className={primaryButtonClass}>
        <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
          Увійти
          <ArrowRight className="h-5 w-5" />
        </span>
        {loading ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        ) : null}
      </button>

      <p className="text-center text-sm text-slate-400">Код дійсний протягом 5 хвилин.</p>

      <button
        type="button"
        onClick={onBackToPhone}
        className="flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Змінити номер
      </button>
    </form>
  );
}
