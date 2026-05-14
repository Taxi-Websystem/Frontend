import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Rectangle,
  useActiveTooltipCoordinate,
  useIsTooltipActive,
  usePlotArea,
  useXAxisTicks
} from 'recharts';

const FADE_MS = 260;

/** Усі графіки на сторінці аналітики — категорія на X (horizontal layout). */
const CHART_LAYOUT = 'horizontal' as const;

/** Копія логіки `recharts` `getCursorRectangle` (публічний API не експортує). */
function getCursorRectangle(
  layout: string,
  activeCoordinate: { x: number; y: number },
  offset: { left: number; top: number; width: number; height: number },
  tooltipAxisBandSize: number
) {
  const halfSize = tooltipAxisBandSize / 2;
  return {
    stroke: 'none',
    fill: '#ccc',
    x: layout === 'horizontal' ? activeCoordinate.x - halfSize : offset.left + 0.5,
    y: layout === 'horizontal' ? offset.top + 0.5 : activeCoordinate.y - halfSize,
    width: layout === 'horizontal' ? tooltipAxisBandSize : offset.width - 1,
    height: layout === 'horizontal' ? offset.height - 1 : tooltipAxisBandSize
  };
}

/** Копія логіки `recharts` `getCursorPoints` для cartesian horizontal / vertical. */
function getCursorPoints(
  layout: string,
  activeCoordinate: { x: number; y: number },
  offset: { left: number; top: number; width: number; height: number }
) {
  if (layout === 'horizontal') {
    return [
      { x: activeCoordinate.x, y: offset.top },
      { x: activeCoordinate.x, y: offset.top + offset.height }
    ];
  }
  if (layout === 'vertical') {
    return [
      { x: offset.left, y: activeCoordinate.y },
      { x: offset.left + offset.width, y: activeCoordinate.y }
    ];
  }
  return undefined;
}

export type AnalyticsTooltipCursorEchoVariant = 'bar' | 'line';

/** Recharts 3: `useIsTooltipActive()` повертає `boolean`, не `{ isActive }`. */
function readTooltipActive(tip: ReturnType<typeof useIsTooltipActive>): boolean {
  if (typeof tip === 'boolean') return tip;
  if (tip && typeof tip === 'object' && 'isActive' in tip) {
    return Boolean((tip as { isActive?: boolean }).isActive);
  }
  return false;
}

type BarLeaveSnap = {
  kind: 'bar';
  geom: ReturnType<typeof getCursorRectangle>;
};

type LineLeaveSnap = {
  kind: 'line';
  points: NonNullable<ReturnType<typeof getCursorPoints>>;
};

type LeaveSnap = BarLeaveSnap | LineLeaveSnap;

function estimateBandSize(
  ticks: readonly { coordinate: number }[] | undefined,
  plotWidth: number
): number {
  if (ticks && ticks.length >= 2) {
    return Math.abs(ticks[1].coordinate - ticks[0].coordinate);
  }
  if (ticks?.length === 1 && plotWidth > 0) {
    return plotWidth;
  }
  return 0;
}

/**
 * Після зникнення тултіпу Recharts одразу знімає курсор з DOM — дублюємо останню геометрію
 * й плавно гасимо (той самий easing/тривалість, що й кнопки).
 *
 * @param categoryCount — `chartData.length` для bar: запасний step, якщо з тиків не вийшло оцінити band.
 */
export function AnalyticsTooltipCursorEcho({
  variant,
  categoryCount
}: {
  variant: AnalyticsTooltipCursorEchoVariant;
  categoryCount?: number;
}) {
  const tip = useIsTooltipActive();
  const coordinate = useActiveTooltipCoordinate();
  const plot = usePlotArea();
  const xTicks = useXAxisTicks();

  const latestSnapRef = useRef<LeaveSnap | null>(null);
  const [leaveSnap, setLeaveSnap] = useState<LeaveSnap | null>(null);
  const [leaveKey, setLeaveKey] = useState(0);
  const fadeClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const offsetLike = useMemo(() => {
    if (!plot) return null;
    return {
      left: plot.x,
      top: plot.y,
      width: plot.width,
      height: plot.height
    };
  }, [plot]);

  const bandSize = useMemo(
    () => (offsetLike ? estimateBandSize(xTicks, offsetLike.width) : 0),
    [xTicks, offsetLike]
  );

  const effectiveBandSize = useMemo(() => {
    if (bandSize > 0) return bandSize;
    if (variant === 'bar' && offsetLike && categoryCount != null && categoryCount > 0) {
      return offsetLike.width / categoryCount;
    }
    return 0;
  }, [bandSize, variant, offsetLike, categoryCount]);

  const tipActive = readTooltipActive(tip);
  const isActive = Boolean(
    tipActive && coordinate != null && offsetLike && (variant === 'line' || effectiveBandSize > 0)
  );

  useLayoutEffect(() => {
    if (fadeClearRef.current) {
      clearTimeout(fadeClearRef.current);
      fadeClearRef.current = null;
    }

    if (!offsetLike) return;

    if (isActive && coordinate) {
      if (variant === 'bar' && effectiveBandSize > 0) {
        latestSnapRef.current = {
          kind: 'bar',
          geom: getCursorRectangle(CHART_LAYOUT, coordinate, offsetLike, effectiveBandSize)
        };
      } else if (variant === 'line') {
        const pts = getCursorPoints(CHART_LAYOUT, coordinate, offsetLike);
        if (pts) {
          latestSnapRef.current = { kind: 'line', points: pts };
        }
      }
      setLeaveSnap(null);
      return;
    }

    const snap = latestSnapRef.current;
    if (snap) {
      latestSnapRef.current = null;
      setLeaveSnap(snap);
      setLeaveKey((k) => k + 1);
      fadeClearRef.current = setTimeout(() => {
        setLeaveSnap(null);
        fadeClearRef.current = null;
      }, FADE_MS + 50);
    }
  }, [isActive, coordinate, offsetLike, effectiveBandSize, variant]);

  useLayoutEffect(
    () => () => {
      if (fadeClearRef.current) clearTimeout(fadeClearRef.current);
    },
    []
  );

  if (!leaveSnap) return null;

  if (leaveSnap.kind === 'bar') {
    const { x, y, width, height } = leaveSnap.geom;
    if (width === 0 || height === 0) return null;
    return (
      <Rectangle
        key={`echo-bar-${leaveKey}`}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(234, 179, 8, 0.08)"
        stroke="#EAB308"
        strokeWidth={2}
        pointerEvents="none"
        className="recharts-tooltip-cursor analytics-tooltip-cursor-echo analytics-tooltip-cursor-echo--out"
      />
    );
  }

  const [a, b] = leaveSnap.points;
  const d = `M ${a.x},${a.y} L ${b.x},${b.y}`;
  return (
    <path
      key={`echo-line-${leaveKey}`}
      d={d}
      fill="none"
      stroke="#EAB308"
      strokeWidth={2}
      strokeLinecap="round"
      pointerEvents="none"
      className="recharts-tooltip-cursor analytics-tooltip-cursor-echo analytics-tooltip-cursor-echo--out"
    />
  );
}
