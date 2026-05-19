import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useEffect } from 'react';
import { api } from '../api/axios';
import { getToken } from '../utils/auth';

export function getPresenceHubUrl(): string {
  const apiBaseUrl = (api.defaults.baseURL as string | undefined) ?? '';
  return `${apiBaseUrl.replace(/\/api\/?$/, '')}/hubs/presence`;
}

export function usePresenceHub(): void {
  useEffect(() => {
    if (!getToken()) return;

    const connection = new HubConnectionBuilder()
      .withUrl(getPresenceHubUrl(), {
        accessTokenFactory: () => getToken() ?? '',
        withCredentials: false
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('PresenceChanged', (payload: { userId: number; status: string }) => {
      window.dispatchEvent(new CustomEvent('presence:changed', { detail: payload }));
    });

    connection.on(
      'DashboardDataChanged',
      (payload: { entity?: string; action?: string; userId?: number }) => {
        window.dispatchEvent(new CustomEvent('dashboard:data-changed', { detail: payload }));
      }
    );

    void connection.start().catch(() => undefined);

    return () => {
      void connection.stop();
    };
  }, []);
}
