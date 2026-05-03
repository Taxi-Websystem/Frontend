import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import type { AppRole } from '../../utils/auth';
import { getRoleLabel, parseApiRole } from '../../utils/roles';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import StatusPulseDot from '../../components/StatusPulseDot';

interface ManagerProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  role: AppRole;
  status: 'Online' | 'Offline';
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

export default function ManagersPage() {
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const canManage = role === 'SuperAdmin';
  const actionsLockedForViewer = role === 'Manager';

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
  const phoneOk = form.phoneDigits.length === 9;
  const isFormValid = useMemo(() => {
    if (isCreateMode) {
      return phoneOk && form.name.trim().length > 0;
    }
    return form.name.trim().length > 0 && phoneOk;
  }, [form, isCreateMode, phoneOk]);

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

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: ManagerProfile) => {
    setEditing(item);
    setForm({
      phoneDigits: item.phoneNumber.startsWith('+380') ? item.phoneNumber.slice(4) : item.phoneNumber,
      name: item.name,
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
          phoneNumber: string;
          role?: 'Manager' | 'Driver';
        } = {
          name: form.name.trim(),
          phoneNumber: `+380${form.phoneDigits}`
        };
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
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Менеджери</h2>
          <p className="mt-1 text-sm text-gray-400">Список менеджерів та адміністраторів.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (canManage) openCreate();
          }}
          disabled={!canManage}
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        >
          <Plus size={16} />
          Додати
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Завантаження...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
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
                const canEditRow = item.id > 0 && (!isSuperAdminRow || isOwnRecord);
                const canDeleteRow = item.id > 0 && !isSuperAdminRow;

                return (
                  <tr key={`${item.userId}-${item.id}`} className="border-b border-gray-800/60 text-gray-200">
                    <td className="px-3 py-2">{item.userId}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 px-2 py-1 text-xs">
                        <StatusPulseDot kind={item.status === 'Online' ? 'online' : 'offline'} />
                        {item.status === 'Online' ? 'Онлайн' : 'Офлайн'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{getRoleLabel(item.role)}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.phoneNumber}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          disabled={actionsLockedForViewer || !canEditRow}
                          className="rounded-md border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteRemoveFromWhitelist(false);
                            setDeleteTargetId(item.id);
                          }}
                          disabled={actionsLockedForViewer || !canDeleteRow}
                          className="rounded-md border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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

      {canManage && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editing ? 'Редагувати менеджера' : 'Новий менеджер'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveManager} className="space-y-3">
              {!isCreateMode && editing && (
                <div className="block text-sm text-gray-300">
                  Роль
                  {editing.role === 'SuperAdmin' ? (
                    <>
                      <select
                        value="SuperAdmin"
                        disabled
                        className="field-select mt-1 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="SuperAdmin">{getRoleLabel('SuperAdmin')}</option>
                      </select>
                      <p className="mt-1 text-xs text-yellow-400">Роль Адміністратора можна тільки передати.</p>
                    </>
                  ) : editing.role === 'Driver' ? (
                    <>
                      <select
                        value="Driver"
                        disabled
                        className="field-select mt-1 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="Driver">{getRoleLabel('Driver')}</option>
                      </select>
                      <p className="mt-1 text-xs text-yellow-400">Роль може змінювати лише Адміністратор.</p>
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
                      className="field-select mt-1"
                    >
                      <option value="Manager">{getRoleLabel('Manager')}</option>
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                    </select>
                  ) : (
                    <>
                      <select
                        value={editing.role}
                        disabled
                        className="field-select mt-1 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value={editing.role}>{getRoleLabel(editing.role)}</option>
                      </select>
                      <p className="mt-1 text-xs text-yellow-400">Роль може змінювати лише Адміністратор.</p>
                    </>
                  )}
                </div>
              )}

              <label className="block text-sm text-gray-300">
                Ім'я
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 field-input"
                  placeholder="Олексій"
                />
                <p className="mt-1 text-xs text-yellow-400">Українською (кирилиця)</p>
              </label>

              <label className="block text-sm text-gray-300">
                Номер телефону
                <div className="phone-field-wrap mt-1 rounded-lg">
                  <span className="border-r border-gray-700 px-3 py-2 text-sm text-gray-300">+380</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={form.phoneDigits}
                    disabled={Boolean(
                      editing && editing.role === 'SuperAdmin' && editing.userId !== currentUserId
                    )}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneDigits: event.target.value.replace(/\D/g, '').slice(0, 9)
                      }))
                    }
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-gray-500"
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="w-full rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-950 transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </form>
          </div>
        </div>
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
