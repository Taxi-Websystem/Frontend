import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { UsersRound } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getSubmitFieldErrors, PHONE_DUPLICATE_MESSAGE } from '../../utils/formErrors';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import { parseApiRole } from '../../utils/roles';
import {
  formatUaPhoneE164,
  isUaPhoneLocalComplete,
  UA_PHONE_LENGTH_ERROR
} from '../../utils/phone';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormSwitch from '../../components/FormSwitch';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { useDashboardDataRefresh } from '../../hooks/useDashboardDataRefresh';
import { usePresenceChanged } from '../../hooks/usePresenceChanged';
import { ManagerPageHeader } from './shared/ManagerPageHeader';
import { ManagerTableLoading } from './shared/ManagerTableLoading';
import { ManagerFormModal } from './managers/ManagerFormModal';
import { ManagersTableSection } from './managers/ManagersTableSection';
import {
  canEditManagerRole,
  defaultManagerForm,
  isDuplicateManagerPhone,
  isManagerFormValid,
  isManagerPhoneFieldDisabled,
  managerItemToFormState,
  type ManagerFormState,
  type ManagerProfile
} from './managers/managerHelpers';

export default function ManagersPage() {
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const canManage = role === 'SuperAdmin';
  const canEditSelfAsManager = role === 'Manager';

  const [items, setItems] = useState<ManagerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerProfile | null>(null);
  const [form, setForm] = useState<ManagerFormState>(defaultManagerForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteRemoveFromWhitelist, setDeleteRemoveFromWhitelist] = useState(false);

  const isCreateMode = editing === null;
  const isEditingOwnProfile = Boolean(editing && currentUserId !== null && editing.userId === currentUserId);
  const phoneRequiredForSubmit = isCreateMode || canManage;
  const isPhoneFieldDisabled = isManagerPhoneFieldDisabled(editing, phoneRequiredForSubmit, currentUserId);
  const isFormValid = useMemo(
    () => isManagerFormValid(form, phoneRequiredForSubmit),
    [form, phoneRequiredForSubmit]
  );

  const loadManagers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadManagers();
  }, [loadManagers]);

  useDashboardDataRefresh(loadManagers, { skipPresenceEvents: true });

  usePresenceChanged((detail) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.userId === detail.userId && detail.status !== 'InRide'
          ? { ...item, status: detail.status }
          : item
      )
    );
  });

  const clearModalErrors = () => {
    setPhoneError('');
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultManagerForm);
    clearModalErrors();
    setIsModalOpen(true);
  };

  const openEdit = (item: ManagerProfile) => {
    setEditing(item);
    setForm(managerItemToFormState(item));
    clearModalErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultManagerForm);
    clearModalErrors();
    setSaving(false);
  };

  const saveManager = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      if (phoneRequiredForSubmit && !isUaPhoneLocalComplete(form.phoneDigits)) {
        setPhoneError(UA_PHONE_LENGTH_ERROR);
      }
      return;
    }

    setSaving(true);
    clearModalErrors();

    const phoneNumber = formatUaPhoneE164(form.phoneDigits);
    const duplicateManager = items.find((item) => item.phoneNumber === phoneNumber);
    if (isDuplicateManagerPhone(editing, duplicateManager, phoneNumber)) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        const payload: {
          name: string;
          phoneNumber?: string;
          role?: 'Manager' | 'Driver';
        } = {
          name: form.name.trim()
        };
        if (phoneRequiredForSubmit) {
          payload.phoneNumber = phoneNumber;
        }
        if (canEditManagerRole(editing, currentUserId)) {
          payload.role = form.editRole;
        }
        await api.put(`/managers/${editing.id}`, payload);
      } else {
        await api.post<ManagerProfile>('/managers', {
          phoneNumber,
          name: form.name.trim()
        });
      }

      closeModal();
      await loadManagers();
    } catch (saveError) {
      const fieldErrors = getSubmitFieldErrors(saveError, 'Не вдалося зберегти менеджера.');
      if (fieldErrors.phone) {
        setPhoneError(fieldErrors.phone);
      } else {
        setFormError(fieldErrors.general ?? 'Не вдалося зберегти менеджера.');
      }
      setSaving(false);
    }
  };

  const deleteManager = async (id: number, removeFromWhitelist: boolean) => {
    try {
      await api.delete(`/managers/${id}`, { params: { removeFromWhitelist } });
      setItems((previousItems) => previousItems.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Не вдалося видалити менеджера.'));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteRemoveFromWhitelist(false);
  };

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerPageHeader
        icon={<UsersRound className="h-7 w-7" strokeWidth={2} />}
        title="Менеджери"
        subtitle="Список менеджерів та адміністраторів."
        onAdd={openCreate}
        addDisabled={!canManage}
      />

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading ? (
        <ManagerTableLoading />
      ) : (
        <ManagersTableSection
          items={items}
          canManage={canManage}
          canEditSelfAsManager={canEditSelfAsManager}
          currentUserId={currentUserId}
          onEdit={openEdit}
          onDelete={(id) => {
            setDeleteRemoveFromWhitelist(false);
            setDeleteTargetId(id);
          }}
        />
      )}

      <ManagerFormModal
        isOpen={isModalOpen}
        canManage={canManage}
        isEditingOwnProfile={isEditingOwnProfile}
        viewerRole={role}
        isCreateMode={isCreateMode}
        editing={editing}
        currentUserId={currentUserId}
        form={form}
        setForm={setForm}
        formError={formError}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        isPhoneFieldDisabled={isPhoneFieldDisabled}
        isFormValid={isFormValid}
        saving={saving}
        onClose={closeModal}
        onSubmit={saveManager}
      />

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
