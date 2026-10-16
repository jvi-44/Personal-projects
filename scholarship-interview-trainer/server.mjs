// Panel Room SG: local server.
// Serves index.html and proxies Claude API calls so the page gets a live webcam,
// microphone transcription and web search. Your API key stays on this machine.
//
//   npm install
//   ANTHROPIC_API_KEY=sk-ant-... npm start      (then open http://localhost:3000)

import http from "node:http";
import { readFile } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const WEB_SEARCH = process.env.WEB_SEARCH !== "off";
const MAX_BODY = 12 * 1024 * 1024;

const client = new Anthropic();

// index.html is written as an artifact body (no <html>/<head>), so wrap it the same way claude.ai does.
const SKELETON_HEAD =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  "<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}" +
  "body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>";

async function page() {
  const body = await readFile(new URL("./index.html", import.meta.url), "utf8");
  return SKELETON_HEAD + body + "</body></html>";
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("Request too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EFFORTS = new Set(["low", "medium", "high"]);

async function handleClaude(req, res) {
  const { prompt, images = [], web = false, json = false, effort = "medium" } = await readJson(req);
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.writeHead(400, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "prompt is required" }));
  }

  const content = [];
  for (const img of images.slice(0, 6)) {
    if (img && IMAGE_TYPES.has(img.media_type) && typeof img.data === "string") {
      content.push({ type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } });
    }
  }
  content.push({
    type: "text",
    text: json ? prompt + "\n\nYour reply will be machine-parsed: output only the JSON value, with no prose or code fences." : prompt,
  });

  const params = {
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORTS.has(effort) ? effort : "medium" },
    // Re-runs a request on Anthropic's recommended model if a safety classifier declines it.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    ...(web && WEB_SEARCH ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }] } : {}),
  };

  res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });

  const userTurn = { role: "user", content };
  let assistantSoFar = [];
  const controller = new AbortController();
  res.on("close", () => controller.abort());

  try {
    // Server-side tools (web search) can pause a long turn; resume it a few times.
    for (let round = 0; round < 4; round++) {
      const messages = assistantSoFar.length
        ? [userTurn, { role: "assistant", content: assistantSoFar }]
        : [userTurn];
      const stream = client.beta.messages.stream({ ...params, messages }, { signal: controller.signal });
      stream.on("text", (delta) => res.write(delta));
      const msg = await stream.finalMessage();

      if (msg.stop_reason === "pause_turn") {
        assistantSoFar = [...assistantSoFar, ...msg.content];
        continue;
      }
      if (msg.stop_reason === "refusal") {
        res.write("\n\n[Claude declined this request. Try rephrasing it.]");
      } else if (msg.stop_reason === "max_tokens") {
        res.write("\n\n[Answer cut short. Ask for less at a time.]");
      }
      break;
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      res.write("\n\n[Claude API key missing or invalid. Set ANTHROPIC_API_KEY and restart the server.]");
    } else if (err instanceof Anthropic.RateLimitError) {
      res.write("\n\n[Rate limited by the Claude API. Wait a minute and try again.]");
    } else if (err instanceof Anthropic.APIUserAbortError) {
      // Browser pressed Stop; nothing to report.
    } else if (err instanceof Anthropic.APIError) {
      res.write(`\n\n[Claude API error ${err.status ?? ""}: ${err.message}]`);
    } else {
      res.write(`\n\n[Server error: ${err.message}]`);
    }
  }
  res.end();
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(await page());
    }
    if (req.method === "GET" && url.pathname === "/api/health") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, model: MODEL, web: WEB_SEARCH }));
    }
    if (req.method === "POST" && url.pathname === "/api/claude") return await handleClaude(req, res);
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// Listen on localhost only: the camera and microphone need a secure context, and the API key should not be exposed.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Panel Room SG running at http://localhost:${PORT}  (model: ${MODEL}, web search: ${WEB_SEARCH ? "on" : "off"})`);
  if (!process.env.ANTHROPIC_API_KEY) console.log("Warning: ANTHROPIC_API_KEY is not set. Claude features will fail until you set it.");
});
