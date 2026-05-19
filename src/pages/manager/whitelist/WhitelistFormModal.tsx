import { Loader2, Save, X } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import FormSwitch from '../../../components/FormSwitch';
import ModalPortal from '../../../components/ModalPortal';
import { parseUaPhoneDigitsInput } from '../../../utils/phone';
import { getRoleLabel } from '../../../utils/roles';
import { FIELD_LABEL_CLASS } from '../../../styles/pageClasses';
import type { WhitelistEntry, WhitelistFormState, WhitelistRole } from './whitelistHelpers';

interface WhitelistFormModalProps {
  isOpen: boolean;
  isSuperAdmin: boolean;
  currentUserId: number | null;
  editing: WhitelistEntry | null;
  form: WhitelistFormState;
  setForm: Dispatch<SetStateAction<WhitelistFormState>>;
  roleOptions: WhitelistRole[];
  formError: string;
  phoneError: string;
  setPhoneError: (message: string) => void;
  isFormValid: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function WhitelistFormModal({
  isOpen,
  isSuperAdmin,
  currentUserId,
  editing,
  form,
  setForm,
  roleOptions,
  formError,
  phoneError,
  setPhoneError,
  isFormValid,
  saving,
  onClose,
  onSubmit
}: WhitelistFormModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
        <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{editing ? 'Редагувати запис' : 'Новий запис'}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {formError ? <div className="field-error-box">{formError}</div> : null}

            <FormSwitch
              label="Активний"
              checked={form.isActive}
              disabled={Boolean(isSuperAdmin && editing && editing.id === currentUserId)}
              description={
                isSuperAdmin && editing && editing.id === currentUserId
                  ? 'Запис Адміністратора не можна деактивувати.'
                  : undefined
              }
              onChange={(next) => setForm((prev) => ({ ...prev, isActive: next }))}
            />

            {isSuperAdmin ? (
              editing?.role === 'SuperAdmin' ? (
                <label className={FIELD_LABEL_CLASS}>
                  Роль
                  <select
                    value="SuperAdmin"
                    disabled
                    className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="SuperAdmin">{getRoleLabel('SuperAdmin')}</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">Роль Адміністратора не можна змінювати.</p>
                </label>
              ) : (
                <label className={FIELD_LABEL_CLASS}>
                  Роль
                  <select
                    value={form.role === 'SuperAdmin' ? 'Driver' : form.role}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, role: event.target.value as WhitelistRole }))
                    }
                    className="field-select mt-2"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>
              )
            ) : (
              <label className={FIELD_LABEL_CLASS}>
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
            )}

            <label className={FIELD_LABEL_CLASS}>
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
                      phoneDigits: parseUaPhoneDigitsInput(event.target.value)
                    }));
                  }}
                  className="manager-phone-field__input"
                  placeholder="XXXXXXXXX"
                />
              </div>
              {phoneError ? <p className="field-error-hint">{phoneError}</p> : null}
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
  );
}
