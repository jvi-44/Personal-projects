import { defaultWindow, EE_LAYER_BY_ID } from '../../shared/eeLayers';
import { engine } from '../globe/engine';
import { getState, type Overlay } from '../state/store';
import { eePoint, eeSeries, eeTiles } from './eeApi';
import { GIBS_BY_ID, gibsDefaultDate } from './gibsLayers';

function patch(key: string, p: Partial<Overlay>) {
  getState().set({ overlays: getState().overlays.map((o) => (o.key === key ? { ...o, ...p } : o)) });
}

async function loadGee(o: Overlay) {
  patch(o.key, { status: 'loading', error: undefined });
  try {
    const r = await eeTiles(o.layerId, o.start, o.end);
    const cur = getState().overlays.find((x) => x.key === o.key);
    // Ignore stale responses if the user changed dates meanwhile.
    if (!cur || cur.start !== o.start || cur.end !== o.end) return;
    patch(o.key, { status: 'ready', urlFormat: r.urlFormat, effStart: r.start, effEnd: r.end, shifted: r.shifted });
    if (r.shifted) getState().notify(`${EE_LAYER_BY_ID[o.layerId].short}: no data in that window yet — showing ${r.start} → ${r.end} instead.`, 'warn');
  } catch (e) {
    patch(o.key, { status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}

export function addOverlay(source: 'gee' | 'gibs', layerId: string) {
  const key = `${source}:${layerId}`;
  const st = getState();
  if (st.overlays.some((o) => o.key === key)) return;
  let o: Overlay;
  if (source === 'gee') {
    const w = defaultWindow(EE_LAYER_BY_ID[layerId]);
    o = { key, source, layerId, opacity: 0.85, start: w.start, end: w.end, status: 'loading' };
  } else {
    const g = GIBS_BY_ID[layerId];
    o = { key, source, layerId, opacity: 0.85, start: '', end: gibsDefaultDate(g), status: 'ready' };
  }
  st.set({ overlays: [...st.overlays, o] });
  if (source === 'gee') void loadGee(o);
}

export function removeOverlay(key: string) {
  getState().set({ overlays: getState().overlays.filter((o) => o.key !== key) });
}

export function setOpacity(key: string, opacity: number) {
  patch(key, { opacity });
}

export function setDates(key: string, start: string, end: string) {
  const o = getState().overlays.find((x) => x.key === key);
  if (!o) return;
  const next = { ...o, start, end };
  patch(key, { start, end });
  if (o.source === 'gee') void loadGee(next);
}

/** Query every active Earth Engine overlay at a point (value + 12-month series). */
export async function runProbe(lat: number, lon: number) {
  const st = getState();
  const gee = st.overlays.filter((o) => o.source === 'gee' && o.status === 'ready');
  engine.setProbeMarker({ lat, lon });
  st.set({ probe: { lat, lon, rows: gee.map((o) => ({ overlayKey: o.key, layerId: o.layerId, state: 'loading' as const })) } });
  if (!gee.length) return;
  await Promise.all(
    gee.map(async (o) => {
      const meta = EE_LAYER_BY_ID[o.layerId];
      const start = o.effStart || o.start;
      const end = o.effEnd || o.end;
      const update = (p: Partial<NonNullable<ReturnType<typeof getState>['probe']>['rows'][number]>) => {
        const cur = getState().probe;
        if (!cur || cur.lat !== lat || cur.lon !== lon) return;
        getState().set({ probe: { ...cur, rows: cur.rows.map((r) => (r.overlayKey === o.key ? { ...r, ...p } : r)) } });
      };
      try {
        const [pt, series] = await Promise.all([
          eePoint(o.layerId, start, end, lat, lon),
          meta.scalar && meta.temporal === 'range' ? eeSeries(o.layerId, end, lat, lon).catch(() => null) : Promise.resolve(null),
        ]);
        update({ state: 'ready', values: pt.values, series: series?.points });
      } catch (e) {
        update({ state: 'error', error: e instanceof Error ? e.message : String(e) });
      }
    }),
  );
}

export function clearProbe() {
  engine.setProbeMarker(null);
  getState().set({ probe: null });
}
