#!/usr/bin/env node
// Zero-dependency dev server: serves the dashboard and proxies one-way sync to Notion.
//   NOTION_TOKEN=secret_xxx node server.js      (PORT defaults to 5173)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNotion } from "./notion.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 5173;
const TOKEN = process.env.NOTION_TOKEN || "";
// "Vi's Starmap 2026" page (override with NOTION_PAGE_ID)
const PAGE_ID = (process.env.NOTION_PAGE_ID || "16872bf06f3180cebf9dd82a1a6c063c").replace(/-/g, "");
const MAP_FILE = path.join(ROOT, "data", "notion-map.json");

const store = {
  get() { try { return JSON.parse(fs.readFileSync(MAP_FILE, "utf8")); } catch { return {}; } },
  set(v) { fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true }); fs.writeFileSync(MAP_FILE, JSON.stringify(v, null, 2)); },
};
const notion = TOKEN ? createNotion({ token: TOKEN, pageId: PAGE_ID, store, log: (m) => console.log("[notion]", m) }) : null;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok, no) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch (e) { no(e); } }); });

let queue = Promise.resolve(); // serialise syncs so Notion writes never interleave

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/status") return json(res, 200, { connected: !!TOKEN, pageId: PAGE_ID, linkedWeeks: Object.keys(store.get().weeks || {}) });
    if (url.pathname === "/api/sync" && req.method === "POST") {
      const payload = await body(req);
      if (!notion) return json(res, 200, { dryRun: true, message: "NOTION_TOKEN not set; nothing was written.", days: payload.days.length });
      const run = queue.then(() => notion.syncWeek(payload));
      queue = run.catch(() => {});
      return json(res, 200, await run);
    }
    // static files
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (p === "/" || p === path.sep) p = "/index.html";
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || /(^|[/\\])(data|test|server\.js|notion\.js)([/\\]|$)/.test(p) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    json(res, 500, { error: e.message });
  }
}).listen(PORT, () => console.log(`Vi's Starmap → http://localhost:${PORT}  (Notion ${TOKEN ? "connected" : "NOT connected: dry-run mode"})`));
