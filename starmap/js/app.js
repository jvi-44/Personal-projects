import * as P from "./planner.js";
import { createScene } from "./scene.js";

/* ───────────── state ───────────── */
const KEY = "starmap.v1";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DEFAULT_BACKLOG = [
  "UCAS personal statement", "US Common App essay", "ESAT practice paper", "SAT study", "IAAC prep",
  "AMD internship skills (Fusion, AutoCAD, PCB)", "ISC: make payment", "STEMulate Academy", "CE01 follow-up", "Teach Mama computer skills",
];
const LOC_ICON = { home: "🏠", cafe: "☕", school: "🎒", library: "📚", outdoors: "🌳" };
const TYPE_LABEL = { primary: "Win the day", secondary: "Secondary", admin: "Small admin", routine: "Routine", meal: "Meal", travel: "Travel", flex: "Flex", break: "Break", fixed: "Fixed" };

const emptyTask = (id, min) => ({ id, title: "", min, kind: "auto", doneWhen: "", where: "any", done: false });
const emptyInputs = () => ({
  primary: [emptyTask("p1", 120), emptyTask("p2", 90), emptyTask("p3", 60)],
  secondary: [emptyTask("s1", 45), emptyTask("s2", 30), emptyTask("s3", 30)],
  adminText: "", fixedText: "", locations: { morning: "home", afternoon: "home", evening: "home" }, energy: "ok", reflection: "",
});

function fresh() {
  return {
    settings: structuredClone(P.DEFAULT_SETTINGS),
    weeks: { "2026-09-27": { label: "After Prelims", match: "After Prelims" } },
    days: {}, sync: {}, ui: { autosync: true }, backlog: DEFAULT_BACKLOG,
  };
}
function load() {
  try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.settings) return { ...fresh(), ...j }; } catch {}
  return fresh();
}
let S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

const today = () => P.iso(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
let cur = today();
let tab = "plan";
let selected = -1;
let server = { known: false, connected: false };

const day = (d = cur) => (S.days[d] ||= { inputs: emptyInputs(), plan: null });
const tasksOf = (d) => [...day(d).inputs.primary, ...day(d).inputs.secondary];
const blocksOf = (d) => day(d).plan?.blocks || [];

function ensureWeek(dateISO) {
  const k = P.weekStart(dateISO);
  if (!S.weeks[k]) S.weeks[k] = { label: `of ${P.shortDate(k)}` };
  return k;
}
const weekPayloadMeta = (k) => ({ key: k, label: S.weeks[k].label, match: S.weeks[k].match, dates: P.weekDates(k) });

/* ───────────── toast / modal ───────────── */
function toast(msg, ms = 3200) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  $("#toasts").appendChild(t); setTimeout(() => t.classList.add("out"), ms - 300); setTimeout(() => t.remove(), ms);
}
function modal(title, body) { $("#modalTitle").textContent = title; $("#modalBody").textContent = body; $("#modal").showModal(); }

/* ───────────── scene ───────────── */
const scene = createScene($("#scene"), { onSelect: (i) => { selected = selected === i ? -1 : i; scene.setSelected(selected); renderFocus(); renderPlan(); } });

function pushScene() {
  const d = day(), blocks = blocksOf(cur);
  scene.setFlowers(tasksOf(cur).map((t) => ({ text: t.title, progress: P.taskProgress(t, blocks) })));
  const routines = blocks.filter((b) => b.type === "routine");
  scene.setRoutines(routines.filter((b) => b.done).length, routines.length);
  scene.setSelected(selected);
  const { done, total, pct } = dayProgress(cur);
  scene.setEnergy(pct);
  $("#meterFill").style.width = `${Math.round(pct * 100)}%`;
  $("#meterText").textContent = total ? `${done}/${total} tasks bloomed` : "plant today's six";
  void d;
}
function dayProgress(d) {
  const ts = tasksOf(d).filter((t) => t.title), blocks = blocksOf(d);
  const done = ts.filter((t) => P.taskProgress(t, blocks) >= 1).length;
  const w = ts.reduce((a, t, i) => a + P.taskProgress(t, blocks) * (day(d).inputs.primary.includes(t) ? 2 : 1), 0);
  const tot = ts.reduce((a, t) => a + (day(d).inputs.primary.includes(t) ? 2 : 1), 0);
  return { done, total: ts.length, pct: tot ? w / tot : 0 };
}

/* ───────────── actions ───────────── */
function readForm() {
  const f = $("#tab-inputs");
  if (!f.querySelector("form")) return;
  const d = day(), inp = d.inputs;
  const rd = (tier, i) => {
    const q = (n) => $(`[name="${tier}${i}-${n}"]`, f);
    const t = inp[tier][i];
    t.title = q("title").value.trim(); t.min = Math.max(10, Math.min(480, +q("min").value || t.min));
    t.kind = q("kind").value; t.where = q("where").value; t.doneWhen = q("doneWhen").value.trim();
  };
  for (let i = 0; i < 3; i++) { rd("primary", i); rd("secondary", i); }
  inp.adminText = $('[name="admin"]', f).value;
  inp.fixedText = $('[name="fixed"]', f).value;
  inp.locations = { morning: $('[name="locMorning"]', f).value, afternoon: $('[name="locAfternoon"]', f).value, evening: $('[name="locEvening"]', f).value };
  inp.energy = $('[name="energy"]', f).value;
  const s = S.settings;
  s.wake = $('[name="wake"]', f).value || s.wake; s.sleep = $('[name="sleep"]', f).value || s.sleep; s.peak = $('[name="peak"]', f).value;
}
const planInputs = () => {
  const inp = day().inputs;
  return { ...inp, admin: P.parseAdmin(inp.adminText), fixed: P.parseFixed(inp.fixedText) };
};

function generate({ startOver = false } = {}) {
  readForm();
  const d = day(), inp = planInputs();
  if (!inp.primary.some((t) => t.title)) { toast("Add at least one “win the day” task first 🌻"); return; }
  const isToday = cur === today();
  const hasProgress = d.plan?.blocks.some((b) => b.done);
  let plan;
  if (!startOver && d.plan && isToday && (hasProgress || nowMin() > P.hm(S.settings.wake) + 20)) {
    plan = P.replan(inp, S.settings, d.plan.blocks, nowMin());
  } else plan = P.generatePlan(inp, S.settings);
  d.plan = { ...plan, generatedAt: Date.now() };
  ensureWeek(cur);
  tab = "plan"; selected = -1;
  commit();
  plan.warnings.forEach((w) => toast(w, 5000));
  toast(plan.warnings.length ? "Plan ready, with a few things to trim" : "Your day is planted 🌻");
}

function replanNow(atMin, extra = {}) {
  const d = day(); if (!d.plan) return;
  const inp = { ...planInputs(), ...extra };
  d.plan = { ...P.replan(inp, S.settings, d.plan.blocks, atMin), generatedAt: Date.now() };
  commit(); toast("Re-planned the rest of your day");
}

function toggleBlock(id) {
  const blocks = blocksOf(cur), b = blocks.find((x) => x.id === id); if (!b) return;
  const t = tasksOf(cur).find((t) => t.id === b.taskId);
  const before = t ? P.taskProgress(t, blocks) : 0;
  b.done = !b.done;
  if (t && !b.done) t.done = false;
  const after = t ? P.taskProgress(t, blocks) : 0;
  commit();
  if (t && before < 1 && after >= 1) scene.burst(tasksOf(cur).indexOf(t));
}
function skipBlock(id) {
  const d = day(), b = d.plan.blocks.find((x) => x.id === id); if (!b) return;
  d.plan.blocks = d.plan.blocks.filter((x) => x.id !== id);
  if (b.taskId) replanNow(Math.max(nowMin(), cur === today() ? 0 : P.hm(S.settings.wake)));
  else commit();
}
function setTaskDone(i, val) {
  const t = tasksOf(cur)[i]; if (!t || !t.title) return;
  t.done = val;
  blocksOf(cur).filter((b) => b.taskId === t.id).forEach((b) => (b.done = val));
  commit(); if (val) scene.burst(i);
}
function addQuickTask(title) {
  title = title.trim(); if (!title) return;
  const d = day(); const inp = d.inputs;
  const slot = inp.secondary.find((t) => !t.title);
  if (slot) { slot.title = title; slot.min = 30; slot.done = false; }
  else inp.adminText += (inp.adminText ? "\n" : "") + title + " (15)";
  if (d.plan) replanNow(cur === today() ? nowMin() : P.hm(S.settings.wake)); else commit();
}

/* ───────────── rendering: left panel ───────────── */
const fmtRange = (b) => `${P.pretty(b.start)} – ${P.pretty(b.end)}`;

function renderPlan() {
  const el = $("#tab-plan"), d = day(), plan = d.plan, isToday = cur === today();
  if (!plan) {
    el.innerHTML = `<div class="empty"><div class="empty-flower">🌱</div><h2>Nothing planted yet</h2>
      <p>Tell me your six tasks (three <b>win the day</b> + three secondary), where you'll be, and any fixed commitments. I'll build a full timestamped day around your routines, with buffers.</p>
      <button class="primary" data-go="inputs">Plan this day →</button></div>`;
    return;
  }
  const blocks = plan.blocks, now = nowMin();
  const cutoff = isToday ? blocks.find((b) => b.end > now)?.id : null;
  const wins = d.inputs.primary.filter((t) => t.title).map((t) => t.title);
  const cur_ = isToday ? blocks.find((b) => b.start <= now && now < b.end) : null;
  const rows = blocks.map((b) => {
    const marker = b.id === cutoff ? `<li class="now"><span>now · ${P.pretty(now)}</span></li>` : "";
    const sel = selected >= 0 && b.taskId && b.taskId === tasksOf(cur)[selected]?.id;
    const isTask = b.type === "primary" || b.type === "secondary";
    return `${marker}<li class="blk t-${b.type}${b.done ? " done" : ""}${sel ? " hl" : ""}${cur_ && cur_.id === b.id ? " live" : ""}" data-id="${b.id}">
      <label class="chk"><input type="checkbox" ${b.done ? "checked" : ""} data-chk="${b.id}" aria-label="Mark done"><i></i></label>
      <div class="blk-main" data-open="${b.id}">
        <div class="blk-time">${fmtRange(b)} <em>${P.dur(b.end - b.start)}</em> <span class="loc" title="${esc(b.loc)}">${LOC_ICON[b.loc] || "📍"}</span></div>
        <div class="blk-title">${b.tag ? `<span class="tag">${esc(b.type === "primary" ? "★ " + b.tag : b.tag)}</span>` : ""}${esc(b.title)}${b.chunk ? ` <small>(${b.chunk})</small>` : ""}</div>
        <div class="blk-desc" hidden>${esc(b.desc || "").replace(/\n/g, "<br>")}
          <div class="blk-actions">${isTask || b.type === "admin" ? `<button data-skip="${b.id}">Skip &amp; reschedule</button>` : ""}<button data-chk-btn="${b.id}">${b.done ? "Undo" : "Mark done"}</button></div></div>
      </div></li>`;
  }).join("");
  const st = plan.stats;
  const tasksDone = dayProgress(cur);
  el.innerHTML = `
    <div class="headline"><small>${P.DOW[P.parseISO(cur).getDay()]} · ${P.shortDate(cur)}</small>
      <h2>${wins.length ? "Win the day: " + wins.map(esc).join(" · ") : "Today"}</h2>
      <div class="chips"><span>🌻 ${tasksDone.done}/${tasksDone.total} bloomed</span><span>🧠 ${P.dur(st.focusMin)} focus</span><span>🌿 ${P.dur(st.flexMin)} flex</span></div></div>
    ${plan.warnings.map((w) => `<div class="warn">⚠ ${esc(w)}</div>`).join("")}
    <div class="checkin"><h3>Check-in</h3>
      ${cur_ ? `<p class="now-line">Right now: <b>${esc(cur_.title)}</b> <span>until ${P.pretty(cur_.end)}</span></p>` : isToday ? `<p class="now-line muted">Between blocks. Nice moment to breathe.</p>` : `<p class="now-line muted">Viewing ${P.shortDate(cur)}</p>`}
      <div class="row">
        <label>Energy<select id="ciEnergy"><option value="low">Low</option><option value="ok">Okay</option><option value="high">High</option></select></label>
        <label>Re-plan from<input type="time" id="ciTime" value="${P.clock(isToday ? Math.ceil(now / 5) * 5 : P.hm(S.settings.wake))}"></label>
        <button class="primary" id="ciReplan">Re-plan rest of day</button>
      </div>
      <div class="row"><input id="ciAdd" placeholder="Something new came up? Add a task…"><button id="ciAddBtn">Add</button></div>
      <textarea id="ciNote" rows="2" placeholder="End-of-day reflection: what worked, what to carry over?">${esc(d.inputs.reflection)}</textarea>
    </div>
    <ol class="timeline">${rows}</ol>
    <div class="row end"><button id="startOver" class="ghost danger">Discard &amp; start over</button></div>`;
  $("#ciEnergy").value = d.inputs.energy || "ok";
}

function renderInputs() {
  const el = $("#tab-inputs"), d = day(), inp = d.inputs, s = S.settings;
  const hasPlan = !!d.plan, isToday = cur === today();
  const taskRow = (tier, i) => {
    const t = inp[tier][i], n = `${tier}${i}`;
    return `<div class="trow ${tier}"><div class="tnum">${tier === "primary" ? "★" + (i + 1) : i + 4}</div>
      <div class="tfields">
        <input name="${n}-title" placeholder="${tier === "primary" ? "Win-the-day task" : "Secondary task"}" value="${esc(t.title)}" list="backlog" autocomplete="off">
        <div class="tsub"><label>min<input name="${n}-min" type="number" min="10" max="480" step="5" value="${t.min}"></label>
          <label>type<select name="${n}-kind">${["auto", "essay", "paper", "study", "code", "creative", "reading", "outreach", "exercise", "admin", "generic"].map((k) => `<option ${t.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
          <label>where<select name="${n}-where">${["any", ...P.LOCATIONS].map((k) => `<option ${t.where === k ? "selected" : ""}>${k}</option>`).join("")}</select></label></div>
        <input name="${n}-doneWhen" class="dw" placeholder="Done when… (optional)" value="${esc(t.doneWhen)}">
      </div></div>`;
  };
  const prev = P.addDays(cur, -1);
  const carry = day(prev).plan ? tasksOf(prev).filter((t) => t.title && P.taskProgress(t, blocksOf(prev)) < 1) : [];
  const locSel = (n, v) => `<select name="${n}">${P.LOCATIONS.map((k) => `<option value="${k}" ${v === k ? "selected" : ""}>${LOC_ICON[k]} ${k}</option>`).join("")}</select>`;
  el.innerHTML = `<form autocomplete="off">
    <datalist id="backlog">${S.backlog.map((b) => `<option value="${esc(b)}">`).join("")}</datalist>
    ${carry.length ? `<div class="carry"><small>Carry over from yesterday</small>${carry.map((t) => `<button type="button" data-carry="${esc(t.title)}">↻ ${esc(t.title)}</button>`).join("")}</div>` : ""}
    <h3>Three to win the day <span>★</span></h3>${[0, 1, 2].map((i) => taskRow("primary", i)).join("")}
    <h3>Three secondary</h3>${[0, 1, 2].map((i) => taskRow("secondary", i)).join("")}
    <h3>Small admin <small>one per line, add (minutes)</small></h3>
    <textarea name="admin" rows="3" placeholder="Reply to Ms Seah (10)&#10;Pay ISC fee (5)">${esc(inp.adminText)}</textarea>
    <h3>Where will you be?</h3>
    <div class="locs"><label>Morning${locSel("locMorning", inp.locations.morning)}</label><label>Afternoon${locSel("locAfternoon", inp.locations.afternoon)}</label><label>Evening${locSel("locEvening", inp.locations.evening)}</label></div>
    <h3>Fixed commitments <small>HH:MM-HH:MM title @place</small></h3>
    <textarea name="fixed" rows="2" placeholder="14:00-15:30 Physics lesson @school">${esc(inp.fixedText)}</textarea>
    <h3>Rhythm</h3>
    <div class="locs"><label>Wake<input type="time" name="wake" value="${s.wake}"></label><label>Sleep<input type="time" name="sleep" value="${s.sleep}"></label>
      <label>Peak focus<select name="peak">${["morning", "afternoon", "evening"].map((k) => `<option ${s.peak === k ? "selected" : ""}>${k}</option>`).join("")}</select></label></div>
    <label class="full">Energy today<select name="energy">${["low", "ok", "high"].map((k) => `<option ${inp.energy === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
    <div class="row sticky"><button type="button" class="primary big" id="genBtn">${hasPlan ? (isToday ? "Update plan from now" : "Regenerate day") : "Generate my day 🌻"}</button></div>
  </form>`;
}

function renderSettings() {
  const el = $("#tab-settings"), s = S.settings;
  el.innerHTML = `<form autocomplete="off"><p class="note">Routines are laid down first every day, then your tasks flex around them. One per line: <code>minutes | what</code>.</p>
    <h3>Morning routine</h3><textarea name="morning" rows="6">${esc(P.routineToText(s.morningRoutine))}</textarea>
    <h3>Evening routine</h3><textarea name="evening" rows="4">${esc(P.routineToText(s.eveningRoutine))}</textarea>
    <div class="locs"><label>Lunch<input type="time" name="lunch" value="${s.lunch}"></label><label>Dinner<input type="time" name="dinner" value="${s.dinner}"></label><label>Travel (min)<input type="number" name="travel" min="5" max="90" step="5" value="${s.travelMin}"></label></div>
    <h3>Task backlog <small>suggestions while typing tasks</small></h3><textarea name="backlog" rows="5">${esc(S.backlog.join("\n"))}</textarea>
    <h3>Notion</h3><label class="full"><span>Label for this week's Notion toggle</span><input name="weekLabel" value="${esc(S.weeks[P.weekStart(cur)]?.label || "")}"></label>
    <div class="row sticky"><button type="button" class="primary" id="saveSettings">Save routines</button></div></form>`;
}

/* ───────────── rendering: right (weekly agenda) ───────────── */
function renderWeek() {
  const el = $("#rightPanel"), k = P.weekStart(cur), w = ensureWeek(cur) && S.weeks[k], dates = P.weekDates(k), t0 = today();
  const cards = dates.map((dt) => {
    const dd = S.days[dt], has = dd?.plan, ts = dd ? [...dd.inputs.primary, ...dd.inputs.secondary].filter((t) => t.title) : [];
    const bl = dd?.plan?.blocks || [];
    const st = S.sync[dt]?.status;
    const wins = dd ? dd.inputs.primary.filter((t) => t.title) : [];
    return `<button class="dcard${dt === cur ? " on" : ""}${dt === t0 ? " today" : ""}" data-day="${dt}">
      <div class="dhead"><b>${P.DOW[P.parseISO(dt).getDay()].slice(0, 3)}</b><span>${P.shortDate(dt)}</span>${has ? `<i class="dot ${st || "pending"}" title="Notion: ${st || "pending"}"></i>` : ""}</div>
      ${wins.length ? wins.map((t) => `<div class="wl${P.taskProgress(t, bl) >= 1 ? " ok" : ""}"><em>${P.taskProgress(t, bl) >= 1 ? "🌻" : P.taskProgress(t, bl) > 0 ? "🌼" : "○"}</em>${esc(t.title)}</div>`).join("") : `<div class="wl none">${has ? "" : "no plan yet"}</div>`}
      ${ts.length > wins.length ? `<div class="more">+${ts.length - wins.length} more</div>` : ""}
    </button>`;
  }).join("");
  const conn = server.connected ? "Notion connected" : server.known ? "Preview mode (no NOTION_TOKEN)" : "Server offline";
  el.innerHTML = `<div class="whead"><button id="prevWeek" aria-label="Previous week">‹</button><div><small>Weekly agenda</small><h2>ЩΣΣK ${esc(w.label)}</h2></div><button id="nextWeek" aria-label="Next week">›</button></div>
    <div class="dlist">${cards}</div>
    <div class="wfoot"><label class="switch"><input type="checkbox" id="autosync" ${S.ui.autosync ? "checked" : ""}><span>Auto-sync to Notion</span></label>
      <div class="row"><button id="syncNow" class="primary">Sync week now</button><button id="previewWeek" class="ghost">Preview</button></div>
      <button id="addWeek" class="ghost">＋ Add next week</button>
      <p class="note">${conn}. One-way: dashboard → Notion. Rewrites the to-dos inside each day toggle; your other notes are left alone.</p></div>`;
}

/* ───────────── rendering: focus card ───────────── */
function renderFocus() {
  const el = $("#focusCard");
  if (selected < 0) {
    const d = day();
    el.innerHTML = d.plan ? `<p>Tap a flower to see its schedule. Complete a task and it blooms.</p>` : `<p>Plant your six tasks and watch the greenhouse fill up.</p>`;
    return;
  }
  const t = tasksOf(cur)[selected];
  if (!t || !t.title) { el.innerHTML = `<p>This slot is empty. Add a task in <button class="link" data-go="inputs">Plan the day</button>.</p>`; return; }
  const bl = blocksOf(cur).filter((b) => b.taskId === t.id), pr = P.taskProgress(t, blocksOf(cur));
  el.innerHTML = `<div class="fc"><div><small>${selected < 3 ? "★ Win the day #" + (selected + 1) : "Secondary #" + (selected + 1)}</small><h3>${esc(t.title)}</h3>
    <div class="slots">${bl.length ? bl.map((b) => `<span class="${b.done ? "d" : ""}">${P.pretty(b.start)}–${P.pretty(b.end)}</span>`).join("") : "<em>not scheduled yet</em>"}</div>
    <div class="bar"><b style="width:${Math.round(pr * 100)}%"></b></div></div>
    <button class="primary" data-bloom="${selected}">${pr >= 1 ? "Undo bloom" : "Bloom 🌻"}</button></div>`;
}

/* ───────────── sync ───────────── */
const hashDay = (d) => { const p = S.days[d]?.plan; return p ? JSON.stringify([P.notionHeadline(S.days[d].inputs), P.notionLines(p.blocks)]) : ""; };
function weekPayload(k, force) {
  const dates = P.weekDates(k);
  const days = dates.filter((d) => S.days[d]?.plan && (force || S.sync[d]?.hash !== hashDay(d) || S.sync[d]?.status === "error"))
    .map((d) => ({ date: d, headline: P.notionHeadline(S.days[d].inputs), lines: P.notionLines(S.days[d].plan.blocks) }));
  return { week: weekPayloadMeta(k), knownWeekKeys: Object.keys(S.weeks), days };
}
let syncTimer = null, syncing = false, needsAnother = false;
function scheduleSync() {
  dates().forEach((d) => { if (S.days[d]?.plan && S.sync[d]?.hash !== hashDay(d)) S.sync[d] = { ...S.sync[d], status: "pending" }; });
  save(); renderWeek(); paintPill();
  if (!S.ui.autosync || !server.known) return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => syncWeek(P.weekStart(cur)), 1800);
}
const dates = () => P.weekDates(P.weekStart(cur));

async function syncWeek(k, { force = false, quiet = true } = {}) {
  if (!server.known) { toast("Server not reachable. Start it with `npm start`."); return; }
  if (syncing) { needsAnother = true; return; }
  const payload = weekPayload(k, force);
  const weekIsNew = !S.weeks[k].created && !S.weeks[k].match;
  if (!payload.days.length && !weekIsNew && !force) return;
  syncing = true; paintPill("syncing");
  try {
    const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json());
    if (res.error) throw new Error(res.error);
    if (res.dryRun) payload.days.forEach((d) => (S.sync[d.date] = { hash: hashDay(d.date), status: "preview", at: Date.now() }));
    else {
      S.weeks[k].created = true;
      for (const r of res.results) S.sync[r.date] = r.ok ? { hash: hashDay(r.date), status: "synced", at: Date.now() } : { ...S.sync[r.date], status: "error", error: r.error };
      const bad = res.results.filter((r) => !r.ok);
      if (bad.length) toast(`Notion sync: ${bad.length} day(s) failed. ${bad[0].error}`, 6000);
      else if (!quiet || payload.days.length) toast(`Synced ${payload.days.length} day(s) to Notion ✓`);
    }
  } catch (e) {
    payload.days.forEach((d) => (S.sync[d.date] = { ...S.sync[d.date], status: "error", error: e.message }));
    toast("Notion sync failed: " + e.message, 6000);
  }
  syncing = false; save(); renderWeek(); paintPill();
  if (needsAnother) { needsAnother = false; scheduleSync(); }
}

function paintPill(state) {
  const pill = $("#syncPill"), s = $("span", pill);
  const pend = dates().filter((d) => S.days[d]?.plan && ["pending", "error"].includes(S.sync[d]?.status)).length;
  let cls = "off", txt = "Server offline";
  if (state === "syncing") { cls = "busy"; txt = "Syncing to Notion…"; }
  else if (server.known && !server.connected) { cls = "preview"; txt = "Notion: preview mode"; }
  else if (server.connected) { cls = pend ? "pending" : "ok"; txt = pend ? `${pend} day(s) waiting to sync` : "Notion in sync"; }
  pill.className = "syncpill " + cls; s.textContent = txt;
}

async function checkServer() {
  try { const r = await fetch("/api/status"); const j = await r.json(); server = { known: true, connected: j.connected }; }
  catch { server = { known: false, connected: false }; }
  // auto-add: make sure this week (and, from Friday, next week) exist in Notion
  const k = ensureWeek(today());
  if (new Date().getDay() >= 5) { const nk = ensureWeek(P.addDays(k, 7)); void nk; }
  paintPill(); renderWeek();
  if (server.connected && S.ui.autosync) {
    for (const wk of Object.keys(S.weeks).sort()) {
      if (wk >= P.weekStart(today()) && (!S.weeks[wk].created || Object.keys(weekPayload(wk).days).length)) await syncWeek(wk, { quiet: true });
    }
  }
}

/* ───────────── commit / render ───────────── */
function commit() { save(); renderAll(); scheduleSync(); }
function renderAll() {
  $("#dateLabel").textContent = `${P.DOW[P.parseISO(cur).getDay()]}, ${P.shortDate(cur)}${cur === today() ? " · today" : ""}`;
  $("#datePick").value = cur;
  $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  $$(".tabpane").forEach((p) => p.classList.toggle("on", p.id === "tab-" + tab));
  const active = document.activeElement;
  const typing = active && $("#tab-inputs").contains(active) && /INPUT|TEXTAREA|SELECT/.test(active.tagName);
  renderPlan();
  if (!typing) renderInputs();
  renderWeek(); renderFocus(); pushScene(); paintPill();
}
function goDay(d) { readForm(); cur = d; selected = -1; ensureWeek(d); tab = day(d).plan ? "plan" : "inputs"; renderSettings(); renderAll(); save(); }

/* ───────────── events ───────────── */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, [data-open]"); if (!t) return;
  if (t.dataset.tab) { readForm(); tab = t.dataset.tab; if (tab === "inputs") renderInputs(); renderAll(); return; }
  if (t.dataset.go) { tab = t.dataset.go; renderInputs(); renderAll(); document.body.dataset.view = "plan"; return; }
  if (t.dataset.day) return goDay(t.dataset.day);
  if (t.dataset.carry) { const inp = day().inputs; readForm(); const slot = inp.primary.find((x) => !x.title) || inp.secondary.find((x) => !x.title); if (slot) { slot.title = t.dataset.carry; renderInputs(); } return; }
  if (t.dataset.skip) return skipBlock(t.dataset.skip);
  if (t.dataset.chkBtn) return toggleBlock(t.dataset.chkBtn);
  if (t.dataset.bloom !== undefined) { const i = +t.dataset.bloom, task = tasksOf(cur)[i]; return setTaskDone(i, P.taskProgress(task, blocksOf(cur)) < 1); }
  if (t.dataset.view) { document.body.dataset.view = t.dataset.view; $$(".mobnav button").forEach((b) => b.classList.toggle("on", b === t)); return; }
  if (t.dataset.open !== undefined) { const d = t.querySelector(".blk-desc"); if (d && !e.target.closest("button")) d.hidden = !d.hidden; return; }
  switch (t.id) {
    case "genBtn": return generate();
    case "startOver": if (confirm("Discard this day's plan and start over?")) { day().plan = null; tab = "inputs"; commit(); } return;
    case "ciReplan": { const [h, m] = $("#ciTime").value.split(":").map(Number); day().inputs.energy = $("#ciEnergy").value; return replanNow(h * 60 + m, { energy: $("#ciEnergy").value }); }
    case "ciAddBtn": { const v = $("#ciAdd").value; return addQuickTask(v); }
    case "saveSettings": {
      const f = $("#tab-settings"), s = S.settings;
      s.morningRoutine = P.parseRoutine($('[name="morning"]', f).value); s.eveningRoutine = P.parseRoutine($('[name="evening"]', f).value);
      s.lunch = $('[name="lunch"]', f).value || s.lunch; s.dinner = $('[name="dinner"]', f).value || s.dinner; s.travelMin = +$('[name="travel"]', f).value || s.travelMin;
      S.backlog = $('[name="backlog"]', f).value.split("\n").map((x) => x.trim()).filter(Boolean);
      const lbl = $('[name="weekLabel"]', f).value.trim(); if (lbl) S.weeks[P.weekStart(cur)].label = lbl;
      commit(); toast("Routines saved. Generate or update a day to apply them."); return;
    }
    case "prevDay": return goDay(P.addDays(cur, -1));
    case "nextDay": return goDay(P.addDays(cur, 1));
    case "todayBtn": return goDay(today());
    case "prevWeek": return goDay(P.addDays(cur, -7));
    case "nextWeek": return goDay(P.addDays(cur, 7));
    case "addWeek": { const nk = P.addDays(P.weekStart(cur), 7); ensureWeek(nk); goDay(nk); toast(`Added ЩΣΣK ${S.weeks[nk].label}. All 7 days are ready.`); if (server.connected) syncWeek(nk, { force: true, quiet: false }); return; }
    case "syncNow": { const k = P.weekStart(cur); if (!server.connected) { toast(server.known ? "No NOTION_TOKEN set: showing a preview instead." : "Server offline."); return previewWeek(); } return syncWeek(k, { force: true, quiet: false }); }
    case "previewWeek": return previewWeek();
    case "resetCam": return scene.resetCamera();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.matches("[data-chk]")) return toggleBlock(e.target.dataset.chk);
  if (e.target.id === "autosync") { S.ui.autosync = e.target.checked; save(); if (e.target.checked) scheduleSync(); return; }
  if (e.target.id === "datePick" && e.target.value) return goDay(e.target.value);
  if (e.target.id === "ciNote") { day().inputs.reflection = e.target.value; save(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "ciAdd") { e.preventDefault(); addQuickTask(e.target.value); } });

function previewWeek() {
  const k = P.weekStart(cur), meta = weekPayloadMeta(k);
  const out = [`ЩΣΣK ${meta.label}   (${meta.match ? "links to existing Notion toggle “" + meta.match + "”" : "will be created after the previous week"})`, ""];
  for (const d of meta.dates) {
    out.push(`${P.DOW[P.parseISO(d).getDay()]} [${P.shortDate(d)}]`);
    const dd = S.days[d];
    if (dd?.plan) { const h = P.notionHeadline(dd.inputs); if (h) out.push("  • " + h); P.notionLines(dd.plan.blocks).forEach((l) => out.push(`  [${l.checked ? "x" : " "}] ${l.text}`)); }
    else out.push("  (no plan yet)");
    out.push("");
  }
  modal("Notion preview", out.join("\n"));
}

// tick: keep "now" marker and live block fresh
setInterval(() => { if (cur === today() && !$("#tab-inputs").contains(document.activeElement)) { const y = $("#leftPanel").scrollTop; renderPlan(); $("#leftPanel").scrollTop = y; } }, 60000);

/* ───────────── boot ───────────── */
ensureWeek(cur);
if (day().plan) tab = "plan"; else tab = "inputs";
renderInputs(); renderSettings(); renderAll();
checkServer();
