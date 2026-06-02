import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/axios';
import { parseApiRole } from '../../utils/roles';
import { getCurrentRole, getCurrentUserId } from '../../utils/auth';
import { PAGE_CARD_CLASS, SETTINGS_SECTIONS_STACK_CLASS } from '../../styles/pageClasses';
import { ManagerSectionHeader } from './shared/ManagerSectionHeader';
import { ThemeSettingsSection } from '../../theme/ThemeSettingsSection';
import { FinancialSettingsSection } from './settings/FinancialSettingsSection';
import { SuperAdminTransferModal } from './settings/SuperAdminTransferModal';
import { SuperAdminTransferSection } from './settings/SuperAdminTransferSection';
import {
  isTariffFormValid,
  tariffFormToPayload,
  tariffResponseToForm
} from './settings/settingsHelpers';
import {
  defaultTariffForm,
  type FinancialSettingsResponse,
  type ManagerOption,
  type TariffFormState
} from './settings/settingsTypes';

export default function SettingsPage() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const isSuperAdmin = role === 'SuperAdmin';
  const isManager = role === 'Manager';

  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialSaving, setFinancialSaving] = useState(false);
  const [financialError, setFinancialError] = useState('');
  const [tariffForm, setTariffForm] = useState<TariffFormState>(defaultTariffForm);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [targetId, setTargetId] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');

  const loadManagers = useCallback(async () => {
    if (!isSuperAdmin) return;

    try {
      const { data } = await api.get<ManagerOption[]>('/managers');
      setManagers(
        data.map((row) => ({
          ...row,
          role: parseApiRole(row.role)
        }))
      );
    } catch {
      setTransferError('Не вдалося завантажити список менеджерів.');
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    void loadManagers();
  }, [loadManagers]);

  useEffect(() => {
    if (!isSuperAdmin && !isManager) {
      setFinancialLoading(false);
      return;
    }

    const loadTariffs = async () => {
      setFinancialLoading(true);
      setFinancialError('');
      try {
        const { data: row } = await api.get<FinancialSettingsResponse>('/settings');
        setTariffForm(tariffResponseToForm(row));
      } catch (err) {
        setFinancialError(getApiErrorMessage(err, 'Не вдалося завантажити тарифи.'));
      } finally {
        setFinancialLoading(false);
      }
    };

    void loadTariffs();
  }, [isManager, isSuperAdmin]);

  const closeTransferModal = () => {
    setIsTransferOpen(false);
    setConfirmText('');
    setTargetId('');
    setTransferLoading(false);
  };

  const saveTariffs = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSuperAdmin) return;

    if (!isTariffFormValid(tariffForm)) {
      setFinancialError('Перевірте коректність числових полів.');
      return;
    }

    setFinancialSaving(true);
    setFinancialError('');

    try {
      await api.put('/settings', tariffFormToPayload(tariffForm));
    } catch (err) {
      setFinancialError(getApiErrorMessage(err, 'Не вдалося зберегти тарифи.'));
    } finally {
      setFinancialSaving(false);
    }
  };

  const transferSuperAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setTransferLoading(true);
    setTransferError('');

    try {
      const { data } = await api.post<{ token: string; role: string }>('/auth/transfer-superadmin', {
        targetWhitelistId: Number(targetId)
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      closeTransferModal();
      navigate('/manager/whitelist', { replace: true });
    } catch {
      setTransferError('Не вдалося передати права SuperAdmin.');
      setTransferLoading(false);
    }
  };

  const availableTransferTargets = managers.filter(
    (manager) => manager.userId !== currentUserId && manager.role === 'Manager'
  );
  const canSubmitTransfer = !transferLoading && confirmText === 'ПІДТВЕРДИТИ' && Boolean(targetId);

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerSectionHeader
        icon={<Settings className="h-7 w-7" strokeWidth={2} />}
        title="Налаштування"
        subtitle="Персональні (і не тільки) налаштування вебсервісу."
      />

      {transferError ? <div className="field-error-box mt-4">{transferError}</div> : null}

      <div className={`mt-6 ${SETTINGS_SECTIONS_STACK_CLASS}`}>
        <ThemeSettingsSection />

        {(isManager || isSuperAdmin) && (
          <FinancialSettingsSection
            isSuperAdmin={isSuperAdmin}
            loading={financialLoading}
            saving={financialSaving}
            error={financialError}
            form={tariffForm}
            setForm={setTariffForm}
            isFormValid={isTariffFormValid(tariffForm)}
            onSubmit={(event) => void saveTariffs(event)}
          />
        )}

        {isSuperAdmin && (
          <>
            <SuperAdminTransferSection onOpenTransfer={() => setIsTransferOpen(true)} />
            <SuperAdminTransferModal
              isOpen={isTransferOpen}
              confirmText={confirmText}
              targetId={targetId}
              transferLoading={transferLoading}
              canSubmit={canSubmitTransfer}
              targets={availableTransferTargets}
              onClose={closeTransferModal}
              onConfirmTextChange={setConfirmText}
              onTargetIdChange={setTargetId}
              onSubmit={transferSuperAdmin}
            />
          </>
        )}
      </div>
    </section>
  );
}
