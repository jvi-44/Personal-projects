/* Virtual Physics Lab: tabletop simulation framework.
   A sim definition (VPL.def) describes hidden apparatus constants, controls, the scene drawing,
   meters, close-up instruments, the results table and the suggested graph. The framework supplies
   the stage (with a magnifying loupe and draggable rules), stopwatch, meters, table, plot and checks. */
(function () {
  'use strict';
  const VPL = (window.VPL = window.VPL || {});
  VPL.sims = VPL.sims || {};
  VPL.def = (id, d) => { d.id = id; VPL.sims[id] = d; };

  // ---------- utilities ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('vpl:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vpl:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  VPL.store = store;
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.uni = (lo, hi) => lo + (hi - lo) * r();
    r.gauss = (m = 0, s = 1) => { const u = 1 - r(), v = r(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  }
  VPL.rng = rng;
  const gauss = () => { const u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  VPL.gauss = gauss;
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  VPL.el = el;
  const fmtRes = (v, res) => { const d = Math.max(0, Math.round(-Math.log10(res))); return v.toFixed(d); };
  VPL.fmt = (v, sf = 3) => {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) { const e = Math.floor(Math.log10(a)); return (v / 10 ** e).toFixed(sf - 1) + '×10' + String(e).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); }
    const d = Math.max(0, sf - 1 - Math.floor(Math.log10(a)));
    return v.toFixed(d);
  };
  const css = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;

  // ---------- scene drawing kit (world units: cm, y down) ----------
  function kit(ctx, scale) {
    const px = 1 / scale;
    const K = {
      ctx, px, scale,
      ink: '#1d2633', wood: '#e9d3a8', steel: '#8d99a6', brass: '#c79a3c',
      line(x1, y1, x2, y2, w = 1.5, c = K.ink) { ctx.strokeStyle = c; ctx.lineWidth = w * px; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); },
      path(pts, w = 1.5, c = K.ink, close = false, fill = null) {
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (w) { ctx.strokeStyle = c; ctx.lineWidth = w * px; ctx.stroke(); }
      },
      rect(x, y, w, h, fill, stroke = K.ink, lw = 1) { if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw * px; ctx.strokeRect(x, y, w, h); } },
      circle(x, y, r, fill, stroke = K.ink, lw = 1) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw * px; ctx.stroke(); } },
      text(x, y, s, size = 12, c = K.ink, align = 'left', weight = 500) {
        ctx.fillStyle = c; ctx.font = `${weight} ${size * px}px "Source Sans 3", system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
      },
      bench(y, x0 = -1000, x1 = 1000) { K.rect(x0, y, x1 - x0, 6, '#b88a5a', null); K.line(x0, y, x1, y, 2, '#6d4c2e'); },
      stand(x, yBase, h, side = 1) {
        K.rect(x - 7 * (side > 0 ? 0.3 : 0.7), yBase - 1.2, 10, 1.2, '#4b5563', '#1f2937');
        K.rect(x - 0.35, yBase - h, 0.7, h - 1.2, '#9aa5b1', '#4b5563', 0.8);
      },
      boss(x, y) { K.rect(x - 1.3, y - 1.3, 2.6, 2.6, '#6b7280', '#1f2937'); K.circle(x, y, 0.35, '#d1d5db', '#1f2937', 0.6); },
      clampRod(x1, y, x2) { K.rect(Math.min(x1, x2), y - 0.35, Math.abs(x2 - x1), 0.7, '#9aa5b1', '#4b5563', 0.8); },
      spring(x1, y1, x2, y2, o = {}) {
        const coils = o.coils || 18, r = o.r || 0.6, hook = o.hook ?? 0.8;
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        const a = hook, b = L - hook;
        if (hook) { K.circle(x1 + ux * hook * 0.5, y1 + uy * hook * 0.5, hook * 0.5, null, o.c || '#374151', 1.4); K.circle(x2 - ux * hook * 0.5, y2 - uy * hook * 0.5, hook * 0.5, null, o.c || '#374151', 1.4); }
        const pts = [];
        const n = coils * 2;
        for (let i = 0; i <= n; i++) {
          const s = a + (b - a) * (i / n), w = i === 0 || i === n ? 0 : (i % 2 ? r : -r);
          pts.push([x1 + ux * s + nx * w, y1 + uy * s + ny * w]);
        }
        K.path(pts, o.lw || 1.4, o.c || '#374151');
      },
      string(x1, y1, x2, y2, c = '#7a5c2e') { K.line(x1, y1, x2, y2, 1.2, c); },
      bob(x, y, r = 1.25, c = '#a28a4a') { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#efe2b0'); g.addColorStop(1, c); K.circle(x, y, r, g, '#4b3d1b', 1); },
      hanger(x, y, n = 2, label) { // y = hook top
        K.line(x, y, x, y + 1.5, 1.4, '#374151');
        for (let i = 0; i < n; i++) K.rect(x - 2, y + 1.5 + i * 0.7, 4, 0.62, i % 2 ? '#9ca3af' : '#b7bec7', '#374151', 0.6);
        if (label) K.text(x + 2.6, y + 1.5 + n * 0.35, label, 11, '#374151');
      },
      rule(x, y, len, ang = 0, o = {}) {
        // metre rule / half-metre rule: zero end at (x,y), extends along ang (deg, 0 = right). Width 2.6 cm.
        const w = o.w || 2.6, start = o.start || 0;
        ctx.save(); ctx.translate(x, y); ctx.rotate((ang * Math.PI) / 180);
        K.rect(-0.4, 0, len + 0.8, w, o.fill || '#f3e6c4', '#7c6a45', 1);
        for (let mm = 0; mm <= len * 10; mm++) {
          const L = mm % 10 === 0 ? 0.9 : mm % 5 === 0 ? 0.65 : 0.4;
          K.line(mm / 10, 0, mm / 10, L, mm % 10 === 0 ? 1.0 : 0.6, '#1d2633');
        }
        for (let cm = 0; cm <= len; cm++) if (cm % (o.every || 1) === 0) K.text(cm, 1.35, String(cm + start), 8.5, '#1d2633', 'center', 600);
        if (o.label) K.text(len / 2, w - 0.5, o.label, 8, '#7c6a45', 'center');
        ctx.restore();
      },
      protractor(x, y, r, rot = 0) {
        ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180);
        ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 2 * Math.PI); ctx.closePath();
        ctx.fillStyle = 'rgba(210,230,255,0.45)'; ctx.fill(); ctx.strokeStyle = '#3b5b8f'; ctx.lineWidth = px; ctx.stroke();
        for (let d = 0; d <= 180; d++) {
          const a = Math.PI + (d * Math.PI) / 180, L = d % 10 === 0 ? 0.12 * r : d % 5 === 0 ? 0.08 * r : 0.05 * r;
          K.line(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r - L), Math.sin(a) * (r - L), d % 10 ? 0.5 : 0.9, '#1e3a6b');
          if (d % 10 === 0) { const rr = r - 0.2 * r; K.text(Math.cos(a) * rr, Math.sin(a) * rr, String(d), 7, '#1e3a6b', 'center'); }
        }
        K.line(-0.06 * r, 0, 0.06 * r, 0, 0.8, '#1e3a6b'); K.line(0, 0, 0, -0.06 * r, 0.8, '#1e3a6b');
        ctx.restore();
      },
      meterBox(x, y, label, val, unit, w = 9) {
        K.rect(x, y, w, 4.6, '#2b313a', '#111', 1);
        K.rect(x + 0.5, y + 0.5, w - 1, 2.4, '#b9d3a6', '#111', 0.6);
        K.text(x + w - 0.8, y + 1.75, val, 15, '#16220f', 'right', 700);
        K.text(x + 0.8, y + 3.7, label, 9, '#e5e7eb', 'left', 600);
        K.text(x + w - 0.8, y + 3.7, unit, 9, '#e5e7eb', 'right', 600);
      },
      resistor(x1, y1, x2, y2, label) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
        K.line(-L / 2, 0, -1.4, 0, 1.6); K.line(1.4, 0, L / 2, 0, 1.6); K.rect(-1.4, -0.5, 2.8, 1, '#f8fafc', K.ink, 1.3);
        ctx.restore();
        if (label) K.text(mx, my - 1.2, label, 10, K.ink, 'center', 600);
      },
      cell(x1, y1, x2, y2, label) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
        K.line(-L / 2, 0, -0.25, 0, 1.6); K.line(0.25, 0, L / 2, 0, 1.6); K.line(-0.25, -1, -0.25, 1, 1.6); K.line(0.25, -0.5, 0.25, 0.5, 3);
        ctx.restore();
        if (label) K.text(mx, my - 1.5, label, 10, K.ink, 'center', 600);
      },
      cap(x1, y1, x2, y2, label) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
        K.line(-L / 2, 0, -0.25, 0, 1.6); K.line(0.25, 0, L / 2, 0, 1.6); K.line(-0.25, -0.9, -0.25, 0.9, 2.2); K.line(0.25, -0.9, 0.25, 0.9, 2.2);
        ctx.restore();
        if (label) K.text(mx, my - 1.5, label, 10, K.ink, 'center', 600);
      },
      dial(x, y, r, label, unit) { K.circle(x, y, r, '#f8fafc', K.ink, 1.3); K.text(x, y, label, 11, K.ink, 'center', 700); if (unit) K.text(x, y + r + 0.8, unit, 9, K.ink, 'center'); },
      node(x, y) { K.circle(x, y, 0.22, K.ink, null); },
      wire(pts, c = '#1d2633') { K.path(pts, 1.6, c); },
      switchSym(x1, y, x2, closed, label) {
        K.circle(x1, y, 0.22, '#fff', K.ink, 1); K.circle(x2, y, 0.22, '#fff', K.ink, 1);
        if (closed) K.line(x1, y, x2, y, 1.6); else K.line(x1, y, x2 - 0.3, y - (x2 - x1) * 0.5, 1.6);
        if (label) K.text((x1 + x2) / 2, y - 1.3, label, 10, K.ink, 'center', 600);
      },
    };
    return K;
  }
  VPL.kit = kit;

  // ---------- close-up instruments ----------
  function drawMicrometer(cv, reading, opts = {}) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(0, 0, W, H);
    const s = W / 330, cy = H * 0.5;            // px per "unit"
    const mmPx = 22 * s;                         // sleeve: px per mm
    const edge = W * 0.62;                       // thimble edge x
    // sleeve
    ctx.fillStyle = '#cfd5dc'; ctx.fillRect(0, cy - 26 * s, edge, 52 * s);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(edge, cy); ctx.stroke();
    const whole = Math.floor(reading * 2) / 2;   // sleeve shows mm and half-mm
    ctx.font = `${11 * s}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.fillStyle = '#111';
    for (let v = 0; v <= 25; v += 0.5) {
      const x = edge - (reading - v) * mmPx;
      if (x < 4 || x > edge) continue;
      ctx.beginPath();
      if (v % 1 === 0) { ctx.moveTo(x, cy); ctx.lineTo(x, cy - 12 * s); if (v % 5 === 0) ctx.fillText(String(v), x, cy - 16 * s); }
      else { ctx.moveTo(x, cy); ctx.lineTo(x, cy + 10 * s); }
      ctx.stroke();
    }
    // thimble
    ctx.fillStyle = '#b8c0c9'; ctx.fillRect(edge, cy - 40 * s, W - edge, 80 * s);
    ctx.strokeStyle = '#111'; ctx.strokeRect(edge, cy - 40 * s, W - edge, 80 * s);
    const frac = (reading - whole) * 100;        // thimble divisions (0.01 mm), 0..50
    const divPx = 5.2 * s;
    ctx.textAlign = 'left';
    for (let k = -12; k <= 12; k++) {
      const div = Math.round(frac) + k, y = cy - (div - frac) * divPx;
      if (y < cy - 38 * s || y > cy + 38 * s) continue;
      const d = ((div % 50) + 50) % 50;
      ctx.beginPath(); ctx.moveTo(edge, y); ctx.lineTo(edge + (d % 5 === 0 ? 16 : 9) * s, y); ctx.stroke();
      if (d % 5 === 0) ctx.fillText(String(d), edge + 19 * s, y + 4 * s);
    }
    ctx.fillStyle = '#334155'; ctx.font = `600 ${10 * s}px "Source Sans 3", sans-serif`;
    ctx.fillText(opts.label || 'sleeve: mm (upper) and half-mm (lower)   thimble: 0.01 mm', 6 * s, H - 8 * s);
  }
  function drawVernier(cv, reading, opts = {}) {
    // reading in cm; main scale mm, vernier 20 divisions over 39 mm? use 10 divisions over 9 mm (0.01 cm)
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(0, 0, W, H);
    const s = W / 330, mmPx = 9 * s, y0 = H * 0.46;
    const origin = W * 0.18 - reading * 10 * mmPx + 3.0 * 10 * mmPx * 0; // main-scale zero position
    const zeroX = W * 0.25;                        // vernier zero sits here
    const mainZero = zeroX - reading * 10 * mmPx;
    ctx.fillStyle = '#d6dbe1'; ctx.fillRect(0, y0 - 40 * s, W, 40 * s);
    ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 1;
    ctx.font = `${11 * s}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
    for (let mm = 0; mm <= 200; mm++) {
      const x = mainZero + mm * mmPx; if (x < 2 || x > W - 2) continue;
      const L = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 13 : 8;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - L * s); ctx.stroke();
      if (mm % 10 === 0) ctx.fillText(String(mm / 10), x, y0 - 22 * s);
    }
    ctx.fillStyle = '#c3cad3'; ctx.fillRect(zeroX - 12 * s, y0, 9 * mmPx + 24 * s, 34 * s);
    ctx.fillStyle = '#111';
    for (let k = 0; k <= 10; k++) {
      const x = zeroX + k * 0.9 * mmPx;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + (k % 5 === 0 ? 16 : 10) * s); ctx.stroke();
      if (k % 5 === 0) ctx.fillText(String(k), x, y0 + 27 * s);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#334155'; ctx.font = `600 ${10 * s}px "Source Sans 3", sans-serif`;
    ctx.fillText(opts.label || 'main scale: cm/mm   vernier: 10 divisions = 0.01 cm each', 6 * s, H - 8 * s);
    void origin;
  }
  VPL.drawMicrometer = drawMicrometer;
  VPL.drawVernier = drawVernier;

  // ---------- plotting ----------
  function linfit(xs, ys) {
    const n = xs.length; if (n < 2) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; }
    if (!sxx) return null;
    const m = sxy / sxx; return { m, c: my - m * mx, r2: syy ? (sxy * sxy) / (sxx * syy) : 1 };
  }
  VPL.linfit = linfit;
  function niceTicks(lo, hi, n = 5) {
    const span = hi - lo; if (span <= 0) return [lo];
    const raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) || 10 * mag;
    const out = []; for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(+t.toPrecision(12));
    return out;
  }
  function plot(cv, pts, o = {}) {
    const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ink = css('--ink', '#14202e'), muted = css('--muted', '#5b6878'), line = css('--line', '#d8dee6'), acc = css('--accent', '#1550c8');
    ctx.clearRect(0, 0, W, H);
    if (!pts.length) { ctx.fillStyle = muted; ctx.font = '14px "Source Sans 3", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Add at least two complete rows to see the graph.', W / 2, H / 2); return null; }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (o.origin) { x0 = Math.min(0, x0); y0 = Math.min(0, y0); x1 = Math.max(0, x1); y1 = Math.max(0, y1); }
    const px = (x1 - x0) * 0.08 || 1, py = (y1 - y0) * 0.1 || 1; x0 -= o.origin && x0 === 0 ? 0 : px; x1 += px; y0 -= o.origin && y0 === 0 ? 0 : py; y1 += py;
    const L = 58, R = W - 14, T = 14, B = H - 40;
    const sx = (v) => L + ((v - x0) / (x1 - x0)) * (R - L), sy = (v) => B - ((v - y0) / (y1 - y0)) * (B - T);
    ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillStyle = muted; ctx.strokeStyle = line; ctx.lineWidth = 1;
    niceTicks(x0, x1).forEach((t) => { const X = sx(t); ctx.beginPath(); ctx.moveTo(X, T); ctx.lineTo(X, B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(VPL.fmt(t, 3), X, B + 14); });
    niceTicks(y0, y1).forEach((t) => { const Y = sy(t); ctx.beginPath(); ctx.moveTo(L, Y); ctx.lineTo(R, Y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(VPL.fmt(t, 3), L - 5, Y + 4); });
    ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = '600 12px "Source Sans 3", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.xl || 'x', (L + R) / 2, H - 6);
    ctx.save(); ctx.translate(13, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.yl || 'y', 0, 0); ctx.restore();
    const fit = o.fit === false ? null : linfit(xs, ys);
    if (fit) { ctx.strokeStyle = acc; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx(x0), sy(fit.m * x0 + fit.c)); ctx.lineTo(sx(x1), sy(fit.m * x1 + fit.c)); ctx.stroke(); }
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    pts.forEach(([a, b]) => { const X = sx(a), Y = sy(b); ctx.beginPath(); ctx.moveTo(X - 4, Y - 4); ctx.lineTo(X + 4, Y + 4); ctx.moveTo(X - 4, Y + 4); ctx.lineTo(X + 4, Y - 4); ctx.stroke(); });
    return fit;
  }
  VPL.plot = plot;

  // ---------- the Lab ----------
  class Lab {
    constructor(root, def) {
      this.root = root; this.def = def; this.id = def.id;
      this.seed = store.get(def.id + ':seed', Math.floor(Math.random() * 1e9));
      store.set(def.id + ':seed', this.seed);
      this.reset();
      this.build();
      this.running = true;
      this.last = performance.now();
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    }
    reset() {
      const def = this.def;
      this.H = def.hidden ? def.hidden(rng(this.seed)) : {};
      const c = {};
      (def.controls || []).forEach((k) => (c[k.id] = store.get(def.id + ':c:' + k.id, k.value)));
      this.S = { t: 0, c, h: this.H, mov: {}, lab: this };
      (def.movables || []).forEach((m) => (this.S.mov[m.id] = Object.assign({}, m, store.get(def.id + ':m:' + m.id, {}))));
      def.init && def.init(this.S);
    }
    destroy() { this.running = false; }
    build() {
      const def = this.def, S = this.S;
      this.root.innerHTML = '';
      const head = el('div', { class: 'lab-head' },
        el('div', { class: 'lab-intro', html: def.intro || '' }),
        el('div', { class: 'lab-seed' },
          el('span', { class: 'chip' }, 'Apparatus set #' + String(this.seed % 10000).padStart(4, '0')),
          el('button', { class: 'btn ghost', onclick: () => { this.seed = Math.floor(Math.random() * 1e9); store.set(def.id + ':seed', this.seed); this.reset(); this.build(); }, title: 'Swap to a new set of apparatus with slightly different properties' }, 'New apparatus')));
      // stage
      this.cv = el('canvas', { class: 'stage', 'aria-label': 'Experiment tabletop. Hover or press and hold to magnify; drag rules to move them.' });
      this.loupe = el('canvas', { class: 'loupe', width: 220, height: 220, hidden: true });
      const stageWrap = el('div', { class: 'stage-wrap' }, this.cv, this.loupe,
        el('div', { class: 'stage-hint' }, 'Hover (or press and hold) to magnify · drag the rules and protractor'));
      // side panel
      const side = el('div', { class: 'lab-side' });
      if (def.controls && def.controls.length) {
        const box = el('div', { class: 'panel' }, el('h4', {}, 'Apparatus'));
        def.controls.forEach((k) => box.append(this.control(k)));
        side.append(box);
      }
      if (def.meters && def.meters.length) {
        this.meterEls = {};
        const box = el('div', { class: 'panel meters' }, el('h4', {}, 'Meters'));
        def.meters.forEach((m) => {
          const v = el('output', { class: 'meter-val' }, '—');
          this.meterEls[m.id] = v;
          box.append(el('div', { class: 'meter' }, el('span', { class: 'meter-lab' }, m.label), v, el('span', { class: 'meter-unit' }, m.unit || '')));
        });
        side.append(box);
      }
      if (def.stopwatch !== false) side.append(this.stopwatch());
      if (def.speed) {
        const sel = el('select', { id: def.id + '-speed', onchange: (e) => (this.speed = +e.target.value) }, ...def.speed.map((v) => el('option', { value: v }, '×' + v)));
        this.speed = def.speed[0];
        side.append(el('div', { class: 'panel' }, el('h4', {}, 'Time'), el('label', { class: 'ctl' }, el('span', {}, 'Simulation speed'), sel),
          el('p', { class: 'small' }, 'The stopwatch measures simulated time, so readings stay correct at any speed.')));
      }
      if (def.actions) {
        const box = el('div', { class: 'panel' }, el('h4', {}, 'Actions'));
        def.actions.forEach((a) => box.append(el('button', { class: 'btn', onclick: () => { a.run(this.S); this.persist(); } }, a.label)));
        side.append(box);
      }
      const main = el('div', { class: 'lab-main' }, stageWrap, side);
      // close-ups
      let close = null;
      if (def.closeups && def.closeups.length) {
        close = el('div', { class: 'closeups' });
        def.closeups.forEach((cu) => close.append(this.closeup(cu)));
      }
      // steps
      let steps = null;
      if (def.steps) {
        const done = store.get(def.id + ':steps', []);
        steps = el('ol', { class: 'steps' }, ...def.steps.map((s, i) => {
          const cb = el('input', { type: 'checkbox', id: `${def.id}-st${i}`, onchange: (e) => { const d = store.get(def.id + ':steps', []); d[i] = e.target.checked; store.set(def.id + ':steps', d); } });
          cb.checked = !!done[i];
          return el('li', {}, el('label', { for: `${def.id}-st${i}` }, cb, el('span', { html: s })));
        }));
      }
      this.root.append(head, steps ? el('details', { class: 'steps-box', open: true }, el('summary', {}, 'Procedure (from the paper)'), steps) : '', main, close || '', this.dataSection());
      this.fit(); this.bindStage();
      this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(stageWrap);
    }
    control(k) {
      const id = `${this.def.id}-${k.id}`;
      const S = this.S;
      const out = el('output', { for: id });
      const show = () => (out.textContent = (k.fmt ? k.fmt(S.c[k.id]) : S.c[k.id]) + (k.unit ? ' ' + k.unit : ''));
      let input;
      if (k.type === 'select') {
        input = el('select', { id }, ...k.options.map((o) => el('option', { value: o.value ?? o }, o.label ?? o)));
        input.value = S.c[k.id];
      } else if (k.type === 'toggle') {
        input = el('button', { id, class: 'btn toggle', type: 'button' });
        const lab = () => { input.textContent = k.labels ? k.labels[S.c[k.id] ? 1 : 0] : (S.c[k.id] ? 'On' : 'Off'); input.classList.toggle('on', !!S.c[k.id]); };
        input.addEventListener('click', () => { S.c[k.id] = !S.c[k.id]; lab(); this.changed(k); });
        lab();
        return el('div', { class: 'ctl' }, el('span', {}, k.label), input);
      } else if (k.type === 'buttons') {
        const wrap = el('div', { class: 'seg', role: 'group', 'aria-label': k.label });
        k.options.forEach((o) => {
          const v = o.value ?? o;
          const b = el('button', { type: 'button', class: 'seg-b' + (S.c[k.id] == v ? ' on' : ''), onclick: () => { S.c[k.id] = v; wrap.querySelectorAll('.seg-b').forEach((x) => x.classList.remove('on')); b.classList.add('on'); this.changed(k); } }, o.label ?? String(o));
          wrap.append(b);
        });
        return el('div', { class: 'ctl' }, el('span', {}, k.label), wrap);
      } else if (k.type === 'number') {
        input = el('input', { id, type: 'number', step: k.step || 'any', inputmode: 'decimal', class: 'num' });
        input.value = S.c[k.id] ?? '';
      } else {
        input = el('input', { id, type: 'range', min: k.min, max: k.max, step: k.step || 1 });
        input.value = S.c[k.id];
      }
      input.addEventListener('input', () => { S.c[k.id] = k.type === 'select' && typeof k.value === 'string' ? input.value : +input.value; show(); this.changed(k); });
      show();
      return el('label', { class: 'ctl', for: id }, el('span', {}, k.label, k.type !== 'select' && k.type !== 'number' && !k.hideValue ? out : ''), input);
    }
    changed(k) { store.set(this.def.id + ':c:' + k.id, this.S.c[k.id]); this.def.onchange && this.def.onchange(this.S, k.id); }
    persist() { }
    stopwatch() {
      const disp = el('output', { class: 'sw-disp' }, '0.00');
      const sw = (this.sw = { on: false, t: 0, laps: [] });
      const laps = el('div', { class: 'sw-laps' });
      const render = () => { disp.textContent = sw.t.toFixed(2); };
      const go = el('button', { class: 'btn primary', onclick: () => { sw.on = !sw.on; go.textContent = sw.on ? 'Stop' : 'Start'; } }, 'Start');
      const lap = el('button', { class: 'btn', onclick: () => { if (sw.on) { sw.laps.push(sw.t); laps.prepend(el('span', {}, `lap ${sw.laps.length}: ${sw.t.toFixed(2)} s`)); } } }, 'Lap');
      const rst = el('button', { class: 'btn ghost', onclick: () => { sw.on = false; sw.t = 0; sw.laps = []; laps.innerHTML = ''; go.textContent = 'Start'; render(); } }, 'Reset');
      sw.render = render;
      return el('div', { class: 'panel sw' }, el('h4', {}, 'Stopwatch'), el('div', { class: 'sw-row' }, disp, el('span', { class: 'meter-unit' }, 's')), el('div', { class: 'sw-btns' }, go, lap, rst), laps,
        el('p', { class: 'small' }, 'Keyboard: press Space to start/stop while the stage is focused.'));
    }
    closeup(cu) {
      const cv = el('canvas', { width: 660, height: 200, class: 'closeup-cv' });
      let n = 0;
      const val = () => cu.get(this.S, n);
      const draw = () => (cu.type === 'micrometer' ? drawMicrometer : drawVernier)(cv, val(), cu);
      const again = el('button', { class: 'btn ghost', onclick: () => { n++; draw(); } }, cu.again || 'Measure at another point');
      const zero = cu.zero ? el('button', { class: 'btn ghost', onclick: () => { (cu.type === 'micrometer' ? drawMicrometer : drawVernier)(cv, cu.zero(this.S), cu); } }, 'Close jaws (check zero)') : '';
      setTimeout(draw, 0);
      return el('div', { class: 'panel closeup' }, el('h4', {}, cu.title), el('p', { class: 'small', html: cu.help || '' }), cv, el('div', { class: 'sw-btns' }, again, zero));
    }
    // ----- stage -----
    fit() {
      const w = this.def.world;
      const box = this.cv.parentElement.getBoundingClientRect();
      let W = Math.max(280, box.width), H = W * (w.h / w.w);
      const maxH = Math.max(320, Math.min(window.innerHeight * 0.8, 780));
      if (H > maxH) { H = maxH; W = H * (w.w / w.h); }
      this.cv.style.width = W + 'px';
      const dpr = window.devicePixelRatio || 1;
      this.cv.style.height = H + 'px';
      this.cv.width = W * dpr; this.cv.height = H * dpr;
      this.dpr = dpr; this.scale = (W / w.w); this.cssW = W; this.cssH = H;
    }
    toWorld(ev) {
      const r = this.cv.getBoundingClientRect(), w = this.def.world;
      return { x: w.x + (ev.clientX - r.left) / this.scale, y: w.y + (ev.clientY - r.top) / this.scale, sx: ev.clientX - r.left, sy: ev.clientY - r.top };
    }
    hitMovable(p) {
      const mv = Object.values(this.S.mov).reverse();
      for (const m of mv) {
        const a = ((m.angle || 0) * Math.PI) / 180, dx = p.x - m.x, dy = p.y - m.y;
        const u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a);
        if (m.type === 'rule' && u > -1 && u < m.len + 1 && v > -0.5 && v < (m.w || 2.6) + 0.5) return m;
        if (m.type === 'protractor' && Math.hypot(dx, dy) < m.r && v < 0.5) return m;
      }
      return null;
    }
    bindStage() {
      const cv = this.cv; cv.tabIndex = 0;
      let drag = null, hold = null;
      const showLoupe = (p) => { this.loupeAt = p; this.loupe.hidden = false; };
      cv.addEventListener('pointerdown', (ev) => {
        const p = this.toWorld(ev); const m = this.hitMovable(p);
        if (m && m.drag !== false) { drag = { m, dx: p.x - m.x, dy: p.y - m.y }; cv.setPointerCapture(ev.pointerId); ev.preventDefault(); return; }
        if (this.def.click && this.def.click(this.S, p)) return;
        if (ev.pointerType !== 'mouse') { hold = setTimeout(() => showLoupe(p), 180); cv.setPointerCapture(ev.pointerId); }
      });
      cv.addEventListener('pointermove', (ev) => {
        const p = this.toWorld(ev);
        if (drag) { drag.m.x = p.x - drag.dx; drag.m.y = p.y - drag.dy; if (drag.m.lockY != null) drag.m.y = drag.m.lockY; if (drag.m.lockX != null) drag.m.x = drag.m.lockX; this.loupeAt = p; this.loupe.hidden = false; return; }
        if (ev.pointerType === 'mouse' || !this.loupe.hidden) showLoupe(p);
      });
      const end = () => { if (drag) store.set(this.def.id + ':m:' + drag.m.id, { x: drag.m.x, y: drag.m.y, angle: drag.m.angle }); drag = null; clearTimeout(hold); };
      cv.addEventListener('pointerup', (ev) => { end(); if (ev.pointerType !== 'mouse') this.loupe.hidden = true; });
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('pointerleave', () => { if (!drag) this.loupe.hidden = true; });
      cv.addEventListener('keydown', (ev) => { if (ev.code === 'Space' && this.sw) { ev.preventDefault(); this.sw.on = !this.sw.on; this.root.querySelector('.sw .btn.primary').textContent = this.sw.on ? 'Stop' : 'Start'; } });
      cv.addEventListener('wheel', (ev) => {
        if (!this.loupe.hidden && ev.shiftKey) { ev.preventDefault(); this.zoom = Math.max(2, Math.min(12, (this.zoom || this.def.zoom || 5) * (ev.deltaY < 0 ? 1.15 : 0.87))); }
      }, { passive: false });
    }
    render(ctx, scale, ox, oy) {
      const w = this.def.world, S = this.S;
      ctx.save();
      ctx.scale(scale, scale); ctx.translate(-ox, -oy);
      const K = kit(ctx, scale);
      ctx.fillStyle = this.def.bg || '#eef1f4'; ctx.fillRect(w.x - 50, w.y - 50, w.w + 100, w.h + 100);
      this.def.draw(K, S);
      for (const m of Object.values(S.mov)) {
        if (m.type === 'rule') K.rule(m.x, m.y, m.len, m.angle || 0, m);
        if (m.type === 'protractor') K.protractor(m.x, m.y, m.r, m.angle || 0);
      }
      this.def.drawTop && this.def.drawTop(K, S);
      ctx.restore();
    }
    tick(now) {
      if (!this.running) return;
      if (!this.root.isConnected) { this.running = false; this.ro && this.ro.disconnect(); return; }
      let dt = Math.min(0.1, (now - this.last) / 1000) * (this.speed || 1); this.last = now;
      const S = this.S;
      if (this.def.step) { const n = Math.max(1, Math.ceil(dt / (this.def.dt || 1 / 240))); for (let i = 0; i < n; i++) { this.def.step(S, dt / n); S.t += dt / n; } } else S.t += dt;
      if (this.sw && this.sw.on) { this.sw.t += dt; this.sw.render(); }
      const ctx = this.cv.getContext('2d'), w = this.def.world;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.render(ctx, this.scale, w.x, w.y);
      if (!this.loupe.hidden && this.loupeAt) {
        const L = this.loupe, lc = L.getContext('2d'), z = this.zoom || this.def.zoom || 5, R = L.width / 2;
        lc.save(); lc.clearRect(0, 0, L.width, L.height); lc.beginPath(); lc.arc(R, R, R - 2, 0, Math.PI * 2); lc.clip();
        const sc = this.scale * z;
        this.render(lc, sc, this.loupeAt.x - R / sc, this.loupeAt.y - R / sc);
        lc.strokeStyle = 'rgba(220,38,38,0.7)'; lc.lineWidth = 1; lc.beginPath(); lc.moveTo(R, R - 14); lc.lineTo(R, R + 14); lc.moveTo(R - 14, R); lc.lineTo(R + 14, R); lc.stroke();
        lc.restore();
        lc.strokeStyle = '#1d2633'; lc.lineWidth = 3; lc.beginPath(); lc.arc(R, R, R - 2, 0, Math.PI * 2); lc.stroke();
        const lx = Math.min(this.cssW - 230, Math.max(0, this.loupeAt.sx + 24)), ly = Math.max(0, this.loupeAt.sy - 240);
        L.style.left = (this.cv.offsetLeft + lx) + 'px'; L.style.top = ly + 'px';
      }
      if (this.meterEls && (!this.mLast || now - this.mLast > 280)) {
        this.mLast = now;
        for (const m of this.def.meters) {
          let v = m.get(S);
          if (v == null || !isFinite(v)) { this.meterEls[m.id].textContent = m.blank || '—'; continue; }
          if (v !== 0) v += (m.noise || 0) * gauss();
          if (Math.abs(v) < (m.res || 0.01) / 2) v = 0;
          this.meterEls[m.id].textContent = m.fmt ? m.fmt(v) : fmtRes(v, m.res || 0.01);
        }
      }
      requestAnimationFrame(this.tick);
    }
    // ----- results table + plot -----
    dataSection() {
      const def = this.def, T = def.table; if (!T) return '';
      const key = def.id + ':rows';
      let rows = store.get(key, []);
      const cols = T.cols, der = T.derived || [];
      const tbl = el('table', { class: 'res' });
      const plotCv = el('canvas', { class: 'plot' });
      const eqOut = el('div', { class: 'fit-out' });
      const checkOut = el('div', { class: 'check-out' });
      let showDer = store.get(def.id + ':der', true);
      const derToggle = el('button', { class: 'btn ghost', onclick: () => { showDer = !showDer; store.set(def.id + ':der', showDer); draw(); } });
      const P = def.plot || {};
      const xs = P.xs || [], ys = P.ys || [];
      const xSel = el('select', { id: def.id + '-px' }, ...xs.map((a, i) => el('option', { value: i }, a.label)));
      const ySel = el('select', { id: def.id + '-py' }, ...ys.map((a, i) => el('option', { value: i }, a.label)));
      const num = (v) => (v === '' || v == null ? NaN : +String(v).replace(',', '.'));
      const rowVals = (r) => { const o = {}; cols.forEach((c) => (o[c.k] = num(r[c.k]))); der.forEach((d) => { try { o[d.k] = d.f(o, this.S); } catch (e) { o[d.k] = NaN; } }); return o; };
      const save = () => store.set(key, rows);
      const draw = () => {
        derToggle.textContent = showDer ? 'Hide processed columns' : 'Show processed columns';
        tbl.innerHTML = '';
        const hr = el('tr', {}, ...cols.map((c) => el('th', { scope: 'col' }, c.label)), ...(showDer ? der.map((d) => el('th', { scope: 'col', class: 'der' }, d.label)) : []), el('th', {}, ''));
        tbl.append(el('thead', {}, hr));
        const tb = el('tbody');
        rows.forEach((r, i) => {
          const v = rowVals(r);
          const tr = el('tr', {}, ...cols.map((c) => {
            const inp = el('input', { inputmode: 'decimal', value: r[c.k] ?? '', 'aria-label': `${c.label}, row ${i + 1}`, id: `${def.id}-r${i}-${c.k}` });
            inp.addEventListener('change', () => { r[c.k] = inp.value.trim(); save(); draw(); });
            return el('td', {}, inp);
          }), ...(showDer ? der.map((d) => el('td', { class: 'der' }, isFinite(v[d.k]) ? (d.fmt ? d.fmt(v[d.k]) : VPL.fmt(v[d.k], d.sf || 3)) : '')) : []),
          el('td', {}, el('button', { class: 'x', title: 'Delete row', 'aria-label': 'Delete row ' + (i + 1), onclick: () => { rows.splice(i, 1); save(); draw(); } }, '×')));
          tb.append(tr);
        });
        tbl.append(tb);
        // plot
        const ax = xs[+xSel.value || 0], ay = ys[+ySel.value || 0];
        let fit = null;
        if (ax && ay) {
          const pts = rows.map(rowVals).map((v) => [ax.f(v, this.S), ay.f(v, this.S)]).filter((p) => isFinite(p[0]) && isFinite(p[1]));
          fit = plot(plotCv, pts, { xl: ax.label, yl: ay.label, origin: P.origin });
          eqOut.innerHTML = fit ? `Trendline: <b>y = ${VPL.fmt(fit.m, 4)}x ${fit.c < 0 ? '−' : '+'} ${VPL.fmt(Math.abs(fit.c), 4)}</b> &nbsp; R² = ${fit.r2.toFixed(4)}` + (P.result && fit ? `<br>${P.result(fit, this.S)}` : '') : '';
        }
        this.fitNow = fit;
      };
      const add = el('button', { class: 'btn', onclick: () => { const r = {}; if (T.capture) Object.assign(r, T.capture(this.S)); rows.push(r); save(); draw(); } }, T.capture ? 'Add row (records current settings)' : 'Add row');
      const clear = el('button', { class: 'btn ghost', onclick: () => { if (clear.dataset.arm) { rows = []; save(); draw(); clear.textContent = 'Clear table'; delete clear.dataset.arm; } else { clear.dataset.arm = 1; clear.textContent = 'Click again to clear'; setTimeout(() => { delete clear.dataset.arm; clear.textContent = 'Clear table'; }, 2500); } } }, 'Clear table');
      const csv = el('button', { class: 'btn ghost', onclick: async () => {
        const all = [...cols.map((c) => c.label), ...der.map((d) => d.label)];
        const lines = [all.join(',')].concat(rows.map((r) => { const v = rowVals(r); return [...cols.map((c) => r[c.k] ?? ''), ...der.map((d) => (isFinite(v[d.k]) ? v[d.k] : ''))].join(','); }));
        VPL.save && VPL.save(def.id + '-my-data.csv', lines.join('\n'), csv);
      } }, 'Save as CSV');
      const check = el('button', { class: 'btn primary', onclick: () => { checkOut.innerHTML = def.check ? def.check(this.S, this.fitNow, rows.map(rowVals)) : ''; checkOut.hidden = false; } }, 'Check against this apparatus');
      checkOut.hidden = true;
      xSel.addEventListener('change', draw); ySel.addEventListener('change', draw);
      if (P.default) { xSel.value = P.default[0]; ySel.value = P.default[1]; }
      const ro = new ResizeObserver(() => draw()); ro.observe(plotCv);
      setTimeout(draw, 0);
      return el('section', { class: 'lab-data' },
        el('div', { class: 'data-head' }, el('h3', {}, 'Your results'), el('p', { class: 'small', html: T.help || 'Type the readings you take from the tabletop. Processed columns update automatically.' })),
        el('div', { class: 'tbl-wrap' }, tbl),
        el('div', { class: 'sw-btns' }, add, derToggle, csv, clear),
        xs.length ? el('div', { class: 'plot-box' },
          el('div', { class: 'plot-ctl' }, el('label', { for: def.id + '-py' }, 'y-axis ', ySel), el('label', { for: def.id + '-px' }, 'x-axis ', xSel)),
          plotCv, eqOut) : '',
        el('div', { class: 'sw-btns' }, check), checkOut);
    }
  }
  VPL.Lab = Lab;
})();
