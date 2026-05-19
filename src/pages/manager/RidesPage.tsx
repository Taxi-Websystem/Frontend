import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Route } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/axios';
import { getCurrentRole } from '../../utils/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { RideMapData } from '../../components/RideRouteMap';
import { fetchDrivingDistanceKm } from '../../utils/geo';
import { useDashboardDataRefresh } from '../../hooks/useDashboardDataRefresh';
import { usePresenceChanged } from '../../hooks/usePresenceChanged';
import { RATING_1_TO_5_DECIMAL_REGEX } from '../../utils/regex';
import { PAGE_CARD_CLASS } from '../../styles/pageClasses';
import { ManagerPageHeader } from './shared/ManagerPageHeader';
import { ManagerTableLoading } from './shared/ManagerTableLoading';
import { RideFormModal } from './rides/RideFormModal';
import { RideMapModal } from './rides/RideMapModal';
import { RideStatsSection } from './rides/RideStatsSection';
import { RidesTableSection } from './rides/RidesTableSection';
import {
  buildRideSubmitPayload,
  defaultRideForm,
  rideItemToFormState,
  type RideFormState
} from './rides/rideFormHelpers';
import type { DriverOption, RideItem } from './rides/rideTypes';

export default function RidesPage() {
  const viewerRole = getCurrentRole();
  const isManager = viewerRole === 'Manager';

  const [items, setItems] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RideItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [form, setForm] = useState<RideFormState>(defaultRideForm);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [mapRideId, setMapRideId] = useState<number | null>(null);
  const [mapData, setMapData] = useState<RideMapData | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const isCreateMode = editing === null;
  const ratingRaw = form.ratingInput.trim();
  const isRatingValid = ratingRaw.length === 0 || RATING_1_TO_5_DECIMAL_REGEX.test(ratingRaw);
  const distanceNum = Number(form.distanceKm.replace(',', '.'));
  const isDistanceValid = !Number.isNaN(distanceNum) && distanceNum >= 0;
  const hasCoords =
    form.fromLatitude != null &&
    form.fromLongitude != null &&
    form.toLatitude != null &&
    form.toLongitude != null;
  const isFormValid =
    form.fromAddress.trim().length > 0 &&
    form.toAddress.trim().length > 0 &&
    hasCoords &&
    isRatingValid &&
    isDistanceValid &&
    distanceNum > 0;
  const isDriverLockedOnEdit =
    editing !== null &&
    (editing.status === 'InRide' || editing.status === 'Canceled' || editing.status === 'Completed');

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, ride) => {
        if (ride.status === 'Completed') acc.completed += 1;
        else if (ride.status === 'Canceled') acc.canceled += 1;
        else acc.active += 1;
        return acc;
      },
      { active: 0, completed: 0, canceled: 0 }
    );
  }, [items]);

  const onlineDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        typeof driver.userStatus === 'number' ? driver.userStatus === 1 : driver.userStatus === 'Online'
      ),
    [drivers]
  );

  const selectableDrivers = useMemo(() => {
    if (isCreateMode) return onlineDrivers;
    if (!form.driverId) return onlineDrivers;

    const selectedId = Number(form.driverId);
    if (Number.isNaN(selectedId)) return onlineDrivers;

    const alreadyInOnline = onlineDrivers.some((driver) => driver.id === selectedId);
    if (alreadyInOnline) return onlineDrivers;

    const selectedDriver = drivers.find((driver) => driver.id === selectedId);
    return selectedDriver ? [...onlineDrivers, selectedDriver] : onlineDrivers;
  }, [drivers, form.driverId, isCreateMode, onlineDrivers]);

  const loadRides = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<RideItem[]>('/rides');
      setItems(response.data);
    } catch {
      setError('Не вдалося завантажити поїздки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRides();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get<DriverOption[]>('/drivers');
      setDrivers(response.data);
    } catch {
      setDrivers([]);
    }
  };

  useEffect(() => {
    void loadDrivers();
  }, []);

  useEffect(() => {
    if (
      form.fromLatitude == null ||
      form.fromLongitude == null ||
      form.toLatitude == null ||
      form.toLongitude == null
    ) {
      return;
    }

    let isCancelled = false;
    setDistanceLoading(true);
    void fetchDrivingDistanceKm(
      form.fromLongitude,
      form.fromLatitude,
      form.toLongitude,
      form.toLatitude
    )
      .then((km) => {
        if (isCancelled || km == null) return;
        setForm((prev) => ({ ...prev, distanceKm: String(km) }));
      })
      .finally(() => {
        if (!isCancelled) setDistanceLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [form.fromLatitude, form.fromLongitude, form.toLatitude, form.toLongitude]);

  const refreshRidesAndDrivers = useCallback(() => {
    void loadRides();
    void loadDrivers();
  }, []);

  useDashboardDataRefresh(refreshRidesAndDrivers, { skipPresenceEvents: true });

  usePresenceChanged((detail) => {
    setDrivers((previousDrivers) =>
      previousDrivers.map((driver) =>
        driver.userId === detail.userId ? { ...driver, userStatus: detail.status } : driver
      )
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultRideForm);
    setIsModalOpen(true);
  };

  const openEdit = (ride: RideItem) => {
    setEditing(ride);
    setForm(rideItemToFormState(ride));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultRideForm);
    setSaving(false);
  };

  const submitRide = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) return;

    setSaving(true);
    setError('');

    const payload = buildRideSubmitPayload(form);

    try {
      if (editing) {
        await api.put(`/rides/${editing.id}`, payload);
      } else {
        await api.post('/rides', payload);
      }
      closeModal();
      await loadRides();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося зберегти поїздку.'));
      setSaving(false);
    }
  };

  const openMapModal = (rideId: number) => {
    setMapRideId(rideId);
    setMapData(null);
    setMapLoading(true);
    void api
      .get<RideMapData>(`/rides/${rideId}/map`)
      .then((response) => setMapData(response.data))
      .catch(() => setMapData(null))
      .finally(() => setMapLoading(false));
  };

  const closeMapModal = () => {
    setMapRideId(null);
    setMapData(null);
    setMapLoading(false);
  };

  const deleteRide = async (id: number) => {
    try {
      await api.delete(`/rides/${id}`);
      await loadRides();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося видалити поїздку.'));
    }
  };

  return (
    <section className={PAGE_CARD_CLASS}>
      <ManagerPageHeader
        icon={<Route className="h-7 w-7" strokeWidth={2} />}
        title="Поїздки"
        subtitle="Список поїздок."
        onAdd={openCreate}
      />

      <RideStatsSection loading={loading} counts={statusCounts} />

      {error ? <div className="field-error-box mb-4">{error}</div> : null}

      {loading ? (
        <ManagerTableLoading />
      ) : (
        <RidesTableSection
          items={items}
          onViewMap={openMapModal}
          onEdit={openEdit}
          onDelete={setDeleteTargetId}
        />
      )}

      <RideFormModal
        isOpen={isModalOpen}
        isCreateMode={isCreateMode}
        isManager={isManager}
        isDriverLockedOnEdit={isDriverLockedOnEdit}
        isFormValid={isFormValid}
        saving={saving}
        form={form}
        setForm={setForm}
        selectableDrivers={selectableDrivers}
        distanceLoading={distanceLoading}
        hasCoords={hasCoords}
        onClose={closeModal}
        onSubmit={submitRide}
      />

      <RideMapModal
        rideId={mapRideId}
        mapData={mapData}
        mapLoading={mapLoading}
        onClose={closeMapModal}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Підтвердження видалення"
        message="Поїздка буде безповоротно видалена. Продовжити?"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          const targetId = deleteTargetId;
          setDeleteTargetId(null);
          if (targetId !== null) {
            void deleteRide(targetId);
          }
        }}
      />
    </section>
  );
}
