import { AlertTriangle } from 'lucide-react';
import { ORDER_CARD_CLASS } from '../../../styles/pageClasses';

interface SuperAdminTransferSectionProps {
  onOpenTransfer: () => void;
}

export function SuperAdminTransferSection({ onOpenTransfer }: SuperAdminTransferSectionProps) {
  return (
    <div className={`mt-6 ${ORDER_CARD_CLASS}`}>
      <h3 className="text-sm font-semibold text-white">Роль Адміністратора</h3>
      <p className="mt-1 text-xs text-slate-400">
        Незворотна дія: роль Адміністратора буде змінена на Менеджера.
      </p>
      <button
        type="button"
        onClick={onOpenTransfer}
        className="manager-accent-glow manager-primary-btn mt-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
      >
        <AlertTriangle size={16} strokeWidth={2} aria-hidden />
        Передати роль
      </button>
    </div>
  );
}
