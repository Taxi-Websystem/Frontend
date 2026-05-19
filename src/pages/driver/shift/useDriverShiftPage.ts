import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../../../api/axios';
import { getCurrentUserId } from '../../../utils/auth';
import { useDashboardDataRefresh } from '../../../hooks/useDashboardDataRefresh';
import { usePresenceChanged } from '../../../hooks/usePresenceChanged';
import { getUserStatusLabel, parseUserStatus, type UserStatus } from '../../../utils/userStatus';

export interface DriverPresenceSettingsDto {
  isAutoStatusEnabled: boolean;
  currentStatus: UserStatus;
  isManualControlAllowed: boolean;
  profileId: number;
}

function normalizePresence(row: DriverPresenceSettingsDto): DriverPresenceSettingsDto {
  return {
    ...row,
    currentStatus: parseUserStatus(row.currentStatus as string | number)
  };
}

export function useDriverShiftPage() {
  const currentUserId = getCurrentUserId();
  const [state, setState] = useState<DriverPresenceSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [breakSaving, setBreakSaving] = useState(false);
  const [activeRideStatus, setActiveRideStatus] = useState<'Accepted' | 'InRide' | null>(null);
  const [error, setError] = useState('');

  const loadPresence = useCallback(async (silentError = false) => {
    setLoading(true);
    if (!silentError) {
      setError('');
    }
    try {
      const { data } = await api.get<DriverPresenceSettingsDto>('/presence/settings');
      setState(normalizePresence(data));
      return true;
    } catch (err) {
      if (!silentError) {
        setError(getApiErrorMessage(err, 'Не вдалося завантажити стан зміни.'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const ok = await loadPresence(attempt < 4);
        if (ok || isCancelled) {
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 600));
      }
    };

    void init();
    return () => {
      isCancelled = true;
    };
  }, [loadPresence]);

  useEffect(() => {
    if (loading || !state?.isAutoStatusEnabled || state.currentStatus !== 'Offline') {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      void loadPresence(true);
      if (attempts >= 4) {
        window.clearInterval(intervalId);
      }
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [loading, loadPresence, state?.isAutoStatusEnabled, state?.currentStatus]);

  usePresenceChanged(
    useCallback(
      (detail) => {
        if (currentUserId == null || detail.userId !== currentUserId) {
          return;
        }

        setState((previous) =>
          previous ? { ...previous, currentStatus: parseUserStatus(detail.status as string | number) } : previous
        );
      },
      [currentUserId]
    )
  );

  const refreshActiveRide = useCallback(() => {
    void api
      .get<{ status?: 'Accepted' | 'InRide' } | null>('/driver/rides/active')
      .then(({ data }) => {
        const status = data?.status;
        setActiveRideStatus(status === 'Accepted' || status === 'InRide' ? status : null);
      })
      .catch(() => setActiveRideStatus(null));
  }, []);

  useEffect(() => {
    refreshActiveRide();
  }, [refreshActiveRide]);

  useDashboardDataRefresh(refreshActiveRide);

  const setManualStatus = async (status: Extract<UserStatus, 'Offline' | 'Online'>) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post<DriverPresenceSettingsDto>('/presence/status', { status });
      setState(normalizePresence(data));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося змінити статус зміни.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleBreak = async () => {
    if (!state) return;
    const nextStatus: Extract<UserStatus, 'Online' | 'Break'> =
      state.currentStatus === 'Break' ? 'Online' : 'Break';
    setBreakSaving(true);
    setError('');
    try {
      const { data } = await api.post<DriverPresenceSettingsDto>('/presence/status', { status: nextStatus });
      setState(normalizePresence(data));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не вдалося змінити статус перерви.'));
    } finally {
      setBreakSaving(false);
    }
  };

  const isAutoEnabled = state?.isAutoStatusEnabled ?? true;
  const currentStatus = state?.currentStatus ?? 'Offline';
  const nextManualStatus: Extract<UserStatus, 'Offline' | 'Online'> =
    currentStatus === 'Offline' ? 'Online' : 'Offline';
  const manualButtonText = currentStatus === 'Offline' ? 'Я «Онлайн»' : 'Я «Офлайн»';
  const statusControlsDisabled = loading || isAutoEnabled || currentStatus === 'InRide';
  const onBreak = currentStatus === 'Break';
  const hasAssignedRide = activeRideStatus === 'Accepted' || activeRideStatus === 'InRide';
  const breakDisabled =
    loading ||
    (onBreak ? false : hasAssignedRide || (currentStatus !== 'Online' && currentStatus !== 'InRide'));

  return {
    error,
    loading,
    saving,
    breakSaving,
    currentStatusLabel: getUserStatusLabel(currentStatus),
    nextManualStatus,
    manualButtonText,
    statusControlsDisabled,
    onBreak,
    breakDisabled,
    isAutoEnabled,
    setManualStatus,
    toggleBreak
  };
}
