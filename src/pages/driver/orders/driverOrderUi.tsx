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
import { useMemo } from 'react';
import { formatCountdownMmSs, useCountdownSeconds } from '../../../hooks/useCountdownSeconds';
import { ORDER_CARD_CLASS } from '../../../styles/pageClasses';
import { compactAddressLabel } from '../../../utils/geo';
import {
  DRIVER_CANCEL_WINDOW_MS,
  driverPrimaryActionClass,
  pendingCancelHintText,
  type ActiveRide,
  type PendingRide
} from './driverOrdersTypes';

const stableOrderCardClass = `${ORDER_CARD_CLASS} min-h-[240px]`;

function OrderCardHeightSpacer() {
  return (
    <div className="pointer-events-none select-none opacity-0" aria-hidden>
      <OrderCardHeader orderId={21} driverProfit={59.43} />
      <OrderDetails
        fromAddress="Зелена, 253г, Львів"
        toAddress="Сніжківська, 10, Львів"
        distanceKm={1.81}
      />
      <button type="button" className={`${driverPrimaryActionClass} mt-4 w-full flex-none`}>
        Прийняти замовлення
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">{pendingCancelHintText}</p>
    </div>
  );
}

export function OrdersEmptyState() {
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

export function OrdersLoadingState() {
  return (
    <div className={`${stableOrderCardClass} relative`}>
      <OrderCardHeightSpacer />
      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    </div>
  );
}

export function ActiveOrderEmptyState() {
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
    return acceptedMs + DRIVER_CANCEL_WINDOW_MS;
  }, [ride.acceptedAt, ride.status]);

  const cancelSecondsLeft = useCountdownSeconds(cancelDeadlineMs);
  const canCancel = ride.status === 'Accepted' && cancelSecondsLeft > 0;

  if (ride.status === 'InRide') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onComplete}
        className={`${driverPrimaryActionClass} mt-4 w-full flex-none`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CircleCheck size={16} aria-hidden />}
        Завершити поїздку
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={onStart} className={driverPrimaryActionClass}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlayCircle size={16} aria-hidden />}
          Почати поїздку
        </button>
        <button
          type="button"
          disabled={busy || !canCancel}
          onClick={onCancel}
          className={driverPrimaryActionClass}
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

export function PendingOrderCard({
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
        className={`${driverPrimaryActionClass} mt-4 w-full flex-none ${isBlocked ? 'opacity-50' : ''}`}
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

export function ActiveRideCard({
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
  return (
    <div className={ORDER_CARD_CLASS}>
      <OrderCardHeader orderId={ride.id} driverProfit={ride.driverProfit} />
      <OrderDetails
        fromAddress={ride.fromAddress}
        toAddress={ride.toAddress}
        distanceKm={ride.distanceKm}
      />
      <ActiveRideActions
        ride={ride}
        busy={busy}
        onStart={onStart}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </div>
  );
}
