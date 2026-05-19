import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, Loader2, Pencil, Plus, Save, SquareParking, Star, Trash2, UserRoundCheck, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getSubmitFieldErrors, PHONE_DUPLICATE_MESSAGE } from '../../utils/formErrors';
import { getCurrentRole } from '../../utils/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import ModalPortal from '../../components/ModalPortal';
import StatusPulseDot, { type StatusPulseKind } from '../../components/StatusPulseDot';
import { sanitizeCarBrandOrModel, sanitizeCarColorUa, sanitizeCarMake } from '../../utils/carFields';
import { formatLicensePlateInput, LICENSE_PLATE_REGEX } from '../../utils/licensePlate';
import { sanitizeNameUa } from '../../utils/nameFields';
import { DIGITS_ONLY_REGEX } from '../../utils/regex';
import { getRoleLabel } from '../../utils/roles';
import { managerTablePad } from './managerTableStyles';
import { getUserStatusLabel, type UserStatus } from '../../utils/userStatus';
import CarAutocomplete from '../../components/CarAutocomplete';
import { searchCarMakes, searchCarModels } from '../../utils/vehicleCatalog';
import { searchCarColorsUa } from '../../utils/carColors';

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

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

const statusToCode: Record<UserStatus, number> = {
  Offline: 0,
  Online: 1,
  InRide: 2,
  Break: 3
};

function userStatusToPulseKind(status: UserStatus): StatusPulseKind {
  if (status === 'Online') return 'online';
  if (status === 'InRide') return 'inRide';
  if (status === 'Break') return 'created';
  return 'offline';
}

function normalizeStatus(input: UserStatus | number | undefined, index: number): UserStatus {
  if (
    typeof input === 'string' &&
    (input === 'Online' || input === 'InRide' || input === 'Offline' || input === 'Break')
  ) {
    return input;
  }
  if (typeof input === 'number') {
    if (input === 1) return 'Online';
    if (input === 2) return 'InRide';
    if (input === 3) return 'Break';
    return 'Offline';
  }

  return (['Online', 'InRide', 'Offline', 'Break'] as UserStatus[])[index % 4];
}

function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(2);
}

export default function DriversPage() {
  const viewerRole = getCurrentRole();
  const canPromoteToManager = viewerRole === 'SuperAdmin';

  const [items, setItems] = useState<DriverListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DriverListItem | null>(null);
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

  useEffect(() => {
    const onDashboardDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ entity?: string }>).detail;
      if (detail?.entity === 'presence') {
        return;
      }
      void loadDrivers();
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
          item.userId === detail.userId
            ? {
                ...item,
                userStatus: detail.status
              }
            : item
        )
      );
    };

    window.addEventListener('presence:changed', onPresenceChanged as EventListener);
    return () => window.removeEventListener('presence:changed', onPresenceChanged as EventListener);
  }, []);

  const clearModalErrors = () => {
    setPhoneError('');
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...defaultForm
    });
    clearModalErrors();
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
      profileRole: 'Driver'
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

  const saveDriver = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    clearModalErrors();

    if (!isFormValid) {
      if (form.phoneDigits.length !== 9) {
        setPhoneError('Номер телефону має містити 9 цифр після +380.');
      }
      setSaving(false);
      return;
    }

    const phoneNumber = `+380${form.phoneDigits}`;

    const duplicateDriver = items.find((item) => item.phoneNumber === phoneNumber);
    if (!editing && duplicateDriver) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

    if (editing && editing.phoneNumber !== phoneNumber && duplicateDriver) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

    const payload = {
      phoneNumber,
      name: form.name,
      carMake: form.carMake || null,
      carModel: form.carModel || null,
      carColor: form.carColor || null,
      licensePlate: form.licensePlate || null,
      role: (isCreateMode ? 'Driver' : form.profileRole) as 'Driver' | 'Manager',
      userStatus: statusToCode[isCreateMode ? 'Online' : form.userStatus]
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
          userStatus: 1
        });
      }

      closeModal();
      await loadDrivers();
    } catch (err) {
      const fieldErrors = getSubmitFieldErrors(err, 'Не вдалося зберегти водія.');
      if (fieldErrors.phone) {
        setPhoneError(fieldErrors.phone);
      } else {
        setFormError(fieldErrors.general ?? 'Не вдалося зберегти водія.');
      }
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

  const statMiniCard = (icon: ReactNode, value: ReactNode, label: string) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">{value}</p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <SquareParking className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Водії</h2>
            <p className="mt-1 text-sm text-slate-400">Список водіїв.</p>
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

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {statMiniCard(
          <UserRoundCheck className="h-7 w-7" />,
          loading ? <Loader2 className="h-6 w-6 animate-spin" /> : String(stats.active),
          'Водіїв онлайн'
        )}
        {statMiniCard(
          <CarFront className="h-7 w-7" strokeWidth={2} />,
          loading ? <Loader2 className="h-6 w-6 animate-spin" /> : String(stats.totalTrips),
          'Поїздок загалом'
        )}
        {statMiniCard(
          <Star className="h-7 w-7" />,
          loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats.avgRating ?? '—'),
          'Середній рейтинг'
        )}
      </div>

      {error && (
        <div className="field-error-box mb-4">
          {error}
        </div>
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
                <th className={managerTablePad}>Ім'я</th>
                <th className={managerTablePad}>Номер телефону</th>
                <th className={`${managerTablePad} text-right tabular-nums`}>Поїздки</th>
                <th className={`${managerTablePad} text-right tabular-nums`}>Рейтинг</th>
                <th className={`${managerTablePad} text-right`}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const status = normalizeStatus(item.userStatus, index);
                const statusKind = userStatusToPulseKind(status);
                return (
                  <tr key={item.id} className="border-b border-white/10 text-slate-200">
                    <td className={managerTablePad}>{item.userId}</td>
                    <td className={managerTablePad}>
                      <span
                        className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                        data-status={statusKind}
                      >
                        <StatusPulseDot kind={statusKind} />
                        {getUserStatusLabel(status)}
                      </span>
                    </td>
                    <td className={managerTablePad}>
                      <Link
                        to={`/manager/analytics/${item.id}`}
                        className="text-[#EAB308] hover:underline"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className={`${managerTablePad} font-mono`}>{item.phoneNumber}</td>
                    <td className={`${managerTablePad} text-right tabular-nums text-white`}>{item.tripCount ?? 0}</td>
                    <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                      {formatRating(item.averageRating)}
                    </td>
                    <td className={managerTablePad}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Редагувати"
                          onClick={() => openEdit(item, index)}
                          className="manager-icon-btn"
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
              {formError ? <div className="field-error-box">{formError}</div> : null}
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

              <div className="grid grid-cols-2 gap-3">
                <CarAutocomplete
                  required
                  label="Марка авто"
                  value={form.carMake}
                  placeholder="Toyota"
                  hint="Англійською (латиниця)"
                  search={searchCarMakes}
                  normalize={sanitizeCarMake}
                  onChange={(next) =>
                    setForm((prev) => {
                      const sameMake = next.trim().toLowerCase() === prev.carMake.trim().toLowerCase();
                      return {
                        ...prev,
                        carMake: next,
                        carModel: sameMake ? prev.carModel : ''
                      };
                    })
                  }
                />
                <CarAutocomplete
                  required
                  label="Модель авто"
                  value={form.carModel}
                  disabled={!form.carMake.trim()}
                  placeholder='Camry'
                  hint="Англійською (латиниця)"
                  search={(query) => searchCarModels(form.carMake, query)}
                  normalize={sanitizeCarBrandOrModel}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      carModel: next
                    }))
                  }
                />
              </div>

              <CarAutocomplete
                required
                label="Колір авто"
                value={form.carColor}
                placeholder="Чорний"
                hint="Українською (кирилиця)"
                search={searchCarColorsUa}
                normalize={sanitizeCarColorUa}
                onChange={(next) =>
                  setForm((prev) => ({
                    ...prev,
                    carColor: next
                  }))
                }
              />

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




