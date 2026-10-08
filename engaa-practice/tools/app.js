(() => {
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const AVAILABLE = {2016: 41, 2017: 41, 2018: 41, 2019: 30, 2020: 30, 2021: 30, 2022: 30, 2023: 30};
const PER_Q = 85;
const ESAT_SEC = 2400, ESAT_PACE = 89;
const SRC = {E: 'ENGAA', N: 'NSAA', T: 'TMUA'};
const BANK = {L: 'Unused ESAT questions', A: 'All ESAT questions', E: 'ENGAA questions'};
const TOPIC = {M: 'Maths', P: 'Physics'};
const DIFF = {E: 'Easy', M: 'Medium', H: 'Hard'};
const app = document.getElementById('app');

/* ---------- storage: account db when available, browser storage as fallback/cache ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
let attempts = LS.get('engaa.attempts', []);
let active = LS.get('engaa.active', null);
let speedPrefs = Object.assign({topic: 'M', diff: 'E', bank: 'L'}, LS.get('engaa.speedPrefs', {}));
let dbCol = null;
let syncLabel = 'Saved in this browser';

async function initDb() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id();
    if (!id) return;
    dbCol = db.collection('data/users/' + id);
    const snap = await dbCol.get();
    const docs = snap.docs.map(d => ({id: d.id, data: d.data()}));
    const remote = docs.filter(d => d.id !== 'current').map(d => d.data).filter(a => a && a.id && a.qns);
    const cur = docs.find(d => d.id === 'current')?.data;
    if (cur && (cur.updatedAt || 0) > ((active && active.updatedAt) || 0)) {
      active = cur.active || null;
      if (active) LS.set('engaa.active', active); else LS.del('engaa.active');
    } else if (active) pushActive(true);
    const byId = new Map(remote.map(a => [a.id, a]));
    for (const a of attempts) if (!byId.has(a.id)) { byId.set(a.id, a); try { await dbCol.doc(a.id).set(a); } catch (e) {} }
    attempts = [...byId.values()].sort((a, b) => a.finishedAt - b.finishedAt);
    LS.set('engaa.attempts', attempts);
    syncLabel = 'Synced to your account';
    if (view.name !== 'test') render();
    else { const s = document.querySelector('.sync'); if (s) s.textContent = syncLabel; }
  } catch (e) { /* stay on browser storage */ }
}
async function persistAttempt(a) {
  attempts.push(a);
  LS.set('engaa.attempts', attempts);
  if (dbCol) { try { await dbCol.doc(a.id).set(a); } catch (e) { syncLabel = 'Saved in this browser (account sync failed)'; } }
}

/* ---------- paper data ---------- */
/* papers are keyed "E2016" (ENGAA), "N2016" (NSAA maths & physics), "T2016" (TMUA paper 1); a question's global id is "N2019-12" */
const papers = {};
async function loadPaper(key) {
  if (!papers[key]) {
    const el = document.getElementById('paper-' + key);
    if (!el) throw new Error('The ' + key + ' paper is missing from this page.');
    papers[key] = JSON.parse(el.textContent);
  }
  return papers[key];
}
const readJson = id => JSON.parse(document.getElementById(id).textContent);
let meta = null, esatMeta = null, mocks = null;
const loadMeta = async () => { if (!meta) { meta = readJson('meta').map(([y, n, t, d]) => ['E' + y + '-' + n, t, d, 'E', 0]); esatMeta = readJson('esatmeta'); mocks = readJson('mocks'); } return meta; };
const parseGid = g => { const m = /^([ENT])(\d{4})-(\d+)$/.exec(g); return {src: m[1], year: +m[2], n: +m[3], key: m[1] + m[2]}; };
const Q = g => { const p = parseGid(g); return papers[p.key] && papers[p.key].find(q => q.n === p.n); };
/* attempts store ids differently: ENGAA paper attempts use plain question numbers, older speed sets "2016-12", newer sets and mocks global ids */
const isSpeed = a => a.mode === 'speed';
const isEsat = a => a.mode === 'esat';
const isEngaaPaper = a => a.mode === 'full' || a.mode === 'mistakes';
const gidOf = (a, id) => isEngaaPaper(a) ? 'E' + a.year + '-' + id : /^\d{4}-\d+$/.test(String(id)) ? 'E' + id : String(id);
const qOf = (a, id) => Q(gidOf(a, id));
const yearOf = (a, id) => parseGid(gidOf(a, id)).year;
const numOf = (a, id) => parseGid(gidOf(a, id)).n;
const srcOf = (a, id) => SRC[parseGid(gidOf(a, id)).src];
const ensureLoaded = a => Promise.all([...new Set(a.qns.map(id => parseGid(gidOf(a, id)).key))].map(loadPaper));
const paceOf = a => isEsat(a) ? ESAT_PACE : isSpeed(a) ? null : PER_Q;
const secRange = a => { const s = a.secStarts[a.sec]; return [s, a.secStarts[a.sec + 1] ?? a.qns.length]; };

/* ---------- helpers ---------- */
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const fmtClock = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmtShort = s => { s = Math.round(s || 0); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const dateStr = t => new Date(t).toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: 'numeric'}) + ', ' + new Date(t).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
const fullAttempts = y => attempts.filter(a => a.year === y && a.mode === 'full');
const mockAttempts = k => attempts.filter(a => a.mode === 'esat' && a.mock === k);
const lastFull = y => fullAttempts(y).sort((a, b) => b.finishedAt - a.finishedAt)[0];
const mistakesOf = a => a.qns.filter(n => a.answers[n] !== a.key[n]);
const newId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const speedLabel = s => `${s.bank ? BANK[s.bank] : 'ENGAA questions'} · ${s.topic === 'B' ? 'Maths + Physics' : TOPIC[s.topic]} · ${s.diff === 'X' ? 'Mixed difficulty' : DIFF[s.diff]}`;
const modeLabel = a => a.mode === 'full' ? 'ENGAA paper' : a.mode === 'mistakes' ? 'ENGAA mistakes retry' : a.mode === 'esat' ? 'ESAT mock' : 'Speed practice';
const attemptTitle = a => isEsat(a) ? (mocks?.[a.mock]?.name || 'ESAT mock') : isSpeed(a) ? 'Speed practice' : 'ENGAA ' + a.year;

let view = {name: 'dash'};
let timerId = null;

function go(v) { view = v; render(); window.scrollTo(0, 0); }

function render() {
  clearInterval(timerId); timerId = null;
  document.querySelector('.timer')?.remove();
  document.body.classList.toggle('testing', view.name === 'test');
  if (view.name === 'test') return renderTest();
  if (view.name === 'review') return renderReview();
  renderDash();
}

function topbar(right = '') {
  return `<header class="topbar"><div class="brand"><h1>ESAT &amp; ENGAA Practice</h1><span class="code">Maths 1 · Physics · Maths 2</span></div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="sync">${esc(syncLabel)}</span>${right}</div></header>`;
}

/* ---------- dashboard ---------- */
function speedPool(p) {
  const bank = p.bank || 'E';
  const src = bank === 'E' ? (meta || []) : (esatMeta || []).filter(r => bank === 'A' || r[4]);
  return src.filter(([g, t, d]) => (p.topic === 'B' || t === p.topic) && (p.diff === 'X' || d === p.diff)).map(r => r[0]);
}
function renderDash() {
  if (!meta) { app.innerHTML = topbar() + '<div class="empty">Loading question bank…</div>'; loadMeta().then(() => { if (view.name === 'dash') renderDash(); }).catch(e => { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)}</div>`; }); return; }
  const full = attempts.filter(a => a.mode === 'full');
  const mk = attempts.filter(a => a.mode === 'esat');
  const doneE = new Set(full.map(a => a.year)), doneM = new Set(mk.map(a => a.mock));
  const bestMock = mk.length ? Math.max(...mk.map(a => pct(a.score, a.total))) : null;
  const latestMistakes = Object.keys(AVAILABLE).reduce((s, y) => { const a = lastFull(+y); return s + (a ? mistakesOf(a).length : 0); }, 0);
  const lock = active ? 'disabled title="Finish or discard the test in progress first"' : '';

  let html = topbar();
  if (active) {
    const sp = isSpeed(active), es = isEsat(active), pz = !!active.pausedAt;
    const what = sp ? 'Speed practice · ' + speedLabel(active.settings) : es ? `${mocks[active.mock].name} · Section ${active.sec + 1} of 3 (${active.secNames[active.sec]})` : active.year + (active.mode === 'mistakes' ? ' ENGAA mistakes retry' : ' ENGAA paper');
    html += `<div class="resume"><div><div class="eyebrow">${pz ? 'Paused' : sp ? 'Practice in progress' : 'Test in progress'}</div><div style="margin-top:4px"><b>${esc(what)}</b> · ${Object.keys(active.answers).length}/${active.qns.length} answered · ${sp ? `<span class="mono">${fmt(elapsedOf(active))}</span> elapsed` : `<span class="mono">${fmt(remainingOf(active))}</span> left${es ? ' in this section' : ''}`}${pz ? '. The clock is stopped until you resume.' : sp ? '' : '. The clock is still running.'}</div></div>
      <div style="display:flex;gap:8px"><button class="btn primary" data-act="resume">Resume</button><button class="btn ghost" data-act="abandon">Discard</button></div></div>`;
  }
  html += `<section class="summary" aria-label="Overview">
    <div><span class="eyebrow">ESAT mocks sat</span><b>${doneM.size}<span class="muted" style="font-size:16px">/${mocks.length}</span></b></div>
    <div><span class="eyebrow">Best mock</span><b>${bestMock === null ? '–' : bestMock + '%'}</b></div>
    <div><span class="eyebrow">ENGAA papers sat</span><b>${doneE.size}<span class="muted" style="font-size:16px">/${Object.keys(AVAILABLE).length}</span></b></div>
    <div><span class="eyebrow">Open ENGAA mistakes</span><b>${latestMistakes}</b></div></section>`;

  html += `<div class="section-h"><h2>ESAT mocks</h2><span class="note">Three timed sections of 27 questions and 40 minutes each: Mathematics 1 and Physics from NSAA, Mathematics 2 from TMUA.</span></div><div class="years mocks">`;
  mocks.forEach((m, k) => {
    const ma = mockAttempts(k), last = ma.sort((a, b) => b.finishedAt - a.finishedAt)[0];
    const bestP = ma.length ? Math.max(...ma.map(a => pct(a.score, a.total))) : null;
    const yrs = [...new Set(m.sections.flatMap(s => s.qns.map(g => parseGid(g).year)))].sort();
    html += `<article class="card"><div class="yr"><h3>Mock ${k + 1}</h3><span class="mono muted" style="font-size:13px">81 Qs · 2:00:00</span></div>
      <div class="meter" title="Best score"><i style="width:${bestP || 0}%"></i></div>
      <dl class="kv"><dt>Best</dt><dd>${bestP === null ? '–' : bestP + '%'}</dd><dt>Last</dt><dd>${last ? last.score + '/' + last.total : '–'}</dd><dt>Attempts</dt><dd>${ma.length}</dd></dl>
      <div class="note" style="font-size:12px">Questions from ${yrs[0]}–${yrs[yrs.length - 1]}</div>
      <div class="acts"><button class="btn primary small" data-act="mock" data-k="${k}" ${lock}>${ma.length ? 'Retake' : 'Start'}</button>
      ${last ? `<button class="btn small" data-act="review" data-id="${last.id}">Review</button>` : ''}</div></article>`;
  });
  html += `</div>`;

  const pool = speedPool(speedPrefs).length;
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="pref" data-k="${key}" data-v="${v}" class="${String(speedPrefs[key]) === String(v) ? 'on' : ''}" aria-pressed="${String(speedPrefs[key]) === String(v)}">${l}</button>`).join('')}</div>`;
  html += `<div class="section-h"><h2>Speed practice</h2><span class="note">Untimed. One random question at a time, marked as soon as you answer. By default it draws on the NSAA and TMUA questions that aren't in any mock.</span></div>
  <section class="speed">
    <div class="opts">
      <div class="field"><span class="eyebrow">Questions from</span>${seg('bank', [['L', 'Unused ESAT'], ['A', 'All ESAT'], ['E', 'ENGAA']])}</div>
      <div class="field"><span class="eyebrow">Topic</span>${seg('topic', [['M', 'Maths'], ['P', 'Physics'], ['B', 'Both']])}</div>
      <div class="field"><span class="eyebrow">Difficulty</span>${seg('diff', [['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard'], ['X', 'Mixed']])}</div>
    </div>
    <div class="go"><span class="note mono">${pool} questions in this set</span>
      <button class="btn primary" data-act="speed" ${active || !pool ? 'disabled' : ''}>Start speed practice</button></div>
  </section>`;

  html += `<div class="section-h"><h2>ENGAA past papers</h2><span class="note">Questions crossed out in the papers are removed. You get ${PER_Q} s per question.</span></div><div class="years">`;
  for (const y of YEARS) {
    const n = AVAILABLE[y];
    const fa = fullAttempts(y), last = lastFull(y);
    const bestP = fa.length ? Math.max(...fa.map(a => pct(a.score, a.total))) : null;
    const mist = last ? mistakesOf(last).length : 0;
    html += `<article class="card"><div class="yr"><h3>${y}</h3><span class="mono muted" style="font-size:13px">${n} Qs · ${fmt(n * PER_Q)}</span></div>
      <div class="meter" title="Best score"><i style="width:${bestP || 0}%"></i></div>
      <dl class="kv"><dt>Best</dt><dd>${bestP === null ? '–' : bestP + '%'}</dd><dt>Last</dt><dd>${last ? last.score + '/' + last.total : '–'}</dd><dt>Attempts</dt><dd>${fa.length}</dd></dl>
      <div class="acts"><button class="btn primary small" data-act="start" data-y="${y}" ${lock}>${fa.length ? 'Retake' : 'Start'}</button>
      ${last ? `<button class="btn small" data-act="review" data-id="${last.id}">Review</button>` : ''}
      ${mist ? `<button class="btn small" data-act="retry" data-y="${y}" ${active ? 'disabled' : ''}>Retry ${mist} mistake${mist > 1 ? 's' : ''}</button>` : ''}</div></article>`;
  }
  html += `</div>`;

  html += `<div class="section-h"><h2>Attempt history</h2></div>`;
  if (!attempts.length) {
    html += `<div class="tbl-wrap"><div class="empty">No attempts yet. Start an ESAT mock or an ENGAA paper above. Your marks and mistakes will appear here.</div></div>`;
  } else {
    html += `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Paper</th><th>Mode</th><th>Score</th><th>Breakdown</th><th>Time used</th><th></th></tr></thead><tbody>`;
    for (const a of [...attempts].sort((x, z) => z.finishedAt - x.finishedAt)) {
      html += `<tr><td>${dateStr(a.finishedAt)}</td><td>${esc(attemptTitle(a))}</td><td>${modeLabel(a)}${isSpeed(a) ? ` <span class="muted">· ${esc(speedLabel(a.settings))}</span>` : ''}</td>
        <td class="num"><b>${a.score}/${a.total}</b> <span class="muted">${pct(a.score, a.total)}%</span></td>
        <td class="num">${breakdown(a).map(b => `${b.label} ${b.s}/${b.t}`).join(' · ') || '–'}</td>
        <td class="num">${fmt(a.used)}${a.limit ? ' / ' + fmt(isEsat(a) ? a.limit * 3 : a.limit) : ''}${a.timedOut ? ' <span class="pill flag">Time up</span>' : ''}</td>
        <td><button class="btn small" data-act="review" data-id="${a.id}">Review</button></td></tr>`;
    }
    html += `</tbody></table></div>`;
  }
  app.innerHTML = html;
}
/* per-part scores: ENGAA Part A/B, mock sections, or maths/physics for speed sets */
function breakdown(a) {
  if (isEsat(a)) return (a.sections || []).map(s => ({label: s.short, ...partScore(a, s.name)}));
  if (isSpeed(a)) return [['Maths', 'M'], ['Physics', 'P']].map(([l, t]) => ({label: l, ...topicScore(a, t)})).filter(b => b.t);
  return [['A', 'A'], ['B', 'B']].map(([l, p]) => ({label: 'Part ' + l, ...partScore(a, p)})).filter(b => b.t);
}
function partScore(a, p) {
  let s = 0, t = 0;
  for (const n of a.qns) if ((a.parts || {})[n] === p) { t++; if (a.answers[n] === a.key[n]) s++; }
  return {s, t};
}
function topicScore(a, t) {
  let s = 0, c = 0;
  for (const id of a.qns) { const qt = (a.topics || {})[id] || qOf(a, id)?.t; if (qt === t) { c++; if (a.answers[id] === a.key[id]) s++; } }
  return {s, t: c};
}

/* ---------- test ---------- */
async function startTest(y, mode) {
  app.innerHTML = topbar() + `<div class="empty">Loading the ${y} paper…</div>`;
  let data;
  try { data = await loadPaper('E' + y); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} Check your connection and try again. <button class="btn small" data-act="home">Back</button></div>`; return; }
  let qns = data.map(q => q.n);
  if (mode === 'mistakes') { const last = lastFull(y); qns = last ? mistakesOf(last) : []; }
  if (!qns.length) return go({name: 'dash'});
  const now = Date.now();
  active = {id: newId(), year: y, mode, qns, answers: {}, flags: [], idx: 0, startedAt: now, limit: qns.length * PER_Q, deadline: now + qns.length * PER_Q * 1000};
  LS.set('engaa.active', active);
  go({name: 'test'});
}
async function startMock(k) {
  app.innerHTML = topbar() + `<div class="empty">Loading the mock…</div>`;
  await loadMeta();
  const m = mocks[k];
  const qns = m.sections.flatMap(s => s.qns);
  try { await Promise.all([...new Set(qns.map(g => parseGid(g).key))].map(loadPaper)); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} <button class="btn small" data-act="home">Back</button></div>`; return; }
  const starts = []; let c = 0; for (const s of m.sections) { starts.push(c); c += s.qns.length; }
  const now = Date.now();
  active = {id: newId(), year: 'esat', mode: 'esat', mock: k, qns, secStarts: starts, secNames: m.sections.map(s => s.name), sec: 0, secUsed: [], secTimedOut: [],
    answers: {}, flags: [], idx: 0, startedAt: now, limit: ESAT_SEC, deadline: now + ESAT_SEC * 1000};
  saveActive();
  go({name: 'test'});
}
/* end the current mock section (on request or when its 40 minutes run out) and open the next one */
function nextSection(timedOut) {
  trackTime();
  const left = Math.max(0, remainingOf(active));
  active.secUsed[active.sec] = Math.min(ESAT_SEC, ESAT_SEC - left);
  active.secTimedOut[active.sec] = !!timedOut;
  if (active.sec >= active.secStarts.length - 1) return submit(!!timedOut);
  active.sec++; active.idx = active.secStarts[active.sec];
  if (active.pausedAt) { active.pausedMs = (active.pausedMs || 0) + (Date.now() - active.pausedAt); active.pausedAt = null; }
  active.deadline = Date.now() + ESAT_SEC * 1000; active.lastTick = Date.now();
  view.confirm = false; view.secDone = timedOut ? 'time' : 'done';
  saveActive(); renderTest(); window.scrollTo(0, 0);
}
async function startSpeed() {
  app.innerHTML = topbar() + `<div class="empty">Loading questions…</div>`;
  try { await loadMeta(); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} <button class="btn small" data-act="home">Back</button></div>`; return; }
  const settings = {topic: speedPrefs.topic, diff: speedPrefs.diff, bank: speedPrefs.bank || 'L'};
  const first = pickNext(settings, []);
  if (!first) return go({name: 'dash'});
  const qns = [first];
  try { await loadPaper(parseGid(first).key); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} <button class="btn small" data-act="home">Back</button></div>`; return; }
  active = {id: newId(), year: 'mixed', mode: 'speed', settings, qns, answers: {}, flags: [], idx: 0, startedAt: Date.now(), limit: 0, deadline: null};
  LS.set('engaa.active', active);
  go({name: 'test'});
}
function pickNext(settings, seen) {
  const s = new Set(seen.map(String));
  const left = speedPool(settings).filter(id => !s.has(id));
  return left.length ? left[Math.floor(Math.random() * left.length)] : null;
}
async function advance() {
  if (isEsat(active)) { if (active.idx < secRange(active)[1] - 1) { active.idx++; return true; } return false; }
  if (active.idx < active.qns.length - 1) { active.idx++; return true; }
  if (!isSpeed(active)) return false;
  await loadMeta();
  const id = pickNext(active.settings, active.qns);
  if (!id) return false;
  await loadPaper(parseGid(id).key);
  active.qns.push(id); active.idx++;
  return true;
}
function saveActive() { if (!active) return; active.updatedAt = Date.now(); LS.set('engaa.active', active); pushActive(false); }
/* the in-progress test is mirrored to the account (debounced) so a paused paper can be picked up again later */
let pushTimer = null;
function pushActive(now) {
  if (!dbCol) return;
  clearTimeout(pushTimer);
  const send = () => dbCol.doc('current').set({active: active || null, updatedAt: (active && active.updatedAt) || Date.now()}).catch(() => {});
  if (now) send(); else pushTimer = setTimeout(send, 3000);
}
function clearActive() { active = null; LS.del('engaa.active'); if (dbCol) { clearTimeout(pushTimer); dbCol.doc('current').set({active: null, updatedAt: Date.now()}).catch(() => {}); } }
const elapsedOf = a => (Date.now() - a.startedAt - (a.pausedMs || 0) - (a.pausedAt ? Date.now() - a.pausedAt : 0)) / 1000;
const remainingOf = a => ((a.pausedAt || Date.now()) - a.deadline) / -1000;
const qTime = (a, id) => ((a.times || {})[id] || 0);
function pauseActive() { if (active && !active.pausedAt) { trackTime(); active.pausedAt = Date.now(); saveActive(); pushActive(true); } }
function resumeActive() {
  if (!active || !active.pausedAt) return;
  const d = Date.now() - active.pausedAt;
  if (active.deadline) active.deadline += d;
  active.pausedMs = (active.pausedMs || 0) + d;
  active.pausedAt = null; active.lastTick = Date.now();
  saveActive();
}

function hsHtml(q, cls) {
  return q.hs.map((r, i) => { const L = q.o[i]; const c = cls(L); return c === null ? '' :
    `<${c.tag} class="hs ${c.cls}" ${c.tag === 'button' ? `data-act="pick" data-l="${L}" aria-label="Choose option ${L}"` : ''} style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%"></${c.tag}>`; }).join('');
}

function renderTest() {
  if (!active) return go({name: 'dash'});
  const sp = isSpeed(active), es = isEsat(active), pace = paceOf(active);
  const ready = active.qns.every(id => papers[parseGid(gidOf(active, id)).key]);
  if (!ready) { app.innerHTML = topbar() + '<div class="empty">Loading…</div>'; ensureLoaded(active).then(renderTest).catch(() => go({name: 'dash'})); return; }
  const id = active.qns[active.idx];
  const q = qOf(active, id), y = yearOf(active, id), n = numOf(active, id);
  const sel = active.answers[id];
  const locked = sp && !!sel;
  const flagged = active.flags.includes(id);
  const [s0, s1] = es ? secRange(active) : [0, active.qns.length];
  const secQns = active.qns.slice(s0, s1);
  const answered = secQns.filter(m => active.answers[m]).length;

  const hs = locked
    ? hsHtml(q, L => L === q.a ? {tag: 'span', cls: 'r-ok'} : L === sel ? {tag: 'span', cls: 'r-bad'} : null)
    : hsHtml(q, L => ({tag: 'button', cls: sel === L ? 'sel' : ''}));
  let nav = '', group = '';
  secQns.forEach((m, k) => {
    const i = s0 + k;
    const mq = qOf(active, m);
    const g = sp ? '' : es ? active.secNames[active.sec].toUpperCase() : 'PART ' + mq.p;
    if (g !== group) { nav += `<div class="part-sep">${g}</div>`; group = g; }
    const label = (sp || es) ? k + 1 : m;
    const res = sp && active.answers[m] ? (active.answers[m] === mq.a ? ' style="background:var(--ok);border-color:var(--ok);color:#fff"' : ' style="background:var(--bad);border-color:var(--bad);color:#fff"') : '';
    const tm = qTime(active, m);
    nav += `<button class="nb ${active.answers[m] ? 'ans' : ''} ${i === active.idx ? 'cur' : ''} ${active.flags.includes(m) ? 'fl' : ''} ${pace && tm > pace ? 'over' : ''}"${res} data-act="jump" data-i="${i}" aria-label="Question ${label}, ${fmtShort(tm)} spent"><span>${label}</span><small class="nt" data-i="${i}">${tm >= 1 ? fmtClock(tm) : ''}</small></button>`;
  });
  const unanswered = secQns.length - answered;
  const eyebrow = sp ? `Speed practice · ${esc(speedLabel(active.settings))} · from ${srcOf(active, id)} ${y} Q${n}`
    : es ? `${esc(mocks[active.mock].name)} · Section ${active.sec + 1} of 3 · ${active.secNames[active.sec]}`
    : `${active.year} · Part ${q.p} · ${q.p === 'A' ? 'Mathematics and Physics' : 'Advanced Mathematics and Advanced Physics'}${active.mode === 'mistakes' ? ' · Mistakes retry' : ''}`;
  const lozCls = L => locked ? (L === q.a ? 'r-ok' : L === sel ? 'r-bad' : '') : (sel === L ? 'sel' : '');
  const fb = locked ? `<div class="feedback ${sel === q.a ? 'ok' : 'bad'}" aria-live="polite"><h3>${sel === q.a ? 'Correct' : `Not quite. The answer is ${q.a}`}</h3>
      <p>${q.ex}</p><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><span class="tag">${TOPIC[q.t]}</span><span class="tag">${DIFF[q.d]}</span><span class="tag">${srcOf(active, id)} ${y} Q${n}</span></div></div>` : '';
  const last = active.idx >= s1 - 1;
  const lastSec = !es || active.sec >= active.secStarts.length - 1;
  const steps = es ? `<ol class="steps">${active.secNames.map((nm, k) => `<li class="${k < active.sec ? 'done' : k === active.sec ? 'now' : ''}"><span>${k < active.sec ? '✓' : k + 1}</span>${nm}</li>`).join('')}</ol>` : '';
  const secNote = es && view.secDone ? `<div class="secnote" role="status">${view.secDone === 'time' ? 'Time ran out on the last section.' : 'Section submitted.'} <b>${active.secNames[active.sec]}</b> has started with 40 minutes on the clock.</div>` : '';
  const poolLeft = sp && meta ? speedPool(active.settings).length - active.qns.length : 1;

  app.innerHTML = topbar() + `
  <div class="test-head"><div><div class="eyebrow">${eyebrow}</div>
    <h2>Question ${sp ? active.idx + 1 : es ? active.idx - s0 + 1 : n}<span class="qclock ${locked ? 'done' : ''}" id="qclock" title="Time on this question"><i aria-hidden="true"></i><b>${fmtClock(qTime(active, id))}</b></span> <span class="muted mono" style="font-size:15px;font-weight:400">${sp ? `(${Object.keys(active.answers).filter(k => active.answers[k] === qOf(active, k)?.a).length} correct so far)` : `(${active.idx - s0 + 1} of ${secQns.length})`}</span></h2></div>${steps}</div>${secNote}
  ${active.pausedAt ? `<section class="paused" role="dialog" aria-labelledby="ph"><div class="eyebrow">Paused</div><h2 id="ph">Your paper is paused</h2>
    <p>${sp ? `Elapsed time is frozen at <b class="mono">${fmt(elapsedOf(active))}</b>.` : `The clock is stopped with <b class="mono">${fmt(remainingOf(active))}</b> left${es ? ' in ' + active.secNames[active.sec] : ''}.`} ${Object.keys(active.answers).length} of ${active.qns.length} ${sp ? 'answered' : 'answered so far'}. Your answers and times are saved, so you can close this page and come back later.</p>
    <div class="acts"><button class="btn primary" data-act="unpause">Resume</button><button class="btn" data-act="exit">Back to dashboard</button></div></section>` : ''}
  <div class="test-grid" ${active.pausedAt ? 'hidden' : ''}>
    <div class="qpane">
      <div class="scan-wrap"><div class="scan ${locked ? 'review' : ''}" style="aspect-ratio:${q.w}/${q.h}"><img src="${q.img}" alt="Question ${n} from the ${y} paper" width="${q.w}" height="${q.h}">${hs}</div></div>
      <div class="sheet"><span class="eyebrow">Your answer</span><div class="lozenges">${[...q.o].map(L => `<button class="loz ${lozCls(L)}" data-act="pick" data-l="${L}" aria-pressed="${sel === L}" ${locked ? 'disabled' : ''}>${L}</button>`).join('')}</div>
        ${sel && !sp ? `<button class="btn ghost small" data-act="clear">Clear</button>` : ''}</div>
      ${fb}
      <div class="qnav"><button class="btn" data-act="prev" ${active.idx === s0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn ${flagged ? 'flagged' : ''}" data-act="flag" aria-pressed="${flagged}">${flagged ? '⚑ Flagged' : '⚐ Flag for review'}</button>
        ${sp ? (last && poolLeft === 0 ? `<button class="btn primary" data-act="ask-submit">No more questions · Finish</button>` : `<button class="btn primary" data-act="next">Next question →</button>`)
            : !last ? `<button class="btn primary" data-act="next">Next →</button>` : `<button class="btn primary" data-act="ask-submit">${es ? (lastSec ? 'Finish mock →' : 'Finish section →') : 'Finish →'}</button>`}</div>
    </div>
    <aside class="navp" aria-label="Question navigator">
      <div class="eyebrow">${sp ? `Questions · ${answered} answered` : `Questions · ${answered}/${secQns.length} answered`}</div>
      <div class="navgrid">${nav}</div>
      <div class="legend">${sp ? '<span><i style="background:var(--ok);border-color:var(--ok)"></i>Correct</span><span><i style="background:var(--bad);border-color:var(--bad)"></i>Wrong</span>' : '<span><i class="a"></i>Answered</span>'}<span><i></i>Blank</span><span><i class="f"></i>Flagged</span></div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:14px" data-act="ask-submit">${sp ? 'Finish practice' : es ? (lastSec ? 'Submit mock' : 'Finish section') : 'Submit test'}</button>
      <div id="confirm"></div>
      <button class="btn" style="width:100%;justify-content:center;margin-top:8px" data-act="pause">❚❚ Pause and save</button>
      <div class="kbd"><kbd>A</kbd>–<kbd>H</kbd> choose · <kbd>←</kbd><kbd>→</kbd> move · <kbd>M</kbd> flag · <kbd>P</kbd> pause</div>
    </aside>
  </div>`;
  if (view.confirm) showConfirm(unanswered);

  clearInterval(timerId); document.querySelector('.timer')?.remove();
  const t = document.createElement('div');
  t.className = 'timer' + (sp ? ' up' : ''); t.setAttribute('role', 'timer'); t.setAttribute('aria-label', sp ? 'Time elapsed' : 'Time remaining');
  t.innerHTML = `<span class="dot"></span><b></b><button class="tbtn" data-act="${active.pausedAt ? 'unpause' : 'pause'}" aria-label="${active.pausedAt ? 'Resume' : 'Pause'}">${active.pausedAt ? '▶' : '❚❚'}</button>`;
  t.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) handleAct(b); });
  t.classList.toggle('is-paused', !!active.pausedAt);
  document.body.appendChild(t);
  const tick = () => {
    if (!active) { clearInterval(timerId); t.remove(); return; }
    trackTime();
    const cid = active.qns[active.idx], qt = qTime(active, cid);
    const qc = document.getElementById('qclock');
    const pc = paceOf(active);
    if (qc) { qc.querySelector('b').textContent = fmtClock(qt); qc.classList.toggle('over', !!pc && qt > pc); }
    const nt = document.querySelector(`.nt[data-i="${active.idx}"]`);
    if (nt) { nt.textContent = qt >= 1 ? fmtClock(qt) : ''; nt.parentElement.classList.toggle('over', !!pc && qt > pc); }
    if (isSpeed(active)) { t.querySelector('b').textContent = fmt(elapsedOf(active)); return; }
    const left = remainingOf(active);
    t.querySelector('b').textContent = fmt(left);
    t.classList.toggle('warn', left <= 300 && left > 60);
    t.classList.toggle('crit', left <= 60);
    if (left <= 0 && !active.pausedAt) { if (isEsat(active)) nextSection(true); else submit(true); }
  };
  tick(); timerId = setInterval(tick, 250);
}
/* per-question timing: time on screen counts toward the question in view; in speed practice it stops once the question is answered */
let lastSave = 0;
function trackTime() {
  if (!active) return;
  active.times = active.times || {};
  const now = Date.now();
  const dt = (now - (active.lastTick || now)) / 1000;
  active.lastTick = now;
  if (active.pausedAt) return;
  if (document.hidden || dt <= 0 || dt > 5) return;
  const cid = active.qns[active.idx];
  if (isSpeed(active) && active.answers[cid]) return;
  active.times[cid] = (active.times[cid] || 0) + dt;
  if (now - lastSave > 2000) { lastSave = now; saveActive(); }
}
function showConfirm(unanswered) {
  const flagged = active.flags.length, sp = isSpeed(active);
  const el = document.getElementById('confirm'); if (!el) return;
  if (isEsat(active)) {
    const lastSec = active.sec >= active.secStarts.length - 1, nm = active.secNames[active.sec];
    el.innerHTML = `<div class="confirm"><b>${lastSec ? 'Submit the mock?' : `Finish ${nm}?`}</b><div style="margin-top:4px">${unanswered ? `${unanswered} unanswered in this section` : 'Every question in this section answered'}. ${lastSec ? "You can't change answers after submitting." : `You can't come back to ${nm}, and the next section starts straight away.`}</div>
      <div class="acts"><button class="btn primary small" data-act="submit">${lastSec ? 'Submit mock' : 'Finish section'}</button><button class="btn small" data-act="cancel-submit">Keep working</button></div></div>`;
    return;
  }
  el.innerHTML = `<div class="confirm"><b>${sp ? 'Finish now?' : 'Submit now?'}</b><div style="margin-top:4px">${sp ? `${Object.keys(active.answers).length} answered${flagged ? ` · ${flagged} flagged` : ''}. Questions you skipped won't be counted.` : `${unanswered ? `${unanswered} unanswered` : 'Every question answered'}${flagged ? ` · ${flagged} flagged` : ''}. You can't change answers after submitting.`}</div>
    <div class="acts"><button class="btn primary small" data-act="submit">${sp ? 'Finish' : 'Submit'}</button><button class="btn small" data-act="cancel-submit">Keep working</button></div></div>`;
}
async function submit(timedOut = false) {
  if (!active) return;
  trackTime();
  clearInterval(timerId); timerId = null;
  const a = active; clearActive();
  const sp = isSpeed(a);
  if (sp) { a.qns = a.qns.filter(id => a.answers[id]); a.flags = a.flags.filter(id => a.answers[id]); if (!a.qns.length) return go({name: 'dash'}); }
  if (a.pausedAt) { const d = Date.now() - a.pausedAt; if (a.deadline) a.deadline += d; a.pausedMs = (a.pausedMs || 0) + d; a.pausedAt = null; }
  const es = isEsat(a);
  const finishedAt = (sp || es) ? Date.now() : Math.min(Date.now(), a.deadline);
  const key = {}, parts = {}, topics = {};
  let score = 0;
  a.qns.forEach((id, i) => {
    const q = qOf(a, id); key[id] = q.a; topics[id] = q.t; if (a.answers[id] === q.a) score++;
    parts[id] = es ? a.secNames[a.secStarts.filter(s => s <= i).length - 1] : q.p;
  });
  const rec = {id: a.id, year: a.year, mode: a.mode, qns: a.qns, answers: a.answers, flags: a.flags, key, parts, score, total: a.qns.length,
    startedAt: a.startedAt, finishedAt, limit: a.limit, used: sp ? (finishedAt - a.startedAt - (a.pausedMs || 0)) / 1000 : Math.max(0, Math.min(a.limit, a.limit - (a.deadline - finishedAt) / 1000)), timedOut: !!timedOut};
  if (sp) rec.settings = a.settings;
  rec.topics = topics;
  if (es) {
    const short = {'Mathematics 1': 'M1', 'Physics': 'PH', 'Mathematics 2': 'M2'};
    rec.mock = a.mock; rec.limit = ESAT_SEC; rec.used = a.secUsed.reduce((s, x) => s + (x || 0), 0); rec.timedOut = a.secTimedOut.some(Boolean);
    rec.sections = a.secNames.map((nm, k) => ({name: nm, short: short[nm] || nm, used: a.secUsed[k] || 0, timedOut: !!a.secTimedOut[k]}));
  }
  rec.times = {};
  for (const id of a.qns) rec.times[id] = Math.round(((a.times || {})[id] || 0) * 10) / 10;
  await persistAttempt(rec);
  go({name: 'review', id: rec.id, filter: 'all'});
}

/* ---------- review ---------- */
async function renderReview() {
  const a = attempts.find(x => x.id === view.id);
  if (!a) return go({name: 'dash'});
  const sp = isSpeed(a);
  try { await ensureLoaded(a); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)}</div>`; return; }
  const status = n => !a.answers[n] ? 'na' : a.answers[n] === a.key[n] ? 'ok' : 'bad';
  const counts = {all: a.qns.length, bad: 0, na: 0, ok: 0, flag: a.flags.length};
  a.qns.forEach(n => counts[status(n)]++);
  const f = view.filter || 'all';
  const shown = a.qns.filter(n => f === 'all' || (f === 'flag' ? a.flags.includes(n) : f === 'wrong' ? status(n) !== 'ok' : status(n) === f));
  const p = pct(a.score, a.total);
  const es = isEsat(a), pace = paceOf(a);
  const parts = breakdown(a);
  const C = 2 * Math.PI * 52;
  const domId = n => 'rq-' + String(n).replace(/\W/g, '_');
  const canRetry = !sp && counts.bad + counts.na && a.mode === 'full' && lastFull(a.year)?.id === a.id && !active;

  let html = topbar(`<button class="btn" data-act="home">← Dashboard</button>`);
  html += `<div class="section-h"><div><div class="eyebrow">${modeLabel(a)}${sp ? ' · ' + esc(speedLabel(a.settings)) : ''} · ${dateStr(a.finishedAt)}</div><h2 style="font-size:26px;margin-top:4px">${esc(attemptTitle(a))} results</h2></div>
    ${canRetry ? `<button class="btn primary" data-act="retry" data-y="${a.year}">Retry ${counts.bad + counts.na} mistake${counts.bad + counts.na > 1 ? 's' : ''}</button>` : ''}
    ${sp && !active ? `<button class="btn primary" data-act="speed-again">New speed set</button>` : ''}</div>
  <section class="score-hero">
    <svg class="ring" viewBox="0 0 132 132" role="img" aria-label="Score ${p} percent"><circle cx="66" cy="66" r="52" fill="none" stroke="var(--line-soft)" stroke-width="12"/>
      <circle cx="66" cy="66" r="52" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C * p / 100} ${C}" transform="rotate(-90 66 66)"/>
      <text x="66" y="64" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="26" font-weight="600" fill="var(--ink)">${a.score}/${a.total}</text>
      <text x="66" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="var(--muted)">${p}%</text></svg>
    <div style="min-width:0"><div class="score-stats">
      ${parts.map((b, k) => `<div><span class="eyebrow">${es ? esc(a.sections[k].name) : b.label}</span><b>${b.s}/${b.t}</b>${es ? `<span class="muted mono" style="font-size:12px">${fmt(a.sections[k].used)} of 40:00${a.sections[k].timedOut ? ' · time up' : ''}</span>` : ''}</div>`).join('')}
      <div><span class="eyebrow">Time used</span><b>${fmt(a.used)}</b><span class="muted mono" style="font-size:12px">${a.limit ? 'of ' + fmt(es ? a.limit * 3 : a.limit) : 'untimed'}${a.timedOut && !es ? ' · time up' : ''}</span></div>
      ${parts.length < 3 ? `<div><span class="eyebrow">Per question</span><b>${Math.round(a.used / a.total)}s</b><span class="muted mono" style="font-size:12px">${pace ? 'exam pace ' + pace + 's' : 'untimed'}</span></div>` : ''}</div>
      <div class="strip" aria-label="Question by question">${a.qns.map((n, i) => `<button class="${status(n)}" data-act="goto" data-n="${domId(n)}" title="${isEngaaPaper(a) ? 'Question ' + n : srcOf(a, n) + ' ' + yearOf(a, n) + ' Q' + numOf(a, n)}${a.times ? ' · ' + fmtShort(a.times[n] || 0) : ''}">${isEngaaPaper(a) ? n : i + 1}</button>`).join('')}</div></div>
  </section>
  <div class="filters" role="tablist">${[['all', 'All'], ['wrong', 'Mistakes'], ['bad', 'Incorrect'], ['na', 'Not answered'], ['ok', 'Correct'], ['flag', 'Flagged']].map(([k, l]) => {
    const c = k === 'wrong' ? counts.bad + counts.na : counts[k];
    return `<button class="chip ${f === k ? 'on' : ''}" data-act="filter" data-f="${k}" role="tab" aria-selected="${f === k}">${l} <span class="mono">${c}</span></button>`;
  }).join('')}</div>`;

  const hasTimes = !!a.times;
  html += `<div class="rlist-tools"><span class="note">${hasTimes ? 'Tap a question to see it with the worked solution. Times show how long you spent on each question.' : 'Tap a question to see it with the worked solution. Per-question times are recorded for attempts from now on.'}</span>
    <button class="btn small" data-act="expand-all">${view.expandAll ? 'Collapse all' : 'Expand all'}</button></div>`;
  if (!shown.length) html += `<div class="tbl-wrap"><div class="empty">Nothing in this filter.</div></div>`;
  html += `<div class="rlist">`;
  let lastPart = null;
  for (const n of shown) {
    if (es && a.parts[n] !== lastPart) { lastPart = a.parts[n]; html += `<div class="part-sep" style="margin-top:8px">${esc(lastPart)}</div>`; }
    const q = qOf(a, n), st = status(n), mine = a.answers[n], y = yearOf(a, n), num = numOf(a, n);
    const secs = hasTimes ? a.times[n] : null;
    const slow = secs !== null && pace && secs > pace;
    const hs = hsHtml(q, L => L === q.a ? {tag: 'span', cls: 'r-ok'} : L === mine ? {tag: 'span', cls: 'r-bad'} : null);
    const open = view.expandAll || view.open === domId(n);
    html += `<details class="rrow ${st}" id="${domId(n)}" ${open ? 'open' : ''}>
      <summary>
        <span class="rmark" aria-hidden="true">${st === 'ok' ? '✓' : st === 'bad' ? '✗' : '–'}</span>
        <span class="rtitle"><b>${isEngaaPaper(a) ? 'Q' + num : `${a.qns.indexOf(n) + 1}. ${srcOf(a, n)} ${y} Q${num}`}</b><span class="rtags"><span class="tag">${TOPIC[q.t]}</span><span class="tag">${DIFF[q.d]}</span>${a.flags.includes(n) ? '<span class="pill flag">Flagged</span>' : ''}</span></span>
        <span class="rans">You <b class="${st}">${mine || '—'}</b> · Answer <b class="ok">${q.a}</b></span>
        <span class="rtime mono ${slow ? 'slow' : ''}" title="Time spent on this question">${secs === null || secs === undefined ? '—' : fmtShort(secs)}</span>
        <span class="chev" aria-hidden="true"></span>
      </summary>
      <div class="rbody">
        <div class="scan-wrap"><div class="scan review" style="aspect-ratio:${q.w}/${q.h}">${open ? `<img src="${q.img}"` : `<img data-src="${gidOf(a, n)}"`} alt="Question ${num} from the ${y} paper" width="${q.w}" height="${q.h}">${hs}</div></div>
        <div class="expl"><div class="eyebrow">Worked solution</div><p>${q.ex}</p>${slow ? `<p class="note">You spent ${fmtShort(secs)} here, over the ${pace}s exam pace.</p>` : ''}</div>
      </div></details>`;
  }
  html += `</div>`;
  app.innerHTML = html;
  app.querySelectorAll('details.rrow').forEach(d => d.addEventListener('toggle', () => { if (d.open) fillImg(d); }));
}
function fillImg(d) {
  const img = d.querySelector('img[data-src]'); if (!img) return;
  img.src = Q(img.dataset.src).img; img.removeAttribute('data-src');
}

/* ---------- events ---------- */
app.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) handleAct(b); });
function handleAct(b) {
  if (b.disabled) return;
  const act = b.dataset.act;
  if (act === 'pause') { pauseActive(); return renderTest(); }
  if (act === 'unpause') { resumeActive(); return renderTest(); }
  if (act === 'exit') { pauseActive(); return go({name: 'dash'}); }
  if (act === 'home') return go({name: 'dash'});
  if (act === 'start') return startTest(+b.dataset.y, 'full');
  if (act === 'mock') return startMock(+b.dataset.k);
  if (act === 'retry') return startTest(+b.dataset.y, 'mistakes');
  if (act === 'speed') return startSpeed();
  if (act === 'speed-again') { go({name: 'dash'}); document.querySelector('.speed')?.scrollIntoView({block: 'center'}); return; }
  if (act === 'pref') { const k = b.dataset.k; speedPrefs[k] = b.dataset.v; LS.set('engaa.speedPrefs', speedPrefs); return renderDash(); }
  if (act === 'resume') { resumeActive(); return go({name: 'test'}); }
  if (act === 'abandon') {
    if (b.dataset.sure) { clearActive(); return render(); }
    b.dataset.sure = '1'; b.textContent = 'Discard answers?'; b.classList.add('primary'); return;
  }
  if (act === 'review') return go({name: 'review', id: b.dataset.id, filter: 'all'});
  if (act === 'filter') { view.filter = b.dataset.f; return renderReview(); }
  if (act === 'expand-all') { view.expandAll = !view.expandAll; view.open = null; return renderReview(); }
  if (act === 'goto') {
    const jump = () => { const d = document.getElementById(b.dataset.n); if (!d) return; d.open = true; fillImg(d); d.scrollIntoView({block: 'start'}); };
    if (view.filter !== 'all') { view.filter = 'all'; renderReview().then(jump); } else jump();
    return;
  }
  if (!active || active.pausedAt) return;
  trackTime();
  view.secDone = null;
  const id = active.qns[active.idx];
  const locked = isSpeed(active) && active.answers[id];
  if (act === 'pick') { if (locked) return; active.answers[id] = b.dataset.l; }
  else if (act === 'clear') { if (locked) return; delete active.answers[id]; }
  else if (act === 'flag') { active.flags = active.flags.includes(id) ? active.flags.filter(x => x !== id) : [...active.flags, id]; }
  else if (act === 'prev') { active.idx = Math.max(isEsat(active) ? secRange(active)[0] : 0, active.idx - 1); view.confirm = false; }
  else if (act === 'next') { view.confirm = false; advance().then(() => { saveActive(); renderTest(); window.scrollTo(0, 0); }); return; }
  else if (act === 'jump') { active.idx = +b.dataset.i; view.confirm = false; }
  else if (act === 'ask-submit') { view.confirm = true; }
  else if (act === 'cancel-submit') { view.confirm = false; }
  else if (act === 'submit') { return isEsat(active) ? nextSection(false) : submit(false); }
  saveActive(); renderTest();
  if (act === 'ask-submit') document.getElementById('confirm')?.scrollIntoView({block: 'nearest'});
}
document.addEventListener('keydown', e => {
  if (view.name !== 'test' || !active || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.toUpperCase() === 'P') { e.preventDefault(); if (active.pausedAt) resumeActive(); else pauseActive(); return renderTest(); }
  if (active.pausedAt) return;
  const id = active.qns[active.idx], q = qOf(active, id); if (!q) return;
  const k = e.key.toUpperCase();
  const locked = isSpeed(active) && active.answers[id];
  if (k.length === 1 && q.o.includes(k)) { if (locked) return; active.answers[id] = k; }
  else if (e.key === 'ArrowRight') { e.preventDefault(); view.confirm = false; advance().then(ok => { if (ok) { saveActive(); renderTest(); } }); return; }
  else if (e.key === 'ArrowLeft') { if (active.idx <= (isEsat(active) ? secRange(active)[0] : 0)) return; active.idx--; view.confirm = false; }
  else if (k === 'M') { active.flags = active.flags.includes(id) ? active.flags.filter(x => x !== id) : [...active.flags, id]; }
  else return;
  e.preventDefault(); saveActive(); renderTest();
});

/* ---------- boot ---------- */
if (active && active.pausedAt) { render(); loadMeta().catch(() => {}); }
else if (active && !isSpeed(active) && Date.now() >= active.deadline) {
  loadMeta().then(() => ensureLoaded(active)).then(() => { if (isEsat(active)) { view = {name: 'test'}; nextSection(true); } else submit(true); }).catch(() => { active = null; LS.del('engaa.active'); render(); });
} else if (active) { view = {name: 'test'}; loadMeta().catch(() => {}).then(render); }
else render();
initDb();
})();
