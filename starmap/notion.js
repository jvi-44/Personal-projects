// One-way sync: dashboard → Vi's Starmap 2026 weekly agenda (Notion).
// Finds (or creates) the week toggle, makes sure every day toggle exists, and
// rewrites only the to-do lines + the "Win the day" headline inside each day.
// Anything else you typed in a day (plain bullets, notes) is left alone.

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

export const DAY_NAMES = ["ƧЦПDΛY", "MӨПDΛY", "ƬЦΣƧDΛY", "ЩΣDПΣƧDΛY", "ƬΉЦЯƧDΛY", "FЯIDΛY", "ƧΛƬЦЯDΛY"];
export const DAY_COLORS = ["yellow_background", "purple_background", "green_background", "purple_background", "green_background", "purple_background", "gray_background"];
export const WEEK_PREFIX = "ЩΣΣK";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HEADLINE = "🌻 Win the day";

export const dateTag = (isoDate) => {
  const [, m, d] = isoDate.split("-").map(Number);
  return `[${String(d).padStart(2, "0")} ${MONTHS[m - 1]}]`;
};
const dowOf = (isoDate) => { const [y, m, d] = isoDate.split("-").map(Number); return new Date(y, m - 1, d).getDay(); };
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const plain = (b) => (b[b.type]?.rich_text || []).map((r) => r.plain_text ?? r.text?.content ?? "").join("");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rt = (content, extra = {}) => ({ type: "text", text: { content: String(content).slice(0, 1990) }, ...extra });

export function dayToggle(isoDate, children) {
  const i = dowOf(isoDate);
  return {
    object: "block", type: "toggle",
    toggle: { rich_text: [rt(`${DAY_NAMES[i]} `), rt(dateTag(isoDate), { annotations: { code: true } })], color: DAY_COLORS[i], ...(children ? { children } : {}) },
  };
}
export const weekToggle = (label, dates) => ({
  object: "block", type: "toggle",
  toggle: { rich_text: [rt(`${WEEK_PREFIX} ${label} `, { annotations: { color: "yellow_background" } })], children: dates.map((d) => dayToggle(d)) },
});
export const todoBlock = (l) => ({ object: "block", type: "to_do", to_do: { rich_text: [rt(l.text)], checked: !!l.checked } });
export const headlineBlock = (text) => ({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [rt(text)] } });

export function createNotion({ token, pageId, store, fetchImpl = fetch, log = () => {} }) {
  let calls = 0;
  async function req(method, path, body, attempt = 0) {
    calls++;
    const res = await fetchImpl(API + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": VERSION, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 || res.status >= 500) {
      if (attempt < 5) { await sleep(400 * 2 ** attempt); return req(method, path, body, attempt + 1); }
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Notion ${method} ${path} → ${res.status} ${data.message || ""}`.trim());
    return data;
  }

  async function children(id) {
    const out = [];
    let cursor;
    do {
      const q = `/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
      const data = await req("GET", q);
      out.push(...data.results);
      cursor = data.has_more ? data.next_cursor : null;
    } while (cursor);
    return out;
  }

  // BFS through layout containers looking for a toggle whose text matches `match`.
  async function findToggle(match, limit = 120) {
    const want = norm(match);
    const queue = [{ id: pageId, depth: 0 }];
    let seen = 0;
    while (queue.length && seen < limit) {
      const { id, depth } = queue.shift();
      seen++;
      const kids = await children(id);
      for (const b of kids) {
        if (b.type === "toggle" && norm(plain(b)).includes(want)) return { block: b, parentId: id };
      }
      for (const b of kids) {
        if (!b.has_children || depth > 5) continue;
        const t = plain(b);
        const isDay = /\[\d{2} [A-Za-z]{3}\]/.test(t);
        if (["column_list", "column", "callout", "synced_block", "quote"].includes(b.type) || (b.type === "toggle" && !isDay && !norm(t).startsWith(norm(WEEK_PREFIX)))) {
          queue.push({ id: b.id, depth: depth + 1 });
        }
      }
    }
    return null;
  }

  async function blockAlive(id) {
    try { const b = await req("GET", `/blocks/${id}`); return !b.archived; } catch { return false; }
  }

  // Resolve (or create) the Notion toggle for a week.
  // week = { key: 'YYYY-MM-DD' (Sunday), label: 'After Prelims', match?: text to look for, dates: [7 ISO dates] }
  async function ensureWeek(week, allWeekKeys = []) {
    const map = store.get();
    map.weeks ||= {};
    const known = map.weeks[week.key];
    if (known && (await blockAlive(known.blockId))) return known;

    const anchor = week.match ? await findToggle(week.match) : null;
    if (anchor) {
      map.weeks[week.key] = { blockId: anchor.block.id, parentId: anchor.parentId };
      store.set(map);
      log(`Linked existing Notion week “${week.match}”`);
      return map.weeks[week.key];
    }
    // create after the most recent earlier week we know about
    const earlier = allWeekKeys.filter((k) => k < week.key && map.weeks[k]).sort().pop();
    if (!earlier) throw new Error(`Could not find an earlier Notion week to insert after. Link a week first (e.g. “After Prelims”).`);
    const { parentId, blockId: afterId } = map.weeks[earlier];
    const res = await req("PATCH", `/blocks/${parentId}/children`, { children: [weekToggle(week.label, week.dates)], after: afterId });
    const created = res.results.find((b) => b.type === "toggle") || res.results[0];
    map.weeks[week.key] = { blockId: created.id, parentId };
    store.set(map);
    log(`Created Notion week “${week.label}”`);
    return map.weeks[week.key];
  }

  async function ensureDays(weekBlockId, dates) {
    let kids = await children(weekBlockId);
    const byTag = () => new Map(kids.filter((b) => b.type === "toggle").map((b) => [(/\[\d{2} [A-Za-z]{3}\]/.exec(plain(b)) || [])[0], b]));
    let map = byTag();
    const missing = dates.filter((d) => !map.has(dateTag(d)));
    if (missing.length) {
      await req("PATCH", `/blocks/${weekBlockId}/children`, { children: missing.map((d) => dayToggle(d)) });
      kids = await children(weekBlockId);
      map = byTag();
    }
    return map;
  }

  async function writeDay(dayBlockId, headline, lines) {
    const kids = await children(dayBlockId);
    const mine = kids.filter((b) => b.type === "to_do" || (b.type === "bulleted_list_item" && plain(b).startsWith(HEADLINE)));
    for (const b of mine) await req("DELETE", `/blocks/${b.id}`);
    const add = [...(headline ? [headlineBlock(headline)] : []), ...lines.map(todoBlock)];
    for (let i = 0; i < add.length; i += 90) await req("PATCH", `/blocks/${dayBlockId}/children`, { children: add.slice(i, i + 90) });
    return { removed: mine.length, added: add.length };
  }

  // payload: { week:{key,label,match?,dates}, knownWeekKeys:[], days:[{date, headline, lines:[{text,checked}]}] }
  async function syncWeek(payload) {
    const t0 = Date.now();
    const w = await ensureWeek(payload.week, payload.knownWeekKeys || []);
    const dayBlocks = await ensureDays(w.blockId, payload.week.dates);
    const results = [];
    for (const d of payload.days) {
      const block = dayBlocks.get(dateTag(d.date));
      if (!block) { results.push({ date: d.date, ok: false, error: "day toggle not found" }); continue; }
      try { results.push({ date: d.date, ok: true, ...(await writeDay(block.id, d.headline, d.lines)) }); }
      catch (e) { results.push({ date: d.date, ok: false, error: e.message }); }
    }
    return { weekBlockId: w.blockId, results, calls, ms: Date.now() - t0 };
  }

  return { syncWeek, ensureWeek, ensureDays, writeDay, findToggle, children };
}
