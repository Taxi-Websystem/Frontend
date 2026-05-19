import { ListOrdered } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDashboardDataRefresh } from '../../hooks/useDashboardDataRefresh';
import { useRideLocationTracker } from '../../hooks/useRideLocationTracker';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import {
  ActiveOrderEmptyState,
  ActiveRideCard,
  OrdersEmptyState,
  OrdersLoadingState,
  PendingOrderCard
} from './orders/driverOrderUi';
import type { ActiveRide, PendingRide } from './orders/driverOrdersTypes';

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

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const [settingsResponse, pendingResponse, activeResponse] = await Promise.all([
        api.get<{ isAutoAcceptOrdersEnabled: boolean }>('/presence/settings'),
        api.get<PendingRide[]>('/driver/rides/pending'),
        api.get<ActiveRide | null>('/driver/rides/active')
      ]);

      setAutoAcceptOrders(settingsResponse.data.isAutoAcceptOrdersEnabled ?? false);
      setPendingOrders(pendingResponse.data ?? []);
      setActiveRide(activeResponse.data ?? null);
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err, 'Не вдалося завантажити замовлення.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useDashboardDataRefresh(() => void loadOrders(true));

  useRideLocationTracker(
    activeRide?.status === 'InRide' ? activeRide.id : null,
    activeRide?.status === 'InRide'
  );

  const acceptOrder = async (orderId: number) => {
    setAcceptTargetId(null);
    setAcceptingOrderId(orderId);
    setError('');

    try {
      const response = await api.post<ActiveRide>(`/driver/rides/${orderId}/accept`);
      setActiveRide(response.data);
      setPendingOrders((previousOrders) =>
        previousOrders.filter((order) => order.id !== orderId)
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося прийняти замовлення.'));
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleAcceptClick = (orderId: number) => {
    if (autoAcceptOrders) {
      void acceptOrder(orderId);
      return;
    }
    setAcceptTargetId(orderId);
  };

  const runWithActiveRide = async (
    fallbackErrorMessage: string,
    action: (ride: ActiveRide) => Promise<void>
  ) => {
    if (!activeRide) return;

    setActiveBusy(true);
    setError('');
    try {
      await action(activeRide);
    } catch (err) {
      setError(getApiErrorMessage(err, fallbackErrorMessage));
    } finally {
      setActiveBusy(false);
    }
  };

  const startRide = async () => {
    await runWithActiveRide('Не вдалося розпочати поїздку.', async (ride) => {
      const response = await api.post<ActiveRide>(`/driver/rides/${ride.id}/start`);
      setActiveRide(response.data);
    });
  };

  const completeRide = async () => {
    await runWithActiveRide('Не вдалося завершити поїздку.', async (ride) => {
      await api.post(`/driver/rides/${ride.id}/complete`);
      setActiveRide(null);
      await loadOrders(true);
    });
  };

  const cancelRide = async () => {
    await runWithActiveRide('Не вдалося скасувати замовлення.', async (ride) => {
      await api.post(`/driver/rides/${ride.id}/cancel`);
      setActiveRide(null);
      await loadOrders(true);
    });
  };

  const hasAnyOrders = pendingOrders.length > 0 || activeRide != null;
  const firstPendingOrder = pendingOrders[0] ?? null;
  const queuedPendingOrders = activeRide ? pendingOrders : pendingOrders.slice(1);

  return (
    <section className={PAGE_CARD_CLASS}>
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
              <ActiveRideCard
                ride={activeRide}
                busy={activeBusy}
                onStart={() => void startRide()}
                onComplete={() => void completeRide()}
                onCancel={() => setCancelConfirmOpen(true)}
              />
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
          const orderId = acceptTargetId;
          setAcceptTargetId(null);
          if (orderId != null) {
            void acceptOrder(orderId);
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
