import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import StatusPulseDot, { type StatusPulseKind } from '../../components/StatusPulseDot';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa } from '../../utils/carFields';
import { LICENSE_PLATE_REGEX } from '../../utils/licensePlate';
import { getRoleLabel } from '../../utils/roles';

type UserStatus = 'Offline' | 'Online' | 'InRide';

interface DriverProfile {
  id: number;
  userId: number;
  phoneNumber: string;
  name: string;
  carMake?: string;
  carModel?: string;
  carColor?: string;
  licensePlate?: string;
  role: 'Driver';
  userStatus?: UserStatus | number;
}

interface DriverFormState {
  phoneDigits: string;
  name: string;
  carMake: string;
  carModel: string;
  carColor: string;
  licensePlate: string;
  userStatus: UserStatus;
  profileRole: 'Driver' | 'Manager';
}

const defaultForm: DriverFormState = {
  phoneDigits: '',
  name: '',
  carMake: '',
  carModel: '',
  carColor: '',
  licensePlate: '',
  userStatus: 'Offline',
  profileRole: 'Driver'
};

const statusToCode: Record<UserStatus, number> = {
  Offline: 0,
  Online: 1,
  InRide: 2
};

const statusLabels: Record<UserStatus, string> = {
  Online: 'Онлайн',
  InRide: 'У поїздці',
  Offline: 'Офлайн'
};

function userStatusToPulseKind(status: UserStatus): StatusPulseKind {
  if (status === 'Online') return 'online';
  if (status === 'InRide') return 'inRide';
  return 'offline';
}

function normalizeStatus(input: UserStatus | number | undefined, index: number): UserStatus {
  if (typeof input === 'string' && (input === 'Online' || input === 'InRide' || input === 'Offline')) {
    return input;
  }
  if (typeof input === 'number') {
    if (input === 1) return 'Online';
    if (input === 2) return 'InRide';
    return 'Offline';
  }

  return (['Online', 'InRide', 'Offline'] as UserStatus[])[index % 3];
}

export default function DriversPage() {
  const viewerRole = getCurrentRole();
  const canPromoteToManager = viewerRole === 'SuperAdmin';

  const [items, setItems] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverProfile | null>(null);
  const [form, setForm] = useState<DriverFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteRemoveFromWhitelist, setDeleteRemoveFromWhitelist] = useState(false);
  const isCreateMode = editing === null;
  const plateOk = LICENSE_PLATE_REGEX.test(form.licensePlate.trim());
  const isFormValid =
    form.phoneDigits.length === 9 &&
    form.name.trim().length > 0 &&
    form.carMake.trim().length > 0 &&
    form.carModel.trim().length > 0 &&
    form.carColor.trim().length > 0 &&
    form.licensePlate.trim().length === 8 &&
    plateOk;

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
      carColor: item.carColor ?? '',
      licensePlate: item.licensePlate ?? '',
      userStatus: normalizeStatus(item.userStatus, index),
      profileRole: 'Driver'
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
      carColor: form.carColor || null,
      licensePlate: form.licensePlate || null,
      role: (isCreateMode ? 'Driver' : form.profileRole) as 'Driver' | 'Manager',
      userStatus: statusToCode[isCreateMode ? 'Offline' : form.userStatus]
    };

    try {
      if (editing) {
        await api.put(`/drivers/${editing.id}`, { ...editing, ...payload });
      } else {
        await api.post<DriverProfile>('/drivers', payload);
      }

      closeModal();
      await loadDrivers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося зберегти водія.'));
      setSaving(false);
    }
  };

  const deleteDriver = async (id: number, removeFromWhitelist: boolean) => {
    try {
      await api.delete(`/drivers/${id}`, { params: { removeFromWhitelist } });
      await loadDrivers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити водія.'));
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
          <h2 className="text-lg font-semibold text-white">Водії</h2>
          <p className="mt-1 text-sm text-gray-400">Список водіїв.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-medium text-gray-950 transition hover:brightness-110"
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
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Ім'я</th>
                <th className="px-3 py-2">Номер телефону</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const status = normalizeStatus(item.userStatus, index);
                return (
                  <tr key={item.id} className="border-b border-gray-800/60 text-gray-200">
                    <td className="px-3 py-2">{item.userId}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 px-2 py-1 text-xs">
                        <StatusPulseDot kind={userStatusToPulseKind(status)} />
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.phoneNumber}</td>
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
                          onClick={() => {
                            setDeleteRemoveFromWhitelist(false);
                            setDeleteTargetId(item.id);
                          }}
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
              {!isCreateMode &&
                (canPromoteToManager ? (
                  <label className="block text-sm text-gray-300">
                    Роль
                    <select
                      value={form.profileRole}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          profileRole: event.target.value as 'Driver' | 'Manager'
                        }))
                      }
                      className="field-select mt-1"
                    >
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                      <option value="Manager">{getRoleLabel('Manager')}</option>
                    </select>
                  </label>
                ) : (
                  <label className="block text-sm text-gray-300">
                    Роль
                    <select
                      value="Driver"
                      disabled
                      className="field-select mt-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                    </select>
                    <p className="mt-1 text-xs text-yellow-400">Роль може змінювати лише Адміністратор.</p>
                  </label>
                ))}

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

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-gray-300">
                  Марка авто
                  <input
                    value={form.carMake}
                    lang="en"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carMake: sanitizeCarBrandOrModel(event.target.value),
                      }))
                    }
                    className="mt-1 field-input"
                    placeholder="Toyota"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Англійською (латиниця)</p>
                </label>
                <label className="block text-sm text-gray-300">
                  Модель авто
                  <input
                    value={form.carModel}
                    lang="en"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carModel: sanitizeCarBrandOrModel(event.target.value),
                      }))
                    }
                    className="mt-1 field-input"
                    placeholder="Camry"
                  />
                  <p className="mt-1 text-xs text-yellow-400">Англійською (латиниця)</p>
                </label>
              </div>

              <label className="block text-sm text-gray-300">
                Колір авто
                <input
                  value={form.carColor}
                  lang="uk"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      carColor: sanitizeCarColorUa(event.target.value),
                    }))
                  }
                  className="mt-1 field-input"
                  placeholder="Чорний"
                />
                <p className="mt-1 text-xs text-yellow-400">Українською (кирилиця)</p>
              </label>

              <label className="block text-sm text-gray-300">
                Номер авто
                <input
                  value={form.licensePlate}
                  onChange={(event) => {
                    const v = event.target.value
                      .replace(/[^\d\p{L}]/gu, '')
                      .toLocaleUpperCase('uk-UA')
                      .slice(0, 8);
                    setForm((prev) => ({ ...prev, licensePlate: v }));
                  }}
                  maxLength={8}
                  inputMode="text"
                  className="mt-1 field-input"
                  placeholder="BC9193OB"
                />
                <p className="mt-1 text-xs text-yellow-400">Формат: 2 літери, 4 цифри, 2 літери</p>
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
            ? 'Профіль водія і запис у Whitelist будуть безповоротно видалені. Продовжити?'
            : 'Профіль водія буде безповоротно видалений. Запис у Whitelist залишиться. Продовжити?'
        }
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          const targetId = deleteTargetId;
          const alsoWhitelist = deleteRemoveFromWhitelist;
          closeDeleteDialog();
          if (targetId !== null) {
            void deleteDriver(targetId, alsoWhitelist);
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
