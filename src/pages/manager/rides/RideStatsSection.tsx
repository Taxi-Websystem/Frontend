import { Activity, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { ManagerStatMiniCard } from '../shared/ManagerStatMiniCard';
import type { RideStatusCounts } from './rideTypes';

interface RideStatsSectionProps {
  loading: boolean;
  counts: RideStatusCounts;
}

export function RideStatsSection({ loading, counts }: RideStatsSectionProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <ManagerStatMiniCard
        icon={<Activity className="h-7 w-7" />}
        value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : counts.active}
        label="Активні"
      />
      <ManagerStatMiniCard
        icon={<CheckCircle2 className="h-7 w-7" />}
        value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : counts.completed}
        label="Завершені"
      />
      <ManagerStatMiniCard
        icon={<Ban className="h-7 w-7" />}
        value={loading ? <Loader2 className="h-6 w-6 animate-spin" /> : counts.canceled}
        label="Скасовані"
      />
    </div>
  );
}
