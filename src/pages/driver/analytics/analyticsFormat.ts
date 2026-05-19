import { formatLocalDateTime } from '../../../utils/datetime';
import type { RideMapSummary } from './analyticsTypes';

export function formatRideMapOptionLabel(ride: RideMapSummary): string {
  const endTimeLabel = formatLocalDateTime(ride.endTime);
  const suffix = endTimeLabel ? ` (${endTimeLabel})` : '';
  return `№${ride.rideId} — ${ride.fromAddress} → ${ride.toAddress}${suffix}`;
}
