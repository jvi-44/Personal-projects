import { EE_LAYER_BY_ID, isoDate, validateWindow, type EELayerMeta } from '../../shared/eeLayers.js';
import type { ApiResponse } from '../http.js';
import { eeStatus, evaluate, getEE, getMapUrl, getThumbUrl, NotConfiguredError } from './client.js';
import { composite, RECIPES, visualised } from './recipes.js';

const DAY = 86_400_000;
const TTL = 2 * 3600_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

const json = (status: number, body: unknown, maxAge = 0): ApiResponse => ({
  status,
  body,
  headers: maxAge ? { 'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}` } : { 'Cache-Control': 'no-store' },
});

function fail(e: unknown): ApiResponse {
  if (e instanceof NotConfiguredError) return json(503, { error: e.message, code: 'EE_NOT_CONFIGURED' });
  const msg = e instanceof Error ? e.message : String(e);
  return json(502, { error: `Earth Engine: ${msg}` });
}

function layerFrom(q: URLSearchParams): EELayerMeta | string {
  const id = q.get('layer') ?? '';
  const meta = EE_LAYER_BY_ID[id];
  if (!meta || !RECIPES[id]) return `unknown layer "${id}"`;
  return meta;
}

function num(q: URLSearchParams, k: string, lo: number, hi: number): number | null {
  const v = Number(q.get(k));
  return q.get(k) !== null && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
}

/**
 * If the requested window contains no images (e.g. a product with a publishing lag),
 * slide the window back so it ends at the latest available acquisition.
 */
async function effectiveWindow(meta: EELayerMeta, start: string, end: string): Promise<{ start: string; end: string; shifted: boolean }> {
  if (meta.temporal === 'static') return { start: '', end: '', shifted: false };
  return cached(`win:${meta.id}:${start}:${end}`, async () => {
    const ee = await getEE();
    const raw = RECIPES[meta.id].raw!(ee);
    const n = await evaluate<number>(raw.filterDate(start, end).limit(1).size());
    if (n > 0) return { start, end, shifted: false };
    const lookback = isoDate(new Date(Date.parse(end) - 400 * DAY));
    const latest = await evaluate<number | null>(raw.filterDate(lookback, end).aggregate_max('system:time_start'));
    if (!latest) throw new Error(`no ${meta.short} data in the year before ${end}`);
    const span = Date.parse(end) - Date.parse(start);
    const newEnd = new Date(latest + DAY);
    return { start: isoDate(new Date(newEnd.getTime() - span)), end: isoDate(newEnd), shifted: true };
  });
}

function parseWindow(meta: EELayerMeta, q: URLSearchParams) {
  return validateWindow(meta, q.get('start'), q.get('end'));
}

export async function statusHandler(): Promise<ApiResponse> {
  return json(200, eeStatus(), 60);
}

export async function tilesHandler(q: URLSearchParams): Promise<ApiResponse> {
  const meta = layerFrom(q);
  if (typeof meta === 'string') return json(400, { error: meta });
  const win = parseWindow(meta, q);
  if (typeof win === 'string') return json(400, { error: win });
  try {
    const eff = await effectiveWindow(meta, win.start, win.end);
    const urlFormat = await cached(`tiles:${meta.id}:${eff.start}:${eff.end}`, async () => {
      const ee = await getEE();
      const { image, vis } = visualised(ee, meta.id, composite(ee, meta.id, eff.start, eff.end));
      return getMapUrl(image, vis);
    });
    return json(200, { layer: meta.id, urlFormat, start: eff.start, end: eff.end, shifted: eff.shifted }, 3600);
  } catch (e) {
    return fail(e);
  }
}

export async function pointHandler(q: URLSearchParams): Promise<ApiResponse> {
  const meta = layerFrom(q);
  if (typeof meta === 'string') return json(400, { error: meta });
  const win = parseWindow(meta, q);
  if (typeof win === 'string') return json(400, { error: win });
  const lat = num(q, 'lat', -90, 90);
  const lon = num(q, 'lon', -180, 180);
  if (lat === null || lon === null) return json(400, { error: 'lat/lon out of range' });
  try {
    const eff = await effectiveWindow(meta, win.start, win.end);
    const ee = await getEE();
    const img = composite(ee, meta.id, eff.start, eff.end);
    const values = await evaluate<Record<string, number | null>>(
      img.reduceRegion({ reducer: ee.Reducer.first(), geometry: ee.Geometry.Point([lon, lat]), scale: meta.probeScale }),
    );
    return json(200, { layer: meta.id, lat, lon, start: eff.start, end: eff.end, values }, 3600);
  } catch (e) {
    return fail(e);
  }
}

/** Twelve monthly values at a point, ending with the month that contains `end`. */
export async function seriesHandler(q: URLSearchParams): Promise<ApiResponse> {
  const meta = layerFrom(q);
  if (typeof meta === 'string') return json(400, { error: meta });
  if (!meta.scalar || meta.temporal === 'static') return json(400, { error: 'time series needs a scalar, time-varying layer' });
  const lat = num(q, 'lat', -90, 90);
  const lon = num(q, 'lon', -180, 180);
  if (lat === null || lon === null) return json(400, { error: 'lat/lon out of range' });
  const endStr = q.get('end') ?? isoDate(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endStr)) return json(400, { error: 'end must be YYYY-MM-DD' });
  const endD = new Date(`${endStr}T00:00:00Z`);
  const months: { s: string; e: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const s = new Date(Date.UTC(endD.getUTCFullYear(), endD.getUTCMonth() - i, 1));
    const e = new Date(Date.UTC(endD.getUTCFullYear(), endD.getUTCMonth() - i + 1, 1));
    months.push({ s: isoDate(s), e: isoDate(e) });
  }
  try {
    const key = `series:${meta.id}:${lat.toFixed(3)}:${lon.toFixed(3)}:${months[11].s}`;
    const points = await cached(key, async () => {
      const ee = await getEE();
      const pt = ee.Geometry.Point([lon, lat]);
      const feats = months.map(({ s, e }) => {
        const d = composite(ee, meta.id, s, e).reduceRegion({ reducer: ee.Reducer.first(), geometry: pt, scale: meta.probeScale });
        return ee.Feature(null, { t: s, v: d.get('v') });
      });
      const fc = await evaluate<{ features: { properties: { t: string; v: number | null } }[] }>(ee.FeatureCollection(feats));
      return fc.features.map((f) => ({ t: f.properties.t, v: f.properties.v ?? null }));
    });
    return json(200, { layer: meta.id, lat, lon, units: meta.units, points }, 3600);
  } catch (e) {
    return fail(e);
  }
}

/** PNG snapshot of a lon/lat box — for "download what I'm looking at". */
export async function thumbHandler(q: URLSearchParams): Promise<ApiResponse> {
  const meta = layerFrom(q);
  if (typeof meta === 'string') return json(400, { error: meta });
  const win = parseWindow(meta, q);
  if (typeof win === 'string') return json(400, { error: win });
  const w = num(q, 'west', -180, 180);
  const s = num(q, 'south', -90, 90);
  const e = num(q, 'east', -180, 180);
  const n = num(q, 'north', -90, 90);
  if (w === null || s === null || e === null || n === null || e <= w || n <= s) return json(400, { error: 'bad bbox' });
  try {
    const eff = await effectiveWindow(meta, win.start, win.end);
    const ee = await getEE();
    const { image, vis } = visualised(ee, meta.id, composite(ee, meta.id, eff.start, eff.end));
    const url = await getThumbUrl(image.visualize(vis), {
      region: ee.Geometry.Rectangle([w, s, e, n], 'EPSG:4326', false),
      dimensions: 1024,
      format: 'png',
    });
    return json(200, { url, start: eff.start, end: eff.end }, 600);
  } catch (err) {
    return fail(err);
  }
}
