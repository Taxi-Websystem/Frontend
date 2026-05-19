import type { ReactNode } from 'react';

interface ManagerSectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function ManagerSectionHeader({ icon, title, subtitle }: ManagerSectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
