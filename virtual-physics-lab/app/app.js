/* Virtual Physics Lab: app shell (router, home, school workspace, paper viewer, downloads). */
(function () {
  'use strict';
  const { el, store } = VPL;
  const ORDER = ['hci', 'acjc', 'asrjc', 'dhs', 'ejc', 'njc', 'nyjc', 'sajc', 'tjc', 'vjc'];
  const NAMES = {
    hci: ['HCI', 'Hwa Chong Institution'], acjc: ['ACJC', 'Anglo-Chinese Junior College'], asrjc: ['ASRJC', 'Anderson Serangoon Junior College'],
    dhs: ['DHS', 'Dunman High School'], ejc: ['EJC', 'Eunoia Junior College'], njc: ['NJC', 'National Junior College'],
    nyjc: ['NYJC', 'Nanyang Junior College'], sajc: ['SAJC', "St. Andrew's Junior College"], tjc: ['TJC', 'Temasek Junior College'], vjc: ['VJC', 'Victoria Junior College'],
  };
  const view = document.getElementById('view');
  const nav = document.getElementById('nav');
  let INDEX = {};
  const cache = {};

  // ---------- downloads (viewer save prompt) ----------
  let dlP = null;
  const downloads = () => (dlP = dlP || (window.claude && window.claude.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null)));
  function toast(msg) {
    const t = el('div', { class: 'toast', role: 'status' }, msg);
    document.body.append(t); setTimeout(() => t.remove(), 3200);
  }
  VPL.asset = (p) => (window.__FILES && window.__FILES[p]) || p;
  VPL.save = async function (filename, data, btn) {
    const d = await downloads();
    if (!d) {
      if (!window.claude) {  // standalone copy opened in an ordinary browser: a plain download works there
        const a = document.createElement('a'); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); a.download = filename;
        document.body.append(a); a.click(); a.remove(); return;
      }
      toast('Saving files is not available in this view. Open the lab in claude.ai to download.'); return;
    }
    try { await d.save({ filename, data }); toast('Saved ' + filename); }
    catch (e) { if (e && e.code === 'declined') return; toast(e && e.code === 'rate_limited' ? 'A save prompt is already open.' : 'Could not save: ' + ((e && e.message) || 'unavailable')); }
  };
  async function saveFile(path, btn) {
    btn && (btn.disabled = true);
    try {
      let b;
      if (path.endsWith('.xlsx')) {  // workbooks are shipped base64-encoded and rebuilt here
        const r = await fetch(path + '.b64.txt'); if (!r.ok) throw new Error(r.status);
        const bin = atob((await r.text()).trim()), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        b = new Blob([u]);
      } else { const r = await fetch(path); if (!r.ok) throw new Error(r.status); b = await r.blob(); }
      await VPL.save(path.split('/').pop(), b, btn);
    }
    catch (e) { toast('Could not load ' + path.split('/').pop()); }
    btn && (btn.disabled = false);
  }

  // ---------- data ----------
  async function loadIndex() { try { INDEX = await (await fetch('data/index.json')).json(); } catch (e) { INDEX = {}; } }
  async function loadSchool(k) { if (!cache[k]) cache[k] = fetch(`data/${k}.json`).then((r) => r.json()); return cache[k]; }

  // ---------- nav ----------
  function drawNav(cur) {
    nav.innerHTML = '';
    ORDER.forEach((k) => nav.append(el('a', { href: '#' + k, class: (k === cur ? 'on' : '') + (INDEX[k] ? '' : ' soon'), 'aria-current': k === cur ? 'page' : false }, NAMES[k][0])));
  }

  // ---------- home ----------
  function home() {
    drawNav(null);
    const built = ORDER.filter((k) => INDEX[k]);
    const trace = el('canvas', { 'aria-label': 'Animated trace of a damped oscillation' });
    view.innerHTML = '';
    view.append(
      el('section', { class: 'wrap hero' },
        el('div', {},
          el('h1', { html: 'Ten prelim practicals.<br>One <em>virtual bench</em>.' }),
          el('p', {}, '2026 H2 Physics Paper 4 from ten schools, each with suggested answers written in blue on the paper, margin notes on what examiners look for, practice spreadsheets, and a tabletop simulation for collecting your own readings.')),
        el('div', { class: 'trace' }, trace, el('div', { class: 'small' }, el('span', {}, 'x = A e^(−bt) cos ωt'), el('span', {}, 'stopwatch: 0.01 s · ruler: 0.1 cm')))),
      el('section', { class: 'wrap modes' },
        el('div', { class: 'mode' }, el('h3', {}, el('span', { class: 'ink' }, '■'), 'Paper'), el('p', {}, 'The original question paper with suggested answers overlaid in blue. Hide them, or reveal one at a time to test yourself.')),
        el('div', { class: 'mode' }, el('h3', {}, el('span', { class: 'ink' }, '■'), 'Lab'), el('p', {}, 'Set up the apparatus, read scales through the magnifier, time oscillations yourself, and record your own table and graph.')),
        el('div', { class: 'mode' }, el('h3', {}, el('span', { class: 'ink' }, '■'), 'Spreadsheets'), el('p', {}, 'Raw data on the first tab for you to process; suggested processing, trendline and answers on the second.'))),
      el('section', { class: 'wrap' },
        el('div', { class: 'grid-h' }, el('h2', {}, 'Choose a school'), el('span', { class: 'small' }, `${built.length} of 10 papers ready`)),
        el('div', { class: 'sgrid' }, ...ORDER.map((k) => {
          const s = INDEX[k];
          if (!s) return el('div', { class: 'scard soon' }, el('div', { class: 'sh' }, el('span', { class: 'code' }, NAMES[k][0]), el('span', { class: 'date' }, 'in preparation')), el('div', { class: 'name' }, NAMES[k][1]));
          return el('a', { class: 'scard', href: '#' + k },
            el('div', { class: 'sh' }, el('span', { class: 'code' }, s.short), el('span', { class: 'date' }, s.date)),
            el('div', { class: 'name' }, s.name),
            el('ol', {}, ...s.questions.map((q) => el('li', {}, el('b', {}, q.id), el('span', {}, q.title), el('i', {}, q.marks + ' m')))));
        }))));
    animTrace(trace);
  }
  function animTrace(cv) {
    const ctx = cv.getContext('2d'); let t0 = performance.now();
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const frame = (now) => {
      if (!cv.isConnected) return;
      const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = css('--line'); ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const tt = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (now - t0) / 1000;
      ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2.2; ctx.beginPath();
      for (let x = 0; x <= W; x += 2) { const s = x / W * 9; const y = H / 2 - (H * 0.4) * Math.exp(-0.28 * s) * Math.cos(2.6 * s - tt * 2.2); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = css('--warm'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
      for (let x = 0; x <= W; x += 3) { const s = x / W * 9; const y = H / 2 - (H * 0.4) * Math.exp(-0.28 * s); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // ---------- school workspace ----------
  let curLab = null;
  async function school(k, qid, mode) {
    drawNav(k);
    if (!INDEX[k]) { view.innerHTML = ''; view.append(el('div', { class: 'wrap empty' }, el('h2', {}, NAMES[k] ? NAMES[k][1] : 'Not found'), el('p', {}, 'This paper is still being prepared.'))); return; }
    const D = await loadSchool(k);
    const q = D.questions.find((x) => x.id.toLowerCase() === (qid || '').toLowerCase()) || D.questions[0];
    mode = mode || store.get('mode', 'paper');
    if (mode === 'lab' && !(q.sim && VPL.sims[q.sim])) mode = 'paper';
    store.set('mode', mode);
    if (curLab) { curLab.destroy(); curLab = null; }
    const go = (qq, mm) => { location.hash = `${k}-${qq.toLowerCase()}-${mm}`; };
    const pdfName = `${D.short}_P4_annotated.pdf`;
    const pdfBtn = el('button', { class: 'btn', onclick: (e) => saveFile('dl/' + pdfName, e.currentTarget) }, 'Download annotated PDF');
    view.innerHTML = '';
    const wrap = el('div', { class: 'wrap' });
    wrap.append(
      el('section', { class: 'shead' },
        el('div', {}, el('h1', {}, D.name), el('div', { class: 'meta' }, el('span', { class: 'chip blue' }, '9478/04 Paper 4'), el('span', { class: 'chip' }, D.date), el('span', { class: 'chip' }, D.questions.reduce((a, b) => a + b.marks, 0) + ' marks'))),
        pdfBtn),
      el('div', { class: 'qtabs', role: 'tablist' }, ...D.questions.map((x) => el('button', { class: 'qtab' + (x === q ? ' on' : ''), role: 'tab', 'aria-selected': x === q ? 'true' : 'false', onclick: () => go(x.id, mode) },
        el('b', {}, x.id), el('span', {}, x.title), el('small', {}, x.marks + ' m')))),
      el('div', { class: 'qsum' }, el('div', {}, el('p', {}, q.summary), el('div', { class: 'skills' }, ...(q.skills || []).map((s) => el('span', { class: 'chip' }, s)))),
        el('div', { class: 'seg', role: 'group', 'aria-label': 'View' },
          ...[['paper', 'Paper + answers'], ['lab', 'Lab simulation'], ['data', 'Spreadsheets']].map(([m, lab]) =>
            el('button', { class: 'seg-b' + (m === mode ? ' on' : ''), disabled: m === 'lab' && !(q.sim && VPL.sims[q.sim]) ? '' : false, onclick: () => go(q.id, m) }, lab)))));
    const body = el('div');
    wrap.append(body);
    view.append(wrap);
    if (mode === 'paper') paper(body, D, q);
    else if (mode === 'lab') { const box = el('div', { class: 'lab' }); body.append(el('div', { class: 'viewbar' }, el('h2', {}, 'Lab: ' + VPL.sims[q.sim].title)), box); curLab = new VPL.Lab(box, VPL.sims[q.sim]); }
    else sheets(body, D, q);
  }

  function paper(body, D, q) {
    let ansMode = store.get('ans', 'show'), notesOn = store.get('notes', true);
    const pagesEl = el('div', { class: 'pages' });
    const setCls = () => {
      pagesEl.classList.toggle('hide-ans', ansMode === 'hide');
      pagesEl.classList.toggle('reveal', ansMode === 'reveal');
      pagesEl.classList.toggle('no-notes', !notesOn);
    };
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Answers' }, ...[['show', 'Show answers'], ['reveal', 'Tap to reveal'], ['hide', 'Hide answers']].map(([m, lab]) => {
      const b = el('button', { class: 'seg-b' + (ansMode === m ? ' on' : ''), onclick: () => { ansMode = m; store.set('ans', m); seg.querySelectorAll('.seg-b').forEach((x) => x.classList.remove('on')); b.classList.add('on'); if (m === 'reveal') pagesEl.querySelectorAll('.shown').forEach((x) => x.classList.remove('shown')); setCls(); } }, lab);
      return b;
    }));
    const nb = el('button', { class: 'btn toggle' + (notesOn ? ' on' : ''), onclick: () => { notesOn = !notesOn; store.set('notes', notesOn); nb.classList.toggle('on', notesOn); setCls(); } }, 'Margin notes');
    body.append(el('div', { class: 'viewbar' }, seg, el('div', { class: 'legend' },
      el('span', {}, el('i', { style: 'background:var(--accent)' }), 'tip'), el('span', {}, el('i', { style: 'background:var(--ok)' }), 'marks'),
      el('span', {}, el('i', { style: 'background:var(--warm)' }), 'why'), el('span', {}, el('i', { style: 'background:var(--bad)' }), 'watch out'), nb)), pagesEl);
    setCls();
    const LABEL = { tip: 'TIP', warn: 'WATCH OUT', why: 'WHY', mark: 'MARKS' };
    q.pages.forEach((p) => {
      const pd = D.pages[String(p)] || { svg: '', notes: [] };
      const sheet = el('div', { class: 'sheet', style: `aspect-ratio:${D.W}/${D.H}` },
        el('img', { src: VPL.asset(`papers/${D.key}/p${String(p).padStart(2, '0')}.jpg`), alt: `${D.short} Paper 4, page ${p}`, loading: 'lazy', width: Math.round(D.W * 110 / 72), height: Math.round(D.H * 110 / 72) }),
        el('span', { class: 'pno' }, 'p' + p));
      if (pd.svg) {
        sheet.insertAdjacentHTML('beforeend', pd.svg);
        const svg = sheet.querySelector('svg');
        requestAnimationFrame(() => addCovers(svg));
      }
      const notes = el('aside', { class: 'notes', 'aria-label': 'Margin notes for page ' + p }, ...pd.notes.map((n) => el('div', { class: 'note ' + n.kind, 'data-y': n.y }, el('b', {}, LABEL[n.kind] || 'TIP'), n.text)));
      const fig = el('figure', { class: 'pg', style: 'margin:0' }, sheet, notes);
      pagesEl.append(fig);
      const lay = () => layoutNotes(sheet, notes, D.H);
      new ResizeObserver(lay).observe(sheet);
    });
  }
  function addCovers(svg) {
    svg.querySelectorAll('g.ans').forEach((g) => {
      let b; try { b = g.getBBox(); } catch (e) { return; }
      if (!b.width) return;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', b.x - 2); r.setAttribute('y', b.y - 2); r.setAttribute('width', b.width + 4); r.setAttribute('height', b.height + 4); r.setAttribute('rx', 2);
      r.setAttribute('class', 'cover');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title'); title.textContent = 'Reveal this answer'; r.append(title);
      r.addEventListener('click', () => { g.classList.add('shown'); r.classList.add('shown'); });
      svg.append(r);
    });
  }
  function layoutNotes(sheet, notes, H) {
    if (getComputedStyle(notes).display === 'grid') { notes.style.height = ''; return; }
    const h = sheet.clientHeight; notes.style.height = h + 'px';
    let floor = 0;
    notes.querySelectorAll('.note').forEach((n) => {
      const want = (+n.dataset.y / H) * h - 8;
      const top = Math.max(want, floor);
      n.style.top = top + 'px';
      floor = top + n.offsetHeight + 8;
    });
    if (floor > h) notes.style.height = floor + 'px';
  }

  function sheets(body, D, q) {
    body.append(el('div', { class: 'viewbar' }, el('h2', {}, 'Practice spreadsheets'), el('span', { class: 'small' }, 'Tab 1: raw data with yellow cells for your processing · Tab 2: suggested processing, trendline and answers')));
    const list = el('div', { class: 'xl-list' });
    (q.xlsx || []).forEach((x) => {
      const file = typeof x === 'string' ? x : x.file;
      const b = el('button', { class: 'btn primary', onclick: (e) => saveFile('dl/' + file, e.currentTarget) }, 'Download .xlsx');
      list.append(el('div', { class: 'xl' }, el('h3', {}, file), el('p', { class: 'small' }, (x.desc) || 'Workbook for ' + q.id + '.'),
        el('div', { class: 'tabs' }, el('span', { class: 'chip warm' }, 'Raw data'), el('span', { class: 'chip blue' }, 'Suggested solution')), el('div', {}, b)));
    });
    if (!(q.xlsx || []).length) list.append(el('p', { class: 'empty' }, 'This question has no data-analysis part, so there is no spreadsheet.'));
    const pdfName = `${D.short}_P4_annotated.pdf`;
    list.append(el('div', { class: 'xl' }, el('h3', {}, pdfName), el('p', { class: 'small' }, 'The whole paper with the blue suggested answers and a notes column on every page, ready for printing or annotating on a tablet.'),
      el('div', {}, el('button', { class: 'btn', onclick: (e) => saveFile('dl/' + pdfName, e.currentTarget) }, 'Download PDF'))));
    body.append(list);
  }

  // ---------- router ----------
  async function route() {
    const h = (location.hash || '').slice(1).toLowerCase();
    if (!h || h === 'home') { if (curLab) { curLab.destroy(); curLab = null; } home(); window.scrollTo(0, 0); return; }
    const [k, qid, mode] = h.split('-');
    await school(k, qid, mode);
  }
  window.addEventListener('hashchange', () => { route(); });
  loadIndex().then(route);
})();
