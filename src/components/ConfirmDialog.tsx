import type { ReactNode } from 'react';
import ModalPortal from './ModalPortal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Підтвердження',
  message,
  confirmText = 'Так',
  cancelText = 'Ні',
  children,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-hidden bg-slate-950/80 p-4 sm:p-6">
        <div className="mx-auto max-h-[min(88dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="manager-icon-btn rounded-full px-4 py-2 text-sm font-semibold text-slate-200"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="manager-icon-btn manager-icon-btn--danger rounded-full px-4 py-2 text-sm font-semibold"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
