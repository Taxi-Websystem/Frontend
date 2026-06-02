import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { PAGE_CARD_CLASS } from '../../../styles/pageClasses';
import { useTheme } from '../../../theme/ThemeProvider';
import { getChartAxisLineColor } from '../../../theme/theme';
import { AnalyticsTooltipCursorEcho } from '../AnalyticsTooltipCursorEcho';
import { barActiveHighlight, barChartTooltipCursor, chartTooltipWrapperStyle, chartViewportClass } from './analyticsChartConfig';
import { AnalyticsCardTooltip, ChartEmptyState, ChartPanelLoading, type ChartTooltipRow } from './analyticsChartUi';
import type { AnalyticsChartAxisProps } from './analyticsChartAxis';
import type { AnalyticsChartPoint } from './analyticsTypes';

interface AnalyticsBarChartPanelProps extends AnalyticsChartAxisProps {
  title: string;
  titleIcon: LucideIcon;
  chartsLoader: boolean;
  hasChartData: boolean;
  dataKey: keyof AnalyticsChartPoint;
  yAxisWidth: number;
  allowDecimals?: boolean;
  yAxisTickFormatter?: (value: number) => string;
  tooltipLabel: string;
  formatTooltipValue: (value: number) => string;
  barName: string;
}

export function AnalyticsBarChartPanel({
  title,
  titleIcon: TitleIcon,
  chartsLoader,
  hasChartData,
  chartData,
  chartBucket,
  chartMargin,
  xAxisTickInterval,
  xAxisMinTickGap,
  xAxisTickProps,
  dataKey,
  yAxisWidth,
  allowDecimals,
  yAxisTickFormatter,
  tooltipLabel,
  formatTooltipValue,
  barName
}: AnalyticsBarChartPanelProps) {
  const { theme } = useTheme();
  const axisLineColor = getChartAxisLineColor(theme);

  return (
    <section className={PAGE_CARD_CLASS}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <TitleIcon className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
        {title}
      </h3>
      {chartsLoader ? (
        <ChartPanelLoading />
      ) : hasChartData ? (
        <div className={chartViewportClass}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={xAxisTickProps}
                axisLine={{ stroke: axisLineColor }}
                angle={chartBucket === 'hour' ? -38 : 0}
                textAnchor={chartBucket === 'hour' ? 'end' : 'middle'}
                height={chartBucket === 'hour' ? 54 : 28}
                interval={xAxisTickInterval}
                minTickGap={xAxisMinTickGap}
              />
              <YAxis
                allowDecimals={allowDecimals}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: axisLineColor }}
                width={yAxisWidth}
                tickFormatter={yAxisTickFormatter}
              />
              <Tooltip
                wrapperStyle={chartTooltipWrapperStyle}
                animationDuration={280}
                animationEasing="ease-out"
                cursor={barChartTooltipCursor}
                content={(props) => (
                  <AnalyticsCardTooltip
                    active={props.active}
                    label={props.label != null ? String(props.label) : undefined}
                    payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                    valueLabel={tooltipLabel}
                    formatValue={formatTooltipValue}
                  />
                )}
              />
              <Bar
                dataKey={dataKey}
                name={barName}
                fill="#EAB308"
                radius={[6, 6, 0, 0]}
                activeBar={barActiveHighlight}
              />
              <AnalyticsTooltipCursorEcho variant="bar" categoryCount={chartData.length} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState />
      )}
    </section>
  );
}
