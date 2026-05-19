import { useEffect } from 'react';
import type { UserStatus } from '../utils/userStatus';

interface PresenceChangedDetail {
  userId: number;
  status: UserStatus;
}

export function usePresenceChanged(onPresenceChanged: (detail: PresenceChangedDetail) => void): void {
  useEffect(() => {
    const handlePresenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<PresenceChangedDetail>).detail;
      if (!detail) return;
      onPresenceChanged(detail);
    };

    window.addEventListener('presence:changed', handlePresenceChanged as EventListener);
    return () => window.removeEventListener('presence:changed', handlePresenceChanged as EventListener);
  }, [onPresenceChanged]);
}
