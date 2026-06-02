import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart } from 'lucide-react';
import { PAGE_CARD_CLASS } from '../../../styles/pageClasses';
import { useTheme } from '../../../theme/ThemeProvider';
import { getChartActiveDotFill, getChartAxisLineColor } from '../../../theme/theme';
import { AnalyticsTooltipCursorEcho } from '../AnalyticsTooltipCursorEcho';
import {
  areaChartTooltipCursor,
  areaLineGlowStyle,
  areaLineGlowStyleInactive,
  chartTransitionEasing,
  chartTooltipWrapperStyle,
  chartViewportClass
} from './analyticsChartConfig';
import { AnalyticsCardTooltip, ChartEmptyState, ChartPanelLoading, type ChartTooltipRow } from './analyticsChartUi';
import type { AnalyticsChartAxisProps } from './analyticsChartAxis';

interface AnalyticsProfitChartPanelProps extends AnalyticsChartAxisProps {
  title: string;
  chartsLoader: boolean;
  hasChartData: boolean;
  profitChartHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}

export function AnalyticsProfitChartPanel({
  title,
  chartsLoader,
  hasChartData,
  chartData,
  chartBucket,
  chartMargin,
  xAxisTickInterval,
  xAxisMinTickGap,
  xAxisTickProps,
  profitChartHovered,
  onHoverChange
}: AnalyticsProfitChartPanelProps) {
  const { theme } = useTheme();
  const axisLineColor = getChartAxisLineColor(theme);

  return (
    <section className={PAGE_CARD_CLASS}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <LineChart className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
        {title}
      </h3>
      {chartsLoader ? (
        <ChartPanelLoading />
      ) : hasChartData ? (
        <div
          className={chartViewportClass}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EAB308" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#EAB308" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: axisLineColor }}
                width={44}
              />
              <Tooltip
                wrapperStyle={chartTooltipWrapperStyle}
                animationDuration={280}
                animationEasing="ease-out"
                cursor={areaChartTooltipCursor}
                content={(props) => (
                  <AnalyticsCardTooltip
                    active={props.active}
                    label={props.label != null ? String(props.label) : undefined}
                    payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                    valueLabel="Прибуток"
                    formatValue={(value) => `${value.toFixed(2)} грн`}
                  />
                )}
              />
              <AnalyticsTooltipCursorEcho variant="line" />
              <Area
                type="monotone"
                dataKey="profit"
                name="Прибуток"
                stroke="#EAB308"
                strokeWidth={2}
                fill="url(#profitFill)"
                connectNulls
                style={{
                  transition: `filter 280ms ${chartTransitionEasing}`,
                  ...(profitChartHovered ? areaLineGlowStyle : areaLineGlowStyleInactive)
                }}
                activeDot={{
                  r: 6,
                  stroke: '#EAB308',
                  strokeWidth: 2,
                  fill: getChartActiveDotFill(theme)
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState />
      )}
    </section>
  );
}
