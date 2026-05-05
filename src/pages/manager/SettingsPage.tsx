import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { parseApiRole } from '../../utils/roles';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import ModalPortal from '../../components/ModalPortal';

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

  const pageCardClass =
    'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
  const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

  return (
    <section className={pageCardClass}>
      <h2 className="text-xl font-semibold text-white">Налаштування</h2>
      <p className="mt-2 text-sm text-slate-400">Системні параметри панелі керування.</p>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {isSuperAdmin && (
        <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-[#EAB308]" size={18} />
              <div>
                <h3 className="text-sm font-semibold text-white">Передати роль Адміністратора</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Незворотна дія: роль Адміністратора буде змінена на Менеджера.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  className="manager-accent-glow manager-primary-btn mt-3 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  Розпочати процедуру
                </button>
              </div>
            </div>
          </div>

          {isTransferOpen && (
            <ModalPortal>
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
                <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Передати роль Адміністратора</h3>
                    <button
                      type="button"
                      onClick={closeTransferModal}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  Оберіть менеджера й введіть «<span className="font-semibold text-[#EAB308]">ПІДТВЕРДИТИ</span>».
                </div>

                  <form onSubmit={transferSuperAdmin} className="space-y-4">
                  <label className={fieldLabelClass}>
                    Цільовий менеджер
                    <select
                      required
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                      className="field-select mt-2 font-mono"
                    >
                      <option value="">Оберіть менеджера</option>
                      {managers
                        .filter((manager) => manager.userId !== currentUserId && manager.role === 'Manager')
                        .map((manager) => (
                          <option key={manager.id} value={manager.userId}>
                            №{manager.userId} — {manager.name} ({manager.phoneNumber})
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className={fieldLabelClass}>
                    Введіть «<span className="font-semibold text-[#EAB308]">ПІДТВЕРДИТИ</span>»
                    <input
                      required
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      className="mt-2 field-input"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'ПІДТВЕРДИТИ' || !targetId}
                    className="manager-accent-glow manager-primary-btn w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Підтвердити дію'}
                  </button>
                  </form>
                </div>
              </div>
            </ModalPortal>
          )}
        </>
      )}
    </section>
  );
}
