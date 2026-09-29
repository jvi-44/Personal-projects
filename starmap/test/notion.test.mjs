import test from "node:test";
import assert from "node:assert/strict";
import { createNotion, dateTag, DAY_NAMES } from "../notion.js";

// tiny in-memory Notion: blocks by id, children arrays
function fakeNotion() {
  let n = 0;
  const blocks = new Map();
  const kids = new Map();
  const mk = (b, parent) => {
    const id = `b${++n}`;
    const { children, ...rest } = b;
    const type = rest.type;
    const rec = { id, has_children: false, archived: false, ...rest };
    rec[type] = { ...rest[type], rich_text: (rest[type]?.rich_text || []).map((r) => ({ ...r, plain_text: r.text.content })) };
    delete rec[type].children;
    blocks.set(id, rec);
    kids.set(id, []);
    kids.get(parent).push(id);
    blocks.get(parent) && (blocks.get(parent).has_children = true);
    (b[type]?.children || []).forEach((c) => mk(c, id));
    return id;
  };
  kids.set("page", []); blocks.set("page", { id: "page", type: "page" });
  const text = (t) => ({ rich_text: [{ text: { content: t } }] });
  const cl = mk({ type: "column_list", column_list: {} }, "page");
  const col = mk({ type: "column", column: {} }, cl);
  const callout = mk({ type: "callout", callout: text("") }, col);
  const days = ["27 Sep", "28 Sep", "29 Sep", "30 Sep", "01 Oct", "02 Oct", "03 Oct"].map((d, i) => ({ type: "toggle", toggle: { ...text(`${DAY_NAMES[i]} [${d}]`) } }));
  const wk = mk({ type: "toggle", toggle: { ...text("ЩΣΣK After Prelims "), children: days } }, callout);
  const monday = kids.get(wk)[1];
  mk({ type: "bulleted_list_item", bulleted_list_item: text("Chinatown starbucks day") }, monday);
  mk({ type: "to_do", to_do: { ...text("[5 - 5.30] old todo"), checked: false } }, monday);

  const fetchImpl = async (url, init) => {
    const u = new URL(url); const path = u.pathname.replace("/v1", ""); const method = init.method;
    const body = init.body ? JSON.parse(init.body) : null;
    const ok = (o) => ({ ok: true, status: 200, json: async () => o });
    let m;
    if ((m = path.match(/^\/blocks\/([^/]+)\/children$/))) {
      const id = m[1];
      if (method === "GET") return ok({ results: (kids.get(id) || []).map((k) => blocks.get(k)), has_more: false });
      const list = kids.get(id);
      const after = body.after ? list.indexOf(body.after) + 1 : list.length;
      const before = list.length;
      const newIds = [];
      body.children.forEach((c) => newIds.push(mk(c, id)));
      // move newly appended to `after`
      list.splice(before, newIds.length); list.splice(after, 0, ...newIds);
      return ok({ results: newIds.map((i) => blocks.get(i)) });
    }
    if ((m = path.match(/^\/blocks\/([^/]+)$/))) {
      if (method === "DELETE") { const b = blocks.get(m[1]); b.archived = true; for (const l of kids.values()) { const i = l.indexOf(m[1]); if (i >= 0) l.splice(i, 1); } return ok(b); }
      return ok(blocks.get(m[1]));
    }
    throw new Error("unhandled " + method + path);
  };
  return { fetchImpl, blocks, kids, ids: { wk, monday, callout } };
}

const memStore = () => { let v = {}; return { get: () => v, set: (x) => (v = x) }; };
const plainOf = (b) => b[b.type].rich_text.map((r) => r.plain_text).join("");

test("links the existing week, rewrites only to-dos, keeps other bullets", async () => {
  const f = fakeNotion();
  const notion = createNotion({ token: "t", pageId: "page", store: memStore(), fetchImpl: f.fetchImpl });
  const dates = ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"];
  const out = await notion.syncWeek({
    week: { key: "2026-09-27", label: "After Prelims", match: "After Prelims", dates },
    days: [{ date: "2026-09-28", headline: "🌻 Win the day: A · B · C", lines: [{ text: "[5-5.30] Art", checked: true }, { text: "[5.30-6.15] Weights", checked: false }] }],
  });
  assert.ok(out.results[0].ok);
  const day = f.kids.get(f.ids.monday).map((i) => f.blocks.get(i));
  const texts = day.map(plainOf);
  assert.ok(texts.includes("Chinatown starbucks day"), "plain bullet preserved");
  assert.ok(!texts.includes("[5 - 5.30] old todo"), "old todo replaced");
  assert.ok(texts.includes("[5-5.30] Art"));
  assert.equal(day.find((b) => plainOf(b) === "[5-5.30] Art").to_do.checked, true);
  assert.ok(texts.some((t) => t.startsWith("🌻 Win the day")));
  // second sync doesn't duplicate the headline
  await notion.syncWeek({ week: { key: "2026-09-27", label: "After Prelims", match: "After Prelims", dates }, days: [{ date: "2026-09-28", headline: "🌻 Win the day: X", lines: [] }] });
  const t2 = f.kids.get(f.ids.monday).map((i) => plainOf(f.blocks.get(i)));
  assert.equal(t2.filter((t) => t.startsWith("🌻")).length, 1);
});

test("auto-adds the next week right after the last one, with all 7 days", async () => {
  const f = fakeNotion();
  const store = memStore();
  const notion = createNotion({ token: "t", pageId: "page", store, fetchImpl: f.fetchImpl });
  const w1 = ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"];
  await notion.syncWeek({ week: { key: "2026-09-27", label: "After Prelims", match: "After Prelims", dates: w1 }, days: [] });
  const w2 = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
  const out = await notion.syncWeek({
    week: { key: "2026-10-04", label: "04 Oct", dates: w2 }, knownWeekKeys: ["2026-09-27", "2026-10-04"],
    days: [{ date: "2026-10-06", headline: null, lines: [{ text: "[7-8] Run", checked: false }] }],
  });
  assert.ok(out.results[0].ok);
  const inCallout = f.kids.get(f.ids.callout).map((i) => f.blocks.get(i));
  assert.equal(inCallout.length, 2);
  assert.ok(plainOf(inCallout[1]).includes("04 Oct"));
  const days = f.kids.get(inCallout[1].id);
  assert.equal(days.length, 7);
  assert.ok(plainOf(f.blocks.get(days[2])).includes(dateTag("2026-10-06")));
  // idempotent: syncing again reuses the same toggle
  await notion.syncWeek({ week: { key: "2026-10-04", label: "04 Oct", dates: w2 }, knownWeekKeys: ["2026-09-27", "2026-10-04"], days: [] });
  assert.equal(f.kids.get(f.ids.callout).length, 2);
});
