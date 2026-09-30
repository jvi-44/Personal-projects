import * as P from "./planner.js";
import * as C from "./coach.js";
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

/* ───────────── state ───────────── */
const KEY = "starmap.v2";
const blankTask = (id) => ({ id, title: "", min: 60, kind: "auto", where: "any", tip: "", doneWhen: "", done: false, seedId: null });
const defaultSettings = () => ({
  ...structuredClone(P.DEFAULT_SETTINGS),
  routinesOn: { morning: true, evening: true },
  places: { morning: "home", afternoon: "home", evening: "home" },
});
function fresh() {
  return { settings: defaultSettings(), pool: [], weeks: { "2026-09-27": { label: "After Prelims", match: "After Prelims" } }, days: {}, placeMemory: {}, ui: { scope: "today" }, savedAt: 0 };
}
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (!s) { // migrate v1
    try {
      const v1 = JSON.parse(localStorage.getItem("starmap.v1"));
      if (v1?.days) { s = fresh(); s.days = v1.days; s.weeks = { ...s.weeks, ...v1.weeks }; if (v1.settings) Object.assign(s.settings, v1.settings); }
    } catch {}
  }
  const f = fresh();
  if (!s) return f;
  return { ...f, ...s, settings: { ...f.settings, ...s.settings, routinesOn: { ...f.settings.routinesOn, ...(s.settings?.routinesOn || {}) }, places: { ...f.settings.places, ...(s.settings?.places || {}) } } };
}
let S = load();
let cur = today();
let selected = -1;
let showAll = false;
let openRow = null;
let aiOn = false;
let busy = 0;

const eff = () => ({ ...S.settings, morningRoutine: S.settings.routinesOn.morning ? S.settings.morningRoutine : [], eveningRoutine: S.settings.routinesOn.evening ? S.settings.eveningRoutine : [] });
function day(d = cur) {
  if (!S.days[d]) {
    const mem = S.placeMemory[P.parseISO(d).getDay()];
    S.days[d] = { inputs: { primary: [0, 1, 2].map((i) => blankTask(`p${i}-${d}`)), secondary: [0, 1, 2].map((i) => blankTask(`s${i}-${d}`)), adminText: "", fixedText: "", locations: { ...(mem || S.settings.places) }, energy: "ok", reflection: "" }, plan: null, ai: null };
  }
  const dd = S.days[d];
  dd.inputs.primary ||= []; dd.inputs.secondary ||= [];
  while (dd.inputs.primary.length < 3) dd.inputs.primary.push(blankTask(`p${dd.inputs.primary.length}-${d}-${Date.now()}`));
  while (dd.inputs.secondary.length < 3) dd.inputs.secondary.push(blankTask(`s${dd.inputs.secondary.length}-${d}-${Date.now()}`));
  return dd;
}
const tasksOf = (d = cur) => [...day(d).inputs.primary, ...day(d).inputs.secondary];
const blocksOf = (d = cur) => day(d).plan?.blocks || [];
const prog = (t, d = cur) => P.taskProgress(t, blocksOf(d));
function ensureWeek(d) { const k = P.weekStart(d); S.weeks[k] ||= { label: `of ${P.shortDate(k)}` }; return k; }

/* ───────────── persistence: localStorage + artifact db ───────────── */
let db = null, dirtyDays = new Set(), metaDirty = false, dbTimer = null, dbBusy = false;
function save(d) {
  S.savedAt = Date.now();
  if (d) dirtyDays.add(d); metaDirty = true;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  if (db) { clearTimeout(dbTimer); dbTimer = setTimeout(flushDb, 1200); }
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
      const f = fresh();
      S = { ...f, ...m, days, settings: { ...f.settings, ...m.settings } };
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
      db = c; renderAll();
    } else {
      db = c; Object.keys(S.days).forEach((d) => dirtyDays.add(d)); metaDirty = true; flushDb();
    }
  } catch { db = null; }
}

/* ───────────── planning ───────────── */
const planInputs = (d) => { const i = day(d).inputs; return { ...i, admin: P.parseAdmin(i.adminText), fixed: P.parseFixed(i.fixedText) }; };
const hasTasks = (d) => tasksOf(d).some((t) => t.title) || day(d).inputs.adminText.trim();
function rebuild(d = cur, { from = null } = {}) {
  const dd = day(d);
  if (!hasTasks(d)) { dd.plan = null; return; }
  const isToday = d === today(), started = dd.plan?.blocks.some((b) => b.done);
  const at = from ?? (isToday && dd.plan && (started || nowMin() > P.hm(S.settings.wake) + 20) ? nowMin() : null);
  dd.plan = at != null && dd.plan ? { ...P.replan(planInputs(d), eff(), dd.plan.blocks, at) } : { ...P.generatePlan(planInputs(d), eff()) };
  dd.plan.generatedAt = Date.now();
}
function commit(d = cur, { plan = true } = {}) { if (plan) rebuild(d); save(d); renderAll(); }

function dayProgress(d) {
  const ts = tasksOf(d).filter((t) => t.title);
  const done = ts.filter((t) => prog(t, d) >= 1).length;
  const w = (t) => (day(d).inputs.primary.includes(t) ? 2 : 1);
  const tot = ts.reduce((a, t) => a + w(t), 0);
  return { done, total: ts.length, pct: tot ? ts.reduce((a, t) => a + prog(t, d) * w(t), 0) / tot : 0 };
}

/* ───────────── planting seeds ───────────── */
const taskFrom = (s) => ({ id: C.newId(), title: s.title, min: s.min ?? s.minutes ?? 60, kind: s.kind || "auto", where: s.where || "any", tip: s.tip || "", doneWhen: s.doneWhen || "", done: false, seedId: s.seedId || null });
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
  const scope = slot != null ? "today" : S.ui.scope;
  const d = cur, wk = ensureWeek(d);
  const quick = C.parseSeedsHeuristic(text);
  // sprout immediately with a best guess, then let Claude refine
  const ids = [];
  if (scope === "week") {
    quick.forEach((s) => { s.week = wk; S.pool.push(s); ids.push(s.id); });
    save(); renderAll();
  } else {
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
      S.pool = S.pool.filter((s) => !ids.includes(s.id));
      tasks.forEach((s) => { s.week = wk; S.pool.push(s); });
      save(); renderAll();
      toast(`Planted ${tasks.length} seed${tasks.length > 1 ? "s" : ""}. Tap “Plan my week” to spread them out.`);
    } else if (tasks.length === ids.length) {
      const all = tasksOf(d);
      ids.forEach((id, k) => { const t = all.find((x) => x.id === id); if (t) Object.assign(t, taskFrom(tasks[k]), { id }); });
      commit(d); toast("Sprouted, with a tip from Claude 🌱");
    } else {
      tasksOf(d).forEach((t) => { if (ids.includes(t.id)) Object.assign(t, blankTask(t.id)); });
      const over = placeInDay(d, tasks, slot);
      over.forEach((s) => { s.week = wk; S.pool.push(s); });
      commit(d); toast(`Sprouted ${tasks.length} tasks 🌱`);
    }
  } catch (e) { toast(e.message); }
  finally { thinking(-1); }
}

/* ───────────── task actions ───────────── */
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
  const t = tasksOf().find((x) => x.id === b.taskId), before = t ? prog(t) : 0;
  b.done = !b.done; if (t && !b.done) t.done = false;
  save(cur); renderAll();
  if (t && before < 1 && prog(t) >= 1) { scene.burst(tasksOf().indexOf(t)); toast(pickCheer(t)); }
}
const pickCheer = (t) => `🌻 “${t.title}” bloomed. ${C.cheer(t.id)}`;
function removeTask(t) { Object.assign(t, blankTask(t.id)); openRow = null; selected = -1; commit(); }
function swapTier(t) {
  const inp = day().inputs, inPrim = inp.primary.includes(t), other = inPrim ? inp.secondary : inp.primary;
  const slot = other.find((x) => !x.title) || other[other.length - 1];
  const a = { ...t }, b = { ...slot };
  Object.assign(slot, a); Object.assign(t, b);
  openRow = slot.id; commit();
}

/* ───────────── AI: day note + week ───────────── */
function thinking(dx) { busy = Math.max(0, busy + dx); scene.setThinking(busy > 0); document.body.classList.toggle("thinking", busy > 0); }
function dayCtx(d, extra = {}) {
  const dd = day(d);
  return { date: d, locations: dd.inputs.locations, energy: dd.inputs.energy, reflection: dd.inputs.reflection, now: P.pretty(nowMin()), tasks: tasksOf(d).filter((t) => t.title).map((t) => ({ title: t.title, min: t.min, tier: dd.inputs.primary.includes(t) ? "primary" : "secondary", progress: prog(t, d) })), ...extra };
}
async function coachDay(d = cur, { checkin = false } = {}) {
  thinking(+1);
  try {
    const out = await C.dayNote(dayCtx(d, { checkin }));
    const dd = day(d);
    dd.ai = { theme: out.theme, description: out.description, tip: out.tip };
    (out.taskTips || []).forEach((x) => { const t = tasksOf(d).find((t) => t.title.toLowerCase() === x.title.toLowerCase()); if (t) t.tip = x.tip; });
    commit(d, { plan: true });
    if (out.error) toast(out.error);
  } finally { thinking(-1); }
}

let weekCtl = null;
async function growWeek(form) {
  const k = P.weekStart(cur), t0 = today();
  const dates = P.weekDates(k).filter((d) => d >= t0);
  const keep = form.keep.checked;
  const plan = dates.filter((d) => !(keep && (blocksOf(d).some((b) => b.done) || (d === t0 && hasTasks(d)))));
  if (!plan.length) { toast("Every remaining day is already planted. Untick “keep” to re-plan them."); return; }
  const days = plan.map((d) => {
    const loc = { morning: form[`m-${d}`].value, afternoon: form[`a-${d}`].value, evening: form[`e-${d}`].value };
    S.placeMemory[P.parseISO(d).getDay()] = loc;
    return { date: d, locations: loc, fixed: form[`f-${d}`].value.trim() };
  });
  // seeds: ticked pool seeds + carry-overs + new text
  const chosen = $$("input[name=seed]:checked", form).map((x) => x.value);
  const seeds = S.pool.filter((s) => chosen.includes(s.id)).map((s) => ({ ...s }));
  $$("input[name=carry]:checked", form).forEach((x) => { const [d, id] = x.value.split("|"); const t = tasksOf(d).find((t) => t.id === id); if (t) seeds.push({ id: C.newId(), title: t.title, min: Math.max(15, Math.round(t.min * (1 - prog(t, d)) / 5) * 5), kind: t.kind === "auto" ? P.inferKind(t.title) : t.kind, priority: "win", where: t.where, tip: t.tip, doneWhen: t.doneWhen, carry: true }); });
  const extra = form.more.value.trim();
  if (extra) { const add = C.parseSeedsHeuristic(extra); add.forEach((s) => { s.week = k; S.pool.push(s); }); seeds.push(...add); }
  if (!seeds.length) { toast("Add a few seeds first: what do you want to get done this week?"); return; }
  const btn = form.go, status = $("#weekStatus");
  btn.disabled = true; form.stop.hidden = !aiOn; status.textContent = aiOn ? "Claude is reading your week…" : "Planting…";
  thinking(+1);
  weekCtl = new AbortController();
  try {
    const res = await C.planWeek({ days, seeds, settings: eff() }, { signal: weekCtl.signal, onText: ({ text }) => { status.textContent = `Claude is writing your week… ${Math.min(99, Math.round(text.length / 45))}%`; } });
    if (res.cancelled) { status.textContent = "Stopped. Nothing changed."; return; }
    applyWeek(k, res, days, seeds);
    $("#weekDialog").close();
    toast(res.ai ? "Your week is planted ✨" : res.error ? `${res.error}` : "Your week is planted 🌻", 5000);
  } finally { thinking(-1); btn.disabled = false; form.stop.hidden = true; weekCtl = null; }
}
function applyWeek(k, res, days, seeds) {
  S.weeks[k] = { ...S.weeks[k], theme: res.weekTheme, note: res.weekNote };
  const seedIds = new Set(seeds.map((s) => s.id));
  for (const din of days) {
    const r = res.days.find((x) => x.date === din.date) || { primary: [], secondary: [], admin: [] };
    const dd = day(din.date);
    dd.inputs.locations = din.locations; dd.inputs.fixedText = din.fixed;
    const fill = (arr, list) => arr.forEach((t, i) => Object.assign(t, list[i] ? taskFrom({ ...list[i], seedId: seedIds.has(list[i].seedId) ? list[i].seedId : null }) : blankTask(t.id), { id: list[i] ? C.newId() : t.id }));
    fill(dd.inputs.primary, r.primary); fill(dd.inputs.secondary, r.secondary);
    dd.inputs.adminText = (r.admin || []).map((a) => `${a.title} (${a.minutes})`).join("\n");
    dd.ai = r.theme || r.description ? { theme: r.theme, description: r.description, tip: r.tip } : null;
    rebuild(din.date, { from: din.date === today() && nowMin() > P.hm(S.settings.wake) + 20 ? nowMin() : null });
    save(din.date);
  }
  // mark seeds scheduled; carry-overs aren't pool seeds
  S.pool.forEach((s) => { if (seedIds.has(s.id)) s.scheduled = res.days.filter((d) => [...d.primary, ...d.secondary].some((t) => t.seedId === s.id) || (d.admin || []).some((a) => a.title === s.title)).map((d) => d.date); });
  save(); renderAll();
}

/* ───────────── rendering ───────────── */
function toast(msg, ms = 3400) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t); setTimeout(() => t.classList.add("out"), ms - 300); setTimeout(() => t.remove(), ms);
}
const placeChip = (d, seg) => { const k = day(d).inputs.locations[seg]; return `<button class="place" data-cycle="${seg}" title="${SEG.find((s) => s[0] === seg)[1]}: tap to change"><small>${SEG.find((s) => s[0] === seg)[1]}</small><span>${PLACE(k).icon} ${PLACE(k).label}</span></button>`; };

function renderHeader() {
  const k = ensureWeek(cur), t0 = today();
  $("#weekStrip").innerHTML = P.weekDates(k).map((d) => {
    const dd = S.days[d], wins = dd ? dd.inputs.primary.filter((t) => t.title) : [];
    const dots = [0, 1, 2].map((i) => { const t = wins[i]; const p = t ? P.taskProgress(t, dd.plan?.blocks || []) : -1; return `<i class="${p >= 1 ? "on" : p > 0 ? "half" : p === 0 ? "set" : ""}"></i>`; }).join("");
    const pl = dd ? PLACE(dd.inputs.locations.morning).icon : "";
    return `<button class="daychip${d === cur ? " on" : ""}${d === t0 ? " today" : ""}${d < t0 ? " past" : ""}" data-day="${d}" aria-label="${P.DOW[P.parseISO(d).getDay()]} ${P.shortDate(d)}">
      <span class="dw">${P.DOW[P.parseISO(d).getDay()].slice(0, 3)}</span><b>${P.parseISO(d).getDate()}</b><span class="pl">${pl || "&nbsp;"}</span><span class="dots">${dots}</span></button>`;
  }).join("");
  $("#aiBadge").textContent = aiOn ? "✨ Claude on" : "Built-in planner";
  $("#aiBadge").className = "badge " + (aiOn ? "ai" : "");
}

function groupBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "routine" && last?.type === "routineGroup" && last.end === b.start) { last.items.push(b); last.end = b.end; continue; }
    if (b.type === "routine") { out.push({ type: "routineGroup", id: "g" + b.id, start: b.start, end: b.end, items: [b] }); continue; }
    if (b.type === "break" && !showAll) continue;
    out.push(b);
  }
  return out;
}

function renderDay() {
  const d = cur, dd = day(d), inp = dd.inputs, isToday = d === today(), now = nowMin();
  const blocks = blocksOf(d), pr = dayProgress(d);
  const slotLine = (t) => { const bl = blocks.filter((b) => b.taskId === t.id); return bl.length ? bl.map((b) => P.pretty(b.start)).join(" · ") : ""; };
  const row = (t, i) => {
    const p = prog(t), isOpen = openRow === t.id && t.title, win = i < 3;
    if (!t.title) return `<li class="task empty"><button class="plantbtn" data-plant-slot="${i}">+ ${win ? "Plant a win" : "Plant a task"}</button></li>`;
    return `<li class="task${p >= 1 ? " done" : ""}${selected === i ? " sel" : ""}${isOpen ? " open" : ""}" data-task="${t.id}">
      <button class="bloom" data-bloom="${t.id}" aria-label="${p >= 1 ? "Mark not done" : "Mark done"}" style="--p:${Math.round(p * 100)}"><i></i></button>
      <button class="tmain" data-row="${t.id}" data-idx="${i}"><span class="tt">${esc(t.title)}</span><span class="tm">${P.dur(t.min)}${slotLine(t) ? ` · ${slotLine(t)}` : ""}</span></button>
      ${isOpen ? `<div class="tedit">
        ${t.tip ? `<p class="tip">💡 ${esc(t.tip)}</p>` : ""}
        <label class="wide">Task<input data-f="title" data-id="${t.id}" value="${esc(t.title)}"></label>
        <div class="grid3"><label>Minutes<input type="number" min="10" max="480" step="5" data-f="min" data-id="${t.id}" value="${t.min}"></label>
        <label>Best place<select data-f="where" data-id="${t.id}">${["any", ...C.PLACE_KEYS].map((k) => `<option value="${k}" ${t.where === k ? "selected" : ""}>${k === "any" ? "Anywhere" : PLACE(k).label}</option>`).join("")}</select></label>
        <label>Done when<input data-f="doneWhen" data-id="${t.id}" value="${esc(t.doneWhen)}" placeholder="optional"></label></div>
        <div class="acts"><button data-swap="${t.id}">${win ? "Move to “also”" : "Make it a win"}</button><button class="danger" data-remove="${t.id}">Remove</button></div>
      </div>` : ""}
    </li>`;
  };
  const cutoff = isToday ? blocks.find((b) => b.end > now)?.id : null;
  const groups = groupBlocks(blocks);
  const sched = groups.map((b) => {
    const nowMark = isToday && (b.items ? b.items.some((x) => x.id === cutoff) : b.id === cutoff) ? `<li class="now" aria-label="Now"><span>${P.pretty(now)}</span></li>` : "";
    if (b.type === "routineGroup") {
      const done = b.items.filter((x) => x.done).length, label = b.start < 12 * 60 ? "Morning routine" : "Night routine";
      return `${nowMark}<li class="blk t-routine${done === b.items.length ? " done" : ""}"><details><summary><span class="bt">${P.pretty(b.start)}</span><span class="bn">${label}<em>${done}/${b.items.length} · ${P.dur(b.end - b.start)}</em></span></summary>
        <ul class="steps">${b.items.map((x) => `<li><label><input type="checkbox" data-chk="${x.id}" ${x.done ? "checked" : ""}><span>${esc(x.title)}</span><em>${P.pretty(x.start)}</em></label></li>`).join("")}</ul></details></li>`;
    }
    const task = b.type === "primary" || b.type === "secondary";
    const live = isToday && b.start <= now && now < b.end;
    return `${nowMark}<li class="blk t-${b.type}${b.done ? " done" : ""}${live ? " live" : ""}"><details><summary><span class="bt">${P.pretty(b.start)}</span><span class="bn">${task ? `<b>${b.type === "primary" ? "★ " : ""}</b>` : ""}${esc(b.title)}${b.chunk ? ` <small>${b.chunk}</small>` : ""}<em>${P.dur(b.end - b.start)} · ${PLACE(b.loc).icon}</em></span>
      ${task || b.type === "admin" ? `<input type="checkbox" class="bchk" data-chk="${b.id}" ${b.done ? "checked" : ""} aria-label="Done">` : ""}</summary>
      <div class="bd">${b.tip ? `<p class="tip">💡 ${esc(b.tip)}</p>` : ""}<p>${esc(b.desc || "").replace(/\n/g, "<br>")}</p></div></details></li>`;
  }).join("");
  const note = dd.ai;
  $("#dayPanel").innerHTML = `
    <header class="dhead"><div><small>${isToday ? "Today" : d < today() ? "Past day" : "Upcoming"}</small><h2>${P.DOW[P.parseISO(d).getDay()]} <span>${P.shortDate(d)}</span></h2></div>
      <div class="ring" style="--p:${Math.round(pr.pct * 100)}" title="${pr.done}/${pr.total} bloomed"><span>${pr.done}/${pr.total || 6}</span></div></header>
    <div class="places">${SEG.map(([s]) => placeChip(d, s)).join("")}</div>
    ${note ? `<section class="coach"><h3>${esc(note.theme || "")}</h3><p>${esc(note.description || "")}</p>${note.tip ? `<p class="tip">💡 ${esc(note.tip)}</p>` : ""}</section>` : ""}
    <section><h4>Win the day</h4><ul class="tasks">${inp.primary.map((t, i) => row(t, i)).join("")}</ul>
      <h4>Also</h4><ul class="tasks">${inp.secondary.map((t, i) => row(t, i + 3)).join("")}</ul></section>
    <details class="more"><summary>Small admin &amp; fixed plans</summary>
      <label class="wide">Small admin <small>one per line, (minutes) optional</small><textarea id="adminText" rows="3" placeholder="Reply to Ms Seah (10)&#10;Pay ISC fee (5)">${esc(inp.adminText)}</textarea></label>
      <label class="wide">Fixed plans <small>HH:MM-HH:MM what @place</small><textarea id="fixedText" rows="2" placeholder="14:00-15:30 Physics lesson @school">${esc(inp.fixedText)}</textarea></label></details>
    ${dd.plan ? `<section class="sched"><div class="shead"><h4>Schedule</h4><label class="mini"><input type="checkbox" id="showAll" ${showAll ? "checked" : ""}> breaks</label></div>
      ${dd.plan.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join("")}
      <ol class="timeline">${sched}</ol></section>
      <details class="checkin" ${isToday ? "" : ""}><summary>Check in</summary>
        <div class="seg" role="radiogroup" aria-label="Energy">${["low", "ok", "high"].map((k) => `<button role="radio" aria-checked="${inp.energy === k}" data-energy="${k}">${{ low: "Low energy", ok: "Okay", high: "Buzzing" }[k]}</button>`).join("")}</div>
        <textarea id="reflection" rows="2" placeholder="How's it going? What should carry over?">${esc(inp.reflection)}</textarea>
        <div class="acts"><button id="replanNow">${isToday ? "Re-plan from now" : "Rebuild day"}</button>${aiOn ? `<button class="gold" id="coachMe">✨ Coach me</button>` : ""}</div></details>`
      : `<p class="hintline">Plant a task below and your day grows itself around your routines.</p>`}
    ${aiOn && hasTasks(d) ? `<button class="linkbtn" id="refreshNote">✨ ${note ? "Refresh" : "Write"} today's note</button>` : ""}`;
}

function renderWeek() {
  const k = ensureWeek(cur), w = S.weeks[k], t0 = today();
  const seeds = S.pool.filter((s) => s.week === k && !s.done);
  $("#weekPanel").innerHTML = `
    <header class="whead"><button id="prevWeek" aria-label="Previous week">‹</button><div><small>Week</small><h2>ЩΣΣK ${esc(w.label)}</h2></div><button id="nextWeek" aria-label="Next week">›</button></header>
    ${w.theme || w.note ? `<section class="coach"><h3>${esc(w.theme || "")}</h3><p>${esc(w.note || "")}</p></section>` : ""}
    <ol class="wdays">${P.weekDates(k).map((d) => {
      const dd = S.days[d], wins = dd ? dd.inputs.primary.filter((t) => t.title) : [];
      return `<li><button class="wday${d === cur ? " on" : ""}${d === t0 ? " today" : ""}${d < t0 ? " past" : ""}" data-day="${d}">
        <span class="wd"><b>${P.DOW[P.parseISO(d).getDay()].slice(0, 3)}</b> ${P.parseISO(d).getDate()}</span>
        <span class="wbody"><span class="wt">${esc(dd?.ai?.theme || (wins.length ? wins.map((t) => t.title).join(", ") : d < t0 ? "" : "Open"))}</span>
        ${dd ? `<span class="wp">${SEG.map(([s]) => PLACE(dd.inputs.locations[s]).icon).join("")}</span>` : ""}</span></button></li>`;
    }).join("")}</ol>
    <section class="tray"><h4>Seed tray <small>${seeds.length ? `${seeds.length} for this week` : "empty"}</small></h4>
      ${seeds.length ? `<ul class="seeds">${seeds.map((s) => `<li><button class="seedchip" data-seed="${s.id}" title="Plant into ${P.DOW[P.parseISO(cur).getDay()]}">${esc(s.title)} <em>${P.dur(s.min)}${s.scheduled?.length ? ` · ${s.scheduled.map((x) => P.DOW[P.parseISO(x).getDay()].slice(0, 2)).join(" ")}` : ""}</em></button><button class="x" data-unseed="${s.id}" aria-label="Remove ${esc(s.title)}">✕</button></li>`).join("")}</ul>` : `<p class="hintline">Switch the planter to “This week” and brain-dump everything you want done.</p>`}</section>
    <div class="wacts"><button class="gold" id="openWeek">✨ Plan my week</button><button id="copyNotion">Copy for Notion</button></div>`;
}

function renderFocus() {
  const el = $("#focusCard");
  const t = selected >= 0 ? tasksOf()[selected] : null;
  if (!t || !t.title) { el.hidden = true; return; }
  const p = prog(t), bl = blocksOf().filter((b) => b.taskId === t.id);
  el.hidden = false;
  el.innerHTML = `<button class="x" id="closeFocus" aria-label="Close">✕</button><small>${selected < 3 ? `★ Win the day ${selected + 1}` : "Also"}</small><h3>${esc(t.title)}</h3>
    ${t.tip ? `<p class="tip">💡 ${esc(t.tip)}</p>` : ""}
    <div class="slots">${bl.length ? bl.map((b) => `<span class="${b.done ? "d" : ""}">${P.pretty(b.start)}–${P.pretty(b.end)} ${PLACE(b.loc).icon}</span>`).join("") : "<span>Not scheduled yet</span>"}</div>
    <div class="bar"><b style="width:${Math.round(p * 100)}%"></b></div>
    <button class="gold wide" data-bloom="${t.id}">${p >= 1 ? "Undo bloom" : "Bloom it 🌻"}</button>`;
}

function pushScene() {
  scene.setFlowers(tasksOf().map((t) => ({ id: t.id, text: t.title, progress: prog(t) })));
  const k = P.weekStart(cur);
  scene.setSeedlings(S.pool.filter((s) => s.week === k && !s.done && !s.scheduled?.length));
  const r = blocksOf().filter((b) => b.type === "routine");
  scene.setLanterns(r.filter((b) => b.done).length, r.length || [...eff().morningRoutine, ...eff().eveningRoutine].length);
  scene.setMood(dayProgress(cur).pct);
}
function renderSeedbar() {
  $$("#scope button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.scope === S.ui.scope)));
  $("#seedInput").placeholder = S.ui.scope === "week" ? "Brain-dump the week: ESAT paper 3, Cornell essay 2h, pay ISC fee…" : `Plant a task for ${cur === today() ? "today" : P.DOW[P.parseISO(cur).getDay()]}: e.g. UCAS personal statement 2h`;
}
function renderAll() { renderHeader(); renderDay(); renderWeek(); renderFocus(); renderSeedbar(); pushScene(); }

/* ───────────── dialogs ───────────── */
function openWeekDialog() {
  const k = P.weekStart(cur), t0 = today();
  let dates = P.weekDates(k).filter((d) => d >= t0);
  if (!dates.length) { goDay(P.addDays(k, 7)); return openWeekDialog(); }
  const pool = S.pool.filter((s) => (s.week === k || !s.week) && !s.done);
  const carry = P.weekDates(k).filter((d) => d < t0 && S.days[d]).flatMap((d) => tasksOf(d).filter((t) => t.title && prog(t, d) < 1 && !t.seedId).map((t) => ({ d, t })));
  const sel = (name, v) => `<select name="${name}" aria-label="${name}">${C.PLACE_KEYS.map((p) => `<option value="${p}" ${v === p ? "selected" : ""}>${PLACE(p).icon} ${PLACE(p).label}</option>`).join("")}</select>`;
  $("#weekForm").innerHTML = `
    <header><h2>Plan your week</h2><button type="button" class="x" data-close>✕</button></header>
    <p class="lede">Tell me where you'll be and what you want done. ${aiOn ? "Claude" : "The planner"} matches each task to the place that suits it, keeps your routines, and writes a short note and tip for every day.</p>
    <h4>Where will you be?</h4>
    <div class="wgrid"><span></span><small>Morning</small><small>Afternoon</small><small>Evening</small><small>Fixed plans</small>
      ${dates.map((d) => { const l = day(d).inputs.locations; return `<b>${P.DOW[P.parseISO(d).getDay()].slice(0, 3)} ${P.parseISO(d).getDate()}</b>${sel(`m-${d}`, l.morning)}${sel(`a-${d}`, l.afternoon)}${sel(`e-${d}`, l.evening)}<input name="f-${d}" value="${esc(day(d).inputs.fixedText)}" placeholder="optional: 9:00-15:00 Classes">`; }).join("")}</div>
    <h4>Seeds to plant</h4>
    ${pool.length || carry.length ? `<ul class="picks">${pool.map((s) => `<li><label><input type="checkbox" name="seed" value="${s.id}" checked> ${esc(s.title)} <em>${P.dur(s.min)}</em></label></li>`).join("")}
      ${carry.map(({ d, t }) => `<li><label><input type="checkbox" name="carry" value="${d}|${t.id}" checked> ${esc(t.title)} <em>unfinished from ${P.DOW[P.parseISO(d).getDay()].slice(0, 3)}</em></label></li>`).join("")}</ul>` : ""}
    <label class="wide">${pool.length ? "Anything else?" : "What do you want to get done?"} <small>one per line or comma separated; add durations like “2h”</small>
      <textarea name="more" rows="3" placeholder="ESAT paper 4 and 5&#10;Cornell supplemental 2h&#10;UIUC essay&#10;SAT maths 45m&#10;Pay ISC fee"></textarea></label>
    <label class="mini"><input type="checkbox" name="keep" checked> Keep today's garden and any day with progress</label>
    <footer><span id="weekStatus" role="status"></span><button type="button" name="stop" hidden>Stop</button><button class="gold" name="go">✨ Grow my week</button></footer>`;
  $("#weekDialog").showModal();
}

const PRESETS = {
  morning: [[10, "Stretch + water"], [10, "Journal three lines"], [30, "Sunrise run"], [30, "Art lesson + Frankenstein"], [45, "Weights + bands circuit"], [20, "Shower"], [20, "Breakfast"], [10, "Review today's 6"]],
  evening: [[15, "Daily check-in"], [10, "Plan tomorrow's 6"], [10, "Skincare"], [20, "Read (screens off)"], [10, "Tidy desk + pack bag"], [10, "Gratitude note"]],
};
function routineList(which) {
  const list = which === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine;
  return `<ul class="rsteps" data-list="${which}">${list.map(([m, t], i) => `<li><input aria-label="Step" data-rt="${which}" data-i="${i}" data-k="t" value="${esc(t)}"><input aria-label="Minutes" type="number" min="5" max="180" step="5" data-rt="${which}" data-i="${i}" data-k="m" value="${m}"><span>min</span><button type="button" class="x" data-rdel="${which}" data-i="${i}" aria-label="Remove ${esc(t)}">✕</button></li>`).join("")}</ul>
    <div class="rnew"><input data-newstep="${which}" placeholder="Add your own step, e.g. Meditate 10m" aria-label="New ${which === "morning" ? "morning" : "night"} step"><button type="button" data-rnew="${which}">Add</button></div>
    <div class="presets">${PRESETS[which].filter(([, t]) => !list.some(([, x]) => x === t)).map(([m, t]) => `<button type="button" data-radd="${which}" data-m="${m}" data-t="${esc(t)}">+ ${esc(t)}</button>`).join("")}</div>`;
}
function renderRoutineForm() {
  const s = S.settings, total = (l) => l.reduce((a, [m]) => a + m, 0);
  $("#routineForm").innerHTML = `
    <header><h2>Routines &amp; rhythm</h2><button type="button" class="x" data-close>✕</button></header>
    <p class="lede">Routines go in first every day; your six tasks grow around them. Each step becomes a lantern on the greenhouse rim that lights up when you tick it off.</p>
    <section class="rblock"><div class="rhead"><label class="switch"><input type="checkbox" data-ron="morning" ${s.routinesOn.morning ? "checked" : ""}><span>Morning routine</span></label><em>${P.dur(total(s.morningRoutine))} from ${s.wake}</em></div>
      ${s.routinesOn.morning ? routineList("morning") : ""}</section>
    <section class="rblock"><div class="rhead"><label class="switch"><input type="checkbox" data-ron="evening" ${s.routinesOn.evening ? "checked" : ""}><span>Night routine</span></label><em>${P.dur(total(s.eveningRoutine))} before ${s.sleep}</em></div>
      ${s.routinesOn.evening ? routineList("evening") : ""}</section>
    <h4>Rhythm</h4>
    <div class="grid3"><label>Wake<input type="time" data-set="wake" value="${s.wake}"></label><label>Sleep<input type="time" data-set="sleep" value="${s.sleep}"></label>
      <label>Best focus<select data-set="peak">${["morning", "afternoon", "evening"].map((k) => `<option ${s.peak === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
      <label>Lunch<input type="time" data-set="lunch" value="${s.lunch}"></label><label>Dinner<input type="time" data-set="dinner" value="${s.dinner}"></label>
      <label>Travel (min)<input type="number" min="5" max="90" step="5" data-set="travelMin" value="${s.travelMin}"></label></div>
    <h4>Usual places</h4>
    <div class="grid3">${SEG.map(([k, l]) => `<label>${l}<select data-place="${k}">${C.PLACE_KEYS.map((p) => `<option value="${p}" ${s.places[k] === p ? "selected" : ""}>${PLACE(p).icon} ${PLACE(p).label}</option>`).join("")}</select></label>`).join("")}</div>
    <label class="wide">Notion week name<input data-weeklabel value="${esc(S.weeks[P.weekStart(cur)]?.label || "")}"></label>
    <footer><span></span><button class="gold" data-close>Done</button></footer>`;
}
function addStep(which, input) {
  const v = input.value.trim(); if (!v) return input.focus();
  const m = /(\d+)\s*(?:m|min|mins|minutes)?\s*\)?$/i.exec(v), mins = m ? Math.max(5, Math.min(180, +m[1])) : 15;
  const title = (m ? v.slice(0, m.index) : v).replace(/[(\s-]+$/, "").trim() || v;
  (which === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine).push([mins, title]);
  routinesChanged(); $(`[data-newstep="${which}"]`)?.focus();
}
function routinesChanged() {
  // rebuild today and upcoming days that haven't started
  const t0 = today();
  Object.keys(S.days).filter((d) => d >= t0 && S.days[d].plan).forEach((d) => { rebuild(d); save(d); });
  save(); renderRoutineForm(); renderAll();
}

/* ───────────── notion text ───────────── */
function notionText() {
  const k = P.weekStart(cur), w = S.weeks[k], out = [`ЩΣΣK ${w.label}`, ""];
  for (const d of P.weekDates(k)) {
    out.push(`${P.DOW[P.parseISO(d).getDay()]} [${P.shortDate(d)}]`);
    const dd = S.days[d];
    if (dd?.plan) { const h = P.notionHeadline(dd.inputs); if (h) out.push("  • " + h); P.notionLines(dd.plan.blocks).forEach((l) => out.push(`  [${l.checked ? "x" : " "}] ${l.text}`)); }
    else out.push("  (no plan yet)");
    out.push("");
  }
  return out.join("\n");
}
async function copyNotion() {
  const text = notionText();
  try { await navigator.clipboard.writeText(text); toast(IN_ARTIFACT ? "Copied. Paste it into Notion, or ask Claude to sync the week for you." : "Copied for Notion."); }
  catch { $("#copyBody").textContent = text; $("#copyDialog").showModal(); }
  if (!IN_ARTIFACT) { try { const s = await fetch("/api/status").then((r) => r.json()); if (s.connected) syncNotion(); } catch {} }
}
async function syncNotion() {
  const k = P.weekStart(cur);
  const days = P.weekDates(k).filter((d) => S.days[d]?.plan).map((d) => ({ date: d, headline: P.notionHeadline(S.days[d].inputs), lines: P.notionLines(S.days[d].plan.blocks) }));
  try {
    const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week: { key: k, label: S.weeks[k].label, match: S.weeks[k].match, dates: P.weekDates(k) }, knownWeekKeys: Object.keys(S.weeks), days }) }).then((r) => r.json());
    if (res.error) throw new Error(res.error);
    toast(res.dryRun ? "Notion isn't connected on the server, so nothing was written." : `Synced ${days.length} day(s) to Notion ✓`);
  } catch (e) { toast("Notion sync failed: " + e.message, 6000); }
}

/* ───────────── navigation ───────────── */
function goDay(d) { if (selected >= 0) scene.resetView(); cur = d; selected = -1; openRow = null; ensureWeek(d); scene.setSelected(-1); renderAll(); save(); }
function select(i) {
  const was = selected;
  selected = i;
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
  const el = e.target.closest("button"); if (!el) return;
  const ds = el.dataset;
  if (ds.close !== undefined) return el.closest("dialog").close();
  if (ds.day) return goDay(ds.day);
  if (ds.scope) { S.ui.scope = ds.scope; plantSlot = null; save(); renderSeedbar(); return $("#seedInput").focus(); }
  if (ds.cycle) { const inp = day().inputs, k = C.PLACE_KEYS, i = k.indexOf(inp.locations[ds.cycle]); inp.locations[ds.cycle] = k[(i + 1) % k.length]; return commit(); }
  if (ds.plantSlot !== undefined) { plantSlot = +ds.plantSlot; S.ui.scope = "today"; renderSeedbar(); $("#seedInput").placeholder = plantSlot < 3 ? "Name a win for today…" : "Name a task for today…"; return $("#seedInput").focus(); }
  if (ds.bloom) { const t = tasksOf().find((x) => x.id === ds.bloom); return t && setDone(t, prog(t) < 1); }
  if (ds.row) { openRow = openRow === ds.row ? null : ds.row; selected = openRow ? +ds.idx : -1; scene.setSelected(selected); if (selected < 0) scene.resetView(); renderDay(); renderFocus(); return; }
  if (ds.swap) { const t = tasksOf().find((x) => x.id === ds.swap); return t && swapTier(t); }
  if (ds.remove) { const t = tasksOf().find((x) => x.id === ds.remove); return t && removeTask(t); }
  if (ds.energy) { day().inputs.energy = ds.energy; return commit(); }
  if (ds.seed) { const s = S.pool.find((x) => x.id === ds.seed); if (!s) return; const over = placeInDay(cur, [{ ...s, seedId: s.id }]); if (over.length) return toast("Today's greenhouse is full."); s.scheduled = [...(s.scheduled || []), cur]; commit(); return toast(`Planted “${s.title}” into ${P.DOW[P.parseISO(cur).getDay()]} 🌱`); }
  if (ds.unseed) { S.pool = S.pool.filter((x) => x.id !== ds.unseed); save(); return renderAll(); }
  if (ds.rdel) { const l = ds.rdel === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine; l.splice(+ds.i, 1); return routinesChanged(); }
  if (ds.rnew) return addStep(ds.rnew, el.previousElementSibling);
  if (ds.radd) { (ds.radd === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine).push([+ds.m, ds.t]); return routinesChanged(); }
  switch (el.id) {
    case "prevDay": return goDay(P.addDays(cur, -1));
    case "nextDay": return goDay(P.addDays(cur, 1));
    case "todayBtn": return goDay(today());
    case "prevWeek": return goDay(P.addDays(P.weekStart(cur), -7));
    case "nextWeek": return goDay(P.addDays(P.weekStart(cur), 7));
    case "openWeek": case "planWeekTop": return openWeekDialog();
    case "openRoutines": renderRoutineForm(); return $("#routineDialog").showModal();
    case "copyNotion": return copyNotion();
    case "replanNow": rebuild(cur, { from: cur === today() ? nowMin() : null }); save(cur); renderAll(); return toast("Re-planned the rest of your day");
    case "coachMe": return coachDay(cur, { checkin: true });
    case "refreshNote": return coachDay(cur);
    case "closeFocus": return select(-1);
    case "resetView": return selected >= 0 ? select(-1) : scene.resetView();
    case "copyAgain": { const r = document.createRange(); r.selectNodeContents($("#copyBody")); getSelection().removeAllRanges(); getSelection().addRange(r); return; }
  }
  if (el.name === "stop") weekCtl?.abort();
});
document.addEventListener("change", (e) => {
  const el = e.target, ds = el.dataset;
  if (ds.chk) return toggleBlock(ds.chk);
  if (ds.f) { const t = tasksOf().find((x) => x.id === ds.id); if (!t) return; t[ds.f] = ds.f === "min" ? Math.max(10, Math.min(480, +el.value || t.min)) : el.value.trim(); if (ds.f === "title" && !t.title) return removeTask(t); return commit(); }
  if (el.id === "adminText") { day().inputs.adminText = el.value; return commit(); }
  if (el.id === "fixedText") { day().inputs.fixedText = el.value; return commit(); }
  if (el.id === "reflection") { day().inputs.reflection = el.value; return save(cur); }
  if (el.id === "showAll") { showAll = el.checked; return renderDay(); }
  if (ds.ron) { S.settings.routinesOn[ds.ron] = el.checked; return routinesChanged(); }
  if (ds.rt) { const l = ds.rt === "morning" ? S.settings.morningRoutine : S.settings.eveningRoutine, row = l[+ds.i]; if (!row) return; if (ds.k === "m") row[0] = Math.max(5, Math.min(180, +el.value || row[0])); else row[1] = el.value.trim() || row[1]; return routinesChanged(); }
  if (ds.set) { S.settings[ds.set] = ds.set === "travelMin" ? +el.value || 25 : el.value; return routinesChanged(); }
  if (ds.place) { S.settings.places[ds.place] = el.value; return save(); }
  if (ds.weeklabel !== undefined) { const v = el.value.trim(); if (v) S.weeks[P.weekStart(cur)].label = v; save(); return renderAll(); }
});
$("#seedForm").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#seedInput").value; $("#seedInput").value = ""; const s = plantSlot; plantSlot = null; plant(v, { slot: s }); renderSeedbar(); });
$("#weekForm").addEventListener("submit", (e) => { e.preventDefault(); growWeek(e.target); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset?.newstep) { e.preventDefault(); return addStep(e.target.dataset.newstep, e.target); }
  if (e.key === "Escape" && selected >= 0 && !document.querySelector("dialog[open]")) select(-1);
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); $("#seedInput").focus(); }
});
$("#datePick").addEventListener("change", (e) => e.target.value && goDay(e.target.value));

/* ───────────── boot ───────────── */
const scene = createScene($("#scene"), {
  onSelect: (i) => select(i === selected ? -1 : i),
  onEmpty: (i) => { plantSlot = i; S.ui.scope = "today"; renderSeedbar(); $("#seedInput").placeholder = i < 3 ? "Name a win for today…" : "Name a task for today…"; $("#seedInput").focus(); },
});
ensureWeek(cur);
if (S.days[cur]?.plan && S.days[cur].plan.generatedAt && P.iso(new Date(S.days[cur].plan.generatedAt)) !== cur) rebuild(cur);
renderAll();
C.sampler().then((s) => { aiOn = !!s; renderAll(); });
if (IN_ARTIFACT) initDb();
setInterval(() => { if (cur === today() && !$("#dayPanel").contains(document.activeElement)) { const y = $("#dayPanel").scrollTop; renderDay(); $("#dayPanel").scrollTop = y; } }, 60000);
