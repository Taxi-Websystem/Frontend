import {
  CheckCircle,
  CircleCheck,
  Flag,
  ListOrdered,
  Loader2,
  MapPin,
  PlayCircle,
  Route,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useCountdownSeconds, formatCountdownMmSs } from '../../hooks/useCountdownSeconds';
import { useRideLocationTracker } from '../../hooks/useRideLocationTracker';
import { compactAddressLabel } from '../../utils/geo';

type RideStatus = 'Accepted' | 'InRide';

const CANCEL_WINDOW_MS = 3 * 60 * 1000;

const primaryActionClass =
  'manager-accent-glow manager-primary-btn relative inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#EAB308] px-4 py-3 text-sm font-semibold text-[#0F172A] transition-[filter,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

interface PendingRide {
  id: number;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  driverProfit: number | null;
}

interface ActiveRide {
  id: number;
  status: RideStatus;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  driverProfit: number | null;
  startTime: string | null;
  acceptedAt: string | null;
  cancelSecondsRemaining: number;
  canCancel: boolean;
}

const pageCardClass =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8';

const orderCardClass =
  'rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-5';
const stableOrderCardClass = `${orderCardClass} min-h-[240px]`;
const pendingCancelHintText = 'Скасувати замовлення можна протягом 3 хвилин після прийняття.';

function OrderCardHeightSpacer() {
  return (
    <div className="pointer-events-none select-none opacity-0" aria-hidden>
      <OrderCardHeader orderId={21} driverProfit={59.43} />
      <OrderDetails
        fromAddress="Зелена, 253г, Львів"
        toAddress="Сніжківська, 10, Львів"
        distanceKm={1.81}
      />
      <button type="button" className={`${primaryActionClass} mt-4 w-full flex-none`}>
        Прийняти замовлення
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">{pendingCancelHintText}</p>
    </div>
  );
}

function OrdersEmptyState() {
  return (
    <div className={`${stableOrderCardClass} relative`}>
      <OrderCardHeightSpacer />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <ListOrdered className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">Немає замовлень.</p>
        <p className="mt-2 max-w-xs text-xs text-slate-500/80">
          Коли з’явиться нове замовлення, воно відобразиться тут.
        </p>
      </div>
    </div>
  );
}

function OrdersLoadingState() {
  return (
    <div className={`${stableOrderCardClass} relative`}>
      <OrderCardHeightSpacer />
      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    </div>
  );
}

function ActiveOrderEmptyState() {
  return (
    <div className={`${stableOrderCardClass} relative`}>
      <OrderCardHeightSpacer />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <ListOrdered className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-400/90">Немає активних замовлень.</p>
        <p className="mt-2 max-w-xs text-xs text-slate-500/80">
          Прийміть нове замовлення зі списку нижче.
        </p>
      </div>
    </div>
  );
}

function OrderCardHeader({
  orderId,
  driverProfit
}: {
  orderId: number;
  driverProfit: number | null;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Замовлення</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">№{orderId}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Прибуток</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums text-[#EAB308]">
          {driverProfit != null ? `${Number(driverProfit).toFixed(2)} грн` : '—'}
        </p>
      </div>
    </div>
  );
}

function OrderDetails({
  fromAddress,
  toAddress,
  distanceKm
}: {
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
}) {
  return (
    <div className="space-y-3 text-sm text-slate-200">
      <p className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
        <span>
          <span className="text-slate-400">Звідки: </span>
          {compactAddressLabel(fromAddress)}
        </span>
      </p>
      <p className="flex items-start gap-2">
        <Flag className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
        <span>
          <span className="text-slate-400">Куди: </span>
          {compactAddressLabel(toAddress)}
        </span>
      </p>
      <p className="flex items-start gap-2 tabular-nums">
        <Route className="mt-0.5 h-4 w-4 shrink-0 text-[#EAB308]" aria-hidden />
        <span>
          <span className="text-slate-400">Відстань: </span>
          <span className="text-white">{Number(distanceKm).toFixed(2)} км</span>
        </span>
      </p>
    </div>
  );
}

function ActiveRideActions({
  ride,
  busy,
  onStart,
  onComplete,
  onCancel
}: {
  ride: ActiveRide;
  busy: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const cancelDeadlineMs = useMemo(() => {
    if (ride.status !== 'Accepted' || !ride.acceptedAt) return null;
    const acceptedMs = new Date(ride.acceptedAt).getTime();
    if (Number.isNaN(acceptedMs)) return null;
    return acceptedMs + CANCEL_WINDOW_MS;
  }, [ride.acceptedAt, ride.status]);

  const cancelSecondsLeft = useCountdownSeconds(cancelDeadlineMs);
  const canCancel = ride.status === 'Accepted' && cancelSecondsLeft > 0;

  if (ride.status === 'InRide') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onComplete}
        className={`${primaryActionClass} mt-4 w-full flex-none`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CircleCheck size={16} aria-hidden />}
        Завершити поїздку
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={onStart} className={primaryActionClass}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlayCircle size={16} aria-hidden />}
          Почати поїздку
        </button>
        <button
          type="button"
          disabled={busy || !canCancel}
          onClick={onCancel}
          className={primaryActionClass}
        >
          <XCircle size={16} aria-hidden />
          Скасувати поїздку
        </button>
      </div>
      <p className="text-center text-xs tabular-nums text-slate-500">
        {canCancel
          ? `Скасувати замовлення можна протягом: ${formatCountdownMmSs(cancelSecondsLeft)}`
          : 'Скасувати замовлення неможливо. Час на скасування вичерпано.'}
      </p>
    </div>
  );
}

function PendingOrderCard({
  order,
  acceptingOrderId,
  onAccept
}: {
  order: PendingRide;
  acceptingOrderId: number | null;
  onAccept: (orderId: number) => void;
}) {
  const isAccepting = acceptingOrderId === order.id;
  const isBlocked = acceptingOrderId != null && !isAccepting;

  return (
    <div className={stableOrderCardClass}>
      <OrderCardHeader orderId={order.id} driverProfit={order.driverProfit} />
      <OrderDetails
        fromAddress={order.fromAddress}
        toAddress={order.toAddress}
        distanceKm={order.distanceKm}
      />
      <button
        type="button"
        disabled={acceptingOrderId != null}
        onClick={() => onAccept(order.id)}
        className={`${primaryActionClass} mt-4 w-full flex-none ${
          isBlocked ? 'opacity-50' : ''
        }`}
      >
        {isAccepting ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#0F172A]" aria-hidden />
        ) : (
          <CheckCircle size={16} aria-hidden />
        )}
        Прийняти замовлення
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">{pendingCancelHintText}</p>
    </div>
  );
}

export default function DriverOrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<PendingRide[]>([]);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBusy, setActiveBusy] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [acceptTargetId, setAcceptTargetId] = useState<number | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const [settingsRes, pendingRes, activeRes] = await Promise.all([
        api.get<{ isAutoAcceptOrdersEnabled: boolean }>('/presence/settings'),
        api.get<PendingRide[]>('/driver/rides/pending'),
        api.get<ActiveRide | null>('/driver/rides/active')
      ]);
      setAutoAcceptOrders(settingsRes.data.isAutoAcceptOrdersEnabled ?? false);
      setPendingOrders(pendingRes.data ?? []);
      setActiveRide(activeRes.data ?? null);
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err, 'Не вдалося завантажити замовлення.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onDashboard = () => void load(true);
    window.addEventListener('dashboard:data-changed', onDashboard as EventListener);
    return () => window.removeEventListener('dashboard:data-changed', onDashboard as EventListener);
  }, [load]);

  useRideLocationTracker(
    activeRide?.status === 'InRide' ? activeRide.id : null,
    activeRide?.status === 'InRide'
  );

  const acceptOrder = async (id: number) => {
    setAcceptTargetId(null);
    setAcceptingOrderId(id);
    setError('');
    try {
      const response = await api.post<ActiveRide>(`/driver/rides/${id}/accept`);
      setActiveRide(response.data);
      setPendingOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося прийняти замовлення.'));
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleAcceptClick = (id: number) => {
    if (autoAcceptOrders) {
      void acceptOrder(id);
      return;
    }
    setAcceptTargetId(id);
  };

  const startRide = async () => {
    if (!activeRide) return;
    setActiveBusy(true);
    setError('');
    try {
      const response = await api.post<ActiveRide>(`/driver/rides/${activeRide.id}/start`);
      setActiveRide(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося розпочати поїздку.'));
    } finally {
      setActiveBusy(false);
    }
  };

  const completeRide = async () => {
    if (!activeRide) return;
    setActiveBusy(true);
    setError('');
    try {
      await api.post(`/driver/rides/${activeRide.id}/complete`);
      setActiveRide(null);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося завершити поїздку.'));
    } finally {
      setActiveBusy(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    setActiveBusy(true);
    setError('');
    try {
      await api.post(`/driver/rides/${activeRide.id}/cancel`);
      setActiveRide(null);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося скасувати замовлення.'));
    } finally {
      setActiveBusy(false);
    }
  };

  const hasAnyOrders = pendingOrders.length > 0 || activeRide != null;
  const firstPendingOrder = pendingOrders[0] ?? null;
  const queuedPendingOrders = activeRide ? pendingOrders : pendingOrders.slice(1);

  return (
    <section className={pageCardClass}>
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15 text-[#EAB308]">
          <ListOrdered className="h-7 w-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Замовлення</h2>
          <p className="mt-1 text-sm text-slate-400">Перегляд нових замовлень та активного замовлення.</p>
        </div>
      </div>

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading ? (
        <OrdersLoadingState />
      ) : !hasAnyOrders ? (
        <OrdersEmptyState />
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {activeRide ? (
              <div className={orderCardClass}>
                <OrderCardHeader orderId={activeRide.id} driverProfit={activeRide.driverProfit} />
                <OrderDetails
                  fromAddress={activeRide.fromAddress}
                  toAddress={activeRide.toAddress}
                  distanceKm={activeRide.distanceKm}
                />
                <ActiveRideActions
                  ride={activeRide}
                  busy={activeBusy}
                  onStart={() => void startRide()}
                  onComplete={() => void completeRide()}
                  onCancel={() => setCancelConfirmOpen(true)}
                />
              </div>
            ) : firstPendingOrder ? (
              <PendingOrderCard
                order={firstPendingOrder}
                acceptingOrderId={acceptingOrderId}
                onAccept={handleAcceptClick}
              />
            ) : (
              <ActiveOrderEmptyState />
            )}
          </div>

          {queuedPendingOrders.length > 0 ? (
            <div className="space-y-4">
              {queuedPendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  acceptingOrderId={acceptingOrderId}
                  onAccept={handleAcceptClick}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={acceptTargetId !== null}
        title="Підтвердження"
        message="Прийняти замовлення?"
        cancelText="Скасувати"
        confirmText="Прийняти"
        confirmTone="online"
        onCancel={() => setAcceptTargetId(null)}
        onConfirm={() => {
          const id = acceptTargetId;
          setAcceptTargetId(null);
          if (id != null) {
            void acceptOrder(id);
          }
        }}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Підтвердження"
        message="Скасувати замовлення?"
        confirmText="Скасувати"
        cancelText="Відмінити"
        cancelTone="default"
        confirmTone="danger"
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => {
          setCancelConfirmOpen(false);
          void cancelRide();
        }}
      />
    </section>
  );
}
