import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/** Deploying under a sub-path (e.g. GitHub Pages)? set BASE_PATH=/repo-name/ */
const base = process.env.BASE_PATH ?? '/';
const CESIUM_SRC = resolve('node_modules/cesium/Build/Cesium');
const CESIUM_DIR = 'cesiumStatic';

/** Cesium needs its Workers/Assets/Widgets served as static files. */
function cesiumStatic(): Plugin {
  const mime: Record<string, string> = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.wasm': 'application/wasm' };
  return {
    name: 'cesium-static',
    configureServer(server) {
      server.middlewares.use(`${base}${CESIUM_DIR}`, (req, res, next) => {
        const file = join(CESIUM_SRC, decodeURIComponent((req.url ?? '').split('?')[0]));
        if (!file.startsWith(CESIUM_SRC) || !existsSync(file) || statSync(file).isDirectory()) return next();
        res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    writeBundle(opts) {
      const out = join(opts.dir ?? 'dist', CESIUM_DIR);
      for (const dir of ['Workers', 'ThirdParty', 'Assets', 'Widgets']) cpSync(join(CESIUM_SRC, dir), join(out, dir), { recursive: true });
    },
  };
}

/** In `vite dev` / `vite preview`, serve /api/* from server/http.ts (same code Vercel runs). */
function apiDev(mode: string): Plugin {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ['EE_']));
  return {
    name: 'neon-orbit-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const mod = await server.ssrLoadModule('/server/http.ts');
        await mod.apiMiddleware(req, res, next);
      });
    },
    async configurePreviewServer(server) {
      // @ts-ignore — resolved at runtime by tsx/vite
      const { apiMiddleware } = await import('./server/http.ts');
      server.middlewares.use((req, res, next) => void apiMiddleware(req, res, next));
    },
  };
}

export default defineConfig(({ mode }) => ({
  base,
  define: { __CESIUM_BASE__: JSON.stringify(`${base}${CESIUM_DIR}/`) },
  plugins: [react(), cesiumStatic(), apiDev(mode)],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 6000, target: 'es2022' },
  server: { port: 5173 },
}));
