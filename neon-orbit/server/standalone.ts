/**
 * Self-hosting entry point: serves the built site from ./dist and the API from /api.
 *   npm run build && npm start      (PORT defaults to 8080)
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { apiMiddleware } from './http.js';

try {
  process.loadEnvFile?.();
} catch {
  /* no .env file — rely on the real environment */
}

const root = resolve('dist');
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
};

createServer((req, res) =>
  apiMiddleware(req, res, () => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) {
      res.statusCode = 403;
      return res.end();
    }
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    if (file.includes(`${join(root, 'assets')}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(file).pipe(res);
  }),
).listen(Number(process.env.PORT) || 8080, () => console.log(`NEON ORBIT → http://localhost:${Number(process.env.PORT) || 8080}`));
