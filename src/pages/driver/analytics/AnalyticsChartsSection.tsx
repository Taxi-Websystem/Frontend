import { Clock, ListOrdered, Navigation } from 'lucide-react';
import { formatTransitAxisTick, formatTransitSeconds } from '../../../utils/transitTime';
import { AnalyticsBarChartPanel } from './AnalyticsBarChartPanel';
import { AnalyticsProfitChartPanel } from './AnalyticsProfitChartPanel';
import type { AnalyticsChartPoint } from './analyticsTypes';

export interface AnalyticsChartsSectionProps {
  chartsLoader: boolean;
  hasChartData: boolean;
  chartData: AnalyticsChartPoint[];
  chartBucket: 'hour' | 'day';
  chartMargin: { top: number; right: number; left: number; bottom: number };
  xAxisTickInterval: number | 'preserveStartEnd';
  xAxisMinTickGap: number | undefined;
  xAxisTickProps: { fill: '#94a3b8'; fontSize: number };
  chartTitles: {
    profit: string;
    rides: string;
    transit: string;
    distance: string;
  };
  profitChartHovered: boolean;
  onProfitChartHoverChange: (hovered: boolean) => void;
}

export function AnalyticsChartsSection({
  chartsLoader,
  hasChartData,
  chartData,
  chartBucket,
  chartMargin,
  xAxisTickInterval,
  xAxisMinTickGap,
  xAxisTickProps,
  chartTitles,
  profitChartHovered,
  onProfitChartHoverChange
}: AnalyticsChartsSectionProps) {
  const axisProps = {
    chartData,
    chartBucket,
    chartMargin,
    xAxisTickInterval,
    xAxisMinTickGap,
    xAxisTickProps
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <AnalyticsProfitChartPanel
        title={chartTitles.profit}
        chartsLoader={chartsLoader}
        hasChartData={hasChartData}
        profitChartHovered={profitChartHovered}
        onHoverChange={onProfitChartHoverChange}
        {...axisProps}
      />

      <AnalyticsBarChartPanel
        title={chartTitles.rides}
        titleIcon={ListOrdered}
        chartsLoader={chartsLoader}
        hasChartData={hasChartData}
        dataKey="ridesCount"
        yAxisWidth={36}
        allowDecimals={false}
        tooltipLabel="Поїздок"
        formatTooltipValue={(value) => String(Math.round(value))}
        barName="Поїздки"
        {...axisProps}
      />

      <AnalyticsBarChartPanel
        title={chartTitles.distance}
        titleIcon={Navigation}
        chartsLoader={chartsLoader}
        hasChartData={hasChartData}
        dataKey="distanceKmTotal"
        yAxisWidth={44}
        tooltipLabel="Кілометри"
        formatTooltipValue={(value) => `${Number(value).toFixed(2)} км`}
        barName="Км"
        {...axisProps}
      />

      <AnalyticsBarChartPanel
        title={chartTitles.transit}
        titleIcon={Clock}
        chartsLoader={chartsLoader}
        hasChartData={hasChartData}
        dataKey="transitSecondsTotal"
        yAxisWidth={48}
        yAxisTickFormatter={formatTransitAxisTick}
        tooltipLabel="Час у дорозі"
        formatTooltipValue={formatTransitSeconds}
        barName="Час у дорозі"
        {...axisProps}
      />
    </div>
  );
}
