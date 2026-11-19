// Dev server: serves fairy-trove/, wraps index.html in the same skeleton the artifact publish adds,
// and injects tools/mock-claude.js when the URL has ?mock=1. /fixture/page.txt serves FT_PAGE_TEXT if set.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' };
const SKELETON_HEAD = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';

export function start(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/fixture/page.txt') {
      const f = process.env.FT_PAGE_TEXT;
      if (f && fs.existsSync(f)) { res.writeHead(200, { 'content-type': types['.txt'] }); res.end(fs.readFileSync(f)); }
      else { res.writeHead(200, { 'content-type': types['.txt'] }); res.end(''); }   // empty: the mock uses its own small page
      return;
    }
    const rel = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const p = path.join(rootDir, rel);
    if (!p.startsWith(rootDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    let body = fs.readFileSync(p);
    if (rel === '/index.html') {
      const inject = url.searchParams.get('mock') ? '<script src="tools/example-seed.js"></script><script src="tools/mock-claude.js"></script>' : '';
      body = SKELETON_HEAD + inject + body.toString('utf8') + '</body></html>';
    }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await start(Number(process.argv[2] || 8123));
  console.log('serving on http://127.0.0.1:' + s.address().port);
}
