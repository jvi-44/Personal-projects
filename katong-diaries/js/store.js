/* Katong Diaries — your bucket list, visit log and preferences.
   Saved in this browser straight away, and to your private Claude storage when the page runs as an Artifact
   (data/users/<you>/…, which nobody else can read). */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var LS = 'katong-diaries-v1';
  var S = KD.Store = { log: {}, prefs: {}, status: 'local', listeners: [], db: null, uid: null, col: null, writing: {}, pending: {}, synced: false };

  function emit(what) { S.listeners.forEach(function (f) { try { f(what); } catch (e) { console.error(e); } }); }
  S.on = function (f) { S.listeners.push(f); };
  function saveLocal() { try { localStorage.setItem(LS, JSON.stringify({ log: S.log, prefs: S.prefs })); } catch (e) { /* private mode: keep going in memory */ } }
  function loadLocal() {
    try { var d = JSON.parse(localStorage.getItem(LS) || 'null'); if (d) { S.log = d.log || {}; S.prefs = d.prefs || {}; } } catch (e) { S.log = {}; S.prefs = {}; }
  }
  function clean(e) { return { s: e.s || 0, at: e.at || '', visits: (e.visits || []).map(function (v) { return { id: v.id, d: v.d || '', r: v.r || 0, w: v.w || '', v: v.v || [], n: v.n || '' }; }) }; }

  // one write at a time per document, last value wins
  function push(id) {
    if (!S.col || S.writing[id]) return;
    if (!(id in S.pending)) return;
    var body = S.pending[id]; delete S.pending[id]; S.writing[id] = true;
    var ref = S.col.doc(id), p = body === null ? ref.delete() : ref.set(body);
    p.then(function () { S.writing[id] = false; if (id in S.pending) push(id); },
      function (err) {
        S.writing[id] = false;
        if (err && err.code === 'unavailable') { S.pending[id] = body; setTimeout(function () { push(id); }, 1500 + Math.random() * 1500); return; }
        if (S.status !== 'local') { S.status = 'local'; S.why = (err && err.code) || 'error'; emit('status'); }
      });
  }
  function queue(id, body) { if (!S.col) return; S.pending[id] = body; push(id); }

  S.init = function () {
    loadLocal();
    var c = window.claude;
    if (!c || typeof c.use !== 'function') { S.status = 'local'; return; }
    S.status = 'connecting'; emit('status');
    Promise.all([c.use('db'), c.use('user')]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) { S.status = 'local'; emit('status'); return; }
      return user.id().then(function (uid) {
        if (!uid) { S.status = 'local'; emit('status'); return; }
        S.db = db; S.uid = uid; S.col = db.collection('data/users/' + uid);
        var timer = setTimeout(function () { if (!S.synced) { S.status = 'waiting'; emit('status'); } }, 10000);
        S.col.onSnapshot(function (snap) {
          if (snap.metadata && snap.metadata.fromCache && !S.synced && snap.empty) return;
          var remote = {}, prefs = null;
          snap.docs.forEach(function (d) { var b = d.data(); if (!b) return; if (d.id === '_prefs') prefs = b; else remote[d.id] = clean(b); });
          var first = !S.synced && !(snap.metadata && snap.metadata.fromCache);
          if (first) {      // push anything saved in this browser before the account storage answered
            clearTimeout(timer);
            Object.keys(S.log).forEach(function (id) { if (!remote[id] && (S.log[id].s || (S.log[id].visits || []).length)) { remote[id] = clean(S.log[id]); queue(id, remote[id]); } });
            if (!prefs && Object.keys(S.prefs).length) queue('_prefs', S.prefs);
            S.synced = true;
          }
          // keep local edits that are still on their way out
          Object.keys(S.pending).concat(Object.keys(S.writing).filter(function (k) { return S.writing[k]; })).forEach(function (id) { if (id !== '_prefs' && S.log[id]) remote[id] = S.log[id]; });
          if (S.synced || Object.keys(remote).length) S.log = remote;
          if (prefs && !S.pending._prefs && !S.writing._prefs) { var o = {}; for (var k in S.prefs) o[k] = S.prefs[k]; for (k in prefs) o[k] = prefs[k]; S.prefs = o; }
          S.status = 'synced'; saveLocal(); emit('remote');
        }, function (err) { clearTimeout(timer); S.status = 'local'; S.why = err && err.code; emit('status'); });
      });
    }).catch(function () { S.status = 'local'; emit('status'); });
  };

  function entry(id) { return S.log[id] || (S.log[id] = { s: 0, at: '', visits: [] }); }
  function commit(id) {
    var e = S.log[id];
    if (e && !e.s && !(e.visits && e.visits.length)) { delete S.log[id]; saveLocal(); queue(id, null); }
    else { saveLocal(); queue(id, clean(e)); }
    emit('log');
  }
  S.get = function (id) { return S.log[id] || null; };
  S.state = function (id) { var e = S.log[id]; return e ? e.s || 0 : 0; };
  // 0 = not saved, 1 = want to go, 2 = been
  S.setState = function (id, s) { var e = entry(id); e.s = s; e.at = e.at || new Date().toISOString(); commit(id); };
  S.addVisit = function (id, v) {
    var e = entry(id); v.id = 'v' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    e.visits = (e.visits || []).concat([v]); e.s = 2; e.at = e.at || new Date().toISOString(); commit(id); return v;
  };
  S.updateVisit = function (id, vid, patch) { var e = entry(id); (e.visits || []).forEach(function (v) { if (v.id === vid) for (var k in patch) v[k] = patch[k]; }); commit(id); };
  S.removeVisit = function (id, vid) { var e = entry(id); e.visits = (e.visits || []).filter(function (v) { return v.id !== vid; }); commit(id); };
  S.setPref = function (k, v) { if (S.prefs[k] === v) return; S.prefs[k] = v; saveLocal(); queue('_prefs', S.prefs); };
  S.counts = function () {
    var want = 0, been = 0, visits = 0;
    Object.keys(S.log).forEach(function (id) { var e = S.log[id]; if (e.s === 1) want++; if (e.s === 2) been++; visits += (e.visits || []).length; });
    return { want: want, been: been, visits: visits, total: want + been };
  };
  S.statusText = function () {
    return S.status === 'synced' ? 'Saved to your private Claude storage' : S.status === 'connecting' ? 'Connecting to your storage' :
      S.status === 'waiting' ? 'Storage not reachable yet. Saved in this browser for now' : 'Saved in this browser';
  };
})();
