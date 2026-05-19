import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getSubmitFieldErrors, PHONE_DUPLICATE_MESSAGE } from '../../utils/formErrors';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import type { AppRole } from '../../utils/auth';
import { getRoleLabel, parseApiRole } from '../../utils/roles';
import { DIGITS_ONLY_REGEX } from '../../utils/regex';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import ModalPortal from '../../components/ModalPortal';
import StatusPulseDot from '../../components/StatusPulseDot';
import { managerTablePad } from './managerTableStyles';

type WhitelistRole = AppRole;

interface WhitelistEntry {
  id: number;
  phoneNumber: string;
  role: WhitelistRole;
  isActive: boolean;
  createdAt: string;
}

interface WhitelistFormState {
  phoneDigits: string;
  role: WhitelistRole;
  isActive: boolean;
}

const defaultForm: WhitelistFormState = {
  phoneDigits: '',
  role: 'Driver',
  isActive: true
};

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

export default function WhitelistPage() {
  const currentRole = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const isSuperAdmin = currentRole === 'SuperAdmin';

  const [items, setItems] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<WhitelistEntry | null>(null);
  const [form, setForm] = useState<WhitelistFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const isFormValid = form.phoneDigits.length === 9;

  const roleOptions = useMemo<WhitelistRole[]>(
    () => (isSuperAdmin ? ['Driver', 'Manager'] : ['Driver']),
    [isSuperAdmin]
  );

  const loadWhitelist = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<WhitelistEntry[]>('/userwhitelist');
      setItems(
        response.data.map((entry) => ({
          ...entry,
          role: parseApiRole(entry.role)
        }))
      );
    } catch {
      setError('Не вдалося завантажити whitelist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWhitelist();
  }, []);

  useEffect(() => {
    const onDashboardDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ entity?: string }>).detail;
      if (detail?.entity === 'presence') {
        return;
      }
      void loadWhitelist();
    };

    window.addEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
    return () => window.removeEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
  }, []);

  const clearModalErrors = () => {
    setPhoneError('');
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    clearModalErrors();
    setIsModalOpen(true);
  };

  const openEdit = (entry: WhitelistEntry) => {
    const normalizedDigits = entry.phoneNumber.startsWith('+380')
      ? entry.phoneNumber.slice(4)
      : entry.phoneNumber;

    setEditing(entry);
    setForm({
      phoneDigits: normalizedDigits,
      role: isSuperAdmin ? entry.role : 'Driver',
      isActive: entry.isActive
    });
    clearModalErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    clearModalErrors();
    setSaving(false);
  };

  const saveEntry = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    clearModalErrors();

    if (!isFormValid) {
      setPhoneError('Номер телефону має містити 9 цифр після +380.');
      setSaving(false);
      return;
    }

    const phoneNumber = `+380${form.phoneDigits}`;

    const duplicateEntry = items.find((item) => item.phoneNumber === phoneNumber);
    if (!editing && duplicateEntry) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

    if (editing && editing.phoneNumber !== phoneNumber && duplicateEntry) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }
    const payload: Partial<WhitelistEntry> = {
      phoneNumber,
      role: isSuperAdmin ? form.role : 'Driver',
      isActive: form.isActive
    };

    try {
      if (editing) {
        await api.put(`/userwhitelist/${editing.id}`, {
          id: editing.id,
          createdAt: editing.createdAt,
          ...payload
        });
      } else {
        await api.post('/userwhitelist', payload);
      }

      closeModal();
      await loadWhitelist();
    } catch (err) {
      const fieldErrors = getSubmitFieldErrors(err, 'Не вдалося зберегти запис whitelist.');
      if (fieldErrors.phone) {
        setPhoneError(fieldErrors.phone);
      } else {
        setFormError(fieldErrors.general ?? 'Не вдалося зберегти запис whitelist.');
      }
      setSaving(false);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await api.delete(`/userwhitelist/${id}`);
      await loadWhitelist();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити запис.'));
    }
  };

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <ShieldCheck className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Whitelist</h2>
            <p className="mt-1 text-sm text-slate-400">Список користувачів з доступом до системи.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="manager-accent-glow manager-primary-btn inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <Plus size={16} />
          Додати
        </button>
      </div>

      {error && (
        <div className="field-error-box mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className={managerTablePad}>ID</th>
                <th className={managerTablePad}>Статус</th>
                <th className={managerTablePad}>Роль</th>
                <th className={managerTablePad}>Номер телефону</th>
                <th className={`${managerTablePad} text-right`}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-white/10 text-slate-200">
                  <td className={managerTablePad}>{entry.id}</td>
                  <td className={managerTablePad}>
                    <span
                      className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                      data-status={entry.isActive ? 'online' : 'offline'}
                    >
                      <StatusPulseDot kind={entry.isActive ? 'online' : 'offline'} />
                      {entry.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td className={managerTablePad}>{getRoleLabel(entry.role)}</td>
                  <td className={`${managerTablePad} font-mono`}>{entry.phoneNumber}</td>
                  <td className={managerTablePad}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="Редагувати"
                        onClick={() => openEdit(entry)}
                        disabled={
                          (!isSuperAdmin && entry.role !== 'Driver') ||
                          (entry.id === currentUserId && !isSuperAdmin)
                        }
                        className="manager-icon-btn disabled:pointer-events-none"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Видалити"
                        onClick={() => setDeleteTargetId(entry.id)}
                        disabled={entry.role === 'SuperAdmin' || (!isSuperAdmin && entry.role !== 'Driver')}
                        className="manager-icon-btn manager-icon-btn--danger disabled:pointer-events-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
            <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{editing ? 'Редагувати запис' : 'Новий запис'}</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveEntry} className="space-y-4">
              {formError ? <div className="field-error-box">{formError}</div> : null}

              <FormSwitch
                label="Активний"
                checked={form.isActive}
                disabled={Boolean(isSuperAdmin && editing && editing.id === currentUserId)}
                description={
                  isSuperAdmin && editing && editing.id === currentUserId
                    ? 'Запис Адміністратора не можна деактивувати.'
                    : undefined
                }
                onChange={(next) => setForm((prev) => ({ ...prev, isActive: next }))}
              />

              {isSuperAdmin ? (
                editing?.role === 'SuperAdmin' ? (
                  <label className={fieldLabelClass}>
                    Роль
                    <select
                      value="SuperAdmin"
                      disabled
                      className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="SuperAdmin">{getRoleLabel('SuperAdmin')}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Роль Адміністратора не можна змінювати.</p>
                  </label>
                ) : (
                  <label className={fieldLabelClass}>
                    Роль
                    <select
                      value={form.role === 'SuperAdmin' ? 'Driver' : form.role}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, role: event.target.value as WhitelistRole }))
                      }
                      className="field-select mt-2"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              ) : (
                <label className={fieldLabelClass}>
                  Роль
                  <select
                    value="Driver"
                    disabled
                    className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="Driver">{getRoleLabel('Driver')}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                </label>
              )}

              <label className={fieldLabelClass}>
                Номер телефону
                <div className="manager-phone-field mt-2">
                  <span className="manager-phone-field__prefix">+380</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={form.phoneDigits}
                    onChange={(event) => {
                      setPhoneError('');
                      setForm((prev) => ({
                        ...prev,
                        phoneDigits: event.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 9)
                      }));
                    }}
                    className="manager-phone-field__input"
                    placeholder="XXXXXXXXX"
                  />
                </div>
                {phoneError ? <p className="field-error-hint">{phoneError}</p> : null}
              </label>

              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="manager-accent-glow manager-primary-btn relative mt-1 w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <span className={`inline-flex items-center gap-2 ${saving ? 'invisible' : ''}`}>
                  <Save size={16} />
                  Зберегти
                </span>
                {saving ? (
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

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Підтвердження видалення"
        message="Профіль користувача і запис у Whitelist будуть безповоротно видалені. Продовжити?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          const targetId = deleteTargetId;
          setDeleteTargetId(null);
          if (targetId !== null) {
            void deleteEntry(targetId);
          }
        }}
      />
    </section>
  );
}
