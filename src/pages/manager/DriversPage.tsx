import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPulseDot, { type StatusPulseKind } from '../../components/StatusPulseDot';

type DriverStatus = 'Offline' | 'Online' | 'InRide';

interface DriverProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  carMake?: string;
  carModel?: string;
  licensePlate?: string;
  role: 'Driver';
  driverStatus?: DriverStatus | number;
}

interface DriverFormState {
  phoneDigits: string;
  name: string;
  carMake: string;
  carModel: string;
  licensePlate: string;
  driverStatus: DriverStatus;
}

const defaultForm: DriverFormState = {
  phoneDigits: '',
  name: '',
  carMake: '',
  carModel: '',
  licensePlate: '',
  driverStatus: 'Offline'
};

const statusToCode: Record<DriverStatus, number> = {
  Offline: 0,
  Online: 1,
  InRide: 2
};

const statusLabels: Record<DriverStatus, string> = {
  Online: 'Онлайн',
  InRide: 'У поїздці',
  Offline: 'Офлайн'
};

function driverStatusToPulseKind(status: DriverStatus): StatusPulseKind {
  if (status === 'Online') return 'online';
  if (status === 'InRide') return 'inRide';
  return 'offline';
}

const licensePlateRegex = /^[A-Z]{2}\d{4}[A-Z]{2}$/;

function normalizeStatus(input: DriverStatus | number | undefined, index: number): DriverStatus {
  if (typeof input === 'string' && (input === 'Online' || input === 'InRide' || input === 'Offline')) {
    return input;
  }
  if (typeof input === 'number') {
    if (input === 1) return 'Online';
    if (input === 2) return 'InRide';
    return 'Offline';
  }

  // Mock fallback for now, until live statuses are integrated.
  return (['Online', 'InRide', 'Offline'] as DriverStatus[])[index % 3];
}

export default function DriversPage() {
  const [items, setItems] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverProfile | null>(null);
  const [form, setForm] = useState<DriverFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const isCreateMode = editing === null;
  const hasValidLicensePlate = form.licensePlate.trim().length === 0 || licensePlateRegex.test(form.licensePlate.trim());
  const isFormValid = form.phoneDigits.length === 9 && form.name.trim().length > 0 && hasValidLicensePlate;

  const loadDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DriverProfile[]>('/drivers');
      setItems(response.data);
    } catch {
      setError('Не вдалося завантажити водіїв.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: DriverProfile, index: number) => {
    setEditing(item);
    setForm({
      phoneDigits: item.phoneNumber.startsWith('+380') ? item.phoneNumber.slice(4) : item.phoneNumber,
      name: item.name,
      carMake: item.carMake ?? '',
      carModel: item.carModel ?? '',
      licensePlate: item.licensePlate ?? '',
      driverStatus: normalizeStatus(item.driverStatus, index)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    setSaving(false);
  };

  const saveDriver = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!isFormValid) {
      setError('Номер телефону має містити 9 цифр після +380.');
      setSaving(false);
      return;
    }

    const phoneNumber = `+380${form.phoneDigits}`;

    const payload = {
      phoneNumber,
      name: form.name,
      carMake: form.carMake || null,
      carModel: form.carModel || null,
      licensePlate: form.licensePlate || null,
      role: 'Driver',
      driverStatus: statusToCode[isCreateMode ? 'Offline' : form.driverStatus]
    };

    try {
      if (editing) {
        await api.put(`/drivers/${editing.id}`, { ...editing, ...payload });
        setItems((prev) =>
          prev.map((item) =>
            item.id === editing.id
              ? {
                  ...item,
                  phoneNumber: payload.phoneNumber,
                  name: payload.name,
                  carMake: form.carMake || undefined,
                  carModel: form.carModel || undefined,
                  licensePlate: form.licensePlate || undefined,
                  driverStatus: form.driverStatus,
                }
              : item
          )
        );
      } else {
        const response = await api.post<DriverProfile>('/drivers', payload);
        setItems((prev) => [...prev, response.data]);
      }

      closeModal();
    } catch {
      setError('Не вдалося зберегти водія.');
      setSaving(false);
    }
  };

  const deleteDriver = async (id: number) => {
    try {
      await api.delete(`/drivers/${id}`);
      await loadDrivers();
    } catch {
      setError('Не вдалося видалити водія.');
    }
  };

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Водії</h2>
          <p className="mt-1 text-sm text-gray-400">Список водіїв.</p>
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
                <th className="px-3 py-2">Whitelist ID</th>
                <th className="px-3 py-2">Телефон</th>
                <th className="px-3 py-2">Ім'я</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const status = normalizeStatus(item.driverStatus, index);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 text-gray-200">
                    <td className="px-3 py-2">{item.id}</td>
                    <td className="px-3 py-2">{item.userId}</td>
                    <td className="px-3 py-2">{item.phoneNumber}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 px-2 py-1 text-xs">
                        <StatusPulseDot kind={driverStatusToPulseKind(status)} />
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item, index)}
                          className="rounded-md border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(item.id)}
                          className="rounded-md border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing ? 'Редагувати водія' : 'Новий водій'}</h3>
              <button type="button" onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-800">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveDriver} className="space-y-3">
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

              <label className="block text-sm text-gray-300">
                Ім'я
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 field-input"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-gray-300">
                  Марка авто
                  <input
                    value={form.carMake}
                    onChange={(event) => setForm((prev) => ({ ...prev, carMake: event.target.value }))}
                    className="mt-1 field-input"
                  />
                </label>
                <label className="block text-sm text-gray-300">
                  Модель авто
                  <input
                    value={form.carModel}
                    onChange={(event) => setForm((prev) => ({ ...prev, carModel: event.target.value }))}
                    className="mt-1 field-input"
                  />
                </label>
              </div>

              <label className="block text-sm text-gray-300">
                Номер авто
                <input
                  value={form.licensePlate}
                  onChange={(event) => {
                    const v = event.target.value
                      .replace(/[^A-Za-z0-9]/g, '')
                      .toUpperCase()
                      .slice(0, 8);
                    setForm((prev) => ({ ...prev, licensePlate: v }));
                  }}
                  maxLength={8}
                  inputMode="text"
                  className="mt-1 field-input"
                  placeholder="BC9193OV"
                />
                {!hasValidLicensePlate && (
                  <p className="mt-1 text-xs text-red-300">
                    Формат латиницею: 2 літери, 4 цифри, 2 літери (наприклад BC9193OV)
                  </p>
                )}
              </label>

              {!isCreateMode && (
                <label className="block text-sm text-gray-300">
                  Статус
                  <select
                    value={form.driverStatus}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, driverStatus: event.target.value as DriverStatus }))
                    }
                    className="field-select mt-1"
                  >
                    <option value="Offline">Офлайн</option>
                    <option value="Online">Онлайн</option>
                    <option value="InRide">У поїздці</option>
                  </select>
                </label>
              )}

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
        message="Ви впевнені, що хочете видалити водія?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          const targetId = deleteTargetId;
          setDeleteTargetId(null);
          if (targetId !== null) {
            void deleteDriver(targetId);
          }
        }}
      />
    </section>
  );
}
