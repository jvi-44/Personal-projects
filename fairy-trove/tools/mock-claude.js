/* Dev only: a stand-in for the claude.ai artifact runtime, so the page can be driven locally.
 * db (in memory, with live snapshots), user, sample (builds a plan from the prompt's own data),
 * mcp with a fake Notion that edits a copy of a real page export, and permissions.
 * Load it before src/app.js. Query: ?mock=1&nosample=1&nonotion=1&approval=1&seed=example
 */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  var store = {}, listeners = [];
  window.__mock = { store: store, notionWrites: [], notionPage: '', sampleCalls: 0, cal: { calls: [], events: [] } };
  // a calendar that already has one thing on the test day, so linking can be checked
  window.__mock.cal.events.push({ id: 'existing_lunch', summary: 'Lunch', start: { dateTime: '2026-11-18T12:30:00+08:00' }, end: { dateTime: '2026-11-18T13:10:00+08:00' }, organizer: { self: true }, status: 'confirmed' });

  function snapOf(path) {
    var d = store[path];
    return { id: path.split('/').pop(), exists: !!d, data: function () { return d ? clone(d) : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function fire(l) {
    if (l.dead) return;
    if (l.kind === 'doc') l.next(snapOf(l.path));
    else {
      var prefix = l.col + '/';
      var docs = Object.keys(store).filter(function (p) { return p.indexOf(prefix) === 0 && p.slice(prefix.length).indexOf('/') === -1; })
        .filter(function (p) { return l.filters.every(function (f) { return f[1] === '==' ? store[p][f[0]] === f[2] : true; }); })
        .sort().map(snapOf);
      l.next({ docs: docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: function () { return []; } });
    }
  }
  function notify() { setTimeout(function () { listeners.forEach(fire); }, 40); }
  function docRef(path) {
    return {
      id: path.split('/').pop(), path: path,
      get: function () { return Promise.resolve(snapOf(path)); },
      set: function (data) { store[path] = clone(data); notify(); return new Promise(function (r) { setTimeout(r, 30); }); },
      update: function (data) { if (!store[path]) return Promise.reject({ code: 'invalid_argument' }); Object.assign(store[path], clone(data)); notify(); return Promise.resolve(); },
      delete: function () { delete store[path]; notify(); return Promise.resolve(); },
      onSnapshot: function (next) { var l = { kind: 'doc', path: path, next: next }; listeners.push(l); setTimeout(function () { fire(l); }, 60); return function () { l.dead = true; }; },
      collection: function (p) { return colRef(path + '/' + p); }
    };
  }
  function colRef(path, filters) {
    filters = filters || [];
    return {
      path: path,
      where: function (f, op, v) { return colRef(path, filters.concat([[f, op, v]])); },
      orderBy: function () { return colRef(path, filters); }, limit: function () { return colRef(path, filters); },
      doc: function (id) { return docRef(path + '/' + (id || Math.random().toString(36).slice(2))); },
      get: function () { return new Promise(function (r) { fire({ kind: 'col', col: path, filters: filters, next: r }); }); },
      onSnapshot: function (next) { var l = { kind: 'col', col: path, filters: filters, next: next }; listeners.push(l); setTimeout(function () { fire(l); }, 60); return function () { l.dead = true; }; }
    };
  }
  var db = { doc: docRef, collection: function (p) { return colRef(p); } };
  var user = { id: function () { return Promise.resolve('u_testviewer000000000000'); }, isOwner: function () { return Promise.resolve(true); }, canEdit: function () { return Promise.resolve(true); }, can: function () { return Promise.resolve(true); } };

  // ---- Claude: build a plan from the JSON the prompt carries, the way a careful model would
  function planFrom(prompt) {
    var data = JSON.parse(prompt.slice(prompt.indexOf('The day:') + 8));
    var toMin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var hm = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    var fixed = [];
    data.routines.forEach(function (r) { fixed.push({ s: toMin(r.usual_start), e: toMin(r.usual_start) + r.minutes, title: r.title, kind: r.kind, ref: r.id, place: r.at_home ? 'home' : null, detail: r.kind === 'meal' ? 'Proper food, away from the desk.' : 'Same as every day: small and steady.' }); });
    data.fixed.forEach(function (f) { fixed.push({ s: toMin(f.start), e: toMin(f.end), title: f.title, kind: 'fixed', ref: f.id, place: f.place }); });
    data.travel_needed.forEach(function (t) { fixed.push({ s: toMin(t.suggested_start), e: toMin(t.suggested_start) + t.minutes, title: 'Travel to ' + t.to, kind: 'travel', place: t.to, refs: data.admin.filter(function (a) { return a.on_the_go; }).map(function (a) { return a.id; }), detail: 'Headphones in; answer the quick messages on the way.' }); });
    fixed.sort(function (a, b) { return a.s - b.s; });
    var out = fixed.slice(), cur = toMin(data.plan_from), work = data.tasks.slice();
    var admin = data.admin.filter(function (a) { return !a.on_the_go; });
    if (admin.length) work.splice(1, 0, { id: null, title: 'Admin sprinkle', minutes: 20, admin: admin.map(function (a) { return a.id; }) });
    var end = toMin(data.sleep) - 45;
    work.forEach(function (t) {
      var left = t.minutes;
      while (left > 0 && cur < end) {
        var next = fixed.filter(function (f) { return f.e > cur; })[0];
        if (next && next.s <= cur) { cur = next.e; continue; }
        var room = (next ? next.s : end) - cur;
        if (room < 20) { cur = next ? next.e : end; continue; }
        var len = Math.min(left, room, 90);
        out.push({ s: cur, e: cur + len, title: t.title, kind: t.admin ? 'admin' : t.tier.indexOf('primary') === 0 ? 'primary' : 'secondary', ref: t.id, refs: t.admin, detail: t.admin ? 'Knock these out back to back.' : 'Open the file first, set a timer, and work in one tab. Stop at a clean break.' });
        cur += len; left -= len;
        if (room - len >= 25) { out.push({ s: cur, e: cur + 10, title: 'Break', kind: 'break', detail: 'Water, stretch, window.' }); cur += 10; }
      }
    });
    if (data.check_ins.midday) out.push({ s: toMin(data.check_ins.midday), e: toMin(data.check_ins.midday) + 5, title: 'Midday check-in', kind: 'checkin', ref: 'check_midday' });
    out.sort(function (a, b) { return a.s - b.s; });
    return {
      summary: 'A ' + (data.where.morning) + ' morning for the hardest work, ' + data.where.afternoon + ' after lunch, home by evening. (mock plan)',
      blocks: out.filter(function (b) { return b.s >= toMin(data.plan_from) - 1; }).map(function (b) { return { start: hm(b.s), end: hm(b.e), title: b.title, kind: b.kind, ref: b.ref || null, refs: b.refs || [], place: b.place, detail: b.detail || '' }; })
    };
  }
  function sample(input, opts) { return run(input, opts, false); }
  function run(input, opts, asJson) {
    opts = opts || {};
    window.__mock.sampleCalls++;
    window.__mock.lastPrompt = typeof input === 'string' ? input : '';
    return new Promise(function (resolve, reject) {
      if (q.get('samplefail')) return setTimeout(function () { reject({ code: q.get('samplefail'), message: 'mock failure' }); }, 300);
      var answer = JSON.stringify(planFrom(String(input)));
      var i = 0, step = Math.ceil(answer.length / 8), timer;
      if (opts.signal) opts.signal.addEventListener('abort', function () { clearInterval(timer); reject({ code: 'cancelled', message: 'stopped' }); });
      setTimeout(function () {
        timer = setInterval(function () {
          i = Math.min(answer.length, i + step);
          if (opts.onText) opts.onText({ text: answer.slice(0, i), delta: answer.slice(i - step, i) });
          if (i >= answer.length) { clearInterval(timer); resolve(asJson ? JSON.parse(answer) : { text: answer, truncated: false, modelTierApplied: 'default' }); }
        }, 150);
      }, 600);
    });
  }
  sample.json = function (input, opts) { return run(input, opts, true); };
  sample.limits = function () { return Promise.resolve({ maxPromptBytes: 262144 }); };

  // ---- Notion: a copy of a real page export, edited the way the connector edits it
  var pageReady = fetch('/fixture/page.txt').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
    window.__mock.notionPage = t || '<page url="https://app.notion.com/p/x">\n<content>\n<callout color="purple_bg">\n<b><span color="yellow_bg"><u>✮ 山乇乇Ҝㄥㄚ 卂Ꮆ乇几ᗪ卂 ✮</u></span></b>\n\n<toggle>\n<span color="yellow_bg">ЩΣΣK After Prelims </span>\n\n<toggle color="yellow_bg">\nƧЦПDΛY <code>[27 Sep]</code>\n\n- [ ] Old task\n- [ ] \n  - [ ] \n</toggle>\n\n<toggle color="gray_bg">\nMӨПDΛY <code>[28 Sep]</code>\n\n- [ ] \n</toggle>\n</toggle>\n\n<unknown url="https://app.notion.com/p/x#button1" alt="button" />\n</callout>\n\n- [ ] \n</content>\n</page>';
  });
  var approved = !q.get('approval');
  var calSeq = 0;
  function calTool(tool, input) {
    var cal = window.__mock.cal;
    cal.calls.push({ tool: tool, input: clone(input) });
    var off = '+08:00';
    if (tool === 'list_calendars') return { calendars: [{ id: 'school@example.org', summary: 'School timetable', timeZone: 'UTC' }] };
    if (tool === 'list_events') {
      var a = input.startTime, b = input.endTime;
      return { events: cal.events.filter(function (e) { var s = e.start.dateTime.slice(0, 19); return s >= a && s < b; }) };
    }
    if (tool === 'create_event') {
      var ev = { id: 'ev' + (++calSeq), summary: input.summary, start: { dateTime: input.startTime + off }, end: { dateTime: input.endTime + off }, location: input.location, description: input.description, colorId: input.colorId, organizer: { self: true }, status: 'confirmed' };
      cal.events.push(ev); return clone(ev);
    }
    var found = cal.events.filter(function (e) { return e.id === input.eventId; })[0];
    if (!found) throw { code: 'tool_error', message: 'Not Found' };
    if (tool === 'update_event') {
      if (input.summary) found.summary = input.summary;
      if (input.startTime) found.start = { dateTime: input.startTime + off };
      if (input.endTime) found.end = { dateTime: input.endTime + off };
      if (input.location != null) found.location = input.location;
      return clone(found);
    }
    if (tool === 'delete_event') { cal.events.splice(cal.events.indexOf(found), 1); return {}; }
    throw { code: 'not_in_manifest', message: tool };
  }
  var mcp = {
    listTools: function () { return Promise.resolve({ servers: [{ server: 'Notion', authStatus: 'connected', tools: [{ name: 'notion-fetch' }, { name: 'notion-update-page' }] }] }); },
    callTool: function (server, tool, input) {
      if (server === 'Google Calendar') return new Promise(function (r) { setTimeout(r, 25); }).then(function () { var p = calTool(tool, input); return { content: [{ type: 'text', text: JSON.stringify(p) }], payload: p }; });
      return pageReady.then(function () {
        if (!approved) { approved = true; throw { code: 'approval_required', message: 'needs approval' }; }
        if (tool === 'notion-fetch') {
          var payload = { metadata: { type: 'page' }, title: '✮ √ﾉ\'丂 丂ｲﾑ尺ﾶﾑｱ 2026✮', url: 'https://app.notion.com/p/' + input.id, text: window.__mock.notionPage };
          return { content: [{ type: 'text', text: JSON.stringify(payload) }], payload: payload };
        }
        if (tool === 'notion-update-page') {
          window.__mock.notionWrites.push(clone(input));
          var page = window.__mock.notionPage, warnings = [];
          if (input.command === 'update_content') {
            input.content_updates.forEach(function (u) {
              var n = page.split(u.old_str).length - 1;
              if (u.replace_all_matches) {
                if (q.get('notionloses')) return;          // ?notionloses=1: a Notion on which the checkbox guard stops working
                if (n < 1) warnings.push('no match for an update'); else page = page.split(u.old_str).join(u.new_str);
              } else if (n !== 1) warnings.push('no match for an update'); else page = page.replace(u.old_str, function () { return u.new_str; });
            });
            // Like Notion, the page is re-read after a search-and-replace, and that loses every empty to-do written as "- [ ] ".
            page = page.replace(/^[ \t]*- \[ \] ?\n/gm, '');
          } else if (input.command === 'insert_content') page = page.replace('\n</content>', '\n' + input.content + '\n</content>');
          window.__mock.notionPage = page.split('<todo checked="false"></todo>').join('- [ ] ');
          return { content: [{ type: 'text', text: '{}' }], payload: warnings.length ? { page_id: input.page_id, warnings: warnings } : { page_id: input.page_id } };
        }
        throw { code: 'not_in_manifest', message: 'tool ' + tool };
      });
    },
    invalidate: function () { return Promise.resolve(); }
  };
  var permissions = { state: function () { return Promise.resolve('granted'); }, request: function () { return Promise.resolve({}); }, manage: function () { return Promise.resolve(); } };

  if (q.get('seed') === 'example' && window.__exampleSeed) window.__exampleSeed(store);
  var caps = { db: db, user: user, sample: q.get('nosample') ? null : sample, mcp: q.get('nonotion') ? null : mcp, permissions: permissions };
  window.claude = { use: function (name) { return new Promise(function (r) { setTimeout(function () { r(caps[name] || null); }, 120); }); } };
})();
