(() => {
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const AVAILABLE = {2016: 41, 2017: 41, 2018: 41, 2019: 30, 2020: 30, 2021: 30, 2022: 30, 2023: 30};
const PER_Q = 85;
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
let speedPrefs = Object.assign({topic: 'M', diff: 'E'}, LS.get('engaa.speedPrefs', {}));
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
    const remote = snap.docs.map(d => d.data()).filter(a => a && a.id);
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
const papers = {};
async function loadPaper(y) {
  if (!papers[y]) {
    const el = document.getElementById('paper-' + y);
    if (!el) throw new Error('The ' + y + ' paper is missing from this page.');
    papers[y] = JSON.parse(el.textContent);
  }
  return papers[y];
}
let meta = null;
const loadMeta = async () => { if (!meta) meta = JSON.parse(document.getElementById('meta').textContent); return meta; };
const qByN = (y, n) => papers[y].find(q => q.n === n);
/* question ids: plain numbers inside a single-paper attempt, "YYYY-n" strings in speed practice */
const isSpeed = a => a.mode === 'speed';
const qOf = (a, id) => isSpeed(a) ? qByN(+String(id).split('-')[0], +String(id).split('-')[1]) : qByN(a.year, id);
const yearOf = (a, id) => isSpeed(a) ? +String(id).split('-')[0] : a.year;
const numOf = (a, id) => isSpeed(a) ? +String(id).split('-')[1] : id;
const ensureLoaded = a => isSpeed(a) ? Promise.all([...new Set(a.qns.map(id => String(id).split('-')[0]))].map(loadPaper)) : loadPaper(a.year);

/* ---------- helpers ---------- */
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const dateStr = t => new Date(t).toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: 'numeric'}) + ', ' + new Date(t).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
const fullAttempts = y => attempts.filter(a => a.year === y && a.mode === 'full');
const lastFull = y => fullAttempts(y).sort((a, b) => b.finishedAt - a.finishedAt)[0];
const mistakesOf = a => a.qns.filter(n => a.answers[n] !== a.key[n]);
const newId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const speedLabel = s => `${s.topic === 'B' ? 'Maths + Physics' : TOPIC[s.topic]} · ${s.diff === 'X' ? 'Mixed difficulty' : DIFF[s.diff]}`;
const modeLabel = a => a.mode === 'full' ? 'Full paper' : a.mode === 'mistakes' ? 'Mistakes retry' : 'Speed practice';

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
  return `<header class="topbar"><div class="brand"><h1>ENGAA Section 1 Practice</h1><span class="code">D564/11</span></div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="sync">${esc(syncLabel)}</span>${right}</div></header>`;
}

/* ---------- dashboard ---------- */
function speedPool(p) {
  return (meta || []).filter(([y, n, t, d]) => (p.topic === 'B' || t === p.topic) && (p.diff === 'X' || d === p.diff)).map(([y, n]) => y + '-' + n);
}
function renderDash() {
  const full = attempts.filter(a => a.mode === 'full');
  const done = new Set(full.map(a => a.year));
  const avg = full.length ? Math.round(full.reduce((s, a) => s + pct(a.score, a.total), 0) / full.length) : null;
  const best = full.length ? Math.max(...full.map(a => pct(a.score, a.total))) : null;
  const latestMistakes = Object.keys(AVAILABLE).reduce((s, y) => { const a = lastFull(+y); return s + (a ? mistakesOf(a).length : 0); }, 0);

  let html = topbar();
  if (active) {
    const sp = isSpeed(active);
    const what = sp ? 'Speed practice · ' + speedLabel(active.settings) : active.year + (active.mode === 'mistakes' ? ' mistakes retry' : ' paper');
    html += `<div class="resume"><div><div class="eyebrow">${sp ? 'Practice in progress' : 'Test in progress'}</div><div style="margin-top:4px"><b>${esc(what)}</b> · ${Object.keys(active.answers).length}/${active.qns.length} answered${sp ? '' : ` · <span class="mono">${fmt((active.deadline - Date.now()) / 1000)}</span> left. The clock keeps running.`}</div></div>
      <div style="display:flex;gap:8px"><button class="btn primary" data-act="resume">Resume</button><button class="btn ghost" data-act="abandon">Discard</button></div></div>`;
  }
  html += `<section class="summary" aria-label="Overview">
    <div><span class="eyebrow">Papers sat</span><b>${done.size}<span class="muted" style="font-size:16px">/${Object.keys(AVAILABLE).length}</span></b></div>
    <div><span class="eyebrow">Average score</span><b>${avg === null ? '–' : avg + '%'}</b></div>
    <div><span class="eyebrow">Best score</span><b>${best === null ? '–' : best + '%'}</b></div>
    <div><span class="eyebrow">Open mistakes</span><b>${latestMistakes}</b></div></section>`;

  html += `<div class="section-h"><h2>Past papers</h2><span class="note">Questions crossed out in the papers are removed. You get ${PER_Q} s per question.</span></div><div class="years">`;
  for (const y of YEARS) {
    const n = AVAILABLE[y];
    if (!n) {
      html += `<article class="card na"><div class="yr"><h3 class="muted">${y}</h3><span class="pill na">Not uploaded</span></div><p class="note" style="margin:0">Upload the ${y} Section 1 paper and answer key to add it here.</p></article>`;
      continue;
    }
    const fa = fullAttempts(y), last = lastFull(y);
    const bestP = fa.length ? Math.max(...fa.map(a => pct(a.score, a.total))) : null;
    const mist = last ? mistakesOf(last).length : 0;
    html += `<article class="card"><div class="yr"><h3>${y}</h3><span class="mono muted" style="font-size:13px">${n} Qs · ${fmt(n * PER_Q)}</span></div>
      <div class="meter" title="Best score"><i style="width:${bestP || 0}%"></i></div>
      <dl class="kv"><dt>Best</dt><dd>${bestP === null ? '–' : bestP + '%'}</dd><dt>Last</dt><dd>${last ? last.score + '/' + last.total : '–'}</dd><dt>Attempts</dt><dd>${fa.length}</dd></dl>
      <div class="acts"><button class="btn primary small" data-act="start" data-y="${y}" ${active ? 'disabled title="Finish or discard the test in progress first"' : ''}>${fa.length ? 'Retake' : 'Start'}</button>
      ${last ? `<button class="btn small" data-act="review" data-id="${last.id}">Review</button>` : ''}
      ${mist ? `<button class="btn small" data-act="retry" data-y="${y}" ${active ? 'disabled' : ''}>Retry ${mist} mistake${mist > 1 ? 's' : ''}</button>` : ''}</div></article>`;
  }
  html += `</div>`;

  const allLoaded = !!meta;
  const pool = allLoaded ? speedPool(speedPrefs).length : null;
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="pref" data-k="${key}" data-v="${v}" class="${String(speedPrefs[key]) === String(v) ? 'on' : ''}" aria-pressed="${String(speedPrefs[key]) === String(v)}">${l}</button>`).join('')}</div>`;
  html += `<div class="section-h"><h2>Speed practice</h2><span class="note">Untimed. One random question at a time from every year, marked as soon as you answer. Keep pressing Next for more.</span></div>
  <section class="speed">
    <div class="opts">
      <div class="field"><span class="eyebrow">Topic</span>${seg('topic', [['M', 'Maths'], ['P', 'Physics'], ['B', 'Both']])}</div>
      <div class="field"><span class="eyebrow">Difficulty</span>${seg('diff', [['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard'], ['X', 'Mixed']])}</div>
    </div>
    <div class="go"><span class="note mono">${pool === null ? 'Loading question bank…' : pool + ' questions in this set'}</span>
      <button class="btn primary" data-act="speed" ${active || !pool ? 'disabled' : ''}>Start speed practice</button></div>
  </section>`;

  html += `<div class="section-h"><h2>Attempt history</h2></div>`;
  if (!attempts.length) {
    html += `<div class="tbl-wrap"><div class="empty">No attempts yet. Pick a paper above to sit your first timed test. Your marks and mistakes will appear here.</div></div>`;
  } else {
    html += `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Paper</th><th>Mode</th><th>Score</th><th>Part A</th><th>Part B</th><th>Time used</th><th></th></tr></thead><tbody>`;
    for (const a of [...attempts].sort((x, z) => z.finishedAt - x.finishedAt)) {
      const pa = partScore(a, 'A'), pb = partScore(a, 'B');
      html += `<tr><td>${dateStr(a.finishedAt)}</td><td class="num">${isSpeed(a) ? 'All years' : a.year}</td><td>${modeLabel(a)}${isSpeed(a) ? ` <span class="muted">· ${esc(speedLabel(a.settings))}</span>` : ''}</td>
        <td class="num"><b>${a.score}/${a.total}</b> <span class="muted">${pct(a.score, a.total)}%</span></td>
        <td class="num">${!isSpeed(a) && pa.t ? pa.s + '/' + pa.t : '–'}</td><td class="num">${!isSpeed(a) && pb.t ? pb.s + '/' + pb.t : '–'}</td>
        <td class="num">${fmt(a.used)}${a.limit ? ' / ' + fmt(a.limit) : ''}${a.timedOut ? ' <span class="pill flag">Time up</span>' : ''}</td>
        <td><button class="btn small" data-act="review" data-id="${a.id}">Review</button></td></tr>`;
    }
    html += `</tbody></table></div>`;
  }
  app.innerHTML = html;
  if (!allLoaded) loadMeta().then(() => { if (view.name === 'dash') renderDash(); }).catch(() => {});
}
function partScore(a, p) {
  let s = 0, t = 0;
  for (const n of a.qns) if ((a.parts || {})[n] === p) { t++; if (a.answers[n] === a.key[n]) s++; }
  return {s, t};
}
function topicScore(a, t) {
  let s = 0, c = 0;
  for (const id of a.qns) { const q = qOf(a, id); if (q && q.t === t) { c++; if (a.answers[id] === a.key[id]) s++; } }
  return {s, t: c};
}

/* ---------- test ---------- */
async function startTest(y, mode) {
  app.innerHTML = topbar() + `<div class="empty">Loading the ${y} paper…</div>`;
  let data;
  try { data = await loadPaper(y); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} Check your connection and try again. <button class="btn small" data-act="home">Back</button></div>`; return; }
  let qns = data.map(q => q.n);
  if (mode === 'mistakes') { const last = lastFull(y); qns = last ? mistakesOf(last) : []; }
  if (!qns.length) return go({name: 'dash'});
  const now = Date.now();
  active = {id: newId(), year: y, mode, qns, answers: {}, flags: [], idx: 0, startedAt: now, limit: qns.length * PER_Q, deadline: now + qns.length * PER_Q * 1000};
  LS.set('engaa.active', active);
  go({name: 'test'});
}
async function startSpeed() {
  app.innerHTML = topbar() + `<div class="empty">Loading questions…</div>`;
  try { await loadMeta(); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} <button class="btn small" data-act="home">Back</button></div>`; return; }
  const settings = {topic: speedPrefs.topic, diff: speedPrefs.diff};
  const first = pickNext(settings, []);
  if (!first) return go({name: 'dash'});
  const qns = [first];
  try { await loadPaper(+first.split('-')[0]); } catch (e) { app.innerHTML = topbar() + `<div class="empty">${esc(e.message)} <button class="btn small" data-act="home">Back</button></div>`; return; }
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
  if (active.idx < active.qns.length - 1) { active.idx++; return true; }
  if (!isSpeed(active)) return false;
  await loadMeta();
  const id = pickNext(active.settings, active.qns);
  if (!id) return false;
  await loadPaper(+id.split('-')[0]);
  active.qns.push(id); active.idx++;
  return true;
}
function saveActive() { LS.set('engaa.active', active); }

function hsHtml(q, cls) {
  return q.hs.map((r, i) => { const L = q.o[i]; const c = cls(L); return c === null ? '' :
    `<${c.tag} class="hs ${c.cls}" ${c.tag === 'button' ? `data-act="pick" data-l="${L}" aria-label="Choose option ${L}"` : ''} style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%"></${c.tag}>`; }).join('');
}

function renderTest() {
  if (!active) return go({name: 'dash'});
  const sp = isSpeed(active);
  const ready = sp ? active.qns.every(id => papers[String(id).split('-')[0]]) : papers[active.year];
  if (!ready) { app.innerHTML = topbar() + '<div class="empty">Loading…</div>'; ensureLoaded(active).then(renderTest).catch(() => go({name: 'dash'})); return; }
  const id = active.qns[active.idx];
  const q = qOf(active, id), y = yearOf(active, id), n = numOf(active, id);
  const sel = active.answers[id];
  const locked = sp && !!sel;
  const flagged = active.flags.includes(id);
  const answered = Object.keys(active.answers).length;

  const hs = locked
    ? hsHtml(q, L => L === q.a ? {tag: 'span', cls: 'r-ok'} : L === sel ? {tag: 'span', cls: 'r-bad'} : null)
    : hsHtml(q, L => ({tag: 'button', cls: sel === L ? 'sel' : ''}));
  let nav = '', group = '';
  active.qns.forEach((m, i) => {
    const mq = qOf(active, m);
    const g = sp ? '' : 'PART ' + mq.p;
    if (g !== group) { nav += `<div class="part-sep">${g}</div>`; group = g; }
    const label = sp ? i + 1 : m;
    const res = sp && active.answers[m] ? (active.answers[m] === mq.a ? ' style="background:var(--ok);border-color:var(--ok);color:#fff"' : ' style="background:var(--bad);border-color:var(--bad);color:#fff"') : '';
    nav += `<button class="nb ${active.answers[m] ? 'ans' : ''} ${i === active.idx ? 'cur' : ''} ${active.flags.includes(m) ? 'fl' : ''}"${res} data-act="jump" data-i="${i}" aria-label="Question ${label}">${label}</button>`;
  });
  const unanswered = active.qns.length - answered;
  const eyebrow = sp ? `Speed practice · ${esc(speedLabel(active.settings))} · from ${y} Q${n}`
    : `${active.year} · Part ${q.p} · ${q.p === 'A' ? 'Mathematics and Physics' : 'Advanced Mathematics and Advanced Physics'}${active.mode === 'mistakes' ? ' · Mistakes retry' : ''}`;
  const lozCls = L => locked ? (L === q.a ? 'r-ok' : L === sel ? 'r-bad' : '') : (sel === L ? 'sel' : '');
  const fb = locked ? `<div class="feedback ${sel === q.a ? 'ok' : 'bad'}" aria-live="polite"><h3>${sel === q.a ? 'Correct' : `Not quite. The answer is ${q.a}`}</h3>
      <p>${q.ex}</p><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><span class="tag">${TOPIC[q.t]}</span><span class="tag">${DIFF[q.d]}</span><span class="tag">${y} Q${n}</span></div></div>` : '';
  const last = active.idx >= active.qns.length - 1;
  const poolLeft = sp && meta ? speedPool(active.settings).length - active.qns.length : 1;

  app.innerHTML = topbar() + `
  <div class="test-head"><div><div class="eyebrow">${eyebrow}</div>
    <h2>Question ${sp ? active.idx + 1 : n} <span class="muted mono" style="font-size:15px;font-weight:400">${sp ? `(${Object.keys(active.answers).filter(k => active.answers[k] === qOf(active, k)?.a).length} correct so far)` : `(${active.idx + 1} of ${active.qns.length})`}</span></h2></div></div>
  <div class="test-grid">
    <div class="qpane">
      <div class="scan-wrap"><div class="scan ${locked ? 'review' : ''}" style="aspect-ratio:${q.w}/${q.h}"><img src="${q.img}" alt="Question ${n} from the ${y} paper" width="${q.w}" height="${q.h}">${hs}</div></div>
      <div class="sheet"><span class="eyebrow">Your answer</span><div class="lozenges">${[...q.o].map(L => `<button class="loz ${lozCls(L)}" data-act="pick" data-l="${L}" aria-pressed="${sel === L}" ${locked ? 'disabled' : ''}>${L}</button>`).join('')}</div>
        ${sel && !sp ? `<button class="btn ghost small" data-act="clear">Clear</button>` : ''}</div>
      ${fb}
      <div class="qnav"><button class="btn" data-act="prev" ${active.idx === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="btn ${flagged ? 'flagged' : ''}" data-act="flag" aria-pressed="${flagged}">${flagged ? '⚑ Flagged' : '⚐ Flag for review'}</button>
        ${sp ? (last && poolLeft === 0 ? `<button class="btn primary" data-act="ask-submit">No more questions · Finish</button>` : `<button class="btn primary" data-act="next">Next question →</button>`)
            : !last ? `<button class="btn primary" data-act="next">Next →</button>` : `<button class="btn primary" data-act="ask-submit">Finish →</button>`}</div>
    </div>
    <aside class="navp" aria-label="Question navigator">
      <div class="eyebrow">${sp ? `Questions · ${answered} answered` : `Questions · ${answered}/${active.qns.length} answered`}</div>
      <div class="navgrid">${nav}</div>
      <div class="legend">${sp ? '<span><i style="background:var(--ok);border-color:var(--ok)"></i>Correct</span><span><i style="background:var(--bad);border-color:var(--bad)"></i>Wrong</span>' : '<span><i class="a"></i>Answered</span>'}<span><i></i>Blank</span><span><i class="f"></i>Flagged</span></div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:14px" data-act="ask-submit">${sp ? 'Finish practice' : 'Submit test'}</button>
      <div id="confirm"></div>
      <div class="kbd"><kbd>A</kbd>–<kbd>H</kbd> choose · <kbd>←</kbd><kbd>→</kbd> move · <kbd>M</kbd> flag</div>
    </aside>
  </div>`;
  if (view.confirm) showConfirm(unanswered);

  clearInterval(timerId); document.querySelector('.timer')?.remove();
  const t = document.createElement('div');
  t.className = 'timer' + (sp ? ' up' : ''); t.setAttribute('role', 'timer'); t.setAttribute('aria-label', sp ? 'Time elapsed' : 'Time remaining');
  t.innerHTML = '<span class="dot"></span><b></b>';
  document.body.appendChild(t);
  const tick = () => {
    if (!active) { clearInterval(timerId); t.remove(); return; }
    if (isSpeed(active)) { t.querySelector('b').textContent = fmt((Date.now() - active.startedAt) / 1000); return; }
    const left = (active.deadline - Date.now()) / 1000;
    t.querySelector('b').textContent = fmt(left);
    t.classList.toggle('warn', left <= 300 && left > 60);
    t.classList.toggle('crit', left <= 60);
    if (left <= 0) submit(true);
  };
  tick(); timerId = setInterval(tick, 250);
}
function showConfirm(unanswered) {
  const flagged = active.flags.length, sp = isSpeed(active);
  const el = document.getElementById('confirm'); if (!el) return;
  el.innerHTML = `<div class="confirm"><b>${sp ? 'Finish now?' : 'Submit now?'}</b><div style="margin-top:4px">${sp ? `${Object.keys(active.answers).length} answered${flagged ? ` · ${flagged} flagged` : ''}. Questions you skipped won't be counted.` : `${unanswered ? `${unanswered} unanswered` : 'Every question answered'}${flagged ? ` · ${flagged} flagged` : ''}. You can't change answers after submitting.`}</div>
    <div class="acts"><button class="btn primary small" data-act="submit">${sp ? 'Finish' : 'Submit'}</button><button class="btn small" data-act="cancel-submit">Keep working</button></div></div>`;
}
async function submit(timedOut = false) {
  if (!active) return;
  clearInterval(timerId); timerId = null;
  const a = active; active = null; LS.del('engaa.active');
  const sp = isSpeed(a);
  if (sp) { a.qns = a.qns.filter(id => a.answers[id]); a.flags = a.flags.filter(id => a.answers[id]); if (!a.qns.length) return go({name: 'dash'}); }
  const finishedAt = sp ? Date.now() : Math.min(Date.now(), a.deadline);
  const key = {}, parts = {};
  let score = 0;
  for (const id of a.qns) { const q = qOf(a, id); key[id] = q.a; parts[id] = q.p; if (a.answers[id] === q.a) score++; }
  const rec = {id: a.id, year: a.year, mode: a.mode, qns: a.qns, answers: a.answers, flags: a.flags, key, parts, score, total: a.qns.length,
    startedAt: a.startedAt, finishedAt, limit: a.limit, used: sp ? (finishedAt - a.startedAt) / 1000 : Math.min(a.limit, (finishedAt - a.startedAt) / 1000), timedOut: !!timedOut};
  if (sp) rec.settings = a.settings;
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
  const s1 = sp ? topicScore(a, 'M') : partScore(a, 'A'), s2 = sp ? topicScore(a, 'P') : partScore(a, 'B');
  const C = 2 * Math.PI * 52;
  const domId = n => 'rq-' + String(n).replace(/\W/g, '_');
  const canRetry = !sp && counts.bad + counts.na && a.mode === 'full' && lastFull(a.year)?.id === a.id && !active;

  let html = topbar(`<button class="btn" data-act="home">← Dashboard</button>`);
  html += `<div class="section-h"><div><div class="eyebrow">${modeLabel(a)}${sp ? ' · ' + esc(speedLabel(a.settings)) : ''} · ${dateStr(a.finishedAt)}</div><h2 style="font-size:26px;margin-top:4px">${sp ? 'Speed practice results' : a.year + ' results'}</h2></div>
    ${canRetry ? `<button class="btn primary" data-act="retry" data-y="${a.year}">Retry ${counts.bad + counts.na} mistake${counts.bad + counts.na > 1 ? 's' : ''}</button>` : ''}
    ${sp && !active ? `<button class="btn primary" data-act="speed-again">New speed set</button>` : ''}</div>
  <section class="score-hero">
    <svg class="ring" viewBox="0 0 132 132" role="img" aria-label="Score ${p} percent"><circle cx="66" cy="66" r="52" fill="none" stroke="var(--line-soft)" stroke-width="12"/>
      <circle cx="66" cy="66" r="52" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C * p / 100} ${C}" transform="rotate(-90 66 66)"/>
      <text x="66" y="64" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="26" font-weight="600" fill="var(--ink)">${a.score}/${a.total}</text>
      <text x="66" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" fill="var(--muted)">${p}%</text></svg>
    <div style="min-width:0"><div class="score-stats">
      <div><span class="eyebrow">${sp ? 'Maths' : 'Part A'}</span><b>${s1.t ? s1.s + '/' + s1.t : '–'}</b></div>
      <div><span class="eyebrow">${sp ? 'Physics' : 'Part B'}</span><b>${s2.t ? s2.s + '/' + s2.t : '–'}</b></div>
      <div><span class="eyebrow">Time used</span><b>${fmt(a.used)}</b><span class="muted mono" style="font-size:12px">${a.limit ? 'of ' + fmt(a.limit) : 'untimed'}${a.timedOut ? ' · time up' : ''}</span></div>
      <div><span class="eyebrow">Per question</span><b>${Math.round(a.used / a.total)}s</b><span class="muted mono" style="font-size:12px">exam pace ${PER_Q}s</span></div></div>
      <div class="strip" aria-label="Question by question">${a.qns.map((n, i) => `<button class="${status(n)}" data-act="goto" data-n="${domId(n)}" title="${sp ? yearOf(a, n) + ' Q' + numOf(a, n) : 'Question ' + n}">${sp ? i + 1 : n}</button>`).join('')}</div></div>
  </section>
  <div class="filters" role="tablist">${[['all', 'All'], ['wrong', 'Mistakes'], ['bad', 'Incorrect'], ['na', 'Not answered'], ['ok', 'Correct'], ['flag', 'Flagged']].map(([k, l]) => {
    const c = k === 'wrong' ? counts.bad + counts.na : counts[k];
    return `<button class="chip ${f === k ? 'on' : ''}" data-act="filter" data-f="${k}" role="tab" aria-selected="${f === k}">${l} <span class="mono">${c}</span></button>`;
  }).join('')}</div>`;

  if (!shown.length) html += `<div class="tbl-wrap"><div class="empty">Nothing in this filter.</div></div>`;
  for (const n of shown) {
    const q = qOf(a, n), st = status(n), mine = a.answers[n], y = yearOf(a, n), num = numOf(a, n);
    const hs = hsHtml(q, L => L === q.a ? {tag: 'span', cls: 'r-ok'} : L === mine ? {tag: 'span', cls: 'r-bad'} : null);
    html += `<article class="rq ${st}" id="${domId(n)}">
      <div class="rq-head"><h3>${sp ? `${y} · Question ${num}` : 'Question ' + num}</h3><span class="tag">Part ${q.p}</span><span class="tag">${TOPIC[q.t]}</span><span class="tag">${DIFF[q.d]}</span>
        <span class="pill ${st}">${st === 'ok' ? 'Correct' : st === 'bad' ? 'Incorrect' : 'Not answered'}</span>${a.flags.includes(n) ? '<span class="pill flag">Flagged</span>' : ''}</div>
      <div class="scan-wrap"><div class="scan review" style="aspect-ratio:${q.w}/${q.h}"><img src="${q.img}" alt="Question ${num} from the ${y} paper" loading="lazy" width="${q.w}" height="${q.h}">${hs}</div></div>
      <div style="min-width:0;display:flex;flex-direction:column;gap:12px">
        <div class="answers"><span>Your answer: <b style="color:${st === 'ok' ? 'var(--ok)' : st === 'bad' ? 'var(--bad)' : 'var(--muted)'}">${mine || '—'}</b></span><span>Correct answer: <b style="color:var(--ok)">${q.a}</b></span></div>
        <div class="expl"><div class="eyebrow">Worked solution</div><p>${q.ex}</p></div>
      </div></article>`;
  }
  app.innerHTML = html;
}

/* ---------- events ---------- */
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const act = b.dataset.act;
  if (act === 'home') return go({name: 'dash'});
  if (act === 'start') return startTest(+b.dataset.y, 'full');
  if (act === 'retry') return startTest(+b.dataset.y, 'mistakes');
  if (act === 'speed') return startSpeed();
  if (act === 'speed-again') { go({name: 'dash'}); document.querySelector('.speed')?.scrollIntoView({block: 'center'}); return; }
  if (act === 'pref') { const k = b.dataset.k; speedPrefs[k] = b.dataset.v; LS.set('engaa.speedPrefs', speedPrefs); return renderDash(); }
  if (act === 'resume') return go({name: 'test'});
  if (act === 'abandon') {
    if (b.dataset.sure) { active = null; LS.del('engaa.active'); return render(); }
    b.dataset.sure = '1'; b.textContent = 'Discard answers?'; b.classList.add('primary'); return;
  }
  if (act === 'review') return go({name: 'review', id: b.dataset.id, filter: 'all'});
  if (act === 'filter') { view.filter = b.dataset.f; return renderReview(); }
  if (act === 'goto') {
    const jump = () => document.getElementById(b.dataset.n)?.scrollIntoView();
    if (view.filter !== 'all') { view.filter = 'all'; renderReview().then(jump); } else jump();
    return;
  }
  if (!active) return;
  const id = active.qns[active.idx];
  const locked = isSpeed(active) && active.answers[id];
  if (act === 'pick') { if (locked) return; active.answers[id] = b.dataset.l; }
  else if (act === 'clear') { if (locked) return; delete active.answers[id]; }
  else if (act === 'flag') { active.flags = active.flags.includes(id) ? active.flags.filter(x => x !== id) : [...active.flags, id]; }
  else if (act === 'prev') { active.idx = Math.max(0, active.idx - 1); view.confirm = false; }
  else if (act === 'next') { view.confirm = false; advance().then(() => { saveActive(); renderTest(); window.scrollTo(0, 0); }); return; }
  else if (act === 'jump') { active.idx = +b.dataset.i; view.confirm = false; }
  else if (act === 'ask-submit') { view.confirm = true; }
  else if (act === 'cancel-submit') { view.confirm = false; }
  else if (act === 'submit') { return submit(false); }
  saveActive(); renderTest();
  if (act === 'ask-submit') document.getElementById('confirm')?.scrollIntoView({block: 'nearest'});
});
document.addEventListener('keydown', e => {
  if (view.name !== 'test' || !active || e.metaKey || e.ctrlKey || e.altKey) return;
  const id = active.qns[active.idx], q = qOf(active, id); if (!q) return;
  const k = e.key.toUpperCase();
  const locked = isSpeed(active) && active.answers[id];
  if (k.length === 1 && q.o.includes(k)) { if (locked) return; active.answers[id] = k; }
  else if (e.key === 'ArrowRight') { e.preventDefault(); view.confirm = false; advance().then(ok => { if (ok) { saveActive(); renderTest(); } }); return; }
  else if (e.key === 'ArrowLeft') { if (active.idx <= 0) return; active.idx--; view.confirm = false; }
  else if (k === 'M') { active.flags = active.flags.includes(id) ? active.flags.filter(x => x !== id) : [...active.flags, id]; }
  else return;
  e.preventDefault(); saveActive(); renderTest();
});

/* ---------- boot ---------- */
if (active && !isSpeed(active) && Date.now() >= active.deadline) {
  ensureLoaded(active).then(() => submit(true)).catch(() => { active = null; LS.del('engaa.active'); render(); });
} else if (active) { view = {name: 'test'}; loadMeta().catch(() => {}).then(render); }
else render();
initDb();
})();
