import type { AnalyticsChartPoint } from './analyticsTypes';

export interface AnalyticsChartAxisProps {
  chartData: AnalyticsChartPoint[];
  chartBucket: 'hour' | 'day';
  chartMargin: { top: number; right: number; left: number; bottom: number };
  xAxisTickInterval: number | 'preserveStartEnd';
  xAxisMinTickGap: number | undefined;
  xAxisTickProps: { fill: '#94a3b8'; fontSize: number };
}
