import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface ManagerPageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onAdd: () => void;
  addDisabled?: boolean;
}

export function ManagerPageHeader({
  icon,
  title,
  subtitle,
  onAdd,
  addDisabled = false
}: ManagerPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        className="manager-accent-glow manager-primary-btn inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <Plus size={16} />
        Додати
      </button>
    </div>
  );
}
