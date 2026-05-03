import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../api/axios';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import type { AppRole } from '../../utils/auth';
import { getRoleLabel } from '../../utils/roles';
import ConfirmDialog from '../../components/ConfirmDialog';

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

export default function WhitelistPage() {
  const currentRole = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const isSuperAdmin = currentRole === 'SuperAdmin';

  const [items, setItems] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setItems(response.data);
    } catch {
      setError('Не вдалося завантажити whitelist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWhitelist();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    setSaving(false);
  };

  const saveEntry = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!isFormValid) {
      setError('Номер телефону має містити 9 цифр після +380.');
      setSaving(false);
      return;
    }

    const phoneNumber = `+380${form.phoneDigits}`;
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
    } catch {
      setError('Не вдалося зберегти запис whitelist.');
      setSaving(false);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await api.delete(`/userwhitelist/${id}`);
      await loadWhitelist();
    } catch {
      setError('Не вдалося видалити запис.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Whitelist</h2>
          <p className="mt-1 text-sm text-gray-400">Керування доступом користувачів за номером телефону.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-gray-950 transition hover:brightness-110"
        >
          <Plus size={16} />
          Додати
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-400">Завантаження...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Телефон</th>
                <th className="px-3 py-2">Роль</th>
                <th className="px-3 py-2">Активний</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800/60 text-gray-200">
                  <td className="px-3 py-2">{entry.id}</td>
                  <td className="px-3 py-2">{entry.phoneNumber}</td>
                  <td className="px-3 py-2">{getRoleLabel(entry.role)}</td>
                  <td className="px-3 py-2">{entry.isActive ? 'Так' : 'Ні'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        disabled={entry.id === currentUserId || (!isSuperAdmin && entry.role !== 'Driver')}
                        className="rounded-md border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil size={14} />
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(entry.id)}
                          disabled={entry.role === 'SuperAdmin'}
                          className="rounded-md border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Редагувати запис' : 'Новий запис'}</h3>
              <button type="button" onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveEntry} className="space-y-3">
              <label className="block text-sm text-gray-300">
                Телефон
                <div className="phone-field-wrap mt-1 rounded-lg">
                  <span className="border-r border-gray-700 px-3 py-2 text-sm text-gray-300">+380</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={form.phoneDigits}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneDigits: event.target.value.replace(/\D/g, '').slice(0, 9)
                      }))
                    }
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </label>

              {isSuperAdmin ? (
                <label className="block text-sm text-gray-300">
                  Роль
                  <select
                    value={form.role}
                    disabled={Boolean(editing && (editing.id === currentUserId || editing.role === 'SuperAdmin'))}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, role: event.target.value as WhitelistRole }))
                    }
                    className="field-select mt-1 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                  {editing && (editing.id === currentUserId || editing.role === 'SuperAdmin') && (
                    <p className="mt-1 text-xs text-yellow-500">
                      Роль цього запису змінювати не можна.
                    </p>
                  )}
                </label>
              ) : (
                <div className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-300">
                  Роль: <span className="font-medium text-white">{getRoleLabel('Driver')}</span>
                </div>
              )}

              <label className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-300">
                Активний
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-300 ease-in-out ${
                    form.isActive ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${
                      form.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>

              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="w-full rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-gray-950 transition hover:brightness-110 disabled:opacity-60"
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
        message="Ви впевнені, що хочете видалити цей запис?"
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
