export function formatTransitSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours} год ${minutes} хв`;
  return `${minutes} хв`;
}

export function formatTransitAxisTick(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0';
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)} г`;
  return `${Math.round(seconds / 60)} хв`;
}
