/* The Fairy Trove — day planner (pure logic).
 *
 * The six-task rule: three primary "win the day" tasks + three secondary ones, laid on top of
 * the daily routines, with small admin tasks batched and travel between places accounted for.
 * localPlan() builds a day without any help; buildPrompt()/normalizePlan() let Claude write a
 * richer one and keep it honest (no overlaps, nothing dropped, fixed things stay fixed).
 */
(function (root) {
  'use strict';

  var KINDS = { routine: 1, meal: 1, primary: 1, secondary: 1, admin: 1, travel: 1, 'break': 1, fixed: 1, buffer: 1, checkin: 1 };
  var NOON = 720, EVENING = 1080;

  /* ---------- time ---------- */
  function toMin(hhmm) { var p = String(hhmm == null ? '' : hhmm).split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function toHM(min) { var m = ((Math.round(min) % 1440) + 1440) % 1440; return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
  function ceil5(m) { return Math.ceil(m / 5) * 5; }
  function floor5(m) { return Math.floor(m / 5) * 5; }
  function nice(min) {                  // 450 → "7.30am"
    var m = ((min % 1440) + 1440) % 1440, h = Math.floor(m / 60), mm = m % 60;
    return (h % 12 || 12) + (mm ? '.' + pad2(mm) : '') + (h < 12 ? 'am' : 'pm');
  }
  function dur(min) { return min >= 60 ? (min % 60 ? Math.floor(min / 60) + 'h ' + (min % 60) + 'm' : (min / 60) + 'h') : min + ' min'; }
  var _uid = 0;
  function uid(prefix) { _uid++; return (prefix || 'b') + Date.now().toString(36) + _uid.toString(36) + Math.floor(Math.random() * 1296).toString(36); }

  /* ---------- defaults ---------- */
  function defaultConfig() {
    return {
      name: '',
      wake: '05:30', sleep: '22:00',
      places: [
        { id: 'home', name: 'Home', travel: 0, mode: '' },
        { id: 'cafe', name: 'Café', travel: 20, mode: 'MRT' },
        { id: 'school', name: 'School', travel: 35, mode: 'MRT' },
        { id: 'library', name: 'Library', travel: 25, mode: 'bus' }
      ],
      routines: [
        { id: 'r_rise', name: 'Wake up, water, get ready', anchor: 'wake', offset: 0, min: 25, kind: 'routine', on: true },
        { id: 'r_move', name: 'Exercise', anchor: 'wake', offset: 25, min: 30, kind: 'routine', on: true },
        { id: 'r_breakfast', name: 'Breakfast', anchor: 'wake', offset: 55, min: 20, kind: 'meal', on: true },
        { id: 'r_lunch', name: 'Lunch', anchor: 'time', time: '12:30', min: 40, kind: 'meal', on: true },
        { id: 'r_dinner', name: 'Dinner', anchor: 'time', time: '19:00', min: 40, kind: 'meal', on: true },
        { id: 'r_read', name: 'Read 10 pages', anchor: 'sleep', offset: 40, min: 20, kind: 'routine', on: true },
        { id: 'r_wind', name: 'Wind down, screens off', anchor: 'sleep', offset: 20, min: 20, kind: 'routine', on: true }
      ],
      checkins: { midday: '13:30', evening: '20:45' },
      focus: { primary: 90, secondary: 45, session: 90, breakMin: 10, adminPer: 7 },
      notion: { auto: true, pageUrl: '', marker: '' }
    };
  }
  function emptyDay(date, week, cfg) {
    return {
      date: date, week: week,
      tasks: [], admin: [], fixed: [],
      places: { am: 'home', pm: 'home', eve: 'home' },
      wake: cfg ? cfg.wake : '05:30', sleep: cfg ? cfg.sleep : '22:00',
      note: '', plan: null, checkins: [], rev: 0
    };
  }

  /* ---------- small helpers ---------- */
  function placeMap(cfg) { var m = {}; (cfg.places || []).forEach(function (p) { m[p.id] = p; }); return m; }
  function placeName(cfg, id) { var p = placeMap(cfg)[id]; return p ? p.name : 'Home'; }
  function partOf(min) { return min < NOON ? 'am' : min < EVENING ? 'pm' : 'eve'; }
  function placeAt(day, min) { var p = day.places || {}; return p[partOf(min)] || 'home'; }
  function travelMin(cfg, a, b) {
    if (a === b) return 0;
    var P = placeMap(cfg), ta = P[a] ? Number(P[a].travel) || 0 : 0, tb = P[b] ? Number(P[b].travel) || 0 : 0;
    if (a === 'home') return tb; if (b === 'home') return ta;
    return Math.max(ta, tb, 10);
  }
  function window_(day, cfg) {
    var wake = toMin(day.wake || cfg.wake), sleep = toMin(day.sleep || cfg.sleep);
    if (sleep <= wake) sleep += 1440;
    return { wake: wake, sleep: sleep };
  }
  function overlaps(a, b) { return a.s < b.e && b.s < a.e; }
  function minsOf(b) { return toMin(b.end) + (toMin(b.end) < toMin(b.start) ? 1440 : 0) - toMin(b.start); }

  var PLACE_TIPS = {
    home: 'Clear the desk, fill your water bottle and leave your phone in another room.',
    cafe: 'Order first, headphones on, charger out — then one tab only.',
    school: 'Find the quietest corner you can and set a timer before you start.',
    library: 'Pick a seat facing a wall, phone on silent in your bag.'
  };
  function tip(cfg, id) { return PLACE_TIPS[id] || 'Settle in, set a timer, and start with the smallest first step.'; }

  /* ---------- what is left to do ---------- */
  function workedOn(day, taskId, before) {      // minutes already spent on a task in the current plan
    var t = 0;
    ((day.plan && day.plan.blocks) || []).forEach(function (b) {
      if (b.ref !== taskId || b.skipped) return;
      var s = toMin(b.start), e = s + minsOf(b);
      if (b.done) t += e - s; else if (before != null && s < before && before < e) t += before - s;
    });
    return t;
  }

  // Where the planner's owner is at `from`, read off the current plan. A trip in progress moves `from` to its end.
  function currentSpot(day, from) {
    var here = 'home', until = from;
    var bl = ((day.plan && day.plan.blocks) || []).filter(function (b) { return !b.skipped; })
      .map(function (b) { var s = toMin(b.start); return { b: b, s: s, e: s + minsOf(b) }; })
      .sort(function (a, b) { return a.s - b.s; });
    bl.forEach(function (x) {
      if (x.s > from) return;
      if (x.b.kind === 'travel') { here = x.b.place || here; if (x.e > from) until = Math.max(until, x.e); }
      else if (x.b.place) here = x.b.place;
    });
    return { place: here, from: until };
  }

  /* ---------- the scaffold: routines, fixed commitments, travel, check-ins ---------- */
  function scaffold(day, cfg, opts) {
    opts = opts || {};
    var w = window_(day, cfg), replanning = opts.from != null && opts.from > w.wake + 1;
    var spot = replanning ? currentSpot(day, ceil5(opts.from)) : { place: 'home', from: w.wake };
    var from = replanning ? Math.max(w.wake, ceil5(spot.from)) : w.wake;
    var here = opts.at || spot.place, startPlace = here;
    var hard = [], dow = new Date(day.date + 'T12:00:00').getDay();
    var keep = (opts.keep || []).map(function (k) { return { s: k.s, e: k.e, kind: 'kept', lock: true }; });
    function clash(b, list) { for (var i = 0; i < list.length; i++) if (list[i] !== b && overlaps(b, list[i])) return list[i]; return null; }

    (day.fixed || []).forEach(function (f) {
      if (!f.title || !f.start || !f.end) return;
      var s = toMin(f.start), e = toMin(f.end); if (e <= s || e <= from) return;
      hard.push({ s: Math.max(s, from), e: e, kind: 'fixed', title: f.title, ref: f.id, at: f.place || null, lock: true });
    });

    var doneRoutines = {};
    ((day.plan && day.plan.blocks) || []).forEach(function (b) { if ((b.kind === 'routine' || b.kind === 'meal') && b.ref && (b.done || b.skipped)) doneRoutines[b.ref] = 1; });
    var routines = (cfg.routines || []).filter(function (r) { return r.on !== false && r.name && (!r.days || !r.days.length || r.days.indexOf(dow) !== -1); }).map(function (r) {
      var s = r.anchor === 'wake' ? w.wake + (Number(r.offset) || 0) : r.anchor === 'sleep' ? w.sleep - (Number(r.offset) || 0) : toMin(r.time);
      if (r.anchor === 'time' && s < w.wake) s += 1440;
      return { s: s, e: s + (Number(r.min) || 15), kind: r.kind === 'meal' ? 'meal' : 'routine', title: r.name, ref: r.id, anchor: r.anchor };
    }).sort(function (a, b) { return a.s - b.s; });
    routines.forEach(function (r) {
      if (replanning && (doneRoutines[r.ref] || r.e <= from)) return;          // already happened, or let go
      var len = r.e - r.s;
      if (r.s < from) { r.s = from; r.e = from + len; }
      for (var guard = 0; guard < 12; guard++) {
        var hit = clash(r, hard.concat(keep)); if (!hit) break;
        if (r.anchor === 'sleep' && hit.s - len >= from) { r.e = hit.s; r.s = r.e - len; }
        else { r.s = hit.e; r.e = r.s + len; }
      }
      if (r.e > w.sleep + 90) return;
      hard.push(r);
    });

    // Where the day needs to happen, in order. A trip goes in wherever the place changes.
    var places = day.places || {}, am = places.am || 'home', pm = places.pm || 'home', eve = places.eve || 'home';
    var wakeEnd = w.wake, lunch = null, dinner = null, night = null;
    hard.forEach(function (h) {
      if (h.anchor === 'wake' && h.e > wakeEnd) wakeEnd = h.e;
      if (h.kind === 'meal' && h.s >= 660 && h.s < 900 && !lunch) lunch = h;
      if (h.kind === 'meal' && h.s >= 1020 && !dinner) dinner = h;
      if (h.anchor === 'sleep' && (!night || h.s < night.s)) night = h;
    });
    var partPlace = function (t) { return t < NOON ? am : t < EVENING ? pm : eve; };
    var stops = [{ at: wakeEnd, place: am, mode: 'depart' }];
    hard.forEach(function (h) {
      if (h.kind !== 'fixed' || !h.at) return;
      stops.push({ at: h.s, place: h.at, mode: 'arrive' });
      stops.push({ at: h.e, place: partPlace(h.e), mode: 'depart' });
    });
    stops.push({ at: lunch ? lunch.e : 780, place: pm, mode: 'depart' });
    stops.push({ at: dinner ? dinner.s : EVENING, place: eve, mode: 'arrive' });
    stops.push({ at: night ? night.s : w.sleep - 30, place: 'home', mode: 'arrive' });
    stops.sort(function (a, b) { return a.at - b.at || (a.mode === 'arrive' ? -1 : 1); });
    var go = (day.admin || []).filter(function (a) { return a.title && !a.done && a.go; }).map(function (a) { return a.id; });
    var cursor = from;
    stops.forEach(function (st) {
      if (st.at < from && st.mode === 'depart' && st.place !== here && stops.some(function (o) { return o.at >= from && o !== st; })) {
        // a departure that should already have happened: only follow it if nothing later says otherwise
      }
      if (st.place === here) { cursor = Math.max(cursor, st.at); return; }
      if (st.at < from && st.mode === 'depart') return;
      var mins = travelMin(cfg, here, st.place);
      var s = st.mode === 'arrive' ? st.at - mins : st.at;
      s = Math.max(s, cursor, from);
      var t = { s: s, e: s + mins, kind: 'travel', to: st.place, fromPlace: here, lock: true };
      var walls = hard.filter(function (h) { return h.kind === 'fixed' || h.kind === 'travel'; }).concat(keep);
      for (var guard = 0; guard < 8; guard++) {
        var hit = clash(t, walls); if (!hit) break;
        if (st.mode === 'arrive' && hit.s >= from + 5 && hit.s <= st.at && hit.kind !== 'travel') { t.e = hit.s; t.s = Math.max(from, t.e - mins); if (t.e - t.s < 5) { t.s = hit.e; t.e = t.s + mins; } }
        else { t.s = hit.e; t.e = t.s + mins; }
      }
      var P = placeMap(cfg)[st.place === 'home' ? here : st.place] || {};
      t.title = (st.place === 'home' ? 'Head home' : 'Travel to ' + placeName(cfg, st.place)) + (P.mode ? ' (' + P.mode + ')' : '');
      t.refs = go.splice(0, Math.max(1, Math.floor(mins / 10)));
      hard.push(t); here = st.place; cursor = t.e;
    });
    // meals, routines and check-ins are flexible: anything that now sits on a trip or a commitment slides later
    for (var pass = 0; pass < 4; pass++) {
      hard.sort(function (a, b) { return a.s - b.s || (a.lock ? -1 : 1); });
      var moved = false;
      hard.forEach(function (cur) {
        if (cur.lock) return;
        for (var g2 = 0; g2 < 12; g2++) {
          var hit = null;
          for (var i = 0; i < hard.length; i++) if (hard[i] !== cur && overlaps(cur, hard[i]) && (hard[i].lock || hard[i].s < cur.s || (hard[i].s === cur.s && i < hard.indexOf(cur)))) { hit = hard[i]; break; }
          if (!hit) hit = clash(cur, keep);
          if (!hit) break;
          var l2 = cur.e - cur.s; cur.s = hit.e; cur.e = cur.s + l2; moved = true;
        }
      });
      if (!moved) break;
    }
    hard = hard.filter(function (h) { return h.s < w.sleep + 90; });

    // check-ins slot into the nearest opening (not right on top of a re-plan, which is one)
    [['midday', 'Midday check-in', 5], ['evening', 'Evening wrap-up', 10]].forEach(function (c) {
      var at = cfg.checkins && cfg.checkins[c[0]]; if (!at) return;
      var s = toMin(at); if (s + c[2] <= from || s >= w.sleep) return;
      if (replanning && s < from + 45) return;
      var b = { s: Math.max(s, from), e: Math.max(s, from) + c[2], kind: 'checkin', title: c[1], ref: 'check_' + c[0] };
      for (var guard = 0; guard < 12; guard++) { var hit = clash(b, hard.concat(keep)); if (!hit) break; b.s = hit.e; b.e = b.s + c[2]; }
      if (b.e <= w.sleep) hard.push(b);
    });
    hard.sort(function (a, b) { return a.s - b.s; });
    return { hard: hard, keep: keep, from: from, wake: w.wake, sleep: w.sleep, startPlace: startPlace, replanning: replanning };
  }
  // Give every block the place it happens in: trips change it, commitments name their own.
  function assignPlaces(list, startPlace) {
    var here = startPlace || 'home';
    list.sort(function (a, b) { return a.s - b.s; }).forEach(function (b) {
      if (b.kind === 'travel') { b.place = b.to || b.place || here; here = b.place; }
      else if (b.kind === 'fixed' && b.at) { b.place = b.at; here = b.at; }
      else b.place = here;
    });
    return list;
  }
  function gapsOf(hard, from, to) {
    var gaps = [], cur = from;
    hard.slice().sort(function (a, b) { return a.s - b.s; }).forEach(function (h) {
      if (h.s > cur) gaps.push({ s: cur, e: Math.min(h.s, to) });
      cur = Math.max(cur, h.e);
    });
    if (cur < to) gaps.push({ s: cur, e: to });
    return gaps.filter(function (g) { return g.e - g.s >= 10; });
  }

  /* ---------- the work queue ---------- */
  function queueOf(day, cfg, from, energy, current) {
    var F = cfg.focus || {}, q = [];
    var session = energy && energy <= 2 ? 50 : Number(F.session) || 90;
    var tasks = (day.tasks || []).filter(function (t) { return t.title && !t.done; });
    var prim = tasks.filter(function (t) { return t.tier === 'primary'; }), sec = tasks.filter(function (t) { return t.tier !== 'primary'; });
    function item(t) {
      var est = Number(t.est) || (t.tier === 'primary' ? Number(F.primary) || 90 : Number(F.secondary) || 45);
      var left = Math.max(15, ceil5(est - workedOn(day, t.id, from)));
      return { kind: t.tier === 'primary' ? 'primary' : 'secondary', ref: t.id, title: t.title, left: left, session: session, focus: true };
    }
    var admin = (day.admin || []).filter(function (a) { return a.title && !a.done && !a.go; });
    var adminItem = admin.length ? { kind: 'admin', title: 'Admin sprinkle', refs: admin.map(function (a) { return a.id; }), left: Math.min(40, Math.max(15, ceil5(admin.length * (Number(F.adminPer) || 7)))), session: 40 } : null;
    prim.forEach(function (t, i) { q.push(item(t)); if (i === 1 && adminItem) { q.push(adminItem); adminItem = null; } });
    if (adminItem) q.splice(Math.min(q.length, 1), 0, adminItem);
    sec.forEach(function (t) { q.push(item(t)); });
    if (current) { var ci = -1; q.forEach(function (x, i) { if (x.ref === current) ci = i; }); if (ci > 0) q.unshift(q.splice(ci, 1)[0]); }
    return q;
  }
  function fill(gaps, queue, cfg, out) {
    var brk = Number((cfg.focus || {}).breakMin) || 10, streak = 0;
    gaps.forEach(function (g) {
      var cur = g.s; streak = 0;
      while (queue.length) {
        var it = queue[0], room = g.e - cur;
        var want = Math.min(it.left, it.session);
        if (it.left - want > 0 && it.left - want < 20 && it.left <= it.session + 10) want = it.left;   // don't leave a crumb for later
        if (want > room) {
          if (!it.focus || room < 25) break;
          want = floor5(room);
          if (it.left - want < 15) { if (room >= it.left) want = it.left; else break; }
        }
        out.push({ s: cur, e: cur + want, kind: it.kind, title: it.title, ref: it.ref, refs: it.refs });
        cur += want; it.left -= want; streak++;
        if (it.left <= 0) queue.shift();
        if (!queue.length) break;
        var pause = streak % 3 === 0 ? brk + 5 : brk;
        if (g.e - cur >= pause + 20 && want >= 40) { out.push({ s: cur, e: cur + pause, kind: 'break', title: streak % 3 === 0 ? 'Longer break' : 'Break' }); cur += pause; }
      }
    });
    return queue;
  }

  /* ---------- wording ---------- */
  function describe(blocks, day, cfg) {
    var seen = {}, total = {};
    blocks.forEach(function (b) { if (b.ref && (b.kind === 'primary' || b.kind === 'secondary')) total[b.ref] = (total[b.ref] || 0) + 1; });
    var adminById = {}; (day.admin || []).forEach(function (a) { adminById[a.id] = a; });
    blocks.forEach(function (b) {
      var where = placeName(cfg, b.place);
      if (b.kind === 'primary' || b.kind === 'secondary') {
        var n = total[b.ref], i = (seen[b.ref] = (seen[b.ref] || 0) + 1);
        b.title = String(b.title).replace(/\s*\(\d+\/\d+\)\s*$/, '');
        if (n > 1) b.title = b.title + ' (' + i + '/' + n + ')';
        if (b.detail) return;
        var len = dur(b.e - b.s);
        if (b.kind === 'primary') b.detail = i === 1 ? 'Win-the-day block at ' + where + ', ' + len + '. ' + tip(cfg, b.place) : 'Back to it for ' + len + '. Pick up exactly where the last session stopped and push to a clear stopping point.';
        else b.detail = 'A lighter ' + len + ' at ' + where + '. Decide what "done for today" means before you start, then stop when you hit it.';
      } else if (b.detail) { return; }
      else if (b.kind === 'admin') {
        var names = (b.refs || []).map(function (id) { return adminById[id] && adminById[id].title; }).filter(Boolean);
        b.detail = 'Quick-fire: ' + (names.join(', ') || 'small admin') + '. Set a timer and do them back to back.';
      } else if (b.kind === 'travel') {
        var onTheGo = (b.refs || []).map(function (id) { return adminById[id] && adminById[id].title; }).filter(Boolean);
        b.detail = onTheGo.length ? 'On the way: ' + onTheGo.join(', ') + '.' : 'Music, a podcast, or just rest your eyes.';
      } else if (b.kind === 'break') b.detail = 'Stand up, stretch, water. No scrolling.';
      else if (b.kind === 'buffer') b.detail = 'Slack for whatever ran over. If nothing did, rest.';
      else if (b.kind === 'checkin') b.detail = b.ref === 'check_evening' ? 'Tick off the day, note what moves to tomorrow, and close the laptop.' : 'How is the day going? Tick what is done and adjust the afternoon if you need to.';
      else if (b.kind === 'meal') b.detail = 'Eat away from the screen.';
      else if (b.kind === 'fixed') b.detail = 'Fixed commitment at ' + where + '.';
      else b.detail = '';
    });
  }
  function summarize(blocks, day, cfg, overflow, w) {
    var first = blocks.filter(function (b) { return b.kind === 'primary'; })[0];
    var lastWork = blocks.filter(function (b) { return b.kind === 'primary' || b.kind === 'secondary'; }).pop();
    var bits = [];
    var prim = (day.tasks || []).filter(function (t) { return t.tier === 'primary' && t.title && !t.done; }).length;
    if (first) bits.push('Your first win starts at ' + nice(first.s) + ' at ' + placeName(cfg, first.place));
    else if (!prim) bits.push('No win-the-day tasks are waiting');
    var moves = blocks.filter(function (b) { return b.kind === 'travel'; });
    if (moves.length) bits.push(moves.map(function (m) { return m.title.replace(/ \(.*\)$/, '').toLowerCase() + ' at ' + nice(m.s); }).join(', then '));
    if (lastWork) bits.push('focused work wraps by ' + nice(lastWork.e));
    var s = bits.join('; ') + '. Lights out at ' + nice(w.sleep) + '.';
    if (overflow && overflow.length) s += ' Not everything fits today: ' + overflow.map(function (o) { return o.title; }).join(', ') + '.';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function finish(list, day, cfg) {
    list.sort(function (a, b) { return a.s - b.s; });
    return list.map(function (h) {
      var place = h.place || 'home';
      return { id: uid('b'), start: toHM(h.s), end: toHM(h.e), s: h.s, e: h.e, title: h.title, kind: h.kind, ref: h.ref || null, refs: h.refs && h.refs.length ? h.refs.slice() : undefined, place: place, detail: h.detail || '', done: false, skipped: false };
    });
  }
  function strip(blocks) { return blocks.map(function (b) { var o = {}; for (var k in b) if (k !== 's' && k !== 'e' && b[k] !== undefined) o[k] = b[k]; return o; }); }

  // Blocks that already happened stay as the record of the day.
  function history(day, from) {
    return ((day.plan && day.plan.blocks) || []).map(function (b) {
      var s = toMin(b.start), e = s + minsOf(b);
      if (e <= from) return Object.assign({}, b);
      var running = s < from && from < e;
      if (b.done && running && b.kind !== 'travel' && b.kind !== 'fixed') return Object.assign({}, b, { end: toHM(Math.max(from, s + 5)) });   // finished early: it ended now
      if (b.done) return Object.assign({}, b);
      if (running && (b.kind === 'primary' || b.kind === 'secondary')) return Object.assign({}, b, { end: toHM(from) });   // in progress: keep the part worked
      return null;
    }).filter(Boolean).filter(function (b) { return minsOf(b) >= 5 || b.done; });
  }

  /* ---------- the local plan ---------- */
  function localPlan(day, cfg, opts) {
    opts = Object.assign({}, opts || {});
    var w0 = window_(day, cfg), replanning = opts.from != null && opts.from > w0.wake + 1;
    var past = replanning ? history(day, ceil5(opts.from)) : [];
    if (replanning) opts.keep = past.map(function (b) { var s = toMin(b.start); return { s: s, e: s + minsOf(b) }; }).filter(function (k) { return k.e > ceil5(opts.from); });
    var sc = scaffold(day, cfg, opts), list = sc.hard.slice();
    if (replanning) past = history(day, sc.from);
    var night = sc.sleep; sc.hard.forEach(function (h) { if (h.anchor === 'sleep' && h.s < night) night = h.s; });
    var gaps = gapsOf(sc.hard.concat(sc.keep), sc.from, Math.min(night, sc.sleep));
    var current = replanning ? currentTask(day, sc.from) : null;
    var queue = queueOf(day, cfg, replanning ? sc.from : null, opts.energy, current), work = [];
    var free = gaps.reduce(function (a, g) { return a + (g.e - g.s); }, 0), need = queue.reduce(function (a, q) { return a + q.left; }, 0);
    var left = fill(gaps, queue, cfg, work);
    if (free - need >= 60) {                     // one pocket of slack in the afternoon if the day has room
      var g2 = gapsOf(sc.hard.concat(sc.keep, work), Math.max(sc.from, 840), Math.min(night, sc.sleep)).filter(function (g) { return g.e - g.s >= 20; })[0];
      if (g2) work.push({ s: g2.s, e: g2.s + Math.min(25, floor5(g2.e - g2.s)), kind: 'buffer', title: 'Buffer' });
    }
    list = assignPlaces(list.concat(work), sc.startPlace);
    describe(list, day, cfg);
    var overflow = left.map(function (q) { return { ref: q.ref || null, title: q.title, min: q.left }; });
    var blocks = strip(finish(list, day, cfg));
    if (replanning) blocks = past.concat(blocks).sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
    return { at: Date.now(), source: 'local', summary: summarize(list, day, cfg, overflow, sc), blocks: blocks, overflow: overflow };
  }
  function currentTask(day, from) {
    var cur = null;
    ((day.plan && day.plan.blocks) || []).forEach(function (b) {
      var s = toMin(b.start), e = s + minsOf(b);
      if (!b.skipped && !b.done && b.ref && (b.kind === 'primary' || b.kind === 'secondary') && s < from && from < e) cur = b.ref;
    });
    return cur;
  }

  /* ---------- asking Claude ---------- */
  function promptContext(day, cfg, opts) {
    opts = opts || {};
    opts = Object.assign({}, opts);
    var w = window_(day, cfg), replanning = opts.from != null && opts.from > w.wake + 1;
    var past = replanning ? history(day, ceil5(opts.from)) : [];
    if (replanning) opts.keep = past.map(function (b) { var s0 = toMin(b.start); return { s: s0, e: s0 + minsOf(b) }; }).filter(function (k) { return k.e > ceil5(opts.from); });
    var sc = scaffold(day, cfg, opts), from = sc.from;
    if (replanning) past = history(day, from);
    var ids = {}, F = cfg.focus || {};
    var tasks = (day.tasks || []).filter(function (t) { return t.title && !t.done; });
    var pi = 0, si = 0;
    var T = tasks.map(function (t) {
      var sid = t.tier === 'primary' ? 'p' + (++pi) : 's' + (++si);
      ids[sid] = { type: t.tier === 'primary' ? 'primary' : 'secondary', id: t.id, title: t.title };
      var est = Number(t.est) || (t.tier === 'primary' ? Number(F.primary) || 90 : Number(F.secondary) || 45);
      return { id: sid, tier: t.tier === 'primary' ? 'primary (win the day)' : 'secondary', title: t.title, minutes: Math.max(15, ceil5(est - (replanning ? workedOn(day, t.id, from) : 0))) };
    });
    var A = (day.admin || []).filter(function (a) { return a.title && !a.done; }).map(function (a, i) { var sid = 'a' + (i + 1); ids[sid] = { type: 'admin', id: a.id, title: a.title }; return { id: sid, title: a.title, on_the_go: !!a.go }; });
    var Rr = [], Fx = [], Tr = [];
    sc.hard.forEach(function (h) {
      if (h.kind === 'fixed') { var fid = 'f' + (Fx.length + 1); ids[fid] = { type: 'fixed', id: h.ref, title: h.title, s: h.s, e: h.e }; Fx.push({ id: fid, title: h.title, start: toHM(h.s), end: toHM(h.e), place: h.at || 'wherever they are' }); }
      else if (h.kind === 'routine' || h.kind === 'meal') { var rid = 'r' + (Rr.length + 1); ids[rid] = { type: h.kind, id: h.ref, title: h.title }; Rr.push({ id: rid, title: h.title, usual_start: toHM(h.s), minutes: h.e - h.s, kind: h.kind, at_home: h.anchor !== 'time' }); }
      else if (h.kind === 'travel') Tr.push({ to: h.to, from: h.fromPlace, minutes: h.e - h.s, suggested_start: toHM(h.s) });
    });
    var places = (cfg.places || []).map(function (p) { return { id: p.id, name: p.name, minutes_from_home: Number(p.travel) || 0, by: p.mode || '' }; });
    var d = new Date(day.date + 'T12:00:00');
    var data = {
      date: day.date, weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
      plan_from: toHM(from), sleep: toHM(w.sleep), wake: toHM(w.wake),
      where: { morning: (day.places || {}).am || 'home', afternoon: (day.places || {}).pm || 'home', evening: (day.places || {}).eve || 'home', right_now: sc.startPlace },
      places: places, tasks: T, admin: A, fixed: Fx, routines: Rr, travel_needed: Tr,
      check_ins: { midday: (cfg.checkins || {}).midday || null, evening: (cfg.checkins || {}).evening || null },
      note_from_them: day.note || '', energy_now: opts.energy ? opts.energy + '/5' : null, check_in_note: opts.note || ''
    };
    if (replanning) data.already_happened = past.map(function (b) { return b.start + '-' + b.end + ' ' + b.title + (b.done ? ' (done)' : ' (not done)'); });
    var prompt = [
      'You are the planning fairy inside "The Fairy Trove", a personal day planner. Write one realistic, kind, well-paced plan for ' + (replanning ? 'THE REST of this day, starting at plan_from' : 'this day') + '.',
      '',
      'Reply with ONLY a JSON object, no prose around it:',
      '{"summary": "2-3 sentences describing the shape of the day", "blocks": [{"start":"HH:MM","end":"HH:MM","title":"...","kind":"routine|meal|primary|secondary|admin|travel|break|fixed|buffer|checkin","ref":"task, routine or fixed id, or null","refs":["admin ids"],"place":"place id","detail":"1-2 sentences"}]}',
      '',
      'Rules:',
      '- 24-hour times. Blocks sorted, no overlaps, nothing before plan_from, nothing after sleep.',
      '- The day runs on six tasks: up to three primary "win the day" tasks and three secondary ones, on top of the routines. Every task id must appear in at least one block as "ref". Primary tasks get the best focus hours and come before secondary ones. Never drop a primary task; if time is short, shrink secondary ones and say so in the summary.',
      '- Give each task about its minutes. Work longer than 90 minutes is split into sessions with a 10-15 minute break; title the sessions "(1/2)", "(2/2)".',
      '- Fixed commitments stay exactly at their times: kind "fixed", ref = their id.',
      '- Routines stay close to usual_start and keep their minutes: kind "routine" or "meal", ref = their id. Routines marked at_home happen at home.',
      '- Add a "travel" block wherever travel_needed lists one, with those minutes, before the first block at the new place. Put on_the_go admin items in travel blocks through "refs".',
      '- Batch the other admin items into one or two short "admin" blocks (ids in "refs").',
      '- Include the check-ins near their times: kind "checkin", ref "check_midday" / "check_evening", 5-10 minutes.',
      '- Leave roughly 10-15% of the waking day as breaks or buffer, and keep the wind-down before sleep free of work.',
      '- If energy_now or a note says they are tired or unwell, shorten sessions, add rest, and say what you changed.',
      '- "detail" is concrete and warm: what to open or do first, how to set up the place, what done looks like. No generic motivation, no emoji.',
      '- "place" is one of the place ids. Titles for task blocks reuse the task title.',
      '',
      'The day:',
      JSON.stringify(data, null, 1)
    ].join('\n');
    return { prompt: prompt, ids: ids, from: from, wake: w.wake, sleep: w.sleep, replanning: replanning, hard: sc.hard, keep: sc.keep, past: past, startPlace: sc.startPlace };
  }

  function parseClock(v) {
    var m = String(v == null ? '' : v).trim().match(/^(\d{1,2})[:.h](\d{2})$/);
    if (!m) return null;
    var h = Number(m[1]), mm = Number(m[2]); if (h > 29 || mm > 59) return null;
    return h * 60 + mm;
  }

  // Turn Claude's reply into a plan we can trust, or return null.
  function normalizePlan(raw, day, cfg, ctx) {
    var arr = raw && (Array.isArray(raw) ? raw : raw.blocks);
    if (!Array.isArray(arr) || arr.length < 2) return null;
    var P = placeMap(cfg), list = [], seenTask = {}, usedAdmin = {}, fixedNotes = {};
    arr.forEach(function (b) {
      if (!b || typeof b !== 'object') return;
      var s = parseClock(b.start), e = parseClock(b.end); if (s == null || e == null) return;
      if (s < ctx.wake - 1 && s < 360) s += 1440;                               // past midnight
      if (e <= s) e += 1440;
      if (e - s < 5 || e - s > 360) return;
      if (e <= ctx.from) return;
      if (s < ctx.from) s = ctx.from;
      if (s >= ctx.sleep + 30) return;
      var kind = KINDS[b.kind] ? b.kind : 'buffer', ref = null, refs = [];
      var info = b.ref && ctx.ids[String(b.ref)];
      if (info) {
        if (info.type === 'admin') { refs.push(info.id); kind = 'admin'; }
        else { ref = info.id; kind = info.type; if (info.type === 'primary' || info.type === 'secondary') seenTask[String(b.ref)] = 1; }
      } else if (b.ref === 'check_midday' || b.ref === 'check_evening') { ref = b.ref; kind = 'checkin'; }
      else if (kind === 'primary' || kind === 'secondary' || kind === 'fixed') kind = 'buffer';     // a task we never gave it
      (Array.isArray(b.refs) ? b.refs : []).forEach(function (r) { var a = ctx.ids[String(r)]; if (a && a.type === 'admin' && !usedAdmin[a.id]) { usedAdmin[a.id] = 1; refs.push(a.id); } });
      refs = refs.filter(function (x, i) { return refs.indexOf(x) === i; });
      if (kind === 'fixed') { if (ref && b.detail) fixedNotes[ref] = String(b.detail).replace(/\s+/g, ' ').trim().slice(0, 320); return; }   // re-inserted exactly below
      var title = String(b.title || (info && info.title) || kind).replace(/\s+/g, ' ').trim().slice(0, 90);
      list.push({ s: s, e: e, kind: kind, title: title, ref: ref, refs: refs, place: P[b.place] ? b.place : null, detail: String(b.detail || '').replace(/\s+/g, ' ').trim().slice(0, 320) });
    });
    if (list.length < 2) return null;
    // fixed commitments exactly where they are
    var fixed = ctx.hard.filter(function (h) { return h.kind === 'fixed'; }).map(function (h) { return { s: h.s, e: h.e, kind: 'fixed', title: h.title, ref: h.ref, at: h.at, place: h.at, lock: true, detail: fixedNotes[h.ref] || '' }; });
    var kept = (ctx.keep || []).map(function (k) { return { s: k.s, e: k.e, kind: 'kept', lock: true }; });
    list = list.concat(fixed, kept).sort(function (a, b) { return a.s - b.s || (a.lock ? -1 : 1); });
    // untangle overlaps: fixed blocks win, others slide or shrink
    var out = [];
    list.forEach(function (b) {
      var prev = out[out.length - 1];
      if (prev && b.s < prev.e) {
        if (b.lock && !prev.lock) { prev.e = b.s; if (prev.e - prev.s < 5) out.pop(); }
        else if (!b.lock) { var len = b.e - b.s; b.s = prev.e; b.e = b.s + len; }
        else { b.s = prev.e; }
      }
      if (b.e - b.s >= 5) out.push(b);
    });
    out = out.filter(function (b) { return b.kind !== 'kept'; });
    // nothing the day needs may go missing
    var missing = [];
    Object.keys(ctx.ids).forEach(function (sid) {
      var info = ctx.ids[sid];
      if ((info.type === 'primary' || info.type === 'secondary') && !seenTask[sid]) {
        var t = (day.tasks || []).filter(function (x) { return x.id === info.id; })[0], F = cfg.focus || {};
        missing.push({ kind: info.type, ref: info.id, title: info.title, left: Math.max(15, Number(t && t.est) || (info.type === 'primary' ? Number(F.primary) || 90 : Number(F.secondary) || 45)), session: Number(F.session) || 90, focus: true });
      }
    });
    var looseAdmin = Object.keys(ctx.ids).filter(function (sid) { return ctx.ids[sid].type === 'admin' && !usedAdmin[ctx.ids[sid].id] && !out.some(function (b) { return (b.refs || []).indexOf(ctx.ids[sid].id) !== -1; }); }).map(function (sid) { return ctx.ids[sid].id; });
    if (looseAdmin.length) missing.push({ kind: 'admin', title: 'Admin sprinkle', refs: looseAdmin, left: Math.min(40, Math.max(15, ceil5(looseAdmin.length * 7))), session: 40 });
    var overflow = [];
    if (missing.length) {
      missing.sort(function (a, b) { return (a.kind === 'primary' ? 0 : 1) - (b.kind === 'primary' ? 0 : 1); });
      var extra = [], left = fill(gapsOf(out.concat(kept), ctx.from, ctx.sleep - 20), missing, cfg, extra);
      out = out.concat(extra).sort(function (a, b) { return a.s - b.s; });
      overflow = left.map(function (q) { return { ref: q.ref || null, title: q.title, min: q.left }; });
    }
    out = out.filter(function (b) { return b.s < ctx.sleep + 30; });
    [['midday', 'Midday check-in', 5], ['evening', 'Evening wrap-up', 10]].forEach(function (c) {
      var at = cfg.checkins && cfg.checkins[c[0]], ref = 'check_' + c[0];
      if (!at || out.some(function (b) { return b.ref === ref; })) return;
      var want = toMin(at); if (want + c[2] <= ctx.from || (ctx.replanning && want < ctx.from + 45)) return;
      var g = gapsOf(out.concat(kept), Math.max(ctx.from, want), ctx.sleep).filter(function (x) { return x.e - x.s >= c[2]; })[0];
      if (g && g.s - want <= 120) out.push({ s: g.s, e: g.s + c[2], kind: 'checkin', title: c[1], ref: ref });
    });
    out.sort(function (a, b) { return a.s - b.s; });
    var here = ctx.startPlace || 'home';
    out.sort(function (a, b) { return a.s - b.s; }).forEach(function (b) {
      if (b.kind === 'travel') { here = b.place || here; b.place = here; }
      else if (b.kind === 'fixed' && b.at) { b.place = b.at; here = b.at; }
      else b.place = here;                                   // no teleporting: a block happens where the last trip ended
    });
    describe(out, day, cfg);
    var blocks = strip(finish(out, day, cfg));
    if (ctx.replanning) blocks = (ctx.past || []).concat(blocks).sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
    var summary = raw && typeof raw.summary === 'string' ? raw.summary.replace(/\s+/g, ' ').trim().slice(0, 600) : '';
    return { at: Date.now(), source: 'claude', summary: summary || summarize(out, day, cfg, overflow, { sleep: ctx.sleep }), blocks: blocks, overflow: overflow };
  }

  /* ---------- adjusting as the day goes on ---------- */
  // "I'm running late": everything not yet done from `from` on slides by `delta`; fixed commitments stay.
  function shiftPlan(plan, from, delta, sleepMin) {
    if (!plan || !plan.blocks) return plan;
    var blocks = plan.blocks.map(function (b) { var s = toMin(b.start); return Object.assign({}, b, { s: s, e: s + minsOf(b) }); }).sort(function (a, b) { return a.s - b.s; });
    var fixed = blocks.filter(function (b) { return b.kind === 'fixed' && !b.done; });
    function lay(dropBuffers) {
      var cur = 0, out = [];
      blocks.forEach(function (b) {
        if (b.done || b.skipped || b.e <= from || b.kind === 'fixed') { out.push(Object.assign({}, b)); if (b.kind === 'fixed') cur = Math.max(cur, b.e); return; }
        if (dropBuffers && b.kind === 'buffer') return;
        var len = b.e - b.s, s = Math.max(cur, b.s + delta, from);
        for (var g = 0; g < 8; g++) {
          var hit = null;
          for (var i = 0; i < fixed.length; i++) if (s < fixed[i].e && fixed[i].s < s + len) { hit = fixed[i]; break; }
          if (!hit) break; s = hit.e;
        }
        out.push(Object.assign({}, b, { s: s, e: s + len })); cur = s + len;
      });
      return out;
    }
    var out = lay(false), end = out.reduce(function (m, b) { return Math.max(m, b.e); }, 0);
    if (sleepMin && end > sleepMin) { out = lay(true); end = out.reduce(function (m, b) { return Math.max(m, b.e); }, 0); }
    out.sort(function (a, b) { return a.s - b.s; });
    return Object.assign({}, plan, { blocks: out.map(function (b) { var o = Object.assign({}, b, { start: toHM(b.s), end: toHM(b.e) }); delete o.s; delete o.e; return o; }), late: sleepMin && end > sleepMin ? end - sleepMin : 0 });
  }

  function currentBlock(plan, nowMin) {
    if (!plan || !plan.blocks) return null;
    var cur = null;
    plan.blocks.forEach(function (b) { var s = toMin(b.start), e = s + minsOf(b); if (!b.skipped && s <= nowMin && nowMin < e) cur = b; });
    return cur;
  }
  function nextBlock(plan, nowMin) {
    if (!plan || !plan.blocks) return null;
    var nx = null;
    plan.blocks.forEach(function (b) { var s = toMin(b.start); if (!b.done && !b.skipped && s >= nowMin && (!nx || s < toMin(nx.start))) nx = b; });
    return nx;
  }
  function stats(day) {
    var tasks = (day.tasks || []).filter(function (t) { return t.title; });
    var prim = tasks.filter(function (t) { return t.tier === 'primary'; }), sec = tasks.filter(function (t) { return t.tier !== 'primary'; });
    var done = function (l) { return l.filter(function (t) { return t.done; }).length; };
    var admin = (day.admin || []).filter(function (a) { return a.title; });
    return { primary: prim.length, primaryDone: done(prim), secondary: sec.length, secondaryDone: done(sec), admin: admin.length, adminDone: done(admin), total: tasks.length, done: done(tasks),
      won: prim.length > 0 && done(prim) === prim.length, glow: tasks.length ? (done(prim) * 2 + done(sec)) / Math.max(1, prim.length * 2 + sec.length) : 0 };
  }

  var api = {
    toMin: toMin, toHM: toHM, nice: nice, dur: dur, uid: uid, ceil5: ceil5, minsOf: minsOf,
    defaultConfig: defaultConfig, emptyDay: emptyDay, placeName: placeName, placeAt: placeAt, travelMin: travelMin, dayWindow: window_,
    localPlan: localPlan, promptContext: promptContext, currentSpot: currentSpot, normalizePlan: normalizePlan, shiftPlan: shiftPlan,
    currentBlock: currentBlock, nextBlock: nextBlock, stats: stats, KINDS: KINDS
  };
  root.FTPlan = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
