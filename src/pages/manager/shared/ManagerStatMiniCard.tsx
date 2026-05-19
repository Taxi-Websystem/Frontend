import type { ReactNode } from 'react';

interface ManagerStatMiniCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}

export function ManagerStatMiniCard({ icon, value, label }: ManagerStatMiniCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">{value}</p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}
