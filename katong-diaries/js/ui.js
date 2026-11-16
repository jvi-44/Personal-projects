/* Katong Diaries — panels: explore list, place and building cards, bucket list journal, date ideas, malls, search, legend, outfit picker. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var I = function (n, c) { return KD.icon(n, c); };

  var KIND = ['Building', 'Shophouse', 'Terrace house', 'House', 'Apartment block', 'Commercial building', 'Industrial building', 'Shelter or covered walkway', 'Place of worship', 'School or public building', 'Tower', 'Shophouse row'];
  var LORE = {
    'Koon Seng Road': 'Named after Cheong Koon Seng, an auctioneer and developer of the 1920s. The terraces here were built for well-off Peranakan families, which is why every surface is decorated.',
    'Joo Chiat Road': 'Named after Chew Joo Chiat, the landowner known as the King of Katong, whose coconut plantations this road once ran through.',
    'Joo Chiat Place': 'Part of the land once owned by Chew Joo Chiat, the King of Katong.',
    'Joo Chiat Terrace': 'Part of the land once owned by Chew Joo Chiat, the King of Katong.',
    'East Coast Road': 'This really was the coast road. Before the land reclamation of the 1960s and 70s, the sea was just behind the plots on the south side.',
    'Marine Parade Road': 'Everything south of here is reclaimed land. Marine Parade was Singapore\'s first housing estate built entirely on land won from the sea.',
    'Ceylon Road': 'Named for the Ceylonese community who settled here and built the Sri Senpaga Vinayagar Temple.',
    'Tanjong Katong Road': 'Tanjong Katong is usually translated as Turtle Point, after the sea turtles once seen along this shore.',
    'Mountbatten Road': 'Once lined with grand seaside bungalows. A number of them survive as conserved houses.',
    'Still Road': 'Named after Alexander William Still, a former editor of The Straits Times.',
    'Haig Road': 'Named after Field Marshal Douglas Haig.',
    'Dunman Road': 'Named after Thomas Dunman, Singapore\'s first Commissioner of Police.',
    'Tembeling Road': 'Like several streets around here, it takes its name from a river in Malaya.',
    'Geylang Road': 'The name Geylang is often linked to the Malay word kilang, a press or factory, from the coconut and lemongrass mills that once stood here.'
  };
  var WITH = ['Solo', 'Friends', 'Date', 'Family'];
  var VIBES = ['Would return', 'Worth the hype', 'Overhyped', 'Hidden gem', 'Cosy', 'Great photos', 'Pricey', 'Good for studying'];
  var TAGNAME = { solo: 'Good solo', friends: 'With friends', date: 'Date', photo: 'Photogenic', rainy: 'Rainy day', budget: 'Budget', halal: 'Muslim-friendly', pet: 'Pet-friendly', late: 'Open late',
    matcha: 'Matcha', brunch: 'Brunch', coffee: 'Coffee', sweet: 'Sweet tooth', heritage: 'Heritage', sunset: 'Sunset', active: 'Active', 'new': 'New', icon: 'Institution', hidden: 'Hidden', thrift: 'Thrift', craft: 'Hands-on', pilates: 'Pilates' };
  var MCAT = { food: ['Food & drink', '#e0552d'], fashion: ['Fashion', '#2d6de0'], beauty: ['Beauty & health', '#c04bb0'], fit: ['Fitness', '#1a9c88'], fun: ['Fun', '#cf9700'], home: ['Home & lifestyle', '#6f7d92'], kids: ['Kids & learning', '#3b9a49'], svc: ['Services', '#8a8f93'] };

  function UI(app) {
    var self = this, S = KD.Store;
    this.app = app; this.tab = 'explore'; this.catOn = {}; this.hotOnly = true; this.sort = 'near'; this.limit = 80;
    this.bucketFilter = 'all'; this.dateOpen = null; this.card = null; this.mallFloor = 'all'; this.mallFind = '';
    KD.CATS.forEach(function (c) { self.catOn[c.id] = c.id !== 'ess' && c.id !== 'stay'; });
    this.places = app.places; this.byId = app.byId;
    this.places.forEach(function (p) { p.d0 = Math.hypot(p.x, p.z); });
    this.counts = {}; this.hotCounts = {};
    this.places.forEach(function (p) { self.counts[p.c] = (self.counts[p.c] || 0) + 1; if (p.hot) self.hotCounts[p.c] = (self.hotCounts[p.c] || 0) + 1; });
    this._buildSearch();

    // tabs
    ['explore', 'bucket', 'dates', 'malls'].forEach(function (t) { $('t-' + t).addEventListener('click', function () { self.setTab(t); if ($('dock').classList.contains('min')) $('dock').classList.remove('min'); }); });
    $('grip').addEventListener('click', function () { var d = $('dock'); if (d.classList.contains('min')) d.classList.remove('min'); else if (d.classList.contains('max')) { d.classList.remove('max'); d.classList.add('min'); } else d.classList.add('max'); });
    $('pane').addEventListener('click', function (e) { self._paneClick(e); });
    $('pane').addEventListener('change', function (e) {
      if (e.target.id === 'hotOnly') { self.hotOnly = e.target.checked; self.limit = 80; self.applyFilter(); self.render(); }
      if (e.target.id === 'sortSel') { self.sort = e.target.value; self.render(); }
    });
    $('cardBody').addEventListener('click', function (e) { self._cardClick(e); });
    $('cardBody').addEventListener('submit', function (e) { e.preventDefault(); self._saveVisit(e.target); });
    $('cardBody').addEventListener('input', function (e) { if (e.target.id === 'mallFind') { self.mallFind = e.target.value; self._renderStores(); } });
    // modes + tools
    $('m-map').addEventListener('click', function () { app.setMode('map'); });
    $('m-stroll').addEventListener('click', function () { app.setMode('stroll'); });
    $('m-pov').addEventListener('click', function () { app.setMode('pov'); });
    $('w-exit').addEventListener('click', function () { app.setMode('map'); });
    $('w-run').addEventListener('click', function () { app.controls.run = !app.controls.run; this.setAttribute('aria-pressed', app.controls.run); });
    $('z-in').addEventListener('click', function () { app.controls.g.dist = Math.max(45, app.controls.g.dist * 0.6); });
    $('z-out').addEventListener('click', function () { app.controls.g.dist = Math.min(9500, app.controls.g.dist * 1.6); });
    $('z-north').addEventListener('click', function () { var c = app.controls; c.g.yaw = Math.round(c.g.yaw / (Math.PI * 2)) * Math.PI * 2; });
    $('z-home').addEventListener('click', function () { app.controls.flyTo(0, 0, 420, undefined, 0.8); self.openPlace(self.byId['starbucks-katong-square'], true); });
    $('b-tod').addEventListener('click', function () { app.cycleTod(); });
    $('b-fit').addEventListener('click', function () { self.openFit(); });
    $('b-legend').addEventListener('click', function (e) { e.stopPropagation(); self.toggleLegend(); });
    document.addEventListener('click', function (e) { if (!$('legend').hidden && !$('legend').contains(e.target)) self.toggleLegend(false); if (!$('results').hidden && !e.target.closest('.search')) $('results').hidden = true; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (!$('fit').hidden) self.closeFit(); else if (!$('welcome').hidden) self.closeWelcome(); else if (!$('legend').hidden) self.toggleLegend(false); else if (self.card) self.closeCard(); }
    });
    // search
    var q = $('q');
    q.addEventListener('input', function () { self._search(q.value); });
    q.addEventListener('focus', function () { if (q.value) self._search(q.value); });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var b = $('results').querySelector('button'); if (b) b.click(); } });
    $('results').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; self._pickResult(+b.dataset.k); });

    S.on(function (what) { self._storeChanged(what); });
    this._legend(); this.applyFilter(); this.render(); this._bucketBadge();
  }

  /* ------------------------------------------------ helpers */
  UI.prototype.dist = function (p) {
    var f = this.sort === 'me' ? this.app.controls.focus() : { x: 0, z: 0 };
    return Math.hypot(p.x - f.x, p.z - f.z);
  };
  function fmtDist(d) { return d < 950 ? Math.round(d / 10) * 10 + ' m' : (d / 1000).toFixed(1) + ' km'; }
  function walkMin(d) { return Math.max(1, Math.round(d * 1.3 / 78)); }
  function price(p) { return p ? '$$$$'.slice(0, p) : ''; }
  function hearts(n, big) { var s = '<span class="hearts">'; for (var i = 1; i <= 5; i++) s += I('heart', i <= n ? 'f' : 'off'); return s + '</span>'; }
  function fmtDate(d) { if (!d) return ''; var t = new Date(d + 'T12:00:00'); if (isNaN(t)) return d; return t.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function today() { var t = new Date(); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
  UI.prototype.autoBlurb = function (p) {
    var st = p.st ? ' on ' + p.st : '', sub = p.s || '', c = p.c, t;
    if (p.in) st = ' in ' + p.in;
    if (c === 'cafe') t = (sub && sub !== 'Café' ? sub + ' café' : 'A café') + st + '.';
    else if (c === 'eat') t = (sub && sub !== 'Restaurant' ? sub + ' spot' : 'A place to eat') + st + '.';
    else if (c === 'mrt') t = 'MRT station on the ' + sub.replace(/EWL/, 'East-West Line').replace(/CCL/, 'Circle Line').replace(/TEL/, 'Thomson-East Coast Line').replace(/DTL/, 'Downtown Line').replace(/NEL/, 'North East Line').replace(' · ', ' and ') + '.';
    else t = (sub || KD.CAT[c].name) + st + '.';
    return t;
  };
  UI.prototype.toast = function (msg) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(this._tt); this._tt = setTimeout(function () { t.classList.remove('on'); }, 2600); };

  /* ------------------------------------------------ dock */
  UI.prototype.setTab = function (t) {
    this.tab = t; ['explore', 'bucket', 'dates', 'malls'].forEach(function (k) { $('t-' + k).setAttribute('aria-selected', k === t); });
    if (t !== 'dates') this.dateOpen = null;
    this.render(); $('pane').scrollTop = 0;
  };
  UI.prototype.applyFilter = function () {
    var self = this, arr = KD.CATS.map(function (c) { return self.catOn[c.id] ? 1 : 0; });
    this.app.markers.setFilter(arr, this.hotOnly);
  };
  UI.prototype.filtered = function () {
    var self = this, out = this.places.filter(function (p) { return self.catOn[p.c] && (!self.hotOnly || p.hot); });
    if (this.sort === 'az') out.sort(function (a, b) { return a.n.localeCompare(b.n); });
    else { out.forEach(function (p) { p._d = self.dist(p); }); out.sort(function (a, b) { return (b.hot || 0) - (a.hot || 0) || a._d - b._d; }); if (this.sort !== 'az') out.sort(function (a, b) { return a._d - b._d; }); }
    return out;
  };
  UI.prototype.itemRow = function (p, extra) {
    var s = KD.Store.state(p.id), d = this.dist(p);
    return '<button class="item' + (this.card && this.card.place === p ? ' on' : '') + '" data-act="open" data-id="' + esc(p.id) + '">' + KD.badge(p.c) +
      '<span><b>' + esc(p.n) + '</b><small>' + esc(extra || [p.s, p.in || p.st].filter(Boolean).join(' · ')) + '</small></span>' +
      '<span class="st">' + (s === 2 ? '<span class="been">' + I('check') + '</span>' : s === 1 ? '<span class="saved">' + I('heart', 'f') + '</span>' : '') + fmtDist(d) + '</span></button>';
  };
  UI.prototype.render = function () {
    var p = $('pane'), self = this, h = '';
    if (this.tab === 'explore') {
      var list = this.filtered();
      h += '<h3 class="kick">What are you looking for?</h3><div class="chips">';
      KD.CATS.forEach(function (c) {
        var n = self.hotOnly ? (self.hotCounts[c.id] || 0) : (self.counts[c.id] || 0);
        h += '<button class="chip" data-act="cat" data-id="' + c.id + '" aria-pressed="' + !!self.catOn[c.id] + '" style="--c:' + c.color + '"><span class="dot">' + I(c.icon) + '</span>' + esc(c.name) + '<em>' + n + '</em></button>';
      });
      h += '</div><div class="row2"><label class="switch"><input type="checkbox" id="hotOnly"' + (this.hotOnly ? ' checked' : '') + '>Hand-picked only</label>' +
        '<select class="mini" id="sortSel" aria-label="Sort"><option value="near"' + (this.sort === 'near' ? ' selected' : '') + '>Nearest the Starbucks</option><option value="me"' + (this.sort === 'me' ? ' selected' : '') + '>Nearest me</option><option value="az"' + (this.sort === 'az' ? ' selected' : '') + '>A to Z</option></select></div>';
      h += '<h3 class="kick">' + list.length.toLocaleString() + (this.hotOnly ? ' hand-picked places' : ' places') + '</h3><div class="list">';
      list.slice(0, this.limit).forEach(function (pl) { h += self.itemRow(pl); });
      h += '</div>';
      if (list.length > this.limit) h += '<button class="more" data-act="more">Show ' + Math.min(120, list.length - this.limit) + ' more</button>';
      if (!list.length) h += '<div class="empty"><b>Nothing switched on</b>Turn on a category above to see places.</div>';
      if (this.hotOnly) h += '<p class="note">Hand-picked places come from 2026 guides. Switch the toggle off to see all ' + this.places.length.toLocaleString() + ' places mapped within 5 km.</p>';
    } else if (this.tab === 'bucket') h = this._bucketHtml();
    else if (this.tab === 'dates') h = this.dateOpen ? this._dateHtml(this.dateOpen) : this._datesHtml();
    else h = this._mallsHtml();
    p.innerHTML = h;
  };
  UI.prototype._paneClick = function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, id = b.dataset.id, self = this, S = KD.Store;
    if (act === 'open') { var pl = this.byId[id]; if (pl) this.openPlace(pl, true); }
    else if (act === 'cat') { this.catOn[id] = !this.catOn[id]; this.limit = 80; this.applyFilter(); this.render(); }
    else if (act === 'more') { this.limit += 120; this.render(); }
    else if (act === 'bf') { this.bucketFilter = id; this.render(); }
    else if (act === 'date') { this.dateOpen = this.app.dates.filter(function (d) { return d.id === id; })[0]; this.render(); $('pane').scrollTop = 0; this.app.showRoute(this.dateOpen); }
    else if (act === 'dback') { this.dateOpen = null; this.app.showRoute(null); this.render(); }
    else if (act === 'dplay') this.app.playTour(this.dateOpen);
    else if (act === 'dsave') { var n = 0; this.dateOpen.stops.forEach(function (s) { if (!S.state(s.id)) { S.setState(s.id, 1); n++; } }); this.toast(n ? n + ' stops added to your bucket list' : 'Already on your bucket list'); }
    else if (act === 'dfit') { this.app.setOutfit({ outfit: this.dateOpen.outfit }); this.toast('Outfit changed: ' + (KD.OUTFITS.filter(function (o) { return o.id === self.dateOpen.outfit; })[0] || {}).name); }
    else if (act === 'toexplore') this.setTab('explore');
  };

  /* ------------------------------------------------ bucket list + journal */
  UI.prototype._bucketBadge = function () { var c = KD.Store.counts(); $('n-bucket').textContent = c.total ? c.total : ''; };
  UI.prototype._bucketHtml = function () {
    var S = KD.Store, c = S.counts(), self = this, h = '', pct = c.total ? c.been / c.total : 0, C = 2 * Math.PI * 26;
    h += '<div class="stats"><svg class="ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/><text x="32" y="37">' + c.been + '/' + c.total + '</text></svg>' +
      '<div><b>' + (c.total ? (c.been ? c.been + ' down, ' + c.want + ' to go' : c.want + ' places to go') : 'Your Katong list') + '</b><small>' + (c.visits ? c.visits + (c.visits === 1 ? ' visit' : ' visits') + ' logged' : 'Save places, then log each visit') + '</small></div></div>';
    h += '<div class="sync' + (S.status === 'synced' ? '' : ' local') + '"><i></i>' + esc(S.statusText()) + '</div>';
    if (!c.total) {
      h += '<div class="empty"><b>Nothing saved yet</b>Open any place and tap <strong>Want to go</strong>. It will show up here, and you can log the date and what you thought once you have been.<br><br><button class="btn sm" data-act="toexplore">Browse hand-picked places</button></div>';
      return h;
    }
    h += '<div class="chips" style="margin-top:12px">' + [['all', 'All ' + c.total], ['want', 'Want to go ' + c.want], ['been', 'Been ' + c.been]].map(function (f) {
      return '<button class="chip plain" data-act="bf" data-id="' + f[0] + '" aria-pressed="' + (self.bucketFilter === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div><div class="list">';
    var ids = Object.keys(S.log).filter(function (id) { var e = S.log[id]; return self.byId[id] && e.s && (self.bucketFilter === 'all' || (self.bucketFilter === 'want' ? e.s === 1 : e.s === 2)); });
    ids.sort(function (a, b) { return (S.log[a].s - S.log[b].s) || self.byId[a].n.localeCompare(self.byId[b].n); });
    ids.forEach(function (id) { var pl = self.byId[id], e = S.log[id], v = (e.visits || []).length; h += self.itemRow(pl, e.s === 2 ? (v ? v + (v === 1 ? ' visit' : ' visits') + ' logged' : 'Been. Add when and what you thought') : [pl.s, pl.st].filter(Boolean).join(' · ')); });
    h += '</div>';
    var visits = [];
    Object.keys(S.log).forEach(function (id) { if (self.byId[id]) (S.log[id].visits || []).forEach(function (v) { visits.push({ p: self.byId[id], v: v }); }); });
    if (visits.length) {
      visits.sort(function (a, b) { return (b.v.d || '').localeCompare(a.v.d || ''); });
      h += '<h3 class="kick">Journal</h3>';
      visits.forEach(function (x) { h += '<div class="entry"><header><b><button data-act="open" data-id="' + esc(x.p.id) + '">' + esc(x.p.n) + '</button></b><time>' + esc(fmtDate(x.v.d)) + '</time></header>' +
        (x.v.r ? hearts(x.v.r) + ' ' : '') + '<small style="color:var(--ink-2)">' + esc([x.v.w].concat(x.v.v || []).filter(Boolean).join(' · ')) + '</small>' + (x.v.n ? '<p>' + esc(x.v.n) + '</p>' : '') + '</div>'; });
    }
    return h;
  };

  /* ------------------------------------------------ date ideas */
  UI.prototype._datesHtml = function () {
    var h = '<h3 class="kick">Solo and friend dates, by mood</h3>';
    this.app.dates.forEach(function (d) {
      h += '<button class="date" data-act="date" data-id="' + d.id + '"><b>' + esc(d.title) + '</b><div class="meta"><span>' + esc(d.who) + '</span><span>' + esc(d.when) + '</span><span>' + d.stops.length + ' stops</span></div><p>' + esc(d.vibe) + '</p></button>';
    });
    return h + '<p class="note">Times and budgets are rough guides. Check opening hours before you set out.</p>';
  };
  UI.prototype._dateHtml = function (d) {
    var self = this, h = '<button class="back" data-act="dback">' + I('chevL') + 'All date ideas</button><div class="date" style="cursor:default"><b>' + esc(d.title) + '</b><div class="meta"><span>' + esc(d.who) + '</span><span>' + esc(d.time) + '</span><span>' + esc(d.budget) + '</span></div><p>' + esc(d.blurb) + '</p></div>';
    h += '<div class="acts"><button class="btn pri" data-act="dplay">' + I('play') + 'Play the route</button><button class="btn" data-act="dsave">' + I('heart') + 'Save all stops</button>' +
      (d.outfit ? '<button class="btn wide" data-act="dfit">' + I('hanger') + 'Wear the ' + esc((KD.OUTFITS.filter(function (o) { return o.id === d.outfit; })[0] || {}).name || 'matching') + ' look</button>' : '') + '</div>';
    h += '<ol class="steps">';
    d.stops.forEach(function (s) { var p = self.byId[s.id]; if (!p) return; var st = KD.Store.state(p.id);
      h += '<li><time>' + esc(s.t) + '</time><span class="node"></span><span><button data-act="open" data-id="' + esc(p.id) + '">' + esc(p.n) + (st === 2 ? ' ' + I('check') : '') + '</button><small>' + esc(s.note) + '</small></span></li>'; });
    return h + '</ol><p class="note">' + esc(d.when) + '. Budget is a rough guide per person.</p>';
  };

  /* ------------------------------------------------ malls */
  UI.prototype._mallsHtml = function () {
    var self = this, malls = this.places.filter(function (p) { return p.c === 'mall'; }).sort(function (a, b) { return (b.hot || 0) - (a.hot || 0) || a.d0 - b.d0; });
    var h = '<h3 class="kick">Malls, with store directories</h3><div class="list">';
    malls.forEach(function (m) { var dir = m.mall && self.app.malls[m.mall], n = dir ? dir.floors.reduce(function (a, f) { return a + f[1].length; }, 0) : 0; h += self.itemRow(m, (n ? n + ' stores listed' : m.s || 'Mall') + (m.st ? ' · ' + m.st : '')); });
    return h + '</div><p class="note">Open a mall to browse it floor by floor. Search for a brand, like lululemon or UNIQLO, in the box at the top.</p>';
  };
  UI.prototype._renderStores = function () {
    var box = $('stores'); if (!box || !this.card || !this.card.place) return;
    var m = this.card.place, dir = this.app.malls[m.mall], f = this.mallFloor, q = this.mallFind.trim().toLowerCase(), h = '', n = 0, self = this;
    dir.floors.forEach(function (fl) {
      if (f !== 'all' && fl[0] !== f) return;
      fl[1].forEach(function (s) {
        if (q && s[0].toLowerCase().indexOf(q) < 0) return; n++;
        var mc = MCAT[s[2]] || MCAT.svc, nm = s[3] && self.byId[s[3]] ? '<button data-act="open" data-id="' + esc(s[3]) + '"><b>' + esc(s[0]) + '</b></button>' : '<b>' + esc(s[0]) + '</b>';
        h += '<div class="store"><span><i style="--c:' + mc[1] + '" title="' + mc[0] + '"></i>' + nm + '</span><span>' + esc(s[1] || (fl[0] === '?' ? '' : fl[0])) + '</span></div>';
      });
    });
    box.innerHTML = h || '<p class="note">No store matches that.</p>';
  };

  /* ------------------------------------------------ place card */
  UI.prototype.openPlace = function (p, fly) {
    if (!p) return;
    this.card = { place: p }; this.mallFloor = 'all'; this.mallFind = ''; this.app.selectPlace(p, fly);
    this._placeHtml(); $('card').hidden = false; $('cardBody').scrollTop = 0;
    if (window.innerWidth <= 820) $('dock').classList.add('min');
    if (this.tab === 'explore' || this.tab === 'bucket' || this.tab === 'malls') this._markActive();
  };
  UI.prototype._markActive = function () {
    var id = this.card && this.card.place ? this.card.place.id : null;
    $('pane').querySelectorAll('.item').forEach(function (el) { el.classList.toggle('on', el.dataset.id === id); });
  };
  UI.prototype._placeHtml = function () {
    var p = this.card.place, S = KD.Store, c = KD.CAT[p.c] || KD.CAT.shop, st = S.state(p.id), e = S.get(p.id), o = this.app.world.W.origin, self = this;
    var lat = o.lat + (-p.z) / o.ky, lon = o.lon + p.x / o.kx, addr = p.a || (p.st ? 'Near ' + p.st : '');
    var h = '<header class="h"><span><span class="tag" style="--c:' + c.color + '"><span class="dot">' + I(c.icon) + '</span>' + esc(c.name) + '</span>' + (p.hot ? ' <span class="tag feat">Hand-picked</span>' : '') + '</span><button class="x" data-act="close" aria-label="Close">' + I('x') + '</button></header>';
    h += '<h2>' + esc(p.n) + '</h2><div class="sub"><span>' + esc(p.s || '') + '</span>' + (p.p ? '<span class="p">' + price(p.p) + '</span>' : '') + '<span>' + fmtDist(p.d0) + ' from the Starbucks · ' + walkMin(p.d0) + ' min walk</span></div>';
    h += '<p class="blurb">' + esc(p.b || this.autoBlurb(p)) + '</p>';
    if (!p.hot) h += '<p class="note">From OpenStreetMap and not checked by hand, so confirm it is still open. After you visit, log it and add your own notes.</p>';
    if (p.tip) h += '<div class="tip"><b>Insider tip</b>' + esc(p.tip) + '</div>';
    h += '<dl class="info">' + (addr ? '<dt>' + I('pin') + '</dt><dd>' + esc(addr) + '</dd>' : '') + ((p.hrs || p.oh) ? '<dt>' + I('clock') + '</dt><dd>' + esc(p.hrs || p.oh) + '</dd>' : '') + '</dl>';
    if (p.t && p.t.length) h += '<div class="tags">' + p.t.map(function (t) { return '<span>' + esc(TAGNAME[t] || t) + '</span>'; }).join('') + (p.halal && p.t.indexOf('halal') < 0 ? '<span>Halal</span>' : '') + '</div>';
    h += '<div class="acts"><button class="btn' + (st === 1 ? ' on' : '') + '" data-act="want">' + I('heart', st === 1 ? 'f' : '') + (st === 1 ? 'On your list' : 'Want to go') + '</button>' +
      '<button class="btn jade' + (st === 2 ? ' on' : '') + '" data-act="been">' + I('check') + (st === 2 ? 'Been here' : 'I\'ve been') + '</button>' +
      '<button class="btn" data-act="walk">' + I('walk') + 'Stroll here</button><button class="btn" data-act="pov">' + I('eye') + 'Street view</button></div>';
    h += '<div class="links"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.n + ' ' + (p.a || '') + ' Singapore') + '">Google Maps ' + I('ext') + '</a>' +
      '<a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + lat.toFixed(6) + ',' + lon.toFixed(6) + '">Real Street View ' + I('ext') + '</a>' +
      (p.w && /^https?:\/\//.test(p.w) ? '<a target="_blank" rel="noopener" href="' + esc(p.w) + '">Website ' + I('ext') + '</a>' : '') + '</div>';
    // mall directory
    var dir = p.mall && this.app.malls[p.mall];
    if (dir) {
      var total = dir.floors.reduce(function (a, f) { return a + f[1].length; }, 0);
      h += '<div class="sec"><h4>Inside ' + esc(p.n) + '</h4><input class="find" id="mallFind" type="search" placeholder="Find a store among ' + total + '" aria-label="Find a store"><div class="floors"><button class="chip plain" data-act="floor" data-id="all" aria-pressed="true">All</button>' +
        dir.floors.filter(function (f) { return f[0] !== '?'; }).map(function (f) { return '<button class="chip plain" data-act="floor" data-id="' + f[0] + '" aria-pressed="false">' + f[0] + '</button>'; }).join('') + '</div><div id="stores"></div><p class="note">' + esc(dir.src) + '. Shops change often.</p></div>';
    }
    // visit log
    h += '<div class="sec"><h4>' + (e && e.visits && e.visits.length ? 'Your visits' : 'Been here?') + '</h4><div id="visits">' + this._visitsHtml(p) + '</div>' + this._formHtml() + '</div>';
    if (p.src && p.src.length) h += '<div class="sec src"><b>Featured in</b> ' + p.src.map(function (k) { var s = self.app.sources[k]; return s ? '<a target="_blank" rel="noopener" href="' + esc(s[1]) + '">' + esc(s[0]) + '</a>' : ''; }).filter(Boolean).join(' · ') + '</div>';
    h += '<p class="note">Details change. Check hours before you go.</p>';
    $('cardBody').innerHTML = h;
    if (dir) this._renderStores();
  };
  UI.prototype._visitsHtml = function (p) {
    var e = KD.Store.get(p.id), h = '';
    if (!e || !e.visits || !e.visits.length) return '<p class="note" style="margin-top:0">Log the day you went and a line about how it was. It all lands in your journal.</p>';
    e.visits.slice().sort(function (a, b) { return (b.d || '').localeCompare(a.d || ''); }).forEach(function (v) {
      h += '<div class="entry"><header><b>' + (v.r ? hearts(v.r) : 'Visit') + '</b><time>' + esc(fmtDate(v.d)) + '</time></header><small style="color:var(--ink-2)">' + esc([v.w].concat(v.v || []).filter(Boolean).join(' · ')) + '</small>' +
        (v.n ? '<p>' + esc(v.n) + '</p>' : '') + '<div style="margin-top:6px"><button class="btn sm" data-act="delv" data-id="' + esc(v.id) + '">' + I('trash') + 'Remove</button></div></div>';
    });
    return h;
  };
  UI.prototype._formHtml = function () {
    var h = '<form class="log" id="logForm" style="margin-top:10px"><label>When did you go?<input type="date" id="logDate" name="d" value="' + today() + '" max="' + today() + '" required></label>' +
      '<div><label for="logDate" style="margin-bottom:4px">How was it?</label><div class="rate" id="rate" data-v="0">';
    for (var i = 1; i <= 5; i++) h += '<button type="button" data-act="rate" data-id="' + i + '" aria-label="' + i + ' out of 5">' + I('heart') + '</button>';
    h += '</div></div><div><label style="margin-bottom:4px">Who with?</label><div class="chips" id="withChips">' + WITH.map(function (w, k) { return '<button type="button" class="chip plain" data-act="with" data-id="' + w + '" aria-pressed="' + (k === 0) + '">' + w + '</button>'; }).join('') + '</div></div>' +
      '<div><label style="margin-bottom:4px">The vibe</label><div class="chips" id="vibeChips">' + VIBES.map(function (w) { return '<button type="button" class="chip plain" data-act="vibe" data-id="' + w + '" aria-pressed="false">' + w + '</button>'; }).join('') + '</div></div>' +
      '<label>Reflection<textarea id="logNote" name="n" maxlength="2000" placeholder="What did you order? Who were you with? What would you tell a friend?"></textarea></label>' +
      '<button class="btn pri" type="submit">' + I('book') + 'Save to my journal</button></form>';
    return h;
  };
  UI.prototype._saveVisit = function (form) {
    if (!form || form.id !== 'logForm' || !this.card || !this.card.place) return;
    var p = this.card.place, d = $('logDate').value || today(), r = +($('rate').dataset.v || 0), w = '', v = [];
    $('withChips').querySelectorAll('[aria-pressed="true"]').forEach(function (b) { w = b.dataset.id; });
    $('vibeChips').querySelectorAll('[aria-pressed="true"]').forEach(function (b) { v.push(b.dataset.id); });
    KD.Store.addVisit(p.id, { d: d, r: r, w: w, v: v, n: $('logNote').value.trim() });
    this.toast('Saved to your journal'); this._placeHtml(); this.app.syncPins();
  };
  UI.prototype._cardClick = function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, id = b.dataset.id, S = KD.Store, p = this.card && this.card.place, self = this;
    if (act === 'close') return this.closeCard();
    if (act === 'open') { var pl = this.byId[id]; if (pl) this.openPlace(pl, true); return; }
    if (act === 'bwalk' || act === 'bpov') { var bd = this.card.building; this.app.goWalk(bd.cx, bd.cz, act === 'bpov' ? 'pov' : 'stroll'); return; }
    if (!p) return;
    if (act === 'want') { S.setState(p.id, S.state(p.id) === 1 ? 0 : 1); this.toast(S.state(p.id) === 1 ? 'Added to your bucket list' : 'Removed from your list'); this._placeHtml(); }
    else if (act === 'been') { S.setState(p.id, S.state(p.id) === 2 ? ((S.get(p.id) || {}).visits || []).length ? 2 : 0 : 2); this.toast(S.state(p.id) === 2 ? 'Marked as visited. Add the date and a note below' : 'Unmarked'); this._placeHtml(); }
    else if (act === 'walk') this.app.goWalk(p.x, p.z, 'stroll', p);
    else if (act === 'pov') this.app.goWalk(p.x, p.z, 'pov', p);
    else if (act === 'floor') { this.mallFloor = id; $('cardBody').querySelectorAll('[data-act="floor"]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.id === id); }); this._renderStores(); }
    else if (act === 'rate') { $('rate').dataset.v = id; $('rate').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', +x.dataset.id <= +id); }); }
    else if (act === 'with') { $('withChips').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }
    else if (act === 'vibe') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    else if (act === 'delv') { if (b.dataset.sure) { S.removeVisit(p.id, id); this.toast('Visit removed'); this._placeHtml(); } else { b.dataset.sure = 1; b.innerHTML = I('trash') + 'Tap again to remove'; } }
    this.app.syncPins();
  };
  UI.prototype.closeCard = function () { this.card = null; $('card').hidden = true; this.app.selectPlace(null); this.app.world.highlight(null); this._markActive(); };

  /* ------------------------------------------------ building card */
  UI.prototype.openBuilding = function (b) {
    var W = this.app.world.W, name = W.nm[b.nm] || '', hn = W.hn[b.hn] || '', st = W.st[b.st] || '', self = this;
    if (!st) { var nr = this.app.world.nearestRoad(b.cx, b.cz, 80, function (r) { return r.name && r.cls <= 13; }); if (nr) st = W.names[nr.road.name]; }
    var inside = this.places.filter(function (p) { return p.bi === b.id; });
    var kind = KIND[b.kind] || 'Building', lv = b.lv, hgt = Math.round(b.h);
    if (b.kind === 8) kind = ['Place of worship', 'Mosque', 'Hindu temple', 'Chinese temple', 'Church', 'Gurdwara'][b.rel] || kind;
    if (b.kind === 4) kind = (W.bt[b.bt] === 'apartments' || name) ? 'Apartment block' : 'Housing block';
    var title = name || (hn && st ? hn + ' ' + st : (W.hn[b.hn] ? 'Block ' + hn : kind + (st ? ' on ' + st : '')));
    var fact = {
      1: 'A ' + (lv === 3 ? 'three' : 'two') + '-storey shophouse. The covered walkway out front is a five-foot way, required since Raffles\' 1822 town plan so people could walk out of the sun and rain.',
      11: 'A row of shophouses behind one continuous five-foot way. Each bay is about five to six metres wide, the span of a timber beam.',
      2: 'A terrace house in a row that shares party walls. Rows like this are what keep Katong low and walkable.',
      3: 'A landed house. In land-scarce Singapore, living this close to the ground is rare.',
      4: 'About ' + lv + ' storeys of homes. More than three in four Singaporeans live in public housing blocks.',
      5: 'A commercial building, about ' + lv + ' storeys.', 6: 'An industrial or utility building.',
      7: 'A shelter or covered link. Singapore joins bus stops, MRT exits and blocks with these so you can walk through a downpour.',
      8: 'A place of worship. Dress modestly if you step inside.', 9: 'A school or public building.',
      10: 'A tower of about ' + lv + ' storeys, roughly ' + hgt + ' m tall.', 0: 'A building of about ' + lv + ' storeys.'
    }[b.kind] || '';
    this.card = { building: b }; this.app.selectPlace(null); this.app.world.highlight(b);
    var h = '<header class="h"><span class="tag" style="--c:#51625f"><span class="dot">' + I('mall') + '</span>' + esc(kind) + '</span><button class="x" data-act="close" aria-label="Close">' + I('x') + '</button></header>';
    h += '<h2>' + esc(title) + '</h2><div class="sub"><span>' + (b.kind === 7 ? 'Shelter' : lv + (lv === 1 ? ' storey' : ' storeys') + ' · about ' + hgt + ' m') + '</span>' + (st ? '<span>' + esc(st) + '</span>' : '') + '</div>';
    h += '<p class="blurb">' + esc(fact) + '</p>';
    if (LORE[st]) h += '<div class="tip"><b>About ' + esc(st) + '</b>' + esc(LORE[st]) + '</div>';
    if (inside.length) { h += '<div class="sec"><h4>What\'s inside</h4><div class="list">'; inside.sort(function (a, c) { return (c.hot || 0) - (a.hot || 0); }).slice(0, 40).forEach(function (p) { h += self.itemRow(p); }); h += '</div></div>'; }
    else h += '<p class="note">No listed places inside. Know one? Search for it above.</p>';
    var o = W.origin, lat = o.lat + (-b.cz) / o.ky, lon = o.lon + b.cx / o.kx;
    h += '<div class="acts"><button class="btn" data-act="bwalk">' + I('walk') + 'Stroll here</button><button class="btn" data-act="bpov">' + I('eye') + 'Street view</button></div>';
    h += '<div class="links"><a target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + lat.toFixed(6) + ',' + lon.toFixed(6) + '">Real Street View ' + I('ext') + '</a></div>';
    h += '<p class="note">Shape, storeys and height come from OpenStreetMap. Facades are illustrated, not photographed.</p>';
    $('cardBody').innerHTML = h; $('card').hidden = false; $('cardBody').scrollTop = 0;
    if (window.innerWidth <= 820) $('dock').classList.add('min');
  };

  /* ------------------------------------------------ search */
  UI.prototype._buildSearch = function () {
    var idx = this.sidx = [], self = this, W = this.app.world.W, malls = this.app.malls;
    this.places.forEach(function (p) { idx.push({ t: (p.n + ' ' + (p.s || '') + ' ' + (p.st || '') + ' ' + (p.in || '') + ' ' + (p.t || []).join(' ')).toLowerCase(), n: p.n.toLowerCase(), k: 0, p: p }); });
    var mallPlace = {}; this.places.forEach(function (p) { if (p.mall) mallPlace[p.mall] = p; });
    Object.keys(malls).forEach(function (mid) { var mp = mallPlace[mid]; if (!mp) return; malls[mid].floors.forEach(function (f) { f[1].forEach(function (s) { if (s[3]) return; idx.push({ t: (s[0] + ' ' + malls[mid].name).toLowerCase(), n: s[0].toLowerCase(), k: 1, s: s, m: mp, fl: f[0] }); }); }); });
    var seen = {};
    W.roads.forEach(function (r) { if (!r.name || r.cls > 14) return; var nm = W.names[r.name]; var e = seen[nm] || (seen[nm] = { len: 0, best: 0 }); var p = r.pts, L = 0; for (var i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); e.len += L; if (L > e.best) { e.best = L; var m = Math.floor(p.length / 4) * 2; e.x = p[m]; e.z = p[m + 1]; } });
    this.streets = [];
    Object.keys(seen).forEach(function (nm) { idx.push({ t: nm.toLowerCase(), n: nm.toLowerCase(), k: 2, name: nm, x: seen[nm].x, z: seen[nm].z }); self.streets.push({ name: nm, x: seen[nm].x, z: seen[nm].z, len: seen[nm].len }); });
  };
  UI.prototype._search = function (q) {
    var box = $('results'); q = q.trim().toLowerCase();
    if (q.length < 2) { box.hidden = true; return; }
    var toks = q.split(/\s+/), res = [];
    for (var i = 0; i < this.sidx.length; i++) {
      var e = this.sidx[i], ok = true; for (var k = 0; k < toks.length; k++) if (e.t.indexOf(toks[k]) < 0) { ok = false; break; }
      if (!ok) continue;
      var sc = (e.n.indexOf(q) === 0 ? 100 : e.n.indexOf(q) >= 0 ? 60 : 20) + (e.p && e.p.hot ? 30 : 0) + (e.k === 1 ? 10 : 0) - (e.p ? e.p.d0 / 400 : e.m ? e.m.d0 / 400 : 2);
      res.push([sc, e]);
    }
    res.sort(function (a, b) { return b[0] - a[0]; }); res = res.slice(0, 12); this._res = res;
    if (!res.length) { box.innerHTML = '<div class="note" style="padding:10px">Nothing matches. Try a street, a cuisine or a brand.</div>'; box.hidden = false; return; }
    box.innerHTML = res.map(function (r, k) {
      var e = r[1];
      if (e.k === 0) return '<button data-k="' + k + '">' + KD.badge(e.p.c) + '<span><b>' + esc(e.p.n) + '</b><small>' + esc([e.p.s, e.p.in || e.p.st].filter(Boolean).join(' · ')) + '</small></span></button>';
      if (e.k === 1) return '<button data-k="' + k + '">' + KD.badge('mall') + '<span><b>' + esc(e.s[0]) + '</b><small>' + esc(e.m.n + (e.s[1] ? ' · ' + e.s[1] : '')) + '</small></span></button>';
      return '<button data-k="' + k + '"><span class="badge" style="--c:#51625f">' + I('route') + '</span><span><b>' + esc(e.name) + '</b><small>Street</small></span></button>';
    }).join('');
    box.hidden = false;
  };
  UI.prototype._pickResult = function (k) {
    var e = this._res[k][1]; $('results').hidden = true; $('q').blur();
    if (e.k === 0) this.openPlace(e.p, true);
    else if (e.k === 1) { this.openPlace(e.m, true); this.mallFind = e.s[0]; var f = $('mallFind'); if (f) f.value = e.s[0]; this._renderStores(); this.toast(e.s[0] + ' is in ' + e.m.n + (e.s[1] ? ', ' + e.s[1] : '')); }
    else { if (this.app.controls.mode === 'map') this.app.controls.flyTo(e.x, e.z, 380); else this.app.goWalk(e.x, e.z, this.app.controls.mode); this.toast(e.name); }
  };

  /* ------------------------------------------------ legend, welcome, outfit */
  UI.prototype._legend = function () {
    var h = '<h3 class="kick">Pins</h3><ul>' + KD.CATS.map(function (c) { return '<li>' + KD.badge(c.id) + esc(c.name) + '</li>'; }).join('') + '</ul>';
    h += '<h3 class="kick">Your marks</h3><ul><li><span class="ringx" style="--c:#ee3f80"></span>Want to go</li><li><span class="ringx" style="--c:#1c9e75"></span>Been</li><li style="grid-column:1/-1">Bigger pins are hand-picked. Smaller pins come from OpenStreetMap.</li></ul>';
    h += '<h3 class="kick">Buildings</h3><ul><li><span class="sq" style="--c:#f6c4d0"></span>Shophouses</li><li><span class="sq" style="--c:#c0623f"></span>Terraces & houses</li><li><span class="sq" style="--c:#f2ede2"></span>Flats</li><li><span class="sq" style="--c:#7fa4b8"></span>Offices & hotels</li><li><span class="sq" style="--c:#a9cf8f"></span>Parks</li><li><span class="sq" style="--c:#ead9ab"></span>Beach</li></ul>';
    $('legend').innerHTML = h;
  };
  UI.prototype.toggleLegend = function (on) { var l = $('legend'); if (on === undefined) on = l.hidden; l.hidden = !on; $('b-legend').setAttribute('aria-expanded', on); };
  UI.prototype.openWelcome = function () {
    var self = this, n = this.places.length, hot = this.places.filter(function (p) { return p.hot; }).length;
    $('welcome').querySelector('.modal').innerHTML = '<h1 id="w-h">Katong Diaries</h1><p class="lead">Joo Chiat, Katong and everything within 5 km of the Katong Starbucks, as a 3D model you can walk through. ' + n.toLocaleString() + ' places, ' + hot + ' of them hand-picked from this year\'s guides.</p>' +
      '<ul class="how"><li><span>' + I('pin') + '</span><div><b>Tap anything</b><small>Every pin and every building opens a card: what it is, what to order, how to get there.</small></div></li>' +
      '<li><span>' + I('walk') + '</span><div><b>Pick a look and walk the streets</b><small>Stroll behind your avatar, or switch to street view and see it at eye level.</small></div></li>' +
      '<li><span>' + I('book') + '</span><div><b>Keep a bucket list</b><small>Save places, log the day you went and write a line about it.</small></div></li></ul>' +
      '<div class="go"><button class="btn pri" id="w-fit">' + I('hanger') + 'Pick an outfit and stroll</button><button class="btn" id="w-map">' + I('map') + 'Explore the map</button></div>';
    $('welcome').hidden = false;
    $('w-fit').addEventListener('click', function () { self.closeWelcome(); self.openFit(true); });
    $('w-map').addEventListener('click', function () { self.closeWelcome(); });
  };
  UI.prototype.closeWelcome = function () { $('welcome').hidden = true; KD.Store.setPref('welcomed', 1); };
  UI.prototype.openFit = function (thenStroll) {
    var self = this, app = this.app, av = app.avatar;
    this._fitStroll = thenStroll;
    var h = '<header class="h"><h2 id="f-h">Choose your look</h2><button class="x" id="f-x" aria-label="Close">' + I('x') + '</button></header><div class="fit"><canvas id="fitCanvas"></canvas><div>' +
      '<h3 class="kick">Outfit</h3><div class="looks">' + KD.OUTFITS.map(function (o) { return '<button class="look" data-o="' + o.id + '" aria-pressed="' + (av.outfit === o.id) + '"><span class="sw">' + o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><b>' + esc(o.name) + '</b><small>' + esc(o.desc) + '</small></button>'; }).join('') + '</div>' +
      '<h3 class="kick">Skin</h3><div class="swatches" id="sw-skin">' + KD.SKINS.map(function (c) { return '<button data-c="' + c + '" style="background:' + c + '" aria-pressed="' + (av.skin === c) + '" aria-label="Skin tone"></button>'; }).join('') + '</div>' +
      '<h3 class="kick">Hair</h3><div class="swatches" id="sw-hair">' + KD.HAIRS.map(function (c) { return '<button data-c="' + c + '" style="background:' + c + '" aria-pressed="' + (av.hair === c) + '" aria-label="Hair colour"></button>'; }).join('') + '</div>' +
      '<div class="go" style="margin-top:18px"><button class="btn pri" id="f-go">' + I('walk') + 'Stroll in this look</button><button class="btn" id="f-done">Done</button></div></div></div>';
    var m = $('fit').querySelector('.modal'); m.innerHTML = h; $('fit').hidden = false;
    if (!this.preview) { try { this.preview = KD.AvatarPreview($('fitCanvas')); } catch (e) { this.preview = null; } }
    else { var old = this.preview; old.stop(); try { this.preview = KD.AvatarPreview($('fitCanvas')); } catch (e2) { this.preview = null; } }
    if (this.preview) { this.preview.avatar.set({ outfit: av.outfit, skin: av.skin, hair: av.hair }); this.preview.start(); }
    function apply(o) { app.setOutfit(o); if (self.preview) self.preview.avatar.set(o); }
    m.onclick = function (e) {
      var lk = e.target.closest('.look'), sw = e.target.closest('.swatches button');
      if (lk) { apply({ outfit: lk.dataset.o }); m.querySelectorAll('.look').forEach(function (x) { x.setAttribute('aria-pressed', x === lk); }); }
      else if (sw) { var key = sw.parentNode.id === 'sw-skin' ? 'skin' : 'hair', o = {}; o[key] = sw.dataset.c; apply(o); sw.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === sw); }); }
      else if (e.target.closest('#f-go')) { self.closeFit(); app.setMode('stroll'); }
      else if (e.target.closest('#f-done') || e.target.closest('#f-x')) self.closeFit();
    };
  };
  UI.prototype.closeFit = function () { $('fit').hidden = true; if (this.preview) this.preview.stop(); };

  /* ------------------------------------------------ mode + hud */
  UI.prototype.setMode = function (mode) {
    ['map', 'stroll', 'pov'].forEach(function (m) { $('m-' + m).setAttribute('aria-pressed', m === mode); });
    var walk = mode !== 'map', touch = this.app.touch;
    $('mapTools').hidden = walk; $('walkTools').hidden = !walk; $('where').hidden = !walk; $('mini').hidden = !walk; $('joy').hidden = !(walk && touch);
    $('hint').innerHTML = touch ? '' : mode === 'map' ? 'Drag to move · right-drag to turn and tilt · scroll to zoom · tap anything'
      : mode === 'stroll' ? '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk · drag to look · <kbd>Shift</kbd> run · tap the ground to walk there'
        : '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk · drag to look around · tap the road to go there · scroll to zoom';
    $('hint').hidden = !!touch;
  };
  UI.prototype.setHud = function (street, near) {
    if (street !== this._street) { this._street = street; $('street').textContent = street || 'Katong'; }
    var key = near.map(function (n) { return n.p.id + Math.round(n.d / 10); }).join(',');
    if (key === this._nearKey) return; this._nearKey = key;
    $('near').innerHTML = near.map(function (n) { return '<button class="glass" data-id="' + esc(n.p.id) + '">' + KD.badge(n.p.c) + esc(n.p.n) + '<em>' + fmtDist(n.d) + '</em></button>'; }).join('');
    if (!this._nearBound) { var self = this; this._nearBound = 1; $('near').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) self.openPlace(self.byId[b.dataset.id], false); }); }
  };
  UI.prototype.setTod = function (name) { $('b-tod').innerHTML = I(name === 'night' ? 'moon' : 'sun'); this.toast(KD.TOD[name].label); };
  UI.prototype._storeChanged = function (what) {
    this._bucketBadge(); this.app.syncPins();
    if (this.tab === 'bucket') this.render();
    if (what === 'remote') { if (this.card && this.card.place) { var a = document.activeElement; if (!(a && $('cardBody').contains(a) && /INPUT|TEXTAREA/.test(a.tagName))) this._placeHtml(); } this.app.applyPrefs(); }
  };
  KD.UI = UI;
})();
