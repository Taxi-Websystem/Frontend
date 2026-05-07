import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FormSwitch from '../../components/FormSwitch';
import { api, getApiErrorMessage } from '../../api/axios';
import type { UserStatus } from '../../utils/userStatus';

interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  currentStatus: UserStatus;
  isManualControlAllowed: boolean;
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

  const onAutoStatusChange = async (next: boolean) => {
    if (!state) {
      return;
    }

    const previous = state;
    const requestId = ++updateRequestIdRef.current;
    setState({ ...state, isAutoStatusEnabled: next });
    setError('');
    try {
      const response = await api.put<DriverPresenceSettingsDto>('/presence/settings', {
        isAutoStatusEnabled: next
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Налаштування</h2>
        <p className="mt-1 text-sm text-slate-400">Персональні налаштування вебсервісу.</p>
      </div>

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading || !state ? (
        <div className="text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <FormSwitch
          label="Автоматичне визначення присутності"
          checked={state.isAutoStatusEnabled}
          onChange={(next) => void onAutoStatusChange(next)}
          description={
            state.isAutoStatusEnabled
              ? 'Автостатус увімкнено. Статус присутності на сторінці «Зміна» визначається автоматично.'
              : 'Автостатус вимкнено. Статус присутності на сторінці «Зміна» визначається вручну.'
          }
        />
      )}
    </section>
  );
}
