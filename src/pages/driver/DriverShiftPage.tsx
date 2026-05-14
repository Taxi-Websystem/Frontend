import { Loader2, Power, UserRoundCheck, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentUserId } from '../../utils/auth';
import { getUserStatusLabel, type UserStatus } from '../../utils/userStatus';

interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  currentStatus: UserStatus;
  isManualControlAllowed: boolean;
  profileId: number;
}

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';

export default function DriverShiftPage() {
  const currentUserId = getCurrentUserId();
  const [state, setState] = useState<DriverPresenceSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (silentError = false) => {
    setLoading(true);
    if (!silentError) {
      setError('');
    }
    try {
      const response = await api.get<DriverPresenceSettingsDto>('/presence/settings');
      setState(response.data);
      return true;
    } catch (err) {
      if (!silentError) {
        setError(getApiErrorMessage(err, 'Не вдалося завантажити стан зміни.'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const ok = await load(attempt < 4);
        if (ok || cancelled) {
          return;
        }

        // На першому вході можливий короткий race, даємо бекенду підняти сесію/SignalR.
        await new Promise((resolve) => window.setTimeout(resolve, 600));
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !state?.isAutoStatusEnabled || state.currentStatus !== 'Offline') {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void load(true);
      if (attempts >= 4) {
        window.clearInterval(intervalId);
      }
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [loading, state?.isAutoStatusEnabled, state?.currentStatus]);

  useEffect(() => {
    const onPresenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: number; status: UserStatus }>).detail;
      if (!detail || currentUserId == null || detail.userId !== currentUserId) {
        return;
      }

      setState((prev) => (prev ? { ...prev, currentStatus: detail.status } : prev));
    };

    window.addEventListener('presence:changed', onPresenceChanged as EventListener);
    return () => window.removeEventListener('presence:changed', onPresenceChanged as EventListener);
  }, [currentUserId]);

  const setManualStatus = async (status: Extract<UserStatus, 'Offline' | 'Online'>) => {
    setSaving(true);
    setError('');
    try {
      const response = await api.post<DriverPresenceSettingsDto>('/presence/status', { status });
      setState(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося змінити статус зміни.'));
    } finally {
      setSaving(false);
    }
  };

  const isAutoEnabled = state?.isAutoStatusEnabled ?? true;
  const currentStatus = state?.currentStatus ?? 'Offline';
  const nextManualStatus: Extract<UserStatus, 'Offline' | 'Online'> =
    currentStatus === 'Offline' ? 'Online' : 'Offline';
  const manualButtonText = currentStatus === 'Offline' ? 'Я «Онлайн»' : 'Я «Офлайн»';
  const isManualDisabled = loading || isAutoEnabled || currentStatus === 'InRide';

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <Power className="h-7 w-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Зміна</h2>
          <p className="mt-1 text-sm text-slate-400">Керуйте статусом вручну або через автостатус.</p>
        </div>
      </div>

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <UserRoundCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : getUserStatusLabel(currentStatus)}
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Поточний статус</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          disabled={isManualDisabled}
          onClick={() => void setManualStatus(nextManualStatus)}
          className="manager-accent-glow manager-primary-btn relative inline-flex items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="inline-flex items-center gap-2 opacity-0">
                <Wifi size={16} />
                {manualButtonText}
              </span>
              <Loader2 className="absolute h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : nextManualStatus === 'Online' ? (
                <Wifi size={16} />
              ) : (
                <WifiOff size={16} />
              )}
              {manualButtonText}
            </>
          )}
        </button>
        <p className="inline-flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          {isAutoEnabled
            ? 'Автостатус увімкнено: статус присутності визначається автоматично.'
            : 'Автостатус вимкнено: статус присутності визначається вручну.'}
        </p>
      </div>
    </section>
  );
}
