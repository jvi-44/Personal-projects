import { SITE } from '../config/site';
import { engine } from '../globe/engine';
import { useStore } from '../state/store';
import { fmt, useTicker } from './hooks';

export function TopBar() {
  useTicker(500);
  const status = useStore((s) => s.groupStatus);
  const ee = useStore((s) => s.eeStatus);
  const set = useStore((s) => s.set);
  const now = new Date();
  const states = Object.values(status);
  const ct = states.some((s) => s.state === 'loading') ? 'busy' : states.some((s) => s.state === 'error') ? 'bad' : states.some((s) => s.state === 'ready') ? 'ok' : '';
  const eeLed = ee === null ? 'busy' : ee === 'unavailable' ? 'bad' : ee.configured ? 'ok' : 'warn';
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo glitch" data-text={SITE.title}>
          {SITE.title}
        </span>
        <span className="tagline">{SITE.tagline}</span>
      </div>
      <div className="status">
        <span title="CelesTrak orbital data">
          <i className={`led ${ct}`} /> CELESTRAK
        </span>
        <span title="Google Earth Engine backend">
          <i className={`led ${eeLed}`} /> EARTH ENGINE
        </span>
        <span className="hide-sm" title="Frames per second">
          <i className={`led ${engine.fps >= 30 ? 'ok' : engine.fps > 0 ? 'warn' : ''}`} /> {engine.fps || '--'} FPS
        </span>
        <button className="btn ghost" onClick={() => set({ aboutOpen: true })}>
          About
        </button>
      </div>
      <div className="clock" aria-live="off">
        <div className="t">{fmt.utc(now)}</div>
        <div className="d">{fmt.date(now)} UTC</div>
      </div>
    </header>
  );
}
