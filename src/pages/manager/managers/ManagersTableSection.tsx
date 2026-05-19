import { Pencil, Trash2 } from 'lucide-react';
import StatusPulseDot from '../../../components/StatusPulseDot';
import { getRoleLabel } from '../../../utils/roles';
import { getUserStatusLabel } from '../../../utils/userStatus';
import { managerTablePad } from '../managerTableStyles';
import { canDeleteManagerRow, canEditManagerRow, type ManagerProfile } from './managerHelpers';

interface ManagersTableSectionProps {
  items: ManagerProfile[];
  canManage: boolean;
  canEditSelfAsManager: boolean;
  currentUserId: number | null;
  onEdit: (item: ManagerProfile) => void;
  onDelete: (id: number) => void;
}

export function ManagersTableSection({
  items,
  canManage,
  canEditSelfAsManager,
  currentUserId,
  onEdit,
  onDelete
}: ManagersTableSectionProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            <th className={managerTablePad}>ID</th>
            <th className={managerTablePad}>Статус</th>
            <th className={managerTablePad}>Роль</th>
            <th className={managerTablePad}>Ім'я</th>
            <th className={managerTablePad}>Номер телефону</th>
            <th className={`${managerTablePad} text-right`}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const canEditRow = canEditManagerRow(item, canManage, canEditSelfAsManager, currentUserId);
            const canDeleteRow = canDeleteManagerRow(item, canManage);
            const statusKind = item.status === 'Online' ? 'online' : 'offline';

            return (
              <tr key={`${item.userId}-${item.id}`} className="border-b border-white/10 text-slate-200">
                <td className={managerTablePad}>{item.userId}</td>
                <td className={managerTablePad}>
                  <span
                    className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                    data-status={statusKind}
                  >
                    <StatusPulseDot kind={statusKind} />
                    {getUserStatusLabel(item.status)}
                  </span>
                </td>
                <td className={managerTablePad}>{getRoleLabel(item.role)}</td>
                <td className={managerTablePad}>{item.name}</td>
                <td className={`${managerTablePad} font-mono`}>{item.phoneNumber}</td>
                <td className={managerTablePad}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="Редагувати"
                      onClick={() => onEdit(item)}
                      disabled={!canEditRow}
                      className="manager-icon-btn disabled:pointer-events-none"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Видалити"
                      onClick={() => onDelete(item.id)}
                      disabled={!canManage || !canDeleteRow}
                      className="manager-icon-btn manager-icon-btn--danger disabled:pointer-events-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
