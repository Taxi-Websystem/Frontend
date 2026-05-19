import { Flag, Loader2, MapPin, Route, X } from 'lucide-react';
import ModalPortal from '../../../components/ModalPortal';
import RideRouteMap, { type RideMapData } from '../../../components/RideRouteMap';
import { compactAddressLabel } from '../../../utils/geo';

interface RideMapModalProps {
  rideId: number | null;
  mapData: RideMapData | null;
  mapLoading: boolean;
  onClose: () => void;
}

export function RideMapModal({ rideId, mapData, mapLoading, onClose }: RideMapModalProps) {
  if (rideId === null) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/80 p-4 sm:items-center sm:p-6">
        <div className="mx-auto my-6 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl ring-1 ring-white/5 sm:my-0">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Маршрут поїздки №{rideId}</h3>
              {mapData ? (
                <div className="mt-2 space-y-2 text-sm text-slate-200">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                    <span>
                      <span className="text-slate-400">Звідки: </span>
                      {compactAddressLabel(mapData.fromAddress)}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Flag className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                    <span>
                      <span className="text-slate-400">Куди: </span>
                      {compactAddressLabel(mapData.toAddress)}
                    </span>
                  </p>
                  <p className="flex items-start gap-2 tabular-nums">
                    <Route className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
                    <span>
                      <span className="text-slate-400">Відстань: </span>
                      <span className="text-white">{Number(mapData.distanceKm).toFixed(2)} км</span>
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          {mapLoading || !mapData ? (
            <div className="flex h-[320px] items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <RideRouteMap data={mapData} />
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
