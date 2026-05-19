import type { ReactNode } from 'react';
import { Loader2, PieChart, Route } from 'lucide-react';
import { chartViewportClass, mapViewportClass, tooltipCardClass } from './analyticsChartConfig';
import type { AnalyticsChartPoint } from './analyticsTypes';

export type ChartTooltipRow = { value?: number; dataKey?: string; payload?: AnalyticsChartPoint };

export function AnalyticsStatMiniCard(icon: ReactNode, value: ReactNode, label: string) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">{value}</p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCardTooltip({
  active,
  label,
  payload,
  valueLabel,
  formatValue
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipRow[];
  valueLabel: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  const metricValue = payload[0]?.value;
  if (metricValue === undefined) return null;

  return (
    <div className={tooltipCardClass}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">
        {valueLabel}: <span className="font-semibold text-[#EAB308]">{formatValue(metricValue)}</span>
      </p>
    </div>
  );
}

export function ChartEmptyState() {
  return (
    <div className={`${chartViewportClass} flex flex-col items-center justify-center px-6 text-center`}>
      <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
        <PieChart className="h-7 w-7" strokeWidth={2} />
      </div>
      <p className="text-sm font-medium text-slate-400/90">Немає даних за обраний період.</p>
      <p className="mt-2 max-w-xs text-xs text-slate-500/80">Спробуйте інший діапазон дат.</p>
    </div>
  );
}

export function ChartPanelLoading({ viewportClass = chartViewportClass }: { viewportClass?: string }) {
  return (
    <div className={`${viewportClass} flex items-center justify-center text-slate-400`}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
    </div>
  );
}

function MapPanelFrame({ children, withTabs = false }: { children: ReactNode; withTabs?: boolean }) {
  return (
    <div className="flex flex-col">
      {withTabs ? (
        <div className="mb-3 flex flex-wrap gap-2" aria-hidden>
          <span className="rounded-full border border-transparent px-3 py-2 text-xs font-semibold opacity-0 sm:text-sm">
            Оригінальний
          </span>
          <span className="rounded-full border border-transparent px-3 py-2 text-xs font-semibold opacity-0 sm:text-sm">
            Реальний
          </span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function MapChartEmptyState({ withTabs = false }: { withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div className={`${mapViewportClass} flex flex-col items-center justify-center px-6 text-center`}>
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <Route className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">Немає даних за обраний період.</p>
        <p className="mt-2 max-w-xs text-xs text-slate-500/80">Спробуйте інший діапазон дат.</p>
      </div>
    </MapPanelFrame>
  );
}

export function MapChartPanelLoading({ withTabs = false }: { withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div className={`${mapViewportClass} flex items-center justify-center text-slate-400`}>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    </MapPanelFrame>
  );
}

export function MapPanelError({ message, withTabs = false }: { message: string; withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div className={`${mapViewportClass} flex flex-col items-center justify-center px-6 text-center`}>
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <Route className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">{message}</p>
      </div>
    </MapPanelFrame>
  );
}
