// Vi's Starmap — day planner engine (pure, no DOM).
// Turns "6 tasks + where I'll be + fixed commitments" into a timestamped,
// energy-aware, buffer-rich day, and can re-plan the remainder mid-day.

export const CELL = 5; // minutes per scheduling cell
const DAY = 24 * 60;

/* ───────────── time helpers ───────────── */
export const hm = (s) => {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(s).trim());
  return m ? Math.min(DAY, +m[1] * 60 + +m[2]) : null;
};
export const pad = (n) => String(n).padStart(2, "0");
export const clock = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
export const pretty = (min) => {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return `${h % 12 || 12}${m ? ":" + pad(m) : ""} ${h < 12 ? "am" : "pm"}`;
};
// Notion style used on Vi's page: 5, 5.30, 12.30 (12-hour, no am/pm)
export const notionTime = (min) => {
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return `${h % 12 || 12}${m ? "." + pad(m) : ""}`;
};
export const dur = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? pad(mins % 60) : ""}` : `${mins}m`);

/* ───────────── date helpers (local, ISO yyyy-mm-dd) ───────────── */
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
export const weekStart = (s) => addDays(s, -parseISO(s).getDay()); // weeks start Sunday, like the Notion page
export const weekDates = (startISO) => Array.from({ length: 7 }, (_, i) => addDays(startISO, i));
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const shortDate = (s) => { const d = parseISO(s); return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`; };

/* ───────────── defaults ───────────── */
export const DEFAULT_SETTINGS = {
  wake: "05:00",
  sleep: "22:30",
  peak: "morning", // morning | afternoon | evening
  lunch: "12:30", lunchMin: 45,
  dinner: "18:30", dinnerMin: 45,
  travelMin: 25,
  morningRoutine: [
    [30, "Art lesson + Frankenstein"],
    [45, "Weights + bands full-body circuit"],
    [15, "2km run on treadmill"],
    [30, "Sunrise run"],
    [30, "Shower + breakfast"],
  ],
  eveningRoutine: [
    [15, "Daily check-in: tick off, reflect, log wins"],
    [10, "Sketch tomorrow's 6 tasks"],
    [30, "Wind down: read Frankenstein, screens off"],
  ],
};

export const LOCATIONS = ["home", "cafe", "school", "library", "outdoors"];

/* ───────────── task kinds → generative guidance ───────────── */
const KIND_RULES = [
  ["essay", /essay|personal statement|supplemental|ucas|common app|draft|write|writing|report/i],
  ["paper", /paper|prelim|exam|mock|past year|practice|esat|tmua|olympiad|drill/i],
  ["study", /study|revise|revision|review|lecture|notes|tutorial|learn|course|homework|read up|memori[sz]e/i],
  ["code", /code|coding|build|debug|website|app\b|program|script|cad|pcb|fusion/i],
  ["creative", /art\b|draw|paint|sketch|design|film|music|edit video/i],
  ["reading", /read|book|novel|article/i],
  ["exercise", /run|gym|workout|swim|tennis|weights|walk/i],
  ["outreach", /email|reply|message|call|meeting|reach out|recommendation|follow.?up|volunteer|stemulate/i],
  ["admin", /admin|form\b|forms|pay\b|payment|fee\b|book\b|register|sign up|submit|organi[sz]e|tidy|clean|laundry|errand|renew/i],
];
export const inferKind = (title) => (KIND_RULES.find(([, re]) => re.test(title)) || ["generic"])[0];

const GUIDE = {
  essay: [
    "Open with a 10-minute skeleton: thesis, three beats, the one story only you can tell. Then draft without editing. Momentum beats polish.",
    "Keep drafting from your skeleton. If stuck, write the sentence you'd say out loud to a friend and clean it later.",
    "Finish the section, then read it aloud once and flag the weakest paragraph for tomorrow's first 10 minutes.",
  ],
  paper: [
    "Exam conditions: phone away, timer on, no peeking at notes. Attempt everything, flag skipped questions.",
    "Mark immediately with the mark scheme. For every lost mark write the cause (concept / careless / time).",
    "Redo the two costliest mistakes from scratch and add them to your error log.",
  ],
  study: [
    "Active recall first: close the notes and write everything you remember, then fill the gaps. Skim last, not first.",
    "Work from your gaps list. Teach the hardest idea out loud as if to a friend.",
    "Do 3 quick test questions on what you just covered and log anything shaky for spaced review.",
  ],
  code: [
    "Define the smallest working slice you'll ship in this block. Write it down, then build only that.",
    "Keep the loop tight: run, break, fix. Commit at every green state.",
    "Wrap up: commit, write two lines on what's next so tomorrow's start is frictionless.",
  ],
  creative: [
    "Start messy: 5 minutes of loose sketches or references before committing to a direction.",
    "Stay in flow. No self-critique until the timer ends.",
    "Step back, pick the strongest piece, photograph or save it, note one thing to push next time.",
  ],
  reading: [
    "Phone in another room. Read one chapter or section, then jot down one line about what struck you.",
    "Keep going; underline or note anything you'd want to quote later.",
    "Write a two-line takeaway before you close the book.",
  ],
  exercise: [
    "Warm up 5 minutes, then hit the session. Log weights or distance as you go.",
    "Steady effort; keep the last set honest, not heroic.",
    "Cool down, stretch, water.",
  ],
  outreach: [
    "Batch the replies: write the shortest useful version, send, and move on. Draft the tricky one first.",
    "Follow up on anything waiting more than 3 days; set a reminder for what's still pending.",
    "Clear the last messages and note who you're waiting on.",
  ],
  admin: [
    "Batch it: list every micro-step, then knock them off fastest first. Done beats perfect.",
    "Keep going; anything over 5 minutes gets its own line for later.",
    "Final sweep and tick off.",
  ],
  generic: [
    "Write the one-sentence outcome for this block, then start with the hardest part while your head is fresh.",
    "Stay on the same thing. If you drift, jot the distraction on a notepad and return.",
    "Finish cleanly and leave a note for your future self about the next step.",
  ],
};

const pickGuide = (kind, i, n) => {
  const g = GUIDE[kind] || GUIDE.generic;
  return n === 1 ? g[0] : i === 0 ? g[0] : i === n - 1 ? g[2] : g[1];
};

export const PLACE_TIP = {
  cafe: "Cafe mode: headphones in, sit facing a wall, one drink per 90 minutes.",
  library: "Library mode: silent zone, phone in your bag, leave notes for the break.",
  school: "At school: use gaps between classes for quick recall, save teacher questions for the end.",
  home: "At home: desk not bed, door closed, phone in another room.",
  outdoors: "Outside: short, light work only; bring water and shade.",
};

const BREAKS = [
  "Stand up, water, look at something far away for 20 seconds.",
  "Walk around the room or block. No phone.",
  "Stretch shoulders and wrists; grab a snack if needed.",
  "Step outside for a minute of daylight.",
];

/* ───────────── parsing helpers for inputs ───────────── */
export function parseFixed(text) {
  // lines like "14:00-15:30 Physics lesson @school"
  return String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = /^(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})\s+(.+?)(?:\s*@\s*(\w+))?$/.exec(line);
    if (!m) return null;
    const start = hm(m[1]), end = hm(m[2]);
    return start != null && end != null && end > start ? { start, end, title: m[3].trim(), loc: (m[4] || "").toLowerCase() || null } : null;
  }).filter(Boolean);
}

export function parseAdmin(text) {
  // lines like "Reply to Ms Seah (10)"; minutes optional, default 10
  return String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = /^(.*?)(?:\s*\((\d{1,3})\s*m?(?:in)?\))?$/.exec(line);
    return { title: m[1].trim(), min: m[2] ? +m[2] : 10 };
  });
}

export function parseRoutine(text) {
  // lines like "30 | Sunrise run"
  return String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = /^(\d{1,3})\s*[|,-]\s*(.+)$/.exec(line);
    return m ? [+m[1], m[2].trim()] : [15, line];
  });
}
export const routineToText = (r) => r.map(([m, t]) => `${m} | ${t}`).join("\n");

/* ───────────── the timeline grid ───────────── */
class Grid {
  constructor(from = 0) {
    this.n = DAY / CELL;
    this.owner = new Array(this.n).fill(null);
    this.loc = new Array(this.n).fill("home");
    this.seg = new Array(this.n).fill("morning");
    for (let i = 0; i < Math.ceil(from / CELL); i++) this.owner[i] = "past";
  }
  free(i) { return i >= 0 && i < this.n && this.owner[i] === null; }
  runFree(startMin, len) {
    const a = Math.floor(startMin / CELL), b = Math.ceil((startMin + len) / CELL);
    for (let i = a; i < b; i++) if (!this.free(i)) return false;
    return b <= this.n;
  }
  take(startMin, len, tag) {
    const a = Math.floor(startMin / CELL), b = Math.ceil((startMin + len) / CELL);
    for (let i = a; i < b && i < this.n; i++) this.owner[i] = tag;
  }
  // earliest free spot >= startMin (search forward, then backward) that fits len
  spot(startMin, len, { forward = 90, backward = 60, before = DAY } = {}) {
    for (let d = 0; d <= forward; d += CELL) {
      const s = startMin + d;
      if (s + len <= before && this.runFree(s, len)) return s;
    }
    for (let d = CELL; d <= backward; d += CELL) {
      const s = startMin - d;
      if (s >= 0 && this.runFree(s, len)) return s;
    }
    return null;
  }
}

const energyAt = (peak, t) => {
  const h = t / 60;
  const curves = {
    morning: h < 12 ? 1 : h < 15 ? 0.7 : h < 18 ? 0.6 : 0.4,
    afternoon: h < 10 ? 0.55 : h < 12 ? 0.8 : h < 14 ? 0.6 : h < 18 ? 1 : 0.55,
    evening: h < 12 ? 0.45 : h < 16 ? 0.6 : h < 19 ? 0.8 : 1,
  };
  return curves[peak] ?? curves.morning;
};

let uid = 0;
const bid = (p) => `${p}-${(++uid).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/* ───────────── core generator ─────────────
 * inputs: { primary:[{id,title,min,kind?,done?,doneWhen?,where?}], secondary:[...], admin:[{title,min}],
 *           fixed:[{start,end,title,loc}], locations:{morning,afternoon,evening}, energy:'low'|'ok'|'high' }
 * opts:   { from: minutes-of-day to plan from, frozen: blocks already committed (kept as-is) }
 */
export function generatePlan(inputs, settings = DEFAULT_SETTINGS, opts = {}) {
  const S = { ...DEFAULT_SETTINGS, ...settings };
  const from = opts.from || 0;
  const frozen = opts.frozen || [];
  const wake = hm(S.wake), sleep = hm(S.sleep);
  const L = { morning: "home", afternoon: "home", evening: "home", ...(inputs.locations || {}) };
  const energy = inputs.energy || "ok";
  const grid = new Grid(from);
  const blocks = [];
  const warnings = [];
  for (let i = 0; i < grid.n; i++) if (i * CELL < wake || i * CELL >= sleep) grid.owner[i] = grid.owner[i] || "night";

  for (const b of frozen) { grid.take(b.start, b.end - b.start, "frozen"); blocks.push(b); }

  const add = (b) => { blocks.push({ id: bid(b.type), done: false, ...b }); };
  const place = (s, len, tag) => grid.take(s, len, tag);

  const fill = !!opts.fill;
  const has = (type, title) => frozen.some((b) => b.type === type && b.title === title);
  const lunchAt = hm(S.lunch), dinnerAt = hm(S.dinner);
  let windStart, routineEnd;
  if (fill) {
    const r = frozen.filter((b) => b.type === "routine");
    const am = r.filter((b) => b.start < 12 * 60), pm = r.filter((b) => b.start >= 12 * 60);
    routineEnd = am.length ? Math.max(...am.map((b) => b.end)) : wake;
    windStart = pm.length ? Math.min(...pm.map((b) => b.start)) : sleep;
  } else {
  // 1) fixed commitments win every conflict
  for (const f of inputs.fixed || []) {
    if (f.start < from || has("fixed", f.title)) continue;
    place(f.start, f.end - f.start, "fixed");
    add({ type: "fixed", start: f.start, end: f.end, title: f.title, loc: f.loc || L.afternoon, desc: "Fixed commitment. Arrive 5 minutes early; everything else flexes around it." });
  }

  // 2) evening wind-down stacked backwards from sleep
  const ev = S.eveningRoutine.map(([m, t]) => ({ m, t }));
  const evTotal = ev.reduce((a, b) => a + b.m, 0);
  windStart = Math.max(wake + 60, sleep - evTotal);
  let t = windStart;
  for (const r of ev) {
    if (t >= from && !has("routine", r.t)) { place(t, r.m, "routine"); add({ type: "routine", start: t, end: t + r.m, title: r.t, loc: "home", desc: "Evening routine. Protect it; tomorrow's energy is built here." }); }
    t += r.m;
  }

  // 3) morning routine from wake
  t = wake;
  for (const r of S.morningRoutine) {
    const [m, title] = r;
    const kept = frozen.find((b) => b.type === "routine" && b.title === title);
    if (kept) { t = Math.max(t, kept.end); continue; }
    const s = t < from ? t : grid.spot(t, m, { forward: 240, backward: 0, before: windStart });
    if (s == null) break;
    if (s >= from) { place(s, m, "routine"); add({ type: "routine", start: s, end: s + m, title, loc: "home", desc: "Morning routine. Non-negotiable; it powers the rest of the day." }); }
    t = s + m;
  }
  routineEnd = t;
  }

  // 4) location segments + travel
  const segs = [
    { name: "morning", loc: L.morning, start: routineEnd, end: lunchAt },
    { name: "afternoon", loc: L.afternoon, start: lunchAt, end: dinnerAt },
    { name: "evening", loc: L.evening, start: dinnerAt, end: windStart },
  ];
  let prevLoc = "home";
  const segLocAt = (m) => (segs.find((s) => m >= s.start && m < s.end) || segs[2]).loc;
  for (const sg of fill ? [] : segs) {
    if (sg.loc !== prevLoc && sg.start >= from) {
      const s = grid.spot(sg.start, S.travelMin, { forward: 60, backward: 0, before: sg.end });
      if (s != null) {
        place(s, S.travelMin, "travel");
        add({ type: "travel", start: s, end: s + S.travelMin, title: `Travel: ${prevLoc} → ${sg.loc}`, loc: sg.loc, desc: `Pack the night before: charger, headphones, water, notebook. Use the ride for a podcast, a flashcard deck, or just quiet.` });
      }
    }
    prevLoc = sg.loc;
  }
  if (!fill && prevLoc !== "home") {
    const s = grid.spot(windStart - S.travelMin, S.travelMin, { forward: 0, backward: 60 });
    if (s != null && s >= from) {
      place(s, S.travelMin, "travel");
      add({ type: "travel", start: s, end: s + S.travelMin, title: `Travel: ${prevLoc} → home`, loc: "home", desc: "Head home in time to actually wind down." });
    }
  }

  // 5) meals
  for (const [title, at, len, key] of fill ? [] : [["Lunch", lunchAt, S.lunchMin, "lunch"], ["Dinner", dinnerAt, S.dinnerMin, "dinner"]]) {
    if (at < from || has("meal", title)) continue; // already happened or kept as set
    const s = grid.spot(at, len, { forward: 90, backward: 60, before: windStart });
    if (s != null && s >= from) {
      place(s, len, "meal");
      add({ type: "meal", start: s, end: s + len, title, loc: segLocAt(s), desc: key === "lunch" ? "Eat properly, step away from the screen, get some daylight." : "Proper meal, no work. Let your head reset for the evening." });
    }
  }

  // stamp location on every free cell
  for (const sg of segs) {
    for (let i = Math.floor(sg.start / CELL); i < Math.ceil(sg.end / CELL) && i < grid.n; i++) { grid.loc[i] = sg.loc; grid.seg[i] = sg.name; }
  }
  for (let i = 0; i < Math.floor(routineEnd / CELL); i++) grid.loc[i] = "home";
  for (let i = Math.floor(windStart / CELL); i < grid.n; i++) { grid.loc[i] = "home"; grid.seg[i] = "evening"; }

  // 6) tasks → chunks
  const remaining = (task) => Math.max(0, task.min - (opts.doneMin?.[task.id] || 0));
  const scale2 = energy === "low" ? 0.75 : 1;
  const chunkMax = energy === "low" ? 60 : 90;
  const jobs = [];
  const mk = (task, tier, order) => {
    if (!task || !task.title || task.done) return;
    let m = remaining(task);
    if (tier === "secondary") m = Math.max(15, Math.round((m * scale2) / 5) * 5);
    if (m <= 0) return;
    const kind = task.kind && task.kind !== "auto" ? task.kind : inferKind(task.title);
    const n = m > chunkMax + 15 ? Math.ceil(m / chunkMax) : 1;
    const each = Math.round(m / n / 5) * 5 || 5;
    const chunks = Array.from({ length: n }, (_, i) => (i === n - 1 ? Math.max(5, m - each * (n - 1)) : each));
    jobs.push({ task, tier, order, kind, chunks, deep: tier === "primary" || ["essay", "paper", "study", "code"].includes(kind) });
  };
  (inputs.primary || []).forEach((t, i) => mk(t, "primary", i));
  (inputs.secondary || []).forEach((t, i) => mk(t, "secondary", i));

  const adminItems = (inputs.admin || []).filter((a) => a.title && !a.done);
  const adminTotal = adminItems.reduce((a, b) => a + (b.min || 10), 0);

  // keep at least 45 minutes free for flex; squeeze secondaries if needed
  const freeCells = grid.owner.filter((o) => o === null).length * CELL;
  const need = () => jobs.reduce((a, j) => a + j.chunks.reduce((x, y) => x + y + 10, 0), 0) + (adminTotal ? adminTotal + 10 : 0);
  let guard = 0;
  while (need() > freeCells - 45 && guard++ < 40) {
    const sec = jobs.filter((j) => j.tier === "secondary" && j.chunks.reduce((a, b) => a + b, 0) > 30).sort((a, b) => b.chunks[0] - a.chunks[0])[0];
    if (!sec) break;
    sec.chunks = sec.chunks.map((c) => Math.max(15, c - 10)).filter((_, i) => i < 1 || true);
  }

  const findRun = (len, scorer, pref, needBreak) => {
    let best = null;
    for (let i = 0; i + len / CELL <= grid.n; i++) {
      const s = i * CELL;
      const brk = needBreak ? 10 : 0;
      if (!grid.runFree(s, len)) continue;
      const l0 = grid.loc[i];
      let ok = true, sc = 0;
      for (let k = 0; k < len / CELL; k++) { if (grid.loc[i + k] !== l0) { ok = false; break; } sc += scorer(s + k * CELL); }
      if (!ok) continue;
      sc /= len / CELL;
      if (pref && pref !== "any" && l0 !== pref) sc -= 0.25;
      if (needBreak && !grid.runFree(s + len, brk)) sc -= 0.02; // slight preference for a break slot
      sc -= (s / DAY) * 0.03; // tie-break earlier
      if (!best || sc > best.sc) best = { s, sc, loc: l0 };
    }
    return best;
  };

  // earliest free run of `len` minutes at one location, starting at or after `min`, optionally inside a part of the day
  const findSeq = (len, pref, min) => {
    const cells = len / CELL;
    for (let i = Math.ceil(Math.max(min, wake, from) / CELL); i + cells <= grid.n; i++) {
      if (!grid.runFree(i * CELL, len)) continue;
      const l0 = grid.loc[i];
      let ok = true;
      for (let k = 0; k < cells; k++) if (grid.loc[i + k] !== l0 || (pref && grid.seg[i + k] !== pref)) { ok = false; break; }
      if (ok) return { s: i * CELL, loc: l0 };
    }
    return null;
  };
  const overflow = [];
  // tasks with a chosen part of the day claim it first; the rest follow priority order through the day
  const hasPref = (j) => ["morning", "afternoon", "evening"].includes(j.task.when);
  const order = [...jobs].sort((a, b) => (hasPref(b) - hasPref(a)) || (a.tier === b.tier ? a.order - b.order : a.tier === "primary" ? -1 : 1));
  let breakN = 0, cursor = Math.max(routineEnd, from);
  for (const job of order) {
    const pref = ["morning", "afternoon", "evening"].includes(job.task.when) ? job.task.when : null;
    job.chunks.forEach((len, ci) => {
      const run = (pref && findSeq(len, pref, from)) || findSeq(len, null, pref ? from : cursor) || findSeq(len, null, from);
      if (!run) { overflow.push({ task: job.task, min: len }); return; }
      place(run.s, len, "task");
      if (!pref) cursor = Math.max(cursor, run.s + len);
      const n = job.chunks.length;
      const tag = job.tier === "primary" ? `Win the day #${job.order + 1}` : `Also #${job.order + 1}`;
      add({
        type: job.tier, start: run.s, end: run.s + len, title: job.task.title, loc: run.loc, taskId: job.task.id, chunk: n > 1 ? `${ci + 1}/${n}` : null, kind: job.kind, tag,
        tip: ci === 0 ? job.task.tip || null : null,
        desc: pickGuide(job.kind, ci, n) + (ci === 0 && PLACE_TIP[run.loc] ? " " + PLACE_TIP[run.loc] : "") + (job.task.doneWhen ? ` Done when: ${job.task.doneWhen}.` : ""),
      });
      if (grid.runFree(run.s + len, 10)) {
        place(run.s + len, 10, "break");
        add({ type: "break", start: run.s + len, end: run.s + len + 10, title: "Break", loc: run.loc, desc: BREAKS[breakN++ % BREAKS.length] });
        if (!pref) cursor = Math.max(cursor, run.s + len + 10);
      }
    });
  }

  // small admin, batched in a low-energy window
  if (adminItems.length) {
    const total = Math.min(adminTotal, 90);
    const run = findRun(Math.ceil(total / 5) * 5, (m) => 1 - energyAt(S.peak, m), "any", false);
    if (run) {
      const len = Math.ceil(total / 5) * 5;
      place(run.s, len, "admin");
      add({
        type: "admin", start: run.s, end: run.s + len, title: `Admin sweep (${adminItems.length})`, loc: run.loc,
        items: adminItems.map((a) => a.title), tag: "Small admin",
        desc: adminItems.map((a) => `• ${a.title} (${a.min || 10}m)`).join("\n"),
      });
    } else overflow.push({ task: { title: "Admin sweep" }, min: adminTotal });
  }

  // leftover → flex buffers ("room to adjust")
  let runStart = null;
  const flush = (endCell) => {
    if (runStart == null) return;
    const s = runStart * CELL, e = endCell * CELL, len = e - s;
    if (len >= 15) add({ type: "flex", start: s, end: e, title: len >= 40 ? "Flex buffer" : "Buffer", loc: grid.loc[runStart], desc: len >= 40 ? "Room to adjust: spillover from earlier blocks, an unexpected errand, or real rest. If nothing spilled, use it for your next most useful thing." : "Short buffer. Absorbs overruns and gives you a moment to breathe." });
    runStart = null;
  };
  for (let i = Math.ceil(Math.max(from, wake) / CELL); i < Math.floor(sleep / CELL); i++) {
    if (grid.owner[i] === null) { if (runStart == null) runStart = i; } else flush(i);
  }
  flush(Math.floor(sleep / CELL));

  blocks.sort((a, b) => a.start - b.start || a.end - b.end);
  if (overflow.length) warnings.push(...overflow.map((o) => `Not enough room for “${o.task.title}” (${o.min}m). Move it to tomorrow or shrink something.`));

  const focusMin = blocks.filter((b) => ["primary", "secondary"].includes(b.type) && !b.frozen).reduce((a, b) => a + b.end - b.start, 0);
  const flexMin = blocks.filter((b) => b.type === "flex").reduce((a, b) => a + b.end - b.start, 0);
  return { blocks, warnings, overflow, stats: { focusMin, flexMin, wake, sleep, windStart } };
}

/* ───────────── progress helpers ───────────── */
export const doneMinutes = (blocks) => {
  const out = {};
  for (const b of blocks) if (b.taskId && b.done) out[b.taskId] = (out[b.taskId] || 0) + b.end - b.start;
  return out;
};
export function taskProgress(task, blocks) {
  if (!task || !task.title) return 0;
  if (task.done) return 1;
  const mine = blocks.filter((b) => b.taskId === task.id);
  const tot = mine.reduce((a, b) => a + b.end - b.start, 0);
  if (!tot) return 0;
  return mine.filter((b) => b.done).reduce((a, b) => a + b.end - b.start, 0) / tot;
}

/* Re-plan the rest of the day from `now`. Keeps whatever already happened. */
export function replan(inputs, settings, prevBlocks, now) {
  // keep what happened (and what's happening); unfinished task blocks from earlier get rescheduled, not duplicated
  const isTask = (b) => ["primary", "secondary", "admin"].includes(b.type);
  const frozen = dropOrphanBreaks(prevBlocks.filter((b) => b.done || b.locked || (b.end <= now && !isTask(b)) || (b.start < now && b.end > now)));
  const done = doneMinutes(frozen.map((b) => (b.locked ? { ...b, done: true } : b)));
  // tasks already fully done, or marked done, don't return
  const p = (arr) => (arr || []).map((t) => ({ ...t, done: t.done || (done[t.id] || 0) >= t.min }));
  const next = { ...inputs, primary: p(inputs.primary), secondary: p(inputs.secondary) };
  const from = Math.ceil(now / CELL) * CELL;
  const keep = frozen.map((b) => ({ ...b }));
  // undone admin items stay in play unless the sweep block was done
  const adminDone = frozen.some((b) => b.type === "admin" && b.done);
  next.admin = adminDone ? [] : inputs.admin;
  return generatePlan(next, settings, { from, frozen: keep, doneMin: done });
}

/* ───────────── Notion text (also used for the dry-run preview) ───────────── */
const TAGS = { primary: "🌻", secondary: "🌼", admin: "🗂️", travel: "🚌", flex: "🌿", break: "☕", fixed: "📌", meal: "🍽️", routine: "" };
export function notionLines(blocks) {
  return blocks
    .filter((b) => b.type !== "break" || b.end - b.start >= 15)
    .map((b) => {
      const icon = TAGS[b.type] ? TAGS[b.type] + " " : "";
      const chunk = b.chunk ? ` (${b.chunk})` : "";
      return { text: `[${notionTime(b.start)}-${notionTime(b.end)}] ${icon}${b.title}${chunk}`, checked: !!b.done };
    });
}
export const notionHeadline = (inputs) => {
  const wins = (inputs.primary || []).filter((t) => t.title).map((t) => t.title);
  return wins.length ? `🌻 Win the day: ${wins.join(" · ")}` : null;
};

/* ───────────── manual schedule editing (pure) ─────────────
 * "Items" are what the person reorders: a run of routine steps, a task chunk with the
 * break that follows it, or any single block. Flex buffers are free time and are
 * recomputed after every edit.
 */
const clone = (blocks) => blocks.map((b) => ({ ...b }));
export function itemsOf(blocks) {
  const out = [];
  for (const b of [...blocks].filter((b) => b.type !== "flex").sort((a, b) => a.start - b.start)) {
    const last = out[out.length - 1];
    const joinRoutine = b.type === "routine" && last?.kind === "routine" && last.end === b.start;
    const joinBreak = b.type === "break" && last && ["primary", "secondary", "admin"].includes(last.kind) && last.end === b.start && last.blocks.length === 1;
    if (joinRoutine || joinBreak) { last.blocks.push(b); last.end = b.end; continue; }
    out.push({ key: b.id, kind: b.type, start: b.start, end: b.end, blocks: [b] });
  }
  return out;
}
const shiftItem = (it, d) => { it.blocks.forEach((b) => { b.start += d; b.end += d; }); it.start += d; it.end += d; };
const flatten = (items) => items.flatMap((it) => it.blocks).sort((a, b) => a.start - b.start);

/* Fixed plans and the night routine hold their place; everything else flows around them. */
const anchored = (it) => it.kind === "fixed" || (it.kind === "routine" && it.start >= 18 * 60) || it.blocks.some((b) => b.locked);
/* Push later items forward so nothing overlaps. `pinKey` keeps its time; anchored items never move. */
export function resolve(items, pinKey = null) {
  const isFixed = (it) => it.key === pinKey || anchored(it);
  const fixed = items.filter(isFixed);
  const mov = items.filter((it) => !isFixed(it)).sort((a, b) => a.start - b.start);
  let cursor = -Infinity;
  for (const it of mov) { // keep order and gaps; bump past anything with a set time
    const len = it.end - it.start;
    let s = Math.max(it.start, cursor);
    for (let g = 0; g < 60; g++) { const hit = fixed.find((f) => f.start < s + len && f.end > s); if (!hit) break; s = hit.end; }
    shiftItem(it, s - it.start);
    cursor = it.end;
  }
  return items.sort((a, b) => a.start - b.start);
}

/* Move an item up (-1) or down (+1) in the day: the two swap places within the span they share. */
export function moveItem(blocks, key, dir) {
  const items = itemsOf(clone(blocks));
  const i = items.findIndex((it) => it.key === key), j = i + dir;
  if (i < 0 || j < 0 || j >= items.length) return blocks;
  if (anchored(items[j])) return blocks; // never displace something with a set time
  const [a, b] = dir > 0 ? [items[i], items[j]] : [items[j], items[i]]; // a is earlier
  const gap = b.start - a.end, aLen = a.end - a.start;
  const start = a.start;
  shiftItem(b, start - b.start);
  shiftItem(a, b.end + Math.max(0, gap) - a.start);
  void aLen;
  return flatten(resolve(items, b.key));
}

/* Set an item's start (and, for a single block, its end) and push what follows. */
export function setItemTime(blocks, key, start, end = null) {
  const items = itemsOf(clone(blocks));
  const it = items.find((x) => x.key === key);
  if (!it) return blocks;
  if (end != null && it.blocks.length === 1 && end > start) { it.blocks[0].start = start; it.blocks[0].end = end; it.start = start; it.end = end; }
  else shiftItem(it, start - it.start);
  it.blocks.forEach((b) => (b.locked = true)); // a time Vi sets is kept exactly
  return flatten(resolve(items, key));
}

/* Shift every unfinished item starting at/after `fromMin` by `delta` minutes (fixed commitments stay). */
export function shiftFrom(blocks, fromMin, delta) {
  const items = itemsOf(clone(blocks));
  const first = items.find((it) => it.end > fromMin && !it.blocks.every((b) => b.done) && !anchored(it));
  if (!first) return blocks;
  shiftItem(first, delta);
  return flatten(resolve(items, first.key));
}

export function removeItem(blocks, key) {
  const items = itemsOf(clone(blocks)).filter((it) => it.key !== key);
  return flatten(items);
}

/* A break only makes sense straight after a piece of work. */
export function dropOrphanBreaks(blocks) {
  const work = blocks.filter((b) => ["primary", "secondary", "admin"].includes(b.type));
  return blocks.filter((b) => b.type !== "break" || b.done || work.some((w) => w.end === b.start));
}
/* Recompute flex buffers in every gap of 15+ minutes between wake and sleep. */
export function refillFlex(blocks, settings = DEFAULT_SETTINGS) {
  const S = { ...DEFAULT_SETTINGS, ...settings };
  const wake = hm(S.wake), sleep = hm(S.sleep);
  const rest = dropOrphanBreaks(clone(blocks).filter((b) => b.type !== "flex")).sort((a, b) => a.start - b.start);
  const out = [...rest];
  let t = wake;
  const gap = (s, e) => { if (e - s >= 15) out.push({ id: bid("flex"), type: "flex", start: s, end: e, title: e - s >= 40 ? "Flex buffer" : "Buffer", loc: "home", done: false, desc: e - s >= 40 ? "Room to adjust: spillover, an errand, or real rest." : "Short buffer to breathe." }); };
  for (const b of rest) { if (b.start > t) gap(t, Math.min(b.start, sleep)); t = Math.max(t, b.end); }
  if (t < sleep) gap(t, sleep);
  return out.sort((a, b) => a.start - b.start || a.end - b.end);
}
