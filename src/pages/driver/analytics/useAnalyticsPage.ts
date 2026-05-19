import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '../../../api/axios';
import type { RideMapData } from '../../../components/RideRouteMap';
import { formatHourlyChartLabelsLocal, getAnalyticsPeriodRange } from './analyticsPeriod';
import type {
  AnalyticsPeriodId,
  AnalyticsResponse,
  DriverPresenceSettingsDto
} from './analyticsTypes';

export function useAnalyticsPage(routeDriverId?: string) {
  const isManagerView = routeDriverId != null && routeDriverId !== '';

  const [profileId, setProfileId] = useState<number | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriodId>('all');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [profitChartHovered, setProfitChartHovered] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [mapData, setMapData] = useState<RideMapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapLoadError, setMapLoadError] = useState('');
  const [viewedDriverCaption, setViewedDriverCaption] = useState<string | null>(null);

  const range = useMemo(() => getAnalyticsPeriodRange(period), [period]);

  useEffect(() => {
    if (isManagerView) {
      const parsedProfileId = Number(routeDriverId);
      if (!Number.isNaN(parsedProfileId)) {
        setProfileId(parsedProfileId);
      }
      setLoadingProfile(false);
      return;
    }

    const abortController = new AbortController();
    setLoadingProfile(true);
    setError('');

    void (async () => {
      try {
        const response = await api.get<DriverPresenceSettingsDto>('/presence/settings', {
          signal: abortController.signal
        });
        setProfileId(response.data.profileId);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(getApiErrorMessage(err, 'Не вдалося завантажити профіль.'));
        setProfileId(null);
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingProfile(false);
        }
      }
    })();

    return () => abortController.abort();
  }, [isManagerView, routeDriverId]);

  useEffect(() => {
    if (!isManagerView || profileId == null) {
      setViewedDriverCaption(null);
      return undefined;
    }

    const abortController = new AbortController();
    void (async () => {
      try {
        const response = await api.get<{ id: number; name: string; phoneNumber: string }>(
          `/drivers/${profileId}`,
          { signal: abortController.signal }
        );
        setViewedDriverCaption(`№${response.data.id} — ${response.data.name} (${response.data.phoneNumber})`);
      } catch {
        if (!abortController.signal.aborted) {
          setViewedDriverCaption(`№${profileId}`);
        }
      }
    })();

    return () => abortController.abort();
  }, [isManagerView, profileId]);

  useEffect(() => {
    if (profileId == null) return undefined;

    const abortController = new AbortController();
    setLoadingAnalytics(true);
    setError('');

    void (async () => {
      try {
        const { start, end } = range;
        const response = await api.get<AnalyticsResponse>(`/analytics/driver/${profileId}`, {
          params: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          },
          signal: abortController.signal
        });
        setAnalyticsData(response.data);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(getApiErrorMessage(err, 'Не вдалося завантажити аналітику.'));
        setAnalyticsData(null);
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingAnalytics(false);
        }
      }
    })();

    return () => abortController.abort();
  }, [profileId, range]);

  const ridesForMap = analyticsData?.ridesForMap ?? [];

  useEffect(() => {
    if (ridesForMap.length === 0) {
      setSelectedRideId(null);
      setMapData(null);
      return;
    }

    if (selectedRideId == null || !ridesForMap.some((ride) => ride.rideId === selectedRideId)) {
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

    let isCancelled = false;
    setMapLoading(true);
    setMapLoadError('');
    setMapData(null);

    void api
      .get<RideMapData>(`/analytics/driver/${profileId}/rides/${selectedRideId}/map`)
      .then((response) => {
        if (!isCancelled) {
          setMapData(response.data);
          setMapLoadError('');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setMapData(null);
          setMapLoadError(getApiErrorMessage(err, 'Не вдалося завантажити маршрут.'));
        }
      })
      .finally(() => {
        if (!isCancelled) setMapLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [profileId, selectedRideId]);

  const summary = analyticsData?.summary;
  const chartBucket: 'hour' | 'day' = analyticsData?.chartBucket === 'hour' ? 'hour' : 'day';
  const chartData = useMemo(() => {
    const rawChartData = analyticsData?.chartData ?? [];
    if (chartBucket !== 'hour') return rawChartData;
    return formatHourlyChartLabelsLocal(rawChartData);
  }, [analyticsData?.chartData, chartBucket]);

  const hasChartData = (summary?.totalRides ?? 0) > 0;
  const chartBottom = chartBucket === 'hour' ? 48 : 12;
  const chartMargin = { top: 8, right: 8, left: 0, bottom: chartBottom } as const;
  const xAxisTickInterval: number | 'preserveStartEnd' =
    chartBucket === 'hour' ? 0 : 'preserveStartEnd';
  const xAxisMinTickGap = chartBucket === 'hour' ? 0 : undefined;
  const xAxisTickProps =
    chartBucket === 'hour'
      ? { fill: '#94a3b8' as const, fontSize: 9 }
      : { fill: '#94a3b8' as const, fontSize: 11 };

  const awaitingAnalyticsSlice =
    profileId != null && !error && (loadingAnalytics || analyticsData === null);
  const statsLoading = loadingProfile || awaitingAnalyticsSlice;
  const chartsLoader = loadingProfile || (profileId == null && !error) || awaitingAnalyticsSlice;

  const periodSuffix = chartBucket === 'hour' ? ' за годинами' : ' за днями';
  const chartTitles = {
    profit: `Прибуток${periodSuffix}`,
    rides: `Поїздки${periodSuffix}`,
    transit: `Час у дорозі${periodSuffix}`,
    distance: `Проїхано км${periodSuffix}`,
    routesMap: `Маршрути поїздок${periodSuffix}`
  };

  return {
    isManagerView,
    routeDriverId,
    period,
    setPeriod,
    loadingProfile,
    loadingAnalytics,
    error,
    summary,
    chartData,
    chartBucket,
    hasChartData,
    chartMargin,
    xAxisTickInterval,
    xAxisMinTickGap,
    xAxisTickProps,
    statsLoading,
    chartsLoader,
    chartTitles,
    profitChartHovered,
    setProfitChartHovered,
    ridesForMap,
    selectedRideId,
    setSelectedRideId,
    mapData,
    mapLoading,
    mapLoadError,
    viewedDriverCaption
  };
}
