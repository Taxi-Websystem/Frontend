import { useEffect, useState } from 'react';

/** Секунди до deadline (UTC ms); оновлюється щосекунди. */
export function useCountdownSeconds(deadlineMs: number | null): number {
  const [remaining, setRemaining] = useState(() => computeRemaining(deadlineMs));

  useEffect(() => {
    setRemaining(computeRemaining(deadlineMs));
    if (deadlineMs == null) return undefined;

    const id = window.setInterval(() => {
      setRemaining(computeRemaining(deadlineMs));
    }, 1000);

    return () => window.clearInterval(id);
  }, [deadlineMs]);

  return remaining;
}

function computeRemaining(deadlineMs: number | null): number {
  if (deadlineMs == null) return 0;
  return Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
}

export function formatCountdownMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
