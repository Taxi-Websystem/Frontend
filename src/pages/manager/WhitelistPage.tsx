import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getSubmitFieldErrors, PHONE_DUPLICATE_MESSAGE } from '../../utils/formErrors';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import { parseApiRole } from '../../utils/roles';
import {
  extractUaPhoneDigitsFromE164,
  formatUaPhoneE164,
  isUaPhoneLocalComplete,
  UA_PHONE_LENGTH_ERROR
} from '../../utils/phone';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { useDashboardDataRefresh } from '../../hooks/useDashboardDataRefresh';
import { ManagerPageHeader } from './shared/ManagerPageHeader';
import { ManagerTableLoading } from './shared/ManagerTableLoading';
import { WhitelistFormModal } from './whitelist/WhitelistFormModal';
import { WhitelistTableSection } from './whitelist/WhitelistTableSection';
import {
  defaultWhitelistForm,
  isDuplicateWhitelistPhone,
  type WhitelistEntry,
  type WhitelistFormState,
  type WhitelistRole
} from './whitelist/whitelistHelpers';

export default function WhitelistPage() {
  const currentRole = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const isSuperAdmin = currentRole === 'SuperAdmin';

  const [items, setItems] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<WhitelistEntry | null>(null);
  const [form, setForm] = useState<WhitelistFormState>(defaultWhitelistForm);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const isFormValid = isUaPhoneLocalComplete(form.phoneDigits);

  const roleOptions = useMemo<WhitelistRole[]>(
    () => (isSuperAdmin ? ['Driver', 'Manager'] : ['Driver']),
    [isSuperAdmin]
  );

  const loadWhitelist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<WhitelistEntry[]>('/userwhitelist');
      setItems(
        data.map((entry) => ({
          ...entry,
          role: parseApiRole(entry.role)
        }))
      );
    } catch {
      setError('Не вдалося завантажити whitelist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWhitelist();
  }, [loadWhitelist]);

  useDashboardDataRefresh(loadWhitelist, { skipPresenceEvents: true });

  const clearModalErrors = () => {
    setPhoneError('');
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultWhitelistForm);
    clearModalErrors();
    setIsModalOpen(true);
  };

  const openEdit = (entry: WhitelistEntry) => {
    setEditing(entry);
    setForm({
      phoneDigits: extractUaPhoneDigitsFromE164(entry.phoneNumber),
      role: isSuperAdmin ? entry.role : 'Driver',
      isActive: entry.isActive
    });
    clearModalErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultWhitelistForm);
    clearModalErrors();
    setSaving(false);
  };

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    clearModalErrors();

    if (!isFormValid) {
      setPhoneError(UA_PHONE_LENGTH_ERROR);
      setSaving(false);
      return;
    }

    const phoneNumber = formatUaPhoneE164(form.phoneDigits);
    const duplicateEntry = items.find((item) => item.phoneNumber === phoneNumber);
    if (isDuplicateWhitelistPhone(editing, duplicateEntry, phoneNumber)) {
      setPhoneError(PHONE_DUPLICATE_MESSAGE);
      setSaving(false);
      return;
    }

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
    } catch (err) {
      const fieldErrors = getSubmitFieldErrors(err, 'Не вдалося зберегти запис whitelist.');
      if (fieldErrors.phone) {
        setPhoneError(fieldErrors.phone);
      } else {
        setFormError(fieldErrors.general ?? 'Не вдалося зберегти запис whitelist.');
      }
      setSaving(false);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await api.delete(`/userwhitelist/${id}`);
      await loadWhitelist();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити запис.'));
    }
  };

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerPageHeader
        icon={<ShieldCheck className="h-7 w-7" strokeWidth={2} />}
        title="Whitelist"
        subtitle="Список користувачів з доступом до системи."
        onAdd={openCreate}
      />

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading ? (
        <ManagerTableLoading />
      ) : (
        <WhitelistTableSection
          items={items}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUserId}
          onEdit={openEdit}
          onDelete={setDeleteTargetId}
        />
      )}

      <WhitelistFormModal
        isOpen={isModalOpen}
        isSuperAdmin={isSuperAdmin}
        currentUserId={currentUserId}
        editing={editing}
        form={form}
        setForm={setForm}
        roleOptions={roleOptions}
        formError={formError}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        isFormValid={isFormValid}
        saving={saving}
        onClose={closeModal}
        onSubmit={saveEntry}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Підтвердження видалення"
        message="Профіль користувача і запис у Whitelist будуть безповоротно видалені. Продовжити?"
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
