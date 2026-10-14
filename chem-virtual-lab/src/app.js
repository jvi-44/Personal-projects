/* Chem Virtual Lab · UI */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const TOP = window.CVL.TOPICS, EXS = window.CVL.EX;
const byTopic = {}; EXS.forEach(e => (byTopic[e.topic] = byTopic[e.topic] || []).push(e));
const exById = {}; EXS.forEach(e => exById[e.id] = e);
const KEY = 'cvl.v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
const S = load(); S.visited = S.visited || {}; S.last = S.last || {};
let ex = null, step = 0, auto = false, autoTimer = null, glOk = false, shown = false, triedGL = false;
let recall = !!S.recall, labels = S.labels !== false;

/* ---------- text formatting ---------- */
function chem(c) { return c.replace(/([A-Za-z\)\]])(\d+)/g, (m, a, d) => a + '<sub>' + d + '</sub>').replace(/\^([0-9]*[+\-−])/g, (m, x) => '<sup>' + x.replace('-', '−') + '</sup>').replace(/\./g, '·'); }
function fmt(s) {
  if (!s) return '';
  return String(s).replace(/\$([^$]+)\$/g, (m, c) => chem(c))
    .replace(/~([^~]+)~/g, '<b class="kv">$1</b>')
    .replace(/«([^»]+)»/g, '<span class="kq">$1</span>')
    .replace(/‹([^›]+)›/g, '<span class="ka">$1</span>');
}
const plain = s => String(s).replace(/<[^>]+>/g, '').replace(/[~«»‹›$]/g, '');

/* ---------- icons ---------- */
const ICON = {
  notebook: '<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M9 8h6M9 12h6M9 16h4"/>',
  burette: '<path d="M11 2h2v13l-1 2-1-2z"/><path d="M9 14h6"/><path d="M8 18l-2 4h12l-2-4z"/>',
  crucible: '<path d="M7 9h10l-1.5 6h-7z"/><path d="M5 17h14M7 17l-1 4M17 17l1 4M12 17v4"/>',
  funnel: '<path d="M4 4h16l-6 7v5l-4 2v-7z"/>',
  syringe: '<path d="M3 12h4M7 9h10v6H7z"/><path d="M17 12h4M19 10v4M10 9v6M13 9v6"/>',
  thermo: '<path d="M12 3a2 2 0 0 1 2 2v9a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2z"/><path d="M12 9v7"/>',
  watch: '<circle cx="12" cy="13" r="7"/><path d="M12 13V9M10 3h4M12 3v3"/>',
  sepfunnel: '<path d="M10 3h4M12 3v2c4 1 6 5 5 8l-4 4v4h-2v-4l-4-4c-1-3 1-7 5-8"/><path d="M8 12h8"/>',
  cell: '<path d="M4 9h6v11H4zM14 9h6v11h-6z"/><path d="M7 9V5h10v4M9 13h6"/>',
  condenser: '<path d="M10 2h4v14h-4z"/><path d="M8 5h8v8H8zM16 6h3M5 12h3"/><circle cx="12" cy="19" r="3"/>'
};
const icon = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + (ICON[k] || '') + '</svg>';

/* ---------- graphs (SVG) ---------- */
function plot(o) {
  const w = o.w || 380, h = o.h || 230, m = { l: 46, r: 16, t: 16, b: 42 };
  const X = v => m.l + (v - o.xr[0]) / (o.xr[1] - o.xr[0]) * (w - m.l - m.r);
  const Y = v => h - m.b - (v - o.yr[0]) / (o.yr[1] - o.yr[0]) * (h - m.t - m.b);
  let s = '<svg class="plot" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (o.title || 'graph') + '">';
  for (const t of (o.yt || [])) { const v = Array.isArray(t) ? t[0] : t; s += '<line class="gl" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/>'; }
  s += '<line class="ax" x1="' + m.l + '" y1="' + (h - m.b) + '" x2="' + (w - m.r) + '" y2="' + (h - m.b) + '"/><line class="ax" x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (h - m.b) + '"/>';
  for (const t of (o.xt || [])) { const v = Array.isArray(t) ? t[0] : t, lab = Array.isArray(t) ? t[1] : t; s += '<line class="ax" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + (h - m.b) + '" y2="' + (h - m.b + 4) + '"/><text x="' + X(v) + '" y="' + (h - m.b + 15) + '" text-anchor="middle">' + lab + '</text>'; }
  for (const t of (o.yt || [])) { const v = Array.isArray(t) ? t[0] : t, lab = Array.isArray(t) ? t[1] : t; s += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end">' + lab + '</text>'; }
  s += '<text x="' + ((m.l + w - m.r) / 2) + '" y="' + (h - 6) + '" text-anchor="middle">' + o.xl + '</text>';
  s += '<text transform="translate(12 ' + ((m.t + h - m.b) / 2) + ') rotate(-90)" text-anchor="middle">' + o.yl + '</text>';
  s += o.body(X, Y) + '</svg>';
  return s;
}
const poly = (pts, X, Y, cls) => '<polyline class="' + cls + '" points="' + pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"/>';
const cross = (x, y, X, Y) => { const a = X(x), b = Y(y); return '<path class="pt" d="M' + (a - 3.5) + ',' + (b - 3.5) + 'L' + (a + 3.5) + ',' + (b + 3.5) + 'M' + (a - 3.5) + ',' + (b + 3.5) + 'L' + (a + 3.5) + ',' + (b - 3.5) + '"/>'; };
const txt = (x, y, t, cls, anchor) => '<text class="' + (cls || '') + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'start') + '">' + t + '</text>';
function mini(ox, w, h, xl, yl, path, cap) {
  const l = ox + 18, b = h - 34, t = 12, r = ox + w - 6;
  return '<line class="ax" x1="' + l + '" y1="' + b + '" x2="' + r + '" y2="' + b + '"/><line class="ax" x1="' + l + '" y1="' + t + '" x2="' + l + '" y2="' + b + '"/>' +
    txt(l - 4, t + 4, yl, '', 'end') + txt(r, b + 12, xl, '', 'end') + path(l, b, r, t) + txt((l + r) / 2, h - 6, cap, 'tl', 'middle');
}
const G = {
  massHeat: () => plot({ title: 'Mass against heating', xr: [-0.4, 3.4], yr: [21.4, 23.6], xt: [[0, 'B'], [1, '1st'], [2, '2nd'], [3, '3rd']], yt: [21.5, 22, 22.5, 23, 23.5], xl: 'heating number', yl: 'mass / g',
    body: (X, Y) => poly([[0, 23.43], [1, 21.70], [2, 21.62], [3, 21.62]], X, Y, 'ln') + [[0, 23.43], [1, 21.70], [2, 21.62], [3, 21.62]].map(p => cross(p[0], p[1], X, Y)).join('') + '<line class="dash" x1="' + X(1.6) + '" x2="' + X(3.3) + '" y1="' + Y(21.62) + '" y2="' + Y(21.62) + '"/>' + txt(X(1.75), Y(21.62) - 8, 'constant mass D', 'tl') }),
  stoich: () => plot({ title: 'Mass of precipitate against volume of NaCl', xr: [0, 10], yr: [0, 1], xl: 'volume of NaCl(aq) added', yl: 'mass of PbCl₂',
    body: (X, Y) => poly([[0, 0], [5, 0.8], [10, 0.8]], X, Y, 'ln') + [1, 2, 3, 4, 6, 7, 8, 9].map(v => cross(v, v < 5 ? 0.16 * v : 0.8, X, Y)).join('') + '<line class="dash" x1="' + X(5) + '" x2="' + X(5) + '" y1="' + Y(0) + '" y2="' + Y(0.8) + '"/>' + txt(X(5) + 5, Y(0.25), 'n(Cl⁻) = 2 n(Pb²⁺)', 'tl') + txt(X(5.4), Y(0.88), 'all Pb²⁺ precipitated', '') }),
  ttExo: () => { const pre = [0, 0.5, 1, 1.5, 2, 2.5].map(t => [t, 25.0]); const post = [[3.5, 30.4], [4, 31.5], [4.5, 31.42], [5, 31.31], [5.5, 31.2], [6, 31.09], [6.5, 30.98], [7, 30.87]]; const fit = t => 31.75 - 0.22 * (t - 3);
    return plot({ title: 'Exothermic temperature against time', xr: [0, 7.4], yr: [24, 32.5], xt: [0, 1, 2, 3, 4, 5, 6, 7], yt: [24, 26, 28, 30, 32], xl: 'time / min (exothermic)', yl: 'temperature / °C',
      body: (X, Y) => poly([[0, 25], [3, 25]], X, Y, 'ln') + poly([[4, fit(4)], [7.2, fit(7.2)]], X, Y, 'ln') + '<line class="dash" x1="' + X(3) + '" x2="' + X(4) + '" y1="' + Y(fit(3)) + '" y2="' + Y(fit(4)) + '"/>' + '<line class="dash" x1="' + X(3) + '" x2="' + X(3) + '" y1="' + Y(24) + '" y2="' + Y(fit(3)) + '"/>' + pre.concat(post).map(p => cross(p[0], p[1], X, Y)).join('') + '<line class="arr" x1="' + (X(3) - 10) + '" x2="' + (X(3) - 10) + '" y1="' + Y(25) + '" y2="' + Y(fit(3)) + '"/>' + txt(X(3) - 14, Y(28.5), 'ΔT', 'tl', 'end') + txt(X(3) + 4, Y(24.6), 'reagent added', '') }); },
  ttEndo: () => { const pre = [0, 0.5, 1, 1.5, 2, 2.5].map(t => [t, 25.0]); const fit = t => 18.0 + 0.25 * (t - 3); const post = [[3.5, 20.6], [4, 18.3], [4.5, 18.4], [5, 18.5], [5.5, 18.62], [6, 18.75], [6.5, 18.88], [7, 19.0]];
    return plot({ title: 'Endothermic temperature against time', xr: [0, 7.4], yr: [16.5, 26.5], xt: [0, 1, 2, 3, 4, 5, 6, 7], yt: [17, 19, 21, 23, 25], xl: 'time / min (endothermic)', yl: 'temperature / °C',
      body: (X, Y) => poly([[0, 25], [3, 25]], X, Y, 'ln') + poly([[4, fit(4)], [7.2, fit(7.2)]], X, Y, 'ln') + '<line class="dash" x1="' + X(3) + '" x2="' + X(4) + '" y1="' + Y(fit(3)) + '" y2="' + Y(fit(4)) + '"/>' + '<line class="dash" x1="' + X(3) + '" x2="' + X(3) + '" y1="' + Y(16.5) + '" y2="' + Y(25) + '"/>' + pre.concat(post).map(p => cross(p[0], p[1], X, Y)).join('') + '<line class="arr" x1="' + (X(3) - 10) + '" x2="' + (X(3) - 10) + '" y1="' + Y(25) + '" y2="' + Y(fit(3)) + '"/>' + txt(X(3) - 14, Y(21.5), 'ΔT', 'tl', 'end') }); },
  thermoTitr: () => { const up = v => 11.54 * v / 33.3, dn = v => 11.54 - 0.125 * (v - 33.3); const pts = []; for (let v = 0; v <= 48; v += 3) pts.push([v, v <= 30 ? up(v) + (v % 6 ? 0.12 : -0.1) : (v === 33 ? 11.25 : dn(v) + (v % 6 ? -0.08 : 0.08))]);
    return plot({ title: 'Thermometric titration', xr: [0, 52], yr: [0, 13], xt: [0, 10, 20, 30, 40, 50], yt: [0, 4, 8, 12], xl: 'volume of FA 2 added / cm³', yl: 'ΔT / °C',
      body: (X, Y) => poly([[0, 0], [33.3, up(33.3)]], X, Y, 'ln') + poly([[33.3, dn(33.3)], [50, dn(50)]], X, Y, 'ln') + pts.map(p => cross(p[0], p[1], X, Y)).join('') + '<line class="dash" x1="' + X(33.3) + '" x2="' + X(33.3) + '" y1="' + Y(0) + '" y2="' + Y(11.54) + '"/>' + txt(X(33.3), Y(0) - 4, 'V<tspan font-size="8">eq</tspan>', 'tl', 'middle') + txt(X(2), Y(12.4), 'best-fit lines meet at the end-point', '') }); },
  mixVol: () => { const f = v => v <= 55 ? 13.7 * v / 55 : 13.7 * (110 - v) / 55;
    return plot({ title: 'Temperature change against volume of FA 1', xr: [0, 110], yr: [0, 15.5], xt: [0, 20, 40, 55, 80, 100], yt: [0, 5, 10, 15], xl: 'volume of FA 1 (H₂SO₄) / cm³', yl: 'ΔT / °C',
      body: (X, Y) => poly([[0, 0], [55, 13.7], [110, 0]], X, Y, 'ln') + [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => cross(v, f(v) - (Math.abs(v - 55) < 10 ? 0.6 : 0), X, Y)).join('') + '<line class="dash" x1="' + X(55) + '" x2="' + X(55) + '" y1="' + Y(0) + '" y2="' + Y(13.7) + '"/><line class="dash" x1="' + X(0) + '" x2="' + X(55) + '" y1="' + Y(13.7) + '" y2="' + Y(13.7) + '"/>' + txt(X(57), Y(1), 'V<tspan font-size="8">eq</tspan>', 'tl') + txt(X(2), Y(13.7) - 5, 'ΔT<tspan font-size="8">eq</tspan>', 'tl') + txt(X(14), Y(1.2), 'acid limiting', '') + txt(X(72), Y(1.2), 'NaOH limiting', '') }); },
  clock: () => { const w = 132, h = 150; let s = '<svg class="plot" viewBox="0 0 ' + (w * 3) + ' ' + h + '" role="img" aria-label="Three graphs of 1/t">';
    s += mini(0, w, h, 'V', '1/t', (l, b, r, t) => '<line class="ln" x1="' + l + '" x2="' + r + '" y1="' + (b - 50) + '" y2="' + (b - 50) + '"/>', 'order 0');
    s += mini(w, w, h, 'V', '1/t', (l, b, r, t) => '<line class="ln" x1="' + l + '" x2="' + r + '" y1="' + b + '" y2="' + (t + 8) + '"/>', 'order 1');
    s += mini(2 * w, w, h, 'V²', '1/t', (l, b, r, t) => '<line class="ln" x1="' + l + '" x2="' + r + '" y1="' + b + '" y2="' + (t + 8) + '"/>', 'order 2');
    return s + '</svg>'; },
  kmno4: () => { const w = 198, h = 160; let s = '<svg class="plot" viewBox="0 0 ' + (w * 2) + ' ' + h + '" role="img" aria-label="Volume of KMnO4 against time">';
    s += mini(0, w, h, 't', 'V', (l, b, r, t) => '<line class="ln" x1="' + l + '" x2="' + (r - 12) + '" y1="' + (t + 10) + '" y2="' + (b - 6) + '"/>', 'straight line: zero order');
    s += mini(w, w, h, 't', 'V', (l, b, r, t) => { let p = ''; const H = b - t - 10; for (let i = 0; i <= 40; i++) { const x = l + i / 40 * (r - l), y = b - H * Math.exp(-i / 40 * 2.6); p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); } const t1 = l + (Math.LN2 / 2.6) * (r - l), t2 = l + (2 * Math.LN2 / 2.6) * (r - l); return '<path class="ln" d="' + p + '"/><line class="dash" x1="' + t1 + '" x2="' + t1 + '" y1="' + b + '" y2="' + (b - H / 2) + '"/><line class="dash" x1="' + t2 + '" x2="' + t2 + '" y1="' + b + '" y2="' + (b - H / 4) + '"/>' + txt((l + t1) / 2, b - 4, 't½', '', 'middle') + txt((t1 + t2) / 2, b - 4, 't½', '', 'middle'); }, 'curve, constant t½: first order');
    return s + '</svg>'; },
  ecell: () => { const E = y => 1.10 - 0.0128 * y; const xs = [0, 2.30, 4.61, 6.91, 9.21]; const Ex = 1.030, Yx = (1.10 - Ex) / 0.0128;
    return plot({ title: 'Ecell against ln(1/[Cu2+])', xr: [0, 10], yr: [0.97, 1.11], xt: [0, 2, 4, 6, 8, 10], yt: [[0.98, '0.98'], [1.0, '1.00'], [1.02, '1.02'], [1.04, '1.04'], [1.06, '1.06'], [1.08, '1.08'], [1.1, '1.10']], xl: 'ln(1 / [Cu²⁺])', yl: 'E(cell) / V',
      body: (X, Y) => poly([[0, E(0)], [10, E(10)]], X, Y, 'ln') + xs.map(v => cross(v, E(v), X, Y)).join('') + '<line class="dash" x1="' + X(0) + '" x2="' + X(Yx) + '" y1="' + Y(Ex) + '" y2="' + Y(Ex) + '"/><line class="dash" x1="' + X(Yx) + '" x2="' + X(Yx) + '" y1="' + Y(Ex) + '" y2="' + Y(0.97) + '"/>' + txt(X(0.2), Y(Ex) - 5, 'E(cell) of X', 'tl') + txt(X(Yx) + 4, Y(0.975), 'Y', 'tl') + txt(X(5.6), Y(1.085), 'gradient = −0.0128', '') }); },
  solub: () => { const f = T => 9.8 * Math.exp(-(T - 10) / 38) + 1.2; const pts = [15, 25, 35, 45, 55];
    return plot({ title: 'Solubility against temperature', xr: [10, 60], yr: [0, 12], xt: [10, 20, 30, 40, 50, 60], xl: 'temperature / °C', yl: 'solubility / g per 100 g',
      body: (X, Y) => { let p = ''; for (let T = 10; T <= 60; T += 2) p += (T === 10 ? 'M' : 'L') + X(T).toFixed(1) + ',' + Y(f(T)).toFixed(1); return '<path class="ln" d="' + p + '"/>' + pts.map(T => cross(T, f(T), X, Y)).join('') + txt(X(32), Y(9.5), 'shape only: solubility falls', '') + txt(X(32), Y(8.5), 'as temperature rises', ''); } }); },
  hess: () => { const w = 400, h = 200; const bx = (x, y, bw, t) => '<rect class="box" x="' + (x - bw / 2) + '" y="' + (y - 14) + '" width="' + bw + '" height="28" rx="5"/>' + txt(x, y + 4, t, 'tl', 'middle');
    const ar = (x1, y1, x2, y2) => { const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 8 * Math.cos(a - 0.4), hy = y2 - 8 * Math.sin(a - 0.4), kx = x2 - 8 * Math.cos(a + 0.4), ky = y2 - 8 * Math.sin(a + 0.4); return '<line class="arr" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/><path class="hd" d="M' + x2 + ',' + y2 + 'L' + hx + ',' + hy + 'L' + kx + ',' + ky + 'z"/>'; };
    return '<svg class="plot" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Hess cycle">' + bx(95, 30, 178, '5-decyne + H₂ + 15 O₂') + bx(312, 30, 168, 'cis-dec-5-ene + 15 O₂') + bx(200, 168, 170, '10 CO₂(g) + 10 H₂O(l)') + ar(186, 30, 226, 30) + txt(206, 18, 'ΔH₁', 'tl', 'middle') + ar(95, 46, 165, 152) + ar(312, 46, 236, 152) + txt(62, 108, 'ΔHc(5-decyne)', '', 'start') + txt(62, 121, '+ (−286)', '', 'start') + txt(280, 108, 'ΔHc(cis-dec-5-ene)', '', 'start') + '</svg>'; }
};

/* ---------- dashboard ---------- */
function visitedCount(id) { const v = S.visited[id] || []; return v.filter(Boolean).length; }
function renderDash() {
  const ol = $('#topics'); ol.innerHTML = '';
  for (const t of TOP) {
    const exs = byTopic[t.n] || []; const total = exs.reduce((a, e) => a + e.steps.length, 0); const seen = exs.reduce((a, e) => a + Math.min(visitedCount(e.id), e.steps.length), 0);
    const li = document.createElement('li'); li.className = 'topic';
    const userList = t.user ? '<ul class="t-user">' + t.cheat.map(c => '<li>' + fmt(c) + '</li>').join('') + '</ul>' : '';
    li.innerHTML = '<div class="t-num"><span>' + String(t.n).padStart(2, '0') + '</span>' + icon(t.icon) + '</div>' +
      '<div class="t-body"><h2>' + t.name + (t.user ? '<span class="mine">your notes</span>' : '') + '</h2><p class="t-sum">' + fmt(t.sum) + '</p>' + userList +
      '<div class="chips">' + exs.map(e => '<button class="chip" data-ex="' + e.id + '"><b>' + e.tag + '</b><span>' + e.name + '</span><i>' + e.steps.length + ' steps</i></button>').join('') + '</div></div>' +
      '<div class="t-prog"><div class="meter"><span style="width:' + (total ? Math.round(seen / total * 100) : 0) + '%"></span></div>' + seen + ' / ' + total + ' steps viewed</div>';
    ol.appendChild(li);
  }
}
$('#topics').addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (b) location.hash = b.dataset.ex; });

/* ---------- lab ---------- */
function showDash() {
  stopAuto(); $('#lab').hidden = true; $('#dash').hidden = false; if (glOk) LAB.stop();
  $('#crumbs').textContent = 'H2 Chemistry · planning practicals'; renderDash(); ex = null; window.scrollTo(0, 0);
}
function openEx(id, k) {
  const e = exById[id]; if (!e) { showDash(); return; }
  const t = TOP.find(x => x.n === e.topic);
  const first = $('#lab').hidden; $('#dash').hidden = true; $('#lab').hidden = false;
  if (first) window.scrollTo(0, 0);
  if (!glOk && !triedGL) { triedGL = true; initGL(); }
  if (glOk) LAB.start();
  if (ex !== e) {
    ex = e; stopAuto();
    $('#lhNum').textContent = String(t.n).padStart(2, '0'); $('#lhTopic').textContent = t.name; $('#lhName').innerHTML = e.name;
    $('#crumbs').textContent = String(t.n).padStart(2, '0') + ' ' + t.name + ' · ' + plain(e.name);
    const exs = byTopic[e.topic];
    $('#tabs').innerHTML = exs.map(x => '<button class="tab" role="tab" aria-selected="' + (x === e) + '" data-ex="' + x.id + '"><b>' + x.tag + '</b>' + x.name + '</button>').join('');
    const T = e.tamp || {};
    $('#qbody').innerHTML = '<p class="q">' + fmt(e.q) + '</p><div class="tamp">' + [['T', 'Topic & Aim', T.T], ['A', 'Analyse clues', T.A], ['M', 'Measurements', T.M], ['P', 'Process', T.P]].map(r => '<div><b>' + r[0] + '<span>' + r[1] + '</span></b>' + fmt(r[2] || '') + '</div>').join('') + '</div>';
    $('#cheatSum').textContent = (t.user ? 'Your notes: ' : 'Topic summary: ') + t.name;
    $('#cheatList').innerHTML = t.cheat.map(c => '<li>' + fmt(c) + '</li>').join('');
    $('#steplist').innerHTML = e.steps.map((s, i) => '<li data-i="' + i + '"><button data-i="' + i + '"><span class="st-n">' + String(i + 1).padStart(2, '0') + '</span><span class="st-t">' + fmt(s.t) + '</span><span class="st-c"></span></button></li>').join('');
    $('#dots').innerHTML = e.steps.map((s, i) => '<button class="dot" data-i="' + i + '" aria-label="Step ' + (i + 1) + ': ' + plain(s.t) + '">' + (i + 1) + '</button>').join('');
    if (glOk) { try { LAB.load(e); } catch (err) { console.error(err); } }
    const sel = $('#tabs .tab[aria-selected="true"]'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  go(k == null ? (S.last[id] || 0) : k, true);
}
function go(k, fromOpen) {
  if (!ex) return; k = Math.max(0, Math.min(ex.steps.length - 1, k));
  step = k; shown = false;
  const v = S.visited[ex.id] = S.visited[ex.id] || []; v[k] = 1; S.last[ex.id] = k; save();
  renderStep();
  if (glOk) { try { LAB.go(k); } catch (err) { console.error(err); } }
  if (auto && !glOk) scheduleAuto();
}
function renderStep() {
  const s = ex.steps[step], n = ex.steps.length;
  $('#ovStep').textContent = (step + 1) + ' / ' + n; $('#ovTitle').innerHTML = fmt(s.t);
  let h = '<div class="cur-head"><span class="cur-num">' + String(step + 1).padStart(2, '0') + '</span><div><p class="eyebrow">Step ' + (step + 1) + ' of ' + n + '</p><h3>' + fmt(s.t) + '</h3></div></div>';
  h += '<div class="cur-body"><p class="cur-text">' + fmt(s.d) + '</p>';
  if (s.why) h += '<div class="callout"><span class="lbl">Why</span><p>' + fmt(s.why) + '</p></div>';
  if (s.safe) h += '<div class="callout safe"><span class="lbl">Safety</span><p>' + fmt(s.safe) + '</p></div>';
  h += '</div>';
  if (s.dg && s.dg.length) h += '<div class="dgs">' + s.dg.map(renderDg).join('') + '</div>';
  if (recall) h += '<button class="btn primary reveal" id="reveal">Reveal step</button>';
  const cur = $('#cur'); cur.innerHTML = h; cur.classList.toggle('shown', !recall);
  document.querySelectorAll('#steplist li').forEach((li, i) => { li.classList.toggle('on', i === step); const seen = (S.visited[ex.id] || [])[i]; li.querySelector('.st-c').textContent = seen ? '✓' : ''; });
  document.querySelectorAll('#dots .dot').forEach((d, i) => { if (i === step) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); d.classList.toggle('seen', !!(S.visited[ex.id] || [])[i]); });
  $('#prev').disabled = step === 0; $('#next').disabled = step === n - 1;
  const r = $('#reveal'); if (r) r.addEventListener('click', () => { shown = true; cur.classList.add('shown'); r.remove(); });
}
function renderDg(d) {
  if (d.k === 'tamp') { const T = ex.tamp || {}; return '<div class="dg"><h4>TAMP for this question</h4><div class="tamp">' + [['T', 'Topic & Aim', T.T], ['A', 'Analyse clues', T.A], ['M', 'Measurements', T.M], ['P', 'Process', T.P]].map(r => '<div><b>' + r[0] + '<span>' + r[1] + '</span></b>' + fmt(r[2] || '') + '</div>').join('') + '</div></div>'; }
  if (d.k === 'calc') return '<div class="dg"><h4>' + fmt(d.h || 'Calculation') + '</h4><ol class="calc">' + d.l.map(x => '<li>' + fmt(x) + '</li>').join('') + '</ol></div>';
  if (d.k === 'table') return '<div class="dg"><h4>' + fmt(d.h || 'Table') + '</h4><div class="tbl"><table><thead><tr>' + d.head.map(x => '<th>' + fmt(x) + '</th>').join('') + '</tr></thead><tbody>' + d.rows.map(r => '<tr>' + r.map(c => '<td>' + fmt(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' + (d.cap ? '<p class="cap">' + fmt(d.cap) + '</p>' : '') + '</div>';
  if (d.k === 'list') return '<div class="dg"><h4>' + fmt(d.h || '') + '</h4><ul>' + d.items.map(x => '<li>' + fmt(x) + '</li>').join('') + '</ul></div>';
  if (d.k === 'graph') return '<div class="dg"><h4>Graph</h4>' + (G[d.g] ? G[d.g]() : '') + '</div>';
  return '';
}

/* ---------- controls ---------- */
function stopAuto() { auto = false; clearTimeout(autoTimer); const b = $('#auto'); b.setAttribute('aria-pressed', 'false'); b.textContent = '▶ Auto-play'; }
function scheduleAuto() { clearTimeout(autoTimer); autoTimer = setTimeout(() => { if (!auto || !ex) return; if (step < ex.steps.length - 1) go(step + 1); else stopAuto(); }, glOk ? 2200 : 4500); }
$('#prev').addEventListener('click', () => { stopAuto(); go(step - 1); });
$('#next').addEventListener('click', () => { stopAuto(); go(step + 1); });
$('#replay').addEventListener('click', () => go(step));
$('#view').addEventListener('click', () => { if (glOk) LAB.resetView(step); });
$('#auto').addEventListener('click', () => { if (auto) { stopAuto(); return; } auto = true; const b = $('#auto'); b.setAttribute('aria-pressed', 'true'); b.textContent = '❚❚ Pause'; if (step >= ex.steps.length - 1) go(0); else if (!glOk || !LAB.busy()) scheduleAuto(); });
$('#labels').addEventListener('click', () => { labels = !labels; S.labels = labels; save(); applyToggles(); });
$('#recall').addEventListener('click', () => { recall = !recall; S.recall = recall; save(); applyToggles(); if (ex) renderStep(); });
$('#steplist').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { stopAuto(); go(+b.dataset.i); } });
$('#dots').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { stopAuto(); go(+b.dataset.i); } });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (b) location.hash = b.dataset.ex; });
$('#back').addEventListener('click', () => { location.hash = ''; });
$('#home').addEventListener('click', () => { location.hash = ''; });
document.addEventListener('keydown', e => {
  if ($('#lab').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'ArrowRight') { stopAuto(); go(step + 1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { stopAuto(); go(step - 1); e.preventDefault(); }
  else if (e.key === 'r' || e.key === 'R') go(step);
});
function applyToggles() {
  $('#labels').setAttribute('aria-pressed', String(labels)); $('#recall').setAttribute('aria-pressed', String(recall));
  document.body.classList.toggle('recall', recall); if (glOk) LAB.setLabels(labels);
}
function initGL() {
  if (typeof THREE === 'undefined' || !window.LAB || !LAB.init) { $('#ovFail').hidden = false; glOk = false; return; }
  let ok = false; try { ok = LAB.init($('#cv'), $('#stage')); } catch (err) { console.error(err); ok = false; }
  glOk = !!ok; $('#ovFail').hidden = glOk;
  if (glOk) { LAB.setLabels(labels); LAB.onIdle(() => { if (auto) scheduleAuto(); }); }
}
document.addEventListener('visibilitychange', () => { if (!glOk) return; if (document.hidden) LAB.stop(); else if (!$('#lab').hidden) LAB.start(); });
function route() {
  const id = (location.hash || '').replace(/^#/, '');
  if (id && exById[id]) openEx(id); else if (id && TOP.find(t => t.id === id)) { const e = byTopic[TOP.find(t => t.id === id).n][0]; openEx(e.id); } else showDash();
}
window.addEventListener('hashchange', route);
applyToggles(); route();
})();
