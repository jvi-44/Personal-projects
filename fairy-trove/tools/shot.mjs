// Dev helper: serve the folder and screenshot a page with headless Chromium (software WebGL).
// node tools/shot.mjs <path-under-fairy-trove> <out.png> [width] [height] [light|dark] [waitMs] [scale]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const [, , page_ = 'tools/scene-test.html', out = 'shot.png', W = '1280', H = '800', scheme = 'light', wait = '2500', scale = '1'] = process.argv;
const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(rootDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('nope'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined,
});
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +scale, colorScheme: scheme });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => logs.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
await page.goto(`http://127.0.0.1:${port}/${page_}`, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log('title:', await page.title());
if (logs.length) console.log(logs.slice(0, 25).join('\n'));
await browser.close(); server.close();
