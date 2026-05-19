import { CarFront, Loader2, UserRoundCheck } from 'lucide-react';
import { STAT_CARD_CLASS } from '../../styles/pageClasses';
import type { LoginPublicStats } from './loginTypes';

interface LoginPublicStatsCardsProps {
  loading: boolean;
  stats: LoginPublicStats | null;
}

export function LoginPublicStatsCards({ loading, stats }: LoginPublicStatsCardsProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className={STAT_CARD_CLASS}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <UserRoundCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats ? String(stats.onlineDrivers) : '—'}
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Водіїв онлайн</p>
          </div>
        </div>
      </div>
      <div className={STAT_CARD_CLASS}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <CarFront className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats ? String(stats.todayTrips) : '—'}
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">Поїздок сьогодні</p>
          </div>
        </div>
      </div>
    </div>
  );
}
