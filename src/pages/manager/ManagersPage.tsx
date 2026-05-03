import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';

interface ManagerProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  carMake?: string;
  carModel?: string;
  licensePlate?: string;
  role: 'Manager';
}

interface FormState {
  userId: string;
  phoneNumber: string;
  name: string;
}

const defaultForm: FormState = {
  userId: '',
  phoneNumber: '',
  name: ''
};

export default function ManagersPage() {
  const role = getCurrentRole();
  const canManage = role === 'SuperAdmin';

  const [items, setItems] = useState<ManagerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerProfile | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadManagers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<ManagerProfile[]>('/managers');
      setItems(response.data);
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
      userId: String(item.userId),
      phoneNumber: item.phoneNumber,
      name: item.name
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
    setSaving(true);

    const payload = {
      userId: Number(form.userId),
      phoneNumber: form.phoneNumber,
      name: form.name,
      role: 'Manager'
    };

    try {
      if (editing) {
        await api.put(`/managers/${editing.id}`, { ...editing, ...payload });
      } else {
        await api.post('/managers', payload);
      }

      closeModal();
      await loadManagers();
    } catch {
      setError('Не вдалося зберегти менеджера.');
      setSaving(false);
    }
  };

  const deleteManager = async (id: number) => {
    if (!window.confirm('Видалити менеджера?')) return;

    try {
      await api.delete(`/managers/${id}`);
      await loadManagers();
    } catch {
      setError('Не вдалося видалити менеджера.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Менеджери</h2>
          <p className="mt-1 text-sm text-gray-400">Список менеджерів та їх профілі.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-950 transition hover:bg-yellow-300"
          >
            <Plus size={16} />
            Додати
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-400">Завантаження...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
                <th className="px-3 py-2">Profile ID</th>
                <th className="px-3 py-2">Whitelist ID</th>
                <th className="px-3 py-2">Телефон</th>
                <th className="px-3 py-2">Ім'я</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-800/60 text-gray-200">
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.userId}</td>
                  <td className="px-3 py-2">{item.phoneNumber}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-md border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteManager(item.id)}
                            className="rounded-md border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Редагувати менеджера' : 'Новий менеджер'}</h3>
              <button type="button" onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveManager} className="space-y-3">
              <label className="block text-sm text-gray-300">
                Whitelist ID
                <input
                  required
                  value={form.userId}
                  onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/70"
                />
              </label>
              <label className="block text-sm text-gray-300">
                Телефон
                <input
                  required
                  value={form.phoneNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/70"
                />
              </label>
              <label className="block text-sm text-gray-300">
                Ім'я
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/70"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-950 transition hover:bg-yellow-300 disabled:opacity-60"
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
