import { useRef, useState } from 'react';

export interface Pt {
  x: number;
  y: number | null;
}

/**
 * Single-series line with a crosshair + tooltip. One series → no legend box;
 * the caller's heading names it. Min/max are direct-labelled on the y axis.
 */
export function LineChart({
  points,
  color,
  height = 90,
  formatX,
  formatY,
  marker,
  ariaLabel,
}: {
  points: Pt[];
  color: string;
  height?: number;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  /** x of a "now" marker. */
  marker?: number;
  ariaLabel: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = height;
  const pad = { l: 44, r: 8, t: 8, b: 16 };
  const valid = points.filter((p) => p.y != null) as { x: number; y: number }[];
  if (valid.length < 2) return <div className="hint">Not enough data to chart.</div>;
  const x0 = points[0].x;
  const x1 = points[points.length - 1].x;
  let y0 = Math.min(...valid.map((p) => p.y));
  let y1 = Math.max(...valid.map((p) => p.y));
  if (y1 - y0 < 1e-9) {
    y0 -= 1;
    y1 += 1;
  }
  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  // Break the line at gaps (null values).
  let d = '';
  let pen = false;
  for (const p of points) {
    if (p.y == null) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`;
    pen = true;
  }
  const area = `M${sx(valid[0].x)},${H - pad.b}` + valid.map((p) => `L${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('') + `L${sx(valid[valid.length - 1].x)},${H - pad.b}Z`;

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    let bd = Infinity;
    points.forEach((p, i) => {
      const dd = Math.abs(sx(p.x) - px);
      if (dd < bd && p.y != null) {
        bd = dd;
        best = i;
      }
    });
    setHover(best);
  };
  const hp = hover != null ? points[hover] : null;
  const mk = marker != null ? valid.reduce((a, b) => (Math.abs(b.x - marker) < Math.abs(a.x - marker) ? b : a)) : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={ref} className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(y1)} y2={sy(y1)} />
        <line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(y0)} y2={sy(y0)} />
        <text x={pad.l - 6} y={sy(y1) + 3} textAnchor="end">
          {formatY(y1)}
        </text>
        <text x={pad.l - 6} y={sy(y0) + 3} textAnchor="end">
          {formatY(y0)}
        </text>
        <text x={pad.l} y={H - 2}>
          {formatX(x0)}
        </text>
        <text x={W - pad.r} y={H - 2} textAnchor="end">
          {formatX(x1)}
        </text>
        <path d={area} fill={color} opacity={0.1} />
        <path d={d} className="line" stroke={color} />
        {mk && <circle cx={sx(mk.x)} cy={sy(mk.y)} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={2} />}
        {hp && hp.y != null && (
          <>
            <line x1={sx(hp.x)} x2={sx(hp.x)} y1={pad.t} y2={H - pad.b} stroke="var(--text-2)" strokeWidth={1} />
            <circle cx={sx(hp.x)} cy={sy(hp.y)} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
          </>
        )}
        <rect className="hit" x={pad.l} y={0} width={W - pad.l - pad.r} height={H} />
      </svg>
      {hp && hp.y != null && (
        <div className="tip" style={{ left: `${(sx(hp.x) / W) * 100}%`, top: `${(sy(hp.y) / H) * 100}%` }}>
          <span className="value">{formatY(hp.y)}</span> <span style={{ color: 'var(--muted)' }}>· {formatX(hp.x)}</span>
        </div>
      )}
    </div>
  );
}
