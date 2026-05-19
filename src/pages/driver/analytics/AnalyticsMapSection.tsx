import { Route } from 'lucide-react';
import RideRouteMap, { type RideMapData } from '../../../components/RideRouteMap';
import { PAGE_CARD_CLASS } from '../../../styles/pageClasses';
import { formatRideMapOptionLabel } from './analyticsFormat';
import {
  MapChartEmptyState,
  MapChartPanelLoading,
  MapPanelError
} from './analyticsChartUi';
import type { RideMapSummary } from './analyticsTypes';

interface AnalyticsMapSectionProps {
  chartsLoader: boolean;
  ridesForMap: RideMapSummary[];
  selectedRideId: number | null;
  onSelectedRideIdChange: (rideId: number) => void;
  mapLoading: boolean;
  mapLoadError: string;
  mapData: RideMapData | null;
  title: string;
}

export function AnalyticsMapSection({
  chartsLoader,
  ridesForMap,
  selectedRideId,
  onSelectedRideIdChange,
  mapLoading,
  mapLoadError,
  mapData,
  title
}: AnalyticsMapSectionProps) {
  return (
    <section className={PAGE_CARD_CLASS}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Route className="h-7 w-7 shrink-0 text-[#EAB308]" strokeWidth={2} aria-hidden />
        {title}
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
              onChange={(event) => onSelectedRideIdChange(Number(event.target.value))}
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
  );
}
