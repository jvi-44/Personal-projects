// Vi's Starmap — the "coach": turns loose task text into seeds and seeds into a week.
// Uses Claude through the artifact `sample` capability when available; every
// function has a deterministic fallback so the page works offline too.
import * as P from "./planner.js";

export const PLACES = {
  home: { icon: "🏠", label: "Home", good: ["admin", "exercise", "outreach", "code", "study"], note: "Flexible and comfy. Best for routines, admin, exercise and light review. Watch out for bed and phone." },
  cafe: { icon: "☕", label: "Cafe", good: ["essay", "creative", "reading", "outreach"], note: "Buzzing background noise. Great for drafting essays and creative work in 2–3h sessions. Needs travel and headphones." },
  library: { icon: "📚", label: "Library", good: ["paper", "study", "code", "essay"], note: "Silent deep focus. Best for timed papers, heavy study and anything needing exam conditions." },
  school: { icon: "🎒", label: "School", good: ["study", "outreach", "admin"], note: "Fixed class hours. Use free periods for quick recall, teacher questions and admin." },
  outdoors: { icon: "🌳", label: "Outdoors", good: ["exercise", "reading"], note: "Fresh air. Light reading, walks, runs." },
};
export const PLACE_KEYS = Object.keys(PLACES);
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

/* ───────────── seeds: heuristic parse ───────────── */
function minutesIn(s) {
  const h = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i.exec(s);
  const m = /(\d+)\s*(?:m|min|mins|minutes?)\b/i.exec(s);
  let t = 0;
  if (h) t += Math.round(parseFloat(h[1]) * 60);
  if (m) t += +m[1];
  return t || null;
}
const clean = (s) => s.replace(/\(?\s*\d+(?:\.\d+)?\s*(?:hours?|hrs|hr|h|minutes?|mins|min|m)\b\s*\)?/gi, "").replace(/\s{2,}/g, " ").replace(/^[-•*\s]+|[\s,.;]+$/g, "").trim();

export function parseSeedsHeuristic(text) {
  return String(text || "")
    .split(/\n|;|,(?![^(]*\))|\s+\band\b\s+(?=[A-Z])/)
    .map((s) => s.trim()).filter((s) => s.length > 1)
    .map((raw) => {
      const title = clean(raw) || raw;
      const kind = P.inferKind(title);
      const min = Math.max(10, Math.min(300, Math.round((minutesIn(raw) || DEFAULT_MIN[kind]) / 5) * 5));
      const priority = kind === "admin" || min <= 15 ? "admin" : DEEP.includes(kind) ? "win" : "also";
      const place = PLACE_KEYS.find((k) => k !== "home" && PLACES[k].good[0] === kind) || "any";
      return { id: newId(), title: title.slice(0, 80), min, kind, priority, where: place === "library" || place === "cafe" ? place : "any", tip: tipFor(kind, title), doneWhen: "" };
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

/* ───────────── seeds: AI ───────────── */
export async function seedsFromText(text, ctx = {}) {
  const fallback = parseSeedsHeuristic(text);
  const prompt = `You help a student (Vi, in a gap between A-level-style prelims and university applications) turn a quick note into planner tasks.
Split the note into separate tasks. For each, reply with:
- title: short, clear, keeps Vi's own wording (max 60 chars)
- minutes: realistic focused time, multiple of 15 (15-240). Respect any duration Vi wrote.
- kind: one of ${KINDS.join("|")}
- priority: "win" (important deep work that would make the day a success), "also" (worth doing), or "admin" (under ~15 min, errands, forms, payments)
- place: best place to do it: ${PLACE_KEYS.join("|")} or "any"
- tip: one warm, specific first step or encouragement for THIS task (max 120 chars)
- doneWhen: a concrete finish line (max 60 chars)
Tasks already planned today (don't duplicate): ${(ctx.existing || []).join("; ") || "none"}.
Reply with only JSON: {"tasks":[{"title":"","minutes":60,"kind":"","priority":"","place":"","tip":"","doneWhen":""}]}

Note: """${String(text).slice(0, 2000)}"""`;
  const out = await ask(prompt, { tier: "quick" });
  if (!out || !Array.isArray(out.tasks) || !out.tasks.length) return { tasks: fallback, ai: false };
  const tasks = out.tasks.slice(0, 12).map((t) => {
    const title = str(t.title, 80) || "Untitled task";
    const kind = oneOf(t.kind, KINDS, P.inferKind(title));
    return { id: newId(), title, min: num(t.minutes, 10, 300, DEFAULT_MIN[kind]), kind, priority: oneOf(t.priority, ["win", "also", "admin"], "also"), where: oneOf(t.place, [...PLACE_KEYS, "any"], "any"), tip: str(t.tip, 160) || tipFor(kind, title), doneWhen: str(t.doneWhen, 80) };
  });
  return { tasks, ai: true };
}

/* ───────────── week: shared helpers ───────────── */
function focusBudget(settings, locations, fixed) {
  const p = P.generatePlan({ primary: [], secondary: [], admin: [], fixed: P.parseFixed(fixed), locations }, settings);
  return p.stats.flexMin;
}
const fitScore = (kind, loc) => (PLACES[loc]?.good.includes(kind) ? (PLACES[loc].good[0] === kind ? 2 : 1) : 0);
const dayFit = (kind, locs) => Math.max(fitScore(kind, locs.morning) * 1.2, fitScore(kind, locs.afternoon), fitScore(kind, locs.evening) * 0.8);

/* Deterministic week plan: greedy, place-aware, spreads deep work. */
export function planWeekHeuristic(ctx) {
  const days = ctx.days.map((d) => ({ ...d, primary: [], secondary: [], admin: [], used: 0 }));
  const seeds = [...ctx.seeds].sort((a, b) => (a.priority === b.priority ? b.min - a.min : a.priority === "win" ? -1 : b.priority === "win" ? 1 : a.priority === "also" ? -1 : 1));
  for (const s of seeds) {
    let left = s.min, part = 0;
    const parts = s.min > 150 ? Math.ceil(s.min / 120) : 1;
    while (left > 0 && part < parts) {
      const chunk = parts > 1 ? Math.min(left, Math.ceil(s.min / parts / 15) * 15) : left;
      const tier = s.priority === "admin" ? "admin" : s.priority === "win" ? "primary" : "secondary";
      const cands = days.filter((d) => (tier === "admin" ? d.admin.length < 4 : d[tier].length < 3) && d.used + chunk <= d.budget * 0.85 && !(parts > 1 && d.primary.concat(d.secondary).some((x) => x.seedId === s.id)))
        .map((d) => ({ d, sc: dayFit(s.kind, d.locations) * 2 - d.used / Math.max(60, d.budget) * 3 - days.indexOf(d) * 0.05 }))
        .sort((a, b) => b.sc - a.sc);
      const c = cands[0]?.d || (tier === "primary" ? days.filter((d) => d.secondary.length < 3 && d.used + chunk <= d.budget)[0] : null);
      if (!c) break;
      const t = { seedId: s.id, title: parts > 1 ? `${s.title} (part ${part + 1})` : s.title, minutes: chunk, tip: s.tip || tipFor(s.kind, s.title), doneWhen: parts > 1 ? "" : s.doneWhen || "", kind: s.kind, where: s.where };
      if (tier === "admin") c.admin.push({ title: s.title, minutes: s.min });
      else (c[tier].length < 3 ? c[tier] : c.secondary).push(t);
      c.used += chunk; left -= chunk; part++;
    }
  }
  return {
    weekTheme: "One flower at a time",
    weekNote: "Deep work lands where you focus best, lighter tasks fill the gaps, and every day keeps room to breathe.",
    days: days.map((d) => {
      const main = d.locations.morning;
      const heavy = d.primary.length;
      return {
        date: d.date,
        theme: heavy ? `${PLACES[main]?.label || "Home"} ${heavy >= 3 ? "deep-dive" : "focus"}` : "Light & restful",
        description: heavy ? `${PLACES[main]?.note.split(".")[0]}. ${d.primary.map((t) => t.title).join(", ")} ${heavy > 1 ? "are" : "is"} today's main event.` : "A gentle day. Catch up, rest, and let the garden grow.",
        tip: cheer(d.date),
        primary: d.primary, secondary: d.secondary, admin: d.admin,
      };
    }),
  };
}

/* ───────────── week: AI ───────────── */
export async function planWeek(input, { onText, signal } = {}) {
  const ctx = {
    ...input,
    days: input.days.map((d) => ({ ...d, budget: focusBudget(input.settings, d.locations, d.fixed) })),
  };
  const fallback = () => planWeekHeuristic(ctx);
  const R = (arr) => arr.map(([m, t]) => `${t} (${m}m)`).join(", ") || "none";
  const prompt = `You are a warm, practical study coach planning a week for Vi, a student between prelim exams and university applications.
Assign Vi's task "seeds" to days. Each day has up to 3 PRIMARY "win the day" tasks (deep, important) and up to 3 SECONDARY tasks, plus small admin items.

Where Vi works changes what fits:
${PLACE_KEYS.map((k) => `- ${k}: ${PLACES[k].note}`).join("\n")}

Rules:
- Match tasks to places: timed papers and heavy study → library or quiet home; essays and creative work → cafe; admin, outreach → school free periods or home; exercise → home/outdoors.
- Stay inside each day's focusBudget (minutes of free time after routines, meals, travel and fixed commitments). Aim for ~75% of it so the day has buffer.
- Big tasks may be split across days as "(part 1)", "(part 2)". Keep the seed id in "seed".
- Spread the heaviest work; don't stack two exam papers on one day unless the budget is huge. A lighter day after a heavy one is good.
- Only use the seeds given. Days with no fitting seeds can stay light; say so kindly.
- Every day gets: theme (≤4 words, e.g. "Library deep-dive"), description (1–2 sentences about the shape of the day and why it suits where Vi will be), tip (one encouraging, specific, practical tip for that day, ≤140 chars).
- Every task gets tip (a concrete first step, ≤120 chars) and doneWhen (finish line, ≤60 chars).

Routines already in every day: morning ${R(input.settings.morningRoutine)}; night ${R(input.settings.eveningRoutine)}. Wake ${input.settings.wake}, sleep ${input.settings.sleep}, peak focus: ${input.settings.peak}.

Days:
${JSON.stringify(ctx.days.map((d) => ({ date: d.date, weekday: P.DOW[P.parseISO(d.date).getDay()], places: d.locations, fixed: d.fixed || "", focusBudget: d.budget })))}

Seeds:
${JSON.stringify(ctx.seeds.map((s) => ({ id: s.id, title: s.title, minutes: s.min, kind: s.kind, priority: s.priority, place: s.where, notes: s.doneWhen || undefined })))}

Reply with only JSON:
{"weekTheme":"≤5 words","weekNote":"1-2 encouraging sentences about the week's shape","days":[{"date":"YYYY-MM-DD","theme":"","description":"","tip":"","primary":[{"seed":"id","title":"","minutes":90,"tip":"","doneWhen":""}],"secondary":[],"admin":[{"title":"","minutes":10}]}]}`;
  let out;
  try { out = await ask(prompt, { tier: "default", onText, signal }); }
  catch (e) { const r = fallback(); r.error = e.message; if (e.code === "cancelled") r.cancelled = true; return r; }
  if (!out || !Array.isArray(out.days)) return { ...fallback(), ai: false };
  const byId = new Map(ctx.seeds.map((s) => [s.id, s]));
  const task = (t) => {
    const seed = byId.get(t.seed);
    const title = str(t.title, 90) || seed?.title || "Task";
    const kind = seed?.kind || P.inferKind(title);
    return { seedId: seed ? seed.id : null, title, minutes: num(t.minutes, 10, 300, seed?.min || 60), tip: str(t.tip, 160) || tipFor(kind, title), doneWhen: str(t.doneWhen, 80), kind, where: seed?.where || "any" };
  };
  const dates = new Set(ctx.days.map((d) => d.date));
  return {
    ai: true,
    weekTheme: str(out.weekTheme, 60), weekNote: str(out.weekNote, 300),
    days: out.days.filter((d) => dates.has(d.date)).map((d) => ({
      date: d.date, theme: str(d.theme, 50), description: str(d.description, 300), tip: str(d.tip, 180),
      primary: (Array.isArray(d.primary) ? d.primary : []).slice(0, 3).map(task),
      secondary: (Array.isArray(d.secondary) ? d.secondary : []).slice(0, 3).map(task),
      admin: (Array.isArray(d.admin) ? d.admin : []).slice(0, 6).map((a) => ({ title: str(a.title, 80), minutes: num(a.minutes, 5, 60, 10) })).filter((a) => a.title),
    })),
  };
}

/* ───────────── day: AI coach note (also used at check-in) ───────────── */
export function dayNoteHeuristic(day) {
  const wins = day.tasks.filter((t) => t.tier === "primary");
  const done = day.tasks.filter((t) => t.progress >= 1).length;
  const main = PLACES[day.locations.morning] || PLACES.home;
  if (day.checkin) {
    return {
      theme: done ? "Keep the momentum" : "Fresh start from here",
      description: done ? `${done} of ${day.tasks.length} bloomed already. The rest of the day is re-planned around what's left.` : "Nothing's lost. The rest of today is re-planned from now with buffers intact.",
      tip: day.energy === "low" ? "Low energy: shortest version of the next task, then a real break." : cheer(day.date + done),
    };
  }
  return {
    theme: wins.length ? `${main.label} focus` : "Plant today's wins",
    description: wins.length ? `${main.note.split(".")[0]}. Your wins: ${wins.map((t) => t.title).join(", ")}.` : "Add up to three wins and three extras, and the day builds itself around your routines.",
    tip: wins[0] ? tipFor(P.inferKind(wins[0].title), wins[0].title) : cheer(day.date),
  };
}

export async function dayNote(day) {
  const prompt = `You are a warm, practical study coach. Write a short note for Vi's ${day.checkin ? "mid-day check-in" : "day plan"}.
Date: ${day.date} (${P.DOW[P.parseISO(day.date).getDay()]}). Places: morning ${day.locations.morning}, afternoon ${day.locations.afternoon}, evening ${day.locations.evening}. Energy: ${day.energy}.
${day.checkin ? `Time now: ${day.now}. ` : ""}Tasks (tier, progress 0-1): ${JSON.stringify(day.tasks.map((t) => ({ title: t.title, tier: t.tier, minutes: t.min, progress: Math.round(t.progress * 100) / 100 })))}
${day.reflection ? `Vi's note: """${day.reflection.slice(0, 600)}"""` : ""}
Place conditions: ${day.locations.morning}: ${PLACES[day.locations.morning]?.note || ""}
Reply with only JSON: {"theme":"≤4 words","description":"1-2 sentences on the shape of ${day.checkin ? "the rest of " : ""}the day","tip":"one specific, encouraging tip ≤140 chars","taskTips":[{"title":"exact task title","tip":"concrete first step ≤110 chars"}]}`;
  try {
    const out = await ask(prompt, { tier: "quick" });
    if (!out) return { ...dayNoteHeuristic(day), ai: false };
    return {
      ai: true, theme: str(out.theme, 50), description: str(out.description, 300), tip: str(out.tip, 180),
      taskTips: Array.isArray(out.taskTips) ? out.taskTips.map((x) => ({ title: str(x.title, 90), tip: str(x.tip, 160) })).filter((x) => x.title && x.tip) : [],
    };
  } catch (e) { return { ...dayNoteHeuristic(day), ai: false, error: e.message }; }
}
