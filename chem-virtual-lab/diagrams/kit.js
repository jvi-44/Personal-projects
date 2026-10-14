/* Line-drawing kit for exam-style apparatus diagrams (SVG strings). y grows downwards. */
let UID = 0;
const nid = () => 'k' + (++UID);
const f = n => Math.round(n * 10) / 10;

/* ---------- primitives ---------- */
function vessel(d, level, opt) {
  opt = opt || {};
  let s = '';
  if (level != null) {
    const a = nid(), b = nid();
    s += `<clipPath id="${a}"><rect x="-2000" y="${f(level)}" width="5000" height="5000"/></clipPath>`;
    s += `<clipPath id="${b}"><path d="${d}"/></clipPath>`;
    s += `<path d="${d}" class="${opt.solid ? 'sol' : 'liq'}" clip-path="url(#${a})"/>`;
    if (!opt.solid) s += `<line class="men" x1="-2000" x2="3000" y1="${f(level)}" y2="${f(level)}" clip-path="url(#${b})"/>`;
  }
  if (opt.layer != null) { // second (upper) layer: from opt.layer up to level2
    const a = nid();
    s += `<clipPath id="${a}"><rect x="-2000" y="${f(opt.layer)}" width="5000" height="5000"/></clipPath><path d="${d}" class="liq2" clip-path="url(#${a})"/>`;
    const b = nid(); s += `<clipPath id="${b}"><path d="${d}"/></clipPath><line class="men" x1="-2000" x2="3000" y1="${f(opt.layer)}" y2="${f(opt.layer)}" clip-path="url(#${b})"/>`;
  }
  if (opt.ppt != null) { const a = nid(); s += `<clipPath id="${a}"><rect x="-2000" y="${f(opt.ppt)}" width="5000" height="5000"/></clipPath><path d="${d}" class="sol" clip-path="url(#${a})"/>`; }
  s += `<path d="${d}" class="gl"/>`;
  return s;
}
function lab(t, px, py, tx, ty, a) {
  a = a || (tx < px ? 'end' : 'start');
  const dx = a === 'end' ? -4 : a === 'start' ? 4 : 0;
  const lines = String(t).split('\n');
  const y0 = ty + 3.8 - (lines.length - 1) * 6;
  let s = `<line class="ld" x1="${f(px)}" y1="${f(py)}" x2="${f(tx)}" y2="${f(ty)}"/><circle class="dotp" cx="${f(px)}" cy="${f(py)}" r="1.4"/>`;
  s += `<text class="lb" x="${f(tx + dx)}" y="${f(y0)}" text-anchor="${a}">` + lines.map((l, i) => `<tspan x="${f(tx + dx)}" dy="${i ? 12 : 0}">${l}</tspan>`).join('') + '</text>';
  return s;
}
function note(t, x, y, a, cls) { const lines = String(t).split('\n'); return `<text class="${cls || 'nt'}" x="${x}" y="${y}" text-anchor="${a || 'start'}">` + lines.map((l, i) => `<tspan x="${x}" dy="${i ? 12 : 0}">${l}</tspan>`).join('') + '</text>'; }
function arrow(x1, y1, x2, y2, cls) { return `<line class="${cls || 'ar'}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" marker-end="url(#ah)"/>`; }
function tube(pts, glassy) { const d = 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L'); return `<path d="${d}" class="${glassy ? 'tbo2' : 'tbo'}"/><path d="${d}" class="tbi"/>`; }
function wire(pts) { return `<polyline class="wr" points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}"/>`; }
function svg(w, h, body) { return `<svg viewBox="0 0 ${w} ${h}" class="dia" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }

/* ---------- apparatus ---------- */
function stand(xr, yb, top, bx1, bx2) { return `<rect class="mt" x="${bx1}" y="${yb - 8}" width="${bx2 - bx1}" height="8"/><line class="rod" x1="${xr}" y1="${yb - 8}" x2="${xr}" y2="${top}"/>`; }
function clamp(xr, y, x2, jaw) {
  jaw = jaw || 10;
  return `<rect class="mt" x="${xr - 5}" y="${y - 6}" width="10" height="12"/><line class="rod2" x1="${xr + 5}" y1="${y}" x2="${x2 - jaw - 2}" y2="${y}"/><path class="gl" d="M${x2 - jaw - 2},${y - 7} L${x2 - jaw},${y - 7} L${x2 - jaw},${y + 7} L${x2 - jaw - 2},${y + 7}"/><path class="gl" d="M${x2 + jaw + 2},${y - 7} L${x2 + jaw},${y - 7} L${x2 + jaw},${y + 7} L${x2 + jaw + 2},${y + 7}"/>`;
}
function ring(cx, y, r) { return `<ellipse class="gl" cx="${cx}" cy="${y}" rx="${r}" ry="3.5"/>`; }
function burette(cx, top, bot, level, opt) {
  opt = opt || {}; const w = 6;
  const d = `M${cx - w},${top} L${cx - w},${bot} L${cx + w},${bot} L${cx + w},${top}`;
  let s = vessel(d, level);
  for (let y = top + 14; y < bot - 6; y += 12) s += `<line class="tk" x1="${cx - w}" x2="${cx - w + ((y - top) % 36 < 12 ? 6 : 3.5)}" y1="${y}" y2="${y}"/>`;
  s += `<rect class="gl wf" x="${cx - 4}" y="${bot}" width="8" height="8"/><rect class="gl wf" x="${cx - 11}" y="${bot + 2}" width="22" height="4"/><rect class="mt" x="${cx + 11}" y="${bot}" width="3" height="8"/>`;
  s += vessel(`M${cx - 4},${bot + 8} L${cx - 1.2},${bot + 28} L${cx + 1.2},${bot + 28} L${cx + 4},${bot + 8}`, level != null && opt.tipFull !== false ? bot + 8 : null);
  return s;
}
function conical(cx, yb, o) {
  o = o || {}; const w = o.w || 80, h = o.h || 100, n = o.neck || 22, nh = o.nh || 26; const ys = yb - (h - nh), yt = yb - h;
  const d = `M${cx - n / 2},${yt} L${cx - n / 2},${ys} L${cx - w / 2},${yb} L${cx + w / 2},${yb} L${cx + n / 2},${ys} L${cx + n / 2},${yt}`;
  const lev = o.level != null ? yb - o.level * (h - nh) : null;
  let s = vessel(d, lev, { ppt: o.ppt != null ? yb - o.ppt : null });
  if (o.side) s += `<path class="gl" d="M${cx + n / 2},${yt + 9} L${cx + n / 2 + 30},${yt + 16} M${cx + n / 2},${yt + 17} L${cx + n / 2 + 30},${yt + 24}"/><path class="gl wf" d="M${cx + n / 2 - 1},${yt + 9.6} L${cx + n / 2 - 1},${yt + 16.4}"/>`;
  if (o.stopper) s += `<path class="bung" d="M${cx - n / 2 - 3},${yt - 12} L${cx + n / 2 + 3},${yt - 12} L${cx + n / 2},${yt + 6} L${cx - n / 2},${yt + 6} Z"/>`;
  return { s, top: yt, arm: [cx + n / 2 + 30, yt + 20], shoulder: ys };
}
function beaker(cx, yb, w, h, level, o) {
  o = o || {}; const d = `M${cx - w / 2 - 3},${yb - h - 3} L${cx - w / 2},${yb - h} L${cx - w / 2},${yb} L${cx + w / 2},${yb} L${cx + w / 2},${yb - h} L${cx + w / 2 + 3},${yb - h - 3}`;
  return vessel(d, level != null ? yb - level * h : null, { ppt: o.ppt != null ? yb - o.ppt : null, solid: o.solid });
}
function rbf(cx, yb, r, nh, level, o) {
  o = o || {}; const n = o.neck || 9, cy = yb - r, yj = cy - Math.sqrt(r * r - n * n);
  const d = `M${cx - n},${yj - nh} L${cx - n},${yj} A${r},${r} 0 1 0 ${cx + n},${yj} L${cx + n},${yj - nh}`;
  let s = vessel(d, level != null ? yb - level * 2 * r : null);
  if (o.chips) for (const [dx, dy] of [[-10, -6], [-2, -4], [7, -6], [14, -9]]) s += `<path class="chip" d="M${cx + dx},${yb + dy} l4,-3 l4,2 l-2,4 z"/>`;
  return { s, top: yj - nh };
}
function btube(cx, top, yb, w, level, o) {
  o = o || {}; const d = `M${cx - w},${top} L${cx - w},${yb - w} A${w},${w} 0 0 0 ${cx + w},${yb - w} L${cx + w},${top}`;
  return vessel(d, level != null ? level : null, { solid: o.solid, ppt: o.ppt });
}
function vflask(cx, yb, o) {
  o = o || {}; const n = 8, top = yb - 200;
  const d = `M${cx - n},${top} L${cx - n},${yb - 84} C${cx - 52},${yb - 72} ${cx - 50},${yb - 4} ${cx - 24},${yb} L${cx + 24},${yb} C${cx + 50},${yb - 4} ${cx + 52},${yb - 72} ${cx + n},${yb - 84} L${cx + n},${top}`;
  let s = vessel(d, o.level != null ? yb - 165 : null);
  s += `<line class="gl" x1="${cx - n - 4}" x2="${cx + n + 4}" y1="${yb - 165}" y2="${yb - 165}"/>`;
  if (o.stopper) s += `<path class="gl wf" d="M${cx - 8},${top} L${cx - 6},${top + 12} L${cx + 6},${top + 12} L${cx + 8},${top} L${cx + 12},${top - 6} L${cx - 12},${top - 6} Z"/>`;
  return { s, mark: yb - 165, top };
}
function mcyl(cx, yb, h, w, level, o) {
  o = o || {}; let s = `<path class="gl" d="M${cx - w / 2 - 14},${yb} L${cx + w / 2 + 14},${yb}"/>`;
  s += vessel(`M${cx - w / 2},${yb - h} L${cx - w / 2},${yb} L${cx + w / 2},${yb} L${cx + w / 2},${yb - h}`, level != null ? yb - level * h : null);
  for (let y = yb - 12; y > yb - h + 6; y -= 10) s += `<line class="tk" x1="${cx - w / 2}" x2="${cx - w / 2 + ((yb - y) % 30 < 10 ? 7 : 4)}" y1="${y}" y2="${y}"/>`;
  return s;
}
function dropper(cx, ytip, len) { len = len || 46; return `<path class="gl" d="M${cx - 1},${ytip} L${cx - 3},${ytip - 12} L${cx - 3},${ytip - len} M${cx + 1},${ytip} L${cx + 3},${ytip - 12} L${cx + 3},${ytip - len}"/><path class="bulb" d="M${cx - 4},${ytip - len} C${cx - 9},${ytip - len - 4} ${cx - 8},${ytip - len - 22} ${cx},${ytip - len - 22} C${cx + 8},${ytip - len - 22} ${cx + 9},${ytip - len - 4} ${cx + 4},${ytip - len} Z"/>`; }
function drops(cx, y1, n) { let s = ''; for (let i = 0; i < n; i++) s += `<ellipse class="liqs" cx="${cx}" cy="${y1 + i * 9}" rx="1.8" ry="2.6"/>`; return s; }
function crucible(cx, ytop, o) {
  o = o || {}; const wt = o.wt || 56, wb = o.wb || 32, h = o.h || 40;
  const d = `M${cx - wt / 2},${ytop} L${cx - wb / 2},${ytop + h} L${cx + wb / 2},${ytop + h} L${cx + wt / 2},${ytop}`;
  let s = vessel(d, o.fill != null ? ytop + h - o.fill * h : null, { solid: !o.molten });
  if (o.lid) s += `<path class="gl wf" d="M${cx - wt / 2 - 4},${ytop - 1} Q${cx},${ytop - 14} ${cx + wt / 2 + 4},${ytop - 1} Z"/>`;
  return s;
}
function tripod(cx, ytop, w, yb) { return `<line class="rod" x1="${cx - w / 2 - 6}" x2="${cx + w / 2 + 6}" y1="${ytop}" y2="${ytop}"/><line class="rod" x1="${cx - w / 2}" y1="${ytop}" x2="${cx - w / 2 - 14}" y2="${yb}"/><line class="rod" x1="${cx + w / 2}" y1="${ytop}" x2="${cx + w / 2 + 14}" y2="${yb}"/><line class="rod3" x1="${cx}" y1="${ytop}" x2="${cx + 4}" y2="${yb - 6}"/>`; }
function gauze(cx, y, w) { return `<rect class="gz" x="${cx - w / 2}" y="${y - 4}" width="${w}" height="4"/><text class="xx" x="${cx}" y="${y - 0.5}" text-anchor="middle">${'×'.repeat(Math.round(w / 6.2))}</text>`; }
function pipeclay(cx, y, w) { return `<line class="pc" x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${y}" y2="${y}"/><line class="ld" x1="${cx - w / 2 - 8}" x2="${cx - w / 2}" y1="${y}" y2="${y}"/><line class="ld" x1="${cx + w / 2}" x2="${cx + w / 2 + 8}" y1="${y}" y2="${y}"/>`; }
function flame(cx, yb, h, lum) { return lum ? `<path class="fl" d="M${cx},${yb - h} C${cx + 9},${yb - h * 0.5} ${cx + 8},${yb} ${cx},${yb} C${cx - 8},${yb} ${cx - 9},${yb - h * 0.5} ${cx},${yb - h} Z"/>` : `<path class="fl" d="M${cx},${yb - h} C${cx + 9},${yb - h * 0.45} ${cx + 8},${yb} ${cx},${yb} C${cx - 8},${yb} ${cx - 9},${yb - h * 0.45} ${cx},${yb - h} Z"/><path class="fli" d="M${cx},${yb - h * 0.45} C${cx + 4},${yb - h * 0.2} ${cx + 4},${yb} ${cx},${yb} C${cx - 4},${yb} ${cx - 4},${yb - h * 0.2} ${cx},${yb - h * 0.45} Z"/>`; }
function bunsen(cx, yb, fh) { return `<path class="mt" d="M${cx - 22},${yb} L${cx + 22},${yb} L${cx + 16},${yb - 7} L${cx - 16},${yb - 7} Z"/><rect class="gl wf" x="${cx - 5}" y="${yb - 62}" width="10" height="55"/><rect class="gl wf" x="${cx - 7}" y="${yb - 22}" width="14" height="8"/><line class="rod2" x1="${cx - 22}" x2="${cx - 34}" y1="${yb - 4}" y2="${yb - 4}"/>` + (fh ? flame(cx, yb - 62, fh) : ''); }
function lamp(cx, yb, fh, level) {
  const d = `M${cx - 8},${yb - 40} L${cx - 8},${yb - 34} C${cx - 30},${yb - 28} ${cx - 30},${yb} ${cx - 16},${yb} L${cx + 16},${yb} C${cx + 30},${yb} ${cx + 30},${yb - 28} ${cx + 8},${yb - 34} L${cx + 8},${yb - 40}`;
  return vessel(d, level != null ? yb - level : null) + `<rect class="mt" x="${cx - 9}" y="${yb - 44}" width="18" height="5"/><line class="wick" x1="${cx}" x2="${cx}" y1="${yb - 44}" y2="${yb - 52}"/><line class="wick" x1="${cx}" x2="${cx}" y1="${yb - 40}" y2="${yb - 14}"/>` + (fh ? flame(cx, yb - 52, fh, true) : '');
}
function thermo(x, top, bot) { let s = `<rect class="gl wf" x="${x - 3}" y="${top}" width="6" height="${bot - top}" rx="3"/><circle class="th" cx="${x}" cy="${bot + 1}" r="4"/><line class="thc" x1="${x}" x2="${x}" y1="${bot}" y2="${top + (bot - top) * 0.45}"/>`; return s; }
function syringe(x, y, len, pl) {
  let s = `<rect class="gl wf" x="${x - 12}" y="${y - 3}" width="12" height="6"/><rect class="gl wf" x="${x}" y="${y - 12}" width="${len}" height="24"/>`;
  for (let i = 0; i <= 10; i++) s += `<line class="tk" x1="${x + 6 + i * (len - 16) / 10}" x2="${x + 6 + i * (len - 16) / 10}" y1="${y - 12}" y2="${y - 12 + (i % 5 ? 4 : 7)}"/>`;
  const px = x + 8 + pl * (len - 20);
  s += `<rect class="mt" x="${px}" y="${y - 11}" width="5" height="22"/><line class="rod2" x1="${px + 5}" x2="${x + len + 34}" y1="${y}" y2="${y}"/><rect class="mt" x="${x + len + 34}" y="${y - 12}" width="5" height="24"/>`;
  return s;
}
function trough(x1, x2, ytop, yb, lev) { return vessel(`M${x1},${ytop} L${x1},${yb} L${x2},${yb} L${x2},${ytop}`, lev); }
function invcyl(cx, ytop, yb, w, gas, o) {
  o = o || {}; const d = `M${cx - w / 2},${yb} L${cx - w / 2},${ytop} L${cx + w / 2},${ytop} L${cx + w / 2},${yb}`;
  let s = `<clipPath id="ic${++UID}"><rect x="${cx - w}" y="${ytop + gas}" width="${2 * w}" height="${yb - ytop}"/></clipPath><rect class="liq" x="${cx - w / 2}" y="${ytop}" width="${w}" height="${yb - ytop}" clip-path="url(#ic${UID})"/><line class="men" x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${ytop + gas}" y2="${ytop + gas}"/><path d="${d}" class="gl"/>`;
  for (let y = ytop + 12; y < yb - 6; y += 10) s += `<line class="tk" x1="${cx + w / 2}" x2="${cx + w / 2 - ((y - ytop) % 30 < 10 ? 7 : 4)}" y1="${y}" y2="${y}"/>`;
  if (o.tap) s += `<rect class="gl wf" x="${cx - 9}" y="${ytop - 8}" width="18" height="4"/><path class="gl" d="M${cx - 3},${ytop} L${cx - 2},${ytop - 16} M${cx + 3},${ytop} L${cx + 2},${ytop - 16}"/>`;
  return s;
}
function cup(cx, yb, level, o) {
  o = o || {}; let s = beaker(cx, yb, 104, 92, null);
  const d = `M${cx - 44},${yb - 104} L${cx - 32},${yb - 4} L${cx + 32},${yb - 4} L${cx + 44},${yb - 104}`;
  s += vessel(d, level != null ? yb - 4 - level * 100 : null);
  s += `<path class="cupw" d="${d}"/>`;
  if (o.lid !== false) s += `<rect class="gl wf" x="${cx - 52}" y="${yb - 110}" width="104" height="6"/>`;
  return s;
}
function calor(cx, yb, w, h, level) { return vessel(`M${cx - w / 2 - 4},${yb - h} L${cx - w / 2},${yb - h} L${cx - w / 2},${yb} L${cx + w / 2},${yb} L${cx + w / 2},${yb - h} L${cx + w / 2 + 4},${yb - h}`, level != null ? yb - level * h : null).replace('class="gl"', 'class="metal"'); }
function sepf(cx, ytop, o) {
  o = o || {}; // ytop = top of neck
  const d = `M${cx - 6},${ytop} L${cx - 6},${ytop + 14} C${cx - 34},${ytop + 26} ${cx - 40},${ytop + 46} ${cx - 34},${ytop + 62} L${cx - 4},${ytop + 128} L${cx - 3},${ytop + 168} L${cx + 3},${ytop + 168} L${cx + 4},${ytop + 128} L${cx + 34},${ytop + 62} C${cx + 40},${ytop + 46} ${cx + 34},${ytop + 26} ${cx + 6},${ytop + 14} L${cx + 6},${ytop}`;
  let s = vessel(d, o.l2 != null ? ytop + o.l2 : null, { layer: o.l1 != null ? ytop + o.l1 : null });
  s += `<rect class="gl wf" x="${cx - 13}" y="${ytop + 137}" width="26" height="6"/><rect class="mt" x="${cx + 13}" y="${ytop + 134}" width="4" height="12"/>`;
  if (o.stopper !== false) s += `<path class="gl wf" d="M${cx - 6},${ytop} L${cx - 5},${ytop - 6} C${cx - 12},${ytop - 9} ${cx - 10},${ytop - 22} ${cx},${ytop - 22} C${cx + 10},${ytop - 22} ${cx + 12},${ytop - 9} ${cx + 5},${ytop - 6} L${cx + 6},${ytop} Z"/>`;
  return s;
}
function funnel(cx, ytop, w, stem, paper) {
  let s = `<path class="gl" d="M${cx - w / 2},${ytop} L${cx - 4},${ytop + w * 0.62} L${cx - 3},${ytop + w * 0.62 + stem} M${cx + w / 2},${ytop} L${cx + 4},${ytop + w * 0.62} L${cx + 3},${ytop + w * 0.62 + stem}"/>`;
  if (paper) s += `<path class="paper" d="M${cx - w / 2 + 6},${ytop + 2} L${cx},${ytop + w * 0.62 - 3} L${cx + w / 2 - 6},${ytop + 2}"/>`;
  return s;
}
function bath(x1, x2, ytop, yb, lev) { return vessel(`M${x1},${ytop} L${x1},${yb} L${x2},${yb} L${x2},${ytop}`, lev).replace(/class="gl"/g, 'class="metal"'); }
function mantle(cx, yb, w, h) { return `<path class="mant" d="M${cx - w / 2},${yb} L${cx - w / 2},${yb - h} L${cx - w / 2 + 10},${yb - h} A${w / 2 - 10},${h - 8} 0 0 0 ${cx + w / 2 - 10},${yb - h} L${cx + w / 2},${yb - h} L${cx + w / 2},${yb} Z"/>`; }
function cond(x1, y1, L, deg, o) {
  o = o || {}; const rad = deg * Math.PI / 180, c = Math.cos(rad), s_ = Math.sin(rad);
  const P = (u, v) => [x1 + u * c - v * s_, y1 + u * s_ + v * c];
  let g = `<g transform="translate(${f(x1)},${f(y1)}) rotate(${deg})">`;
  g += `<path class="gl" d="M0,-5 L${L},-5 M0,5 L${L},5"/>`;
  g += `<path class="gl" d="M${L * 0.14},-5 L${L * 0.14},-15 L${L * 0.86},-15 L${L * 0.86},-5 M${L * 0.14},5 L${L * 0.14},15 L${L * 0.86},15 L${L * 0.86},5"/>`;
  g += `<rect class="liq" x="${L * 0.14}" y="-15" width="${L * 0.72}" height="10" opacity="0.7"/><rect class="liq" x="${L * 0.14}" y="5" width="${L * 0.72}" height="10" opacity="0.7"/>`;
  const sgn = o.nubSide || -1;
  g += `<path class="gl" d="M${L * 0.2 - 3},${sgn * 15} L${L * 0.2 - 3},${sgn * 27} M${L * 0.2 + 3},${sgn * 15} L${L * 0.2 + 3},${sgn * 27} M${L * 0.8 - 3},${sgn * 15} L${L * 0.8 - 3},${sgn * 27} M${L * 0.8 + 3},${sgn * 15} L${L * 0.8 + 3},${sgn * 27}"/>`;
  g += '</g>';
  return { s: g, nubA: P(L * 0.2, sgn * 27), nubB: P(L * 0.8, sgn * 27), P };
}
function desic(cx, yb) {
  const d = `M${cx - 52},${yb - 82} L${cx - 46},${yb} L${cx + 46},${yb} L${cx + 52},${yb - 82}`;
  let s = `<path class="gl" d="${d}"/><path class="gl wf" d="M${cx - 58},${yb - 82} L${cx + 58},${yb - 82} Q${cx},${yb - 122} ${cx - 58},${yb - 82} Z"/><rect class="mt" x="${cx - 6}" y="${yb - 108}" width="12" height="8" rx="3"/><line class="dash2" x1="${cx - 48}" x2="${cx + 48}" y1="${yb - 30}" y2="${yb - 30}"/>`;
  for (let i = 0; i < 16; i++) s += `<circle class="gl wf" cx="${cx - 38 + (i % 8) * 11 + (i > 7 ? 5 : 0)}" cy="${yb - 8 - (i > 7 ? 10 : 0)}" r="4.2"/>`;
  return s;
}
function watch(cx, cy) { return `<circle class="gl wf" cx="${cx}" cy="${cy}" r="18"/><rect class="mt" x="${cx - 3}" y="${cy - 25}" width="6" height="6"/><line class="rod2" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 12}"/><line class="rod2" x1="${cx}" y1="${cy}" x2="${cx + 9}" y2="${cy + 5}"/>`; }
function meter(cx, cy, t) { return `<circle class="gl wf" cx="${cx}" cy="${cy}" r="12"/><text class="mtr" x="${cx}" y="${cy + 4.5}" text-anchor="middle">${t}</text>`; }
function heat(x, y) { return arrow(x, y + 22, x, y + 2, 'arh') + note('heat', x, y + 34, 'middle', 'nt'); }
function ice(cx, yb, w, h) { let s = beaker(cx, yb, w, h, 0.62); for (let i = 0; i < 7; i++) { const x = cx - w / 2 + 8 + i * (w - 16) / 6.5; s += `<rect class="ice" x="${f(x)}" y="${f(yb - h * 0.62 + 3 + (i % 2) * 6)}" width="9" height="9" transform="rotate(${i * 13} ${f(x + 4)} ${f(yb - h * 0.6 + 6)})"/>`; } return s; }
