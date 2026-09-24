import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Query } from './groups';
import type { OMM } from './types';

/** CelesTrak refreshes GP data every ~2 h and asks clients not to poll faster. */
const TTL = 2 * 3600_000;
const DIRECT = 'https://celestrak.org/NORAD/elements/gp.php';
const API = `${import.meta.env.BASE_URL}api/celestrak`;

export interface FetchResult {
  records: OMM[];
  fetchedAt: number;
  source: 'proxy' | 'celestrak' | 'cache' | 'stale-cache';
}

let proxyAvailable: boolean | null = null;

function qs(q: Query): string {
  const [k, v] = Object.entries(q)[0];
  return `${k}=${encodeURIComponent(v)}`;
}

function valid(data: unknown): data is OMM[] {
  return Array.isArray(data) && data.every((d) => d && typeof d === 'object' && 'NORAD_CAT_ID' in d && 'MEAN_MOTION' in d);
}

async function getJSON(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  const text = await res.text();
  // CelesTrak replies "No GP data found" (plain text) for empty queries.
  return text.trimStart().startsWith('[') ? JSON.parse(text) : [];
}

async function download(q: Query): Promise<{ records: OMM[]; source: 'proxy' | 'celestrak' }> {
  if (proxyAvailable !== false) {
    try {
      const data = await getJSON(`${API}?${qs(q)}`);
      if (valid(data)) {
        proxyAvailable = true;
        return { records: data, source: 'proxy' };
      }
    } catch (e) {
      // 404 → static hosting without the API; don't try again this session.
      if ((e as { status?: number }).status === 404) proxyAvailable = false;
    }
  }
  const data = await getJSON(`${DIRECT}?${qs(q)}&FORMAT=json`);
  if (!valid(data)) throw new Error('unexpected CelesTrak response');
  return { records: data, source: 'celestrak' };
}

async function cacheGet(key: string): Promise<{ at: number; records: OMM[] } | undefined> {
  try {
    return await idbGet(key);
  } catch {
    return undefined;
  }
}

/** Fetch one CelesTrak query with a 2-hour IndexedDB cache (stale copy used if offline). */
export async function fetchQuery(q: Query): Promise<FetchResult> {
  const key = `gp:${qs(q)}`;
  const hit = await cacheGet(key);
  if (hit && Date.now() - hit.at < TTL) return { records: hit.records, fetchedAt: hit.at, source: 'cache' };
  try {
    const { records, source } = await download(q);
    const at = Date.now();
    idbSet(key, { at, records }).catch(() => undefined);
    return { records, fetchedAt: at, source };
  } catch (e) {
    if (hit) return { records: hit.records, fetchedAt: hit.at, source: 'stale-cache' };
    throw e;
  }
}
