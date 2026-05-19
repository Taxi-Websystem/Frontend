import { Gauge, Loader2, ShieldCheck } from 'lucide-react';
import { STAT_CARD_CLASS } from '../../styles/pageClasses';

interface RegistrationSideStatsProps {
  profileLoaded: boolean;
  roleLabel: string;
  formProgressPercent: number;
}

export function RegistrationSideStats({
  profileLoaded,
  roleLabel,
  formProgressPercent
}: RegistrationSideStatsProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2">
      <div className={STAT_CARD_CLASS}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="flex min-h-9 items-center text-2xl font-bold leading-snug text-white">
              {profileLoaded ? roleLabel : <Loader2 className="h-6 w-6 animate-spin" />}
            </p>
            <p className="mt-1 flex min-h-5 items-center text-sm leading-snug text-slate-400">Роль профілю</p>
          </div>
        </div>
      </div>
      <div className={STAT_CARD_CLASS}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
            <Gauge className="h-7 w-7" />
          </div>
          <div>
            <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
              {profileLoaded ? `${formProgressPercent}%` : <Loader2 className="h-6 w-6 animate-spin" />}
            </p>
            <p className="mt-1 flex min-h-5 items-center text-sm leading-snug text-slate-400">Готовність профілю</p>
          </div>
        </div>
      </div>
    </div>
  );
}
