import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Loader2 } from 'lucide-react';
import { fetchDrivingRouteGeometry } from '../utils/geo';

const defaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

/** Колір лінії маршруту збігається зі стандартними маркерами Leaflet. */
const ROUTE_LINE_COLOR = '#2A81CB';

export interface RideMapData {
  id: number;
  fromAddress: string;
  toAddress: string;
  fromLatitude?: number | null;
  fromLongitude?: number | null;
  toLatitude?: number | null;
  toLongitude?: number | null;
  distanceKm: number;
  routePoints: { latitude: number; longitude: number; recordedAt: string }[];
}

type RouteTab = 'planned' | 'actual';

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [map, positions]);
  return null;
}

interface RideRouteMapProps {
  data: RideMapData;
  className?: string;
}

export default function RideRouteMap({ data, className = '' }: RideRouteMapProps) {
  const [tab, setTab] = useState<RouteTab>('planned');
  const [plannedLine, setPlannedLine] = useState<[number, number][] | null>(null);
  const [plannedLoading, setPlannedLoading] = useState(false);

  const hasCoords =
    data.fromLatitude != null &&
    data.fromLongitude != null &&
    data.toLatitude != null &&
    data.toLongitude != null;

  const actualLine = useMemo<[number, number][]>(
    () => data.routePoints.map((point) => [point.latitude, point.longitude]),
    [data.routePoints]
  );

  useEffect(() => {
    if (!hasCoords || tab !== 'planned') return;
    let isCancelled = false;
    setPlannedLoading(true);
    void fetchDrivingRouteGeometry(
      data.fromLongitude!,
      data.fromLatitude!,
      data.toLongitude!,
      data.toLatitude!
    )
      .then((routeGeometry) => {
        if (!isCancelled) setPlannedLine(routeGeometry);
      })
      .finally(() => {
        if (!isCancelled) setPlannedLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [tab, hasCoords, data.fromLatitude, data.fromLongitude, data.toLatitude, data.toLongitude]);

  const displayLine = tab === 'planned' ? plannedLine : actualLine;
  const plannedRouteFallbackLine =
    hasCoords && displayLine == null
      ? ([
          [data.fromLatitude!, data.fromLongitude!],
          [data.toLatitude!, data.toLongitude!]
        ] as [number, number][])
      : [];

  const positions = (displayLine?.length ? displayLine : plannedRouteFallbackLine) as [number, number][];
  const center: [number, number] = positions[0] ?? [49.8397, 24.0297];

  const tabClass = (active: boolean) =>
    `manager-accent-glow manager-primary-btn rounded-full px-3 py-2 text-xs font-semibold transition-[color,filter,box-shadow,opacity] duration-300 sm:text-sm ${
      active
        ? 'border-[#EAB308]/78 bg-[#EAB308]/15 text-[#EAB308] hover:text-slate-200 focus-visible:text-slate-200'
        : 'border-white/10 bg-white/5 text-slate-200 hover:text-[#EAB308] focus-visible:text-[#EAB308]'
    }`;

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={tabClass(tab === 'planned')} onClick={() => setTab('planned')}>
          Оригінальний
        </button>
        <button type="button" className={tabClass(tab === 'actual')} onClick={() => setTab('actual')}>
          Реальний
        </button>
      </div>

      {tab === 'actual' ? (
        <p className="mb-3 text-xs leading-snug text-slate-400/80">
          Відображається найкоректніше, якщо водій не згортав сторінку вебсервісу під час поїздки.
        </p>
      ) : null}

      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm">
        {(tab === 'planned' && plannedLoading) || !hasCoords ? (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#0F172A]/60 text-slate-400">
            {plannedLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <span className="px-4 text-center text-sm">Немає координат маршруту.</span>
            )}
          </div>
        ) : null}

        {tab === 'actual' && actualLine.length === 0 ? (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#0F172A]/60 text-sm text-slate-400">
            Фактичний маршрут не записано.
          </div>
        ) : null}

        <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.length > 0 ? (
            <>
              <Polyline
                positions={positions}
                pathOptions={{ color: ROUTE_LINE_COLOR, weight: 4, opacity: 0.9 }}
                smoothFactor={1.5}
              />
              <FitBounds positions={positions} />
              {hasCoords ? (
                <>
                  <Marker position={[data.fromLatitude!, data.fromLongitude!]} />
                  <Marker position={[data.toLatitude!, data.toLongitude!]} />
                </>
              ) : null}
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}

