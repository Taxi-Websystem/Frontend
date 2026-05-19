import { Loader2, UserRoundCheck } from 'lucide-react';
import { ORDER_CARD_CLASS } from '../../../styles/pageClasses';

interface ShiftStatusCardProps {
  loading: boolean;
  statusLabel: string;
}

export function ShiftStatusCard({ loading, statusLabel }: ShiftStatusCardProps) {
  return (
    <div className={`mb-6 ${ORDER_CARD_CLASS}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <UserRoundCheck className="h-7 w-7" />
        </div>
        <div>
          <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : statusLabel}
          </p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Поточний статус</p>
        </div>
      </div>
    </div>
  );
}
