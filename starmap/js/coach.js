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
export const parseTime = P.parseClock;
const TIME_RE = P.TIME_SRC;

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
const hhmm = (v) => { const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(v || "").trim()); return m && +m[1] < 36 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
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

/* ───────────── check-in: plain-language schedule changes ─────────────
 * Two layers. Claude reads the whole day's conversation (earlier check-ins, what Vi asked the
 * coach to keep in mind, the schedule) and proposes changes. Then a deterministic pass re-reads
 * Vi's own words for the times she stated and enforces them, so her times always win. */
const STOP = new Set(["the", "and", "task", "tasks", "for", "with", "all", "everything", "rest", "remaining", "my", "then", "do", "doing", "move", "put", "shift", "push", "start", "from", "until", "till", "its", "stuff", "things", "today", "tonight", "please", "can", "you", "could", "into", "instead", "now", "want", "let", "lets", "just", "also", "work", "working", "will", "i'll", "ill", "gonna", "going"]);
const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => (w.length > 2 || /^\d+$/.test(w)) && !STOP.has(w));
const isNum = (w) => /^\d+$/.test(w);
export function findBlock(blocks, phrase, min = 0.49) {
  const want = words(phrase);
  if (!want.length) return null;
  let best = null;
  for (const b of blocks) {
    if (b.type === "flex" || b.type === "break") continue;
    const have = words(b.title);
    const sc = want.filter((w) => have.some((h) => (isNum(w) || isNum(h) ? h === w : h.startsWith(w) || w.startsWith(h)))).length / want.length;
    if (sc >= min && (!best || sc > best.sc || (sc === best.sc && !b.done && best.b.done))) best = { b, sc };
  }
  return best?.b || null;
}
/* Does Vi's message talk about this block? (Locked blocks only change when it does.) */
const same = (a, b) => a === b || a + "s" === b || b + "s" === a || (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a)));
export function mentions(text, title) {
  const have = words(text), want = words(title);
  if (!want.length) return false;
  const hit = (w) => have.some((h) => same(w, h));
  return want.filter(hit).length / want.length >= 0.5 && want.some((w) => !isNum(w) && hit(w));
}
const GLOBAL = /\b(everything|every ?thing|all (?:of )?(?:my |the )?(?:tasks|blocks|papers|work|of it)|whole (?:day|schedule|plan)|rest of (?:the|my) day|it all)\b/i;
const VERBS = /\b(move|put|shift|push|reschedule|do|doing|start|have|make|i'?ll|i will|want to|going to|gonna|let'?s|please|can you|could you|i'?ve got|there'?s|add|insert|book|schedule|got|then|and)\b/gi;
const GENERIC = /\b(all|everything|rest|remaining|tasks|work|working|focus|stuff)\b/i;
const newBlockId = () => `e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const REST_DESC = "Rest you planned at check-in. Phone away, dark room, alarm set.";

export const clauses = (t) => String(t).split(/[.;!?\n]+|,\s*|\s+(?:and\s+)?then\s+|\s+and\s+(?=(?:move|put|do|add|skip|drop|cancel|remove|sleep|nap|start|push|shift|have|i\b|i'm|bed|go\b|work|study))/i).map((x) => x.trim()).filter(Boolean);
const RANGE_RE = new RegExp(`(from\\s+|between\\s+)?${TIME_RE}\\s*(-|–|—|to|till|until|and)\\s*${TIME_RE}`, "gi");
function rangeIn(c, ref) {
  for (const m of c.matchAll(RANGE_RE)) {
    const lead = (m[1] || "").trim().toLowerCase(), sep = m[3].toLowerCase();
    if (sep === "and" && lead !== "between") continue;
    const timeLike = /[:.]\d{2}|[ap]\.?m|noon|midday|midnight/i.test(m[2]);
    if (!lead && !timeLike && !/^[-–—]$/.test(sep)) continue; // "move paper 4 to 3pm" isn't a range
    const r = P.parseRange(m[2], m[4], ref);
    if (r) return { ...r, at: m.index, len: m[0].length };
  }
  return null;
}

/* Every time Vi states in a message, as pins: move a block, add one, a work window, or a bedtime. */
export function readPins(text, blocks, ctx = {}) {
  const now = ctx.now ?? 0, wake = ctx.wake ?? 300, pins = [];
  const fut = (start, end = null) => { // a clock time earlier than now (in the small hours) means tonight
    start = P.dayTime(start, wake);
    if (end != null) { end = P.dayTime(end, wake); if (end <= start) end += P.DAY; }
    if (start < now - 30 && start < 12 * 60 && start + P.DAY <= P.DAY + 8 * 60) { start += P.DAY; if (end != null) end += P.DAY; }
    return { start, end: end == null ? null : Math.min(P.SPAN, end) };
  };
  const durIn = (n, u) => (n ? Math.round(parseFloat(n) * (/^h/i.test(u) ? 60 : 1)) : null);
  for (const c0 of clauses(text)) {
    const c = c0.toLowerCase();
    if (/^(?:skip|cancel|drop|remove|not doing)\b/.test(c) || /\b(?:woke|wake|got up)\b/.test(c)) continue;
    const r = rangeIn(c, now);
    if (r) {
      const t = fut(r.start, r.end);
      const phrase = `${c.slice(0, r.at)} ${c.slice(r.at + r.len)}`.trim();
      if (/\b(sleep|sleeping|nap|napping|rest|resting|bed|lie down)\b/.test(phrase)) {
        if (t.start >= 19 * 60 && t.end > P.DAY + 3 * 60) pins.push({ kind: "bedtime", at: t.start, src: c0 });
        else pins.push({ kind: "add", title: /nap/.test(phrase) ? "Nap" : "Sleep", start: t.start, end: t.end, rest: true, src: c0 });
        continue;
      }
      const b = findBlock(blocks, phrase, 0.6);
      if (b) { pins.push({ kind: "move", id: b.id, title: b.title, start: t.start, end: t.end, src: c0 }); continue; }
      const bare = phrase.replace(VERBS, " ");
      if (!words(bare).length || GENERIC.test(phrase)) { pins.push({ kind: "window", start: t.start, end: t.end, all: /\b(all|everything)\b/.test(phrase), src: c0 }); continue; }
      const title = bare.replace(/\b(a|an|the|my|from|between|at)\b/g, " ").replace(/\s+/g, " ").trim();
      if (title) pins.push({ kind: "add", title: title.replace(/^\w/, (x) => x.toUpperCase()).slice(0, 60), start: t.start, end: t.end, src: c0 });
      continue;
    }
    let m;
    if ((m = new RegExp(`\\b(?:sleep|sleeping|bed|bedtime|go to bed|going to bed|lights out|crash|nap)\\b\\s*(?:at|by|around|about|~|is|=)?\\s*${TIME_RE}`, "i").exec(c))) {
      const at = parseTime(m[1], now);
      if (at != null) {
        const t = fut(at);
        if (/\bnap\b/.test(c) || t.start < 18 * 60) pins.push({ kind: "add", title: /\bnap\b/.test(c) ? "Nap" : "Sleep", start: t.start, end: t.start + 60, rest: true, src: c0 });
        else pins.push({ kind: "bedtime", at: t.start, src: c0 });
      }
      continue;
    }
    if ((m = new RegExp(`\\b(?:add|insert|book|schedule|i have|i've got|i got|there'?s|there is)\\s+(?:a |an |my )?(.+?)\\s+(?:at|from)\\s+${TIME_RE}(?:\\s*(?:for)?\\s*(\\d+(?:\\.\\d+)?)\\s*(min|mins|minutes|m|h|hr|hrs|hours?))?`, "i").exec(c))) {
      const at = parseTime(m[2], now);
      if (at == null) continue;
      const t = fut(at), len = durIn(m[3], m[4]);
      const b = findBlock(blocks, m[1], 0.66);
      if (b) pins.push({ kind: "move", id: b.id, title: b.title, start: t.start, end: len ? t.start + len : null, src: c0 });
      else pins.push({ kind: "add", title: m[1].replace(/^\w/, (x) => x.toUpperCase()).slice(0, 60), start: t.start, end: t.start + (len || 60), src: c0 });
      continue;
    }
    let moved = false;
    for (const mm of c.matchAll(new RegExp(`(?:move|change|shift|put|push|reschedule|do|start|make)\\s+(.+?)\\s+(?:to|at|for|from|by)\\s+${TIME_RE}(?:\\s*(?:for)?\\s*(\\d+(?:\\.\\d+)?)\\s*(min|mins|minutes|m|h|hr|hrs|hours?)\\b)?`, "gi"))) {
      const b = findBlock(blocks, mm[1]), at = parseTime(mm[2], now);
      if (!b || at == null) continue;
      const t = fut(at), len = durIn(mm[3], mm[4]);
      pins.push({ kind: "move", id: b.id, title: b.title, start: t.start, end: len ? t.start + len : null, src: c0 }); moved = true;
    }
    if (moved) continue;
    if ((m = new RegExp(`^(.+?)\\s+(?:at|@)\\s+${TIME_RE}$`, "i").exec(c))) {
      const b = findBlock(blocks, m[1], 0.66), at = parseTime(m[2], now);
      if (b && at != null) pins.push({ kind: "move", id: b.id, title: b.title, start: fut(at).start, end: null, src: c0 });
    }
  }
  return pins;
}

/* Sleeping through part of the day: planner-made travel there goes, a meal moves to just after waking. */
const inRest = (before, type, start, end) => new Set(before.filter((b) => b.type === type && !b.done && !b.locked && b.start < end && b.end > start).map((b) => b.id));
function makeRoomToRest(before, after, start, end) {
  const travel = inRest(before, "travel", start, end), meals = inRest(before, "meal", start, end);
  let out = after.filter((b) => !travel.has(b.id));
  for (const id of meals) {
    const key = P.itemsOf(out).find((it) => it.blocks.some((x) => x.id === id))?.key;
    if (key) out = P.setItemTime(out, key, end, null, { lock: false });
  }
  return out;
}
/* The night routine follows bedtime, unless it's done or Vi set its time herself. */
function routineTo(blocks, bed) {
  const run = P.itemsOf(blocks).find((it) => it.kind === "routine" && it.start >= 18 * 60 && !it.blocks.some((b) => b.done || b.locked));
  return run && run.end !== bed ? P.setItemTime(blocks, run.key, bed - (run.end - run.start), null, { lock: false }) : blocks;
}
/* A work window from this or an earlier check-in still holds: tasks pushed out of it go back in. */
function keepWindow(blocks, c, day) {
  const w = day.window === null ? null : day.window ? { start: P.hm(day.window.start), end: P.hm(day.window.end) } : c.window;
  return w ? P.packWindow(blocks, w.start, w.end, c.now || 0) : blocks;
}
/* Apply pins exactly. Pinned times are locked. Returns the new blocks, what changed, and day-level settings. */
export function applyPins(blocks, pins, ctx = {}) {
  let out = blocks;
  const did = [], day = {}, fixed = []; // fixed: times Vi stated that had to be corrected
  const keyOf = (id) => P.itemsOf(out).find((it) => it.blocks.some((x) => x.id === id))?.key;
  const order = { add: 0, bedtime: 1, window: 2, move: 3 };
  for (const p of [...pins].sort((a, b) => order[a.kind] - order[b.kind])) {
    if (p.kind === "add") {
      const same = out.find((b) => b.type !== "flex" && b.start === p.start && b.end === p.end);
      if (same) { if (!same.locked) out = out.map((b) => (b.id === same.id ? { ...b, locked: true } : b)); if (p.rest) out = makeRoomToRest(out, out, p.start, p.end); continue; }
      const like = findBlock(out.filter((b) => (p.rest ? /sleep|nap|rest|bed/i.test(b.title) : b.type === "fixed") && !b.done), p.title, 0.66);
      if (like) { const before = out; out = P.setItemTime(out, keyOf(like.id), p.start, p.end); if (p.rest) out = makeRoomToRest(before, out, p.start, p.end); did.push(`set “${like.title}” to ${P.pretty(p.start)}–${P.pretty(p.end)}`); fixed.push(did.at(-1)); continue; }
      const b = { id: newBlockId(), type: "fixed", start: p.start, end: p.end, title: p.title, loc: "home", done: false, locked: true, desc: p.rest ? REST_DESC : "Added at check-in." };
      const before = out;
      out = P.setItemTime([...out, b], b.id, p.start, p.end);
      if (p.rest) out = makeRoomToRest(before, out, p.start, p.end);
      did.push(`added “${p.title}” ${P.pretty(p.start)}–${P.pretty(p.end)}`); fixed.push(did.at(-1));
    } else if (p.kind === "bedtime") {
      day.sleep = P.clockX(p.at);
      out = routineTo(out, p.at);
      if (ctx.sleep !== p.at) did.push(`bedtime is now ${P.pretty(p.at)}`);
    } else if (p.kind === "window") {
      day.window = { start: P.clockX(p.start), end: P.clockX(p.end) };
      const bed = Math.max(day.sleep ? P.hm(day.sleep) : ctx.sleep ?? 0, p.end);
      if (bed > (ctx.sleep ?? 0)) out = routineTo(out, bed); // a window past bedtime moves bedtime with it
      const next = P.packWindow(out, p.start, p.end, ctx.now || 0, { all: p.all });
      if (next !== out) did.push(`your tasks now sit inside ${P.pretty(p.start)}–${P.pretty(p.end)}`);
      out = next;
    } else if (p.kind === "move") {
      const b = out.find((x) => x.id === p.id);
      if (!b || b.done) continue;
      if (b.start === p.start && (p.end == null || b.end === p.end)) { if (!b.locked) out = P.setItemTime(out, keyOf(b.id), b.start, p.end); continue; }
      out = P.setItemTime(out, keyOf(b.id), p.start, p.end);
      did.push(`moved “${b.title}” to ${P.pretty(p.start)}${p.end != null ? `–${P.pretty(p.end)}` : ""}`); fixed.push(did.at(-1));
    }
  }
  return { blocks: out, did, day, fixed };
}

/* Built-in understanding of check-ins (also the safety net under Claude). Null when nothing matched. */
export function checkinHeuristic(text, blocks, now, ctx = {}) {
  const t = String(text).toLowerCase();
  let out = blocks;
  const did = [];
  const first = () => [...out].filter((b) => b.type !== "flex" && b.type !== "fixed" && !b.done && !b.locked).sort((a, b) => a.start - b.start)[0];
  let m;
  if ((m = new RegExp(`(?:woke up|got up)(?: late)?[, ]*(?:at |around |~)?${TIME_RE}(?!\\s*(?:h|hr|hrs|hours?|m|min|mins|minutes)\\b)`).exec(t)) && parseTime(m[1], null, { morning: true }) != null) {
    const at = parseTime(m[1], null, { morning: true }), f = first();
    if (f && at > f.start) { out = P.shiftFrom(out, 0, at - f.start); did.push(`shifted the day by ${P.dur(at - f.start)}`); }
  } else if ((m = /(?:late|behind)(?: by)? (\d+(?:\.\d+)?)\s*(min|mins|minutes|m|h|hr|hrs|hours?)\b/.exec(t))) {
    const d = Math.round(parseFloat(m[1]) * (/^h/.test(m[2]) ? 60 : 1));
    out = P.shiftFrom(out, now, d); did.push(`pushed everything left by ${P.dur(d)}`);
  } else if (/woke up late|running late|overslept|behind schedule|i'?m late/.test(t)) {
    const f = first();
    if (f && now > f.start) { out = P.shiftFrom(out, 0, Math.ceil((now - f.start) / 5) * 5); did.push("moved the rest of the day to start from now"); }
  }
  for (const c of clauses(t)) {
    const mm = /^(?:please\s+)?(?:skip|cancel|drop|remove|not doing)\s+(?:the\s+)?(.+?)(?:\s+today)?$/.exec(c);
    const b = mm && findBlock(out, mm[1]);
    if (b) { out = P.removeItem(out, P.itemsOf(out).find((it) => it.blocks.some((x) => x.id === b.id))?.key); did.push(`removed “${b.title}”`); }
  }
  const res = applyPins(out, readPins(text, out, { ...ctx, now }), { ...ctx, now });
  out = keepWindow(res.blocks, { ...ctx, now }, res.day); did.push(...res.did);
  const remember = [];
  const note = /^(?:please\s+)?(?:remember|note|fyi|keep in mind|for context|heads up)\b[:,]?\s*(?:that\s+)?(.+)$/i.exec(String(text).trim());
  if (note) remember.push({ text: note[1].slice(0, 120), scope: /\b(this week|every ?day|always|from now on|usually|each day|weekdays|weekends|these days)\b/i.test(note[1]) ? "ongoing" : "today" });
  if (!did.length && !remember.length && !Object.keys(res.day).length) return null;
  return { blocks: out === blocks ? null : out, reply: did.length ? `Done: ${did.join(", ")}.` : "Noted. I'll keep that in mind.", did, day: res.day, remember, forget: [] };
}

const schedJSON = (blocks) => JSON.stringify([...blocks].filter((b) => b.type !== "flex").sort((a, b) => a.start - b.start).map((b) => ({ id: b.id, type: b.type, title: b.title, start: P.clockX(b.start), end: P.clockX(b.end), ...(b.done ? { done: true } : {}), ...(b.locked ? { locked: true } : {}) })));

/* Claude's {changes:[{id,start,end,exact}], remove:[id], add:[{title,start,end}]} applied to a schedule.
 * Done blocks never change; locked ones only when Vi's message is about them. */
export function applyChanges(blocks, out, ctx = {}) {
  const wake = ctx.wake ?? 300, text = ctx.text || "", global = GLOBAL.test(text);
  const may = (b) => !b.done && (!b.locked || global || mentions(text, b.title));
  const when = (v) => {
    let m = hhmm(v);
    if (m == null) return null;
    m = P.dayTime(m, wake);
    if (ctx.now != null && m < ctx.now - 15 && m < 12 * 60) m += P.DAY; // "01:00" said in the afternoon means tonight
    return Math.min(P.SPAN, m);
  };
  let b = blocks.map((x) => ({ ...x }));
  const rm = new Set((Array.isArray(out.remove) ? out.remove : []).filter((id) => { const x = b.find((y) => y.id === id); return x && may(x); }));
  b = b.filter((x) => !rm.has(x.id));
  for (const c of Array.isArray(out.changes) ? out.changes : []) {
    const x = b.find((y) => y.id === c?.id);
    if (!x || !may(x)) continue;
    const s = when(c.start);
    let e = when(c.end);
    if (s == null) continue;
    if (e != null && e <= s) e += P.DAY;
    const len = x.end - x.start;
    x.start = s; x.end = e != null && e > s ? Math.min(P.SPAN, e) : s + len;
    if (c.exact === true || out.lock) x.locked = true;
  }
  for (const a of Array.isArray(out.add) ? out.add : []) {
    const s = when(a?.start), title = str(a?.title, 80);
    let e = when(a?.end);
    if (!title || s == null) continue;
    if (e != null && e <= s) e += P.DAY;
    b.push({ id: newBlockId(), type: "fixed", start: s, end: e != null && e > s ? e : s + 30, title, loc: "home", done: false, locked: true, desc: /sleep|nap/i.test(title) ? REST_DESC : "Added by your coach." });
  }
  const before = b.map((x) => ({ ...x })); // resolve moves blocks in place
  let res = P.resolve(P.itemsOf(b)).flatMap((it) => it.blocks).sort((x, y) => x.start - y.start);
  for (const r of res.filter((x) => x.type === "fixed" && /^(sleep|nap)\b/i.test(x.title) && !x.done)) res = makeRoomToRest(before, res, r.start, r.end);
  return res;
}

/* Claude's day-level answer → day rules. A bedtime or window that would already be over means tonight. */
const dayOut = (d, c) => {
  const out = {}, wake = c.wake ?? 300, now = c.now ?? wake;
  if (!d || typeof d !== "object") return out;
  const t = (v) => { const m = hhmm(v); return m == null ? null : P.dayTime(m, wake); };
  let s = t(d.sleep);
  if (s != null) { if (s <= Math.max(now, wake + 60)) s += P.DAY; out.sleep = P.clockX(Math.min(P.SPAN, s)); }
  if (hhmm(d.wake) != null) out.wake = P.clockX(hhmm(d.wake));
  if (d.window === null) out.window = null;
  else if (d.window && t(d.window.start) != null && t(d.window.end) != null) {
    let a = t(d.window.start), b = t(d.window.end);
    if (b <= a) b += P.DAY;
    if (b <= now && a + P.DAY < P.SPAN) { a += P.DAY; b += P.DAY; }
    out.window = { start: P.clockX(a), end: P.clockX(Math.min(P.SPAN, b)) };
  }
  return out;
};

/* What the coach knows about the day so far: earlier check-ins, notes, recent days. */
function memoryText(c) {
  const X = P.clockX;
  const hist = (c.history || []).slice(-10).map((h) => `- ${h.clock != null ? X(h.clock) : "earlier"} Vi: ${h.text ? `"${h.text.slice(0, 300)}"` : "(message not saved)"} → you: "${String(h.reply || "").slice(0, 300)}"`).join("\n");
  const notes = (c.memory || []).map((n) => `- [${n.id}] ${n.text}${n.scope === "ongoing" ? ` (ongoing since ${n.from})` : ""}`).join("\n");
  const recent = (c.recent || []).slice(-6).map((h) => `- ${h.date}${h.clock != null ? " " + X(h.clock) : ""}: "${String(h.text).slice(0, 200)}"`).join("\n");
  return `Things Vi asked you to keep in mind (still true unless she says otherwise):
${notes || "- none yet"}
Earlier check-ins today, oldest first. Everything Vi asked for here still stands unless she now changes it:
${hist || "- none yet"}
${recent ? `Check-ins from the last few days (context only):\n${recent}\n` : ""}`;
}
const dayRules = (c) => {
  const X = P.clockX;
  return `Times: 24-hour "HH:MM". Today runs from wake ${X(c.wake)} to bed ${X(c.sleep)}. Times after midnight tonight are written 24:00–35:59 (1:30am tonight = "25:30", 6am tomorrow = "30:00").${c.window ? ` Vi wants her tasks inside ${X(c.window.start)}–${X(c.window.end)}.` : ""}`;
};

export async function checkin(text, c) {
  const now = c.now, blocks = c.blocks;
  const quick = checkinHeuristic(text, blocks, now, c);
  const X = P.clockX;
  const prompt = `You are Vi's warm, practical day coach. Vi is checking in about her schedule for ${c.date ? `${P.DOW[P.parseISO(c.date).getDay()]} ${c.date}` : "today"}. Now: ${X(now)}.
${dayRules(c)}
Places: ${JSON.stringify(c.locations || {})}. Energy: ${c.energy || "ok"}.${c.fixedText ? ` Fixed plans Vi typed: "${c.fixedText.slice(0, 300)}".` : ""}
Tasks, in Vi's priority order: ${JSON.stringify((c.tasks || []).map((t) => ({ title: t.title, tier: t.tier, minutes: t.min, ...(t.done ? { done: true } : {}) })))}
${memoryText(c)}
Current schedule (flex buffers omitted; "locked" = a time Vi set herself):
${schedJSON(blocks)}

Vi says now: """${String(text).slice(0, 1000)}"""

Rules, follow exactly:
1. Every time Vi states (now or in an earlier check-in) is a hard requirement. Use exactly that start, and end if she gave one. Mark those changes "exact": true.
2. Locked blocks keep their times unless Vi's message is about that block (by name, or "everything"/"all tasks").
3. Build on earlier check-ins: don't undo something Vi asked for before unless she changes it now.
4. Never put unfinished blocks before now (${X(now)}). If Vi means after midnight tonight, use 24:00+ times.
5. Never change done blocks.
6. No overlaps. When something moves, shift the following unfinished, unlocked blocks in order.
7. Sleep or a nap inside the day → add a block titled "Sleep" or "Nap" with those exact times. If tonight's bedtime changes, set day.sleep. If Vi wants her tasks inside a time range, set day.window and put the tasks inside it in priority order.
8. Keep durations unless asked. If it can't all fit, shorten "secondary" blocks or drop breaks first, and say so.
9. Tomorrow's routines and tasks don't belong in today's schedule.
10. "remember": new facts or preferences from this message worth keeping for later check-ins (e.g. "School until 3:30 on weekdays", "Sleeping 4–11pm today"). scope "today" or "ongoing" (applies to coming days too). "forget": ids of notes that are no longer true.
Only list blocks whose times change.
Reply with only JSON:
{"changes":[{"id":"","start":"HH:MM","end":"HH:MM","exact":false}],"remove":["id"],"add":[{"title":"","start":"HH:MM","end":"HH:MM"}],"day":{"sleep":"HH:MM","window":{"start":"HH:MM","end":"HH:MM"}},"remember":[{"text":"","scope":"today"}],"forget":["id"],"reply":"1-2 short, kind sentences: what changed, with the key times","tip":"one encouraging tip for the rest of the day"}
Leave out "day" fields that don't change; set "window": null to clear an old window.`;
  try {
    const out = await ask(prompt, { tier: "default" });
    if (out && typeof out === "object") {
      const touched = !!(out.changes?.length || out.remove?.length || out.add?.length);
      const next = touched ? applyChanges(blocks, out, { ...c, text }) : blocks;
      // Vi's own words get the last say on times
      const res = applyPins(next, readPins(text, blocks, c), c);
      const day = { ...dayOut(out.day, c), ...res.day };
      const final = keepWindow(res.blocks, c, day);
      // when Vi's own times had to correct Claude, say what actually happened instead
      const reply = touched && res.fixed.length ? `Done: ${res.fixed.join(", ")}, exactly as you said.` : str(out.reply, 400) || (res.did.length ? `Done: ${res.did.join(", ")}.` : "Updated your day.");
      return {
        ai: true, blocks: final === blocks ? null : final, day, reply,
        tip: str(out.tip, 220),
        remember: (Array.isArray(out.remember) ? out.remember : []).map((r) => ({ text: str(r?.text, 140), scope: r?.scope === "ongoing" ? "ongoing" : "today" })).filter((r) => r.text),
        forget: (Array.isArray(out.forget) ? out.forget : []).map((x) => String(x)),
      };
    }
  } catch (e) { if (!quick) return { blocks: null, reply: e.message, error: true }; }
  return quick ? { ...quick, ai: false } : { blocks: null, reply: "I couldn't tell what to change. Try “woke up late, start from 8:30”, “move ESAT paper to 3pm”, “sleep 4–11pm, then all tasks 11pm–6am” or “remember: school until 3:30”." };
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
Date: ${day.date} (${P.DOW[P.parseISO(day.date).getDay()]}). Places: morning ${day.locations.morning}, afternoon ${day.locations.afternoon}, evening ${day.locations.evening}. Energy: ${day.energy}.
${dayRules(day)}
Place conditions: ${[...new Set(Object.values(day.locations))].map((k) => `${k}: ${PLACES[k]?.note}`).join(" ")}
Tasks (priority order): ${JSON.stringify(day.tasks.map((t) => ({ id: t.id, title: t.title, tier: t.tier, minutes: t.min, when: t.when })))}
${memoryText(day)}
Schedule (flex buffers omitted; "locked" = a time Vi set herself, never change those):
${schedJSON(day.blocks)}
${day.notes ? `Vi's notes for today: """${day.notes.slice(0, 600)}"""\nIf the notes ask for changes (e.g. a new appointment, leaving early), express them as schedule changes; otherwise leave "changes" empty.` : "Leave \"changes\" empty unless something is clearly wrong, e.g. it breaks something Vi asked for above."}

Also write 5–8 short, friendly reminders for moments through the day (e.g. before deep work, lunch "stretch and order something nice", leaving for or getting home from the cafe "charge devices for tomorrow", an afternoon slump, wind-down). Tie each to a block id where it makes sense.
Reply with only JSON: {"theme":"≤4 words","description":"1-2 sentences on the shape of the day","tip":"one encouraging tip ≤140 chars","taskTips":[{"id":"task id","tip":"concrete first step ≤110 chars","doneWhen":"≤50 chars"}],"changes":[{"id":"","start":"HH:MM","end":"HH:MM"}],"add":[{"title":"","start":"HH:MM","end":"HH:MM"}],"reminders":[{"time":"HH:MM","block":"id or empty","text":"≤110 chars"}]}`;
  try {
    const out = await ask(prompt, { tier: "default" });
    if (!out) return { ...dayNoteHeuristic(day), ai: false };
    return {
      ai: true, theme: str(out.theme, 50), description: str(out.description, 300), tip: str(out.tip, 180),
      taskTips: Array.isArray(out.taskTips) ? out.taskTips.map((x) => ({ id: str(x.id, 60), tip: str(x.tip, 160), doneWhen: str(x.doneWhen, 80) })) : [],
      changes: out.changes, add: out.add,
      reminders: Array.isArray(out.reminders) ? out.reminders.map((r) => ({ at: hhmm(r.time) == null ? null : P.dayTime(hhmm(r.time), day.wake ?? 300), block: str(r.block, 60) || null, text: str(r.text, 160) })).filter((r) => r.at != null && r.text) : [],
    };
  } catch (e) { return { ...dayNoteHeuristic(day), ai: false, error: e.message }; }
}
