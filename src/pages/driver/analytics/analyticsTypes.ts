export type AnalyticsPeriodId = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'm3' | 'm6' | 'year';

export interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  currentStatus: string;
  isManualControlAllowed: boolean;
  profileId: number;
}

export interface AnalyticsSummary {
  totalProfit: number;
  totalRides: number;
  averageRideRating?: number | null;
}

export interface AnalyticsChartPoint {
  label: string;
  bucketStartUtc?: string | null;
  profit: number;
  ridesCount: number;
  transitSecondsTotal: number;
  distanceKmTotal: number;
}

export interface RideMapSummary {
  rideId: number;
  fromAddress: string;
  toAddress: string;
  endTime: string;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  chartData: AnalyticsChartPoint[];
  chartBucket?: 'hour' | 'day';
  ridesForMap?: RideMapSummary[];
}

export const ANALYTICS_PERIODS: { id: AnalyticsPeriodId; label: string }[] = [
  { id: 'all', label: 'Весь час' },
  { id: 'today', label: 'Сьогодні' },
  { id: 'yesterday', label: 'Вчора' },
  { id: 'week', label: 'Тиждень' },
  { id: 'month', label: 'Місяць' },
  { id: 'm3', label: '3 міс.' },
  { id: 'm6', label: '6 міс.' },
  { id: 'year', label: 'Рік' }
];
