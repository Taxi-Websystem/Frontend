export type StatusPulseKind = 'online' | 'offline' | 'inRide';

const ping: Record<StatusPulseKind, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-gray-400',
  inRide: 'bg-sky-400',
};

const solid: Record<StatusPulseKind, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-500',
  inRide: 'bg-sky-500',
};

export default function StatusPulseDot({ kind }: { kind: StatusPulseKind }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${ping[kind]}`}
        aria-hidden
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${solid[kind]}`} aria-hidden />
    </span>
  );
}
