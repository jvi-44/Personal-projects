/* The Fairy Trove — Notion weekly-agenda writer (pure functions, no network).
 *
 * Mirrors the layout already used in "✮ WEEKLY AGENDA ✮" on the Starmap page:
 *   <toggle> ЩΣΣK <label> </toggle>
 *     └ seven day toggles, Sunday → Saturday, each a list of timestamped to-dos.
 * Sync is one-way (dashboard → Notion): we read the page text, locate our week by
 * its date range, and replace only the day blocks that changed.
 */
(function (root) {
  'use strict';

  var DAY_NAMES = ['ƧЦПDΛY', 'MӨПDΛY', 'ƬЦΣƧDΛY', 'ЩΣDПΣƧDΛY', 'ƬΉЦЯƧDΛY', 'FЯIDΛY', 'ƧΛƬЦЯDΛY'];
  var DAY_COLORS = ['yellow_bg', 'purple_bg', 'green_bg', 'purple_bg', 'green_bg', 'purple_bg', 'gray_bg'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEK_WORD = 'ЩΣΣK';
  var AGENDA_MARKER = '山乇乇Ҝㄥㄚ 卂Ꮆ乇几ᗪ卂';
  var EMPTY_TODO = '<todo checked="false"></todo>';

  /* ---------- dates ---------- */
  function parseISO(iso) {
    var p = String(iso).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0, 0);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function weekDates(weekStartISO) {
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(weekStartISO, i));
    return out;
  }
  function dayCode(iso) {            // "[16 Nov]" — the form used in the newest weeks on the page
    var d = parseISO(iso);
    return '[' + pad2(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ']';
  }
  function weekKey(weekStartISO) {   // "(15/11 - 21/11)" — how we find our week again
    var a = parseISO(weekStartISO), b = parseISO(addDays(weekStartISO, 6));
    return '(' + pad2(a.getDate()) + '/' + pad2(a.getMonth() + 1) + ' - ' + pad2(b.getDate()) + '/' + pad2(b.getMonth() + 1) + ')';
  }
  function isoWeekNumber(iso) {
    var d = parseISO(iso);
    var day = (d.getDay() + 6) % 7;            // Mon = 0
    d.setDate(d.getDate() - day + 3);          // Thursday of this ISO week
    var firstThu = new Date(d.getFullYear(), 0, 4, 12);
    var fday = (firstThu.getDay() + 6) % 7;
    firstThu.setDate(firstThu.getDate() - fday + 3);
    return 1 + Math.round((d - firstThu) / (7 * 864e5));
  }
  function defaultWeekLabel(weekStartISO) {
    // Weeks run Sunday → Saturday on the page; number them by the Monday they contain.
    return String(isoWeekNumber(addDays(weekStartISO, 1)));
  }

  /* ---------- text ---------- */
  // Notion-flavoured Markdown: backslash-escape anything that could start markup.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/([\\*_`\[\]<>~$|])/g, '\\$1')
      .replace(/^([#+\-])/, '\\$1')
      .replace(/^(\d+)([.)])/, '$1\\$2');
  }
  function toMin(hhmm) {
    var p = String(hhmm || '0:0').split(':');
    return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0);
  }
  function fmt12(min) {
    var m = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    return { t: String(h % 12 || 12) + (mm ? '.' + pad2(mm) : ''), ap: h < 12 ? 'am' : 'pm' };
  }
  function fmtRange(start, end) {    // "7.30-9am", "11.30am-1pm"
    var a = fmt12(toMin(start)), b = fmt12(toMin(end));
    return a.ap === b.ap ? a.t + '-' + b.t + b.ap : a.t + a.ap + '-' + b.t + b.ap;
  }
  function fmtClock(ms) {
    var d = new Date(ms), f = fmt12(d.getHours() * 60 + d.getMinutes());
    return f.t + f.ap;
  }
  function hash(str) {               // small stable hash (FNV-1a) for change detection
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return h.toString(36);
  }

  /* ---------- building blocks ---------- */
  function todo(done, text) { return '- [' + (done ? 'x' : ' ') + '] ' + text; }

  // A day in Notion is its list of tasks: win-the-day ones starred, each with the time it is scheduled for.
  // The minute-by-minute timeline (routines, meals, travel, breaks) lives in Google Calendar instead.
  function dayLines(day) {
    var out = [];
    day = day || {};
    var tasks = (day.tasks || []).filter(function (t) { return t.title; });
    var admin = (day.admin || []).filter(function (a) { return a.title; });
    var blocks = (day.plan && day.plan.blocks || []).filter(function (b) { return !b.skipped; })
      .slice().sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
    var when = function (b) { return '\\[' + fmtRange(b.start, b.end) + '\\] '; };
    var items = [];
    tasks.forEach(function (t, i) {
      var star = t.tier === 'primary' ? '★ ' : '';
      var mine = blocks.filter(function (b) { return b.ref === t.id; });
      if (mine.length > 1) {
        var lines = [todo(t.done, star + esc(t.title))];
        mine.forEach(function (b) { lines.push('  ' + todo(t.done || b.done, when(b) + esc(b.title))); });
        items.push({ at: toMin(mine[0].start), order: i, lines: lines });
      } else if (mine.length === 1) {
        items.push({ at: toMin(mine[0].start), order: i, lines: [todo(t.done || mine[0].done, when(mine[0]) + star + esc(t.title))] });
      } else {
        items.push({ at: 100000 + (t.tier === 'primary' ? 0 : 1), order: i, lines: [todo(t.done, star + esc(t.title))] });
      }
    });
    var fixedBlocks = blocks.filter(function (b) { return b.kind === 'fixed'; });
    if (fixedBlocks.length) fixedBlocks.forEach(function (b) { items.push({ at: toMin(b.start), order: 50, lines: [todo(b.done, when(b) + esc(b.title))] }); });
    else (day.fixed || []).forEach(function (f) {
      if (f.title && f.start && f.end) items.push({ at: toMin(f.start), order: 50, lines: [todo(false, '\\[' + fmtRange(f.start, f.end) + '\\] ' + esc(f.title))] });
    });
    items.sort(function (a, b) { return a.at - b.at || a.order - b.order; });
    items.forEach(function (it) { out.push.apply(out, it.lines); });

    if (admin.length) {
      if (out.length) out.push('');
      out.push('Admin:', '');
      admin.forEach(function (a) { out.push(todo(a.done, esc(a.title) + (a.go ? ' \\[on the go\\]' : ''))); });
    }

    (day.checkins || []).forEach(function (c) {
      var bits = ['✿ ' + fmtClock(c.at) + ' check-in'];
      if (c.energy) bits.push('energy ' + c.energy + '/5');
      var line = bits.join(' · ') + (c.note ? ' — ' + esc(c.note) : '');
      out.push('', '<span color="gray"><i>' + line + '</i></span>');
    });

    // An empty to-do, as the page's own week template leaves. Notion drops a bare "- [ ] "
    // on write, so it has to be the tag form; it reads back as "- [ ] ".
    if (!out.length) out.push(EMPTY_TODO);
    while (out[0] === '') out.shift();
    return out;
  }

  function buildDayBlock(iso, day) {
    var d = parseISO(iso), w = d.getDay();
    var head = '<toggle color="' + DAY_COLORS[w] + '">\n' + DAY_NAMES[w] + ' <code>' + dayCode(iso) + '</code>';
    return head + '\n\n' + dayLines(day).join('\n') + '\n</toggle>';
  }

  function weekHeaderLine(weekStartISO, label) {
    var lab = esc(label || defaultWeekLabel(weekStartISO));
    return '<span color="yellow_bg">' + WEEK_WORD + ' ' + lab + ' ' + weekKey(weekStartISO) + ' </span>';
  }

  function buildWeekBlock(weekStartISO, label, dayBlocks) {
    var parts = ['<toggle>\n' + weekHeaderLine(weekStartISO, label)];
    weekDates(weekStartISO).forEach(function (iso) { parts.push(dayBlocks[iso]); });
    return parts.join('\n\n') + '\n</toggle>';
  }

  /* ---------- reading the fetched page ---------- */
  function index(text) {
    var L = text.split('\n'), off = new Array(L.length), o = 0;
    for (var i = 0; i < L.length; i++) { off[i] = o; o += L[i].length + 1; }
    return { L: L, off: off };
  }
  var RE_OPEN = /^\s*<toggle\b[^>]*[^\/]>\s*$|^\s*<toggle>\s*$/;
  var RE_CLOSE = /^\s*<\/toggle>\s*$/;

  function closeOf(L, openLine, limit) {
    var depth = 0;
    for (var i = openLine; i < limit; i++) {
      if (RE_OPEN.test(L[i])) depth++;
      else if (RE_CLOSE.test(L[i])) { depth--; if (depth === 0) return i; }
    }
    return -1;
  }
  function span(ix, a, b) {          // inclusive line range → character range
    return { start: ix.off[a], end: ix.off[b] + ix.L[b].length, a: a, b: b };
  }
  function count(hay, needle) {
    if (!needle) return 0;
    var n = 0, i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
    return n;
  }

  // The callout holding the weekly agenda, as a line range (exclusive of its own tags).
  function findAgenda(ix, marker) {
    var L = ix.L, m = -1, i;
    for (i = 0; i < L.length; i++) if (L[i].indexOf(marker) !== -1) { m = i; break; }
    if (m < 0) return null;
    var depth = 0, a = -1;
    for (i = m; i >= 0; i--) {
      var s = L[i].trim();
      if (/^<\/callout>/.test(s)) depth++;
      else if (/^<callout\b/.test(s)) { if (depth === 0) { a = i; break; } depth--; }
    }
    if (a < 0) return null;
    depth = 0;
    for (i = a; i < L.length; i++) {
      var t = L[i].trim();
      if (/^<callout\b/.test(t)) depth++;
      else if (/^<\/callout>/.test(t)) { depth--; if (depth === 0) return { a: a + 1, b: i }; }
    }
    return null;
  }

  function findWeek(ix, key, region) {
    var L = ix.L, a = region ? region.a : 0, b = region ? region.b : L.length, hit = -1;
    for (var i = a; i < b; i++) {
      if (L[i].indexOf(WEEK_WORD) !== -1 && L[i].indexOf(key) !== -1 && i > 0 && RE_OPEN.test(L[i - 1])) hit = i;
    }
    if (hit < 0) return null;
    var open = hit - 1, close = closeOf(L, open, L.length);
    if (close < 0) return null;
    return { open: open, header: hit, close: close };
  }

  function findDays(ix, week, dates) {
    var L = ix.L, found = {}, depth = 0;
    var codes = {};
    dates.forEach(function (iso) { codes[dayCode(iso).toLowerCase()] = iso; });
    for (var i = week.open + 1; i < week.close; i++) {
      if (RE_OPEN.test(L[i])) {
        if (depth === 0) {
          var title = (L[i + 1] || '').toLowerCase().replace(/\s+/g, ' ');
          var mm = title.match(/<code>(\[[^\]]*\])<\/code>/);
          var iso = mm && codes[mm[1]];
          var c = closeOf(L, i, week.close);
          if (iso && c > 0 && !found[iso]) found[iso] = { open: i, close: c };
        }
        depth++;
      } else if (RE_CLOSE.test(L[i])) depth--;
    }
    return found;
  }

  /* ---------- keeping the rest of the page whole ----------
   * Notion re-reads the whole page after every search-and-replace, and an empty to-do written as "- [ ] "
   * doesn't survive that re-read, wherever it is on the page (seen live: one small edit cost the Starmap
   * about 200 empty checkboxes). Written as a tag it survives, and reads back as "- [ ] ". So every write
   * ends with a replace-all that turns the page's empty to-dos into tags. It is left out only when there is
   * nothing to protect, and the write is refused if that text also appears where it isn't a checkbox. */
  var BARE = ['- [ ] \n', '- [ ]\n'];
  function bareLines(t, form) {      // lines that are only this empty to-do, outside code blocks
    var re = new RegExp('^[ \\t]*' + form.slice(0, -1).replace(/[[\]]/g, '\\$&') + '$', 'gm');
    return (t.replace(/^```[\s\S]*?^```.*$/gm, '').match(re) || []).length;
  }
  function guarded(text, updates) {
    if (!updates.length) return updates;
    var t = text;
    updates.forEach(function (u) { t = t.replace(u.old_str, function () { return u.new_str; }); });
    var out = updates.slice();
    for (var i = 0; i < BARE.length; i++) {
      var n = count(t, BARE[i]);
      if (!n) continue;
      if (n !== bareLines(t, BARE[i])) return null;
      out.push({ old_str: BARE[i], new_str: EMPTY_TODO + '\n', replace_all_matches: true });
    }
    return out;
  }

  /* ---------- the sync plan ----------
   * text      page text as returned by notion-fetch
   * weekStart ISO date of the Sunday
   * label     week label ('' → week number)
   * blocks    { iso: day block markdown } for all seven days
   * pushed    { iso: hash } of what we last wrote ({} if never)
   * Returns { mode, updates: [{old_str,new_str}], content?, hashes, changed: [iso] }
   */
  function planSync(opts) {
    var text = opts.text, weekStart = opts.weekStart, blocks = opts.blocks, pushed = opts.pushed || {};
    var marker = opts.marker || AGENDA_MARKER;
    var dates = weekDates(weekStart), key = weekKey(weekStart);
    var ix = index(text), L = ix.L;
    var hashes = {};
    dates.forEach(function (iso) { hashes[iso] = hash(blocks[iso]); });
    var header = weekHeaderLine(weekStart, opts.label);

    var region = findAgenda(ix, marker);
    var week = findWeek(ix, key, region) || (region ? null : findWeek(ix, key, null));

    if (!week) {
      var weekBlock = buildWeekBlock(weekStart, opts.label, blocks);
      if (!region) return { mode: 'append', updates: [], content: weekBlock, hashes: hashes, changed: dates.slice() };
      // insert after the last top-level toggle inside the agenda callout
      var depth = 0, lastClose = -1;
      for (var i = region.a; i < region.b; i++) {
        if (RE_OPEN.test(L[i])) depth++;
        else if (RE_CLOSE.test(L[i])) { depth--; if (depth === 0) lastClose = i; }
      }
      if (lastClose < 0) return { mode: 'append', updates: [], content: weekBlock, hashes: hashes, changed: dates.slice() };
      var from = lastClose, anchor = L[lastClose];
      while (count(text, anchor) !== 1 && from > region.a && lastClose - from < 80) {
        from--;
        anchor = L.slice(from, lastClose + 1).join('\n');
      }
      if (count(text, anchor) !== 1) return { mode: 'blocked', reason: 'no_unique_anchor', updates: [], hashes: hashes, changed: [] };
      var ins = guarded(text, [{ old_str: anchor, new_str: anchor + '\n\n' + weekBlock }]);
      if (!ins) return { mode: 'blocked', reason: 'unsafe_guard', updates: [], hashes: hashes, changed: [] };
      return { mode: 'insert', updates: ins, hashes: hashes, changed: dates.slice() };
    }

    var found = findDays(ix, week, dates);
    var dirty = dates.filter(function (iso) { return !found[iso] || pushed[iso] !== hashes[iso]; });
    var headerChanged = L[week.header].trim() !== header;
    if (!dirty.length && !headerChanged) return { mode: 'noop', updates: [], hashes: hashes, changed: [] };

    var missing = dates.some(function (iso) { return !found[iso]; });
    var updates = [], whole = missing;
    if (!whole) {
      dirty.forEach(function (iso) {
        var s = span(ix, found[iso].open, found[iso].close);
        var old = text.slice(s.start, s.end);
        if (old === blocks[iso]) return;                 // already identical on the page
        if (count(text, old) !== 1) whole = true;
        updates.push({ old_str: old, new_str: blocks[iso] });
      });
      if (headerChanged && !whole) {
        if (count(text, L[week.header]) === 1) updates.push({ old_str: L[week.header], new_str: header });
        else whole = true;
      }
    }
    if (whole) {
      // Rebuild the week in one replacement; untouched days are copied verbatim from the page.
      var ws = span(ix, week.open, week.close), oldWeek = text.slice(ws.start, ws.end);
      var parts = ['<toggle>\n' + header];
      dates.forEach(function (iso) {
        if (found[iso] && dirty.indexOf(iso) === -1) {
          var s2 = span(ix, found[iso].open, found[iso].close);
          parts.push(text.slice(s2.start, s2.end));
        } else parts.push(blocks[iso]);
      });
      var newWeek = parts.join('\n\n') + '\n</toggle>';
      if (count(text, oldWeek) !== 1) return { mode: 'blocked', reason: 'week_not_unique', updates: [], hashes: hashes, changed: [] };
      updates = oldWeek === newWeek ? [] : [{ old_str: oldWeek, new_str: newWeek }];
    }
    var out = guarded(text, updates);
    if (!out) return { mode: 'blocked', reason: 'unsafe_guard', updates: [], hashes: hashes, changed: [] };
    return { mode: updates.length ? 'update' : 'noop', updates: out, hashes: hashes, changed: dirty };
  }

  // What the page holds that a careless rewrite could lose.
  function census(text) {
    return {
      emptyTodos: (text.match(/^[ \t]*- \[ \] ?$/gm) || []).length,
      todos: (text.match(/^[ \t]*- \[[ xX]\]/gm) || []).length,
      toggles: count(text, '<toggle'),
      buttons: count(text, '<unknown ')
    };
  }
  function withoutWeek(text, weekStart, marker) {
    var ix = index(text), key = weekKey(weekStart);
    var week = findWeek(ix, key, findAgenda(ix, marker || AGENDA_MARKER)) || findWeek(ix, key, null);
    if (!week) return { text: text, found: false };
    var s = span(ix, week.open, week.close);
    return { text: text.slice(0, s.start) + text.slice(s.end), found: true };
  }
  // After a write: is our week on the page, and is everything outside it still there?
  function verify(before, after, weekStart, marker) {
    var b = withoutWeek(before, weekStart, marker), a = withoutWeek(after, weekStart, marker);
    var cb = census(b.text), ca = census(a.text), lost = {}, damaged = false;
    Object.keys(cb).forEach(function (k) { if (ca[k] < cb[k]) { lost[k] = cb[k] - ca[k]; damaged = true; } });
    return { weekFound: a.found, lostBlocks: lost.buttons || 0, lost: lost, damaged: damaged };
  }

  var api = {
    DAY_NAMES: DAY_NAMES, DAY_COLORS: DAY_COLORS, AGENDA_MARKER: AGENDA_MARKER, EMPTY_TODO: EMPTY_TODO,
    parseISO: parseISO, toISO: toISO, addDays: addDays, weekDates: weekDates, dayCode: dayCode,
    weekKey: weekKey, isoWeekNumber: isoWeekNumber, defaultWeekLabel: defaultWeekLabel,
    esc: esc, toMin: toMin, fmtRange: fmtRange, fmtClock: fmtClock, hash: hash,
    dayLines: dayLines, buildDayBlock: buildDayBlock, buildWeekBlock: buildWeekBlock,
    weekHeaderLine: weekHeaderLine, planSync: planSync, verify: verify, census: census,
    _index: index, _findAgenda: findAgenda, _findWeek: findWeek, _findDays: findDays, _count: count
  };
  root.FTNotion = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
