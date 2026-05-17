import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Loader2, Save, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/axios';
import { parseApiRole } from '../../utils/roles';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import ModalPortal from '../../components/ModalPortal';
import {
  FEE_PERCENT_DECIMAL_REGEX,
  NON_NEGATIVE_DECIMAL_REGEX,
  sanitizeDecimalInput
} from '../../utils/financialInput';

interface FinancialSettingsResponse {
  baseFare: number;
  costPerKm: number;
  platformFixedFee: number;
  platformFeePercentage: number;
}

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
  const isManager = role === 'Manager';

  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialSaving, setFinancialSaving] = useState(false);
  const [financialError, setFinancialError] = useState('');
  const [tariffForm, setTariffForm] = useState({
    baseFare: '',
    costPerKm: '',
    platformFixedFee: '',
    feePercent: ''
  });
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [targetId, setTargetId] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  useEffect(() => {
    if (!isSuperAdmin && !isManager) {
      setFinancialLoading(false);
      return;
    }

    const loadTariffs = async () => {
      setFinancialLoading(true);
      setFinancialError('');
      try {
        const response = await api.get<FinancialSettingsResponse>('/settings');
        const row = response.data;
        setTariffForm({
          baseFare: String(row.baseFare),
          costPerKm: String(row.costPerKm),
          platformFixedFee: String(row.platformFixedFee),
          feePercent: String(Number((row.platformFeePercentage * 100).toFixed(2)))
        });
      } catch (err) {
        setFinancialError(getApiErrorMessage(err, 'Не вдалося завантажити тарифи.'));
      } finally {
        setFinancialLoading(false);
      }
    };

    void loadTariffs();
  }, [isManager, isSuperAdmin]);

  const closeTransferModal = () => {
    setIsTransferOpen(false);
    setConfirmText('');
    setTargetId('');
    setLoading(false);
  };

  const baseFareRaw = tariffForm.baseFare.trim();
  const costPerKmRaw = tariffForm.costPerKm.trim();
  const platformFixedFeeRaw = tariffForm.platformFixedFee.trim();
  const feePercentRaw = tariffForm.feePercent.trim();

  const isFinancialFormValid =
    NON_NEGATIVE_DECIMAL_REGEX.test(baseFareRaw.replace(',', '.')) &&
    NON_NEGATIVE_DECIMAL_REGEX.test(costPerKmRaw.replace(',', '.')) &&
    NON_NEGATIVE_DECIMAL_REGEX.test(platformFixedFeeRaw.replace(',', '.')) &&
    FEE_PERCENT_DECIMAL_REGEX.test(feePercentRaw.replace(',', '.'));

  const saveTariffs = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSuperAdmin) return;

    if (!isFinancialFormValid) {
      setFinancialError('Перевірте коректність числових полів.');
      return;
    }

    setFinancialSaving(true);
    setFinancialError('');

    const baseFare = Number(baseFareRaw.replace(',', '.'));
    const costPerKm = Number(costPerKmRaw.replace(',', '.'));
    const platformFixedFee = Number(platformFixedFeeRaw.replace(',', '.'));
    const feePercent = Number(feePercentRaw.replace(',', '.'));

    try {
      await api.put('/settings', {
        baseFare,
        costPerKm,
        platformFixedFee,
        platformFeePercentage: feePercent / 100
      });
    } catch (err) {
      setFinancialError(getApiErrorMessage(err, 'Не вдалося зберегти тарифи.'));
    } finally {
      setFinancialSaving(false);
    }
  };

  const transferSuperAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<{ token: string; role: string }>('/auth/transfer-superadmin', {
        targetWhitelistId: Number(targetId)
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
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
  /** Той самий фон і обводка, що рядок «Автоматичне визначення присутності» (FormSwitch). */
  const financialInputClass =
    'mt-2 field-input manager-field-outline bg-[#1E293B] tabular-nums disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <Settings className="h-7 w-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Налаштування</h2>
          <p className="mt-2 text-sm text-slate-400">Персональні (і не тільки) налаштування вебсервісу.</p>
        </div>
      </div>

      {error && (
        <div className="field-error-box mt-4">{error}</div>
      )}
      {(isManager || isSuperAdmin) && (
        <>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-5">
            <h3 className="text-sm font-semibold text-white">Фінансові налаштування</h3>
            <p className="mt-1 text-xs text-slate-400">
              Налаштування для розрахунку вартості поїздок.
            </p>

          {financialError ? <div className="field-error-box mt-4">{financialError}</div> : null}

          {financialLoading ? (
            <div className="mt-4 text-center text-slate-400">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : (
            <form onSubmit={(e) => void saveTariffs(e)} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={fieldLabelClass}>
                  Подача (грн)
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!isSuperAdmin}
                    value={tariffForm.baseFare}
                    onChange={(event) =>
                      setTariffForm((p) => ({
                        ...p,
                        baseFare: sanitizeDecimalInput(event.target.value, p.baseFare)
                      }))
                    }
                    className={financialInputClass}
                  />
                </label>
                <label className={fieldLabelClass}>
                  Вартість за км (грн)
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!isSuperAdmin}
                    value={tariffForm.costPerKm}
                    onChange={(event) =>
                      setTariffForm((p) => ({
                        ...p,
                        costPerKm: sanitizeDecimalInput(event.target.value, p.costPerKm)
                      }))
                    }
                    className={financialInputClass}
                  />
                </label>
                <label className={fieldLabelClass}>
                  Фіксований збір (грн)
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!isSuperAdmin}
                    value={tariffForm.platformFixedFee}
                    onChange={(event) =>
                      setTariffForm((p) => ({
                        ...p,
                        platformFixedFee: sanitizeDecimalInput(event.target.value, p.platformFixedFee)
                      }))
                    }
                    className={financialInputClass}
                  />
                </label>
                <label className={fieldLabelClass}>
                  Комісія (%)
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!isSuperAdmin}
                    value={tariffForm.feePercent}
                    onChange={(event) =>
                      setTariffForm((p) => ({
                        ...p,
                        feePercent: sanitizeDecimalInput(event.target.value, p.feePercent, 100)
                      }))
                    }
                    className={financialInputClass}
                  />
                </label>
              </div>

              {isSuperAdmin ? (
                <button
                  type="submit"
                  disabled={financialSaving || !isFinancialFormValid}
                  className="manager-accent-glow manager-primary-btn relative mt-2 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
                >
                  <span className={`inline-flex items-center gap-2 ${financialSaving ? 'invisible' : ''}`}>
                    <Save size={16} />
                    Зберегти
                  </span>
                  {financialSaving ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                  ) : null}
                </button>
              ) : null}
            </form>
          )}
          </div>
        </>
      )}

      {isSuperAdmin && (
        <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white">Роль Адміністратора</h3>
            <p className="mt-1 text-xs text-slate-400">
              Незворотна дія: роль Адміністратора буде змінена на Менеджера.
            </p>
            <button
              type="button"
              onClick={() => setIsTransferOpen(true)}
              className="manager-accent-glow manager-primary-btn mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
            >
              <AlertTriangle size={16} strokeWidth={2} aria-hidden />
              Передати роль
            </button>
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
                    className="manager-accent-glow manager-primary-btn relative w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
                      <Save size={16} />
                      Підтвердити дію
                    </span>
                    {loading ? (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </span>
                    ) : null}
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

