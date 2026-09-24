import { engine } from '../globe/engine';
import { useStore } from '../state/store';
import { fmt, useTicker } from './hooks';

const SPEEDS = [1, 10, 60, 300, 1800];

function offsetText(s: number): string {
  const a = Math.abs(s);
  if (a < 2) return 'real time';
  const sign = s > 0 ? '+' : '−';
  if (a < 120) return `${sign}${a.toFixed(0)} s`;
  if (a < 7200) return `${sign}${(a / 60).toFixed(0)} min`;
  if (a < 172800) return `${sign}${(a / 3600).toFixed(1)} h`;
  return `${sign}${(a / 86400).toFixed(1)} d`;
}

export function BottomBar({ credits }: { credits: React.RefObject<HTMLDivElement | null> }) {
  useTicker(500);
  const multiplier = useStore((s) => s.multiplier);
  const paused = useStore((s) => s.paused);
  const set = useStore((s) => s.set);
  const viewer = engine.viewer;
  const sim = viewer ? engine.now() : new Date();
  const off = viewer ? engine.offsetSeconds() : 0;
  const live = !paused && multiplier === 1 && Math.abs(off) < 2;
  const counts = viewer ? engine.regimeCounts() : { LEO: 0, MEO: 0, GEO: 0, HEO: 0 };
  const total = counts.LEO + counts.MEO + counts.GEO + counts.HEO;
  const regimes: [keyof typeof counts, string][] = [
    ['LEO', 'var(--reg-1)'],
    ['MEO', 'var(--reg-2)'],
    ['GEO', 'var(--reg-3)'],
    ['HEO', 'var(--reg-4)'],
  ];

  return (
    <footer className="bottombar">
      <div className="timectl">
        <button className={`btn ${live ? 'on' : ''}`} onClick={() => engine.goLive()} title="Jump to now, real-time speed">
          {live ? <span className="live-dot">●</span> : '⟲'} Live
        </button>
        <button className="btn icon" onClick={() => set({ paused: !paused })} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? '▶' : '❚❚'}
        </button>
        <div className="speed" role="group" aria-label="Simulation speed">
          {SPEEDS.map((s) => (
            <button key={s} aria-pressed={multiplier === s} onClick={() => set({ multiplier: s, paused: false })}>
              {s}×
            </button>
          ))}
        </div>
      </div>
      <div className="simtime">
        <div className="v">
          SIM {fmt.date(sim)} {fmt.utc(sim)}Z
        </div>
        <div className="o">{offsetText(off)}</div>
      </div>
      <div className="bottom-stats">
        <div className="hide-sm" style={{ width: 220 }}>
          <div className="regimes" role="img" aria-label={regimes.map(([k]) => `${k} ${counts[k]}`).join(', ')}>
            {regimes.map(([k, c]) => (counts[k] ? <i key={k} style={{ flex: counts[k], background: c }} title={`${k}: ${counts[k]}`} /> : null))}
          </div>
          <div className="regime-legend">
            {regimes.map(([k, c]) => (
              <span key={k}>
                <i style={{ background: c }} />
                {k} {fmt.compact(counts[k])}
              </span>
            ))}
          </div>
        </div>
        <div className="bigstat">
          <div className="label">Tracking</div>
          <div className="v">{fmt.int(total)}</div>
        </div>
        <div className="credits" ref={credits} />
      </div>
    </footer>
  );
}
