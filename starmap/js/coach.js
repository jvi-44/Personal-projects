// Vi's Starmap — the "coach": turns loose text into tasks, tasks into a week, and check-ins
// into schedule changes. Uses Claude through the artifact `sample` capability when available;
// every function has a deterministic fallback so the page works without it.
import * as P from "./planner.js";

export const PLACES = {
  home: { icon: "🏠", label: "Home", good: ["admin", "exercise", "outreach", "code", "study"], note: "Flexible and comfy. Best for routines, admin, exercise and light review. Watch out for bed and phone." },
  cafe: { icon: "☕", label: "Cafe", good: ["essay", "creative", "reading", "outreach"], note: "Buzzing background noise. Great for drafting essays and creative work in 2–3h sessions. Needs travel and headphones." },
  library: { icon: "📚", label: "Library", good: ["paper", "study", "code", "essay"], note: "Silent deep focus. Best for timed papers, heavy study and anything needing exam conditions." },
  school: { icon: "🎒", label: "School", good: ["study", "outreach", "admin"], note: "Fixed class hours. Use free periods for quick recall, teacher questions and admin." },
  outdoors: { icon: "🌳", label: "Outdoors", good: ["exercise", "reading"], note: "Fresh air. Light reading, walks, runs." },
};
export const PLACE_KEYS = Object.keys(PLACES);
export const WHEN = { any: "Any time", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
export const WHEN_ICON = { any: "", morning: "☀", afternoon: "◐", evening: "☾" };
export const KINDS = ["essay", "paper", "study", "code", "creative", "reading", "exercise", "outreach", "admin", "generic"];

const DEEP = ["essay", "paper", "study", "code"];
const DEFAULT_MIN = { essay: 90, paper: 120, study: 75, code: 90, creative: 60, reading: 30, exercise: 45, outreach: 20, admin: 15, generic: 45 };

const TIPS = {
  essay: ["Write the ugly first paragraph in 10 minutes. You can't edit a blank page.", "Read your last paragraph aloud before starting; it pulls you straight back in.", "Aim for one honest story, not a perfect sentence."],
  paper: ["Timer on, notes away. Treat it like the real thing and it'll feel easier on the day.", "Mark it straight after. Mistakes are cheapest to fix while they're fresh.", "Flag, skip, return. Don't let one question eat the paper."],
  study: ["Close the notes and write what you remember first. The gaps are the lesson.", "Teach the hardest idea out loud. If you can explain it, you own it.", "Three test questions at the end beat another hour of rereading."],
  code: ["Pick the smallest slice you can finish, then ship only that.", "Commit every time it works. Future you says thank you."],
  creative: ["Five messy minutes first. Loosen up before you commit.", "No judging until the timer ends."],
  reading: ["Phone in another room. One chapter, one line of notes.", "Read like a writer: underline one sentence you wish you'd written."],
  exercise: ["Just start the warm-up. Motivation shows up around minute five.", "Log it; seeing the streak grow is half the reward."],
  outreach: ["Shortest useful reply wins. Send it, then move on.", "Draft the awkward one first; the rest feel easy after."],
  admin: ["Batch it and race the clock. Done beats perfect.", "Anything under two minutes: do it now."],
  generic: ["Name the one outcome for this block, then start with the hardest bit.", "Small steady progress still grows sunflowers."],
};
const CHEERS = [
  "Small steady progress still grows sunflowers.",
  "You don't need a perfect day, just the three that matter.",
  "Protect the first hour; the rest of the day follows it.",
  "Rest is part of the plan, not a break from it.",
  "Future you is already grateful.",
  "Tiny wins compound. Plant one now.",
];
const pick = (arr, seed = 0) => arr[Math.abs(Math.floor(seed)) % arr.length];
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
export const tipFor = (kind, title = "") => pick(TIPS[kind] || TIPS.generic, hash(title));
export const cheer = (seed) => pick(CHEERS, hash(seed));

let n = 0;
export const newId = () => `t${Date.now().toString(36)}${(++n).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/* ───────────── small parsers ───────────── */
function minutesIn(s) {
  const h = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i.exec(s);
  const m = /(\d+)\s*(?:m|min|mins|minutes?)\b/i.exec(s);
  let t = 0;
  if (h) t += Math.round(parseFloat(h[1]) * 60);
  if (m) t += +m[1];
  return t || null;
}
const clean = (s) => s.replace(/\(?\s*\d+(?:\.\d+)?\s*(?:hours?|hrs|hr|h|minutes?|mins|min|m)\b\s*\)?/gi, " ").replace(/\b(in the )?(morning|afternoon|evening|tonight)\b/gi, "").replace(/\s{2,}/g, " ").replace(/^[-•*\s]+|[\s,.;]+$/g, "").trim();
const whenIn = (s) => (/\bmorning\b/i.test(s) ? "morning" : /\bafternoon\b/i.test(s) ? "afternoon" : /\b(evening|tonight|night)\b/i.test(s) ? "evening" : "any");

/* "3pm", "3:30 pm", "15:30", "3.30", "noon" → minutes of day (null if none) */
export function parseTime(s, ref = null) {
  s = String(s).trim().toLowerCase();
  if (/^noon|midday/.test(s)) return 720;
  const m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let h = +m[1]; const min = +(m[2] || 0);
  if (h > 23 || min > 59) return null;
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  if (!m[3] && h < 7 && (ref == null || ref > 12 * 60)) h += 12; // "3" in the day means 3pm
  return h * 60 + min;
}
const TIME_RE = "(noon|midday|\\d{1,2}(?:[:.]\\d{2})?\\s*(?:am|pm)?)";

export function parseSeedsHeuristic(text) {
  return String(text || "")
    .split(/\n|;|,(?![^(]*\))|\s+\band\b\s+(?=[A-Z])/)
    .map((s) => s.trim()).filter((s) => s.length > 1)
    .map((raw) => {
      const title = clean(raw) || raw;
      const kind = P.inferKind(title);
      const min = Math.max(10, Math.min(300, Math.round((minutesIn(raw) || DEFAULT_MIN[kind]) / 5) * 5));
      const priority = kind === "admin" || min <= 15 ? "admin" : DEEP.includes(kind) ? "win" : "also";
      return { id: newId(), title: title.slice(0, 80), min, kind, priority, when: whenIn(raw), tip: tipFor(kind, title), doneWhen: "" };
    });
}

/* ───────────── AI plumbing ───────────── */
let samplerP = null;
export function sampler() {
  if (!samplerP) samplerP = (async () => { try { return (window.claude && (await window.claude.use("sample"))) || null; } catch { return null; } })();
  return samplerP;
}
let disabled = false;
export const aiState = () => (disabled ? "off" : "on");
const HIDE = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];

async function ask(prompt, { tier = "default", onText, signal } = {}) {
  if (disabled) return null;
  const s = await sampler();
  if (!s) return null;
  try {
    return await s.json(prompt, { modelTier: tier, onText, signal, cache: false });
  } catch (e) {
    if (HIDE.includes(e?.code)) disabled = true;
    const err = new Error(e?.code === "rate_limited" ? "Claude is busy right now. Try again in a minute." : e?.code === "invalid_json" ? "Claude's answer came back garbled. Try again." : e?.code === "cancelled" ? "Stopped." : HIDE.includes(e?.code) ? "AI is turned off for this page, so I used the built-in planner." : "Couldn't reach Claude. Used the built-in planner instead.");
    err.code = e?.code; throw err;
  }
}

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v, lo, hi, d) => { const x = Math.round(Number(v) / 5) * 5; return Number.isFinite(x) && x > 0 ? Math.max(lo, Math.min(hi, x)) : d; };
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const hhmm = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim()); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
const WHEN_KEYS = Object.keys(WHEN);
const VI = "Vi, a student in the gap between prelim exams and university applications (UCAS, US essays, ESAT)";

/* ───────────── seeds ───────────── */
export async function seedsFromText(text, ctx = {}) {
  const fallback = parseSeedsHeuristic(text);
  const prompt = `You help ${VI} turn a quick note into planner tasks.
Split the note into separate tasks. For each, reply with:
- title: short, clear, keeps Vi's own wording (max 60 chars)
- minutes: realistic focused time, multiple of 15 (15-240). Respect any duration Vi wrote.
- kind: one of ${KINDS.join("|")}
- priority: "win" (important deep work that would make the day a success), "also" (worth doing), or "admin" (under ~15 min, errands, forms, payments)
- when: the part of the day it suits best: morning|afternoon|evening|any. Respect anything Vi wrote; deep timed work usually suits the morning.
- tip: one warm, specific first step or encouragement for THIS task (max 120 chars)
- doneWhen: a concrete finish line (max 60 chars)
Tasks already planned (don't duplicate): ${(ctx.existing || []).join("; ") || "none"}.
Reply with only JSON: {"tasks":[{"title":"","minutes":60,"kind":"","priority":"","when":"","tip":"","doneWhen":""}]}

Note: """${String(text).slice(0, 2000)}"""`;
  const out = await ask(prompt, { tier: "quick" });
  if (!out || !Array.isArray(out.tasks) || !out.tasks.length) return { tasks: fallback, ai: false };
  const tasks = out.tasks.slice(0, 12).map((t) => {
    const title = str(t.title, 80) || "Untitled task";
    const kind = oneOf(t.kind, KINDS, P.inferKind(title));
    return { id: newId(), title, min: num(t.minutes, 10, 300, DEFAULT_MIN[kind]), kind, priority: oneOf(t.priority, ["win", "also", "admin"], "also"), when: oneOf(t.when, WHEN_KEYS, "any"), tip: str(t.tip, 160) || tipFor(kind, title), doneWhen: str(t.doneWhen, 80) };
  });
  return { tasks, ai: true };
}

/* ───────────── week ───────────── */
function focusBudget(settings, locations, fixed) {
  return P.generatePlan({ primary: [], secondary: [], admin: [], fixed: P.parseFixed(fixed), locations }, settings).stats.flexMin;
}
const fitScore = (kind, loc) => (PLACES[loc]?.good.includes(kind) ? (PLACES[loc].good[0] === kind ? 2 : 1) : 0);
const dayFit = (kind, locs, when) => (when && when !== "any" ? fitScore(kind, locs[when]) * 1.3 : Math.max(fitScore(kind, locs.morning) * 1.2, fitScore(kind, locs.afternoon), fitScore(kind, locs.evening) * 0.8));

export function planWeekHeuristic(ctx) {
  const days = ctx.days.map((d) => ({ ...d, primary: [], secondary: [], admin: [], used: 0 }));
  const rank = { win: 0, also: 1, admin: 2 };
  const seeds = [...ctx.seeds].sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) || b.min - a.min);
  for (const s of seeds) {
    let left = s.min, part = 0;
    const parts = s.min > 150 ? Math.ceil(s.min / 120) : 1;
    while (left > 0 && part < parts) {
      const chunk = parts > 1 ? Math.min(left, Math.ceil(s.min / parts / 15) * 15) : left;
      const tier = s.priority === "admin" ? "admin" : s.priority === "win" ? "primary" : "secondary";
      const cands = days.filter((d) => (tier === "admin" ? d.admin.length < 4 : d[tier].length < 3) && d.used + chunk <= d.budget * 0.85 && !(parts > 1 && d.primary.concat(d.secondary).some((x) => x.seedId === s.id)))
        .map((d) => ({ d, sc: dayFit(s.kind, d.locations, s.when) * 2 - d.used / Math.max(60, d.budget) * 3 - days.indexOf(d) * 0.05 }))
        .sort((a, b) => b.sc - a.sc);
      const c = cands[0]?.d || (tier === "primary" ? days.filter((d) => d.secondary.length < 3 && d.used + chunk <= d.budget)[0] : null);
      if (!c) break;
      const t = { seedId: s.id, title: parts > 1 ? `${s.title} (part ${part + 1})` : s.title, minutes: chunk, tip: s.tip || tipFor(s.kind, s.title), doneWhen: parts > 1 ? "" : s.doneWhen || "", kind: s.kind, when: s.when || "any" };
      if (tier === "admin") c.admin.push({ title: s.title, minutes: s.min });
      else (c[tier].length < 3 ? c[tier] : c.secondary).push(t);
      c.used += chunk; left -= chunk; part++;
    }
  }
  return {
    weekTheme: "",
    weekNote: "Deep work lands where you focus best, lighter tasks fill the gaps, and every day keeps room to breathe.",
    days: days.map((d) => {
      const main = d.locations.morning, heavy = d.primary.length;
      return {
        date: d.date,
        theme: heavy ? `${PLACES[main]?.label || "Home"} ${heavy >= 3 ? "deep-dive" : "focus"}` : "Light & restful",
        description: heavy ? `${PLACES[main]?.note.split(".")[0]}. ${d.primary.map((t) => t.title).join(", ")} ${heavy > 1 ? "are" : "is"} the main event.` : "A gentle day. Catch up, rest, and let the garden grow.",
        tip: cheer(d.date),
        primary: d.primary, secondary: d.secondary, admin: d.admin,
      };
    }),
  };
}

export async function planWeek(input, { onText, signal } = {}) {
  const ctx = { ...input, days: input.days.map((d) => ({ ...d, budget: focusBudget(input.settings, d.locations, d.fixed) })) };
  const fallback = () => planWeekHeuristic(ctx);
  const R = (arr) => arr.map(([m, t]) => `${t} (${m}m)`).join(", ") || "none";
  const prompt = `You are a warm, practical study coach planning a week for ${VI}.
Assign Vi's task "seeds" to days. Each day has up to 3 PRIMARY "win the day" tasks and up to 3 SECONDARY tasks, in PRIORITY ORDER (the first is done first), plus small admin items.

Where Vi works changes what fits:
${PLACE_KEYS.map((k) => `- ${k}: ${PLACES[k].note}`).join("\n")}

Rules:
- Match tasks to where Vi will be at that time of day: timed papers and heavy study → library or quiet home; essays and creative work → cafe; admin and outreach → school free periods or home.
- Respect each seed's "when" (morning/afternoon/evening) and set "when" for every task you place.
- Stay inside each day's focusBudget (free minutes after routines, meals, travel and fixed plans). Aim for ~75% of it so the day has buffer.
- Big tasks may be split across days as "(part 1)", "(part 2)". Keep the seed id in "seed".
- Spread the heaviest work; a lighter day after a heavy one is good. Saturday is Vi's reset day: keep it light and leave room to plan the next week.
- Only use the seeds given. Days with nothing fitting can stay light; say so kindly.
- Every day gets: theme (≤4 words), description (1–2 sentences on the shape of the day and why it suits where Vi will be), tip (one encouraging, practical tip, ≤140 chars).
- Every task gets tip (a concrete first step, ≤120 chars) and doneWhen (finish line, ≤60 chars).
${input.theme ? `- Vi's word for this week is "${input.theme}". Let it colour the notes.` : "- Suggest one evocative word as the week's theme."}

Routines already in every day: morning ${R(input.settings.morningRoutine)}; night ${R(input.settings.eveningRoutine)}. Wake ${input.settings.wake}, sleep ${input.settings.sleep}.

Days:
${JSON.stringify(ctx.days.map((d) => ({ date: d.date, weekday: P.DOW[P.parseISO(d.date).getDay()], places: d.locations, fixed: d.fixed || "", focusBudget: d.budget })))}

Seeds:
${JSON.stringify(ctx.seeds.map((s) => ({ id: s.id, title: s.title, minutes: s.min, kind: s.kind, priority: s.priority, when: s.when || "any", notes: s.doneWhen || undefined })))}

Reply with only JSON:
{"weekTheme":"one word","weekNote":"1-2 encouraging sentences about the week's shape","days":[{"date":"YYYY-MM-DD","theme":"","description":"","tip":"","primary":[{"seed":"id","title":"","minutes":90,"when":"morning","tip":"","doneWhen":""}],"secondary":[],"admin":[{"title":"","minutes":10}]}]}`;
  let out;
  try { out = await ask(prompt, { tier: "default", onText, signal }); }
  catch (e) { const r = fallback(); r.error = e.message; if (e.code === "cancelled") r.cancelled = true; return r; }
  if (!out || !Array.isArray(out.days)) return { ...fallback(), ai: false };
  const byId = new Map(ctx.seeds.map((s) => [s.id, s]));
  const task = (t) => {
    const seed = byId.get(t.seed);
    const title = str(t.title, 90) || seed?.title || "Task";
    const kind = seed?.kind || P.inferKind(title);
    return { seedId: seed ? seed.id : null, title, minutes: num(t.minutes, 10, 300, seed?.min || 60), tip: str(t.tip, 160) || tipFor(kind, title), doneWhen: str(t.doneWhen, 80), kind, when: oneOf(t.when, WHEN_KEYS, seed?.when || "any") };
  };
  const dates = new Set(ctx.days.map((d) => d.date));
  return {
    ai: true,
    weekTheme: str(out.weekTheme, 30).split(/\s+/)[0] || "", weekNote: str(out.weekNote, 300),
    days: out.days.filter((d) => dates.has(d.date)).map((d) => ({
      date: d.date, theme: str(d.theme, 50), description: str(d.description, 300), tip: str(d.tip, 180),
      primary: (Array.isArray(d.primary) ? d.primary : []).slice(0, 3).map(task),
      secondary: (Array.isArray(d.secondary) ? d.secondary : []).slice(0, 3).map(task),
      admin: (Array.isArray(d.admin) ? d.admin : []).slice(0, 6).map((a) => ({ title: str(a.title, 80), minutes: num(a.minutes, 5, 60, 10) })).filter((a) => a.title),
    })),
  };
}

/* ───────────── reminders ("nudges") ───────────── */
const place = (k) => PLACES[k]?.label.toLowerCase() || k;
export function nudgesFor(blocks) {
  const out = [];
  const add = (at, text, block = null) => { if (at >= 0 && !out.some((n) => Math.abs(n.at - at) < 10)) out.push({ id: `n-${at}-${hash(text) & 0xffff}`, at, text, block, src: "auto" }); };
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const firstWin = sorted.find((b) => b.type === "primary");
  if (firstWin) add(firstWin.start - 5, `Deep work in 5 minutes: water, phone in another room, one tab open. First up: ${firstWin.title}.`, firstWin.id);
  for (const b of sorted) {
    if (b.type === "travel") {
      const [, from, to] = /Travel: (\w+) → (\w+)/.exec(b.title) || [];
      if (to && to !== "home") add(b.start - 10, `Heading to the ${place(to)} soon: charger, headphones, water bottle, notebook.`, b.id);
      if (to === "home" && from) add(b.end + 5, `Home from the ${place(from)}: plug in your laptop and phone so tomorrow starts charged.`, b.id);
    }
    if (b.type === "meal" && b.title === "Lunch") add(b.start, "Lunch break! Step away from the screen, stretch, and order something nice.", b.id);
    if (b.type === "meal" && b.title === "Dinner") add(b.start, "Dinner time. A proper meal, no work: let your head reset.", b.id);
    if (b.type === "primary" && (!b.chunk || b.chunk.split("/")[0] === b.chunk.split("/")[1])) add(b.end, `Wrap up “${b.title}”: tick it off and take a real break.`, b.id);
  }
  const busy = sorted.filter((b) => ["primary", "secondary"].includes(b.type));
  if (busy.some((b) => b.start < 15.5 * 60 && b.end > 14 * 60)) add(15 * 60 + 30, "Afternoon dip? Water, a short walk, or five minutes of daylight.");
  const wind = sorted.find((b) => b.type === "routine" && b.start >= 18 * 60);
  if (wind) add(wind.start - 10, "Wind-down soon: screens off, pack tomorrow's bag, quick check-in.", wind.id);
  return out.sort((a, b) => a.at - b.at);
}

/* ───────────── check-in: plain-language schedule changes ───────────── */
const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "task", "for", "with"].includes(w));
export function findBlock(blocks, phrase) {
  const want = words(phrase);
  if (!want.length) return null;
  let best = null;
  for (const b of blocks) {
    if (b.type === "flex" || b.type === "break") continue;
    const have = words(b.title);
    const sc = want.filter((w) => have.some((h) => h.startsWith(w) || w.startsWith(h))).length / want.length;
    if (sc > 0.49 && (!best || sc > best.sc || (sc === best.sc && !b.done && best.b.done))) best = { b, sc };
  }
  return best?.b || null;
}

/* Built-in understanding of common check-ins. Returns {blocks, reply} or null when nothing matched. */
export function checkinHeuristic(text, blocks, now) {
  const t = String(text).toLowerCase();
  let out = blocks, did = [];
  const first = () => [...out].filter((b) => b.type !== "flex" && b.type !== "fixed" && !b.done).sort((a, b) => a.start - b.start)[0];
  let m;
  if ((m = new RegExp(`(?:woke up|got up)(?: late)?[, ]*(?:at |around |~)?${TIME_RE}(?!\\s*(?:h|hr|hrs|hours?|m|min|mins|minutes)\\b)`).exec(t)) && parseTime(m[1], 0) != null) {
    const at = parseTime(m[1], 0), f = first();
    if (f && at > f.start) { out = P.shiftFrom(out, 0, at - f.start); did.push(`shifted the day by ${P.dur(at - f.start)}`); }
  } else if ((m = /(?:late|behind)(?: by)? (\d+(?:\.\d+)?)\s*(min|mins|minutes|m|h|hr|hrs|hours?)\b/.exec(t))) {
    const d = Math.round(parseFloat(m[1]) * (/^h/.test(m[2]) ? 60 : 1));
    out = P.shiftFrom(out, now, d); did.push(`pushed everything left by ${P.dur(d)}`);
  } else if (/woke up late|running late|overslept|behind schedule|i'?m late/.test(t)) {
    const f = first();
    if (f && now > f.start) { out = P.shiftFrom(out, 0, Math.ceil((now - f.start) / 5) * 5); did.push("moved the rest of the day to start from now"); }
  }
  for (const mm of t.matchAll(new RegExp(`(?:move|change|shift|put|push|reschedule|do)\\s+(.+?)\\s+(?:to|at|for)\\s+${TIME_RE}`, "g"))) {
    const b = findBlock(out, mm[1]), at = parseTime(mm[2], now);
    if (b && at != null) { const key = P.itemsOf(out).find((it) => it.blocks.some((x) => x.id === b.id))?.key; out = P.setItemTime(out, key, at, at + (b.end - b.start)); did.push(`moved “${b.title}” to ${P.pretty(at)}`); }
  }
  for (const mm of t.matchAll(/(?:skip|cancel|drop|remove|not doing)\s+(?:the\s+)?(.+?)(?:\s+today)?(?:[.,;!]|$)/g)) {
    const b = findBlock(out, mm[1]);
    if (b) { const key = P.itemsOf(out).find((it) => it.blocks.some((x) => x.id === b.id))?.key; out = P.removeItem(out, key); did.push(`removed “${b.title}”`); }
  }
  for (const mm of t.matchAll(new RegExp(`(?:add|insert|i have|there'?s)\\s+(?:a |an )?(.+?)\\s+at\\s+${TIME_RE}(?:\\s*(?:for)?\\s*(\\d+)\\s*(min|mins|minutes|m|h|hours?))?`, "g"))) {
    const at = parseTime(mm[2], now);
    if (at == null) continue;
    const len = mm[3] ? Math.round(+mm[3] * (/^h/.test(mm[4]) ? 60 : 1)) : 60;
    const title = mm[1].replace(/^(?:a|an)\s+/, "").replace(/^\w/, (c) => c.toUpperCase());
    out = [...out, { id: `e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, type: "fixed", start: at, end: at + len, title, loc: "home", done: false, desc: "Added at check-in." }];
    const key = out[out.length - 1].id; out = P.setItemTime(out, key, at, at + len); did.push(`added “${title}” at ${P.pretty(at)}`);
  }
  return did.length ? { blocks: out, reply: `Done: ${did.join(", ")}.` } : null;
}

const schedJSON = (blocks) => JSON.stringify([...blocks].filter((b) => b.type !== "flex").sort((a, b) => a.start - b.start).map((b) => ({ id: b.id, type: b.type, title: b.title, start: P.clock(b.start), end: P.clock(b.end), done: !!b.done, ...(b.locked ? { locked: true } : {}) })));

/* Apply {changes:[{id,start,end}], remove:[id], add:[{title,start,end}]} to a schedule. */
export function applyChanges(blocks, out) {
  let b = blocks.map((x) => ({ ...x }));
  const rm = new Set(Array.isArray(out.remove) ? out.remove : []);
  b = b.filter((x) => !rm.has(x.id));
  for (const c of Array.isArray(out.changes) ? out.changes : []) {
    const x = b.find((y) => y.id === c.id), s = hhmm(c.start), e = hhmm(c.end);
    if (x && s != null) { const len = x.end - x.start; x.start = s; x.end = e != null && e > s ? e : s + len; if (out.lock) x.locked = true; }
  }
  for (const a of Array.isArray(out.add) ? out.add : []) {
    const s = hhmm(a.start), e = hhmm(a.end), title = str(a.title, 80);
    if (title && s != null) b.push({ id: `e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, type: "fixed", start: s, end: e != null && e > s ? e : s + 30, title, loc: "home", done: false, desc: "Added by your coach." });
  }
  const items = P.itemsOf(b);
  return P.resolve(items).flatMap((it) => it.blocks).sort((x, y) => x.start - y.start);
}

export async function checkin(text, day) {
  const now = day.now;
  const quick = checkinHeuristic(text, day.blocks, now);
  const prompt = `You are Vi's warm, practical day coach. Vi just checked in about today's schedule.
Now: ${P.clock(now)}. Places: ${JSON.stringify(day.locations)}. Energy: ${day.energy}. Sleep at ${day.sleep}.
Current schedule (flex buffers omitted):
${schedJSON(day.blocks)}

Vi says: """${String(text).slice(0, 800)}"""

Change the schedule to match what Vi asked. Rules: blocks marked "locked" have times Vi set herself: never change them unless Vi explicitly asks about that block, and if Vi gives a time, use exactly that time; never move blocks marked done or finished before now; keep fixed commitments unless Vi says otherwise; keep block durations unless asked; when something moves later, move the remaining unfinished blocks after it forward in order; nothing may overlap; try to finish before sleep, shortening "secondary" blocks or dropping breaks if needed. Only list blocks whose times change.
Reply with only JSON: {"changes":[{"id":"","start":"HH:MM","end":"HH:MM"}],"remove":["id"],"add":[{"title":"","start":"HH:MM","end":"HH:MM"}],"reply":"one short, kind sentence confirming what changed","tip":"one encouraging tip for the rest of the day"}`;
  try {
    const out = await ask(prompt, { tier: "default" });
    if (out && (out.changes || out.remove || out.add)) return { blocks: applyChanges(day.blocks, out), reply: str(out.reply, 200) || "Updated your day.", tip: str(out.tip, 180), ai: true };
  } catch (e) { if (!quick) return { blocks: null, reply: e.message }; }
  return quick ? { ...quick, ai: false } : { blocks: null, reply: "I couldn't tell what to change. Try “woke up late, start from 8:30” or “move ESAT paper to 3pm”." };
}

/* ───────────── plan my day: coach pass over a freshly built schedule ───────────── */
export function dayNoteHeuristic(day) {
  const wins = day.tasks.filter((t) => t.tier === "primary");
  const main = PLACES[day.locations.morning] || PLACES.home;
  return {
    theme: wins.length ? `${main.label} focus` : "Plant today's wins",
    description: wins.length ? `${main.note.split(".")[0]}. Your wins, in order: ${wins.map((t) => t.title).join(", ")}.` : "Add up to three wins and three extras, and the day builds itself around your routines.",
    tip: wins[0] ? tipFor(P.inferKind(wins[0].title), wins[0].title) : cheer(day.date),
  };
}

export async function planDay(day) {
  const prompt = `You are a warm, practical study coach. The schedule below was built for ${VI} from Vi's priorities (tasks run in priority order).
Date: ${day.date} (${P.DOW[P.parseISO(day.date).getDay()]}). Places: morning ${day.locations.morning}, afternoon ${day.locations.afternoon}, evening ${day.locations.evening}. Energy: ${day.energy}. Wake ${day.wake}, sleep ${day.sleep}.
Place conditions: ${[...new Set(Object.values(day.locations))].map((k) => `${k}: ${PLACES[k]?.note}`).join(" ")}
Tasks (priority order): ${JSON.stringify(day.tasks.map((t) => ({ id: t.id, title: t.title, tier: t.tier, minutes: t.min, when: t.when })))}
Schedule (flex buffers omitted):
${schedJSON(day.blocks)}
${day.notes ? `Vi's notes for today: """${day.notes.slice(0, 600)}"""\nIf the notes ask for changes (e.g. a new appointment, leaving early), express them as schedule changes; otherwise leave "changes" empty.` : "Leave \"changes\" empty unless something is clearly wrong."}

Also write 5–8 short, friendly reminders for moments through the day (e.g. before deep work, lunch "stretch and order something nice", leaving for or getting home from the cafe "charge devices for tomorrow", an afternoon slump, wind-down). Tie each to a block id where it makes sense.
Reply with only JSON: {"theme":"≤4 words","description":"1-2 sentences on the shape of the day","tip":"one encouraging tip ≤140 chars","taskTips":[{"id":"task id","tip":"concrete first step ≤110 chars","doneWhen":"≤50 chars"}],"changes":[{"id":"","start":"HH:MM","end":"HH:MM"}],"add":[{"title":"","start":"HH:MM","end":"HH:MM"}],"reminders":[{"time":"HH:MM","block":"id or empty","text":"≤110 chars"}]}`;
  try {
    const out = await ask(prompt, { tier: "default" });
    if (!out) return { ...dayNoteHeuristic(day), ai: false };
    return {
      ai: true, theme: str(out.theme, 50), description: str(out.description, 300), tip: str(out.tip, 180),
      taskTips: Array.isArray(out.taskTips) ? out.taskTips.map((x) => ({ id: str(x.id, 60), tip: str(x.tip, 160), doneWhen: str(x.doneWhen, 80) })) : [],
      changes: out.changes, add: out.add,
      reminders: Array.isArray(out.reminders) ? out.reminders.map((r) => ({ at: hhmm(r.time), block: str(r.block, 60) || null, text: str(r.text, 160) })).filter((r) => r.at != null && r.text) : [],
    };
  } catch (e) { return { ...dayNoteHeuristic(day), ai: false, error: e.message }; }
}
