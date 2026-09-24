import type { ApiResponse } from './http.js';

/**
 * Caching proxy for CelesTrak GP (orbital element) data.
 *
 * CelesTrak asks clients not to download the same data more than once every
 * two hours; this proxy plus the CDN headers means all visitors share one copy.
 */
const UPSTREAM = 'https://celestrak.org/NORAD/elements/gp.php';
const TTL = 2 * 3600_000;
const cache = new Map<string, { at: number; body: string }>();

const ALLOWED: Record<string, RegExp> = {
  GROUP: /^[a-z0-9-]{2,32}$/,
  NAME: /^[A-Za-z0-9 ._\-/()]{2,32}$/,
  CATNR: /^\d{1,9}$/,
};

export function parseQuery(q: URLSearchParams): { key: string; value: string } | string {
  const keys = Object.keys(ALLOWED).filter((k) => q.has(k));
  if (keys.length !== 1) return 'exactly one of GROUP, NAME or CATNR is required';
  const key = keys[0];
  const value = q.get(key)!.trim();
  if (!ALLOWED[key].test(value)) return `invalid ${key}`;
  return { key, value };
}

export async function celestrakHandler(q: URLSearchParams): Promise<ApiResponse> {
  const parsed = parseQuery(q);
  if (typeof parsed === 'string') return { status: 400, body: { error: parsed } };
  const cacheKey = `${parsed.key}=${parsed.value}`;
  const hit = cache.get(cacheKey);
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=1800, s-maxage=7200, stale-while-revalidate=86400',
  };
  if (hit && Date.now() - hit.at < TTL) return { status: 200, body: hit.body, headers };
  try {
    const url = `${UPSTREAM}?${parsed.key}=${encodeURIComponent(parsed.value)}&FORMAT=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'neon-orbit/0.1 (personal satellite dashboard)' } });
    if (!res.ok) throw new Error(`CelesTrak HTTP ${res.status}`);
    const text = await res.text();
    // CelesTrak answers unknown queries with a plain-text notice rather than [].
    const body = text.trimStart().startsWith('[') ? text : '[]';
    cache.set(cacheKey, { at: Date.now(), body });
    return { status: 200, body, headers };
  } catch (e) {
    if (hit) return { status: 200, body: hit.body, headers: { ...headers, 'X-Stale': '1' } };
    return { status: 502, body: { error: e instanceof Error ? e.message : String(e) } };
  }
}
