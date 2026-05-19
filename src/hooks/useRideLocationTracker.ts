import { useEffect, useRef } from 'react';
import { api } from '../api/axios';

const SEND_INTERVAL_MS = 12_000;

interface RoutePointPayload {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export function useRideLocationTracker(rideId: number | null, enabled: boolean) {
  const watchIdRef = useRef<number | null>(null);
  const bufferRef = useRef<RoutePointPayload[]>([]);
  const lastSendRef = useRef(0);

  useEffect(() => {
    if (!enabled || rideId == null || !navigator.geolocation) {
      return;
    }

    const flushRoutePoints = async () => {
      if (bufferRef.current.length === 0) return;

      const pendingPoints = bufferRef.current.splice(0, bufferRef.current.length);
      try {
        await api.post(`/driver/rides/${rideId}/route-points`, { points: pendingPoints });
      } catch {
        bufferRef.current.unshift(...pendingPoints);
      }
    };

    const onPosition = (position: GeolocationPosition) => {
      if (document.visibilityState !== 'visible') return;

      bufferRef.current.push({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        recordedAt: new Date(position.timestamp).toISOString()
      });

      const now = Date.now();
      if (now - lastSendRef.current >= SEND_INTERVAL_MS) {
        lastSendRef.current = now;
        void flushRoutePoints();
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, undefined, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    });

    const intervalId = window.setInterval(() => void flushRoutePoints(), SEND_INTERVAL_MS);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      window.clearInterval(intervalId);
      void flushRoutePoints();
    };
  }, [enabled, rideId]);
}
