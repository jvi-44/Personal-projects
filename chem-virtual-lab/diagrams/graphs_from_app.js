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

