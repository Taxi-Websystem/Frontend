interface FormSwitchProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export default function FormSwitch({ label, checked, onChange, disabled, description }: FormSwitchProps) {
  return (
    <div className="space-y-1">
      <label
        className={`manager-field-outline flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1E293B] px-4 py-2 text-sm text-slate-300 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        <span className="text-white">{label}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-in-out disabled:cursor-not-allowed ${
            checked ? 'bg-[#EAB308]' : 'bg-slate-600'
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>
      {description ? <p className="text-xs text-slate-400">{description}</p> : null}
    </div>
  );
}
