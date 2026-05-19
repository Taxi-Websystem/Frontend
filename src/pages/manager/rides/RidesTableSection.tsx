import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusPulseDot from '../../../components/StatusPulseDot';
import { compactAddressLabel } from '../../../utils/geo';
import { formatRideDuration } from '../../../utils/datetime';
import { getRideStatusDisplay } from '../../../utils/rideStatus';
import { managerTablePad } from '../managerTableStyles';
import type { RideItem } from './rideTypes';

interface RidesTableSectionProps {
  items: RideItem[];
  onViewMap: (rideId: number) => void;
  onEdit: (ride: RideItem) => void;
  onDelete: (rideId: number) => void;
}

export function RidesTableSection({ items, onViewMap, onEdit, onDelete }: RidesTableSectionProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            <th className={managerTablePad}>ID</th>
            <th className={managerTablePad}>Статус</th>
            <th className={managerTablePad}>Водій</th>
            <th className={managerTablePad}>Звідки</th>
            <th className={managerTablePad}>Куди</th>
            <th className={`${managerTablePad} text-right`}>Км</th>
            <th className={`${managerTablePad} text-right`}>Ціна</th>
            <th className={`${managerTablePad} text-right tabular-nums`}>Прибуток</th>
            <th className={`${managerTablePad} whitespace-nowrap`}>Час у дорозі</th>
            <th className={`${managerTablePad} text-right`}>Рейтинг</th>
            <th className={`${managerTablePad} text-right`}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {items.map((ride) => {
            const chip = getRideStatusDisplay(ride.status);
            const driverLabel = ride.driverName || ride.driverPhoneNumber || '—';
            return (
              <tr key={ride.id} className="border-b border-white/10 text-slate-200">
                <td className={`${managerTablePad} tabular-nums`}>{ride.id}</td>
                <td className={managerTablePad}>
                  <span
                    className="manager-status-chip manager-status-chip--interactive inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                    data-status={chip.kind}
                  >
                    <StatusPulseDot kind={chip.kind} />
                    {chip.label}
                  </span>
                </td>
                <td className={managerTablePad}>
                  {driverLabel === '—' ? (
                    <span className="text-[#EAB308]">—</span>
                  ) : (
                    <Link
                      to={ride.driverId ? `/manager/analytics/${ride.driverId}` : '#'}
                      className="text-[#EAB308] hover:underline"
                    >
                      {driverLabel}
                    </Link>
                  )}
                </td>
                <td className={`max-w-xs truncate ${managerTablePad}`}>
                  {compactAddressLabel(ride.fromAddress)}
                </td>
                <td className={`max-w-xs truncate ${managerTablePad}`}>
                  {compactAddressLabel(ride.toAddress)}
                </td>
                <td className={`${managerTablePad} text-right tabular-nums`}>
                  {Number(ride.distanceKm).toFixed(2)}
                </td>
                <td className={`${managerTablePad} text-right tabular-nums`}>{Number(ride.price).toFixed(2)}</td>
                <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                  {ride.driverProfit != null ? Number(ride.driverProfit).toFixed(2) : '—'}
                </td>
                <td className={`${managerTablePad} whitespace-nowrap tabular-nums`}>
                  {formatRideDuration(ride.startTime, ride.endTime)}
                </td>
                <td className={`${managerTablePad} text-right font-medium tabular-nums text-[#EAB308]`}>
                  {ride.rating != null ? Number(ride.rating).toFixed(2) : '—'}
                </td>
                <td className={managerTablePad}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="На карті"
                      onClick={() => onViewMap(ride.id)}
                      className="manager-icon-btn"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      title="Редагувати"
                      onClick={() => onEdit(ride)}
                      className="manager-icon-btn"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Видалити"
                      onClick={() => onDelete(ride.id)}
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
