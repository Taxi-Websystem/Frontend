import { BarChart3, CarFront, CircleDollarSign, Loader2, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { AnalyticsChartsSection } from './analytics/AnalyticsChartsSection';
import { AnalyticsMapSection } from './analytics/AnalyticsMapSection';
import { AnalyticsStatMiniCard } from './analytics/analyticsChartUi';
import { ANALYTICS_PERIODS } from './analytics/analyticsTypes';
import { useAnalyticsPage } from './analytics/useAnalyticsPage';

export default function AnalyticsPage() {
  const { driverProfileId: routeDriverId } = useParams<{ driverProfileId?: string }>();
  const viewState = useAnalyticsPage(routeDriverId);

  return (
    <div className="analytics-recharts space-y-6">
      <section className={PAGE_CARD_CLASS}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <BarChart3 className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Аналітика</h2>
              <p className="mt-1 text-sm text-slate-400">
                {viewState.isManagerView
                  ? `Перегляд роботи водія ${viewState.viewedDriverCaption ?? `№${routeDriverId}`} за вибраний період.`
                  : 'Перегляд вашої роботи за вибраний період.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ANALYTICS_PERIODS.map((periodOption) => (
              <button
                key={periodOption.id}
                type="button"
                disabled={viewState.loadingProfile || viewState.loadingAnalytics}
                onClick={() => viewState.setPeriod(periodOption.id)}
                className={`manager-accent-glow manager-primary-btn rounded-full px-3 py-2 text-xs font-semibold transition-[color,filter,box-shadow,opacity] duration-300 sm:text-sm ${
                  viewState.period === periodOption.id
                    ? 'border-[#EAB308]/78 bg-[#EAB308]/15 text-[#EAB308] hover:text-slate-200 focus-visible:text-slate-200'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:text-[#EAB308] focus-visible:text-[#EAB308]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {periodOption.label}
              </button>
            ))}
          </div>
        </div>

        {viewState.error ? <div className="field-error-box mb-4">{viewState.error}</div> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {AnalyticsStatMiniCard(
            <CircleDollarSign className="h-7 w-7" strokeWidth={2} />,
            viewState.statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : viewState.summary != null ? (
              <span className="tabular-nums text-[#EAB308]">{viewState.summary.totalProfit.toFixed(2)}</span>
            ) : (
              '—'
            ),
            'Прибуток (грн)'
          )}
          {AnalyticsStatMiniCard(
            <CarFront className="h-7 w-7" strokeWidth={2} />,
            viewState.statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : viewState.summary != null ? (
              viewState.summary.totalRides
            ) : (
              '—'
            ),
            'Поїздки'
          )}
          {AnalyticsStatMiniCard(
            <Star className="h-7 w-7" strokeWidth={2} />,
            viewState.statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : viewState.summary != null && viewState.summary.averageRideRating != null ? (
              <span className="tabular-nums">{viewState.summary.averageRideRating.toFixed(2)}</span>
            ) : (
              '—'
            ),
            'Рейтинг'
          )}
        </div>
      </section>

      <AnalyticsChartsSection
        chartsLoader={viewState.chartsLoader}
        hasChartData={viewState.hasChartData}
        chartData={viewState.chartData}
        chartBucket={viewState.chartBucket}
        chartMargin={viewState.chartMargin}
        xAxisTickInterval={viewState.xAxisTickInterval}
        xAxisMinTickGap={viewState.xAxisMinTickGap}
        xAxisTickProps={viewState.xAxisTickProps}
        chartTitles={viewState.chartTitles}
        profitChartHovered={viewState.profitChartHovered}
        onProfitChartHoverChange={viewState.setProfitChartHovered}
      />

      <AnalyticsMapSection
        chartsLoader={viewState.chartsLoader}
        ridesForMap={viewState.ridesForMap}
        selectedRideId={viewState.selectedRideId}
        onSelectedRideIdChange={viewState.setSelectedRideId}
        mapLoading={viewState.mapLoading}
        mapLoadError={viewState.mapLoadError}
        mapData={viewState.mapData}
        title={viewState.chartTitles.routesMap}
      />
    </div>
  );
}
