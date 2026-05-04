import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { BarChart2, Loader2, Pencil, Plus, Star, Trash2, UserRoundCheck, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import ModalPortal from '../../components/ModalPortal';
import StatusPulseDot, { type StatusPulseKind } from '../../components/StatusPulseDot';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa } from '../../utils/carFields';
import { formatLicensePlateInput, LICENSE_PLATE_REGEX } from '../../utils/licensePlate';
import { sanitizeNameUa } from '../../utils/nameFields';
import {
  DIGITS_ONLY_REGEX,
  RATING_1_TO_5_DECIMAL_REGEX,
  RATING_ALLOWED_CHARS_REGEX,
  RATING_DUPLICATED_SEPARATOR_REGEX,
  RATING_EDITABLE_REGEX
} from '../../utils/regex';
import { getRoleLabel } from '../../utils/roles';

type UserStatus = 'Offline' | 'Online' | 'InRide';

interface DriverListItem {
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
  tripCount: number;
  averageRating: number | null;
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
  tripCountInput: string;
  averageRatingInput: string;
}

const defaultForm: DriverFormState = {
  phoneDigits: '',
  name: '',
  carMake: '',
  carModel: '',
  carColor: '',
  licensePlate: '',
  userStatus: 'Offline',
  profileRole: 'Driver',
  tripCountInput: '0',
  averageRatingInput: ''
};

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

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

function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2);
}

function sanitizeRatingInput(nextValue: string, currentValue: string): string {
  const sanitized = nextValue
    .replace(RATING_ALLOWED_CHARS_REGEX, '')
    .replace(RATING_DUPLICATED_SEPARATOR_REGEX, '$1$2')
    .slice(0, 4);

  if (!sanitized) return '';
  if (!RATING_EDITABLE_REGEX.test(sanitized)) return currentValue;

  const normalized = sanitized.replace(',', '.');
  const forNumber = normalized.endsWith('.') ? normalized.slice(0, -1) : normalized;
  const numeric = Number(forNumber);
  if (!Number.isNaN(numeric) && numeric > 5) return currentValue;

  return sanitized;
}

export default function DriversPage() {
  const viewerRole = getCurrentRole();
  const canPromoteToManager = viewerRole === 'SuperAdmin';

  const [items, setItems] = useState<DriverListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverListItem | null>(null);
  const [form, setForm] = useState<DriverFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteRemoveFromWhitelist, setDeleteRemoveFromWhitelist] = useState(false);
  const isCreateMode = editing === null;
  const plateOk = LICENSE_PLATE_REGEX.test(form.licensePlate.trim());
  const ratingRaw = form.averageRatingInput.trim();
  const isAverageRatingValid =
    !canPromoteToManager ||
    ratingRaw.length === 0 ||
    RATING_1_TO_5_DECIMAL_REGEX.test(ratingRaw);
  const isFormValid =
    form.phoneDigits.length === 9 &&
    form.name.trim().length > 0 &&
    form.carMake.trim().length > 0 &&
    form.carModel.trim().length > 0 &&
    form.carColor.trim().length > 0 &&
    form.licensePlate.trim().length === 8 &&
    plateOk &&
    isAverageRatingValid;

  const stats = useMemo(() => {
    let active = 0;
    let totalTrips = 0;
    const ratings: number[] = [];
    items.forEach((item, index) => {
      const st = normalizeStatus(item.userStatus, index);
      if (st === 'Online' || st === 'InRide') active += 1;
      totalTrips += item.tripCount ?? 0;
      if (item.averageRating != null && typeof item.averageRating === 'number') {
        ratings.push(item.averageRating);
      }
    });
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : null;
    return { active, totalTrips, avgRating };
  }, [items]);

  const loadDrivers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DriverListItem[]>('/drivers');
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
    setForm({
      ...defaultForm,
      tripCountInput: canPromoteToManager ? '0' : '0',
      averageRatingInput: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: DriverListItem, index: number) => {
    setEditing(item);
    setForm({
      phoneDigits: item.phoneNumber.startsWith('+380') ? item.phoneNumber.slice(4) : item.phoneNumber,
      name: sanitizeNameUa(item.name),
      carMake: item.carMake ?? '',
      carModel: item.carModel ?? '',
      carColor: sanitizeCarColorUa(item.carColor ?? ''),
      licensePlate: formatLicensePlateInput(item.licensePlate ?? ''),
      userStatus: normalizeStatus(item.userStatus, index),
      profileRole: 'Driver',
      tripCountInput: String(item.tripCount ?? 0),
      averageRatingInput: item.averageRating != null ? String(item.averageRating) : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    setSaving(false);
  };

  const parseDashboardInputs = (): { tripCount: number; averageRating: number | null } | null => {
    const tripCount = Math.max(0, parseInt(form.tripCountInput.replace(DIGITS_ONLY_REGEX, ''), 10) || 0);
    if (!canPromoteToManager) return { tripCount: 0, averageRating: null };
    const raw = form.averageRatingInput.trim();
    if (!raw) return { tripCount, averageRating: null };
    const n = Number(raw.replace(',', '.'));
    if (Number.isNaN(n)) {
      setError('Некоректне значення середнього рейтингу.');
      return null;
    }
    if (!RATING_1_TO_5_DECIMAL_REGEX.test(raw) || n < 1 || n > 5) {
      setError('Рейтинг має бути від 1 до 5 або порожнім.');
      return null;
    }
    return { tripCount, averageRating: n };
  };

  const saveDriver = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!isFormValid) {
      if (form.phoneDigits.length !== 9) {
        setError('Номер телефону має містити 9 цифр після +380.');
      }
      setSaving(false);
      return;
    }

    const parsedStats = parseDashboardInputs();
    if (!parsedStats) {
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
      userStatus: statusToCode[isCreateMode ? 'Offline' : form.userStatus],
      tripCount: parsedStats.tripCount,
      averageRating: parsedStats.averageRating
    };

    try {
      if (editing) {
        await api.put(`/drivers/${editing.id}`, { ...editing, ...payload });
      } else {
        await api.post<DriverListItem>('/drivers', {
          phoneNumber: payload.phoneNumber,
          name: payload.name,
          carMake: payload.carMake,
          carModel: payload.carModel,
          carColor: payload.carColor,
          licensePlate: payload.licensePlate,
          role: 'Driver',
          userStatus: 0,
          tripCount: canPromoteToManager ? parsedStats.tripCount : 0,
          averageRating: canPromoteToManager ? parsedStats.averageRating : null
        });
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

  const statMiniCard = (icon: ReactNode, value: string, label: string) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Водії</h2>
          <p className="mt-1 text-sm text-slate-400">Список водіїв.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="manager-accent-glow manager-primary-btn inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow] duration-300"
        >
          <Plus size={16} />
          Додати
        </button>
      </div>

      {!loading && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {statMiniCard(
            <UserRoundCheck className="h-7 w-7" />,
            String(stats.active),
            'Онлайн водіїв'
          )}
          {statMiniCard(
            <BarChart2 className="h-7 w-7" />,
            String(stats.totalTrips),
            'Всього поїздок'
          )}
          {statMiniCard(
            <Star className="h-7 w-7" />,
            stats.avgRating ?? '—',
            'Середній рейтинг'
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Завантаження...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Ім'я</th>
                <th className="px-3 py-2">Номер телефону</th>
                <th className="px-3 py-2 text-right tabular-nums">Поїздки</th>
                <th className="px-3 py-2 text-right tabular-nums">Рейтинг</th>
                <th className="px-3 py-2 text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const status = normalizeStatus(item.userStatus, index);
                const statusKind = userStatusToPulseKind(status);
                return (
                  <tr key={item.id} className="border-b border-white/10 text-slate-200">
                    <td className="px-3 py-2">{item.userId}</td>
                    <td className="px-3 py-2">
                      <span
                        className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                        data-status={statusKind}
                      >
                        <StatusPulseDot kind={statusKind} />
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 font-mono">{item.phoneNumber}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-white">{item.tripCount ?? 0}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-[#EAB308]">
                      {formatRating(item.averageRating)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item, index)}
                          className="manager-icon-btn"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteRemoveFromWhitelist(false);
                            setDeleteTargetId(item.id);
                          }}
                          className="manager-icon-btn manager-icon-btn--danger"
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
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/80 p-4 sm:items-center sm:p-6">
            <div className="mx-auto my-6 w-full max-w-md rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {editing ? 'Редагувати водія' : 'Новий водій'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveDriver} className="space-y-4">
              {!isCreateMode &&
                (canPromoteToManager ? (
                  <label className={fieldLabelClass}>
                    Роль
                    <select
                      value={form.profileRole}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          profileRole: event.target.value as 'Driver' | 'Manager'
                        }))
                      }
                      className="field-select mt-2"
                    >
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                      <option value="Manager">{getRoleLabel('Manager')}</option>
                    </select>
                  </label>
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
                ))}

              {canPromoteToManager ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className={fieldLabelClass}>
                    Поїздки
                    <input
                      inputMode="numeric"
                      value={form.tripCountInput}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          tripCountInput: event.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 8)
                        }))
                      }
                      className="mt-2 field-input tabular-nums"
                      placeholder="0"
                    />
                  </label>
                  <label className={fieldLabelClass}>
                    Рейтинг (1-5)
                    <input
                      inputMode="decimal"
                      maxLength={4}
                      value={form.averageRatingInput}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          averageRatingInput: sanitizeRatingInput(event.target.value, prev.averageRatingInput)
                        }))
                      }
                      className="mt-2 field-input tabular-nums"
                      placeholder="—"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={fieldLabelClass}>
                      Поїздки
                      <input
                        disabled
                        value={form.tripCountInput}
                        className="mt-2 field-input cursor-not-allowed tabular-nums opacity-60"
                        placeholder="0"
                      />
                    </label>
                    <label className={fieldLabelClass}>
                      Рейтинг (1–5)
                      <input
                        disabled
                        value={form.averageRatingInput}
                        className="mt-2 field-input cursor-not-allowed tabular-nums opacity-60"
                        placeholder="—"
                      />
                    </label>
                  </div>
                  <p className="mb-2 text-xs text-slate-400">
                    Поїздки та рейтинг може змінювати лише Адміністратор.
                  </p>
                </div>
              )}

              <label className={fieldLabelClass}>
                Ім&apos;я
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
                <div className="manager-field-outline mt-2 flex items-center overflow-hidden rounded-xl border border-white/10 bg-[#1E293B]">
                  <span className="border-r border-white/10 px-4 py-2 font-mono text-sm text-slate-300">+380</span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={9}
                    value={form.phoneDigits}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneDigits: event.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 9)
                      }))
                    }
                    className="min-w-0 flex-1 bg-transparent px-4 py-2 font-mono text-sm text-white outline-none"
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={fieldLabelClass}>
                  Марка авто
                  <input
                    value={form.carMake}
                    lang="en"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carMake: sanitizeCarBrandOrModel(event.target.value)
                      }))
                    }
                    className="mt-2 field-input"
                    placeholder="Toyota"
                  />
                  <p className="mt-1 text-xs text-slate-400">Англійською (латиниця)</p>
                </label>
                <label className={fieldLabelClass}>
                  Модель авто
                  <input
                    value={form.carModel}
                    lang="en"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carModel: sanitizeCarBrandOrModel(event.target.value)
                      }))
                    }
                    className="mt-2 field-input"
                    placeholder="Camry"
                  />
                  <p className="mt-1 text-xs text-slate-400">Англійською (латиниця)</p>
                </label>
              </div>

              <label className={fieldLabelClass}>
                Колір авто
                <input
                  value={form.carColor}
                  lang="uk"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      carColor: sanitizeCarColorUa(event.target.value)
                    }))
                  }
                  className="mt-2 field-input"
                  placeholder="Чорний"
                />
                <p className="mt-1 text-xs text-slate-400">Українською (кирилиця)</p>
              </label>

              <label className={fieldLabelClass}>
                Номер авто
                <input
                  value={form.licensePlate}
                  onChange={(event) => {
                    const v = formatLicensePlateInput(event.target.value);
                    setForm((prev) => ({ ...prev, licensePlate: v }));
                  }}
                  maxLength={8}
                  inputMode="text"
                  className="mt-2 field-input"
                  placeholder="BC9193OB"
                />
                <p className="mt-1 text-xs text-slate-400">Формат: 2 літери, 4 цифри, 2 літери</p>
              </label>

              <button
                type="submit"
                disabled={saving || !isFormValid}
                className="manager-accent-glow manager-primary-btn mt-1 w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Зберегти'}
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
