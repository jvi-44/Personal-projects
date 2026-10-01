import * as P from "./planner.js";
import * as C from "./coach.js";
import * as N from "./notionsync.js";
import { createScene } from "./scene.js";

/* ───────────── helpers ───────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const IN_ARTIFACT = typeof window !== "undefined" && !!window.ARTIFACT;
const today = () => P.iso(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const PLACE = (k) => C.PLACES[k] || C.PLACES.home;
const SEG = [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]];
const DOW3 = (d) => P.DOW[P.parseISO(d).getDay()].slice(0, 3);
const isSat = (d) => P.parseISO(d).getDay() === 6;
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

/* ───────────── state ───────────── */
const KEY = "starmap.v2";
const blankTask = (id) => ({ id, title: "", min: 60, kind: "auto", when: "any", tip: "", doneWhen: "", done: false, seedId: null });
const defaultSettings = () => ({ ...structuredClone(P.DEFAULT_SETTINGS), routinesOn: { morning: true, evening: true }, places: { morning: "home", afternoon: "home", evening: "home" } });
const FIRST_WEEK = "2026-09-27";
function fresh() {
  return { settings: defaultSettings(), pool: [], weeks: { [FIRST_WEEK]: { theme: "After Prelims", notion: { title: "ЩΣΣK After Prelims", state: "linked" } } }, days: {}, habits: {}, placeMemory: {}, ui: { scope: "today", notionOpen: true }, savedAt: 0 };
}
function migrate(s) {
  const f = fresh();
  const out = { ...f, ...s, settings: { ...f.settings, ...s.settings, routinesOn: { ...f.settings.routinesOn, ...(s.settings?.routinesOn || {}) }, places: { ...f.settings.places, ...(s.settings?.places || {}) } }, habits: s.habits || {}, ui: { ...f.ui, ...(s.ui || {}) } };
  for (const [k, w] of Object.entries(out.weeks)) {
    if (!w.notion) {
      if (k === FIRST_WEEK) { w.theme = w.label || "After Prelims"; w.notion = { title: `ЩΣΣK ${w.label || "After Prelims"}`, state: "linked" }; }
      else { w.theme = w.word || ""; w.notion = { state: "none" }; }
    }
  }
  for (const dd of Object.values(out.days)) for (const t of [...(dd.inputs?.primary || []), ...(dd.inputs?.secondary || [])]) { t.when ||= "any"; delete t.where; }
  // routine ticks made before the habit tracker existed become habit entries
  for (const [d, dd] of Object.entries(out.days)) for (const b of dd.plan?.blocks || []) {
    if (b.type !== "routine" || !b.done) continue;
    const which = b.start < 12 * 60 ? "morning" : "evening";
    ((out.habits[d] ||= {})[which] ||= {})[b.title] ??= true;
  }
  return out;
}
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!s) { try { const v1 = JSON.parse(localStorage.getItem("starmap.v1")); if (v1?.days) s = { days: v1.days, settings: v1.settings }; } catch {} }
  return migrate(s || {});
}
let S = load();
let cur = today();
let selected = -1, openRow = null, openItem = null, aiOn = false, busy = 0, notionOn = false;
let notionLive = {}; // weekKey → {days, at} read back from Notion

const eff = () => ({ ...S.settings, morningRoutine: S.settings.routinesOn.morning ? S.settings.morningRoutine : [], eveningRoutine: S.settings.routinesOn.evening ? S.settings.eveningRoutine : [] });
function day(d = cur) {
  if (!S.days[d]) {
    const mem = S.placeMemory[P.parseISO(d).getDay()];
    S.days[d] = { inputs: { primary: [0, 1, 2].map((i) => blankTask(`p${i}-${d}`)), secondary: [0, 1, 2].map((i) => blankTask(`s${i}-${d}`)), adminText: "", fixedText: "", locations: { ...(mem || S.settings.places) }, energy: "ok", reflection: "", notes: "" }, plan: null, ai: null, aiNudges: [], nudges: [], shown: [] };
  }
  const dd = S.days[d];
  dd.aiNudges ||= []; dd.nudges ||= []; dd.shown ||= [];
  for (const k of ["primary", "secondary"]) while (dd.inputs[k].length < 3) dd.inputs[k].push(blankTask(`${k[0]}${dd.inputs[k].length}-${d}-${Date.now()}`));
  return dd;
}
const tasksOf = (d = cur) => [...day(d).inputs.primary, ...day(d).inputs.secondary];
const blocksOf = (d = cur) => day(d).plan?.blocks || [];
const prog = (t, d = cur) => P.taskProgress(t, blocksOf(d));
function ensureWeek(d) { const k = P.weekStart(d); S.weeks[k] ||= { theme: "", notion: { state: "none" } }; return k; }
const weekTitle = (k) => `ЩΣΣK ${S.weeks[k].theme?.trim() || `of ${P.shortDate(k)}`}`;

/* ───────────── persistence: localStorage + artifact db ───────────── */
let db = null, dirtyDays = new Set(), metaDirty = false, dbTimer = null, dbBusy = false;
function save(d) {
  S.savedAt = Date.now();
  if (d) dirtyDays.add(d); metaDirty = true;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (db) { clearTimeout(dbTimer); dbTimer = setTimeout(flushDb, 1200); }
  if (d) queueNotion(P.weekStart(d));
}
async function flushDb() {
  if (dbBusy) { dbTimer = setTimeout(flushDb, 800); return; }
  dbBusy = true;
  try {
    const days = [...dirtyDays]; dirtyDays.clear();
    for (const d of days) if (S.days[d]) await db.doc(`days/${d}`).set({ json: JSON.stringify(S.days[d]) });
    if (metaDirty) { metaDirty = false; const { days: _omit, ...meta } = S; await db.doc("meta/state").set({ savedAt: S.savedAt, json: JSON.stringify(meta) }); }
  } catch { /* read-only viewer or store offline: localStorage keeps it */ }
  dbBusy = false;
}
async function initDb() {
  try {
    const c = window.claude && (await window.claude.use("db")); if (!c) return;
    const meta = await c.doc("meta/state").get();
    if (meta.exists && (meta.data().savedAt || 0) > (S.savedAt || 0)) {
      const m = JSON.parse(meta.data().json), all = await c.collection("days").get();
      const days = {}; all.docs.forEach((doc) => { try { days[doc.id] = JSON.parse(doc.data().json); } catch {} });
      S = migrate({ ...m, days });
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
      db = c; renderAll();
    } else { db = c; Object.keys(S.days).forEach((d) => dirtyDays.add(d)); metaDirty = true; flushDb(); }
  } catch { db = null; }
}

/* ───────────── planning ───────────── */
const planInputs = (d) => { const i = day(d).inputs; return { ...i, admin: P.parseAdmin(i.adminText), fixed: P.parseFixed(i.fixedText) }; };
const hasTasks = (d) => tasksOf(d).some((t) => t.title) || day(d).inputs.adminText.trim() || day(d).inputs.fixedText.trim();
function refreshNudges(d) {
  const dd = day(d), blocks = blocksOf(d);
  const ai = dd.aiNudges.map((n) => { const b = n.block && blocks.find((x) => x.id === n.block); return b ? { ...n, at: b.start + (n.offset || 0) } : n; }).filter((n) => !n.block || blocks.some((x) => x.id === n.block) || n.at != null);
  const auto = C.nudgesFor(blocks).filter((a) => !ai.some((x) => Math.abs(x.at - a.at) < 25));
  dd.nudges = [...ai, ...auto].sort((a, b) => a.at - b.at);
}
/* Build or update a day's schedule. A hand-edited schedule is kept: new tasks slot into free time. */
function rebuild(d = cur, { from = null, fresh: forceFresh = false } = {}) {
  const dd = day(d), isToday = d === today(), inp = planInputs(d);
  const ids = new Set(tasksOf(d).filter((t) => t.title).map((t) => t.id));
  if (!hasTasks(d) && !dd.plan?.manual) { dd.plan = null; dd.nudges = []; return; }
  if (dd.plan?.manual && !forceFresh) {
    const moving = new Set(tasksOf(d).filter((t) => t.needsPlace).map((t) => t.id));
    const adminChanged = dd.plan.adminText !== inp.adminText;
    const keep = dd.plan.blocks.filter((b) => b.type !== "flex" && (!b.taskId || (ids.has(b.taskId) && !(moving.has(b.taskId) && !b.done))) && !(adminChanged && b.type === "admin"));
    const sched = {}; keep.forEach((b) => { if (b.taskId) sched[b.taskId] = (sched[b.taskId] || 0) + b.end - b.start; });
    const only = (arr) => arr.map((t) => (moving.has(t.id) ? t : { ...t, done: true }));
    const res = P.generatePlan({ ...inp, primary: only(inp.primary), secondary: only(inp.secondary), admin: adminChanged ? inp.admin : [] }, eff(), { fill: true, frozen: keep, doneMin: sched, from: isToday ? Math.ceil(nowMin() / 5) * 5 : 0 });
    dd.plan = { ...dd.plan, blocks: P.refillFlex(res.blocks, eff()), warnings: res.warnings, adminText: inp.adminText };
  } else {
    const started = dd.plan?.blocks.some((b) => b.done);
    const at = from ?? (isToday && dd.plan && (started || nowMin() > P.hm(S.settings.wake) + 20) ? nowMin() : null);
    // times Vi set herself survive every re-plan
    const locked = (dd.plan?.blocks || []).filter((b) => b.locked && (!b.taskId || ids.has(b.taskId)));
    const lockedMin = {}; locked.forEach((b) => { if (b.taskId) lockedMin[b.taskId] = (lockedMin[b.taskId] || 0) + b.end - b.start; });
    const res = at != null && dd.plan ? P.replan(inp, eff(), dd.plan.blocks, at) : P.generatePlan(inp, eff(), { frozen: locked.map((b) => ({ ...b })), doneMin: lockedMin });
    dd.plan = { blocks: res.blocks, warnings: res.warnings, stats: res.stats, manual: false, adminText: inp.adminText };
  }
  dd.plan.generatedAt = Date.now();
  tasksOf(d).forEach((t) => delete t.needsPlace);
  syncRoutineChecks(d);
  refreshNudges(d);
}
function commit(d = cur, { plan = true } = {}) { if (plan) rebuild(d); save(d); renderAll(); }
function editPlan(d, blocks, msg) {
  const dd = day(d);
  dd.plan = { ...(dd.plan || { warnings: [] }), blocks: P.refillFlex(blocks, eff()), manual: true, generatedAt: Date.now() };
  const late = blocks.filter((b) => b.type !== "flex" && b.end > P.hm(S.settings.sleep));
  dd.plan.warnings = late.length ? [`${late.map((b) => b.title).slice(0, 2).join(", ")} now run${late.length === 1 ? "s" : ""} past bedtime.`] : [];
  refreshNudges(d); save(d); renderAll();
  if (msg) toast(msg);
}
function dayProgress(d) {
  const ts = tasksOf(d).filter((t) => t.title);
  const done = ts.filter((t) => prog(t, d) >= 1).length;
  const w = (t) => (day(d).inputs.primary.includes(t) ? 2 : 1);
  const tot = ts.reduce((a, t) => a + w(t), 0);
  return { done, total: ts.length, pct: tot ? ts.reduce((a, t) => a + prog(t, d) * w(t), 0) / tot : 0 };
}

/* ───────────── habits (morning + night routines) ───────────── */
const routineSteps = (which) => (S.settings.routinesOn[which] ? (which === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine).map(([, t]) => t) : []);
const habit = (d, which) => ((S.habits[d] ||= {})[which] ||= {});
function habitPct(d, which) { const steps = routineSteps(which); if (!steps.length) return 0; const h = S.habits[d]?.[which] || {}; return steps.filter((t) => h[t]).length / steps.length; }
function streak(which) {
  let n = 0, d = today();
  if (habitPct(d, which) < 0.8) d = P.addDays(d, -1);
  while (habitPct(d, which) >= 0.8 && n < 400) { n++; d = P.addDays(d, -1); }
  return n;
}
function syncRoutineChecks(d) { // routine blocks mirror the habit log
  for (const b of blocksOf(d)) if (b.type === "routine") { const which = b.start < 12 * 60 ? "morning" : "evening"; b.done = !!S.habits[d]?.[which]?.[b.title]; }
}
function setHabit(d, which, title, val) {
  habit(d, which)[title] = val;
  syncRoutineChecks(d); save(d); renderAll();
  if (val && habitPct(d, which) >= 1) toast(`${which === "morning" ? "Morning" : "Night"} routine complete ✨ ${streak(which)}-day streak`);
}
function toggleHabitDay(d, which) {
  const all = habitPct(d, which) >= 1;
  routineSteps(which).forEach((t) => (habit(d, which)[t] = !all));
  syncRoutineChecks(d); save(d); renderAll();
}

/* ───────────── planting ───────────── */
const taskFrom = (s) => ({ id: C.newId(), title: s.title, min: s.min ?? s.minutes ?? 60, kind: s.kind || "auto", when: s.when || "any", tip: s.tip || "", doneWhen: s.doneWhen || "", done: false, seedId: s.seedId || null, needsPlace: true });
function placeInDay(d, seeds, preferSlot = null) {
  const inp = day(d).inputs, overflow = [];
  for (const s of seeds) {
    if (s.priority === "admin") { inp.adminText = (inp.adminText ? inp.adminText + "\n" : "") + `${s.title} (${Math.min(s.min, 30)})`; continue; }
    const wantWin = preferSlot != null ? preferSlot < 3 : s.priority === "win";
    const order = wantWin ? [...inp.primary, ...inp.secondary] : [...inp.secondary, ...inp.primary];
    let slot = preferSlot != null ? tasksOf(d)[preferSlot] : null;
    if (!slot || slot.title) slot = order.find((t) => !t.title);
    preferSlot = null;
    if (!slot) { overflow.push(s); continue; }
    Object.assign(slot, taskFrom(s), { id: slot.id });
  }
  return overflow;
}
async function plant(text, { slot = null } = {}) {
  text = text.trim(); if (!text) return;
  const scope = slot != null ? "today" : S.ui.scope, d = cur, wk = ensureWeek(d);
  const quick = C.parseSeedsHeuristic(text), ids = [], adminBefore = day(d).inputs.adminText;
  if (scope === "week") { quick.forEach((s) => { s.week = wk; S.pool.push(s); ids.push(s.id); }); save(); renderAll(); }
  else {
    const before = new Set(tasksOf(d).map((t) => t.title && t.id));
    const over = placeInDay(d, quick, slot);
    tasksOf(d).forEach((t) => { if (t.title && !before.has(t.id)) ids.push(t.id); });
    over.forEach((s) => { s.week = wk; S.pool.push(s); });
    commit(d);
    if (over.length) toast(`The greenhouse is full, so ${over.length} went to this week's seed tray.`);
  }
  if (!aiOn) { toast(scope === "week" ? `Planted ${quick.length} seed${quick.length > 1 ? "s" : ""} for this week.` : "Sprouted 🌱"); return; }
  thinking(+1);
  try {
    const existing = tasksOf(d).filter((t) => t.title && !ids.includes(t.id)).map((t) => t.title);
    const { tasks, ai } = await C.seedsFromText(text, { existing });
    if (!ai) return;
    if (scope === "week") {
      S.pool = S.pool.filter((s) => !ids.includes(s.id)); tasks.forEach((s) => { s.week = wk; S.pool.push(s); });
      save(); renderAll(); toast(`Planted ${tasks.length} seed${tasks.length > 1 ? "s" : ""}. Plan the week to spread them out.`);
    } else if (tasks.length === ids.length && !tasks.some((t) => t.priority === "admin")) {
      const all = tasksOf(d);
      ids.forEach((id, k) => { const t = all.find((x) => x.id === id); if (t) Object.assign(t, taskFrom(tasks[k]), { id }); });
      commit(d); toast("Sprouted, with a tip from Claude 🌱");
    } else {
      tasksOf(d).forEach((t) => { if (ids.includes(t.id)) Object.assign(t, blankTask(t.id)); });
      day(d).inputs.adminText = adminBefore;
      placeInDay(d, tasks, slot).forEach((s) => { s.week = wk; S.pool.push(s); });
      commit(d); toast(`Sprouted ${tasks.length} tasks 🌱`);
    }
  } catch (e) { toast(e.message); } finally { thinking(-1); }
}

/* ───────────── task actions ───────────── */
const pickCheer = (t) => `🌻 “${t.title}” bloomed. ${C.cheer(t.id)}`;
function setDone(t, val) {
  const before = prog(t);
  t.done = val;
  blocksOf().filter((b) => b.taskId === t.id).forEach((b) => (b.done = val));
  if (t.seedId) { const s = S.pool.find((x) => x.id === t.seedId); if (s) s.done = Object.values(S.days).flatMap((dd) => [...dd.inputs.primary, ...dd.inputs.secondary]).filter((x) => x.seedId === s.id).every((x) => x.done); }
  save(cur); renderAll();
  if (val && before < 1) { scene.burst(tasksOf().indexOf(t)); toast(pickCheer(t)); }
}
function toggleBlock(id) {
  const b = blocksOf().find((x) => x.id === id); if (!b) return;
  if (b.type === "routine") return setHabit(cur, b.start < 12 * 60 ? "morning" : "evening", b.title, !b.done);
  const t = tasksOf().find((x) => x.id === b.taskId), before = t ? prog(t) : 0;
  b.done = !b.done; if (t && !b.done) t.done = false;
  save(cur); renderAll();
  if (t && before < 1 && prog(t) >= 1) { scene.burst(tasksOf().indexOf(t)); toast(pickCheer(t)); }
}
function removeTask(t) { Object.assign(t, blankTask(t.id)); openRow = null; selected = -1; commit(); }
function swapTier(t) {
  const inp = day().inputs, inPrim = inp.primary.includes(t), other = inPrim ? inp.secondary : inp.primary;
  const slot = other.find((x) => !x.title) || other[other.length - 1];
  const a = { ...t }, b = { ...slot };
  Object.assign(slot, a); Object.assign(t, b);
  openRow = slot.id; reprioritised();
}
function moveTask(tier, i, j) {
  const arr = day().inputs[tier];
  if (j < 0 || j >= arr.length || i === j) return;
  const [t] = arr.splice(i, 1); arr.splice(j, 0, t);
  reprioritised();
}
function reprioritised() {
  const dd = day();
  if (dd.plan?.manual) { save(cur); renderAll(); toast("Priorities saved. Your schedule was hand-edited, so it stays as is. Use “Re-plan by priority” to reorder it."); }
  else commit();
}

/* ───────────── AI + coach actions ───────────── */
function thinking(dx) { busy = Math.max(0, busy + dx); scene.setThinking(busy > 0); document.body.classList.toggle("thinking", busy > 0); }
const tierOf = (d, t) => (day(d).inputs.primary.includes(t) ? "primary" : "secondary");

async function planMyDay(form) {
  const d = cur, dd = day(d), inp = dd.inputs;
  inp.locations = { morning: form.pm.value, afternoon: form.pa.value, evening: form.pe.value };
  inp.fixedText = form.pfixed.value; inp.notes = form.pnotes.value.trim();
  inp.energy = $("[name=penergy]:checked", form)?.value || inp.energy;
  S.placeMemory[P.parseISO(d).getDay()] = inp.locations;
  if (!tasksOf(d).some((t) => t.title)) { toast("Plant at least one task first."); return; }
  const btn = form.go, status = $("#dayStatus");
  btn.disabled = true; status.textContent = aiOn ? "Building your day, then asking Claude for tips and reminders…" : "Building your day…";
  thinking(+1);
  try {
    tasksOf(d).forEach((t) => delete t.needsPlace);
    dd.plan = dd.plan ? { ...dd.plan, manual: false } : null;
    rebuild(d, { fresh: true, from: d === today() && nowMin() > P.hm(S.settings.wake) + 20 ? nowMin() : null });
    if (!dd.plan) return;
    const out = await C.planDay({ date: d, locations: inp.locations, energy: inp.energy, notes: inp.notes, wake: S.settings.wake, sleep: S.settings.sleep, blocks: blocksOf(d), tasks: tasksOf(d).filter((t) => t.title).map((t) => ({ ...t, tier: tierOf(d, t) })) });
    dd.ai = { theme: out.theme, description: out.description, tip: out.tip };
    for (const x of out.taskTips || []) { const t = tasksOf(d).find((t) => t.id === x.id); if (t) { if (x.tip) t.tip = x.tip; if (x.doneWhen) t.doneWhen = x.doneWhen; } }
    for (const b of blocksOf(d)) { const t = b.taskId && tasksOf(d).find((t) => t.id === b.taskId); if (t && b.tip !== null && t.tip) b.tip = t.tip; }
    const changed = (out.changes?.length || out.add?.length) ? C.applyChanges(blocksOf(d), out) : null;
    if (changed) { dd.plan.blocks = P.refillFlex(changed, eff()); dd.plan.manual = true; }
    dd.aiNudges = (out.reminders || []).map((r) => { const b = r.block && blocksOf(d).find((x) => x.id === r.block); return { id: `ai-${r.at}-${Math.random().toString(36).slice(2, 5)}`, at: r.at, text: r.text, block: b ? b.id : null, offset: b ? r.at - b.start : 0, src: "ai" }; });
    refreshNudges(d); save(d); renderAll();
    $("#dayDialog").close();
    toast(out.ai ? "Your day is planned ✨" : out.error ? out.error : "Your day is planned 🌻", 4500);
  } finally { thinking(-1); btn.disabled = false; }
}

async function checkIn() {
  const box = $("#checkinText"), text = box.value.trim(); if (!text) return box.focus();
  const d = cur, dd = day(d);
  if (!dd.plan) { toast("Plan the day first, then check in."); return; }
  thinking(+1); $("#checkinGo").disabled = true;
  try {
    const res = await C.checkin(text, { now: d === today() ? nowMin() : P.hm(S.settings.wake), blocks: blocksOf(d), locations: dd.inputs.locations, energy: dd.inputs.energy, sleep: S.settings.sleep });
    dd.checkinReply = { text: res.reply, tip: res.tip || "", at: Date.now() };
    if (res.blocks) { box.value = ""; editPlan(d, res.blocks); } else { save(d); renderDay(); }
  } finally { thinking(-1); const b = $("#checkinGo"); if (b) b.disabled = false; }
}

let weekCtl = null;
function weekTarget() { return $("#weekForm")?.dataset.week || defaultPlanWeek(); }
const defaultPlanWeek = () => (isSat(today()) ? P.addDays(P.weekStart(today()), 7) : P.weekStart(cur));
async function growWeek(form) {
  const k = form.dataset.week, t0 = today();
  ensureWeek(k);
  const dates = P.weekDates(k).filter((d) => d >= t0);
  const keep = form.keep.checked;
  const plan = dates.filter((d) => !(keep && (blocksOf(d).some((b) => b.done) || (d === t0 && hasTasks(d)))));
  if (!plan.length) { toast("Every remaining day is already planted. Untick “keep” to re-plan them."); return; }
  const days = plan.map((d) => {
    const loc = { morning: form[`m-${d}`].value, afternoon: form[`a-${d}`].value, evening: form[`e-${d}`].value };
    S.placeMemory[P.parseISO(d).getDay()] = loc;
    return { date: d, locations: loc, fixed: form[`f-${d}`].value.trim() };
  });
  const chosen = $$("input[name=seed]:checked", form).map((x) => x.value);
  const seeds = S.pool.filter((s) => chosen.includes(s.id)).map((s) => ({ ...s }));
  $$("input[name=carry]:checked", form).forEach((x) => { const [d, id] = x.value.split("|"); const t = tasksOf(d).find((t) => t.id === id); if (t) seeds.push({ id: C.newId(), title: t.title, min: Math.max(15, Math.round(t.min * (1 - prog(t, d)) / 5) * 5), kind: t.kind === "auto" ? P.inferKind(t.title) : t.kind, priority: "win", when: t.when, tip: t.tip, doneWhen: t.doneWhen }); });
  const extra = form.more.value.trim();
  if (extra) { const add = C.parseSeedsHeuristic(extra); add.forEach((s) => { s.week = k; S.pool.push(s); }); seeds.push(...add); }
  const theme = form.theme.value.trim().split(/\s+/)[0] || "";
  if (!seeds.length) { toast("Add a few seeds first: what do you want to get done?"); return; }
  const btn = form.go, status = $("#weekStatus");
  btn.disabled = true; form.stop.hidden = !aiOn; status.textContent = aiOn ? "Claude is reading your week…" : "Planting…";
  thinking(+1); weekCtl = new AbortController();
  try {
    const res = await C.planWeek({ days, seeds, settings: eff(), theme }, { signal: weekCtl.signal, onText: ({ text }) => { status.textContent = `Claude is writing your week… ${Math.min(99, Math.round(text.length / 45))}%`; } });
    if (res.cancelled) { status.textContent = "Stopped. Nothing changed."; return; }
    const w = S.weeks[k];
    w.theme = theme || w.theme || res.weekTheme || ""; w.note = res.weekNote || w.note;
    applyWeek(k, res, days, seeds);
    $("#weekDialog").close();
    goDay(plan[0]);
    toast(w.notion.state === "none" ? "Week planted in the garden. Review it, then confirm to send it to Notion." : res.ai ? "Your week is planted ✨" : "Your week is planted 🌻", 6000);
  } finally { thinking(-1); btn.disabled = false; form.stop.hidden = true; weekCtl = null; }
}
function applyWeek(k, res, days, seeds) {
  const seedIds = new Set(seeds.map((s) => s.id));
  for (const din of days) {
    const r = res.days.find((x) => x.date === din.date) || { primary: [], secondary: [], admin: [] };
    const dd = day(din.date);
    dd.inputs.locations = din.locations; dd.inputs.fixedText = din.fixed;
    const fill = (arr, list) => arr.forEach((t, i) => Object.assign(t, list[i] ? taskFrom({ ...list[i], seedId: seedIds.has(list[i].seedId) ? list[i].seedId : null }) : blankTask(t.id), { id: list[i] ? C.newId() : t.id }));
    fill(dd.inputs.primary, r.primary); fill(dd.inputs.secondary, r.secondary);
    dd.inputs.adminText = (r.admin || []).map((a) => `${a.title} (${a.minutes})`).join("\n");
    dd.ai = r.theme || r.description ? { theme: r.theme, description: r.description, tip: r.tip } : null;
    dd.aiNudges = [];
    if (dd.plan) dd.plan.manual = false;
    rebuild(din.date, { fresh: true, from: din.date === today() && nowMin() > P.hm(S.settings.wake) + 20 ? nowMin() : null });
    save(din.date);
  }
  S.pool.forEach((s) => { if (seedIds.has(s.id)) s.scheduled = res.days.filter((d) => [...d.primary, ...d.secondary].some((t) => t.seedId === s.id) || (d.admin || []).some((a) => a.title === s.title)).map((d) => d.date); });
  if (S.weeks[k].notion.state === "none") S.weeks[k].notion.state = "draft";
  save(); renderAll();
}

/* ───────────── Notion ───────────── */
function weekLines(k) { const out = {}; for (const d of P.weekDates(k)) out[d] = S.days[d]?.plan ? N.dayLines(blocksOf(d)) : undefined; return out; }
const weekHash = (k) => JSON.stringify([weekTitle(k), weekLines(k)]);
let notionTimer = null, notionBusy = false;
function queueNotion(k) {
  const w = S.weeks[k]; if (!w || w.notion.state !== "confirmed" || !notionOn) return;
  if (w.notion.hash === weekHash(k)) return;
  clearTimeout(notionTimer); notionTimer = setTimeout(() => sendWeek(k, { auto: true }), 15000);
}
async function sendWeek(k, { auto = false } = {}) {
  const w = S.weeks[k];
  if (notionBusy) { clearTimeout(notionTimer); notionTimer = setTimeout(() => sendWeek(k, { auto }), 4000); return; }
  if (!notionOn) { if (!IN_ARTIFACT) return syncServer(k); toast("Notion isn't available here. Use “Copy for Notion” instead."); return; }
  const prev = P.addDays(k, -7);
  const payload = { title: weekTitle(k), matchTitle: w.notion.title, dates: P.weekDates(k), linesByDate: weekLines(k), anchorTitle: S.weeks[prev]?.notion?.title };
  notionBusy = true; w.notion.busy = true; renderNotion();
  try {
    const res = await N.syncWeek(payload);
    w.notion = { ...w.notion, title: payload.title, state: "confirmed", hash: weekHash(k), at: Date.now(), error: null };
    if (!auto) toast(res.kind === "insert" ? `Created ${payload.title} on your Starmap page ✓` : res.kind === "same" ? "Notion was already up to date ✓" : `Updated ${payload.title} in Notion ✓`);
    delete notionLive[k];
  } catch (e) {
    w.notion.error = N.errorCopy(e);
    if (!auto) toast(w.notion.error, 7000);
  } finally { notionBusy = false; w.notion.busy = false; save(); renderNotion(); renderWeek(); }
}
async function peekNotion(k) {
  const w = S.weeks[k];
  try { const md = await N.fetchPage(); notionLive[k] = { days: N.readWeek(md, w.notion.title || weekTitle(k)), at: Date.now() }; }
  catch (e) { notionLive[k] = { error: N.errorCopy(e), at: Date.now() }; }
  renderNotion();
}
function notionText(k) {
  const out = [`${weekTitle(k)}`, ""];
  for (const d of P.weekDates(k)) { out.push(`${N.DAY_NAMES[P.parseISO(d).getDay()]} ${N.dayTag(d)}`); for (const l of N.dayLines(blocksOf(d))) out.push(`  [${l.checked ? "x" : " "}] ${l.text.replace(/\\/g, "")}`); out.push(""); }
  return out.join("\n");
}
async function copyNotion(k) {
  const text = notionText(k);
  try { await navigator.clipboard.writeText(text); toast("Copied in your Notion format."); }
  catch { $("#copyBody").textContent = text; $("#copyDialog").showModal(); }
}
async function syncServer(k) {
  try {
    const s = await fetch("/api/status").then((r) => r.json());
    if (!s.connected) return toast("The local server has no NOTION_TOKEN, so nothing was written.");
    const days = P.weekDates(k).filter((d) => S.days[d]?.plan).map((d) => ({ date: d, headline: null, lines: N.dayLines(blocksOf(d)).map((l) => ({ ...l, text: l.text.replace(/\\/g, "") })) }));
    const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week: { key: k, label: S.weeks[k].theme, match: S.weeks[k].notion.title?.replace("ЩΣΣK ", ""), dates: P.weekDates(k) }, knownWeekKeys: Object.keys(S.weeks), days }) }).then((r) => r.json());
    if (res.error) throw new Error(res.error);
    toast(`Synced ${days.length} day(s) to Notion ✓`);
  } catch (e) { toast("Notion sync failed: " + e.message, 6000); }
}

/* ───────────── nudges (reminders) ───────────── */
let nudgeQueue = [];
function checkNudges() {
  const d = today();
  if (!S.days[d]?.plan) return;
  const dd = day(d), now = nowMin();
  for (const n of dd.nudges) if (n.at <= now && n.at > now - 30 && !dd.shown.includes(n.id)) { dd.shown.push(n.id); nudgeQueue.push(n); save(); }
  if (nudgeQueue.length && $("#nudge").hidden) showNudge(nudgeQueue.shift());
}
function showNudge(n) {
  const el = $("#nudge");
  el.innerHTML = `<span class="nt">${P.pretty(n.at)}</span><p>${esc(n.text)}</p><button class="gold" id="nudgeOk">Got it</button>`;
  el.hidden = false; scene.setThinking(true); setTimeout(() => scene.setThinking(busy > 0), 2500);
}

/* ───────────── rendering ───────────── */
function toast(msg, ms = 3600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t); setTimeout(() => t.classList.add("out"), ms - 300); setTimeout(() => t.remove(), ms);
}
const placeChip = (d, seg) => { const k = day(d).inputs.locations[seg], l = SEG.find((s) => s[0] === seg)[1]; return `<button class="place" data-cycle="${seg}" title="${l}: tap to change"><small>${l}</small><span>${PLACE(k).icon} ${PLACE(k).label}</span></button>`; };
const whenChip = (w) => (w && w !== "any" ? `<span class="when">${C.WHEN_ICON[w]} ${C.WHEN[w].toLowerCase()}</span>` : "");

function renderHeader() {
  const k = ensureWeek(cur), t0 = today();
  $("#weekStrip").innerHTML = P.weekDates(k).map((d) => {
    const dd = S.days[d], wins = dd ? dd.inputs.primary.filter((t) => t.title) : [];
    const dots = [0, 1, 2].map((i) => { const t = wins[i]; const p = t ? P.taskProgress(t, dd.plan?.blocks || []) : -1; return `<i class="${p >= 1 ? "on" : p > 0 ? "half" : p === 0 ? "set" : ""}"></i>`; }).join("");
    return `<button class="daychip${d === cur ? " on" : ""}${d === t0 ? " today" : ""}${d < t0 ? " past" : ""}" data-day="${d}" aria-label="${P.DOW[P.parseISO(d).getDay()]} ${P.shortDate(d)}">
      <span class="dw">${DOW3(d)}</span><b>${P.parseISO(d).getDate()}</b><span class="pl">${dd ? PLACE(dd.inputs.locations.morning).icon : "&nbsp;"}</span><span class="dots">${dots}</span></button>`;
  }).join("");
  $("#aiBadge").textContent = aiOn ? "✨ Claude on" : "Built-in planner";
  $("#aiBadge").className = "badge " + (aiOn ? "ai" : "");
}

function renderDay() {
  const d = cur, dd = day(d), inp = dd.inputs, isToday = d === today(), now = nowMin();
  const blocks = blocksOf(d), pr = dayProgress(d);
  const slotLine = (t) => { const bl = blocks.filter((b) => b.taskId === t.id); return bl.length ? bl.map((b) => P.pretty(b.start)).join(" · ") : dd.plan ? "not scheduled" : ""; };
  const row = (t, i, tier) => {
    const p = prog(t), isOpen = openRow === t.id && t.title, gi = tier === "primary" ? i : i + 3, n = day(d).inputs[tier].length;
    if (!t.title) return `<li class="task empty"><button class="plantbtn" data-plant-slot="${gi}">+ ${tier === "primary" ? "Plant a win" : "Plant a task"}</button></li>`;
    return `<li class="task${p >= 1 ? " done" : ""}${selected === gi ? " sel" : ""}${isOpen ? " open" : ""}" data-task="${t.id}" draggable="true" data-drag="task" data-tier="${tier}" data-i="${i}">
      <span class="prio" aria-hidden="true">${i + 1}</span>
      <button class="bloom" data-bloom="${t.id}" aria-label="${p >= 1 ? "Mark not done" : "Mark done"}" style="--p:${Math.round(p * 100)}"><i></i></button>
      <button class="tmain" data-row="${t.id}" data-idx="${gi}"><span class="tt">${esc(t.title)}</span><span class="tm">${P.dur(t.min)} ${whenChip(t.when)}${slotLine(t) ? ` · ${slotLine(t)}` : ""}</span></button>
      <span class="updown"><button data-tmove="${tier}|${i}|-1" aria-label="Higher priority" ${i === 0 ? "disabled" : ""}>▲</button><button data-tmove="${tier}|${i}|1" aria-label="Lower priority" ${i === n - 1 || !day(d).inputs[tier][i + 1]?.title ? "disabled" : ""}>▼</button></span>
      ${isOpen ? `<div class="tedit">
        ${t.tip ? `<p class="tip">💡 ${esc(t.tip)}</p>` : ""}
        <label class="wide">Task<input data-f="title" data-id="${t.id}" value="${esc(t.title)}"></label>
        <div class="grid3"><label>Minutes<input type="number" min="10" max="480" step="5" data-f="min" data-id="${t.id}" value="${t.min}"></label>
        <label>Best time<select data-f="when" data-id="${t.id}">${Object.entries(C.WHEN).map(([k, v]) => `<option value="${k}" ${t.when === k ? "selected" : ""}>${C.WHEN_ICON[k] ? C.WHEN_ICON[k] + " " : ""}${v}</option>`).join("")}</select></label>
        <label>Done when<input data-f="doneWhen" data-id="${t.id}" value="${esc(t.doneWhen)}" placeholder="optional"></label></div>
        <div class="acts"><button data-swap="${t.id}">${tier === "primary" ? "Move to “also”" : "Make it a win"}</button><button class="danger" data-remove="${t.id}">Remove</button></div>
      </div>` : ""}
    </li>`;
  };

  // schedule items with reminders woven in
  const all = P.itemsOf(blocks);
  const tipsFor = (it) => (dd.nudges || []).filter((n) => (n.block && it.blocks.some((b) => b.id === n.block)) || (!n.block && n.at >= it.start - 10 && n.at < it.end));
  let nowPlaced = !isToday;
  const sched = all.map((it, idx) => {
    let pre = "";
    if (!nowPlaced && it.end > now) { nowPlaced = true; pre += `<li class="now" aria-label="Now"><span>${P.pretty(now)}</span></li>`; }
    const first = it.blocks[0], isRoutine = it.kind === "routine", open = openItem === it.key;
    const done = it.blocks.every((b) => b.done), live = isToday && it.start <= now && now < it.end;
    const late = it.end > P.hm(S.settings.sleep);
    let title, meta, body;
    if (isRoutine) {
      const n = it.blocks.filter((b) => b.done).length;
      title = it.start < 12 * 60 ? "Morning routine" : "Night routine";
      meta = `${n}/${it.blocks.length} · ${P.dur(it.end - it.start)}`;
      body = `<ul class="steps">${it.blocks.map((x) => `<li><label><input type="checkbox" data-chk="${x.id}" ${x.done ? "checked" : ""}><span>${esc(x.title)}</span><em>${P.pretty(x.start)}</em></label></li>`).join("")}</ul>`;
    } else {
      const task = first.type === "primary" || first.type === "secondary";
      title = `${first.type === "primary" ? "★ " : ""}${esc(first.title)}${first.chunk ? ` <small>${first.chunk}</small>` : ""}`;
      meta = `${P.dur(first.end - first.start)} · ${PLACE(first.loc).icon}${it.blocks.length > 1 ? " + break" : ""}`;
      body = `${first.tip ? `<p class="tip">💡 ${esc(first.tip)}</p>` : ""}<p>${esc(first.desc || "").replace(/\n/g, "<br>")}</p>${task || first.type === "admin" || first.type === "fixed" ? `<label class="mini"><input type="checkbox" data-chk="${first.id}" ${first.done ? "checked" : ""}> Done</label>` : ""}`;
    }
    const isLocked = it.blocks.some((b) => b.locked);
    const reminders = tipsFor(it).map((n) => `<p class="tip">⏰ ${P.pretty(n.at)} · ${esc(n.text)}</p>`).join("");
    body = reminders + body;
    meta = `${isLocked ? "🔒 your time · " : ""}${meta}`;
    const editor = `<div class="iedit"><label>Start<input type="time" data-istart="${it.key}" value="${P.clock(it.start)}"></label>${it.blocks.length === 1 ? `<label>End<input type="time" data-iend="${it.key}" value="${P.clock(it.end)}"></label>` : ""}
      <span class="updown"><button data-imove="${it.key}|-1" aria-label="Move earlier" ${idx === 0 ? "disabled" : ""}>▲</button><button data-imove="${it.key}|1" aria-label="Move later" ${idx === all.length - 1 ? "disabled" : ""}>▼</button></span>
      ${isLocked ? `<button data-iunlock="${it.key}">Unlock time</button>` : ""}<button class="danger" data-iremove="${it.key}">Remove</button></div>`;
    return `${pre}<li class="blk t-${isRoutine ? "routine" : first.type}${done ? " done" : ""}${live ? " live" : ""}${late ? " late" : ""}${open ? " open" : ""}" draggable="true" data-drag="item" data-key="${it.key}">
      <button class="bhead" data-item="${it.key}" aria-expanded="${open}"><span class="bt">${P.pretty(it.start)}<em>${P.pretty(it.end)}</em></span><span class="bn">${title}<em>${meta}</em></span><span class="grip" aria-hidden="true">⋮⋮</span></button>
      ${open ? `<div class="bd">${body}${editor}</div>` : ""}</li>`;
  }).join("");

  const note = dd.ai;
  const next = isToday ? (dd.nudges || []).find((n) => n.at > now) : null;
  $("#dayPanel").innerHTML = `
    <header class="dhead"><div><small>${isToday ? "Today" : d < today() ? "Past day" : "Upcoming"}${isSat(d) ? " · reset day" : ""}</small><h2>${P.DOW[P.parseISO(d).getDay()]} <span>${P.shortDate(d)}</span></h2></div>
      <div class="ring" style="--p:${Math.round(pr.pct * 100)}" title="${pr.done}/${pr.total} bloomed"><span>${pr.done}/${pr.total || 6}</span></div></header>
    <div class="places">${SEG.map(([s]) => placeChip(d, s)).join("")}</div>
    ${note ? `<section class="coach"><h3>${esc(note.theme || "")}</h3><p>${esc(note.description || "")}</p>${note.tip ? `<p class="tip">💡 ${esc(note.tip)}</p>` : ""}</section>` : ""}
    ${next ? `<p class="upnext">Next reminder <b>${P.pretty(next.at)}</b> · ${esc(next.text)}</p>` : ""}
    <section><h4>Win the day <small>in priority order</small></h4><ul class="tasks" data-tier="primary">${inp.primary.map((t, i) => row(t, i, "primary")).join("")}</ul>
      <h4>Also</h4><ul class="tasks" data-tier="secondary">${inp.secondary.map((t, i) => row(t, i, "secondary")).join("")}</ul></section>
    <button class="gold wide planday" id="openDay">✨ Plan my day</button>
    <details class="more"><summary>Small admin &amp; fixed plans</summary>
      <label class="wide">Small admin <small>one per line, (minutes) optional</small><textarea id="adminText" rows="3" placeholder="Reply to Ms Seah (10)&#10;Pay ISC fee (5)">${esc(inp.adminText)}</textarea></label>
      <label class="wide">Fixed plans <small>HH:MM-HH:MM what @place</small><textarea id="fixedText" rows="2" placeholder="14:00-15:30 Physics lesson @school">${esc(inp.fixedText)}</textarea></label></details>
    ${dd.plan ? `<section class="sched"><div class="shead"><h4>Schedule ${dd.plan.manual ? `<small class="edited">hand-edited</small>` : ""}</h4>
        <span class="sacts">${dd.plan.manual ? `<button class="linkbtn" id="replanPriority">Re-plan by priority</button>` : ""}</span></div>
      <p class="hintline small">Drag items, or open one to change its times. Later items move forward automatically.</p>
      ${(dd.plan.warnings || []).map((w) => `<p class="warn">${esc(w)}</p>`).join("")}
      <ol class="timeline">${sched}</ol>
      <details class="addevent"><summary>Add to schedule</summary><form id="addEvent" class="grid3"><label class="span2">What<input name="t" required placeholder="Call with mentor"></label><label>Start<input type="time" name="s" required></label><label>End<input type="time" name="e" required></label><button class="gold" type="submit">Add</button></form></details></section>
      <section class="checkin"><h4>Check in</h4>
        <div class="seg" role="radiogroup" aria-label="Energy">${["low", "ok", "high"].map((k) => `<button role="radio" aria-checked="${inp.energy === k}" data-energy="${k}">${{ low: "Low energy", ok: "Okay", high: "Buzzing" }[k]}</button>`).join("")}</div>
        <textarea id="checkinText" rows="2" placeholder="Tell me what changed: “woke up late, start from 8:30”, “move ESAT paper to 3pm”, “skip gym”, “add dentist at 4 for 45 min”"></textarea>
        <div class="acts"><button class="gold" id="checkinGo">Update my day</button><button id="replanNow">${isToday ? "Re-plan from now" : "Rebuild day"}</button></div>
        ${dd.checkinReply ? `<div class="reply"><p>${esc(dd.checkinReply.text)}</p>${dd.checkinReply.tip ? `<p class="tip">💡 ${esc(dd.checkinReply.tip)}</p>` : ""}</div>` : ""}
        <label class="wide">Reflection<textarea id="reflection" rows="2" placeholder="What worked today? What carries over?">${esc(inp.reflection)}</textarea></label></section>`
      : `<p class="hintline">Plant a task below and your day grows itself around your routines, in priority order.</p>`}`;
}

function renderWeek() {
  const k = ensureWeek(cur), w = S.weeks[k], t0 = today();
  const seeds = S.pool.filter((s) => s.week === k && !s.done);
  const ns = w.notion.state;
  const chip = ns === "confirmed" ? `<span class="nchip ok">In Notion ✓</span>` : ns === "linked" ? `<span class="nchip link">Linked to Notion</span>` : ns === "draft" ? `<span class="nchip draft">Draft</span>` : `<span class="nchip">Not in Notion</span>`;
  const satBanner = isSat(t0) && P.weekStart(t0) === k ? `<button class="reset" id="resetDay"><b>✨ Saturday reset</b><span>Plan next week in the garden, then send it to Notion.</span></button>` : "";
  const hrow = (which, label, icon) => `<div class="hrow"><span class="hl">${icon} ${label}</span>${P.weekDates(k).map((d) => { const p = habitPct(d, which), fut = d > t0; return `<button class="hcell${d === t0 ? " today" : ""}" ${fut ? "disabled" : ""} data-habit="${d}|${which}" style="--p:${Math.round(p * 100)}" aria-label="${label} ${P.shortDate(d)}: ${Math.round(p * 100)}%"><i></i></button>`; }).join("")}<span class="hs">${streak(which) ? `🔥${streak(which)}` : ""}</span></div>`;
  $("#weekPanel").innerHTML = `
    <header class="whead"><button id="prevWeek" aria-label="Previous week">‹</button><div><small>${P.shortDate(k)} – ${P.shortDate(P.addDays(k, 6))}</small><h2>ЩΣΣK ${esc(w.theme || "of " + P.shortDate(k))}</h2></div><button id="nextWeek" aria-label="Next week">›</button></header>
    <div class="wmeta"><label class="themeword"><span>Theme</span><input id="themeWord" value="${esc(w.theme || "")}" placeholder="one word" maxlength="24"></label>${chip}</div>
    ${satBanner}
    ${w.note ? `<p class="wnote">${esc(w.note)}</p>` : ""}
    <ol class="wdays">${P.weekDates(k).map((d) => {
      const dd = S.days[d], wins = dd ? dd.inputs.primary.filter((t) => t.title) : [];
      return `<li><button class="wday${d === cur ? " on" : ""}${d === t0 ? " today" : ""}${d < t0 ? " past" : ""}" data-day="${d}">
        <span class="wd"><b>${DOW3(d)}</b> ${P.parseISO(d).getDate()}</span>
        <span class="wbody"><span class="wt">${esc(dd?.ai?.theme || (wins.length ? wins.map((t) => t.title).join(", ") : d < t0 ? "" : isSat(d) ? "Reset day" : "Open"))}</span>
        ${dd ? `<span class="wp">${SEG.map(([s]) => PLACE(dd.inputs.locations[s]).icon).join("")}</span>` : ""}</span></button></li>`;
    }).join("")}</ol>
    <section class="habits"><h4>Rituals <small>tap a day to tick the whole routine</small></h4>
      <div class="hrow head"><span class="hl"></span>${P.weekDates(k).map((d) => `<span>${DOW3(d)[0]}</span>`).join("")}<span></span></div>
      ${S.settings.routinesOn.morning ? hrow("morning", "Morning", "☀") : ""}${S.settings.routinesOn.evening ? hrow("evening", "Night", "☾") : ""}
      ${!S.settings.routinesOn.morning && !S.settings.routinesOn.evening ? `<p class="hintline small">Turn routines on in Routines to track them.</p>` : ""}</section>
    <section class="tray"><h4>Seed tray <small>${seeds.length ? `${seeds.length} for this week` : "empty"}</small></h4>
      ${seeds.length ? `<ul class="seeds">${seeds.map((s) => `<li><button class="seedchip" data-seed="${s.id}" title="Plant into ${P.DOW[P.parseISO(cur).getDay()]}">${esc(s.title)} <em>${P.dur(s.min)}${s.scheduled?.length ? ` · ${s.scheduled.map((x) => DOW3(x).slice(0, 2)).join(" ")}` : ""}</em></button><button class="x" data-unseed="${s.id}" aria-label="Remove ${esc(s.title)}">✕</button></li>`).join("")}</ul>` : `<p class="hintline small">Switch the planter to “This week” and brain-dump everything you want done.</p>`}</section>
    <div class="wacts"><button class="gold" id="openWeek">✨ Plan ${isSat(t0) ? "next" : "my"} week</button>${ns === "draft" || ns === "none" || ns === "linked" ? `<button id="confirmWeek">${ns === "linked" ? "Sync to Notion" : "Confirm → Notion"}</button>` : `<button id="copyNotion">Copy</button>`}</div>`;
}

function renderNotion() {
  const el = $("#notionCard"), k = P.weekStart(cur), w = S.weeks[k] || { notion: { state: "none" } };
  if (!S.ui.notionOpen) { el.classList.add("min"); el.innerHTML = `<button class="npill" id="notionToggle">N <span>Notion preview</span></button>`; return; }
  el.classList.remove("min");
  const live = notionLive[k];
  const lines = (d) => (live?.days ? live.days[P.shortDate(d)] || [] : S.days[d]?.plan ? N.dayLines(blocksOf(d)).map((l) => ({ ...l, text: l.text.replace(/\\/g, "") })) : null);
  const status = w.notion.busy ? "Sending to Notion…" : w.notion.error ? `⚠ ${w.notion.error}` : w.notion.state === "confirmed" ? (w.notion.hash === weekHash(k) ? `Synced ${w.notion.at ? ago(w.notion.at) : ""} ✓` : "Changes will sync in a moment…") : w.notion.state === "linked" ? "Linked: sync once to take over this week" : w.notion.state === "draft" ? "Draft: confirm to create it in Notion" : "Not in Notion yet";
  el.innerHTML = `<header><span class="nlogo">N</span><div><b>✮ Vi's Starmap 2026 ✮</b><small>${live?.days ? `Live from Notion · ${ago(live.at)}` : "Preview of what's sent"}</small></div><button class="x" id="notionToggle" aria-label="Minimise">–</button></header>
    <div class="npage">
      <p class="ntoggle open">▾ <span class="hlite">${esc(w.notion.title || weekTitle(k))}</span></p>
      ${P.weekDates(k).map((d) => { const ls = lines(d), open = d === cur; return `<div class="nday"><p class="ntoggle${open ? " open" : ""}"><span class="tri">${open ? "▾" : "▸"}</span> ${N.DAY_NAMES[P.parseISO(d).getDay()]} <code>${N.dayTag(d)}</code>${!open && ls?.length ? `<em>${ls.length}</em>` : ""}</p>${open ? (!ls ? `<p class="nempty">${w.notion.state === "none" || w.notion.state === "draft" ? "No tasks yet" : "Not planned here: Notion keeps its own lines"}</p>` : ls.length ? `<ul>${ls.map((l) => `<li class="${l.checked ? "ck" : ""}"><i></i>${esc(l.text)}</li>`).join("")}</ul>` : `<p class="nempty">No tasks yet</p>`) : ""}</div>`; }).join("")}
    </div>
    <p class="nstatus${w.notion.error ? " err" : ""}">${esc(status)}</p>
    <div class="nacts"><a href="${N.PAGE_URL}" target="_blank" rel="noopener">Open in Notion ↗</a>${notionOn && w.notion.title && w.notion.state !== "none" ? `<button id="peekNotion">Check Notion</button>` : ""}${w.notion.state === "confirmed" ? `<button id="syncNow">${w.notion.error ? "Retry" : "Sync now"}</button>` : ""}</div>`;
}

function renderFocus() {
  const el = $("#focusCard"), t = selected >= 0 ? tasksOf()[selected] : null;
  if (!t || !t.title) { el.hidden = true; return; }
  const p = prog(t), bl = blocksOf().filter((b) => b.taskId === t.id);
  el.hidden = false;
  el.innerHTML = `<button class="x" id="closeFocus" aria-label="Close">✕</button><small>${selected < 3 ? `★ Win the day ${selected + 1}` : `Also ${selected - 2}`}</small><h3>${esc(t.title)}</h3>
    ${t.tip ? `<p class="tip">💡 ${esc(t.tip)}</p>` : ""}
    <div class="slots">${bl.length ? bl.map((b) => `<span class="${b.done ? "d" : ""}">${P.pretty(b.start)}–${P.pretty(b.end)} ${PLACE(b.loc).icon}</span>`).join("") : "<span>Not scheduled yet</span>"}</div>
    <div class="bar"><b style="width:${Math.round(p * 100)}%"></b></div>
    <button class="gold wide" data-bloom="${t.id}">${p >= 1 ? "Undo bloom" : "Bloom it 🌻"}</button>`;
}
function pushScene() {
  scene.setFlowers(tasksOf().map((t) => ({ id: t.id, text: t.title, progress: prog(t) })));
  scene.setSeedlings(S.pool.filter((s) => s.week === P.weekStart(cur) && !s.done && !s.scheduled?.length));
  const steps = [...routineSteps("morning").map((t) => ["morning", t]), ...routineSteps("evening").map((t) => ["evening", t])];
  scene.setLanterns(steps.filter(([w, t]) => S.habits[cur]?.[w]?.[t]).length, steps.length);
  scene.setMood(dayProgress(cur).pct);
}
function renderSeedbar() {
  $$("#scope button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.scope === S.ui.scope)));
  $("#seedInput").placeholder = S.ui.scope === "week" ? "Brain-dump the week: ESAT paper 3, Cornell essay 2h, pay ISC fee…" : `Plant a task for ${cur === today() ? "today" : P.DOW[P.parseISO(cur).getDay()]}: e.g. UCAS personal statement 2h morning`;
}
function renderAll() { renderHeader(); renderDay(); renderWeek(); renderNotion(); renderFocus(); renderSeedbar(); pushScene(); }

/* ───────────── dialogs ───────────── */
const placeSel = (name, v, label) => `<select name="${name}" aria-label="${label}">${C.PLACE_KEYS.map((p) => `<option value="${p}" ${v === p ? "selected" : ""}>${PLACE(p).icon} ${PLACE(p).label}</option>`).join("")}</select>`;
function openDayDialog() {
  const d = cur, dd = day(d), inp = dd.inputs, tasks = tasksOf(d).filter((t) => t.title);
  const f = $("#dayForm");
  f.innerHTML = `
    <header><h2>Plan ${P.DOW[P.parseISO(d).getDay()]} ${P.shortDate(d)}</h2><button type="button" class="x" data-close>✕</button></header>
    <p class="lede">Your tasks run in priority order around your routines, each in the part of the day you chose. ${aiOn ? "Claude then adds tips, a note for the day, and reminders to nudge you along." : ""}</p>
    <h4>Where will you be?</h4>
    <div class="grid3">${SEG.map(([s, l]) => `<label>${l}${placeSel("p" + s[0], inp.locations[s], l)}</label>`).join("")}</div>
    <h4>Energy</h4>
    <div class="seg radio">${["low", "ok", "high"].map((k) => `<label><input type="radio" name="penergy" value="${k}" ${inp.energy === k ? "checked" : ""}><span>${{ low: "Low", ok: "Okay", high: "Buzzing" }[k]}</span></label>`).join("")}</div>
    <h4>In priority order</h4>
    ${tasks.length ? `<ol class="plist">${tasks.map((t) => `<li><b>${tierOf(d, t) === "primary" ? "★" : "·"}</b> ${esc(t.title)} <em>${P.dur(t.min)} ${whenChip(t.when)}</em></li>`).join("")}</ol><p class="hintline small">Reorder with ▲▼ in the day card; set a best time by opening a task.</p>` : `<p class="warn">No tasks yet: plant some first.</p>`}
    <label class="wide">Fixed plans <small>HH:MM-HH:MM what @place</small><textarea name="pfixed" rows="2" placeholder="14:00-15:30 Physics lesson @school">${esc(inp.fixedText)}</textarea></label>
    <label class="wide">Anything ${aiOn ? "Claude" : "else"} should know? <small>optional</small><textarea name="pnotes" rows="2" placeholder="Dentist at 3 for an hour. Want to finish by 9pm.">${esc(inp.notes || "")}</textarea></label>
    ${dd.plan?.manual ? `<p class="warn">This rebuilds the schedule from your priorities, replacing your hand edits${d === today() ? " (everything before now stays)" : ""}.</p>` : ""}
    <footer><span id="dayStatus" role="status"></span><button class="gold" name="go">✨ Plan my day</button></footer>`;
  $("#dayDialog").showModal();
}
function openWeekDialog(k = defaultPlanWeek()) {
  const t0 = today();
  ensureWeek(k);
  let dates = P.weekDates(k).filter((d) => d >= t0);
  if (!dates.length) return openWeekDialog(P.addDays(k, 7));
  const w = S.weeks[k], thisK = P.weekStart(t0), nextK = P.addDays(thisK, 7);
  const pool = S.pool.filter((s) => (s.week === k || s.week === P.addDays(k, -7) || !s.week) && !s.done);
  const prevDates = P.weekDates(P.addDays(k, -7)).concat(P.weekDates(k)).filter((d) => d < t0 && S.days[d]);
  const carry = prevDates.slice(-7).flatMap((d) => tasksOf(d).filter((t) => t.title && prog(t, d) < 1 && !t.seedId).map((t) => ({ d, t })));
  const f = $("#weekForm"); f.dataset.week = k;
  f.innerHTML = `
    <header><h2>Plan ${k === nextK ? "next week" : k === thisK ? "this week" : `week of ${P.shortDate(k)}`}</h2><button type="button" class="x" data-close>✕</button></header>
    <div class="seg tabs2"><button type="button" data-wk="${thisK}" aria-checked="${k === thisK}">Rest of this week</button><button type="button" data-wk="${nextK}" aria-checked="${k === nextK}">Next week · from ${P.shortDate(nextK)}</button></div>
    <p class="lede">Choose a word for the week, where you'll be, and what you want done. ${aiOn ? "Claude" : "The planner"} matches each task to the place and time of day that suit it, keeps your routines, and writes a note and tip for every day. It stays a draft in the garden until you confirm it to Notion.</p>
    <label class="wide themein">Theme word<input name="theme" value="${esc(w.theme || "")}" placeholder="${aiOn ? "e.g. Momentum (or leave blank for Claude to suggest)" : "e.g. Momentum"}" maxlength="24"></label>
    <h4>Where will you be?</h4>
    <div class="wgrid"><span></span><small>Morning</small><small>Afternoon</small><small>Evening</small><small>Fixed plans</small>
      ${dates.map((d) => { const l = day(d).inputs.locations; return `<b>${DOW3(d)} ${P.parseISO(d).getDate()}</b>${placeSel(`m-${d}`, l.morning, "Morning")}${placeSel(`a-${d}`, l.afternoon, "Afternoon")}${placeSel(`e-${d}`, l.evening, "Evening")}<input name="f-${d}" value="${esc(day(d).inputs.fixedText)}" placeholder="optional: 9:00-15:00 Classes">`; }).join("")}</div>
    <h4>Seeds to plant</h4>
    ${pool.length || carry.length ? `<ul class="picks">${pool.map((s) => `<li><label><input type="checkbox" name="seed" value="${s.id}" checked> ${esc(s.title)} <em>${P.dur(s.min)}${s.when && s.when !== "any" ? " · " + C.WHEN_ICON[s.when] : ""}</em></label></li>`).join("")}
      ${carry.map(({ d, t }) => `<li><label><input type="checkbox" name="carry" value="${d}|${t.id}" checked> ${esc(t.title)} <em>unfinished · ${DOW3(d)}</em></label></li>`).join("")}</ul>` : ""}
    <label class="wide">${pool.length ? "Anything else?" : "What do you want to get done?"} <small>one per line or comma separated; add “2h”, “45m”, or “morning”</small>
      <textarea name="more" rows="3" placeholder="ESAT paper 4 and 5 morning&#10;Cornell supplemental 2h&#10;UIUC essay&#10;SAT maths 45m&#10;Pay ISC fee"></textarea></label>
    <label class="mini"><input type="checkbox" name="keep" checked> Keep today's garden and any day with progress</label>
    <footer><span id="weekStatus" role="status"></span><button type="button" name="stop" hidden>Stop</button><button class="gold" name="go">✨ Grow the week</button></footer>`;
  if (!$("#weekDialog").open) $("#weekDialog").showModal();
}
function openConfirm(k) {
  const w = S.weeks[k], title = weekTitle(k), lines = weekLines(k), n = Object.values(lines).reduce((a, l) => a + (l?.length || 0), 0);
  const verb = w.notion.state === "linked" || w.notion.state === "confirmed" ? "replace" : "create";
  $("#confirmForm").innerHTML = `
    <header><h2>${verb === "create" ? "Send this week to Notion" : "Sync this week to Notion"}</h2><button type="button" class="x" data-close>✕</button></header>
    <p class="lede">${verb === "create" ? `This creates <b>${esc(title)}</b> on your Starmap page, right after ${esc(S.weeks[P.addDays(k, -7)]?.notion?.title || "the current week")}, with a toggle for each day and a checkbox for every task (routines left out).` : `This replaces what's written under <b>${esc(w.notion.title || title)}</b> on your Starmap page with the finalised plan below.${w.notion.title && w.notion.title !== title ? ` It will also be renamed to <b>${esc(title)}</b>.` : ""}`} After this, changes you make here sync to Notion automatically.</p>
    ${!notionOn ? `<p class="warn">Notion isn't reachable from this view. You can copy the week instead.</p>` : ""}
    <div class="cprev">${P.weekDates(k).map((d) => `<div><b>${N.DAY_NAMES[P.parseISO(d).getDay()]} <code>${N.dayTag(d)}</code></b>${!lines[d] ? `<p class="nempty">${verb === "create" ? "No tasks" : "Not planned here: kept as it is in Notion"}</p>` : lines[d].length ? `<ul>${lines[d].map((l) => `<li>☐ ${esc(l.text.replace(/\\/g, ""))}</li>`).join("")}</ul>` : `<p class="nempty">No tasks</p>`}</div>`).join("")}</div>
    <footer><span>${n} task${n === 1 ? "" : "s"} across 7 days</span><button type="button" id="copyWeek">Copy instead</button>${notionOn ? `<button class="gold" type="submit">${verb === "create" ? "Create in Notion" : "Replace in Notion"}</button>` : ""}</footer>`;
  $("#confirmForm").dataset.week = k;
  $("#confirmDialog").showModal();
}

const PRESETS = {
  morning: [[10, "Stretch + water"], [10, "Journal three lines"], [30, "Sunrise run"], [30, "Art lesson + Frankenstein"], [45, "Weights + bands circuit"], [20, "Shower"], [20, "Breakfast"], [10, "Review today's 6"]],
  evening: [[15, "Daily check-in"], [10, "Plan tomorrow's 6"], [10, "Skincare"], [20, "Read (screens off)"], [10, "Tidy desk + pack bag"], [10, "Charge devices"], [10, "Gratitude note"]],
};
function routineList(which) {
  const list = which === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine;
  return `<ul class="rsteps">${list.map(([m, t], i) => `<li><span class="updown"><button type="button" data-rmove="${which}|${i}|-1" aria-label="Move up" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" data-rmove="${which}|${i}|1" aria-label="Move down" ${i === list.length - 1 ? "disabled" : ""}>▼</button></span><input aria-label="Step" data-rt="${which}" data-i="${i}" data-k="t" value="${esc(t)}"><input aria-label="Minutes" type="number" min="5" max="180" step="5" data-rt="${which}" data-i="${i}" data-k="m" value="${m}"><span>min</span><button type="button" class="x" data-rdel="${which}" data-i="${i}" aria-label="Remove ${esc(t)}">✕</button></li>`).join("")}</ul>
    <div class="rnew"><input data-newstep="${which}" placeholder="Add your own step, e.g. Meditate 10m" aria-label="New step"><button type="button" data-rnew="${which}">Add</button></div>
    <div class="presets">${PRESETS[which].filter(([, t]) => !list.some(([, x]) => x === t)).map(([m, t]) => `<button type="button" data-radd="${which}" data-m="${m}" data-t="${esc(t)}">+ ${esc(t)}</button>`).join("")}</div>`;
}
function renderRoutineForm() {
  const s = S.settings, total = (l) => l.reduce((a, [m]) => a + m, 0);
  $("#routineForm").innerHTML = `
    <header><h2>Routines &amp; rhythm</h2><button type="button" class="x" data-close>✕</button></header>
    <p class="lede">Routines go in first every day; your six tasks grow around them. Tick steps in the schedule or the Rituals tracker, and each one lights a lantern on the greenhouse rim.</p>
    <section class="rblock"><div class="rhead"><label class="switch"><input type="checkbox" data-ron="morning" ${s.routinesOn.morning ? "checked" : ""}><span>Morning routine</span></label><em>${P.dur(total(s.morningRoutine))} from ${s.wake} · 🔥 ${streak("morning")}</em></div>
      ${s.routinesOn.morning ? routineList("morning") : ""}</section>
    <section class="rblock"><div class="rhead"><label class="switch"><input type="checkbox" data-ron="evening" ${s.routinesOn.evening ? "checked" : ""}><span>Night routine</span></label><em>${P.dur(total(s.eveningRoutine))} before ${s.sleep} · 🔥 ${streak("evening")}</em></div>
      ${s.routinesOn.evening ? routineList("evening") : ""}</section>
    <h4>Rhythm</h4>
    <div class="grid3"><label>Wake<input type="time" data-set="wake" value="${s.wake}"></label><label>Sleep<input type="time" data-set="sleep" value="${s.sleep}"></label>
      <label>Travel (min)<input type="number" min="5" max="90" step="5" data-set="travelMin" value="${s.travelMin}"></label>
      <label>Lunch<input type="time" data-set="lunch" value="${s.lunch}"></label><label>Dinner<input type="time" data-set="dinner" value="${s.dinner}"></label></div>
    <h4>Usual places</h4>
    <div class="grid3">${SEG.map(([k, l]) => `<label>${l}<select data-place="${k}">${C.PLACE_KEYS.map((p) => `<option value="${p}" ${s.places[k] === p ? "selected" : ""}>${PLACE(p).icon} ${PLACE(p).label}</option>`).join("")}</select></label>`).join("")}</div>
    <footer><span></span><button class="gold" data-close>Done</button></footer>`;
}
function routinesChanged() {
  const t0 = today();
  Object.keys(S.days).filter((d) => d >= t0 && S.days[d].plan && !S.days[d].plan.manual).forEach((d) => { rebuild(d); save(d); });
  save(); renderRoutineForm(); renderAll();
}
function addStep(which, input) {
  const v = input.value.trim(); if (!v) return input.focus();
  const m = /(\d+)\s*(?:m|min|mins|minutes)?\s*\)?$/i.exec(v), mins = m ? Math.max(5, Math.min(180, +m[1])) : 15;
  const title = (m ? v.slice(0, m.index) : v).replace(/[(\s-]+$/, "").trim() || v;
  (which === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine).push([mins, title]);
  routinesChanged(); $(`[data-newstep="${which}"]`)?.focus();
}

/* ───────────── navigation ───────────── */
function goDay(d) { if (selected >= 0) scene.resetView(); cur = d; selected = -1; openRow = null; openItem = null; ensureWeek(d); scene.setSelected(-1); renderAll(); save(); }
function select(i) {
  const was = selected; selected = i;
  const t = tasksOf()[i];
  openRow = i >= 0 && t?.title ? t.id : null;
  scene.setSelected(i);
  if (i < 0 && was >= 0) scene.resetView();
  renderDay(); renderFocus();
  if (i >= 0) $(`#dayPanel [data-task="${t.id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/* ───────────── events ───────────── */
let plantSlot = null;
document.addEventListener("click", (e) => {
  const el = e.target.closest("button"); if (!el || el.disabled) return;
  const ds = el.dataset;
  if (ds.close !== undefined) return el.closest("dialog").close();
  if (ds.day) return goDay(ds.day);
  if (ds.wk) return openWeekDialog(ds.wk);
  if (ds.scope) { S.ui.scope = ds.scope; plantSlot = null; save(); renderSeedbar(); return $("#seedInput").focus(); }
  if (ds.cycle) { const inp = day().inputs, k = C.PLACE_KEYS, i = k.indexOf(inp.locations[ds.cycle]); inp.locations[ds.cycle] = k[(i + 1) % k.length]; if (day().plan) day().plan.manual = false; return commit(); }
  if (ds.plantSlot !== undefined) { plantSlot = +ds.plantSlot; S.ui.scope = "today"; renderSeedbar(); $("#seedInput").placeholder = plantSlot < 3 ? "Name a win for today…" : "Name a task for today…"; return $("#seedInput").focus(); }
  if (ds.bloom) { const t = tasksOf().find((x) => x.id === ds.bloom); return t && setDone(t, prog(t) < 1); }
  if (ds.row) { openRow = openRow === ds.row ? null : ds.row; selected = openRow ? +ds.idx : -1; scene.setSelected(selected); renderDay(); renderFocus(); return; }
  if (ds.tmove) { const [tier, i, dir] = ds.tmove.split("|"); return moveTask(tier, +i, +i + +dir); }
  if (ds.swap) { const t = tasksOf().find((x) => x.id === ds.swap); return t && swapTier(t); }
  if (ds.remove) { const t = tasksOf().find((x) => x.id === ds.remove); return t && removeTask(t); }
  if (ds.item) { openItem = openItem === ds.item ? null : ds.item; return renderDay(); }
  if (ds.imove) { const [key, dir] = ds.imove.split("|"), b = blocksOf(), out = P.moveItem(b, key, +dir); if (out === b) return toast("The neighbouring item has a time you set, so it stays put. Change this item's time instead."); return editPlan(cur, out); }
  if (ds.iunlock) { const it = P.itemsOf(blocksOf()).find((x) => x.key === ds.iunlock); it?.blocks.forEach((b) => delete b.locked); save(cur); renderDay(); return toast("Unlocked: re-plans can move it again."); }
  if (ds.iremove) { openItem = null; return editPlan(cur, P.removeItem(blocksOf(), ds.iremove), "Removed from today's schedule. The task stays in your list."); }
  if (ds.energy) { day().inputs.energy = ds.energy; save(cur); return renderDay(); }
  if (ds.habit) { const [d, which] = ds.habit.split("|"); return toggleHabitDay(d, which); }
  if (ds.seed) { const s = S.pool.find((x) => x.id === ds.seed); if (!s) return; const over = placeInDay(cur, [{ ...s, seedId: s.id }]); if (over.length) return toast("This day's greenhouse is full."); s.scheduled = [...(s.scheduled || []), cur]; commit(); return toast(`Planted “${s.title}” into ${P.DOW[P.parseISO(cur).getDay()]} 🌱`); }
  if (ds.unseed) { S.pool = S.pool.filter((x) => x.id !== ds.unseed); save(); return renderAll(); }
  if (ds.rdel) { const l = ds.rdel === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine; l.splice(+ds.i, 1); return routinesChanged(); }
  if (ds.rmove) { const [w, i, dir] = ds.rmove.split("|"), l = w === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine, j = +i + +dir; if (j < 0 || j >= l.length) return; [l[+i], l[j]] = [l[j], l[+i]]; return routinesChanged(); }
  if (ds.rnew) return addStep(ds.rnew, el.previousElementSibling);
  if (ds.radd) { (ds.radd === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine).push([+ds.m, ds.t]); return routinesChanged(); }
  switch (el.id) {
    case "prevDay": return goDay(P.addDays(cur, -1));
    case "nextDay": return goDay(P.addDays(cur, 1));
    case "todayBtn": return goDay(today());
    case "prevWeek": return goDay(P.addDays(P.weekStart(cur), -7));
    case "nextWeek": return goDay(P.addDays(P.weekStart(cur), 7));
    case "openWeek": case "planWeekTop": return openWeekDialog();
    case "resetDay": return openWeekDialog(P.addDays(P.weekStart(today()), 7));
    case "openDay": case "planDayTop": return openDayDialog();
    case "openRoutines": renderRoutineForm(); return $("#routineDialog").showModal();
    case "confirmWeek": return openConfirm(P.weekStart(cur));
    case "copyNotion": return copyNotion(P.weekStart(cur));
    case "copyWeek": $("#confirmDialog").close(); return copyNotion($("#confirmForm").dataset.week);
    case "syncNow": return sendWeek(P.weekStart(cur));
    case "peekNotion": return peekNotion(P.weekStart(cur));
    case "notionToggle": S.ui.notionOpen = !S.ui.notionOpen; save(); return renderNotion();
    case "replanNow": rebuild(cur, { fresh: true, from: cur === today() ? nowMin() : null }); save(cur); renderAll(); return toast("Re-planned in priority order");
    case "replanPriority": rebuild(cur, { fresh: true, from: cur === today() && nowMin() > P.hm(S.settings.wake) + 20 ? nowMin() : null }); save(cur); renderAll(); return toast("Schedule rebuilt from your priorities");
    case "checkinGo": return checkIn();
    case "closeFocus": return select(-1);
    case "resetView": return selected >= 0 ? select(-1) : scene.resetView();
    case "nudgeOk": $("#nudge").hidden = true; if (nudgeQueue.length) setTimeout(() => showNudge(nudgeQueue.shift()), 400); return;
    case "copyAgain": { const r = document.createRange(); r.selectNodeContents($("#copyBody")); getSelection().removeAllRanges(); getSelection().addRange(r); return; }
  }
  if (el.name === "stop") weekCtl?.abort();
});
document.addEventListener("change", (e) => {
  const el = e.target, ds = el.dataset;
  if (ds.chk) return toggleBlock(ds.chk);
  if (ds.f) {
    const t = tasksOf().find((x) => x.id === ds.id); if (!t) return;
    t[ds.f] = ds.f === "min" ? Math.max(10, Math.min(480, +el.value || t.min)) : el.value.trim();
    if (ds.f === "title" && !t.title) return removeTask(t);
    if (ds.f === "min" || ds.f === "when") t.needsPlace = true;
    return commit();
  }
  if (ds.istart || ds.iend) {
    const key = ds.istart || ds.iend, it = P.itemsOf(blocksOf()).find((x) => x.key === key); if (!it) return;
    const s = ds.istart ? P.hm(el.value) : it.start, en = ds.iend ? P.hm(el.value) : it.blocks.length === 1 ? it.end + (s - it.start) : null;
    if (s == null) return;
    if (en != null && en <= s) return toast("End has to be after start.");
    return editPlan(cur, P.setItemTime(blocksOf(), key, s, en), "Updated. Later items moved forward where needed.");
  }
  if (el.id === "adminText") { day().inputs.adminText = el.value; return commit(); }
  if (el.id === "fixedText") { day().inputs.fixedText = el.value; if (day().plan) day().plan.manual = false; return commit(); }
  if (el.id === "reflection") { day().inputs.reflection = el.value; return save(cur); }
  if (el.id === "themeWord") { const k = P.weekStart(cur), v = el.value.trim().split(/\s+/)[0] || ""; S.weeks[k].theme = v; save(); renderAll(); if (S.weeks[k].notion.state === "confirmed") queueNotion(k); return; }
  if (ds.ron) { S.settings.routinesOn[ds.ron] = el.checked; return routinesChanged(); }
  if (ds.rt) { const l = ds.rt === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine, row = l[+ds.i]; if (!row) return; if (ds.k === "m") row[0] = Math.max(5, Math.min(180, +el.value || row[0])); else row[1] = el.value.trim() || row[1]; return routinesChanged(); }
  if (ds.set) { S.settings[ds.set] = ds.set === "travelMin" ? +el.value || 25 : el.value; return routinesChanged(); }
  if (ds.place) { S.settings.places[ds.place] = el.value; return save(); }
});
$("#seedForm").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#seedInput").value; $("#seedInput").value = ""; const s = plantSlot; plantSlot = null; plant(v, { slot: s }); renderSeedbar(); });
$("#weekForm").addEventListener("submit", (e) => { e.preventDefault(); growWeek(e.target); });
$("#dayForm").addEventListener("submit", (e) => { e.preventDefault(); planMyDay(e.target); });
$("#confirmForm").addEventListener("submit", (e) => { e.preventDefault(); const k = e.target.dataset.week; $("#confirmDialog").close(); sendWeek(k); });
document.addEventListener("submit", (e) => {
  if (e.target.id !== "addEvent") return;
  e.preventDefault();
  const f = e.target, s = P.hm(f.s.value), en = P.hm(f.e.value), title = f.t.value.trim();
  if (s == null || en == null || en <= s || !title) return toast("Give it a name, a start and a later end.");
  const b = { id: `e-${Date.now().toString(36)}`, type: "fixed", locked: true, start: s, end: en, title, loc: day().inputs.locations[s < P.hm(S.settings.lunch) ? "morning" : s < P.hm(S.settings.dinner) ? "afternoon" : "evening"], done: false, desc: "Added by you." };
  editPlan(cur, P.setItemTime([...blocksOf(), b], b.id, s, en), `Added “${title}” at ${P.pretty(s)}.`);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset?.newstep) { e.preventDefault(); return addStep(e.target.dataset.newstep, e.target); }
  if (e.key === "Enter" && e.target.id === "checkinText" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); return checkIn(); }
  if (e.key === "Escape" && selected >= 0 && !document.querySelector("dialog[open]")) select(-1);
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); $("#seedInput").focus(); }
});
$("#datePick").addEventListener("change", (e) => e.target.value && goDay(e.target.value));

// drag to reorder: priorities within a tier, and items in the schedule
let drag = null;
document.addEventListener("dragstart", (e) => {
  const el = e.target.closest?.("[data-drag]"); if (!el) return;
  drag = { kind: el.dataset.drag, tier: el.dataset.tier, i: +el.dataset.i, key: el.dataset.key };
  e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "x"); el.classList.add("dragging");
});
document.addEventListener("dragover", (e) => {
  const el = e.target.closest?.("[data-drag]"); if (!drag || !el || el.dataset.drag !== drag.kind || (drag.kind === "task" && el.dataset.tier !== drag.tier)) return;
  e.preventDefault(); $$(".dropto").forEach((x) => x !== el && x.classList.remove("dropto")); el.classList.add("dropto");
});
document.addEventListener("dragend", () => { $$(".dragging,.dropto").forEach((x) => x.classList.remove("dragging", "dropto")); drag = null; });
document.addEventListener("drop", (e) => {
  const el = e.target.closest?.("[data-drag]"); if (!drag || !el) return;
  e.preventDefault();
  if (drag.kind === "task" && el.dataset.tier === drag.tier) moveTask(drag.tier, drag.i, +el.dataset.i);
  if (drag.kind === "item" && el.dataset.key && el.dataset.key !== drag.key) {
    let blocks = blocksOf();
    const idx = (k) => P.itemsOf(blocks).findIndex((it) => it.key === k);
    const target = idx(el.dataset.key);
    for (let g = 0; g < 40 && idx(drag.key) !== target && idx(drag.key) >= 0; g++) { const next = P.moveItem(blocks, drag.key, idx(drag.key) < target ? 1 : -1); if (next === blocks) { toast("Stopped at an item with a time you set."); break; } blocks = next; }
    editPlan(cur, blocks);
  }
  drag = null;
});

/* ───────────── boot ───────────── */
const scene = createScene($("#scene"), {
  onSelect: (i) => select(i === selected ? -1 : i),
  onEmpty: (i) => { plantSlot = i; S.ui.scope = "today"; renderSeedbar(); $("#seedInput").placeholder = i < 3 ? "Name a win for today…" : "Name a task for today…"; $("#seedInput").focus(); },
});
ensureWeek(cur);
Object.values(S.days).forEach((dd) => { if (dd.plan && !dd.nudges) dd.nudges = []; });
if (S.days[cur]?.plan) { syncRoutineChecks(cur); refreshNudges(cur); }
renderAll();
C.sampler().then((s) => { aiOn = !!s; renderAll(); });
if (IN_ARTIFACT) {
  initDb();
  N.connector().then((m) => { notionOn = !!m; renderAll(); for (const k of Object.keys(S.weeks)) queueNotion(k); });
}
setInterval(() => {
  checkNudges();
  if (cur === today() && !$("#dayPanel").contains(document.activeElement)) { const y = $("#dayPanel").scrollTop; renderDay(); $("#dayPanel").scrollTop = y; }
}, 30000);
setTimeout(checkNudges, 3000);
// never lose edits: push pending saves the moment the page is hidden or closed
const flushNow = () => { if (db && (dirtyDays.size || metaDirty)) { clearTimeout(dbTimer); flushDb(); } };
document.addEventListener("visibilitychange", () => { if (document.hidden) flushNow(); });
addEventListener("pagehide", flushNow);
