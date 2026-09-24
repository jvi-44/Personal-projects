import type { IncomingMessage, ServerResponse } from 'node:http';
import { celestrakHandler } from './celestrak.js';
import { pointHandler, seriesHandler, statusHandler, thumbHandler, tilesHandler } from './ee/handlers.js';

export interface ApiResponse {
  status: number;
  /** Objects are JSON-encoded; strings are sent as-is. */
  body: unknown;
  headers?: Record<string, string>;
}

type Handler = (q: URLSearchParams) => Promise<ApiResponse>;

export const ROUTES: Record<string, Handler> = {
  celestrak: celestrakHandler,
  'ee/status': statusHandler,
  'ee/tiles': tilesHandler,
  'ee/point': pointHandler,
  'ee/series': seriesHandler,
  'ee/thumb': thumbHandler,
};

/* Very small per-IP limiter so one visitor can't burn the Earth Engine quota. */
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string, route: string): boolean {
  if (!route.startsWith('ee/') || route === 'ee/status') return false;
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > 90;
}

export async function dispatch(route: string, q: URLSearchParams, ip = ''): Promise<ApiResponse> {
  const handler = ROUTES[route];
  if (!handler) return { status: 404, body: { error: `no route /api/${route}` } };
  if (limited(ip, route)) return { status: 429, body: { error: 'slow down — too many requests' } };
  try {
    return await handler(q);
  } catch (e) {
    return { status: 500, body: { error: e instanceof Error ? e.message : String(e) } };
  }
}

export function send(res: ServerResponse, out: ApiResponse): void {
  const isText = typeof out.body === 'string';
  res.statusCode = out.status;
  res.setHeader('Content-Type', isText ? 'application/json' : 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(out.headers ?? {})) res.setHeader(k, v);
  res.end(isText ? (out.body as string) : JSON.stringify(out.body));
}

/** Node/Connect-style middleware: handles /api/* and passes everything else on. */
export async function apiMiddleware(req: IncomingMessage, res: ServerResponse, next?: () => void): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return next?.();
  const route = url.pathname.slice(5).replace(/\/+$/, '');
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket.remoteAddress || '';
  send(res, await dispatch(route, url.searchParams, ip));
}
