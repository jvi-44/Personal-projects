import { useEffect, useState } from 'react';
import { SITE } from '../config/site';
import { engine } from '../globe/engine';
import { summarize } from '../sat/orbit';
import { useStore } from '../state/store';
import { Glyph } from './Glyph';
import { fmt } from './hooks';

export function HoverTip() {
  const hover = useStore((s) => s.hover);
  if (!hover) return null;
  const sat = engine.byNorad.get(hover.norad);
  if (!sat) return null;
  const g = engine.displayGroup(sat);
  const sum = summarize(sat.omm);
  return (
    <div className="hover-tip" style={{ left: hover.x, top: hover.y + 52 }}>
      <div className="row" style={{ gap: 6 }}>
        <Glyph glyph={g.glyph} color={g.color} size={10} />
        <b>{sat.name}</b>
      </div>
      <small>
        {g.label} · {sum.regime} · {fmt.int((sum.perigeeKm + sum.apogeeKm) / 2)} km · click to lock, double-click to inspect
      </small>
    </div>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  const set = useStore((s) => s.set);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => set({ toast: null }), toast.tone === 'error' ? 9000 : 6000);
    return () => window.clearTimeout(id);
  }, [toast, set]);
  if (!toast) return null;
  return (
    <div className={`toast ${toast.tone}`} role="status">
      <span className={`led ${toast.tone === 'error' ? 'bad' : toast.tone === 'warn' ? 'warn' : 'ok'}`} />
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button className="btn icon ghost" onClick={() => set({ toast: null })} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

const BOOT_LINES = ['> init orbital deck ........ ok', '> link celestrak gp feed ... ok', '> spin up sgp4 worker ...... ok', '> earth engine uplink ...... standby', '> render globe ............. go'];

export function BootScreen() {
  const booted = useStore((s) => s.booted);
  const [n, setN] = useState(0);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (n >= BOOT_LINES.length) return;
    const id = window.setTimeout(() => setN(n + 1), reduce ? 0 : 170);
    return () => window.clearTimeout(id);
  }, [n, reduce]);
  const done = booted && n >= BOOT_LINES.length;
  return (
    <div className={`boot ${done ? 'done' : ''}`} aria-hidden={done}>
      <div className="sun" />
      <div className="grid" />
      <div className="console">
        <div className="logo glitch" data-text={SITE.title}>
          {SITE.title}
        </div>
        <pre>{BOOT_LINES.slice(0, n).join('\n')}</pre>
      </div>
    </div>
  );
}

export function MapControls() {
  const probeMode = useStore((s) => s.probeMode);
  return (
    <>
      <div className="mapctl" role="group" aria-label="Camera">
        <button className="btn icon" onClick={() => engine.zoomBy(0.6)} aria-label="Zoom in">
          +
        </button>
        <button className="btn icon" onClick={() => engine.zoomBy(1.6)} aria-label="Zoom out">
          −
        </button>
        <button className="btn icon" onClick={() => engine.flyHome()} aria-label="Home view" title={`Home: ${SITE.observer.label}`}>
          ⌂
        </button>
      </div>
      {probeMode && <div className="probe-banner">PROBE MODE · click the globe to sample active Earth Engine layers</div>}
    </>
  );
}

export function AboutModal() {
  const open = useStore((s) => s.aboutOpen);
  const set = useStore((s) => s.set);
  if (!open) return null;
  return (
    <div className="modal-back" onClick={() => set({ aboutOpen: false })}>
      <section className="panel modal scroll" role="dialog" aria-modal="true" aria-label="About" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <span className="idx">∞</span> About this deck <span className="spacer" />
          <button className="btn icon ghost" onClick={() => set({ aboutOpen: false })} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="panel-body" style={{ lineHeight: 1.55, color: 'var(--text-2)' }}>
          <p>
            <b style={{ color: 'var(--text)' }}>{SITE.title}</b> — a personal mission-control for live orbital traffic and open Earth-observation data, by {SITE.owner}.
          </p>
          <p>
            Satellite positions are computed in your browser every ~100 ms with SGP4 from the latest CelesTrak element sets. Earth-observation layers stream from Google Earth Engine
            (through a small server so the service-account key never reaches the browser) and NASA GIBS.
          </p>
          <div className="label">Controls</div>
          <ul className="notes">
            <li>Drag to orbit · scroll / pinch to zoom · right-drag or ctrl-drag to tilt</li>
            <li>Click a satellite to lock on · double-click for the 3D inspector</li>
            <li>Earth data → add a layer → Probe mode → click the ground for values and a 12-month trend</li>
          </ul>
          <div className="label" style={{ marginTop: 12 }}>
            Data & credits
          </div>
          <ul className="notes">
            <li>Orbital elements: CelesTrak (Dr T.S. Kelso) GP data, propagated with satellite.js</li>
            <li>Globe: CesiumJS · 3D inspector: three.js</li>
            <li>Earth Engine datasets: USGS Landsat, Copernicus Sentinel-2 & Sentinel-5P (ESA/EU), NASA MODIS, ESA WorldCover, JRC Global Surface Water, NOAA ETOPO1, CHIRPS, VIIRS DNB (EOG)</li>
            <li>Imagery: NASA EOSDIS GIBS / Worldview, Natural Earth, © OpenStreetMap contributors © CARTO, Esri World Imagery</li>
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            {SITE.links.map((l) => (
              <a key={l.href} className="btn" href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
