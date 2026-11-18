/* The Fairy Trove — the dashboard.
 * State, saving (the artifact's db, else this browser), rendering, Claude weaving, check-ins,
 * and the one-way sync of each week into the Weekly Agenda on Vi's Starmap in Notion.
 */
(function () {
  'use strict';
  var P = window.FTPlan, N = window.FTNotion;
  var NOTION = 'Notion';
  var STARMAP_ID = '16872bf06f3180cebf9dd82a1a6c063c';
  var STARMAP_URL = 'https://www.notion.so/' + STARMAP_ID;
  var CHECKABLE = { primary: 1, secondary: 1, routine: 1, meal: 1, admin: 1, fixed: 1, travel: 0, checkin: 1 };
  var GLYPH = { primary: '★', secondary: '✿', checkin: '✦' };
  var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var EST = [['', 'auto'], [15, '15m'], [30, '30m'], [45, '45m'], [60, '1h'], [75, '1h 15'], [90, '1h 30'], [120, '2h'], [150, '2h 30'], [180, '3h'], [240, '4h']];
  var HINTS = {
    primary: ['e.g. Timed practice paper, then mark it', 'e.g. Final read of the personal statement', 'e.g. Send the partner emails'],
    secondary: ['e.g. Chem flashcards', 'e.g. 20-minute watercolour sketch', 'e.g. Plan the next club session']
  };
  var ENERGY = [[1, 'drained'], [2, 'low'], [3, 'steady'], [4, 'good'], [5, 'glowing']];

  /* ------------------------------------------------------------------ helpers */
  function $(id) { return document.getElementById(id); }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'hidden' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO() { return N.toISO(new Date()); }
  function weekStartOf(iso) { return N.addDays(iso, -N.parseISO(iso).getDay()); }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function dayName(iso) { return WD[N.parseISO(iso).getDay()]; }
  function longDate(iso) { var d = N.parseISO(iso); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function shortClock(min, ap) {
    var m = ((min % 1440) + 1440) % 1440, hh = Math.floor(m / 60), mm = m % 60;
    return (hh % 12 || 12) + (mm ? '.' + pad2(mm) : '') + (ap ? (hh < 12 ? 'am' : 'pm') : '');
  }
  function clockOf(ms) { var d = new Date(ms); return shortClock(d.getHours() * 60 + d.getMinutes(), true); }
  function ago(ms) {
    var s = (Date.now() - ms) / 1000;
    if (s < 45) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  }
  function partName(min) { return min < 720 ? 'Morning' : min < 1080 ? 'Afternoon' : 'Evening'; }
  function isToday() { return S.date === todayISO(); }

  /* ------------------------------------------------------------------ state */
  var S = {
    cfg: P.defaultConfig(),
    days: {}, weeks: {},
    date: todayISO(),
    followToday: true,
    composing: {},
    weaving: null,
    store: null,
    sample: undefined, mcp: undefined, perms: null,
    loadedWeek: null,
    readOnly: false,
    menu: null, editing: null,
    scene: null,
    composerFor: null
  };
  S.cfg.notion = Object.assign({ auto: true, page: STARMAP_URL, marker: '', armed: false }, S.cfg.notion || {});

  function mergeConfig(data) {
    var d = P.defaultConfig(), c = Object.assign({}, d, data || {});
    c.focus = Object.assign({}, d.focus, (data && data.focus) || {});
    c.checkins = Object.assign({}, d.checkins, (data && data.checkins) || {});
    c.notion = Object.assign({ auto: true, page: STARMAP_URL, marker: '', armed: false }, (data && data.notion) || {});
    if (!Array.isArray(c.places) || !c.places.length) c.places = d.places;
    if (!c.places.some(function (p) { return p.id === 'home'; })) c.places.unshift({ id: 'home', name: 'Home', travel: 0, mode: '' });
    if (!Array.isArray(c.routines)) c.routines = d.routines;
    return c;
  }
  function newTask(tier) { return { id: P.uid('t'), title: '', tier: tier, est: null, done: false }; }
  function normalizeDay(d) {
    d.tasks = Array.isArray(d.tasks) ? d.tasks : [];
    var prim = d.tasks.filter(function (t) { return t.tier === 'primary'; }), sec = d.tasks.filter(function (t) { return t.tier !== 'primary'; });
    sec.forEach(function (t) { t.tier = 'secondary'; });
    while (prim.length < 3) prim.push(newTask('primary'));
    while (sec.length < 3) sec.push(newTask('secondary'));
    d.tasks = prim.concat(sec);
    d.admin = Array.isArray(d.admin) ? d.admin : [];
    d.fixed = Array.isArray(d.fixed) ? d.fixed : [];
    d.places = Object.assign({ am: 'home', pm: 'home', eve: 'home' }, d.places || {});
    d.checkins = Array.isArray(d.checkins) ? d.checkins : [];
    d.week = weekStartOf(d.date);
    d.wake = d.wake || S.cfg.wake; d.sleep = d.sleep || S.cfg.sleep;
    return d;
  }
  function getDay(iso) { return S.days[iso] ? normalizeDay(S.days[iso]) : null; }
  function ensureDay(iso) {
    if (!S.days[iso]) S.days[iso] = P.emptyDay(iso, weekStartOf(iso), S.cfg);
    return normalizeDay(S.days[iso]);
  }
  function weekDoc(ws) { if (!S.weeks[ws]) S.weeks[ws] = { label: '', notion: null }; return S.weeks[ws]; }
  function slotTasks(day) {          // the six pollen slots: three primary, three secondary
    var prim = day.tasks.filter(function (t) { return t.tier === 'primary'; }).slice(0, 3);
    var sec = day.tasks.filter(function (t) { return t.tier !== 'primary'; }).slice(0, 3);
    return prim.concat(sec);
  }
  function hasTasks(day) { return day.tasks.some(function (t) { return t.title; }); }

  /* ------------------------------------------------------------------ saving */
  function localStore() {
    var mem = {};
    var ls = null;
    try { ls = window.localStorage; ls.getItem('x'); } catch (e) { ls = null; }
    function get(k) { if (ls) { try { var v = ls.getItem('fairy-trove:v1:' + k); return v ? JSON.parse(v) : null; } catch (e) { /* fall through */ } } return mem[k] ? clone(mem[k]) : null; }
    function put(k, v) { mem[k] = clone(v); if (ls) { try { ls.setItem('fairy-trove:v1:' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } } }
    return {
      kind: ls ? 'local' : 'memory',
      watchConfig: function (cb) { cb(get('config')); return function () {}; },
      watchWeek: function (ws, cb) {
        var days = [];
        N.weekDates(ws).forEach(function (iso) { var d = get('day:' + iso); if (d) days.push(d); });
        cb(days, get('week:' + ws), true);
        return function () {};
      },
      getDay: function (iso) { return Promise.resolve(get('day:' + iso)); },
      saveConfig: function (c) { put('config', c); },
      saveDay: function (d) { put('day:' + d.date, d); },
      saveWeek: function (ws, w) { put('week:' + ws, w); },
      dirty: function () { return false; }
    };
  }

  function dbStore(db, uid) {
    var base = 'data/users/' + uid;
    var paths = {
      config: base + '/config',
      day: function (iso) { return base + '/trove/days/' + iso; },
      week: function (ws) { return base + '/trove/weeks/' + ws; }
    };
    var daysCol = db.collection(base + '/trove/days');
    var pending = {}, busy = {}, timers = {}, failures = 0;
    function flush(path) {
      if (busy[path] || !pending[path]) return;
      var data = pending[path]; delete pending[path]; busy[path] = true;
      db.doc(path).set(data).then(function () { failures = 0; }, function (e) {
        var code = e && e.code;
        if (code === 'invalid_argument' && !S.readOnly) { S.readOnly = true; toast('This view can’t save changes, so edits stay on this screen only.'); }
        else if (code === 'quota_exceeded') toast('The trove is full. Old days need clearing before new ones can be saved.');
        else if ((code === 'unavailable' || code === 'resource_exhausted') && failures < 2) { failures++; if (!pending[path]) pending[path] = data; setTimeout(function () { flush(path); }, 1500 + Math.random() * 1500); }
        else if (code !== 'revoked') toast('Saving didn’t go through. Your last change may not be kept.');
      }).then(function () { busy[path] = false; if (pending[path]) flush(path); });
    }
    function write(path, data, delay) {
      pending[path] = clone(data);
      clearTimeout(timers[path]);
      timers[path] = setTimeout(function () { delete timers[path]; flush(path); }, delay == null ? 700 : delay);
    }
    function dirty(path) { return !!(pending[path] || busy[path] || timers[path]); }
    return {
      kind: 'db',
      watchConfig: function (cb) {
        return db.doc(paths.config).onSnapshot(function (snap) {
          if (dirty(paths.config) || snap.metadata.hasPendingWrites) return;
          cb(snap.exists ? clone(snap.data()) : null, !snap.metadata.fromCache);
        }, function () { cb(null, true); });
      },
      watchWeek: function (ws, cb) {
        var weekData = null, daysData = null, firm = { d: false, w: false };
        function emit() { if (daysData) cb(daysData, weekData, firm.d); }
        var u1 = daysCol.where('week', '==', ws).onSnapshot(function (snap) {
          daysData = snap.docs.filter(function (d) { return !dirty(paths.day(d.id)); }).map(function (d) { return clone(d.data()); });
          firm.d = firm.d || !snap.metadata.fromCache;
          emit();
        }, function () { daysData = daysData || []; firm.d = true; emit(); });
        var u2 = db.doc(paths.week(ws)).onSnapshot(function (snap) {
          if (dirty(paths.week(ws)) || snap.metadata.hasPendingWrites) return;
          weekData = snap.exists ? clone(snap.data()) : null; firm.w = true; emit();
        }, function () { /* the week label falls back to its number */ });
        return function () { u1(); u2(); };
      },
      getDay: function (iso) { return db.doc(paths.day(iso)).get().then(function (s) { return s.exists ? clone(s.data()) : null; }, function () { return null; }); },
      saveConfig: function (c) { write(paths.config, c, 400); },
      saveDay: function (d) { write(paths.day(d.date), d); },
      saveWeek: function (ws, w) { write(paths.week(ws), w, 400); },
      dirty: function (kind, key) { return dirty(kind === 'day' ? paths.day(key) : kind === 'week' ? paths.week(key) : paths.config); }
    };
  }

  function saveDay(day, opts) {
    day.updatedAt = Date.now();
    if (S.store) S.store.saveDay(stripDay(day));
    if (!(opts && opts.quiet)) { renderWeek(); syncScene(); renderNow(); }
    if (!day.example) scheduleSync(day.week);
  }
  function stripDay(day) {             // empty slots are not worth storing
    var d = clone(day);
    d.tasks = d.tasks.filter(function (t) { return t.title || t.done; });
    d.admin = d.admin.filter(function (a) { return a.title; });
    d.fixed = d.fixed.filter(function (f) { return f.title || f.start; });
    return d;
  }
  function saveConfig() { if (S.store) S.store.saveConfig(S.cfg); }
  function saveWeek(ws) { var w = weekDoc(ws); w.updatedAt = Date.now(); if (S.store) S.store.saveWeek(ws, w); }

  /* ------------------------------------------------------------------ startup */
  var unwatchWeek = null;
  function watchWeek(ws) {
    if (S.loadedWeek === ws || !S.store) return;
    if (unwatchWeek) unwatchWeek();
    S.loadedWeek = ws;
    var timer = setTimeout(function () { if (S.loadedWeek === ws && !S.weekFirm) showLoadNote(true); }, 10000);
    S.weekFirm = false;
    unwatchWeek = S.store.watchWeek(ws, function (days, week, firm) {
      if (firm) { S.weekFirm = true; clearTimeout(timer); showLoadNote(false); }
      days.forEach(function (d) {
        if (!d || !d.date) return;
        if (S.store.dirty('day', d.date)) return;
        var mine = S.days[d.date];
        if (mine && mine.updatedAt && (!d.updatedAt || mine.updatedAt >= d.updatedAt)) return;
        S.days[d.date] = normalizeDay(d);
      });
      var mineW = S.weeks[ws];
      if (week && !S.store.dirty('week', ws) && !(mineW && mineW.updatedAt && (!week.updatedAt || mineW.updatedAt >= week.updatedAt))) S.weeks[ws] = Object.assign({ label: '', notion: null }, week);
      if (S.composerFor && S.composerFor.indexOf(S.date + ':') === 0 && document.activeElement && document.activeElement.closest && document.activeElement.closest('#compose-form')) {
        renderWeek(); renderNow(); syncScene();           // mid-typing: leave the form alone
      } else render();
      if (firm) checkPendingSync(ws);
    });
  }
  function showLoadNote(on) {
    var el = $('load-note');
    if (on && !el) {
      el = h('p', { class: 'note', id: 'load-note' }, 'Your saved trove hasn’t answered yet. Anything you change now is kept and saved once it does.');
      $('plan-scroll').insertBefore(el, $('plan-scroll').firstChild);
    } else if (!on && el) el.remove();
  }

  function startStore() {
    var C = window.claude;
    var use = C && typeof C.use === 'function' ? function (n) { return C.use(n).catch(function () { return null; }); } : function () { return Promise.resolve(null); };
    use('sample').then(function (s) { S.sample = s || null; renderComposerNote(); });
    use('mcp').then(function (m) { S.mcp = m || null; updateSyncChip(); });
    use('permissions').then(function (p) { S.perms = p || null; });
    Promise.all([use('db'), use('user')]).then(function (r) {
      var db = r[0], user = r[1];
      if (db && user) return user.id().then(function (id) { return id ? dbStore(db, id) : localStore(); });
      return localStore();
    }).then(function (store) {
      S.store = store;
      store.watchConfig(function (data) {
        var had = JSON.stringify(S.cfg);
        S.cfg = mergeConfig(data);
        if (JSON.stringify(S.cfg) !== had) render();
      });
      watchWeek(weekStartOf(S.date));
      ensureNeighbours();
      render();
    });
  }
  function ensureNeighbours() {        // yesterday may sit in last week: fetch it for "carry over"
    var y = N.addDays(todayISO(), -1);
    if (!S.days[y] && S.store) S.store.getDay(y).then(function (d) { if (d && !S.days[y]) { S.days[y] = normalizeDay(d); renderWeek(); } });
  }

  /* ------------------------------------------------------------------ rendering */
  function render() {
    renderTop();
    renderPlanPanel();
    renderNow();
    renderWeek();
    syncScene();
    updateSyncChip();
  }

  function renderTop() {
    var today = isToday();
    $('day-weekday').textContent = today ? 'Today' : dayName(S.date);
    $('day-date').textContent = (today ? dayName(S.date) + ' · ' : '') + longDate(S.date);
    $('go-today').hidden = today;
  }

  function greeting() {
    var m = nowMin(), name = S.cfg.name ? ', ' + S.cfg.name : '';
    return (m < 720 ? 'Good morning' : m < 1080 ? 'Good afternoon' : 'Good evening') + name;
  }

  function renderPlanPanel() {
    var day = ensureDay(S.date), today = isToday();
    var composing = !!S.composing[S.date] || !day.plan;
    var weaving = S.weaving && S.weaving.date === S.date;
    var ws = weekStartOf(S.date), wk = weekDoc(ws);
    $('plan-eyebrow').textContent = (today ? greeting() : dayName(S.date) + ' ' + longDate(S.date)) + ' · Week ' + (wk.label || N.defaultWeekLabel(ws));
    $('plan-title').textContent = weaving ? 'Weaving the day' :
      composing ? (day.plan ? 'Change ' + (today ? 'today' : dayName(S.date)) + '’s pollen' : today ? 'What will you win today?' : 'What will you win on ' + dayName(S.date) + '?') :
      (today ? 'Today’s flight path' : dayName(S.date) + '’s flight path');
    $('example-ribbon').hidden = !day.example;
    $('weaving').hidden = !weaving;
    $('composer-wrap').hidden = weaving || !composing || !!day.example && !!day.plan;
    $('plan-view').hidden = weaving || (composing && !day.example) || !day.plan;
    if (!$('composer-wrap').hidden) {
      var key = S.date + ':' + (day.updatedAt || 0) + ':' + (day.plan ? 1 : 0);
      if (S.composerFor !== key) buildComposer(day);
      S.composerFor = key;
    } else S.composerFor = null;
    if (!$('plan-view').hidden) renderPlanView(day);
  }

  /* ---------- the composer ---------- */
  function editDay(day) {
    day.updatedAt = Date.now();
    if (S.store) S.store.saveDay(stripDay(day));
    S.composerFor = S.date + ':' + day.updatedAt + ':' + (day.plan ? 1 : 0);
    renderWeek(); syncScene(); renderNow();
    if (!day.example && day.plan) scheduleSync(day.week);
  }

  function buildComposer(day) {
    var wrap = $('composer-wrap'); clear(wrap);
    var form = h('form', { class: 'composer', id: 'compose-form', novalidate: true });
    form.addEventListener('submit', function (e) { e.preventDefault(); weave(day.plan ? replanOpts() : {}); });

    ['primary', 'secondary'].forEach(function (tier) {
      var p = tier === 'primary';
      var fs = h('fieldset', { class: 'group' },
        h('legend', null, h('span', { class: 'lmark ' + (p ? 'p' : 's'), 'aria-hidden': 'true' }, p ? '★' : '✿'), p ? 'Win the day' : 'Bonus pollen',
          h('small', null, p ? 'the three that make today a win' : 'three lighter ones, if the day allows')));
      day.tasks.filter(function (t) { return t.tier === tier; }).slice(0, 3).forEach(function (t, i) {
        var id = (p ? 'p' : 's') + (i + 1);
        var input = h('input', { class: 'task-input', id: id + '-title', type: 'text', maxlength: 90, autocomplete: 'off', value: t.title || '', placeholder: HINTS[tier][i], 'aria-label': (p ? 'Win-the-day task ' : 'Bonus task ') + (i + 1) });
        input.addEventListener('input', function () { t.title = input.value; editDay(day); });
        var sel = h('select', { class: 'est', id: id + '-est', 'aria-label': 'Time needed for ' + (p ? 'win-the-day task ' : 'bonus task ') + (i + 1) });
        EST.forEach(function (o) { sel.appendChild(h('option', { value: String(o[0]), selected: String(t.est || '') === String(o[0]) }, o[1])); });
        sel.addEventListener('change', function () { t.est = sel.value ? Number(sel.value) : null; editDay(day); });
        fs.appendChild(h('div', { class: 'task-row' + (t.done ? ' is-done' : ''), 'data-tier': tier }, input, sel));
      });
      form.appendChild(fs);
    });

    // small admin
    var adminList = h('ul', { class: 'admin-list', id: 'admin-list' });
    function drawAdmin() {
      clear(adminList);
      day.admin.forEach(function (a) {
        var go = h('button', { type: 'button', class: 'go-toggle', 'aria-pressed': a.go ? 'true' : 'false', title: 'Can be done on the go, e.g. on the MRT' }, 'on the go');
        go.addEventListener('click', function () { a.go = !a.go; go.setAttribute('aria-pressed', a.go ? 'true' : 'false'); editDay(day); });
        var x = h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove ' + a.title }, '×');
        x.addEventListener('click', function () { day.admin = day.admin.filter(function (o) { return o !== a; }); drawAdmin(); editDay(day); });
        adminList.appendChild(h('li', { class: 'admin-chip' + (a.done ? ' is-done' : '') }, h('span', { class: 'ac-text', text: a.title }), go, x));
      });
      if (!day.admin.length) adminList.appendChild(h('li', { class: 'fine' }, 'Emails, forms, payments: anything under ten minutes.'));
    }
    drawAdmin();
    var adminIn = h('input', { class: 'field', id: 'admin-new', type: 'text', maxlength: 80, autocomplete: 'off', placeholder: 'Add a small task, then Enter', 'aria-label': 'New admin task' });
    function addAdmin() {
      var v = adminIn.value.trim(); if (!v) return;
      day.admin.push({ id: P.uid('a'), title: v, done: false, go: false }); adminIn.value = ''; drawAdmin(); editDay(day); adminIn.focus();
    }
    adminIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addAdmin(); } });
    form.appendChild(h('fieldset', { class: 'group' },
      h('legend', null, h('span', { class: 'lmark a', 'aria-hidden': 'true' }, '◆'), 'Small admin', h('small', null, 'batched into short sprinkles; “on the go” ones ride along on trips')),
      adminList, h('div', { class: 'add-row' }, adminIn, h('button', { type: 'button', class: 'btn btn-small', onclick: addAdmin }, 'Add'))));

    // where
    var where = h('div', { class: 'where-grid' });
    [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening']].forEach(function (part) {
      var seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': part[1] + ' place' });
      S.cfg.places.forEach(function (pl) {
        var r = h('input', { type: 'radio', name: 'where-' + part[0], id: 'where-' + part[0] + '-' + pl.id, value: pl.id, checked: (day.places[part[0]] || 'home') === pl.id });
        r.addEventListener('change', function () { if (r.checked) { day.places[part[0]] = pl.id; editDay(day); } });
        seg.appendChild(h('label', null, r, h('span', null, pl.name)));
      });
      where.appendChild(h('div', { class: 'where-row' }, h('span', null, part[1]), seg));
    });
    form.appendChild(h('fieldset', { class: 'group' }, h('legend', null, 'Where you’ll work', h('small', null, 'trips between places are added for you')), where));

    // fixed commitments
    var fixedList = h('div', { class: 'fixed-list' });
    function drawFixed() {
      clear(fixedList);
      day.fixed.forEach(function (f, i) {
        var t = h('input', { class: 'field', id: 'fixed-' + i + '-title', type: 'text', maxlength: 70, value: f.title || '', placeholder: 'Class, meeting, appointment', 'aria-label': 'Commitment ' + (i + 1) });
        t.addEventListener('input', function () { f.title = t.value; editDay(day); });
        var s = h('input', { class: 'time-in', id: 'fixed-' + i + '-start', type: 'time', value: f.start || '', 'aria-label': 'Starts' });
        s.addEventListener('change', function () { f.start = s.value; editDay(day); });
        var e = h('input', { class: 'time-in', id: 'fixed-' + i + '-end', type: 'time', value: f.end || '', 'aria-label': 'Ends' });
        e.addEventListener('change', function () { f.end = e.value; editDay(day); });
        var pl = h('select', { class: 'sel', id: 'fixed-' + i + '-place', 'aria-label': 'Where' }, h('option', { value: '', selected: !f.place }, 'Wherever I am'));
        S.cfg.places.forEach(function (p) { pl.appendChild(h('option', { value: p.id, selected: f.place === p.id }, 'At ' + p.name)); });
        pl.addEventListener('change', function () { f.place = pl.value || null; editDay(day); });
        var x = h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove commitment' }, '×');
        x.addEventListener('click', function () { day.fixed.splice(i, 1); drawFixed(); editDay(day); });
        fixedList.appendChild(h('div', { class: 'fixed-row' }, t, s, e, pl, x));
      });
    }
    drawFixed();
    form.appendChild(h('fieldset', { class: 'group' }, h('legend', null, 'Fixed in the day', h('small', null, 'these stay exactly where they are')), fixedList,
      h('div', null, h('button', { type: 'button', class: 'btn btn-small', onclick: function () { day.fixed.push({ id: P.uid('f'), title: '', start: '', end: '', place: null }); drawFixed(); var last = fixedList.querySelector('.fixed-row:last-child input'); if (last) last.focus(); } }, '+ Add a commitment'))));

    // shape of the day
    var wake = h('input', { class: 'time-in', id: 'day-wake', type: 'time', value: day.wake || S.cfg.wake });
    wake.addEventListener('change', function () { if (wake.value) { day.wake = wake.value; editDay(day); } });
    var sleep = h('input', { class: 'time-in', id: 'day-sleep', type: 'time', value: day.sleep || S.cfg.sleep });
    sleep.addEventListener('change', function () { if (sleep.value) { day.sleep = sleep.value; editDay(day); } });
    form.appendChild(h('fieldset', { class: 'group' }, h('legend', null, 'Shape of the day'),
      h('div', { class: 'two-col' }, h('label', { for: 'day-wake' }, 'Wake up', wake), h('label', { for: 'day-sleep' }, 'Lights out', sleep))));

    var note = h('textarea', { class: 'field', id: 'fairy-note', maxlength: 400, rows: 2, placeholder: 'e.g. Paper at 2pm, keep the morning gentle. Mum’s birthday dinner.' });
    note.value = day.note || '';
    note.addEventListener('input', function () { day.note = note.value; editDay(day); });
    form.appendChild(h('fieldset', { class: 'group' }, h('legend', null, h('label', { for: 'fairy-note' }, 'A note for the fairy')), note));

    var weaveBtn = h('button', { type: 'submit', class: 'btn btn-weave', id: 'weave-btn' }, '✦ ' + (day.plan ? 'Re-weave my day' : 'Weave my day'));
    var quick = h('button', { type: 'button', class: 'btn', id: 'quick-plan', onclick: function () { weave(Object.assign({ local: true }, day.plan ? replanOpts() : {})); } }, 'Quick plan');
    var acts = h('div', { class: 'compose-actions' }, weaveBtn, quick);
    if (day.plan) acts.appendChild(h('button', { type: 'button', class: 'link-btn', onclick: function () { S.composing[S.date] = false; renderPlanPanel(); } }, 'Back to the plan'));
    form.appendChild(acts);
    form.appendChild(h('p', { class: 'fine', id: 'weave-note' }));
    wrap.appendChild(form);
    renderComposerNote();
  }
  function renderComposerNote() {
    var el = $('weave-note'); if (!el) return;
    el.textContent = S.sample === null
      ? 'Claude isn’t available in this view, so both buttons use the quick planner. It works offline and takes a second.'
      : 'Weave asks Claude for a detailed, described day (around half a minute). Quick plan is instant and needs nothing.';
  }

  /* ---------- the plan view ---------- */
  function blocksOf(day) {
    return (day.plan && day.plan.blocks ? day.plan.blocks : []).slice().sort(function (a, b) { return P.toMin(a.start) - P.toMin(b.start); });
  }
  function renderPlanView(day) {
    var v = $('plan-view'), scroll = $('plan-scroll'), keep = scroll.scrollTop;
    clear(v);
    var plan = day.plan, today = isToday(), now = today ? nowMin() : -1;
    var srcLabel = plan.source === 'claude' ? 'Woven by Claude' : plan.source === 'example' ? 'Example plan' : 'Quick plan';
    v.appendChild(h('div', { class: 'plan-summary' }, h('p', { text: plan.summary || '' }), h('span', { class: 'src' }, srcLabel + (plan.at ? ' · ' + clockOf(plan.at) : ''))));
    if (plan.note) v.appendChild(h('p', { class: 'note', text: plan.note }));
    if (plan.overflow && plan.overflow.length) v.appendChild(h('p', { class: 'note warn' }, 'Didn’t fit today: ' + plan.overflow.map(function (o) { return o.title; }).join(', ') + '. Move it to tomorrow from its menu, or trim the day and re-weave.'));
    if (plan.late) v.appendChild(h('p', { class: 'note warn' }, 'This runs ' + P.dur(plan.late) + ' past lights out. Re-weave to trim it.'));

    if (!day.example) {
      var acts = h('div', { class: 'plan-actions' });
      acts.appendChild(h('button', { type: 'button', class: 'btn btn-small', onclick: function () { S.composing[S.date] = true; renderPlanPanel(); var f = $('p1-title'); if (f) f.focus(); } }, 'Edit tasks'));
      acts.appendChild(h('button', { type: 'button', class: 'btn btn-small btn-petal', onclick: function () { weave(replanOpts()); } }, '✦ Re-weave' + (today && now > P.toMin(day.wake) ? ' from now' : '')));
      if (today) acts.appendChild(h('button', { type: 'button', class: 'btn btn-small btn-leaf', onclick: openCheckin }, 'Check in'));
      v.appendChild(acts);
    }

    var ol = h('ol', { class: 'timeline', id: 'timeline' }), part = null, nowEl = null;
    blocksOf(day).forEach(function (b) {
      var pn = partName(P.toMin(b.start));
      if (pn !== part) { ol.appendChild(h('li', { class: 'part-head', 'aria-hidden': 'true' }, pn)); part = pn; }
      var row = blockRow(day, b, now);
      if (row.classList.contains('is-now')) nowEl = row;
      ol.appendChild(row);
    });
    v.appendChild(ol);

    if (today && !day.example) {
      var late = h('div', { class: 'late-bar' }, h('span', null, 'Running late?'));
      [15, 30, 60].forEach(function (m) { late.appendChild(h('button', { type: 'button', class: 'btn btn-small', onclick: function () { runLate(m); } }, '+' + m + ' min')); });
      v.appendChild(late);
    }
    scroll.scrollTop = keep;
    if (S.scrollToNow && nowEl) {
      S.scrollToNow = false;
      // only the panel's own scroll area moves; on phones the panel is part of the page and the planet stays in view
      if (getComputedStyle(scroll).overflowY === 'auto') scroll.scrollTop = Math.max(0, nowEl.offsetTop - scroll.clientHeight / 3);
    }
  }

  function blockRow(day, b, now) {
    var s = P.toMin(b.start), e = s + P.minsOf(b);
    var isNow = now >= 0 && s <= now && now < e && !b.skipped;
    var isPast = now >= 0 && e <= now;
    var li = h('li', { class: 'blk kind-' + b.kind + (b.done ? ' is-done' : '') + (b.skipped ? ' is-skipped' : '') + (isNow ? ' is-now' : '') + (isPast && CHECKABLE[b.kind] && !b.done && !b.skipped ? ' is-past' : ''), 'data-id': b.id });
    li.appendChild(h('div', { class: 'blk-time' }, h('b', null, shortClock(s, false)), h('span', null, '–' + shortClock(e, true))));
    li.appendChild(h('div', { class: 'blk-rail' }, h('span', { class: 'blk-dot', 'aria-hidden': 'true' }, GLYPH[b.kind] || '')));
    var body = h('div', { class: 'blk-body' });
    var place = P.placeName(S.cfg, b.place);
    body.appendChild(h('div', { class: 'blk-head' },
      isNow ? h('span', { class: 'now-tag' }, 'Now') : null,
      h('span', { class: 'blk-title', text: b.title }),
      h('span', { class: 'blk-meta' }, (b.kind === 'travel' ? 'to ' : '') + place + ' · ' + P.dur(e - s))));
    if (b.detail) body.appendChild(h('p', { class: 'blk-detail', text: b.detail }));
    var subs = (b.refs || []).map(function (id) { return day.admin.filter(function (a) { return a.id === id; })[0]; }).filter(Boolean);
    if (subs.length) {
      var ul = h('ul', { class: 'blk-subs' });
      subs.forEach(function (a) {
        var t = h('button', { type: 'button', class: 'tick sm', 'aria-pressed': a.done ? 'true' : 'false', 'aria-label': (a.done ? 'Undo ' : 'Done: ') + a.title }, '✓');
        t.addEventListener('click', function () { setAdminDone(day, a.id, !a.done); });
        ul.appendChild(h('li', { class: a.done ? 'is-done' : '' }, t, h('span', { text: a.title })));
      });
      body.appendChild(ul);
    }
    if (isNow) {
      var pct = Math.round(100 * (now - s) / Math.max(1, e - s));
      body.appendChild(h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Time through this block' }, h('i', { style: 'width:' + pct + '%' })));
    }
    if (S.editing === b.id) body.appendChild(editForm(day, b));
    li.appendChild(body);

    var acts = h('div', { class: 'blk-actions' });
    if (b.kind === 'checkin' && !b.done && !b.skipped && now >= 0 && !day.example) {
      acts.appendChild(h('button', { type: 'button', class: 'btn btn-small btn-leaf', onclick: openCheckin }, 'Check in'));
    } else if (CHECKABLE[b.kind] && !b.skipped) {
      var tick = h('button', { type: 'button', class: 'tick', 'aria-pressed': b.done ? 'true' : 'false', 'aria-label': (b.done ? 'Undo ' : 'Mark done: ') + b.title }, '✓');
      tick.addEventListener('click', function () { setBlockDone(day, b.id, !b.done); });
      acts.appendChild(tick);
    }
    var more = h('button', { type: 'button', class: 'more-btn', 'aria-label': 'More for ' + b.title, 'aria-expanded': S.menu === b.id ? 'true' : 'false' }, '⋯');
    more.addEventListener('click', function (ev) { ev.stopPropagation(); S.menu = S.menu === b.id ? null : b.id; renderPlanPanel(); });
    acts.appendChild(more);
    li.appendChild(acts);
    if (S.menu === b.id) li.appendChild(blockMenu(day, b));
    return li;
  }

  function blockMenu(day, b) {
    var m = h('div', { class: 'menu', role: 'menu' });
    function item(label, fn) { m.appendChild(h('button', { type: 'button', role: 'menuitem', onclick: function () { S.menu = null; fn(); } }, label)); }
    item(b.skipped ? 'Bring it back' : 'Skip this block', function () { b.skipped = !b.skipped; if (b.skipped) b.done = false; saveDay(day); renderPlanPanel(); });
    item('Change time or title', function () { S.editing = b.id; renderPlanPanel(); var f = document.getElementById('edit-' + b.id + '-start'); if (f) f.focus(); });
    var task = b.ref && day.tasks.filter(function (t) { return t.id === b.ref; })[0];
    if (task && !task.done) item('Move “' + trim(task.title, 26) + '” to tomorrow', function () { moveTask(day, task.id, N.addDays(day.date, 1)); });
    item('Remove from the plan', function () { day.plan.blocks = day.plan.blocks.filter(function (x) { return x.id !== b.id; }); saveDay(day); renderPlanPanel(); });
    setTimeout(function () { var first = m.querySelector('button'); if (first) first.focus(); }, 0);
    return m;
  }
  function editForm(day, b) {
    var s = h('input', { class: 'time-in', type: 'time', id: 'edit-' + b.id + '-start', value: b.start, 'aria-label': 'Start' });
    var e = h('input', { class: 'time-in', type: 'time', id: 'edit-' + b.id + '-end', value: b.end, 'aria-label': 'End' });
    var t = h('input', { class: 'field', type: 'text', id: 'edit-' + b.id + '-title', value: b.title, maxlength: 90, 'aria-label': 'Title' });
    var save = h('button', { type: 'button', class: 'btn btn-small btn-petal' }, 'Save');
    save.addEventListener('click', function () {
      if (s.value) b.start = s.value; if (e.value) b.end = e.value; if (t.value.trim()) b.title = t.value.trim();
      if (P.toMin(b.end) <= P.toMin(b.start)) b.end = P.toHM(P.toMin(b.start) + 15);
      S.editing = null; saveDay(day); renderPlanPanel();
    });
    var cancel = h('button', { type: 'button', class: 'btn btn-small btn-ghost', onclick: function () { S.editing = null; renderPlanPanel(); } }, 'Cancel');
    return h('div', { class: 'blk-edit' }, s, e, t, save, cancel);
  }
  function trim(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* ---------- now ---------- */
  function renderNow() {
    var card = $('now-card'); clear(card);
    var day = ensureDay(S.date), today = isToday(), plan = day.plan, st = P.stats(day);
    var main = h('div', { class: 'now-main' }), side = h('div', { class: 'now-side' });
    if (!today) {
      main.appendChild(h('p', { class: 'eyebrow' }, 'Looking at ' + dayName(S.date)));
      main.appendChild(h('h3', { class: 'now-title' }, plan ? (plan.blocks.length + ' blocks planned') : 'Nothing woven yet'));
      main.appendChild(h('p', { class: 'now-detail', text: plan ? plan.summary : 'Add the day’s six tasks on the left and weave it whenever you like.' }));
      side.appendChild(h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', onclick: goToday }, 'Back to today')));
    } else if (!plan || day.example && !plan) {
      main.appendChild(h('p', { class: 'eyebrow' }, 'No flight path yet'));
      main.appendChild(h('h3', { class: 'now-title' }, 'Fill the six pollen grains, then weave'));
      main.appendChild(h('p', { class: 'now-detail' }, 'Three tasks that win the day, three bonus ones, plus where you’ll be. Your routines are already part of the plan.'));
      side.appendChild(h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-petal', onclick: function () { var f = $('p1-title'); if (f) f.focus(); } }, 'Start planning')));
    } else {
      var now = nowMin(), cur = P.currentBlock(plan, now), nxt = P.nextBlock(plan, now + (cur ? 0 : 0));
      if (cur && nxt && nxt.id === cur.id) nxt = P.nextBlock(plan, P.toMin(cur.start) + P.minsOf(cur));
      var w = P.dayWindow(day, S.cfg);
      if (cur) {
        var s = P.toMin(cur.start), e = s + P.minsOf(cur), left = e - now;
        main.appendChild(h('p', { class: 'eyebrow' }, 'Now · until ' + shortClock(e, true) + ' · ' + P.dur(left) + ' left'));
        main.appendChild(h('h3', { class: 'now-title', text: cur.title }));
        if (cur.detail) main.appendChild(h('p', { class: 'now-detail', text: cur.detail }));
        main.appendChild(h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(100 * (now - s) / Math.max(1, e - s)) + '%' })));
      } else if (now < w.wake) {
        main.appendChild(h('p', { class: 'eyebrow' }, 'Before the day begins'));
        main.appendChild(h('h3', { class: 'now-title' }, 'Rest. The day starts at ' + shortClock(w.wake, true)));
      } else if (!nxt) {
        main.appendChild(h('p', { class: 'eyebrow' }, 'The day is done'));
        main.appendChild(h('h3', { class: 'now-title' }, st.won ? 'You won the day.' : st.done + ' of ' + st.total + ' pollen grains gathered'));
        main.appendChild(h('p', { class: 'now-detail' }, 'Anything unfinished can move to tomorrow from the weekly agenda.'));
      } else {
        main.appendChild(h('p', { class: 'eyebrow' }, 'Free until ' + shortClock(P.toMin(nxt.start), true)));
        main.appendChild(h('h3', { class: 'now-title' }, 'A pocket of free time'));
        main.appendChild(h('p', { class: 'now-detail' }, 'Rest, stretch, or get a head start on what’s next.'));
      }
      if (nxt) side.appendChild(h('p', { class: 'now-next' }, 'Next · ', h('b', null, shortClock(P.toMin(nxt.start), true)), ' ', nxt.title));
      var btns = h('div', { class: 'btn-row' });
      if (cur && CHECKABLE[cur.kind] && !cur.done && !day.example) btns.appendChild(h('button', { type: 'button', class: 'btn btn-petal', onclick: function () { setBlockDone(day, cur.id, true); } }, '✓ Done'));
      if (!day.example) btns.appendChild(h('button', { type: 'button', class: 'btn btn-leaf', onclick: openCheckin }, 'Check in'));
      side.appendChild(btns);
    }
    card.appendChild(main); card.appendChild(side);

    var dots = h('div', { class: 'pm-dots', 'aria-hidden': 'true' });
    slotTasks(day).forEach(function (t, i) {
      dots.appendChild(h('span', { class: 'pm-dot ' + (i < 3 ? 'p' : 's') + (t.title ? ' has' : '') + (t.done ? ' done' : '') }, t.done ? '✓' : i < 3 ? '★' : '✿'));
    });
    var text = st.total ? [h('b', null, st.done + ' of ' + st.total), ' pollen grains gathered · win the day ', h('b', null, st.primaryDone + '/' + st.primary)] : ['No pollen yet: add tasks to light the grains around the flower.'];
    if (st.admin) text.push(' · admin ' + st.adminDone + '/' + st.admin);
    card.appendChild(h('div', { class: 'pollen-meter' }, dots, h('p', { class: 'pm-text', style: 'margin:0' }, text)));
  }

  /* ---------- week ---------- */
  function renderWeek() {
    var ws = weekStartOf(S.date), wk = weekDoc(ws), today = todayISO();
    var lab = $('week-label');
    if (document.activeElement !== lab) lab.value = wk.label || N.defaultWeekLabel(ws);
    var a = N.parseISO(ws), b = N.parseISO(N.addDays(ws, 6));
    $('week-range').textContent = a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MON[a.getMonth()] : '') + ' – ' + b.getDate() + ' ' + MON[b.getMonth()] + ' · Sunday to Saturday';
    $('week-sync').textContent = weekSyncText(ws);
    var ol = $('week-days'); clear(ol);
    N.weekDates(ws).forEach(function (iso) {
      var d = getDay(iso), tasks = d ? d.tasks.filter(function (t) { return t.title; }) : [], st = d ? P.stats(d) : null;
      var dt = N.parseISO(iso);
      var sum = !d || (!tasks.length && !d.plan) ? (iso < today ? 'Nothing recorded' : 'Nothing planned yet') :
        d.example ? 'Example day' :
        d.plan ? [d.places.am, d.places.pm, d.places.eve].filter(function (x, i, arr) { return arr.indexOf(x) === i; }).map(function (p) { return P.placeName(S.cfg, p); }).join(' → ') : 'Not woven yet';
      var head = h('button', { type: 'button', class: 'wday-head', 'aria-label': dayName(iso) + ' ' + longDate(iso) + ': ' + sum, onclick: function () { goDate(iso); } },
        h('span', { class: 'wd-date' }, h('small', null, WD[dt.getDay()].slice(0, 3)), h('b', null, dt.getDate())),
        h('span', { class: 'wd-sum', text: sum }),
        st && st.total ? h('span', { class: 'wd-badge' + (st.won ? ' won' : '') }, st.won ? 'won ✦' : st.done + '/' + st.total) : null);
      var li = h('li', { class: 'wday' + (iso === today ? ' is-today' : '') + (iso === S.date ? ' is-viewing' : '') }, head);
      if (tasks.length) {
        var ul = h('ul', { class: 'wd-tasks' });
        tasks.forEach(function (t) {
          var tick = h('button', { type: 'button', class: 'tick sm', 'aria-pressed': t.done ? 'true' : 'false', 'aria-label': (t.done ? 'Undo ' : 'Mark done: ') + t.title }, t.done ? '✓' : t.tier === 'primary' ? '★' : '✿');
          tick.addEventListener('click', function () { setTaskDone(d, t.id, !t.done); });
          ul.appendChild(h('li', { class: (t.tier === 'primary' ? 'p' : 's') + (t.done ? ' is-done' : '') }, tick, h('span', { text: t.title })));
        });
        li.appendChild(ul);
      }
      var admin = d ? d.admin.filter(function (x) { return x.title; }) : [];
      if (admin.length) li.appendChild(h('p', { class: 'wd-extra' }, admin.length + ' admin · ' + admin.filter(function (x) { return x.done; }).length + ' done'));
      ol.appendChild(li);
    });

    var foot = $('week-foot'); clear(foot);
    var carry = carryCandidates();
    if (carry.list.length) foot.appendChild(h('button', { type: 'button', class: 'btn btn-leaf', onclick: carryOver }, 'Bring ' + carry.list.length + ' unfinished from ' + dayName(carry.from).slice(0, 3) + ' into today'));
    foot.appendChild(h('a', { class: 'fine', href: notionUrl(), target: '_blank', rel: 'noopener' }, 'Open the Weekly Agenda in Notion ↗'));
  }
  function weekSyncText(ws) {
    var wk = weekDoc(ws);
    if (S.mcp === null) return 'Notion sync works when this page is open on claude.ai.';
    if (S.cfg.notion.auto === false) return 'Starmap sync is off. Turn it on in settings.';
    if (!S.cfg.notion.armed) return 'Starmap sync starts with your first real plan.';
    if (Sync.week === ws && (Sync.state === 'syncing' || Sync.state === 'pending')) return 'Starmap: saving this week to Notion…';
    if (Sync.week === ws && (Sync.state === 'error' || Sync.state === 'approval')) return 'Starmap: ' + Sync.message;
    if (wk.notion && wk.notion.at) return 'Starmap: synced ' + ago(wk.notion.at);
    return 'Starmap: this week isn’t in Notion yet.';
  }

  /* ------------------------------------------------------------------ actions */
  function goDate(iso) {
    S.date = iso; S.followToday = iso === todayISO(); S.menu = null; S.editing = null;
    if (!S.days[iso] && S.store && weekStartOf(iso) === S.loadedWeek) { /* will come from the week watch */ }
    watchWeek(weekStartOf(iso));
    S.scrollToNow = S.followToday;
    render();
  }
  function goToday() { goDate(todayISO()); }

  function setTaskDone(day, taskId, done) {
    var t = day.tasks.filter(function (x) { return x.id === taskId; })[0]; if (!t) return;
    var wasWon = P.stats(day).won;
    t.done = done; t.doneAt = done ? Date.now() : null;
    if (day.plan) day.plan.blocks.forEach(function (b) { if (b.ref === taskId && !b.skipped) b.done = done; });
    afterTick(day, wasWon, done && t.tier === 'primary');
    if (done && day.date === todayISO() && day.plan && !day.example) {
      var future = day.plan.blocks.some(function (b) { return b.ref === taskId && P.toMin(b.start) > nowMin(); });
      if (future) toast('“' + trim(t.title, 30) + '” is done early. Re-weave to use the freed time?', 'Re-weave', function () { weave(replanOpts()); });
    }
  }
  function setBlockDone(day, blockId, done) {
    var b = (day.plan && day.plan.blocks || []).filter(function (x) { return x.id === blockId; })[0]; if (!b) return;
    var wasWon = P.stats(day).won;
    b.done = done;
    if (b.ref) {
      var t = day.tasks.filter(function (x) { return x.id === b.ref; })[0];
      if (t) {
        var all = day.plan.blocks.filter(function (x) { return x.ref === b.ref && !x.skipped; });
        var allDone = all.every(function (x) { return x.done; });
        if (t.done !== allDone) { t.done = allDone; t.doneAt = allDone ? Date.now() : null; }
      }
    }
    if (b.kind === 'admin' && b.refs) day.admin.forEach(function (a) { if (b.refs.indexOf(a.id) !== -1) a.done = done; });
    afterTick(day, wasWon, false);
  }
  function setAdminDone(day, adminId, done) {
    day.admin.forEach(function (a) { if (a.id === adminId) a.done = done; });
    if (day.plan) day.plan.blocks.forEach(function (b) {
      if (b.kind === 'admin' && b.refs && b.refs.indexOf(adminId) !== -1) b.done = b.refs.every(function (id) { return day.admin.some(function (a) { return a.id === id && a.done; }); });
    });
    afterTick(day, P.stats(day).won, false);
  }
  function afterTick(day, wasWon) {
    saveDay(day, { quiet: true });
    render();
    var st = P.stats(day);
    if (st.won && !wasWon) {
      if (S.scene && day.date === S.date) S.scene.celebrate();
      toast('All three win-the-day tasks done. You won ' + (day.date === todayISO() ? 'today' : dayName(day.date)) + '.');
    }
  }

  function moveTask(day, taskId, toISO) {
    var t = day.tasks.filter(function (x) { return x.id === taskId; })[0]; if (!t || !t.title) return;
    var target = ensureDay(toISO);
    var slot = target.tasks.filter(function (x) { return x.tier === t.tier && !x.title; })[0] || target.tasks.filter(function (x) { return !x.title; })[0];
    if (!slot) { toast(dayName(toISO) + '’s six pollen grains are already full.'); return; }
    slot.title = t.title; slot.est = t.est; slot.done = false; slot.from = day.date;
    var title = t.title;
    if (day.plan) day.plan.blocks.forEach(function (b) { if (b.ref === taskId && !b.done) b.skipped = true; });
    t.title = ''; t.est = null; t.done = false;
    saveDay(day, { quiet: true }); saveDay(target, { quiet: true });
    render();
    toast('Moved “' + trim(title, 32) + '” to ' + dayName(toISO) + '.');
  }
  function carryCandidates() {
    var today = todayISO(), y = N.addDays(today, -1), yd = getDay(y), td = getDay(today) || null;
    if (!yd || yd.example || (td && td.example)) return { from: y, list: [] };
    var free = td ? td.tasks.filter(function (t) { return !t.title; }).length : 6;
    var list = yd.tasks.filter(function (t) { return t.title && !t.done; });
    return { from: y, list: free ? list.slice(0, free) : [] };
  }
  function carryOver() {
    var c = carryCandidates(), yd = getDay(c.from), today = todayISO();
    c.list.forEach(function (t) { moveTask(yd, t.id, today); });
  }

  function replanOpts() {
    var day = ensureDay(S.date);
    if (!isToday()) return {};
    var now = nowMin();
    return now > P.toMin(day.wake) + 10 ? { from: now } : {};
  }

  function runLate(mins) {
    var day = ensureDay(S.date); if (!day.plan) return;
    var w = P.dayWindow(day, S.cfg);
    day.plan = P.shiftPlan(day.plan, nowMin(), mins, w.sleep);
    saveDay(day, { quiet: true }); render();
    if (day.plan.late) toast('That runs past lights out. Re-weave from now to trim the evening?', 'Re-weave', function () { weave(replanOpts()); });
    else toast('Moved the rest of the day ' + mins + ' minutes later.');
  }

  /* ------------------------------------------------------------------ weaving */
  function weave(opts) {
    opts = Object.assign({}, opts || {});
    var day = ensureDay(S.date);
    if (S.weaving) return;
    if (opts.from == null && isToday() && !day.plan) {
      var now = nowMin();
      if (now > P.toMin(day.wake) + 30) { opts.from = now; opts.at = opts.at || P.placeAt(day, now); }
    }
    if (day.example) delete day.example;
    var sampleReady = S.sample === undefined && window.claude && window.claude.use ? window.claude.use('sample').then(function (s) { S.sample = s || null; return S.sample; }) : Promise.resolve(S.sample);
    sampleReady.then(function (sample) {
      if (opts.local || !sample) { applyPlan(day, P.localPlan(day, S.cfg, opts)); return; }
      var ctx = P.promptContext(day, S.cfg, opts);
      var ctl = new AbortController();
      S.weaving = { ctl: ctl, date: day.date };
      $('weave-title').textContent = ctx.replanning ? 'Re-weaving the rest of the day…' : 'Weaving your day…';
      $('weave-progress').textContent = 'Thinking about your tasks, places and routines. This usually takes under a minute.';
      renderPlanPanel();
      var seen = 0;
      sample.json(ctx.prompt, {
        signal: ctl.signal, cache: false, modelTier: 'default',
        onText: function (u) {
          var n = (u.text.match(/"start"/g) || []).length;
          if (n !== seen) { seen = n; $('weave-progress').textContent = n + (n === 1 ? ' block' : ' blocks') + ' woven so far…'; }
        }
      }).then(function (raw) {
        var plan = P.normalizePlan(raw, day, S.cfg, ctx);
        if (!plan) { plan = P.localPlan(day, S.cfg, opts); plan.note = 'Claude’s plan didn’t hold together, so this is the quick planner’s version.'; }
        S.weaving = null;
        applyPlan(day, plan);
      }, function (e) {
        S.weaving = null;
        var code = e && e.code;
        if (code === 'cancelled') { render(); return; }
        if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(code) !== -1) { S.sample = null; renderComposerNote(); }
        var why = {
          not_granted: 'Claude isn’t allowed for this page.',
          sampling_disabled: 'Claude isn’t available on this account.',
          rate_limited: 'Claude is busy or your usage limit was reached.',
          session_expired: 'Your claude.ai session expired (sign in again for Claude plans).',
          refused: 'Claude declined to plan this one.',
          invalid_json: 'Claude’s answer couldn’t be read.',
          empty_completion: 'Claude came back empty.',
          prompt_too_large: 'There was too much to send to Claude.'
        }[code] || 'Claude couldn’t be reached.';
        var plan = P.localPlan(day, S.cfg, opts);
        plan.note = why + ' This is the quick planner’s version; try weaving again later.';
        applyPlan(day, plan);
      });
    });
  }
  $('weave-stop').addEventListener('click', function () { if (S.weaving) S.weaving.ctl.abort(); });

  function applyPlan(day, plan) {
    day.plan = plan;
    S.composing[day.date] = false;
    S.menu = null; S.editing = null;
    if (!day.example && !S.cfg.notion.armed) { S.cfg.notion.armed = true; saveConfig(); }
    S.scrollToNow = day.date === todayISO();
    saveDay(day, { quiet: true });
    render();
    if (day.date === S.date && !plan.note) toast(plan.source === 'claude' ? 'Your day is woven.' : 'Quick plan ready.');
  }

  /* ------------------------------------------------------------------ check-in */
  function openCheckin() {
    var day = ensureDay(S.date); if (!isToday()) return;
    var dlg = $('checkin-dlg'), body = $('checkin-body'), foot = $('checkin-foot');
    clear(body); clear(foot);
    $('checkin-when').textContent = 'Check-in · ' + clockOf(Date.now());
    var energy = h('div', { class: 'energy', role: 'radiogroup', 'aria-label': 'Energy' });
    var lastEnergy = day.checkins.length ? day.checkins[day.checkins.length - 1].energy : 3;
    ENERGY.forEach(function (en) {
      energy.appendChild(h('label', null, h('input', { type: 'radio', name: 'ci-energy', id: 'ci-energy-' + en[0], value: en[0], checked: en[0] === lastEnergy }),
        h('span', { title: en[1] }, h('b', null, String(en[0])), h('small', null, en[1]))));
    });
    body.appendChild(h('section', null, h('h3', null, 'Energy right now'), energy));

    var list = h('div', { class: 'check-list' });
    slotTasks(day).filter(function (t) { return t.title; }).forEach(function (t) {
      list.appendChild(h('label', null, h('input', { type: 'checkbox', 'data-task': t.id, id: 'ci-task-' + t.id, checked: !!t.done }), (t.tier === 'primary' ? '★ ' : '✿ ') + t.title));
    });
    day.admin.filter(function (a) { return a.title; }).forEach(function (a) {
      list.appendChild(h('label', null, h('input', { type: 'checkbox', 'data-admin': a.id, id: 'ci-admin-' + a.id, checked: !!a.done }), '◆ ' + a.title));
    });
    if (!list.childNodes.length) list.appendChild(h('p', { class: 'fine' }, 'No tasks yet today.'));
    body.appendChild(h('section', null, h('h3', null, 'Tick what’s done'), list));

    var spot = P.currentSpot(day, nowMin()).place;
    var seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Where are you now' });
    S.cfg.places.forEach(function (pl) { seg.appendChild(h('label', null, h('input', { type: 'radio', name: 'ci-place', id: 'ci-place-' + pl.id, value: pl.id, checked: pl.id === spot }), h('span', null, pl.name))); });
    body.appendChild(h('section', null, h('h3', null, 'Where are you now?'), seg));

    var note = h('textarea', { class: 'field', id: 'ci-note', rows: 2, maxlength: 300, placeholder: 'What changed? e.g. Consult moved to 4pm, feeling tired after lunch.' });
    body.appendChild(h('section', null, h('h3', null, h('label', { for: 'ci-note' }, 'Anything changed?')), note));

    var late = h('div', { class: 'btn-row' });
    [15, 30, 60].forEach(function (m) { late.appendChild(h('button', { type: 'button', class: 'btn btn-small', onclick: function () { commit(); dlg.close(); runLate(m); } }, '+' + m + ' min')); });
    body.appendChild(h('section', null, h('h3', null, 'Running late?'), h('p', { class: 'fine', style: 'margin:-4px 0 8px' }, 'Slides everything not yet done; fixed commitments stay put.'), late));

    function commit() {
      var form = $('checkin-form');
      var en = form.querySelector('input[name="ci-energy"]:checked'), pl = form.querySelector('input[name="ci-place"]:checked');
      var wasWon = P.stats(day).won;
      form.querySelectorAll('input[data-task]').forEach(function (cb) {
        var t = day.tasks.filter(function (x) { return x.id === cb.getAttribute('data-task'); })[0];
        if (t && !!t.done !== cb.checked) { t.done = cb.checked; t.doneAt = cb.checked ? Date.now() : null; if (day.plan) day.plan.blocks.forEach(function (b) { if (b.ref === t.id && !b.skipped) b.done = cb.checked; }); }
      });
      form.querySelectorAll('input[data-admin]').forEach(function (cb) { day.admin.forEach(function (a) { if (a.id === cb.getAttribute('data-admin')) a.done = cb.checked; }); });
      var c = { at: Date.now(), energy: en ? Number(en.value) : null, note: note.value.trim(), place: pl ? pl.value : null };
      day.checkins.push(c);
      if (day.plan) day.plan.blocks.forEach(function (b) { if (b.kind === 'checkin' && !b.done && P.toMin(b.start) <= nowMin() + 30) b.done = true; });
      afterTick(day, wasWon);
      return c;
    }
    foot.appendChild(h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { commit(); dlg.close(); toast('Check-in saved.'); } }, 'Save check-in'));
    foot.appendChild(h('button', { type: 'button', class: 'btn', onclick: function () { var c = commit(); dlg.close(); weave({ local: true, from: nowMin(), energy: c.energy, note: c.note, at: c.place }); } }, 'Quick re-plan'));
    foot.appendChild(h('button', { type: 'button', class: 'btn btn-weave', onclick: function () { var c = commit(); dlg.close(); weave({ from: nowMin(), energy: c.energy, note: c.note, at: c.place }); } }, '✦ Re-weave the rest'));
    dlg.showModal();
  }

  /* ------------------------------------------------------------------ settings */
  function openSettings() {
    var cfg = clone(S.cfg), body = $('settings-body'); clear(body);
    // routines
    var rows = h('div', { class: 'rows' });
    function drawRoutines() {
      clear(rows);
      rows.appendChild(h('div', { class: 'r-row cols-head', 'aria-hidden': 'true' }, h('span', null, 'On'), h('span', null, 'Routine'), h('span', null, 'When'), h('span', null, 'At'), h('span', null, 'Mins'), h('span', null, '')));
      cfg.routines.forEach(function (r, i) {
        var on = h('label', { class: 'switch', title: 'Include in plans' }, h('input', { type: 'checkbox', id: 'r-' + i + '-on', checked: r.on !== false, 'aria-label': 'Include ' + (r.name || 'routine') }), h('span'));
        on.querySelector('input').addEventListener('change', function (e) { r.on = e.target.checked; });
        var name = h('input', { class: 'field', id: 'r-' + i + '-name', value: r.name, maxlength: 50, 'aria-label': 'Routine name' });
        name.addEventListener('input', function () { r.name = name.value; });
        var anchor = h('select', { class: 'sel r-anchor', id: 'r-' + i + '-anchor', 'aria-label': 'When' },
          h('option', { value: 'wake', selected: r.anchor === 'wake' }, 'after waking'), h('option', { value: 'time', selected: r.anchor === 'time' }, 'at a set time'), h('option', { value: 'sleep', selected: r.anchor === 'sleep' }, 'before bed'));
        var at = r.anchor === 'time'
          ? h('input', { class: 'time-in r-time', type: 'time', id: 'r-' + i + '-time', value: r.time || '12:00', 'aria-label': 'Time' })
          : h('input', { class: 'field r-time', type: 'number', min: 0, max: 600, step: 5, id: 'r-' + i + '-offset', value: r.offset || 0, 'aria-label': r.anchor === 'wake' ? 'Minutes after waking' : 'Minutes before lights out' });
        at.addEventListener('input', function () { if (r.anchor === 'time') r.time = at.value; else r.offset = Number(at.value) || 0; });
        anchor.addEventListener('change', function () { r.anchor = anchor.value; if (r.anchor === 'time' && !r.time) r.time = '12:00'; drawRoutines(); });
        var min = h('input', { class: 'field r-min', type: 'number', min: 5, max: 240, step: 5, id: 'r-' + i + '-min', value: r.min || 15, 'aria-label': 'Minutes' });
        min.addEventListener('input', function () { r.min = Number(min.value) || 15; });
        var x = h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove ' + (r.name || 'routine') }, '×');
        x.addEventListener('click', function () { cfg.routines.splice(i, 1); drawRoutines(); });
        rows.appendChild(h('div', { class: 'r-row' }, on, name, anchor, at, min, x));
      });
    }
    drawRoutines();
    body.appendChild(h('section', null, h('h3', null, 'Daily routines'), h('p', { class: 'fine', style: 'margin:-4px 0 10px' }, 'Every plan is built around these. “At” is minutes after waking, a clock time, or minutes before lights out.'), rows,
      h('div', { style: 'margin-top:8px' }, h('button', { type: 'button', class: 'btn btn-small', onclick: function () { cfg.routines.push({ id: P.uid('r'), name: '', anchor: 'time', time: '16:00', min: 20, kind: 'routine', on: true }); drawRoutines(); } }, '+ Add a routine'))));

    // day
    function timeField(id, label, val, set) { var i = h('input', { class: 'time-in', type: 'time', id: id, value: val }); i.addEventListener('change', function () { if (i.value) set(i.value); }); return h('label', { class: 'stack-label', for: id }, label, i); }
    function numField(id, label, val, set) { var i = h('input', { class: 'field', type: 'number', id: id, min: 5, max: 300, step: 5, value: val }); i.addEventListener('input', function () { set(Number(i.value) || val); }); return h('label', { class: 'stack-label', for: id }, label, i); }
    var nameIn = h('input', { class: 'field', id: 'cfg-name', value: cfg.name || '', maxlength: 30 });
    nameIn.addEventListener('input', function () { cfg.name = nameIn.value.trim(); });
    body.appendChild(h('section', null, h('h3', null, 'Your days'), h('div', { class: 'grid-3' },
      h('label', { class: 'stack-label', for: 'cfg-name' }, 'Name for greetings', nameIn),
      timeField('cfg-wake', 'Usual wake-up', cfg.wake, function (v) { cfg.wake = v; }),
      timeField('cfg-sleep', 'Usual lights out', cfg.sleep, function (v) { cfg.sleep = v; }),
      timeField('cfg-mid', 'Midday check-in', cfg.checkins.midday || '13:30', function (v) { cfg.checkins.midday = v; }),
      timeField('cfg-eve', 'Evening wrap-up', cfg.checkins.evening || '20:45', function (v) { cfg.checkins.evening = v; }),
      numField('cfg-session', 'Longest focus session (min)', cfg.focus.session, function (v) { cfg.focus.session = v; }),
      numField('cfg-prim', 'Win-the-day task (min)', cfg.focus.primary, function (v) { cfg.focus.primary = v; }),
      numField('cfg-sec', 'Bonus task (min)', cfg.focus.secondary, function (v) { cfg.focus.secondary = v; }),
      numField('cfg-break', 'Break (min)', cfg.focus.breakMin, function (v) { cfg.focus.breakMin = v; }))));

    // places
    var prow = h('div', { class: 'rows' });
    function drawPlaces() {
      clear(prow);
      prow.appendChild(h('div', { class: 'p-row cols-head', 'aria-hidden': 'true' }, h('span', null, 'Place'), h('span', null, 'Min from home'), h('span', null, 'By'), h('span', null, '')));
      cfg.places.forEach(function (pl, i) {
        var home = pl.id === 'home';
        var n = h('input', { class: 'field', id: 'pl-' + i + '-name', value: pl.name, maxlength: 30, 'aria-label': 'Place name' });
        n.addEventListener('input', function () { pl.name = n.value || pl.name; });
        var t = h('input', { class: 'field', type: 'number', min: 0, max: 180, step: 5, id: 'pl-' + i + '-travel', value: pl.travel || 0, disabled: home, 'aria-label': 'Minutes from home' });
        t.addEventListener('input', function () { pl.travel = Number(t.value) || 0; });
        var m = h('select', { class: 'sel p-mode', id: 'pl-' + i + '-mode', disabled: home, 'aria-label': 'Travel by' });
        ['', 'MRT', 'bus', 'walk', 'car', 'cycle'].forEach(function (o) { m.appendChild(h('option', { value: o, selected: (pl.mode || '') === o }, o || '—')); });
        m.addEventListener('change', function () { pl.mode = m.value; });
        var x = home ? h('span') : h('button', { type: 'button', class: 'x-btn', 'aria-label': 'Remove ' + pl.name }, '×');
        if (!home) x.addEventListener('click', function () { cfg.places.splice(i, 1); drawPlaces(); });
        prow.appendChild(h('div', { class: 'p-row' }, n, t, m, x));
      });
    }
    drawPlaces();
    body.appendChild(h('section', null, h('h3', null, 'Places'), prow,
      h('div', { style: 'margin-top:8px' }, h('button', { type: 'button', class: 'btn btn-small', onclick: function () { cfg.places.push({ id: P.uid('pl'), name: 'New place', travel: 20, mode: 'MRT' }); drawPlaces(); } }, '+ Add a place'))));

    // notion
    var auto = h('label', { class: 'switch' }, h('input', { type: 'checkbox', id: 'notion-auto', checked: cfg.notion.auto !== false }), h('span'));
    auto.querySelector('input').addEventListener('change', function (e) { cfg.notion.auto = e.target.checked; });
    var page = h('input', { class: 'field', id: 'notion-page', value: cfg.notion.page || STARMAP_URL, 'aria-label': 'Notion page link' });
    page.addEventListener('input', function () { cfg.notion.page = page.value.trim(); });
    var status = h('p', { class: 'fine', id: 'notion-status', text: syncStatusLong() });
    var syncNow = h('button', { type: 'button', class: 'btn btn-small btn-petal', id: 'notion-sync-now' }, 'Sync this week now');
    syncNow.addEventListener('click', function () {
      S.cfg.notion = Object.assign({}, S.cfg.notion, { page: cfg.notion.page, auto: cfg.notion.auto, armed: true });
      cfg.notion.armed = true; saveConfig(); runSync(weekStartOf(S.date), true);
      status.textContent = 'Syncing…';
    });
    var box = h('div', { class: 'sync-box' },
      h('div', { class: 'sync-line' }, auto, h('label', { for: 'notion-auto' }, h('b', null, 'Keep the Weekly Agenda in sync'))),
      h('p', { class: 'fine' }, 'One way, from here to Notion. Each week becomes a ЩΣΣK toggle in the ✮ Weekly Agenda ✮ callout on Vi’s Starmap, with a toggle per day and a timestamped to-do for every block. Only days you change here are rewritten; the rest of the page is left alone.'),
      h('label', { class: 'stack-label', for: 'notion-page' }, 'Starmap page link', page),
      h('div', { class: 'sync-line' }, syncNow, h('a', { href: notionUrl(), target: '_blank', rel: 'noopener', class: 'fine' }, 'Open in Notion ↗')),
      status);
    if (Sync.state === 'error' && Sync.code === 'not_in_manifest' && S.perms) box.appendChild(h('button', { type: 'button', class: 'btn btn-small', onclick: function () { S.perms.manage().catch(function () { toast('Open this artifact’s Permissions menu to allow Notion.'); }); } }, 'Open permissions'));
    body.appendChild(h('section', null, h('h3', null, 'Notion: Vi’s Starmap 2026'), box));

    $('settings-form').onsubmit = function (e) {
      e.preventDefault();
      cfg.routines = cfg.routines.filter(function (r) { return r.name && r.name.trim(); });
      cfg.places = cfg.places.filter(function (p) { return p.name && p.name.trim(); });
      var wasAuto = S.cfg.notion.auto;
      cfg.notion.armed = S.cfg.notion.armed || cfg.notion.armed;
      S.cfg = mergeConfig(cfg);
      saveConfig();
      $('settings-dlg').close();
      S.composerFor = null;
      render();
      if (!wasAuto && S.cfg.notion.auto) scheduleSync(weekStartOf(S.date), 1500);
      toast('Settings saved. Re-weave a day to use new routines.');
    };
    $('settings-dlg').showModal();
  }
  function notionUrl() { var id = pageIdOf(S.cfg.notion.page); return 'https://www.notion.so/' + id; }
  function pageIdOf(url) {
    var m = String(url || '').replace(/-/g, '').match(/[0-9a-f]{32}/i);
    return m ? m[0].toLowerCase() : STARMAP_ID;
  }

  /* ------------------------------------------------------------------ Notion sync */
  var Sync = { state: 'idle', timer: null, running: false, again: null, week: null, message: '', code: '', last: 0 };

  function canSync() { return !!S.mcp && S.cfg.notion.auto !== false && !!S.cfg.notion.armed && !S.readOnly; }
  function scheduleSync(ws, delay) {
    if (!canSync()) { updateSyncChip(); return; }
    Sync.week = ws; if (!Sync.running) Sync.state = 'pending';
    clearTimeout(Sync.timer);
    var wait = Math.max(delay == null ? 6000 : delay, 15000 - (Date.now() - Sync.last));
    Sync.timer = setTimeout(function () { runSync(ws); }, wait);
    updateSyncChip();
  }
  function weekBlocks(ws) {
    var out = {};
    N.weekDates(ws).forEach(function (iso) { var d = getDay(iso); out[iso] = N.buildDayBlock(iso, d && !d.example ? d : null); });
    return out;
  }
  function checkPendingSync(ws) {      // changes made while offline or on another device that never reached Notion
    if (!canSync()) return;
    var wk = weekDoc(ws); if (!wk.notion || !wk.notion.at) return;
    var blocks = weekBlocks(ws), pushed = wk.notion.pushed || {};
    var behind = Object.keys(blocks).some(function (iso) { return pushed[iso] !== N.hash(blocks[iso]); });
    if (behind) scheduleSync(ws, 4000);
  }
  function loadWeekDays(ws) {
    var missing = N.weekDates(ws).filter(function (iso) { return !S.days[iso]; });
    if (!missing.length || !S.store || ws === S.loadedWeek) return Promise.resolve();
    return Promise.all(missing.map(function (iso) { return S.store.getDay(iso).then(function (d) { if (d && !S.days[iso]) S.days[iso] = normalizeDay(d); }); }));
  }
  function payloadOf(res) {
    var p = res && res.payload;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { /* plain text */ } }
    if (p == null && res && res.content) {
      var t = res.content.filter(function (c) { return c.type === 'text'; })[0];
      if (t) { try { p = JSON.parse(t.text); } catch (e) { p = t.text; } }
    }
    return p;
  }
  function notionCall(tool, input) { return S.mcp.callTool(NOTION, tool, input, { cache: false }).then(payloadOf); }
  function notionFetch(pageId) {
    return notionCall('notion-fetch', { id: pageId }).then(function (p) {
      var text = p && typeof p === 'object' ? p.text : typeof p === 'string' ? p : '';
      if (!text) throw { code: 'tool_error', message: 'Notion sent back no page text.' };
      return text;
    });
  }
  function settle(res) {                 // a large write may come back as a task to wait for
    var task = res && (res.async_task || (res.task_id ? res : null));
    if (!task || !task.task_id) return Promise.resolve(res);
    var tries = 0;
    function poll() {
      return new Promise(function (r) { setTimeout(r, 1500); }).then(function () {
        return notionCall('notion-get-async-task', { task_id: task.task_id });
      }).then(function (st) {
        var s = st && (st.status || (st.async_task && st.async_task.status));
        if (s === 'succeeded') return st.result || st;
        if (s === 'failed') throw { code: 'tool_error', message: (st.error && (st.error.message || st.error)) || 'Notion could not apply the change.' };
        if (++tries > 12) throw { code: 'tool_error', message: 'Notion is still working on the change. It may appear shortly.' };
        return poll();
      });
    }
    return poll();
  }
  function runSync(ws, manual) {
    if (!S.mcp) { Sync.state = 'error'; Sync.message = 'Notion is only reachable when this page is open on claude.ai.'; updateSyncChip(); return; }
    if (Sync.running) { Sync.again = ws; return; }
    clearTimeout(Sync.timer);
    Sync.running = true; Sync.week = ws; Sync.state = 'syncing'; Sync.last = Date.now(); updateSyncChip(); renderWeekSyncLine();
    var pageId = pageIdOf(S.cfg.notion.page), wk = weekDoc(ws), before = '', mode = '';
    loadWeekDays(ws).then(function () {
      return notionFetch(pageId);
    }).then(function (text) {
      before = text;
      var plan = N.planSync({ text: text, weekStart: ws, label: wk.label || '', blocks: weekBlocks(ws), pushed: (wk.notion && wk.notion.pushed) || {}, marker: S.cfg.notion.marker || undefined });
      mode = plan.mode;
      if (plan.mode === 'blocked') throw { code: 'blocked', message: 'Couldn’t find a safe place in the Weekly Agenda to write this week.' };
      if (plan.mode === 'noop') return plan;
      var call = plan.mode === 'append'
        ? notionCall('notion-update-page', { page_id: pageId, command: 'insert_content', content: plan.content, position: { type: 'end' }, allow_async: false })
        : notionCall('notion-update-page', { page_id: pageId, command: 'update_content', content_updates: plan.updates, allow_async: false });
      return call.then(settle).then(function (res) {
        var warns = res && res.warnings;
        if (warns && warns.length) throw { code: 'partial', message: 'Notion couldn’t match part of the week; it will be rewritten on the next sync.' };
        var whole = plan.mode !== 'update' || plan.updates.some(function (u) { return u.old_str.length > 4000; });
        if (!whole) return plan;
        return notionFetch(pageId).then(function (after) {
          var v = N.verify(before, after, ws, S.cfg.notion.marker || undefined);
          if (!v.weekFound) throw { code: 'verify', message: 'The week didn’t show up on the page after writing.' };
          if (v.lostBlocks) toast('Synced. Notion now lists fewer buttons or embeds on the page than before; check its page history.');
          return plan;
        });
      });
    }).then(function (plan) {
      weekDoc(ws).notion = { pushed: plan.hashes, at: Date.now(), status: 'ok' };
      saveWeek(ws);
      Sync.state = 'ok'; Sync.message = ''; Sync.code = '';
      if (manual || mode === 'insert' || mode === 'append') toast(mode === 'noop' ? 'The Weekly Agenda is already up to date.' : 'Synced to the Weekly Agenda on Vi’s Starmap.');
    }, function (e) {
      var code = (e && e.code) || 'upstream_error';
      Sync.code = code; Sync.state = code === 'approval_required' ? 'approval' : 'error';
      if (code === 'partial' && weekDoc(ws).notion) { weekDoc(ws).notion.pushed = {}; saveWeek(ws); }
      Sync.message = {
        approval_required: 'Notion needs your OK. Tap to allow and sync.',
        needs_reauth: 'Reconnect Notion in claude.ai Settings → Connectors.',
        server_not_connected: 'Add the Notion connector in claude.ai Settings → Connectors.',
        selection_required: 'Choose which Notion connection to use when claude.ai asks.',
        not_in_manifest: 'Notion is switched off for this page. Allow it from the artifact’s Permissions.',
        blocked_by_policy: 'Your organization blocks this Notion tool.',
        server_unavailable: 'Notion didn’t answer. Tap to try again.',
        cancelled: 'The sync was cancelled. Tap to try again.'
      }[code] || (e && e.message ? String(e.message).slice(0, 160) : 'Sync failed. Tap to try again.');
    }).then(function () {
      Sync.running = false; updateSyncChip(); renderWeekSyncLine();
      var st = $('notion-status'); if (st) st.textContent = syncStatusLong();
      if (Sync.again) { var w = Sync.again; Sync.again = null; scheduleSync(w, 3000); }
    });
  }
  function renderWeekSyncLine() { $('week-sync').textContent = weekSyncText(weekStartOf(S.date)); }
  function syncStatusLong() {
    var wk = weekDoc(weekStartOf(S.date));
    if (S.mcp === null) return 'Notion can only be reached when this page is open on claude.ai with the Notion connector added.';
    if (Sync.state === 'error' || Sync.state === 'approval') return Sync.message;
    if (wk.notion && wk.notion.at) return 'This week was last written to Notion ' + ago(wk.notion.at) + '.';
    if (!S.cfg.notion.armed) return 'Nothing has been written yet. The first sync happens after you weave your first real day, or now with the button.';
    return 'This week hasn’t been written to Notion yet.';
  }
  function updateSyncChip() {
    var chip = $('sync-chip'), text = $('sync-text');
    var st = S.mcp === null ? 'off' : S.cfg.notion.auto === false ? 'off' : !S.cfg.notion.armed ? 'idle' : Sync.state;
    chip.setAttribute('data-state', st);
    var label = st === 'off' ? (S.mcp === null ? 'Notion: open on claude.ai' : 'Starmap sync off') :
      st === 'idle' ? 'Vi’s Starmap' : st === 'pending' ? 'Starmap: changes waiting' : st === 'syncing' ? 'Syncing to Starmap…' :
      st === 'ok' ? 'Starmap synced' : st === 'approval' ? 'Starmap needs your OK' : 'Starmap sync failed';
    text.textContent = label;
    chip.title = st === 'error' || st === 'approval' ? Sync.message : label;
    chip.setAttribute('aria-label', 'Notion sync: ' + label + (Sync.message && (st === 'error' || st === 'approval') ? '. ' + Sync.message : ''));
  }
  $('sync-chip').addEventListener('click', function () {
    var st = $('sync-chip').getAttribute('data-state');
    if ((st === 'error' || st === 'approval') && S.mcp && Sync.code !== 'not_in_manifest' && Sync.code !== 'needs_reauth' && Sync.code !== 'server_not_connected') { runSync(Sync.week || weekStartOf(S.date), true); return; }
    openSettings();
    setTimeout(function () { var n = $('notion-sync-now'); if (n) n.scrollIntoView({ block: 'center' }); }, 50);
  });

  /* ------------------------------------------------------------------ scene */
  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncScene() {
    if (!S.scene) return;
    var day = ensureDay(S.date), cur = isToday() && day.plan ? P.currentBlock(day.plan, nowMin()) : null;
    S.scene.setTasks(slotTasks(day).map(function (t) { return { title: t.title, done: !!t.done, active: !!(cur && cur.ref === t.id && !t.done) }; }));
    var admin = day.admin.filter(function (a) { return a.title; });
    S.scene.setAdmin(admin.length, admin.filter(function (a) { return a.done; }).length);
    S.scene.setGlow(P.stats(day).glow);
  }
  function startScene() {
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      S.scene = window.FTScene.create({ canvas: $('space'), stage: $('stage'), labels: $('pollen-labels'), theme: effectiveTheme(), reducedMotion: reduced, fill: function (w) { return w < 520 ? 0.7 : 0.6; } });
    } catch (e) { S.scene = null; return; }
    S.scene.onPick(function (slot) {
      var day = ensureDay(S.date), t = slotTasks(day)[slot];
      if (!t || !t.title) {
        if (!day.plan || S.composing[S.date]) { var f = $((slot < 3 ? 'p' : 's') + ((slot % 3) + 1) + '-title'); if (f) { f.focus(); return; } }
        S.composing[S.date] = true; renderPlanPanel();
        var g = $((slot < 3 ? 'p' : 's') + ((slot % 3) + 1) + '-title'); if (g) g.focus();
        return;
      }
      var first = day.plan && day.plan.blocks.filter(function (b) { return b.ref === t.id; })[0];
      if (first && !$('plan-view').hidden) {
        var row = document.querySelector('.blk[data-id="' + first.id + '"]');
        if (row) { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.animate && row.animate([{ background: 'var(--petal-wash)' }, { background: 'transparent' }], { duration: 1400 }); }
      }
      if (day.example) return;
      toast((t.done ? 'Done: ' : '') + trim(t.title, 40), t.done ? 'Undo' : 'Mark done', function () { setTaskDone(day, t.id, !t.done); });
    });
    var mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { S.scene && S.scene.setTheme(effectiveTheme()); });
    new MutationObserver(function () { S.scene && S.scene.setTheme(effectiveTheme()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
    if (rm && rm.addEventListener) rm.addEventListener('change', function () { S.scene && S.scene.setReducedMotion(rm.matches); });
  }

  /* ------------------------------------------------------------------ toast */
  var toastTimer = null;
  function toast(text, action, fn) {
    var el = $('toast'), t = $('toast-text');
    t.textContent = text;
    var old = el.querySelector('button'); if (old) old.remove();
    if (action) el.appendChild(h('button', { type: 'button', class: 'btn btn-small btn-petal', onclick: function () { el.classList.remove('show'); fn(); } }, action));
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, action ? 7000 : 3600);
  }

  /* ------------------------------------------------------------------ wiring */
  $('prev-day').addEventListener('click', function () { goDate(N.addDays(S.date, -1)); });
  $('next-day').addEventListener('click', function () { goDate(N.addDays(S.date, 1)); });
  $('go-today').addEventListener('click', goToday);
  $('prev-week').addEventListener('click', function () { goDate(N.addDays(weekStartOf(S.date), -7 + (isToday() ? N.parseISO(S.date).getDay() : 0))); });
  $('next-week').addEventListener('click', function () { goDate(N.addDays(weekStartOf(S.date), 7 + (isToday() ? N.parseISO(S.date).getDay() : 0))); });
  $('open-settings').addEventListener('click', openSettings);
  $('start-real').addEventListener('click', function () {
    var day = ensureDay(S.date);
    delete day.example;
    day.tasks = []; day.admin = []; day.fixed = []; day.plan = null; day.note = ''; day.checkins = [];
    normalizeDay(day);
    S.composing[S.date] = true; S.composerFor = null;
    saveDay(day, { quiet: true }); render();
    var f = $('p1-title'); if (f) f.focus();
  });
  var label = $('week-label');
  function saveLabel() {
    var ws = weekStartOf(S.date), wk = weekDoc(ws), v = label.value.trim();
    if (v === N.defaultWeekLabel(ws)) v = '';
    if (v === (wk.label || '')) return;
    wk.label = v; saveWeek(ws); renderPlanPanel(); scheduleSync(ws, 2000);
  }
  label.addEventListener('change', saveLabel);
  label.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); label.blur(); } });
  document.querySelectorAll('dialog [data-close]').forEach(function (b) { b.addEventListener('click', function () { b.closest('dialog').close(); }); });
  document.addEventListener('click', function (e) { if (S.menu && !e.target.closest('.menu') && !e.target.closest('.more-btn')) { S.menu = null; renderPlanPanel(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (S.menu || S.editing)) { S.menu = null; S.editing = null; renderPlanPanel(); } });

  setInterval(function () {               // the clock moves the "now" marker; midnight moves the day
    var t = todayISO();
    if (S.followToday && S.date !== t) { goDate(t); return; }
    if (!isToday()) return;
    renderNow(); syncScene();
    var active = document.activeElement;
    if (!$('plan-view').hidden && !S.menu && !S.editing && !(active && active.closest && active.closest('#plan-view'))) renderPlanView(ensureDay(S.date));
    $('plan-eyebrow').textContent = greeting() + ' · Week ' + (weekDoc(weekStartOf(S.date)).label || N.defaultWeekLabel(weekStartOf(S.date)));
    renderWeekSyncLine();
  }, 30000);

  $('checkin-form').addEventListener('submit', function (e) { e.preventDefault(); });

  startScene();
  S.scrollToNow = true;
  render();
  startStore();
  window.__trove = S;                  // handy when debugging in the console
})();
