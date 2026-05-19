import { useEffect } from 'react';

interface DashboardDataChangedDetail {
  entity?: string;
  action?: string;
  userId?: number;
}

export function useDashboardDataRefresh(
  onRefresh: () => void,
  options?: { skipPresenceEvents?: boolean }
): void {
  useEffect(() => {
    const handleDashboardDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<DashboardDataChangedDetail>).detail;
      if (options?.skipPresenceEvents && detail?.entity === 'presence') {
        return;
      }

      onRefresh();
    };

    window.addEventListener('dashboard:data-changed', handleDashboardDataChanged as EventListener);
    return () =>
      window.removeEventListener('dashboard:data-changed', handleDashboardDataChanged as EventListener);
  }, [onRefresh, options?.skipPresenceEvents]);
}
