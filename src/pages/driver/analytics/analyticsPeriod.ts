import { format, subDays, subMonths } from 'date-fns';
import type { AnalyticsChartPoint, AnalyticsPeriodId } from './analyticsTypes';

function localStartOfCalendarDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function localTodayRange(now: Date): { start: Date; end: Date } {
  return { start: localStartOfCalendarDay(now), end: now };
}

function localYesterdayRange(now: Date): { start: Date; end: Date } {
  const startToday = localStartOfCalendarDay(now);
  const endYesterday = new Date(startToday.getTime() - 1);
  const startYesterday = localStartOfCalendarDay(endYesterday);
  return { start: startYesterday, end: endYesterday };
}

export function getAnalyticsPeriodRange(periodId: AnalyticsPeriodId): { start: Date; end: Date } {
  const now = new Date();
  switch (periodId) {
    case 'all':
      return { start: subMonths(now, 240), end: now };
    case 'today':
      return localTodayRange(now);
    case 'yesterday':
      return localYesterdayRange(now);
    case 'week':
      return { start: subDays(now, 7), end: now };
    case 'month':
      return { start: subDays(now, 30), end: now };
    case 'm3':
      return { start: subMonths(now, 3), end: now };
    case 'm6':
      return { start: subMonths(now, 6), end: now };
    case 'year':
      return { start: subMonths(now, 12), end: now };
    default:
      return { start: subMonths(now, 240), end: now };
  }
}

export function formatHourlyChartLabelsLocal(points: AnalyticsChartPoint[]): AnalyticsChartPoint[] {
  if (points.length === 0) return points;

  const parsedPoints = points.map((point) => {
    if (!point.bucketStartUtc) return { point, date: null as Date | null };
    const date = new Date(point.bucketStartUtc);
    return { point, date: Number.isNaN(date.getTime()) ? null : date };
  });

  const validDates = parsedPoints.map((entry) => entry.date).filter((date): date is Date => date != null);
  if (validDates.length === 0) return points;

  const firstDate = validDates[0]!;
  const lastDate = validDates[validDates.length - 1]!;
  const sameLocalDay =
    firstDate.getFullYear() === lastDate.getFullYear() &&
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getDate() === lastDate.getDate();

  return parsedPoints.map(({ point, date }) => {
    if (date == null) return point;
    const label = sameLocalDay ? format(date, 'HH:mm') : format(date, 'dd.MM HH:mm');
    return { ...point, label };
  });
}
