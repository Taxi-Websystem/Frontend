import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';

interface ManagerOption {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isSuperAdmin = role === 'SuperAdmin';

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [targetId, setTargetId] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadManagers = async () => {
    if (!isSuperAdmin) return;

    try {
      const response = await api.get<ManagerOption[]>('/managers');
      setManagers(response.data);
    } catch {
      setError('Не вдалося завантажити список менеджерів.');
    }
  };

  useEffect(() => {
    void loadManagers();
  }, [isSuperAdmin]);

  const closeTransferModal = () => {
    setIsTransferOpen(false);
    setConfirmText('');
    setTargetId('');
    setLoading(false);
  };

  const transferSuperAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post<{ token: string; role: string }>('/auth/transfer-superadmin', {
        targetWhitelistId: Number(targetId)
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      setSuccess('Права SuperAdmin передано. Вашу сесію оновлено.');
      closeTransferModal();
      navigate('/manager/whitelist', { replace: true });
    } catch {
      setError('Не вдалося передати права SuperAdmin.');
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-white">Налаштування</h2>
      <p className="mt-2 text-sm text-gray-400">Системні параметри панелі керування.</p>

      {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      {success && <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</div>}

      <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-red-400" size={18} />
          <div>
            <h3 className="text-sm font-semibold text-red-300">Передати права SuperAdmin</h3>
            <p className="mt-1 text-sm text-red-200/80">
              Незворотна дія: після підтвердження ваш акаунт буде понижено до Manager.
            </p>
            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => setIsTransferOpen(true)}
              className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Відкрити передачу прав
            </button>
          </div>
        </div>
      </div>

      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-red-500/40 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Передати права SuperAdmin</h3>
              <button type="button" onClick={closeTransferModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-800">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              Увага: дія критична. Щоб продовжити, оберіть менеджера й введіть <span className="font-semibold text-red-100">CONFIRM</span>.
            </div>

            <form onSubmit={transferSuperAdmin} className="space-y-3">
              <label className="block text-sm text-gray-300">
                Цільовий менеджер
                <select
                  required
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-red-400/70"
                >
                  <option value="">Оберіть менеджера</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.userId}>
                      #{manager.userId} — {manager.name} ({manager.phoneNumber})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-gray-300">
                Введіть CONFIRM
                <input
                  required
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-red-400/70"
                />
              </label>

              <button
                type="submit"
                disabled={loading || confirmText !== 'CONFIRM' || !targetId}
                className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {loading ? 'Передача...' : 'Підтвердити передачу'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
