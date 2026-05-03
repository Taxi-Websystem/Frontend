import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { parseApiRole } from '../../utils/roles';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';

interface ManagerOption {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
  role: 'SuperAdmin' | 'Manager' | 'Driver';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
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
      setManagers(
        response.data.map((row) => ({
          ...row,
          role: parseApiRole(row.role)
        }))
      );
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

      {isSuperAdmin && (
        <>
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-red-400" size={18} />
              <div>
                <h3 className="text-sm font-semibold text-red-300">Передати роль Адміністратора</h3>
                <p className="mt-1 text-sm text-red-200/80">
                  Незворотна дія: роль Адміністратора буде змінена на Менеджера.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                >
                  Розпочати процедуру
                </button>
              </div>
            </div>
          </div>

          {isTransferOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-lg rounded-xl border border-red-500/40 bg-gray-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Передати роль Адміністратора</h3>
                  <button type="button" onClick={closeTransferModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-800">
                    <X size={16} />
                  </button>
                </div>

                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  Оберіть менеджера й введіть <span className="font-semibold text-red-100">ПІДТВЕРДИТИ</span>.
                </div>

                <form onSubmit={transferSuperAdmin} className="space-y-3">
                  <label className="block text-sm text-gray-300">
                    Цільовий менеджер
                    <select
                      required
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                      className="field-select mt-1"
                    >
                      <option value="">Оберіть менеджера</option>
                      {managers
                        .filter((manager) => manager.userId !== currentUserId && manager.role === 'Manager')
                        .map((manager) => (
                          <option key={manager.id} value={manager.userId}>
                            №{manager.userId} - {manager.name} ({manager.phoneNumber})
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block text-sm text-gray-300">
                    Введіть "ПІДТВЕРДИТИ"
                    <input
                      required
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      className="mt-1 field-input"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'ПІДТВЕРДИТИ' || !targetId}
                    className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
                  >
                    {loading ? 'Підтвердження...' : 'Підтвердити дію'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
