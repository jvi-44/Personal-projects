// One-way sync: dashboard → "✮ Vi's Starmap 2026 ✮" weekly agenda, through the viewer's own
// Notion connector (artifact `mcp` capability). Reads the page, finds the week's toggle by title,
// and replaces it; a new week is inserted straight after the current one.
import * as P from "./planner.js";

export const PAGE_ID = "16872bf06f3180cebf9dd82a1a6c063c";
export const PAGE_URL = `https://www.notion.so/${PAGE_ID}`;
export const SERVER = "Notion";
export const TOOLS = ["notion-fetch", "notion-update-page"];
export const WEEK_PREFIX = "ЩΣΣK";
export const DAY_NAMES = ["ƧЦПDΛY", "MӨПDΛY", "ƬЦΣƧDΛY", "ЩΣDПΣƧDΛY", "ƬΉЦЯƧDΛY", "FЯIDΛY", "ƧΛƬЦЯDΛY"];
export const DAY_COLORS = ["yellow_bg", "purple_bg", "green_bg", "purple_bg", "green_bg", "purple_bg", "gray_bg"];

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/([[\]*_`~])/g, "\\$1").replace(/</g, "‹").replace(/>/g, "›").replace(/\s+/g, " ").trim();
export const dayTag = (d) => `[${P.shortDate(d)}]`;

/* The day's tasks with their final times (routines, meals, travel, breaks and buffers left out). */
export function dayLines(blocks) {
  const out = [];
  for (const b of [...blocks].sort((a, c) => a.start - c.start)) {
    const time = `\\[${P.notionTime(b.start)}-${P.notionTime(b.end)}\\]`;
    if (b.type === "primary" || b.type === "secondary") out.push({ text: `${time} ${b.type === "primary" ? "★ " : ""}${esc(b.title)}${b.chunk ? ` (${b.chunk})` : ""}`, checked: !!b.done });
    else if (b.type === "fixed") out.push({ text: `${time} ${esc(b.title)}`, checked: !!b.done });
    else if (b.type === "admin") (b.items?.length ? b.items : [b.title]).forEach((t) => out.push({ text: `${time} ${esc(t)}`, checked: !!b.done }));
  }
  return out;
}

export function weekMarkdown(title, dates, linesByDate, indent = "\t\t\t", keep = {}) {
  const I = indent, L = [`<details>`, `${I}<summary><span color="yellow_bg">${esc(title)} </span></summary>`];
  for (const d of dates) {
    const dow = P.parseISO(d).getDay();
    L.push(`${I}\t<details color="${DAY_COLORS[dow]}">`, `${I}\t<summary>${DAY_NAMES[dow]} \`${dayTag(d)}\`</summary>`);
    if (!linesByDate[d] && keep[dayTag(d)] != null) { if (keep[dayTag(d)]) L.push(keep[dayTag(d)]); }
    else for (const l of linesByDate[d] || []) L.push(`${I}\t\t- [${l.checked ? "x" : " "}] ${l.text}`);
    L.push(`${I}\t</details>`);
  }
  L.push(`${I}</details>`);
  return L.join("\n");
}

const norm = (s) => String(s).replace(/<[^>]+>/g, "").replace(/\\/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/* All <details> toggles whose summary starts with ЩΣΣK, with their exact text span. */
export function weekBlocks(md) {
  const out = [], re = /<details[^>]*>\n(\t*)<summary>(.*?)<\/summary>/g;
  const archive = (() => { const i = md.indexOf("<summary>ΛЯᄃΉIVΣƧ</summary>"); if (i < 0) return null; const s = md.lastIndexOf("<details", i); return [s, endOf(md, s)]; })();
  let m;
  while ((m = re.exec(md))) {
    const title = norm(m[2]);
    if (!title.startsWith(norm(WEEK_PREFIX))) continue;
    const start = m.index, end = endOf(md, start);
    const lineStart = md.lastIndexOf("\n", start) + 1;
    out.push({ title, start, end, text: md.slice(start, end), indent: md.slice(lineStart, start), archived: !!archive && start > archive[0] && start < archive[1] });
  }
  return out;
}
function endOf(md, start) {
  const re = /<details[\s>]|<\/details>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(md))) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return md.length;
}

/* Each day's existing children, verbatim, keyed by "[27 Sep]" (so days not planned here are kept). */
export function rawDays(text) {
  const out = {}, re = /<summary>[^\n]*?`(\[\d{2} \w{3}\])`<\/summary>\n/g;
  let m;
  while ((m = re.exec(text))) {
    const from = m.index + m[0].length, close = text.indexOf("</details>", from);
    const body = text.slice(from, close);
    out[m[1]] = body.replace(/\n?\t*$/, "");
  }
  return out;
}

/* Decide the edit for one week: replace its toggle, or insert a new one after the current week.
 * linesByDate[d] undefined = this dashboard has no plan for that day, so Notion's lines stay. */
export function planEdit(md, { title, matchTitle, dates, linesByDate, anchorTitle }) {
  const weeks = weekBlocks(md).filter((w) => !w.archived);
  const mine = weeks.filter((w) => w.title === norm(matchTitle || title)).pop() || (matchTitle ? weeks.filter((w) => w.title === norm(title)).pop() : null);
  if (mine) {
    const next = weekMarkdown(title, dates, linesByDate, mine.indent, rawDays(mine.text));
    return next === mine.text ? { kind: "same" } : { kind: "replace", old_str: mine.text, new_str: next };
  }
  const anchor = (anchorTitle && weeks.filter((w) => w.title === norm(anchorTitle)).pop()) || weeks[weeks.length - 1];
  if (!anchor) return { kind: "noanchor" };
  const next = weekMarkdown(title, dates, linesByDate, anchor.indent);
  return { kind: "insert", old_str: anchor.text, new_str: `${anchor.text}\n${anchor.indent}${next}`, after: anchor.title };
}

/* Parse one week's toggle back into {date: [{text, checked}]} for the corner preview. */
export function readWeek(md, title) {
  const w = weekBlocks(md).filter((x) => x.title === norm(title) && !x.archived).pop();
  if (!w) return null;
  const days = {};
  let cur = null;
  for (const line of w.text.split("\n")) {
    const d = /<summary>.*?`\[(\d{2} \w{3})\]`<\/summary>/.exec(line);
    if (d) { cur = d[1]; days[cur] = []; continue; }
    const t = /- \[( |x)\] ?(.*)$/.exec(line.trim());
    if (t && cur) days[cur].push({ text: t[2].replace(/\\([[\]*_`~\\])/g, "$1"), checked: t[1] === "x" });
  }
  return days;
}

/* ───────────── connector calls ───────────── */
let mcpP = null;
export const connector = () => (mcpP ||= (async () => { try { return (window.claude && (await window.claude.use("mcp"))) || null; } catch { return null; } })());

export function errorCopy(e) {
  switch (e?.code) {
    case "needs_reauth": return "Notion needs reconnecting: claude.ai → Settings → Connectors → Notion.";
    case "server_not_connected": case "server_not_found": return "Add the Notion connector in claude.ai → Settings → Connectors, then try again.";
    case "selection_required": return "You have more than one Notion connector. Pick one when claude.ai asks, then try again.";
    case "not_in_manifest": case "not_granted": return "Notion access is switched off for this page. Allow it when asked, then try again.";
    case "blocked_by_policy": case "approval_required": return "Your organisation's settings block this Notion action.";
    case "tool_error": return `Notion refused the change: ${e.message}`;
    case "server_unavailable": case "upstream_error": return "Notion didn't answer. Check the page before trying again.";
    default: return e?.message || "Notion sync failed.";
  }
}

function textOf(r) {
  let p = r?.payload;
  if (typeof p === "string") { try { p = JSON.parse(p); } catch { return p; } }
  if (p && typeof p.text === "string") return p.text;
  const c = r?.content?.find?.((x) => x.type === "text")?.text;
  if (c) { try { const j = JSON.parse(c); return j.text || c; } catch { return c; } }
  return "";
}

export async function fetchPage() {
  const mcp = await connector();
  if (!mcp) throw { code: "not_granted", message: "Notion isn't available in this view." };
  const r = await mcp.callTool(SERVER, "notion-fetch", { id: PAGE_ID }, { cache: false });
  const md = textOf(r);
  if (!md.includes("<details")) throw { code: "tool_error", message: "Couldn't read the agenda on your Starmap page." };
  return md;
}

/* Sync one week. Returns {kind: "same"|"replace"|"insert"}. Throws McpError-shaped errors. */
export async function syncWeek(week) {
  const md = await fetchPage();
  const edit = planEdit(md, week);
  if (edit.kind === "noanchor") throw { code: "tool_error", message: "No ЩΣΣK week toggle found on the page to insert after." };
  if (edit.kind === "same") return edit;
  const mcp = await connector();
  await mcp.callTool(SERVER, "notion-update-page", { page_id: PAGE_ID, command: "update_content", content_updates: [{ old_str: edit.old_str, new_str: edit.new_str }], allow_async: false }, { cache: false });
  return edit;
}
