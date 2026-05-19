import { Loader2, Save, X } from 'lucide-react';
import type { FormEvent } from 'react';
import ModalPortal from '../../../components/ModalPortal';
import { FIELD_LABEL_CLASS } from '../../../styles/pageClasses';
import type { ManagerOption } from './settingsTypes';

interface SuperAdminTransferModalProps {
  isOpen: boolean;
  confirmText: string;
  targetId: string;
  transferLoading: boolean;
  canSubmit: boolean;
  targets: ManagerOption[];
  onClose: () => void;
  onConfirmTextChange: (value: string) => void;
  onTargetIdChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function SuperAdminTransferModal({
  isOpen,
  confirmText,
  targetId,
  transferLoading,
  canSubmit,
  targets,
  onClose,
  onConfirmTextChange,
  onTargetIdChange,
  onSubmit
}: SuperAdminTransferModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
        <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Передати роль Адміністратора</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className={FIELD_LABEL_CLASS}>
              Цільовий менеджер
              <select
                required
                value={targetId}
                onChange={(event) => onTargetIdChange(event.target.value)}
                className="field-select mt-2 font-mono"
              >
                <option value="">Оберіть менеджера</option>
                {targets.map((manager) => (
                  <option key={manager.id} value={manager.userId}>
                    №{manager.userId} — {manager.name} ({manager.phoneNumber})
                  </option>
                ))}
              </select>
            </label>

            <label className={FIELD_LABEL_CLASS}>
              Введіть «<span className="font-semibold text-[#EAB308]">ПІДТВЕРДИТИ</span>»
              <input
                required
                value={confirmText}
                onChange={(event) => onConfirmTextChange(event.target.value)}
                className="mt-2 field-input"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="manager-accent-glow manager-primary-btn relative w-full rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              <span className={`inline-flex items-center gap-2 ${transferLoading ? 'invisible' : ''}`}>
                <Save size={16} />
                Підтвердити дію
              </span>
              {transferLoading ? (
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
