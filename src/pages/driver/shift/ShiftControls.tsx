import { Loader2, Pause, Play, Wifi, WifiOff } from 'lucide-react';

interface ShiftControlsProps {
  loading: boolean;
  saving: boolean;
  breakSaving: boolean;
  nextManualStatus: 'Offline' | 'Online';
  manualButtonText: string;
  statusControlsDisabled: boolean;
  onBreak: boolean;
  breakDisabled: boolean;
  isAutoEnabled: boolean;
  onManualStatus: (status: 'Offline' | 'Online') => void;
  onToggleBreak: () => void;
}

export function ShiftControls({
  loading,
  saving,
  breakSaving,
  nextManualStatus,
  manualButtonText,
  statusControlsDisabled,
  onBreak,
  breakDisabled,
  isAutoEnabled,
  onManualStatus,
  onToggleBreak
}: ShiftControlsProps) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={statusControlsDisabled}
          onClick={() => onManualStatus(nextManualStatus)}
          className="manager-accent-glow manager-primary-btn relative inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading || saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : nextManualStatus === 'Online' ? (
            <Wifi size={16} />
          ) : (
            <WifiOff size={16} />
          )}
          {manualButtonText}
        </button>

        <button
          type="button"
          disabled={breakDisabled}
          onClick={onToggleBreak}
          className="manager-accent-glow manager-primary-btn relative inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {breakSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : onBreak ? (
            <Play size={16} />
          ) : (
            <Pause size={16} />
          )}
          {onBreak ? 'До роботи' : 'Взяти перерву'}
        </button>
      </div>

      <p className="mt-3 w-full text-center text-xs text-slate-400">
        {isAutoEnabled
          ? 'Автостатус увімкнено: статус присутності визначається автоматично.'
          : 'Автостатус вимкнено: статус присутності визначається вручну.'}
      </p>
    </>
  );
}
