import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import type { AppRole } from '../../utils/auth';
import { getRoleLabel, parseApiRole } from '../../utils/roles';
import { DIGITS_ONLY_REGEX } from '../../utils/regex';
import { sanitizeNameUa } from '../../utils/nameFields';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import ModalPortal from '../../components/ModalPortal';
import StatusPulseDot from '../../components/StatusPulseDot';
import { getUserStatusLabel, type UserStatus } from '../../utils/userStatus';

interface ManagerProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  role: AppRole;
  status: Exclude<UserStatus, 'InRide'>;
}

interface FormState {
  phoneDigits: string;
  name: string;
  editRole: 'Manager' | 'Driver';
}

const defaultForm: FormState = {
  phoneDigits: '',
  name: '',
  editRole: 'Manager'
};

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

export default function ManagersPage() {
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const canManage = role === 'SuperAdmin';
  const canEditSelfAsManager = role === 'Manager';

  const [items, setItems] = useState<ManagerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerProfile | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteRemoveFromWhitelist, setDeleteRemoveFromWhitelist] = useState(false);

  const isCreateMode = editing === null;
  const isEditingOwnProfile = Boolean(editing && currentUserId !== null && editing.userId === currentUserId);
  const phoneRequiredForSubmit = isCreateMode || canManage;
  const phoneOk = form.phoneDigits.length === 9;
  const isFormValid = useMemo(() => {
    return form.name.trim().length > 0 && (!phoneRequiredForSubmit || phoneOk);
  }, [form, phoneRequiredForSubmit, phoneOk]);

  const loadManagers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ManagerProfile[]>('/managers');
      setItems(
        response.data.map((row) => ({
          ...row,
          role: parseApiRole(row.role)
        }))
      );
    } catch {
      setError('Не вдалося завантажити список менеджерів.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadManagers();
  }, []);

  useEffect(() => {
    const onDashboardDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ entity?: string }>).detail;
      if (detail?.entity === 'presence') {
        return;
      }
      void loadManagers();
    };

    window.addEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
    return () => window.removeEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
  }, []);

  useEffect(() => {
    const onPresenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: number; status: UserStatus }>).detail;
      if (!detail) return;

      setItems((prev) =>
        prev.map((item) =>
          item.userId === detail.userId && detail.status !== 'InRide'
            ? { ...item, status: detail.status }
            : item
        )
      );
    };

    window.addEventListener('presence:changed', onPresenceChanged as EventListener);
    return () => window.removeEventListener('presence:changed', onPresenceChanged as EventListener);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: ManagerProfile) => {
    setEditing(item);
    setForm({
      phoneDigits: item.phoneNumber.startsWith('+380') ? item.phoneNumber.slice(4) : item.phoneNumber,
      name: sanitizeNameUa(item.name),
      editRole: 'Manager'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    setSaving(false);
  };

  const saveManager = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSaving(true);
    setError('');

    try {
      if (editing) {
        const payload: {
          name: string;
          phoneNumber?: string;
          role?: 'Manager' | 'Driver';
        } = {
          name: form.name.trim()
        };
        if (phoneRequiredForSubmit) {
          payload.phoneNumber = `+380${form.phoneDigits}`;
        }
        const canDemoteOthers =
          editing.role === 'Manager' && currentUserId !== undefined && editing.userId !== currentUserId;
        if (canDemoteOthers) {
          payload.role = form.editRole;
        }
        await api.put(`/managers/${editing.id}`, payload);
      } else {
        const phoneNumber = `+380${form.phoneDigits}`;
        await api.post<ManagerProfile>('/managers', {
          phoneNumber,
          name: form.name.trim()
        });
      }

      closeModal();
      await loadManagers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося зберегти менеджера.'));
      setSaving(false);
    }
  };

  const deleteManager = async (id: number, removeFromWhitelist: boolean) => {
    try {
      await api.delete(`/managers/${id}`, { params: { removeFromWhitelist } });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити менеджера.'));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteRemoveFromWhitelist(false);
  };

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Менеджери</h2>
          <p className="mt-1 text-sm text-slate-400">Список менеджерів та адміністраторів.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (canManage) openCreate();
          }}
          disabled={!canManage}
          className="manager-accent-glow manager-primary-btn inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <Plus size={16} />
          Додати
        </button>
      </div>

      {error && (
        <div className="field-error-box mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Роль</th>
                <th className="px-3 py-2">Ім'я</th>
                <th className="px-3 py-2">Номер телефону</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSuperAdminRow = item.role === 'SuperAdmin';
                const isOwnRecord = currentUserId === item.userId;
                const canEditRow =
                  item.id > 0 &&
                  (canManage ? (!isSuperAdminRow || isOwnRecord) : canEditSelfAsManager && isOwnRecord);
                const canDeleteRow = item.id > 0 && !isSuperAdminRow;
                const statusKind = item.status === 'Online' ? 'online' : 'offline';

                return (
                  <tr key={`${item.userId}-${item.id}`} className="border-b border-white/10 text-slate-200">
                    <td className="px-3 py-2">{item.userId}</td>
                    <td className="px-3 py-2">
                      <span
                        className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                        data-status={statusKind}
                      >
                        <StatusPulseDot kind={statusKind} />
                        {getUserStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{getRoleLabel(item.role)}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 font-mono">{item.phoneNumber}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Редагувати"
                          onClick={() => openEdit(item)}
                          disabled={!canEditRow}
                          className="manager-icon-btn disabled:pointer-events-none"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Видалити"
                          onClick={() => {
                            setDeleteRemoveFromWhitelist(false);
                            setDeleteTargetId(item.id);
                          }}
                          disabled={!canManage || !canDeleteRow}
                          className="manager-icon-btn manager-icon-btn--danger disabled:pointer-events-none"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (canManage || isEditingOwnProfile) && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
            <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {editing ? 'Редагувати менеджера' : 'Новий менеджер'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveManager} className="space-y-4">
              {!isCreateMode && editing && (
                <div className={fieldLabelClass}>
                  Роль
                  {editing.role === 'SuperAdmin' ? (
                    <>
                      <select
                        value="SuperAdmin"
                        disabled
                        className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="SuperAdmin">{getRoleLabel('SuperAdmin')}</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-400">Роль Адміністратора можна тільки передати.</p>
                    </>
                  ) : editing.role === 'Driver' ? (
                    <>
                      <select
                        value="Driver"
                        disabled
                        className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="Driver">{getRoleLabel('Driver')}</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                    </>
                  ) : editing.role === 'Manager' &&
                    currentUserId !== undefined &&
                    editing.userId !== currentUserId ? (
                    <select
                      value={form.editRole}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          editRole: event.target.value as 'Manager' | 'Driver'
                        }))
                      }
                      className="field-select mt-2"
                    >
                      <option value="Manager">{getRoleLabel('Manager')}</option>
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                    </select>
                  ) : (
                    <>
                      <select
                        value={editing.role}
                        disabled
                        className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value={editing.role}>{getRoleLabel(editing.role)}</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                    </>
                  )}
                </div>
              )}

              <label className={fieldLabelClass}>
                Ім'я
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: sanitizeNameUa(event.target.value)
                    }))
                  }
                  className="mt-2 field-input"
                  placeholder="Олексій"
                />
                <p className="mt-1 text-xs text-slate-400">Українською (кирилиця)</p>
              </label>

              <label className={fieldLabelClass}>
                Номер телефону
                <div
                  className={`manager-phone-field mt-2 ${
                    !phoneRequiredForSubmit ||
                    Boolean(editing && editing.role === 'SuperAdmin' && editing.userId !== currentUserId)
                      ? 'manager-phone-field--dimmed'
                      : ''
                  }`}
                >
                  <span className="manager-phone-field__prefix">+380</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={form.phoneDigits}
                    disabled={
                      !phoneRequiredForSubmit ||
                      Boolean(editing && editing.role === 'SuperAdmin' && editing.userId !== currentUserId)
                    }
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneDigits: event.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 9)
                      }))
                    }
                    className="manager-phone-field__input"
                    placeholder="XXXXXXXXX"
                  />
                </div>
                {isEditingOwnProfile && role === 'Manager' ? (
                  <p className="mt-1 text-xs text-slate-400">Номер телефону може змінювати лише Адміністратор.</p>
                ) : null}
              </label>

              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="manager-accent-glow manager-primary-btn relative mt-1 h-[48px] w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
        message={
          deleteRemoveFromWhitelist
            ? 'Профіль менеджера і запис у Whitelist будуть безповоротно видалені. Продовжити?'
            : 'Профіль менеджера буде безповоротно видалений. Запис у Whitelist залишиться. Продовжити?'
        }
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          const targetId = deleteTargetId;
          const alsoWhitelist = deleteRemoveFromWhitelist;
          closeDeleteDialog();
          if (targetId !== null) {
            void deleteManager(targetId, alsoWhitelist);
          }
        }}
      >
        <FormSwitch
          label="Також видалити з Whitelist"
          checked={deleteRemoveFromWhitelist}
          onChange={setDeleteRemoveFromWhitelist}
        />
      </ConfirmDialog>
    </section>
  );
}
