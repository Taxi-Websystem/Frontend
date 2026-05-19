import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  Clock,
  LineChart,
  ListOrdered,
  Loader2,
  Navigation,
  PieChart,
  Route,
  Star
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../../api/axios';
import { formatLocalDateTime } from '../../utils/datetime';
import RideRouteMap, { type RideMapData } from '../../components/RideRouteMap';
import { AnalyticsTooltipCursorEcho } from './AnalyticsTooltipCursorEcho';

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';

/** Той самий easing, що й у кнопок (≈ material standard). */
const chartTransitionEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Як картки: лише `rounded-3xl` + `border-white/10` + тінь; без ring / backdrop-blur (щоб не було «подвійної» сірої обводки). */
const tooltipCardClass =
  'pointer-events-none z-[2000] rounded-3xl border border-white/10 bg-[#0F172A]/95 px-4 py-3 text-sm text-slate-200 shadow-2xl';

/** Підсвітка активного стовпчика — заливка; glow анімується через CSS (див. .analytics-recharts). */
const barActiveHighlight = {
  fill: '#EAB308'
};

/** Смуга категорії (комірка) — ті самі плавні переходи, що й курсор area: без remount, щоб не «різало» при зміні колонки. */
const chartCursorTransition = `d 260ms ${chartTransitionEasing}, stroke 260ms ${chartTransitionEasing}, stroke-width 260ms ${chartTransitionEasing}, stroke-opacity 260ms ${chartTransitionEasing}, fill 260ms ${chartTransitionEasing}, fill-opacity 260ms ${chartTransitionEasing}, opacity 260ms ${chartTransitionEasing}`;

const barChartTooltipCursor = {
  fill: 'rgba(234, 179, 8, 0.08)',
  stroke: '#EAB308',
  strokeWidth: 2,
  style: {
    transition: chartCursorTransition
  }
};

/** Вертикальний курсор — колір як лінія графіка. */
const areaChartTooltipCursor = {
  stroke: '#EAB308',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  style: {
    transition: chartCursorTransition
  }
};

const chartViewportClass =
  'h-[280px] w-full shrink-0 overflow-visible rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm';

const mapViewportClass =
  'h-[320px] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm';

/** Світіння лінії/заливки area (hover) — ті самі drop-shadow, що й у стовпчиків. */
const areaLineGlowStyle = {
  filter:
    'drop-shadow(0 0 6px rgba(234, 179, 8, 0.78)) drop-shadow(0 10px 32px rgba(234, 179, 8, 0.32))'
} as const;

/** Для плавного transition filter між станами. */
const areaLineGlowStyleInactive = {
  filter:
    'drop-shadow(0 0 0px rgba(234, 179, 8, 0)) drop-shadow(0 0 0px rgba(234, 179, 8, 0))'
} as const;

type PeriodId = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'm3' | 'm6' | 'year';

interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  currentStatus: string;
  isManualControlAllowed: boolean;
  profileId: number;
}

interface AnalyticsSummary {
  totalProfit: number;
  totalRides: number;
  averageRideRating?: number | null;
}

interface ChartPoint {
  label: string;
  /** ISO UTC початок годинного бакета з API (hour mode). */
  bucketStartUtc?: string | null;
  profit: number;
  ridesCount: number;
  transitSecondsTotal: number;
  distanceKmTotal: number;
}

interface RideMapSummary {
  rideId: number;
  fromAddress: string;
  toAddress: string;
  endTime: string;
}

function formatRideMapOptionLabel(ride: RideMapSummary): string {
  const when = formatLocalDateTime(ride.endTime);
  const suffix = when ? ` (${when})` : '';
  return `№${ride.rideId} — ${ride.fromAddress} → ${ride.toAddress}${suffix}`;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  chartData: ChartPoint[];
  chartBucket?: 'hour' | 'day';
  ridesForMap?: RideMapSummary[];
}

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'all', label: 'Весь час' },
  { id: 'today', label: 'Сьогодні' },
  { id: 'yesterday', label: 'Вчора' },
  { id: 'week', label: 'Тиждень' },
  { id: 'month', label: 'Місяць' },
  { id: 'm3', label: '3 міс.' },
  { id: 'm6', label: '6 міс.' },
  { id: 'year', label: 'Рік' }
];

function localStartOfCalendarDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
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

/** Підписи годин на осі: локальний час браузера; dd.MM лише якщо діапазон перетинає дві локальні доби. */
function formatHourlyChartLabelsLocal(points: ChartPoint[]): ChartPoint[] {
  if (points.length === 0) return points;
  const parsed = points.map((p) => {
    if (!p.bucketStartUtc) return { p, d: null as Date | null };
    const d = new Date(p.bucketStartUtc);
    return { p, d: Number.isNaN(d.getTime()) ? null : d };
  });
  const dates = parsed.map((x) => x.d).filter((d): d is Date => d != null);
  if (dates.length === 0) return points;
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const sameLocalDay =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth() &&
    first.getDate() === last.getDate();
  return parsed.map(({ p, d }) => {
    if (d == null) return p;
    const label = sameLocalDay ? format(d, 'HH:mm') : format(d, 'dd.MM HH:mm');
    return { ...p, label };
  });
}

function getPeriodRange(id: PeriodId): { start: Date; end: Date } {
  const now = new Date();
  switch (id) {
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

function analyticsStatMiniCard(icon: ReactNode, value: ReactNode, label: string) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          {icon}
        </div>
        <div>
          <p className="flex min-h-9 items-center text-2xl font-bold tabular-nums text-white">
            {value}
          </p>
          <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatTransitSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} год ${minutes} хв`;
  return `${minutes} хв`;
}

/** Короткі підписи осі Y для секунд (графік часу). */
function formatTransitAxisTick(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0';
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)} г`;
  return `${Math.round(seconds / 60)} хв`;
}

type ChartTooltipRow = { value?: number; dataKey?: string; payload?: ChartPoint };

function AnalyticsCardTooltip({
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
  formatValue: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  if (v === undefined) return null;
  return (
    <div className={tooltipCardClass}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">
        {valueLabel}: <span className="font-semibold text-[#EAB308]">{formatValue(v)}</span>
      </p>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div
      className={`${chartViewportClass} flex flex-col items-center justify-center px-6 text-center`}
    >
      <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
        <PieChart className="h-7 w-7" strokeWidth={2} />
      </div>
      <p className="text-sm font-medium text-slate-400/90">Немає даних за обраний період.</p>
      <p className="mt-2 max-w-xs text-xs text-slate-500/80">Спробуйте інший діапазон дат.</p>
    </div>
  );
}

function ChartPanelLoading({ viewportClass = chartViewportClass }: { viewportClass?: string }) {
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

function MapChartEmptyState({ withTabs = false }: { withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div
        className={`${mapViewportClass} flex flex-col items-center justify-center px-6 text-center`}
      >
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <Route className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">Немає даних за обраний період.</p>
        <p className="mt-2 max-w-xs text-xs text-slate-500/80">Спробуйте інший діапазон дат.</p>
      </div>
    </MapPanelFrame>
  );
}

function MapChartPanelLoading({ withTabs = false }: { withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div className={`${mapViewportClass} flex items-center justify-center text-slate-400`}>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    </MapPanelFrame>
  );
}

function MapPanelError({ message, withTabs = false }: { message: string; withTabs?: boolean }) {
  return (
    <MapPanelFrame withTabs={withTabs}>
      <div
        className={`${mapViewportClass} flex flex-col items-center justify-center px-6 text-center`}
      >
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <Route className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">{message}</p>
      </div>
    </MapPanelFrame>
  );
}

export default function AnalyticsPage() {
  const { driverProfileId: routeDriverId } = useParams<{ driverProfileId?: string }>();
  const isManagerView = routeDriverId != null && routeDriverId !== '';

  const [profileId, setProfileId] = useState<number | null>(null);
  const [period, setPeriod] = useState<PeriodId>('all');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [profitChartHovered, setProfitChartHovered] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [mapData, setMapData] = useState<RideMapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapLoadError, setMapLoadError] = useState('');
  const [viewedDriverCaption, setViewedDriverCaption] = useState<string | null>(null);

  const range = useMemo(() => getPeriodRange(period), [period]);

  useEffect(() => {
    if (isManagerView) {
      const parsed = Number(routeDriverId);
      if (!Number.isNaN(parsed)) {
        setProfileId(parsed);
      }
      setLoadingProfile(false);
      return;
    }

    const ac = new AbortController();
    setLoadingProfile(true);
    setError('');
    void (async () => {
      try {
        const res = await api.get<DriverPresenceSettingsDto>('/presence/settings', {
          signal: ac.signal
        });
        setProfileId(res.data.profileId);
      } catch (err) {
        if (ac.signal.aborted) return;
        setError(getApiErrorMessage(err, 'Не вдалося завантажити профіль.'));
        setProfileId(null);
      } finally {
        if (!ac.signal.aborted) {
          setLoadingProfile(false);
        }
      }
    })();
    return () => ac.abort();
  }, [isManagerView, routeDriverId]);

  useEffect(() => {
    if (!isManagerView || profileId == null) {
      setViewedDriverCaption(null);
      return undefined;
    }

    const ac = new AbortController();
    void (async () => {
      try {
        const res = await api.get<{ id: number; name: string; phoneNumber: string }>(
          `/drivers/${profileId}`,
          { signal: ac.signal }
        );
        setViewedDriverCaption(`№${res.data.id} — ${res.data.name} (${res.data.phoneNumber})`);
      } catch {
        if (!ac.signal.aborted) {
          setViewedDriverCaption(`№${profileId}`);
        }
      }
    })();

    return () => ac.abort();
  }, [isManagerView, profileId]);

  useEffect(() => {
    if (profileId == null) return undefined;
    const ac = new AbortController();
    setLoadingAnalytics(true);
    setError('');
    void (async () => {
      try {
        const { start, end } = range;
        const res = await api.get<AnalyticsResponse>('/analytics/driver/' + profileId, {
          params: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          },
          signal: ac.signal
        });
        setData(res.data);
      } catch (err) {
        if (ac.signal.aborted) return;
        setError(getApiErrorMessage(err, 'Не вдалося завантажити аналітику.'));
        setData(null);
      } finally {
        if (!ac.signal.aborted) {
          setLoadingAnalytics(false);
        }
      }
    })();
    return () => ac.abort();
  }, [profileId, range]);

  const ridesForMap = data?.ridesForMap ?? [];

  useEffect(() => {
    if (ridesForMap.length === 0) {
      setSelectedRideId(null);
      setMapData(null);
      return;
    }
    if (selectedRideId == null || !ridesForMap.some((r) => r.rideId === selectedRideId)) {
      setSelectedRideId(ridesForMap[0].rideId);
    }
  }, [ridesForMap, selectedRideId]);

  useEffect(() => {
    if (profileId == null || selectedRideId == null) {
      setMapData(null);
      setMapLoadError('');
      setMapLoading(false);
      return;
    }

    let cancelled = false;
    setMapLoading(true);
    setMapLoadError('');
    setMapData(null);

    void api
      .get<RideMapData>(`/analytics/driver/${profileId}/rides/${selectedRideId}/map`)
      .then((res) => {
        if (!cancelled) {
          setMapData(res.data);
          setMapLoadError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMapData(null);
          setMapLoadError(getApiErrorMessage(err, 'Не вдалося завантажити маршрут.'));
        }
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId, selectedRideId]);

  const summary = data?.summary;
  const chartBucket: 'hour' | 'day' = data?.chartBucket === 'hour' ? 'hour' : 'day';
  const chartData = useMemo(() => {
    const raw = data?.chartData ?? [];
    if (chartBucket !== 'hour') return raw;
    return formatHourlyChartLabelsLocal(raw);
  }, [data?.chartData, chartBucket]);
  const hasChartData = (summary?.totalRides ?? 0) > 0;
  const chartBottom = chartBucket === 'hour' ? 48 : 12;
  const chartMargin = { top: 8, right: 8, left: 0, bottom: chartBottom } as const;
  const xAxisTickInterval = chartBucket === 'hour' ? 0 : 'preserveStartEnd';
  const xAxisMinTickGap = chartBucket === 'hour' ? 0 : undefined;
  const xAxisTickProps =
    chartBucket === 'hour'
      ? { fill: '#94a3b8' as const, fontSize: 9 }
      : { fill: '#94a3b8' as const, fontSize: 11 };

  const awaitingAnalyticsSlice =
    profileId != null && !error && (loadingAnalytics || data === null);

  const statsLoading = loadingProfile || awaitingAnalyticsSlice;

  const chartsLoader =
    loadingProfile || (profileId == null && !error) || awaitingAnalyticsSlice;

  const profitTitle = 'Прибуток ' + (chartBucket === 'hour' ? ' за годинами' : ' за днями');
  const ridesTitle = 'Поїздки ' + (chartBucket === 'hour' ? ' за годинами' : ' за днями');
  const transitTitle = 'Час у дорозі ' + (chartBucket === 'hour' ? ' за годинами' : ' за днями');
  const kmTitle = 'Проїхано км ' + (chartBucket === 'hour' ? ' за годинами' : ' за днями');
  const routesMapTitle =
    'Маршрути поїздок' + (chartBucket === 'hour' ? ' за годинами' : ' за днями');

  const tooltipWrapperStyle = {
    zIndex: 2000,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    outline: 'none'
  } as const;

  return (
    <div className="analytics-recharts space-y-6">
      <section className={pageCardClass}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
              <BarChart3 className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Аналітика</h2>
              <p className="mt-1 text-sm text-slate-400">
                {isManagerView
                  ? `Перегляд роботи водія ${viewedDriverCaption ?? `№${routeDriverId}`} за вибраний період.`
                  : 'Перегляд вашої роботи за вибраний період.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loadingProfile || loadingAnalytics}
                onClick={() => setPeriod(p.id)}
                className={`manager-accent-glow manager-primary-btn rounded-full px-3 py-2 text-xs font-semibold transition-[color,filter,box-shadow,opacity] duration-300 sm:text-sm ${
                  period === p.id
                    ? 'border-[#EAB308]/78 bg-[#EAB308]/15 text-[#EAB308] hover:text-slate-200 focus-visible:text-slate-200'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:text-[#EAB308] focus-visible:text-[#EAB308]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="field-error-box mb-4">{error}</div> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {analyticsStatMiniCard(
            <CircleDollarSign className="h-7 w-7" strokeWidth={2} />,
            statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : summary != null ? (
              <>
                <span className="tabular-nums text-[#EAB308]">{summary.totalProfit.toFixed(2)}</span>
              </>
            ) : (
              '—'
            ),
            'Прибуток (грн)'
          )}
          {analyticsStatMiniCard(
            <CarFront className="h-7 w-7" strokeWidth={2} />,
            statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : summary != null ? (
              summary.totalRides
            ) : (
              '—'
            ),
            'Поїздки'
          )}
          {analyticsStatMiniCard(
            <Star className="h-7 w-7" strokeWidth={2} />,
            statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : summary != null && summary.averageRideRating != null ? (
              <>
                <span className="tabular-nums">{summary.averageRideRating.toFixed(2)}</span>
              </>
            ) : (
              '—'
            ),
            'Рейтинг'
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className={pageCardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <LineChart className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
            {profitTitle}
          </h3>
          {chartsLoader ? (
            <ChartPanelLoading />
          ) : hasChartData ? (
            <div
              className={chartViewportClass}
              onMouseEnter={() => setProfitChartHovered(true)}
              onMouseLeave={() => setProfitChartHovered(false)}
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
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    angle={chartBucket === 'hour' ? -38 : 0}
                    textAnchor={chartBucket === 'hour' ? 'end' : 'middle'}
                    height={chartBucket === 'hour' ? 54 : 28}
                    interval={xAxisTickInterval}
                    minTickGap={xAxisMinTickGap}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={44} />
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle}
                    animationDuration={280}
                    animationEasing="ease-out"
                    cursor={areaChartTooltipCursor}
                    content={(props) => (
                      <AnalyticsCardTooltip
                        active={props.active}
                        label={props.label != null ? String(props.label) : undefined}
                        payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                        valueLabel="Прибуток"
                        formatValue={(v) => `${v.toFixed(2)} грн`}
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
                      fill: '#0F172A'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmptyState />
          )}
        </section>

        <section className={pageCardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <ListOrdered className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
            {ridesTitle}
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
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    angle={chartBucket === 'hour' ? -38 : 0}
                    textAnchor={chartBucket === 'hour' ? 'end' : 'middle'}
                    height={chartBucket === 'hour' ? 54 : 28}
                    interval={xAxisTickInterval}
                    minTickGap={xAxisMinTickGap}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={36} />
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle}
                    animationDuration={280}
                    animationEasing="ease-out"
                    cursor={barChartTooltipCursor}
                    content={(props) => (
                      <AnalyticsCardTooltip
                        active={props.active}
                        label={props.label != null ? String(props.label) : undefined}
                        payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                        valueLabel="Поїздок"
                        formatValue={(v) => String(Math.round(v))}
                      />
                    )}
                  />
                  <Bar
                    dataKey="ridesCount"
                    name="Поїздки"
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

        <section className={pageCardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Navigation className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
            {kmTitle}
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
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    angle={chartBucket === 'hour' ? -38 : 0}
                    textAnchor={chartBucket === 'hour' ? 'end' : 'middle'}
                    height={chartBucket === 'hour' ? 54 : 28}
                    interval={xAxisTickInterval}
                    minTickGap={xAxisMinTickGap}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={44} />
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle}
                    animationDuration={280}
                    animationEasing="ease-out"
                    cursor={barChartTooltipCursor}
                    content={(props) => (
                      <AnalyticsCardTooltip
                        active={props.active}
                        label={props.label != null ? String(props.label) : undefined}
                        payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                        valueLabel="Кілометри"
                        formatValue={(v) => `${Number(v).toFixed(2)} км`}
                      />
                    )}
                  />
                  <Bar
                    dataKey="distanceKmTotal"
                    name="Км"
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

        <section className={pageCardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
            {transitTitle}
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
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    angle={chartBucket === 'hour' ? -38 : 0}
                    textAnchor={chartBucket === 'hour' ? 'end' : 'middle'}
                    height={chartBucket === 'hour' ? 54 : 28}
                    interval={xAxisTickInterval}
                    minTickGap={xAxisMinTickGap}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    width={48}
                    tickFormatter={(v: number) => formatTransitAxisTick(v)}
                  />
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle}
                    animationDuration={280}
                    animationEasing="ease-out"
                    cursor={barChartTooltipCursor}
                    content={(props) => (
                      <AnalyticsCardTooltip
                        active={props.active}
                        label={props.label != null ? String(props.label) : undefined}
                        payload={props.payload as unknown as ChartTooltipRow[] | undefined}
                        valueLabel="Час у дорозі"
                        formatValue={(v) => formatTransitSeconds(v)}
                      />
                    )}
                  />
                  <Bar
                    dataKey="transitSecondsTotal"
                    name="Час у дорозі"
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
      </div>

      <section className={pageCardClass}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Route className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
          {routesMapTitle}
        </h3>
        {chartsLoader ? (
          <MapChartPanelLoading />
        ) : ridesForMap.length === 0 ? (
          <MapChartEmptyState />
        ) : (
          <>
            <label className="mb-4 block text-sm font-medium text-slate-300">
              Оберіть поїздку
              <select
                value={selectedRideId ?? ''}
                onChange={(event) => setSelectedRideId(Number(event.target.value))}
                className="field-select mt-2 w-full"
              >
                {ridesForMap.map((ride) => (
                  <option key={ride.rideId} value={ride.rideId}>
                    {formatRideMapOptionLabel(ride)}
                  </option>
                ))}
              </select>
            </label>
            {mapLoading ? (
              <MapChartPanelLoading withTabs />
            ) : mapLoadError ? (
              <MapPanelError message={mapLoadError} withTabs />
            ) : mapData ? (
              <RideRouteMap data={mapData} />
            ) : (
              <MapChartEmptyState withTabs />
            )}
          </>
        )}
      </section>
    </div>
  );
}
