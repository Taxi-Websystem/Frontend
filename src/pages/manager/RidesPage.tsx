import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, Ban, CheckCircle2, Eye, Flag, Loader2, MapPin, Pencil, Plus, Route, Save, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';
import ModalPortal from '../../components/ModalPortal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPulseDot, { type StatusPulseKind } from '../../components/StatusPulseDot';
import {
  RATING_1_TO_5_DECIMAL_REGEX,
  RATING_ALLOWED_CHARS_REGEX,
  RATING_DUPLICATED_SEPARATOR_REGEX,
  RATING_EDITABLE_REGEX
} from '../../utils/regex';
import { managerTablePad } from './managerTableStyles';
import type { UserStatus } from '../../utils/userStatus';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import RideRouteMap, { type RideMapData } from '../../components/RideRouteMap';
import { compactAddressLabel, fetchDrivingDistanceKm } from '../../utils/geo';
import { toDatetimeLocalValue } from '../../utils/datetime';

type RideStatus = 'Created' | 'Accepted' | 'InRide' | 'Completed' | 'Canceled';

interface RideItem {
  id: number;
  driverId: number | null;
  driverName: string | null;
  driverPhoneNumber: string | null;
  status: RideStatus;
  rating: number | null;
  fromAddress: string;
  toAddress: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toLatitude?: number | null;
  toLongitude?: number | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  distanceKm: number;
  price: number;
  driverProfit: number | null;
}

interface DriverOption {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
  userStatus?: UserStatus | number;
}

interface RideFormState {
  driverId: string;
  status: RideStatus;
  ratingInput: string;
  fromAddress: string;
  toAddress: string;
  fromLatitude: number | null;
  fromLongitude: number | null;
  toLatitude: number | null;
  toLongitude: number | null;
  startTime: string;
  endTime: string;
  distanceKm: string;
}

const defaultForm: RideFormState = {
  driverId: '',
  status: 'Created',
  ratingInput: '',
  fromAddress: '',
  toAddress: '',
  fromLatitude: null,
  fromLongitude: null,
  toLatitude: null,
  toLongitude: null,
  startTime: '',
  endTime: '',
  distanceKm: ''
};

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';
const fieldLabelClass = 'mb-1 block text-sm font-medium text-slate-300';

function toStatusChip(status: RideStatus): { label: string; kind: StatusPulseKind } {
  if (status === 'Completed') return { label: 'Завершена', kind: 'online' };
  if (status === 'Canceled') return { label: 'Скасована', kind: 'offline' };
  if (status === 'InRide') return { label: 'У дорозі', kind: 'inRide' };
  if (status === 'Accepted') return { label: 'Прийнята', kind: 'accepted' };
  return { label: 'Створена', kind: 'created' };
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

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return '—';
  const totalMinutes = Math.floor((endMs - startMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} год. ${minutes} хв.` : `${minutes} хв.`;
}

export default function RidesPage() {
  const viewerRole = getCurrentRole();
  const isManager = viewerRole === 'Manager';

  const [items, setItems] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RideItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [form, setForm] = useState<RideFormState>(defaultForm);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [mapRideId, setMapRideId] = useState<number | null>(null);
  const [mapData, setMapData] = useState<RideMapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const isCreateMode = editing === null;
  const ratingRaw = form.ratingInput.trim();
  const isRatingValid =
    ratingRaw.length === 0 ||
    RATING_1_TO_5_DECIMAL_REGEX.test(ratingRaw);
  const distanceNum = Number(form.distanceKm.replace(',', '.'));
  const isDistanceValid = !Number.isNaN(distanceNum) && distanceNum >= 0;
  const hasCoords =
    form.fromLatitude != null &&
    form.fromLongitude != null &&
    form.toLatitude != null &&
    form.toLongitude != null;
  const isFormValid =
    form.fromAddress.trim().length > 0 &&
    form.toAddress.trim().length > 0 &&
    hasCoords &&
    isRatingValid &&
    isDistanceValid &&
    distanceNum > 0;
  const isDriverLockedOnEdit =
    editing !== null &&
    (editing.status === 'InRide' || editing.status === 'Canceled' || editing.status === 'Completed');

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, ride) => {
        if (ride.status === 'Completed') acc.completed += 1;
        else if (ride.status === 'Canceled') acc.canceled += 1;
        else acc.active += 1;
        return acc;
      },
      { active: 0, completed: 0, canceled: 0 }
    );
  }, [items]);

  const onlineDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        typeof driver.userStatus === 'number' ? driver.userStatus === 1 : driver.userStatus === 'Online'
      ),
    [drivers]
  );

  const selectableDrivers = useMemo(() => {
    if (isCreateMode) return onlineDrivers;
    if (!form.driverId) return onlineDrivers;

    const selectedId = Number(form.driverId);
    if (Number.isNaN(selectedId)) return onlineDrivers;

    const alreadyInOnline = onlineDrivers.some((driver) => driver.id === selectedId);
    if (alreadyInOnline) return onlineDrivers;

    const selectedDriver = drivers.find((driver) => driver.id === selectedId);
    return selectedDriver ? [...onlineDrivers, selectedDriver] : onlineDrivers;
  }, [drivers, form.driverId, isCreateMode, onlineDrivers]);

  const loadRides = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<RideItem[]>('/rides');
      setItems(response.data);
    } catch {
      setError('Не вдалося завантажити поїздки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRides();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get<DriverOption[]>('/drivers');
      setDrivers(response.data);
    } catch {
      setDrivers([]);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  useEffect(() => {
    if (
      form.fromLatitude == null ||
      form.fromLongitude == null ||
      form.toLatitude == null ||
      form.toLongitude == null
    ) {
      return;
    }

    let cancelled = false;
    setDistanceLoading(true);
    void fetchDrivingDistanceKm(
      form.fromLongitude,
      form.fromLatitude,
      form.toLongitude,
      form.toLatitude
    )
      .then((km) => {
        if (cancelled || km == null) return;
        setForm((prev) => ({ ...prev, distanceKm: String(km) }));
      })
      .finally(() => {
        if (!cancelled) setDistanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.fromLatitude, form.fromLongitude, form.toLatitude, form.toLongitude]);

  useEffect(() => {
    const onDashboardDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ entity?: string }>).detail;
      if (detail?.entity === 'presence') {
        return;
      }
      void loadRides();
      void loadDrivers();
    };

    window.addEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
    return () => window.removeEventListener('dashboard:data-changed', onDashboardDataChanged as EventListener);
  }, []);

  useEffect(() => {
    const onPresenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: number; status: import('../../utils/userStatus').UserStatus }>).detail;
      if (!detail) return;

      setDrivers((prev) =>
        prev.map((driver) =>
          driver.userId === detail.userId
            ? {
                ...driver,
                userStatus: detail.status
              }
            : driver
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

  const openEdit = (ride: RideItem) => {
    setEditing(ride);
    setForm({
      driverId: ride.driverId ? String(ride.driverId) : '',
      status: ride.status,
      ratingInput: ride.rating != null ? String(ride.rating) : '',
      fromAddress: compactAddressLabel(ride.fromAddress),
      toAddress: compactAddressLabel(ride.toAddress),
      fromLatitude: ride.fromLatitude ?? null,
      fromLongitude: ride.fromLongitude ?? null,
      toLatitude: ride.toLatitude ?? null,
      toLongitude: ride.toLongitude ?? null,
      startTime: toDatetimeLocalValue(ride.startTime),
      endTime: toDatetimeLocalValue(ride.endTime),
      distanceKm: String(ride.distanceKm ?? 0)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
    setSaving(false);
  };

  const submitRide = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) return;

    setSaving(true);
    setError('');

    const payload = {
      driverId: form.driverId ? Number(form.driverId) : null,
      status: form.status,
      rating: form.ratingInput ? Number(form.ratingInput.replace(',', '.')) : null,
      fromAddress: compactAddressLabel(form.fromAddress),
      toAddress: compactAddressLabel(form.toAddress),
      fromLatitude: form.fromLatitude,
      fromLongitude: form.fromLongitude,
      toLatitude: form.toLatitude,
      toLongitude: form.toLongitude,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      distanceKm: Number(form.distanceKm.replace(',', '.'))
    };

    try {
      if (editing) {
        await api.put(`/rides/${editing.id}`, payload);
      } else {
        await api.post('/rides', payload);
      }
      closeModal();
      await loadRides();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося зберегти поїздку.'));
      setSaving(false);
    }
  };

  const openMapModal = (rideId: number) => {
    setMapRideId(rideId);
    setMapData(null);
    setMapLoading(true);
    void api
      .get<RideMapData>(`/rides/${rideId}/map`)
      .then((res) => setMapData(res.data))
      .catch(() => setMapData(null))
      .finally(() => setMapLoading(false));
  };

  const closeMapModal = () => {
    setMapRideId(null);
    setMapData(null);
    setMapLoading(false);
  };

  const deleteRide = async (id: number) => {
    try {
      await api.delete(`/rides/${id}`);
      await loadRides();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити поїздку.'));
    }
  };

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <Route className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Поїздки</h2>
            <p className="mt-1 text-sm text-slate-400">Список поїздок.</p>
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <Activity className="h-7 w-7" />
            </div>
            <div>
              <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : statusCounts.active}
              </p>
              <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Активні</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : statusCounts.completed}
              </p>
              <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Завершені</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <Ban className="h-7 w-7" />
            </div>
            <div>
              <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : statusCounts.canceled}
              </p>
              <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Скасовані</p>
            </div>
          </div>
        </div>
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
                <th className={managerTablePad}>Водій</th>
                <th className={managerTablePad}>Звідки</th>
                <th className={managerTablePad}>Куди</th>
                <th className={`${managerTablePad} text-right`}>Км</th>
                <th className={`${managerTablePad} text-right`}>Ціна</th>
                <th className={`${managerTablePad} text-right tabular-nums`}>Прибуток</th>
                <th className={`${managerTablePad} whitespace-nowrap`}>Час у дорозі</th>
                <th className={`${managerTablePad} text-right`}>Рейтинг</th>
                <th className={`${managerTablePad} text-right`}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ride) => {
                const chip = toStatusChip(ride.status);
                const driverLabel = ride.driverName || ride.driverPhoneNumber || '—';
                return (
                  <tr key={ride.id} className="border-b border-white/10 text-slate-200">
                    <td className={`${managerTablePad} tabular-nums`}>{ride.id}</td>
                    <td className={managerTablePad}>
                      <span
                        className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                        data-status={chip.kind}
                      >
                        <StatusPulseDot kind={chip.kind} />
                        {chip.label}
                      </span>
                    </td>
                    <td className={managerTablePad}>
                      {driverLabel === '—' ? (
                        '—'
                      ) : (
                        <Link
                          to={ride.driverId ? `/manager/analytics/${ride.driverId}` : '#'}
                          className="text-[#EAB308] hover:underline"
                        >
                          {driverLabel}
                        </Link>
                      )}
                    </td>
                    <td className={`max-w-xs truncate ${managerTablePad}`}>
                      {compactAddressLabel(ride.fromAddress)}
                    </td>
                    <td className={`max-w-xs truncate ${managerTablePad}`}>
                      {compactAddressLabel(ride.toAddress)}
                    </td>
                    <td className={`${managerTablePad} text-right tabular-nums`}>
                      {Number(ride.distanceKm).toFixed(2)}
                    </td>
                    <td className={`${managerTablePad} text-right tabular-nums`}>{Number(ride.price).toFixed(2)}</td>
                    <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                      {ride.driverProfit != null ? Number(ride.driverProfit).toFixed(2) : '—'}
                    </td>
                    <td className={`${managerTablePad} whitespace-nowrap tabular-nums`}>
                      {formatDuration(ride.startTime, ride.endTime)}
                    </td>
                    <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                      {ride.rating != null ? Number(ride.rating).toFixed(2) : '—'}
                    </td>
                    <td className={managerTablePad}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="На карті"
                          onClick={() => openMapModal(ride.id)}
                          className="manager-icon-btn"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          title="Редагувати"
                          onClick={() => openEdit(ride)}
                          className="manager-icon-btn"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Видалити"
                          onClick={() => setDeleteTargetId(ride.id)}
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
            <div className="mx-auto my-6 w-full max-w-xl rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{isCreateMode ? 'Нова поїздка' : 'Редагувати поїздку'}</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitRide} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className={fieldLabelClass}>
                    Статус
                    <select
                      value={form.status}
                      onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as RideStatus }))}
                      className="mt-2 field-select"
                    >
                      <option value="Created">Створена</option>
                      <option value="Accepted">Прийнята</option>
                      <option value="InRide">У дорозі</option>
                      <option value="Completed">Завершена</option>
                      <option value="Canceled">Скасована</option>
                    </select>
                  </label>
                  <label className={fieldLabelClass}>
                    Рейтинг
                    <input
                      value={form.ratingInput}
                      disabled={isManager}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ratingInput: sanitizeRatingInput(event.target.value, prev.ratingInput)
                        }))
                      }
                      className="mt-2 field-input tabular-nums disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="—"
                    />
                  </label>
                </div>

                <label className={fieldLabelClass}>
                    Водій
                    <select
                      value={form.driverId}
                      disabled={isDriverLockedOnEdit}
                      onChange={(event) => setForm((prev) => ({ ...prev, driverId: event.target.value }))}
                      className="mt-2 field-select font-mono disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    <option value="">Оберіть водія</option>
                    {selectableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        №{driver.userId} — {driver.name} ({driver.phoneNumber})
                      </option>
                    ))}
                  </select>
                  {!isDriverLockedOnEdit && (
                    <p className="mt-1 text-xs text-slate-400">В списку доступні лише водії зі статусом «Онлайн».</p>
                  )}
                  {!isCreateMode && isDriverLockedOnEdit && (
                    <p className="mt-1 text-xs text-slate-400">Водія можна змінити тільки перед початком поїздки.</p>
                  )}
                </label>

                <AddressAutocomplete
                    label="Звідки"
                    value={form.fromAddress}
                    latitude={form.fromLatitude}
                    longitude={form.fromLongitude}
                    placeholder="Шевченка, 123"
                    onChange={(next) =>
                      setForm((prev) => ({
                        ...prev,
                        fromAddress: next?.displayName ?? '',
                        fromLatitude: next?.latitude ?? null,
                        fromLongitude: next?.longitude ?? null,
                        distanceKm: next ? prev.distanceKm : ''
                      }))
                    }
                  />

                <AddressAutocomplete
                    label="Куди"
                    value={form.toAddress}
                    latitude={form.toLatitude}
                    longitude={form.toLongitude}
                    placeholder="Сихівська, 10"
                    onChange={(next) =>
                      setForm((prev) => ({
                        ...prev,
                        toAddress: next?.displayName ?? '',
                        toLatitude: next?.latitude ?? null,
                        toLongitude: next?.longitude ?? null,
                        distanceKm: next ? prev.distanceKm : ''
                      }))
                    }
                  />

                <label className={fieldLabelClass}>
                  Відстань (км)
                  <div className="relative mt-2">
                    <div
                      className={`field-input tabular-nums select-none ${
                        !distanceLoading && !form.distanceKm ? 'text-slate-500' : 'text-white'
                      }`}
                      aria-readonly
                    >
                      {distanceLoading
                        ? hasCoords
                          ? 'Обчислення…'
                          : 'Оберіть обидві адреси'
                        : form.distanceKm ||
                          (hasCoords ? 'Обчислення…' : 'Оберіть обидві адреси')}
                    </div>
                    {distanceLoading ? (
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </span>
                    ) : null}
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className={fieldLabelClass}>
                    Початок
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                      className="mt-2 field-input"
                    />
                  </label>
                  <label className={fieldLabelClass}>
                    Завершення
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                      className="mt-2 field-input"
                    />
                  </label>
                </div>

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

      {mapRideId !== null && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/80 p-4 sm:items-center sm:p-6">
            <div className="mx-auto my-6 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Маршрут поїздки №{mapRideId}</h3>
                  {mapData ? (
                    <div className="mt-2 space-y-2 text-sm text-slate-200">
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                        <span>
                          <span className="text-slate-400">Звідки: </span>
                          {compactAddressLabel(mapData.fromAddress)}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Flag className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                        <span>
                          <span className="text-slate-400">Куди: </span>
                          {compactAddressLabel(mapData.toAddress)}
                        </span>
                      </p>
                      <p className="flex items-start gap-2 tabular-nums">
                        <Route className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                        <span>
                          <span className="text-slate-400">Відстань: </span>
                          <span className="text-white">{Number(mapData.distanceKm).toFixed(2)} км</span>
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeMapModal}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              {mapLoading || !mapData ? (
                <div className="flex h-[320px] items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <RideRouteMap data={mapData} />
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Підтвердження видалення"
        message="Поїздка буде безповоротно видалена. Продовжити?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          const targetId = deleteTargetId;
          setDeleteTargetId(null);
          if (targetId !== null) {
            void deleteRide(targetId);
          }
        }}
      />
    </section>
  );
}
