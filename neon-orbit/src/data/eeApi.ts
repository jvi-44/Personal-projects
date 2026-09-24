import type { EEStatus } from '../state/store';

const BASE = `${import.meta.env.BASE_URL}api/ee`;

async function call<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}/${path}${qs.size ? `?${qs}` : ''}`);
  const text = await res.text();
  let body: { error?: string } & T;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(res.status === 404 ? 'Earth Engine API not deployed with this site' : `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

export async function eeStatus(): Promise<EEStatus> {
  try {
    return await call<{ configured: boolean; project?: string }>('status', {});
  } catch {
    return 'unavailable';
  }
}

export interface TilesResponse {
  urlFormat: string;
  start: string;
  end: string;
  shifted: boolean;
}

export const eeTiles = (layer: string, start: string, end: string) => call<TilesResponse>('tiles', { layer, start, end });

export const eePoint = (layer: string, start: string, end: string, lat: number, lon: number) =>
  call<{ values: Record<string, number | null>; start: string; end: string }>('point', { layer, start, end, lat: lat.toFixed(5), lon: lon.toFixed(5) });

export const eeSeries = (layer: string, end: string, lat: number, lon: number) =>
  call<{ points: { t: string; v: number | null }[]; units?: string }>('series', { layer, end, lat: lat.toFixed(4), lon: lon.toFixed(4) });

export const eeThumb = (layer: string, start: string, end: string, bbox: { west: number; south: number; east: number; north: number }) =>
  call<{ url: string }>('thumb', { layer, start, end, ...Object.fromEntries(Object.entries(bbox).map(([k, v]) => [k, v.toFixed(4)])) });
