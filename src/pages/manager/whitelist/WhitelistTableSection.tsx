import { Pencil, Trash2 } from 'lucide-react';
import StatusPulseDot from '../../../components/StatusPulseDot';
import { getRoleLabel } from '../../../utils/roles';
import { managerTablePad } from '../managerTableStyles';
import { canDeleteWhitelistEntry, canEditWhitelistEntry, type WhitelistEntry } from './whitelistHelpers';

interface WhitelistTableSectionProps {
  items: WhitelistEntry[];
  isSuperAdmin: boolean;
  currentUserId: number | null;
  onEdit: (entry: WhitelistEntry) => void;
  onDelete: (id: number) => void;
}

export function WhitelistTableSection({
  items,
  isSuperAdmin,
  currentUserId,
  onEdit,
  onDelete
}: WhitelistTableSectionProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            <th className={managerTablePad}>ID</th>
            <th className={managerTablePad}>Статус</th>
            <th className={managerTablePad}>Роль</th>
            <th className={managerTablePad}>Номер телефону</th>
            <th className={`${managerTablePad} text-right`}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => (
            <tr key={entry.id} className="border-b border-white/10 text-slate-200">
              <td className={managerTablePad}>{entry.id}</td>
              <td className={managerTablePad}>
                <span
                  className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                  data-status={entry.isActive ? 'online' : 'offline'}
                >
                  <StatusPulseDot kind={entry.isActive ? 'online' : 'offline'} />
                  {entry.isActive ? 'Активний' : 'Неактивний'}
                </span>
              </td>
              <td className={managerTablePad}>{getRoleLabel(entry.role)}</td>
              <td className={`${managerTablePad} font-mono`}>{entry.phoneNumber}</td>
              <td className={managerTablePad}>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    title="Редагувати"
                    onClick={() => onEdit(entry)}
                    disabled={!canEditWhitelistEntry(entry, isSuperAdmin, currentUserId)}
                    className="manager-icon-btn disabled:pointer-events-none"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Видалити"
                    onClick={() => onDelete(entry.id)}
                    disabled={!canDeleteWhitelistEntry(entry, isSuperAdmin)}
                    className="manager-icon-btn manager-icon-btn--danger disabled:pointer-events-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
