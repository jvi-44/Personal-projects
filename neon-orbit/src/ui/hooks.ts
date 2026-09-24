import { useEffect, useReducer } from 'react';
import { engine } from '../globe/engine';

/** Re-render every `ms` (for live telemetry) and whenever the engine catalogue changes. */
export function useTicker(ms: number): number {
  const [n, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const id = window.setInterval(bump, ms);
    const off = engine.subscribe(bump);
    return () => {
      window.clearInterval(id);
      off();
    };
  }, [ms]);
  return n;
}

/** Re-render only when the engine catalogue / selection changes. */
export function useEngineVersion(): number {
  const [n, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => engine.subscribe(bump), []);
  return n;
}

export const fmt = {
  int: (n: number) => Math.round(n).toLocaleString('en-US'),
  num: (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
  compact: (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toLocaleString('en-US')),
  lat: (v: number) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? 'N' : 'S'}`,
  lon: (v: number) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? 'E' : 'W'}`,
  dur: (min: number) => (min >= 120 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} m` : `${min.toFixed(1)} min`),
  utc: (d: Date) => d.toISOString().slice(11, 19),
  date: (d: Date) => d.toISOString().slice(0, 10),
  age: (ms: number) => {
    const h = ms / 3600_000;
    if (h < 1) return `${Math.max(1, Math.round(ms / 60_000))} min`;
    if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
    return `${(h / 24).toFixed(1)} d`;
  },
};
