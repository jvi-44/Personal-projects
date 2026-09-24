import { useEffect, useState } from 'react';
import { eeCatalogUrl, EE_LAYER_BY_ID, EE_LAYERS, WORLDCOVER_CLASSES, type EECategory, type EELayerMeta } from '../../shared/eeLayers';
import { eeThumb } from '../data/eeApi';
import { GIBS_BY_ID, GIBS_LAYERS } from '../data/gibsLayers';
import { addOverlay, clearProbe, removeOverlay, runProbe, setDates, setOpacity } from '../data/overlays';
import { engine } from '../globe/engine';
import { useStore, type Overlay } from '../state/store';
import { LineChart } from './charts';
import { fmt } from './hooks';

const CATS: [EECategory, string][] = [
  ['imagery', 'Imagery'],
  ['atmosphere', 'Air quality & atmosphere'],
  ['land', 'Land'],
  ['water', 'Water & climate'],
  ['human', 'Human footprint'],
];

function Legend({ meta }: { meta: EELayerMeta }) {
  if (meta.id === 'landcover')
    return (
      <div className="swatches">
        {WORLDCOVER_CLASSES.map(([v, name, hex]) => (
          <span key={v}>
            <i style={{ background: `#${hex}` }} />
            {name}
          </span>
        ))}
      </div>
    );
  if (!meta.vis.palette) return <div className="hint" style={{ marginTop: 6 }}>Natural-colour composite (reflectance {meta.vis.min}–{meta.vis.max}).</div>;
  return (
    <div className="legend">
      <div className="ramp" style={{ background: `linear-gradient(90deg, ${meta.vis.palette.map((c) => `#${c}`).join(',')})` }} />
      <div className="ticks">
        <span>≤ {meta.vis.min}</span>
        <span>{meta.units}</span>
        <span>≥ {meta.vis.max}</span>
      </div>
    </div>
  );
}

function OverlayCard({ o }: { o: Overlay }) {
  const notify = useStore((s) => s.notify);
  const [busy, setBusy] = useState(false);
  const gee = o.source === 'gee' ? EE_LAYER_BY_ID[o.layerId] : null;
  const gibs = o.source === 'gibs' ? GIBS_BY_ID[o.layerId] : null;
  const name = gee?.name ?? gibs?.name ?? o.layerId;

  const snapshot = async () => {
    const box = engine.viewRectangle();
    if (!box || !gee) return notify('Point the camera at the Earth first.', 'warn');
    setBusy(true);
    try {
      const { url } = await eeThumb(o.layerId, o.effStart || o.start, o.effEnd || o.end, box);
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      notify(`Snapshot failed: ${e instanceof Error ? e.message : e}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay-card">
      <div className="title">
        <span className={`led ${o.status === 'ready' ? 'ok' : o.status === 'error' ? 'bad' : 'busy'}`} />
        <span style={{ flex: 1 }}>{name}</span>
        <span className={`chip ${o.source}`}>{o.source === 'gee' ? 'Earth Engine' : 'NASA GIBS'}</span>
        <button className="btn icon ghost" aria-label={`Remove ${name}`} onClick={() => removeOverlay(o.key)}>
          ✕
        </button>
      </div>
      {o.status === 'error' && (
        <div className="banner" style={{ marginTop: 8, marginBottom: 0 }}>
          <b>Couldn’t load:</b> {o.error}
        </div>
      )}
      {gee && gee.temporal === 'range' && (
        <div className="row" style={{ marginTop: 8, flexWrap: 'nowrap' }}>
          <input className="input" type="date" value={o.start} max={o.end} aria-label="Start date" onChange={(e) => e.target.value && setDates(o.key, e.target.value, o.end)} />
          <span className="hint">→</span>
          <input className="input" type="date" value={o.end} min={o.start} aria-label="End date" onChange={(e) => e.target.value && setDates(o.key, o.start, e.target.value)} />
        </div>
      )}
      {gibs && !gibs.static && (
        <div className="row" style={{ marginTop: 8 }}>
          <span className="label">Day</span>
          <input className="input" style={{ width: 150 }} type="date" value={o.end} max={new Date().toISOString().slice(0, 10)} aria-label="Imagery date" onChange={(e) => e.target.value && setDates(o.key, '', e.target.value)} />
        </div>
      )}
      {o.shifted && o.effStart && (
        <div className="hint" style={{ marginTop: 4 }}>
          Latest available: {o.effStart} → {o.effEnd}
        </div>
      )}
      <div className="row" style={{ marginTop: 8, flexWrap: 'nowrap' }}>
        <span className="label">Opacity</span>
        <input type="range" min={0} max={1} step={0.05} value={o.opacity} aria-label="Opacity" onChange={(e) => setOpacity(o.key, Number(e.target.value))} />
        <span className="value" style={{ width: 34, textAlign: 'right' }}>
          {Math.round(o.opacity * 100)}%
        </span>
      </div>
      {gee && <Legend meta={gee} />}
      <div className="row" style={{ marginTop: 8 }}>
        {gee && (
          <>
            <button className="btn" disabled={o.status !== 'ready' || busy} onClick={() => void snapshot()}>
              {busy ? '… rendering' : '⤓ PNG of view'}
            </button>
            <a className="btn ghost" href={eeCatalogUrl(gee.dataset)} target="_blank" rel="noreferrer">
              Dataset ↗
            </a>
          </>
        )}
        {gibs && (
          <a className="btn ghost" href={`https://worldview.earthdata.nasa.gov/?l=${gibs.layer}${gibs.static ? '' : `&t=${o.end}`}`} target="_blank" rel="noreferrer">
            Worldview ↗
          </a>
        )}
      </div>
      {gee && <div className="hint" style={{ marginTop: 6 }}>{gee.citation}</div>}
    </div>
  );
}

function Probe() {
  const probe = useStore((s) => s.probe);
  const probeMode = useStore((s) => s.probeMode);
  const overlays = useStore((s) => s.overlays);
  const set = useStore((s) => s.set);
  const hasGee = overlays.some((o) => o.source === 'gee' && o.status === 'ready');

  useEffect(() => {
    const on = (e: Event) => void runProbe((e as CustomEvent).detail.lat, (e as CustomEvent).detail.lon);
    window.addEventListener('neon:probe', on);
    return () => window.removeEventListener('neon:probe', on);
  }, []);

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row">
        <button className={`btn ${probeMode ? 'on' : ''}`} aria-pressed={probeMode} disabled={!hasGee} onClick={() => set({ probeMode: !probeMode })}>
          ◎ Probe {probeMode ? 'on' : 'mode'}
        </button>
        {probe && (
          <button className="btn ghost" onClick={clearProbe}>
            Clear pin
          </button>
        )}
      </div>
      {!hasGee && <div className="hint" style={{ marginTop: 6 }}>Add an Earth Engine layer, then click anywhere on the globe to read its value and a 12-month trend.</div>}
      {probe && (
        <div style={{ marginTop: 10 }}>
          <div className="label">
            Pin · {fmt.lat(probe.lat)} {fmt.lon(probe.lon)}
          </div>
          {probe.rows.length === 0 && <div className="hint">No Earth Engine layers active.</div>}
          {probe.rows.map((r) => {
            const meta = EE_LAYER_BY_ID[r.layerId];
            const v = r.values;
            let text = '…';
            if (r.state === 'error') text = r.error ?? 'error';
            else if (v && meta.scalar) text = v.v == null ? 'no data (masked / cloud)' : `${fmt.num(v.v, meta.decimals)} ${meta.units ?? ''}`;
            else if (v && meta.id === 'landcover') text = WORLDCOVER_CLASSES.find((c) => c[0] === v.v)?.[1] ?? 'no data';
            else if (v) text = ['R', 'G', 'B'].map((b) => (v[b] == null ? '–' : v[b]!.toFixed(3))).join(' / ') + ' reflectance';
            const pts = r.series?.map((p) => ({ x: Date.parse(p.t), y: p.v }));
            return (
              <div key={r.overlayKey} style={{ marginTop: 8 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{meta.short}</span>
                  <span className="value">{text}</span>
                </div>
                {pts && pts.some((p) => p.y != null) && (
                  <>
                    <div className="hint" style={{ margin: '4px 0 2px' }}>
                      Monthly {meta.id === 'precip' ? 'total' : 'mean'}, last 12 months ({meta.units})
                    </div>
                    <LineChart
                      points={pts}
                      color="#39ff88"
                      height={80}
                      formatX={(x) => new Date(x).toISOString().slice(0, 7)}
                      formatY={(y) => fmt.num(y, meta.decimals)}
                      ariaLabel={`${meta.name} monthly values at the pin`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DataPanel() {
  const overlays = useStore((s) => s.overlays);
  const status = useStore((s) => s.eeStatus);
  const [filter, setFilter] = useState('');

  const eeReady = status !== null && status !== 'unavailable' && status.configured;
  const active = new Set(overlays.map((o) => o.key));
  const f = filter.toLowerCase();
  const match = (s: string) => !f || s.toLowerCase().includes(f);

  return (
    <div>
      {status === 'unavailable' && (
        <div className="banner">
          <b>Earth Engine offline.</b> This deployment has no <code>/api</code> backend (static hosting). NASA GIBS layers below still work. See README → “Earth Engine”.
        </div>
      )}
      {status && status !== 'unavailable' && !status.configured && (
        <div className="banner">
          <b>Earth Engine not configured.</b> Set <code>EE_PROJECT_ID</code> and <code>EE_SERVICE_ACCOUNT_JSON</code> on the server to unlock Landsat, Sentinel-2, Sentinel-5P pollution and more.
        </div>
      )}

      {overlays.length > 0 && (
        <>
          <div className="label" style={{ marginBottom: 6 }}>
            Active layers
          </div>
          {overlays.map((o) => (
            <OverlayCard key={o.key} o={o} />
          ))}
          <Probe />
        </>
      )}

      <input className="input" placeholder="Filter datasets… (e.g. NO₂, landsat, rain)" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter datasets" />
      {CATS.map(([cat, label]) => {
        const ee = EE_LAYERS.filter((l) => l.category === cat && match(`${l.name} ${l.short} ${l.description}`));
        const gibs = GIBS_LAYERS.filter((l) => l.category === cat && match(`${l.name} ${l.short} ${l.description}`));
        if (!ee.length && !gibs.length) return null;
        return (
          <div key={cat}>
            <div className="cat">{label.toUpperCase()}</div>
            {ee.map((l) => (
              <button
                key={l.id}
                className="layer-item"
                aria-disabled={!eeReady || active.has(`gee:${l.id}`)}
                onClick={() => eeReady && addOverlay('gee', l.id)}
                title={eeReady ? 'Add to globe' : 'Needs the Earth Engine backend'}
              >
                <span className="ln">{l.name}</span>
                <span className="chip gee">{active.has(`gee:${l.id}`) ? 'on' : 'GEE'}</span>
                <span className="ld">{l.description}</span>
              </button>
            ))}
            {gibs.map((l) => (
              <button key={l.id} className="layer-item" aria-disabled={active.has(`gibs:${l.id}`)} onClick={() => addOverlay('gibs', l.id)} title="Add to globe">
                <span className="ln">{l.name}</span>
                <span className="chip gibs">{active.has(`gibs:${l.id}`) ? 'on' : 'GIBS'}</span>
                <span className="ld">{l.description}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
