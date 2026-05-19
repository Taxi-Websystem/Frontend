import type { StatusPulseKind } from '../utils/statusPulse';

export type { StatusPulseKind };

const PULSE_RING_CLASS: Record<StatusPulseKind, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-gray-400',
  inRide: 'bg-sky-400',
  created: 'bg-yellow-400',
  accepted: 'bg-violet-400'
};

const PULSE_DOT_CLASS: Record<StatusPulseKind, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-500',
  inRide: 'bg-sky-500',
  created: 'bg-yellow-500',
  accepted: 'bg-violet-500'
};

interface StatusPulseDotProps {
  kind: StatusPulseKind;
}

export default function StatusPulseDot({ kind }: StatusPulseDotProps) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${PULSE_RING_CLASS[kind]}`}
        aria-hidden
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${PULSE_DOT_CLASS[kind]}`} aria-hidden />
    </span>
  );
}
