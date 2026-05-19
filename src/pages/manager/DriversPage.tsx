import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CarFront, Loader2, SquareParking, Star, UserRoundCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getSubmitFieldErrors, PHONE_DUPLICATE_MESSAGE } from '../../utils/formErrors';
import { getCurrentRole } from '../../utils/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import { isUaPhoneLocalComplete, UA_PHONE_LENGTH_ERROR } from '../../utils/phone';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { useDashboardDataRefresh } from '../../hooks/useDashboardDataRefresh';
import { usePresenceChanged } from '../../hooks/usePresenceChanged';
import { ManagerPageHeader } from './shared/ManagerPageHeader';
import { ManagerStatMiniCard } from './shared/ManagerStatMiniCard';
import { ManagerTableLoading } from './shared/ManagerTableLoading';
import { DriverFormModal } from './drivers/DriverFormModal';
import { DriversTableSection } from './drivers/DriversTableSection';
import {
  buildDriverSavePayload,
  computeDriverStats,
  defaultDriverForm,
  driverItemToFormState,
  isDriverFormValid,
  isDuplicateDriverPhone,
  type DriverFormState,
  type DriverListItem
} from './drivers/driverHelpers';

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
  const [form, setForm] = useState<DriverFormState>(defaultDriverForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteRemoveFromWhitelist, setDeleteRemoveFromWhitelist] = useState(false);

  const isCreateMode = editing === null;
  const isFormValid = isDriverFormValid(form);
  const stats = useMemo(() => computeDriverStats(items), [items]);

  const loadDrivers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  useDashboardDataRefresh(loadDrivers, { skipPresenceEvents: true });

  usePresenceChanged((detail) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.userId === detail.userId ? { ...item, userStatus: detail.status } : item
      )
    );
  });

  const clearModalErrors = () => {
    setPhoneError('');
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultDriverForm });
    clearModalErrors();
    setIsModalOpen(true);
  };

  const openEdit = (item: DriverListItem, index: number) => {
    setEditing(item);
    setForm(driverItemToFormState(item, index));
    clearModalErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultDriverForm);
    clearModalErrors();
    setSaving(false);
  };

  const saveDriver = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    clearModalErrors();

    if (!isFormValid) {
      if (!isUaPhoneLocalComplete(form.phoneDigits)) {
        setPhoneError(UA_PHONE_LENGTH_ERROR);
      }
      setSaving(false);
      return;
    }

    const payload = buildDriverSavePayload(form, isCreateMode);
    const duplicateDriver = items.find((item) => item.phoneNumber === payload.phoneNumber);
    if (isDuplicateDriverPhone(editing, duplicateDriver, payload.phoneNumber)) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

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
    } catch (saveError) {
      const fieldErrors = getSubmitFieldErrors(saveError, 'Не вдалося зберегти водія.');
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
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Не вдалося видалити водія.'));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteRemoveFromWhitelist(false);
  };

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerPageHeader
        icon={<SquareParking className="h-7 w-7" strokeWidth={2} />}
        title="Водії"
        subtitle="Список водіїв."
        onAdd={openCreate}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <ManagerStatMiniCard
          icon={<UserRoundCheck className="h-7 w-7" />}
          value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : String(stats.active)}
          label="Водіїв онлайн"
        />
        <ManagerStatMiniCard
          icon={<CarFront className="h-7 w-7" strokeWidth={2} />}
          value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : String(stats.totalTrips)}
          label="Поїздок загалом"
        />
        <ManagerStatMiniCard
          icon={<Star className="h-7 w-7" />}
          value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats.avgRating ?? '—')}
          label="Середній рейтинг"
        />
      </div>

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading ? (
        <ManagerTableLoading />
      ) : (
        <DriversTableSection
          items={items}
          onEdit={openEdit}
          onDelete={(id) => {
            setDeleteRemoveFromWhitelist(false);
            setDeleteTargetId(id);
          }}
        />
      )}

      <DriverFormModal
        isOpen={isModalOpen}
        isCreateMode={isCreateMode}
        canPromoteToManager={canPromoteToManager}
        isFormValid={isFormValid}
        saving={saving}
        form={form}
        setForm={setForm}
        formError={formError}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        editingTitle={editing ? 'Редагувати водія' : 'Новий водій'}
        onClose={closeModal}
        onSubmit={saveDriver}
      />

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
