import { Loader2, Save, X } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { sanitizeNameUa } from '../../../utils/nameFields';
import { parseUaPhoneDigitsInput } from '../../../utils/phone';
import { getRoleLabel } from '../../../utils/roles';
import { FIELD_LABEL_CLASS } from '../../../styles/pageClasses';
import { canEditManagerRole, type ManagerFormState, type ManagerProfile } from './managerHelpers';

interface ManagerFormModalProps {
  isOpen: boolean;
  canManage: boolean;
  isEditingOwnProfile: boolean;
  viewerRole: string | null;
  isCreateMode: boolean;
  editing: ManagerProfile | null;
  currentUserId: number | null;
  form: ManagerFormState;
  setForm: Dispatch<SetStateAction<ManagerFormState>>;
  formError: string;
  phoneError: string;
  setPhoneError: (message: string) => void;
  isPhoneFieldDisabled: boolean;
  isFormValid: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function ManagerFormModal({
  isOpen,
  canManage,
  isEditingOwnProfile,
  viewerRole,
  isCreateMode,
  editing,
  currentUserId,
  form,
  setForm,
  formError,
  phoneError,
  setPhoneError,
  isPhoneFieldDisabled,
  isFormValid,
  saving,
  onClose,
  onSubmit
}: ManagerFormModalProps) {
  if (!isOpen || !(canManage || isEditingOwnProfile)) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
        <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {editing ? 'Редагувати менеджера' : 'Новий менеджер'}
            </h3>
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
            {!isCreateMode && editing && (
              <div className={FIELD_LABEL_CLASS}>
                Роль
                {editing.role === 'SuperAdmin' ? (
                  <>
                    <select
                      value="SuperAdmin"
                      disabled
                      className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="SuperAdmin">{getRoleLabel('SuperAdmin')}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Роль Адміністратора можна тільки передати.</p>
                  </>
                ) : editing.role === 'Driver' ? (
                  <>
                    <select
                      value="Driver"
                      disabled
                      className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="Driver">{getRoleLabel('Driver')}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                  </>
                ) : canEditManagerRole(editing, currentUserId) ? (
                  <select
                    value={form.editRole}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        editRole: event.target.value as 'Manager' | 'Driver'
                      }))
                    }
                    className="field-select mt-2"
                  >
                    <option value="Manager">{getRoleLabel('Manager')}</option>
                    <option value="Driver">{getRoleLabel('Driver')}</option>
                  </select>
                ) : (
                  <>
                    <select
                      value={editing.role}
                      disabled
                      className="field-select mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value={editing.role}>{getRoleLabel(editing.role)}</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Роль може змінювати лише Адміністратор.</p>
                  </>
                )}
              </div>
            )}

            <label className={FIELD_LABEL_CLASS}>
              Ім'я
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: sanitizeNameUa(event.target.value)
                  }))
                }
                className="mt-2 field-input"
                placeholder="Олексій"
              />
              <p className="mt-1 text-xs text-slate-400">Українською (кирилиця)</p>
            </label>

            <label className={FIELD_LABEL_CLASS}>
              Номер телефону
              <div
                className={`manager-phone-field mt-2 ${
                  isPhoneFieldDisabled ? 'manager-phone-field--dimmed' : ''
                }`}
              >
                <span className="manager-phone-field__prefix">+380</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={9}
                  value={form.phoneDigits}
                  disabled={isPhoneFieldDisabled}
                  onChange={(event) => {
                    setPhoneError('');
                    setForm((previous) => ({
                      ...previous,
                      phoneDigits: parseUaPhoneDigitsInput(event.target.value)
                    }));
                  }}
                  className="manager-phone-field__input"
                  placeholder="XXXXXXXXX"
                />
              </div>
              {phoneError ? <p className="field-error-hint">{phoneError}</p> : null}
              {isEditingOwnProfile && viewerRole === 'Manager' ? (
                <p className="mt-1 text-xs text-slate-400">Номер телефону може змінювати лише Адміністратор.</p>
              ) : null}
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
