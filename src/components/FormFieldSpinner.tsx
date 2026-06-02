import { Loader2 } from 'lucide-react';

interface FormFieldSpinnerProps {
  className?: string;
}

export function FormFieldSpinner({ className = '' }: FormFieldSpinnerProps) {
  return (
    <div
      className={`field-input pointer-events-none flex items-center justify-center select-none opacity-60 ${className}`}
      aria-busy
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />
    </div>
  );
}
