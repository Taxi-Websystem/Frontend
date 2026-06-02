import { Loader2, Save, X } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import ModalPortal from '../../../components/ModalPortal';
import type { RideStatus } from '../../../utils/rideStatus';
import { sanitizeRatingInput } from '../../../utils/ratingInput';
import { FIELD_LABEL_CLASS } from '../../../styles/pageClasses';
import type { DriverOption } from './rideTypes';
import type { RideFormState } from './rideFormHelpers';

interface RideFormModalProps {
  isOpen: boolean;
  isCreateMode: boolean;
  isManager: boolean;
  isDriverLockedOnEdit: boolean;
  isFormValid: boolean;
  saving: boolean;
  form: RideFormState;
  setForm: Dispatch<SetStateAction<RideFormState>>;
  selectableDrivers: DriverOption[];
  distanceLoading: boolean;
  hasCoords: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function RideFormModal({
  isOpen,
  isCreateMode,
  isManager,
  isDriverLockedOnEdit,
  isFormValid,
  saving,
  form,
  setForm,
  selectableDrivers,
  distanceLoading,
  hasCoords,
  onClose,
  onSubmit
}: RideFormModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/80 p-4 sm:items-center sm:p-6">
        <div className="mx-auto my-6 w-full max-w-xl rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{isCreateMode ? 'Нова поїздка' : 'Редагувати поїздку'}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className={FIELD_LABEL_CLASS}>
                Статус
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as RideStatus }))}
                  className="mt-2 field-select"
                >
                  <option value="Created">Створено</option>
                  <option value="Accepted">Прийнято</option>
                  <option value="InRide">У дорозі</option>
                  <option value="Completed">Завершено</option>
                  <option value="Canceled">Скасовано</option>
                </select>
              </label>
              <label className={FIELD_LABEL_CLASS}>
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

            <label className={FIELD_LABEL_CLASS}>
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

            <label className={FIELD_LABEL_CLASS}>
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
                    : form.distanceKm || (hasCoords ? 'Обчислення…' : 'Оберіть обидві адреси')}
                </div>
                {distanceLoading ? (
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </span>
                ) : null}
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={FIELD_LABEL_CLASS}>
                Початок
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  className="mt-2 field-input"
                />
              </label>
              <label className={FIELD_LABEL_CLASS}>
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
  );
}
