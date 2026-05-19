export const chartTransitionEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const tooltipCardClass =
  'pointer-events-none z-[2000] rounded-3xl border border-white/10 bg-[#0F172A]/95 px-4 py-3 text-sm text-slate-200 shadow-2xl';

export const barActiveHighlight = {
  fill: '#EAB308'
};

const chartCursorTransition = `d 260ms ${chartTransitionEasing}, stroke 260ms ${chartTransitionEasing}, stroke-width 260ms ${chartTransitionEasing}, stroke-opacity 260ms ${chartTransitionEasing}, fill 260ms ${chartTransitionEasing}, fill-opacity 260ms ${chartTransitionEasing}, opacity 260ms ${chartTransitionEasing}`;

export const barChartTooltipCursor = {
  fill: 'rgba(234, 179, 8, 0.08)',
  stroke: '#EAB308',
  strokeWidth: 2,
  style: {
    transition: chartCursorTransition
  }
};

export const areaChartTooltipCursor = {
  stroke: '#EAB308',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  style: {
    transition: chartCursorTransition
  }
};

export const chartViewportClass =
  'h-[280px] w-full shrink-0 overflow-visible rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm';

export const mapViewportClass =
  'h-[320px] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm';

export const areaLineGlowStyle = {
  filter:
    'drop-shadow(0 0 6px rgba(234, 179, 8, 0.78)) drop-shadow(0 10px 32px rgba(234, 179, 8, 0.32))'
} as const;

export const areaLineGlowStyleInactive = {
  filter:
    'drop-shadow(0 0 0px rgba(234, 179, 8, 0)) drop-shadow(0 0 0px rgba(234, 179, 8, 0))'
} as const;

export const chartTooltipWrapperStyle = {
  zIndex: 2000,
  background: 'transparent',
  border: 'none',
  boxShadow: 'none',
  outline: 'none'
} as const;
