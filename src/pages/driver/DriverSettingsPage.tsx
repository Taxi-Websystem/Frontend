import { Loader2, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FormSwitch from '../../components/FormSwitch';
import { api, getApiErrorMessage } from '../../api/axios';
import type { UserStatus } from '../../utils/userStatus';

interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  isAutoAcceptOrdersEnabled: boolean;
  isRouteOptimizationEnabled: boolean;
  currentStatus: UserStatus;
  isManualControlAllowed: boolean;
  profileId: number;
}

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';

export default function DriverSettingsPage() {
  const [state, setState] = useState<DriverPresenceSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const updateRequestIdRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get<DriverPresenceSettingsDto>('/presence/settings');
        setState(response.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Не вдалося завантажити налаштування.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const patchSettings = async (
    patch: Partial<
      Pick<
        DriverPresenceSettingsDto,
        'isAutoStatusEnabled' | 'isAutoAcceptOrdersEnabled' | 'isRouteOptimizationEnabled'
      >
    >
  ) => {
    if (!state) return;

    const previous = state;
    const requestId = ++updateRequestIdRef.current;
    setState({ ...state, ...patch });
    setError('');
    try {
      const response = await api.put<DriverPresenceSettingsDto>('/presence/settings', {
        isAutoStatusEnabled: patch.isAutoStatusEnabled,
        isAutoAcceptOrdersEnabled: patch.isAutoAcceptOrdersEnabled,
        isRouteOptimizationEnabled: patch.isRouteOptimizationEnabled
      });
      if (requestId === updateRequestIdRef.current) {
        setState(response.data);
      }
    } catch (err) {
      if (requestId === updateRequestIdRef.current) {
        setState(previous);
      }
      setError(getApiErrorMessage(err, 'Не вдалося оновити налаштування.'));
    }
  };

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <Settings className="h-7 w-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Налаштування</h2>
          <p className="mt-1 text-sm text-slate-400">Персональні налаштування вебсервісу.</p>
        </div>
      </div>

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading || !state ? (
        <div className="text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <FormSwitch
            layout="stacked"
            label="Автоматичне визначення присутності"
            checked={state.isAutoStatusEnabled}
            onChange={(next) => void patchSettings({ isAutoStatusEnabled: next })}
            description={
              state.isAutoStatusEnabled
                ? 'Автостатус увімкнено. Статус присутності на сторінці «Зміна» визначається автоматично.'
                : 'Автостатус вимкнено. Статус присутності на сторінці «Зміна» визначається вручну.'
            }
          />
          <FormSwitch
            layout="stacked"
            label="Автоматично підтверджувати замовлення"
            checked={state.isAutoAcceptOrdersEnabled}
            onChange={(next) => void patchSettings({ isAutoAcceptOrdersEnabled: next })}
            description="Якщо увімкнено, замовлення на сторінці «Замовлення» приймаються без додаткового підтвердження."
          />
          <FormSwitch
            layout="stacked"
            label="Оптимізація маршруту"
            checked={state.isRouteOptimizationEnabled}
            onChange={(next) => void patchSettings({ isRouteOptimizationEnabled: next })}
            description="Експериментальна опція для покращення відображення маршрутів на картах."
          />
        </div>
      )}
    </section>
  );
}
