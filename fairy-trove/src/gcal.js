/* The Fairy Trove — Google Calendar mapping (pure functions, no network).
 *
 * A woven day's activities become calendar events; breaks, buffers and check-ins stay in the Trove.
 * Each synced block has a stable key (its task or routine id plus which session it is), so a re-plan
 * moves the same events instead of adding new ones. Events that were already in the calendar are
 * linked rather than copied: the Trove may move or rename them when the plan changes, but never
 * deletes them, and never touches events someone else organises (an invite).
 */
(function (root) {
  'use strict';
  var P = root.FTPlan || (typeof require === 'function' ? require('./planner.js') : null);
  var N = root.FTNotion || (typeof require === 'function' ? require('./notion.js') : null);

  // Google Calendar colour ids, picked to match how the calendar already colours things:
  // Tomato for routines and meals, Flamingo for travel, Peacock and Sage for the day's work.
  var COLORS = { primary: '7', secondary: '2', admin: '5', fixed: '3', travel: '4', routine: '11', meal: '11' };
  var SKIP = { 'break': 1, buffer: 1, checkin: 1 };
  var FOOTER = 'From The Fairy Trove';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function localISO(date, min) {            // '2026-11-19', 450 → '2026-11-19T07:30:00' (no offset: the calendar's own zone applies)
    var d = date;
    while (min >= 1440) { d = N.addDays(d, 1); min -= 1440; }
    return d + 'T' + pad2(Math.floor(min / 60)) + ':' + pad2(min % 60) + ':00';
  }
  function normTitle(t) {
    return String(t || '').toLowerCase().replace(/[★✿✦◆]/g, '').replace(/\(\d+\/\d+\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function isTravelTitle(t) { var n = normTitle(t); return /^(travel|head home|commute|go to|going to)/.test(n); }

  function syncable(b, cfg) {
    if (!b || b.skipped || SKIP[b.kind]) return false;
    if ((b.kind === 'routine' || b.kind === 'meal') && cfg && cfg.gcal && cfg.gcal.routines === false) return false;
    return P.minsOf(b) >= 5;
  }
  function eventFor(day, b, cfg) {
    var s = P.toMin(b.start), e = s + P.minsOf(b);
    var place = P.placeName(cfg, b.place);
    return {
      summary: String(b.title || '').slice(0, 200),
      startTime: localISO(day.date, s),
      endTime: localISO(day.date, e),
      location: b.location || (b.kind === 'travel' ? 'To ' + place : place),
      description: (b.detail ? b.detail + '\n\n' : '') + FOOTER,
      colorId: COLORS[b.kind] || '1'
    };
  }
  // A linked event (one that was already in the calendar) only ever follows the plan's times.
  // Its title, colour, notes and place stay exactly as they were written.
  function hashLinked(ev) { return N.hash([ev.startTime, ev.endTime].join('|')); }
  function hashFull(ev) { return N.hash([ev.summary, ev.startTime, ev.endTime, ev.location, ev.description, ev.colorId].join('|')); }

  function keyed(blocks) {
    var seen = {};
    return blocks.slice().sort(function (a, b) { return P.toMin(a.start) - P.toMin(b.start); }).map(function (b) {
      // trips are known by where they go, so "Travel to Café" and "Travel to Café (MRT)" stay the same event
      var base = b.ref ? 'ref:' + b.ref : b.kind === 'travel' ? 'travel:' + (b.place || normTitle(b.title)) : b.kind + ':' + normTitle(b.title);
      seen[base] = (seen[base] || 0) + 1;
      return { key: base + '#' + seen[base], b: b };
    });
  }
  function wanted(day, cfg) {
    var out = {};
    if (!day || !day.plan || !day.plan.blocks) return out;
    keyed(day.plan.blocks).forEach(function (k) { if (syncable(k.b, cfg)) out[k.key] = { b: k.b, ev: eventFor(day, k.b, cfg) }; });
    return out;
  }

  // Google returns start/end as {dateTime: '2026-11-19T07:30:00+08:00'} (or {date} for all-day ones).
  function wallMinutes(t) {
    var s = t && (t.dateTime || t.date) || '';
    var m = String(s).match(/T(\d{2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }
  function wallDate(t) { var s = t && (t.dateTime || t.date) || ''; return String(s).slice(0, 10); }
  function spanOf(ev, date) {               // minutes from midnight of `date`
    var s = wallMinutes(ev.start), e = wallMinutes(ev.end);
    if (s == null || e == null) return null;
    if (wallDate(ev.start) > date) s += 1440;
    if (wallDate(ev.end) > date) e += 1440;
    if (e <= s) e += 1440;
    return { s: s, e: e };
  }
  function overlapShare(a, b) {
    var o = Math.min(a.e, b.e) - Math.max(a.s, b.s);
    return o <= 0 ? 0 : o / Math.min(a.e - a.s, b.e - b.s);
  }
  // Pair wanted blocks with events already in the calendar: same title (or both trips) at an overlapping time.
  function linkExisting(st, want, existing, date) {
    var pool = (existing || []).filter(function (ev) {
      return ev && ev.id && ev.status !== 'cancelled' && ev.start && ev.start.dateTime && !Object.keys(st.events).some(function (k) { return st.events[k].id === ev.id; });
    });
    var linked = [];
    Object.keys(want).forEach(function (key) {
      if (st.events[key]) return;
      var w = want[key], span = { s: P.toMin(w.b.start), e: P.toMin(w.b.start) + P.minsOf(w.b) };
      var best = null, bestScore = 0;
      pool.forEach(function (ev) {
        var sp = spanOf(ev, date); if (!sp) return;
        var share = overlapShare(span, sp); if (share < 0.5) return;
        var same = normTitle(ev.summary) === normTitle(w.ev.summary) || (w.b.kind === 'travel' && isTravelTitle(ev.summary));
        if (!same) return;
        var score = share + (sp.s === span.s ? 1 : 0);
        if (score > bestScore) { best = ev; bestScore = score; }
      });
      if (!best) return;
      pool.splice(pool.indexOf(best), 1);
      var sp2 = spanOf(best, date);
      var exact = sp2.s === span.s && sp2.e === span.e;
      st.events[key] = { id: best.id, linked: true, ro: !!(best.organizer && best.organizer.self === false), h: exact ? hashLinked(w.ev) : '' };
      linked.push(key);
    });
    return linked;
  }

  // The calls needed to bring the calendar in line with the plan, in a safe order: moves first, then adds, then removals.
  function planOps(st, want) {
    var updates = [], creates = [], removes = [];
    Object.keys(want).forEach(function (key) {
      var cur = st.events[key], w = want[key];
      if (!cur) { creates.push({ op: 'create', key: key, ev: w.ev, h: hashFull(w.ev) }); return; }
      if (cur.gone) { if (cur.h !== hashFull(w.ev)) creates.push({ op: 'create', key: key, ev: w.ev, h: hashFull(w.ev) }); return; }
      var h = cur.linked ? hashLinked(w.ev) : hashFull(w.ev);
      if (cur.h === h) return;
      if (cur.ro) { updates.push({ op: 'mark', key: key, h: h }); return; }     // an invite: follow it, never edit it
      updates.push({ op: 'update', key: key, id: cur.id, ev: w.ev, h: h, linked: !!cur.linked });
    });
    Object.keys(st.events).forEach(function (key) {
      if (want[key]) return;
      var cur = st.events[key];
      removes.push({ op: cur.linked || cur.ro || cur.gone ? 'unlink' : 'delete', key: key, id: cur.id });
    });
    return updates.concat(creates, removes);
  }
  function updateInput(op, calendarId) {
    var input = { calendarId: calendarId, eventId: op.id, startTime: op.ev.startTime, endTime: op.ev.endTime, notificationLevel: 'NONE' };
    if (!op.linked) { input.summary = op.ev.summary; input.location = op.ev.location; input.description = op.ev.description; input.colorId = op.ev.colorId; }
    return input;
  }
  function createInput(op, calendarId) {
    return { calendarId: calendarId, summary: op.ev.summary, startTime: op.ev.startTime, endTime: op.ev.endTime, location: op.ev.location, description: op.ev.description, colorId: op.ev.colorId, notificationLevel: 'NONE' };
  }
  function eventIdOf(p) {
    if (!p) return null;
    if (typeof p === 'string') {
      try { p = JSON.parse(p); } catch (e) { var m = p.match(/"?(?:eventId|id)"?\s*[:=]\s*"?([A-Za-z0-9_\-]{6,})/); return m ? m[1] : null; }
    }
    return p.id || p.eventId || (p.event && (p.event.id || p.event.eventId)) || null;
  }

  var api = {
    COLORS: COLORS, localISO: localISO, normTitle: normTitle, syncable: syncable, eventFor: eventFor,
    hashLinked: hashLinked, hashFull: hashFull, keyed: keyed, wanted: wanted, spanOf: spanOf,
    linkExisting: linkExisting, planOps: planOps, updateInput: updateInput, createInput: createInput, eventIdOf: eventIdOf
  };
  root.FTCal = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
