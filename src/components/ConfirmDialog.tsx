import type { ReactNode } from 'react';
import ModalPortal from './ModalPortal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** danger — як видалення; primary — жовта кнопка; online — зелений outline */
  confirmTone?: 'danger' | 'primary' | 'online';
  /** online — зелене обведення як статус «Онлайн» */
  cancelTone?: 'default' | 'online';
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Підтвердження',
  message,
  confirmText = 'Видалити',
  cancelText = 'Скасувати',
  confirmTone = 'danger',
  cancelTone = 'default',
  children,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const confirmClassName =
    confirmTone === 'primary'
      ? 'manager-accent-glow manager-primary-btn rounded-full bg-[#EAB308] px-4 py-2 text-sm font-semibold text-[#0F172A]'
      : confirmTone === 'online'
        ? 'manager-action-btn--online px-4 py-2 text-sm font-semibold'
        : 'manager-icon-btn manager-icon-btn--danger rounded-full px-4 py-2 text-sm font-semibold text-slate-200';
  const cancelClassName =
    cancelTone === 'online'
      ? 'manager-action-btn--online px-4 py-2 text-sm font-semibold'
      : 'manager-icon-btn rounded-full px-4 py-2 text-sm font-semibold text-slate-200';
  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
        <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className={cancelClassName}>
              {cancelText}
            </button>
            <button type="button" onClick={onConfirm} className={confirmClassName}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
