import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusPulseDot from '../../../components/StatusPulseDot';
import { getUserStatusLabel } from '../../../utils/userStatus';
import { managerTablePad } from '../managerTableStyles';
import {
  driverStatusToPulseKind,
  formatDriverRating,
  normalizeDriverStatus,
  type DriverListItem
} from './driverHelpers';

interface DriversTableSectionProps {
  items: DriverListItem[];
  onEdit: (item: DriverListItem, index: number) => void;
  onDelete: (id: number) => void;
}

export function DriversTableSection({ items, onEdit, onDelete }: DriversTableSectionProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            <th className={managerTablePad}>ID</th>
            <th className={managerTablePad}>Статус</th>
            <th className={managerTablePad}>Ім'я</th>
            <th className={managerTablePad}>Номер телефону</th>
            <th className={`${managerTablePad} text-right tabular-nums`}>Поїздки</th>
            <th className={`${managerTablePad} text-right tabular-nums`}>Рейтинг</th>
            <th className={`${managerTablePad} text-right`}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const status = normalizeDriverStatus(item.userStatus, index);
            const statusKind = driverStatusToPulseKind(status);
            return (
              <tr key={item.id} className="border-b border-white/10 text-slate-200">
                <td className={managerTablePad}>{item.userId}</td>
                <td className={managerTablePad}>
                  <span
                    className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                    data-status={statusKind}
                  >
                    <StatusPulseDot kind={statusKind} />
                    {getUserStatusLabel(status)}
                  </span>
                </td>
                <td className={managerTablePad}>
                  <Link
                    to={`/manager/analytics/${item.id}`}
                    className="text-[#EAB308] hover:underline"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className={`${managerTablePad} font-mono`}>{item.phoneNumber}</td>
                <td className={`${managerTablePad} text-right tabular-nums text-white`}>{item.tripCount ?? 0}</td>
                <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                  {formatDriverRating(item.averageRating)}
                </td>
                <td className={managerTablePad}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="Редагувати"
                      onClick={() => onEdit(item, index)}
                      className="manager-icon-btn"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Видалити"
                      onClick={() => onDelete(item.id)}
                      className="manager-icon-btn manager-icon-btn--danger"
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
