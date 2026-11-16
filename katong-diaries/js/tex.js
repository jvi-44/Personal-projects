/* Katong Diaries — procedural textures.
   Every facade is painted on a canvas at load. Each layer has three parts:
     colour  (RGB)   what you see
     tint    (A)     1 = plaster that takes the building's own colour, 0 = keeps its painted colour
     glow    (R8)    window glass that lights up at night
   The layers are stacked into one array texture so a whole tile of buildings is a single draw call. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  KD.rng = rng;

  // layer ids
  var L = KD.LAYER = {
    PLAIN: 0, SH_UP_A: 1, SH_UP_B: 2, SH_UP_C: 3, SH_UP_D: 4, SH_UP_E: 5, SH_UP_F: 6,
    SH_G_HOME: 7, SH_G_SHOP: 8, SH_G_KOPI: 9, HDB: 10, CONDO: 11, GLASS: 12, PANEL: 13, HOUSE: 14,
    INDUSTRIAL: 15, TERRACE_UP: 16, SCHOOL: 17, PARTY: 18, VOID: 19, SHOPGLASS: 20,
    ROOF_TILE: 21, ROOF_FLAT: 22, ROOF_METAL: 23, ARCADE_FLOOR: 24, SOFFIT: 25, HOUSE_G: 26, COUNT: 27
  };

  function mk(S) {
    function c() { var e = document.createElement('canvas'); e.width = e.height = S; return e; }
    var col = c(), tin = c(), glo = c();
    var o = { S: S, col: col, tin: tin, glo: glo, c: col.getContext('2d'), t: tin.getContext('2d'), g: glo.getContext('2d') };
    o.t.fillStyle = '#000'; o.t.fillRect(0, 0, S, S);
    o.g.fillStyle = '#000'; o.g.fillRect(0, 0, S, S);
    return o;
  }
  // rect in 0..1 coordinates on colour / tint / glow
  function R(o, x, y, w, h, color, tint, glow) {
    var S = o.S;
    if (color != null) { o.c.fillStyle = color; o.c.fillRect(x * S, y * S, w * S, h * S); }
    if (tint != null) { var v = Math.round(tint * 255); o.t.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; o.t.fillRect(x * S, y * S, w * S, h * S); }
    if (glow != null) { var u = Math.round(glow * 255); o.g.fillStyle = 'rgb(' + u + ',' + u + ',' + u + ')'; o.g.fillRect(x * S, y * S, w * S, h * S); }
  }
  function grad(o, x, y, w, h, c0, c1, vertical) {
    var S = o.S, g = vertical === false ? o.c.createLinearGradient(x * S, 0, (x + w) * S, 0) : o.c.createLinearGradient(0, y * S, 0, (y + h) * S);
    g.addColorStop(0, c0); g.addColorStop(1, c1); o.c.fillStyle = g; o.c.fillRect(x * S, y * S, w * S, h * S);
  }
  // speckle / stains on the colour canvas (keeps things from looking flat)
  function grime(o, seed, amt, x, y, w, h) {
    var S = o.S, r = rng(seed), c = o.c; x = (x || 0) * S; y = (y || 0) * S; w = (w == null ? 1 : w) * S; h = (h == null ? 1 : h) * S;
    for (var i = 0; i < 260 * amt; i++) {
      var px = x + r() * w, py = y + r() * h, sz = 1 + r() * S * 0.012;
      c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,' + (0.015 + r() * 0.03) + ')' : 'rgba(255,255,255,' + (0.02 + r() * 0.04) + ')';
      c.fillRect(px, py, sz, sz * (0.5 + r() * 3));
    }
    for (i = 0; i < 9 * amt; i++) {   // vertical rain streaks
      var sx = x + r() * w, sy = y + r() * h * 0.3, sh = h * (0.15 + r() * 0.5);
      var g = c.createLinearGradient(0, sy, 0, sy + sh);
      g.addColorStop(0, 'rgba(60,55,45,' + (0.03 + r() * 0.05) + ')'); g.addColorStop(1, 'rgba(60,55,45,0)');
      c.fillStyle = g; c.fillRect(sx, sy, 2 + r() * S * 0.02, sh);
    }
  }
  function wall(o, shade) { R(o, 0, 0, 1, 1, shade || '#f4f2ee', 1, 0); }

  // one shuttered / glazed window. kind: 'louvre' | 'glass' | 'casement'
  function win(o, x, y, w, h, opt) {
    var S = o.S, c = o.c;
    var frame = opt.frame || '#fbfaf6', sh = opt.shutter || '#2f6b57';
    R(o, x - 0.008, y - 0.008, w + 0.016, h + 0.016, 'rgba(0,0,0,0.22)', 0, 0);       // shadow recess
    R(o, x, y, w, h, frame, 0, 0);
    var ix = x + w * 0.09, iw = w * 0.82, iy = y + h * 0.04, ih = h * 0.93;
    if (opt.arch) {                                                                      // fanlight
      var fh = h * 0.2;
      c.save(); c.beginPath(); c.ellipse((x + w / 2) * S, (y + fh) * S, w * 0.46 * S, fh * 0.92 * S, 0, Math.PI, 0); c.closePath();
      var g = c.createLinearGradient(0, y * S, 0, (y + fh) * S); g.addColorStop(0, opt.fan || '#e9b44c'); g.addColorStop(1, '#3d6f8a');
      c.fillStyle = g; c.fill(); c.strokeStyle = frame; c.lineWidth = S * 0.006; c.stroke();
      for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo((x + w / 2) * S, (y + fh) * S); c.lineTo((x + w / 2 + Math.cos(Math.PI * k / 4) * w * 0.46) * S, (y + fh - Math.sin(Math.PI * k / 4) * fh * 0.92) * S); c.stroke(); }
      c.restore();
      o.g.save(); o.g.beginPath(); o.g.ellipse((x + w / 2) * S, (y + fh) * S, w * 0.44 * S, fh * 0.88 * S, 0, Math.PI, 0); o.g.fillStyle = '#ddd'; o.g.fill(); o.g.restore();
      iy = y + fh + h * 0.03; ih = h - fh - h * 0.06;
    } else if (opt.transom) {
      var th = h * 0.15;
      R(o, ix, iy, iw, th, '#31506a', 0, 0.9); R(o, ix + iw * 0.48, iy, iw * 0.04, th, frame, 0, 0);
      iy += th + h * 0.025; ih -= th + h * 0.025;
    }
    if (opt.kind === 'glass' || opt.kind === 'casement') {
      grad(o, ix, iy, iw, ih, '#6f8fa6', '#2c4257'); R(o, ix, iy, iw, ih, null, 0, 1);
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.beginPath(); c.moveTo(ix * S, (iy + ih * 0.55) * S); c.lineTo((ix + iw * 0.6) * S, iy * S); c.lineTo((ix + iw * 0.85) * S, iy * S); c.lineTo(ix * S, (iy + ih * 0.8) * S); c.fill();
      R(o, ix + iw * 0.48, iy, iw * 0.04, ih, frame, 0, 0);
      if (opt.kind === 'casement') { R(o, ix, iy + ih * 0.32, iw, ih * 0.025, frame, 0, 0); R(o, ix, iy + ih * 0.66, iw, ih * 0.025, frame, 0, 0); }
    } else {                                                                              // louvred timber shutters
      R(o, ix, iy, iw, ih, sh, 0, 0);
      var n = Math.round(ih * 46);
      for (var i = 0; i < n; i++) { R(o, ix, iy + ih * (i + 0.6) / n, iw, ih * 0.28 / n, 'rgba(0,0,0,0.28)', null, null); R(o, ix, iy + ih * i / n, iw, ih * 0.16 / n, 'rgba(255,255,255,0.10)', null, null); }
      R(o, ix + iw * 0.485, iy, iw * 0.03, ih, 'rgba(0,0,0,0.45)', 0, 0);
      R(o, ix, iy + ih * 0.5, iw, ih * 0.02, 'rgba(0,0,0,0.3)', 0, 0);
      if (opt.ajar) { R(o, ix + iw * 0.52, iy + ih * 0.03, iw * 0.2, ih * 0.94, '#22303c', 0, 0.8); }
    }
    R(o, x - 0.012, y + h, w + 0.024, 0.014, frame, 0, 0);                              // sill
    R(o, x - 0.012, y + h + 0.014, w + 0.024, 0.008, 'rgba(0,0,0,0.25)', null, null);
  }
  var TILE_COLS = ['#d9697d', '#3f9c8f', '#e8b54a', '#4e7fb8', '#f1ede2', '#b84f6f', '#5aa86b'];
  function tileRow(o, x, y, w, h, seed, n) {
    var r = rng(seed), S = o.S, c = o.c; n = n || Math.max(4, Math.round(w / h));
    var tw = w / n, a = TILE_COLS[(r() * 7) | 0], b = TILE_COLS[(r() * 7) | 0], d = '#f6f1e4';
    for (var i = 0; i < n; i++) {
      var tx = x + i * tw;
      R(o, tx, y, tw, h, d, 0, 0);
      c.fillStyle = a; c.beginPath(); c.moveTo((tx + tw / 2) * S, (y + h * 0.1) * S); c.lineTo((tx + tw * 0.9) * S, (y + h / 2) * S); c.lineTo((tx + tw / 2) * S, (y + h * 0.9) * S); c.lineTo((tx + tw * 0.1) * S, (y + h / 2) * S); c.fill();
      c.fillStyle = b; c.beginPath(); c.arc((tx + tw / 2) * S, (y + h / 2) * S, Math.min(tw, h) * 0.17 * S, 0, 7); c.fill();
      c.strokeStyle = 'rgba(90,80,60,0.35)'; c.lineWidth = 1; c.strokeRect(tx * S, y * S, tw * S, h * S);
    }
  }
  function cornice(o, y, h) {
    R(o, 0, y, 1, h, '#fbf9f4', 0, 0);
    R(o, 0, y + h * 0.28, 1, h * 0.1, 'rgba(0,0,0,0.12)', null, null);
    R(o, 0, y + h * 0.62, 1, h * 0.1, 'rgba(0,0,0,0.10)', null, null);
    R(o, 0, y + h, 1, h * 0.35, 'rgba(0,0,0,0.20)', null, null);
    for (var i = 0; i < 26; i++) R(o, i / 26 + 0.008, y + h * 0.74, 0.02, h * 0.2, 'rgba(0,0,0,0.10)', null, null);   // dentils
  }
  function pilaster(o, x, w, y0, y1) {
    grad(o, x, y0, w, y1 - y0, '#ffffff', '#ebe7dd', false); R(o, x, y0, w, y1 - y0, null, 0, 0);
    R(o, x + w * 0.2, y0 + 0.02, w * 0.6, y1 - y0 - 0.04, 'rgba(0,0,0,0.045)', null, null);
    R(o, x - w * 0.12, y0, w * 1.24, 0.03, '#fdfcf8', 0, 0); R(o, x - w * 0.12, y0 + 0.03, w * 1.24, 0.008, 'rgba(0,0,0,0.2)', null, null); // capital
    R(o, x - w * 0.1, y1 - 0.025, w * 1.2, 0.025, '#f5f2ea', 0, 0);
  }
  function swag(o, cx, y, w) {
    var S = o.S, c = o.c; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = S * 0.009; c.beginPath();
    c.moveTo((cx - w / 2) * S, y * S); c.quadraticCurveTo(cx * S, (y + w * 0.5) * S, (cx + w / 2) * S, y * S); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = S * 0.004; c.beginPath();
    c.moveTo((cx - w / 2) * S, (y + 0.006) * S); c.quadraticCurveTo(cx * S, (y + w * 0.5 + 0.008) * S, (cx + w / 2) * S, (y + 0.006) * S); c.stroke();
    o.t.fillStyle = '#000'; o.t.beginPath(); o.t.arc(cx * S, (y + w * 0.2) * S, S * 0.006, 0, 7); o.t.fill();
  }

  /* ---- shophouse upper storey. v = 0 is the top of the texture (roof line). */
  function shopUpper(S, seed, p) {
    var o = mk(S), r = rng(seed);
    wall(o); grime(o, seed, 1);
    cornice(o, 0, 0.075);
    var pw = 0.085; pilaster(o, 0, pw, 0.075, 0.955); pilaster(o, 1 - pw, pw, 0.075, 0.955);
    // bottom string course + tile dado
    R(o, 0, 0.955, 1, 0.045, '#f8f5ee', 0, 0); R(o, 0, 0.95, 1, 0.008, 'rgba(0,0,0,0.18)', null, null);
    if (p.tiles) tileRow(o, pw + 0.01, 0.865, 1 - 2 * pw - 0.02, 0.075, seed + 5, 9);
    var n = p.n, x0 = pw + 0.035, span = 1 - 2 * pw - 0.07, gap = span * (n === 3 ? 0.07 : 0.14), ww = (span - gap * (n - 1)) / n;
    var wy = p.arch ? 0.2 : 0.23, wh = (p.tiles ? 0.845 : 0.9) - wy;
    for (var i = 0; i < n; i++) {
      win(o, x0 + i * (ww + gap), wy, ww, wh, { kind: p.kind, shutter: p.shutter, arch: p.arch, transom: p.transom, fan: p.fan, ajar: r() < 0.3 });
      if (p.swag) swag(o, x0 + i * (ww + gap) + ww / 2, 0.115, ww * 0.8);
    }
    if (p.plaque) {   // year plaque in the gable
      R(o, 0.4, 0.1, 0.2, 0.075, '#fdfbf5', 0, 0); o.c.fillStyle = '#7b6a55'; o.c.font = 'bold ' + Math.round(S * 0.05) + 'px Georgia,serif'; o.c.textAlign = 'center';
      o.c.fillText(p.plaque, 0.5 * S, 0.158 * S);
    }
    if (p.bands) { for (i = 0; i < 3; i++) R(o, pw, 0.105 + i * 0.03, 1 - 2 * pw, 0.012, 'rgba(255,255,255,0.9)', 0, 0); }
    return o;
  }
  /* ---- shophouse ground storey (the wall at the back of the five-foot way) */
  function shopGround(S, seed, kind) {
    var o = mk(S), r = rng(seed), c = o.c;
    wall(o, '#efede8'); grime(o, seed, 0.8);
    R(o, 0, 0, 1, 0.05, 'rgba(0,0,0,0.35)', null, null);                 // shadow under the ceiling
    if (kind === 'home') {
      // pintu pagar: tall timber doors with a carved half-gate, two shuttered windows, tile dado
      var dx = 0.37, dw = 0.26;
      R(o, dx - 0.02, 0.1, dw + 0.04, 0.9, '#f7f3ea', 0, 0);
      grad(o, dx, 0.13, dw, 0.87, '#5a3a25', '#3e2717'); R(o, dx, 0.13, dw, 0.87, null, 0, 0);
      R(o, dx + dw / 2 - 0.004, 0.13, 0.008, 0.87, 'rgba(0,0,0,0.5)', null, null);
      grad(o, dx + 0.012, 0.5, dw - 0.024, 0.42, '#c9a253', '#8a6a2c'); R(o, dx + 0.012, 0.5, dw - 0.024, 0.42, null, 0, 0);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) R(o, dx + 0.03 + j * (dw / 2 - 0.012), 0.53 + i * 0.095, dw / 2 - 0.05, 0.07, 'rgba(60,30,10,0.35)', null, null);
      R(o, dx + 0.02, 0.15, dw - 0.04, 0.1, '#263847', 0, 0.9);
      for (var s = 0; s < 2; s++) {
        var wx = s === 0 ? 0.07 : 0.7;
        win(o, wx, 0.2, 0.23, 0.48, { kind: 'louvre', shutter: ['#2f6b57', '#3c6f8f', '#7a4b32'][seed % 3], transom: true });
        tileRow(o, wx - 0.03, 0.76, 0.29, 0.1, seed + s * 3 + 1, 4);
      }
      R(o, 0, 0.94, 1, 0.06, '#d8d4cb', 0, 0);
    } else if (kind === 'shop') {
      R(o, 0, 0.05, 1, 0.2, '#f5f2ec', 1, 0);                             // signboard takes the tint
      R(o, 0.04, 0.085, 0.92, 0.13, 'rgba(255,255,255,0.55)', null, null);
      c.fillStyle = 'rgba(40,40,40,0.75)'; for (i = 0; i < 7; i++) c.fillRect((0.12 + i * 0.11) * S, 0.13 * S, 0.07 * S, 0.035 * S);
      grad(o, 0.05, 0.29, 0.9, 0.67, '#3b4b57', '#1d2a33'); R(o, 0.05, 0.29, 0.9, 0.67, null, 0, 1);
      var g = c.createRadialGradient(0.5 * S, 0.5 * S, 0, 0.5 * S, 0.55 * S, 0.5 * S); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(1, 'rgba(255,214,150,0)');
      c.fillStyle = g; c.fillRect(0.05 * S, 0.29 * S, 0.9 * S, 0.67 * S);
      for (i = 0; i < 5; i++) { c.fillStyle = 'rgba(' + (120 + r() * 120 | 0) + ',' + (90 + r() * 90 | 0) + ',' + (70 + r() * 80 | 0) + ',0.75)'; c.fillRect((0.09 + i * 0.17) * S, (0.62 + r() * 0.08) * S, 0.11 * S, 0.2 * S); }
      R(o, 0.05, 0.29, 0.9, 0.018, '#20262b', 0, 0); R(o, 0.34, 0.29, 0.016, 0.67, '#20262b', 0, 0); R(o, 0.64, 0.29, 0.016, 0.67, '#20262b', 0, 0);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.moveTo(0.06 * S, 0.8 * S); c.lineTo(0.3 * S, 0.3 * S); c.lineTo(0.36 * S, 0.3 * S); c.lineTo(0.08 * S, 0.9 * S); c.fill();
      R(o, 0, 0.955, 1, 0.045, '#8d8f8e', 0, 0);
    } else {   // kopitiam: open front, dark interior, tables
      R(o, 0, 0.05, 1, 0.17, '#f5f2ec', 1, 0);
      c.fillStyle = 'rgba(150,30,30,0.8)'; c.font = 'bold ' + Math.round(S * 0.085) + 'px serif'; c.textAlign = 'center'; c.fillText('茶 室', 0.5 * S, 0.165 * S);
      grad(o, 0.03, 0.24, 0.94, 0.76, '#241d18', '#3a2f26'); R(o, 0.03, 0.24, 0.94, 0.76, null, 0, 0.7);
      g = c.createRadialGradient(0.5 * S, 0.4 * S, 0, 0.5 * S, 0.5 * S, 0.55 * S); g.addColorStop(0, 'rgba(255,225,170,0.5)'); g.addColorStop(1, 'rgba(255,225,170,0)');
      c.fillStyle = g; c.fillRect(0.03 * S, 0.24 * S, 0.94 * S, 0.76 * S);
      for (i = 0; i < 3; i++) {
        var tx = 0.16 + i * 0.3; c.fillStyle = '#e8e2d6'; c.beginPath(); c.ellipse(tx * S, 0.8 * S, 0.085 * S, 0.02 * S, 0, 0, 7); c.fill();
        c.fillStyle = '#5b3a22'; c.fillRect((tx - 0.008) * S, 0.8 * S, 0.016 * S, 0.14 * S);
        c.fillStyle = '#b3402f'; c.fillRect((tx - 0.11) * S, 0.86 * S, 0.05 * S, 0.012 * S); c.fillRect((tx + 0.06) * S, 0.86 * S, 0.05 * S, 0.012 * S);
      }
      grad(o, 0.03, 0.24, 0.94, 0.09, '#9aa0a2', '#6e7476'); for (i = 0; i < 6; i++) R(o, 0.03, 0.245 + i * 0.015, 0.94, 0.004, 'rgba(0,0,0,0.3)', null, null);
    }
    return o;
  }

  /* ---- repeating facades. One texture = one storey high. */
  function hdb(S, seed) {
    var o = mk(S), c = o.c;
    wall(o, '#f6f5f1'); grime(o, seed, 0.5);
    R(o, 0, 0.62, 1, 0.38, '#e9e7e1', 1, 0);                               // corridor parapet
    R(o, 0, 0.62, 1, 0.025, 'rgba(0,0,0,0.16)', null, null); R(o, 0, 0.975, 1, 0.025, 'rgba(0,0,0,0.22)', null, null);
    for (var i = 0; i < 4; i++) {
      var x = i * 0.25;
      grad(o, x + 0.035, 0.1, 0.18, 0.5, '#51667a', '#2b3a49'); R(o, x + 0.035, 0.1, 0.18, 0.5, null, 0, 1);
      R(o, x + 0.12, 0.1, 0.01, 0.5, '#e8e8e4', 0, 0); R(o, x + 0.035, 0.1, 0.18, 0.012, '#dcdcd6', 0, 0);
      if (i % 2 === 0) { R(o, x + 0.05, 0.28, 0.06, 0.32, '#' + ['c97b63', '7fa3b8', 'd8b56a', '8fb08a'][(seed + i) % 4], 0, 0); }   // laundry / door
      R(o, x, 0, 0.012, 0.62, 'rgba(0,0,0,0.07)', null, null);
    }
    R(o, 0, 0, 1, 0.07, '#ffffff', 0.35, 0); R(o, 0, 0.07, 1, 0.012, 'rgba(0,0,0,0.15)', null, null);
    return o;
  }
  function condo(S, seed) {
    var o = mk(S), c = o.c;
    wall(o, '#f3f2ef');
    for (var i = 0; i < 2; i++) {
      var x = i * 0.5;
      grad(o, x + 0.05, 0.08, 0.4, 0.9, '#6d8799', '#2e4254'); R(o, x + 0.05, 0.08, 0.4, 0.9, null, 0, 1);
      R(o, x + 0.245, 0.08, 0.01, 0.9, '#d9dcdc', 0, 0);
      c.fillStyle = 'rgba(255,255,255,0.13)'; c.beginPath(); c.moveTo((x + 0.06) * S, 0.7 * S); c.lineTo((x + 0.3) * S, 0.1 * S); c.lineTo((x + 0.38) * S, 0.1 * S); c.lineTo((x + 0.06) * S, 0.9 * S); c.fill();
      R(o, x + 0.02, 0.56, 0.46, 0.4, 'rgba(190,215,225,0.42)', 0, null);   // glass balustrade
      R(o, x + 0.02, 0.55, 0.46, 0.018, '#c9cdcc', 0, 0);
    }
    R(o, 0, 0, 1, 0.07, '#fbfbf9', 0.2, 0); R(o, 0, 0.955, 1, 0.045, '#e6e5e0', 0.2, 0); R(o, 0, 0.07, 1, 0.012, 'rgba(0,0,0,0.2)', null, null);
    R(o, 0.49, 0, 0.02, 1, '#eeede9', 1, 0);
    return o;
  }
  function glass(S, seed) {
    var o = mk(S), r = rng(seed), c = o.c;
    grad(o, 0, 0, 1, 1, '#7fa4b8', '#4e7186'); R(o, 0, 0, 1, 1, null, 0.12, 0);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) {
      var x = i * 0.25, y = j * 0.5, a = 0.08 + r() * 0.22;
      c.fillStyle = 'rgba(' + (r() < 0.5 ? '20,40,60,' : '200,230,245,') + a + ')'; c.fillRect(x * S, y * S, 0.25 * S, 0.5 * S);
      R(o, x + 0.01, y + 0.03, 0.23, 0.36, null, null, 0.35 + r() * 0.65);
      R(o, x, y + 0.4, 0.25, 0.1, 'rgba(40,60,75,0.55)', null, null);       // spandrel
    }
    for (i = 0; i <= 4; i++) R(o, i * 0.25 - 0.006, 0, 0.012, 1, '#c8d2d6', 0, 0);
    R(o, 0, 0.49, 1, 0.014, '#b9c4c9', 0, 0); R(o, 0, 0, 1, 0.012, '#b9c4c9', 0, 0);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.moveTo(0, 0.9 * S); c.lineTo(0.9 * S, 0); c.lineTo(S, 0); c.lineTo(S, 0.25 * S); c.lineTo(0.2 * S, S); c.lineTo(0, S); c.fill();
    return o;
  }
  function panel(S, seed) {
    var o = mk(S);
    wall(o, '#f1f0ec'); grime(o, seed, 0.6);
    for (var i = 0; i < 4; i++) { R(o, i * 0.25, 0, 0.006, 1, 'rgba(0,0,0,0.12)', null, null); }
    R(o, 0, 0.5, 1, 0.006, 'rgba(0,0,0,0.1)', null, null);
    grad(o, 0.03, 0.12, 0.94, 0.3, '#5d7a8e', '#30475a'); R(o, 0.03, 0.12, 0.94, 0.3, null, 0, 1);
    for (i = 1; i < 8; i++) R(o, 0.03 + i * 0.1175, 0.12, 0.008, 0.3, '#d5d8d8', 0, 0);
    R(o, 0, 0, 1, 0.05, '#ffffff', 0.5, 0); R(o, 0, 0.05, 1, 0.01, 'rgba(0,0,0,0.15)', null, null);
    return o;
  }
  function house(S, seed, ground) {
    var o = mk(S);
    wall(o, '#f6f4ef'); grime(o, seed, 0.7);
    if (ground) {
      grad(o, 0.1, 0.25, 0.2, 0.75, '#6b4a33', '#4a3221'); R(o, 0.1, 0.25, 0.2, 0.75, null, 0, 0);          // door
      R(o, 0.08, 0.22, 0.24, 0.03, '#fbfaf6', 0, 0);
      win(o, 0.5, 0.3, 0.36, 0.42, { kind: 'casement', frame: '#f8f7f3' });
      R(o, 0, 0.93, 1, 0.07, '#cfccc4', 0.4, 0);
    } else {
      win(o, 0.12, 0.26, 0.3, 0.46, { kind: 'casement', frame: '#f8f7f3' });
      win(o, 0.6, 0.26, 0.26, 0.46, { kind: 'louvre', shutter: '#e9e6dc', frame: '#f8f7f3' });
      R(o, 0, 0, 1, 0.06, '#ffffff', 0.5, 0); R(o, 0, 0.06, 1, 0.012, 'rgba(0,0,0,0.16)', null, null);
    }
    return o;
  }
  function terraceUp(S, seed) {
    var o = mk(S);
    wall(o, '#f6f4ef'); grime(o, seed, 0.7);
    R(o, 0, 0, 1, 0.07, '#fdfcf9', 0, 0); R(o, 0, 0.07, 1, 0.012, 'rgba(0,0,0,0.18)', null, null);
    win(o, 0.14, 0.24, 0.3, 0.56, { kind: 'louvre', shutter: ['#e7e3d8', '#6d8a7b', '#7c5a44', '#5b7d98'][seed % 4], transom: true });
    win(o, 0.56, 0.24, 0.3, 0.56, { kind: 'casement', frame: '#f8f7f3', transom: false });
    R(o, 0.08, 0.86, 0.84, 0.03, '#fbfaf6', 0, 0); R(o, 0.08, 0.89, 0.84, 0.01, 'rgba(0,0,0,0.2)', null, null);
    R(o, 0, 0, 0.02, 1, 'rgba(0,0,0,0.10)', null, null); R(o, 0.98, 0, 0.02, 1, 'rgba(0,0,0,0.10)', null, null);
    return o;
  }
  function industrial(S, seed) {
    var o = mk(S);
    wall(o, '#eeeeea');
    for (var i = 0; i < 48; i++) R(o, i / 48, 0, 0.007, 1, 'rgba(0,0,0,0.07)', null, null);
    grime(o, seed, 1.2);
    grad(o, 0.06, 0.12, 0.88, 0.18, '#62788a', '#3a4c5a'); R(o, 0.06, 0.12, 0.88, 0.18, null, 0, 0.8);
    for (i = 1; i < 6; i++) R(o, 0.06 + i * 0.1467, 0.12, 0.008, 0.18, '#cfd2d2', 0, 0);
    R(o, 0, 0.9, 1, 0.1, '#bdbcb6', 0.5, 0);
    return o;
  }
  function school(S, seed) {
    var o = mk(S);
    wall(o, '#f5f4f0'); grime(o, seed, 0.5);
    grad(o, 0, 0.1, 1, 0.42, '#5a7386', '#33485a'); R(o, 0, 0.1, 1, 0.42, null, 0, 1);
    for (var i = 0; i < 10; i++) R(o, i * 0.1, 0.1, 0.012, 0.42, '#e8e8e4', 0, 0);
    R(o, 0, 0.3, 1, 0.012, '#e8e8e4', 0, 0);
    R(o, 0, 0.62, 1, 0.38, '#ecebe6', 1, 0); R(o, 0, 0.62, 1, 0.02, 'rgba(0,0,0,0.14)', null, null);
    for (i = 0; i < 20; i++) R(o, i * 0.05 + 0.02, 0.7, 0.008, 0.26, 'rgba(0,0,0,0.10)', null, null);
    R(o, 0, 0, 1, 0.06, '#ffffff', 0.6, 0);
    return o;
  }
  function party(S, seed) {
    var o = mk(S); wall(o, '#efede7'); grime(o, seed, 2.2);
    grad(o, 0, 0, 1, 0.3, 'rgba(70,65,55,0.18)', 'rgba(70,65,55,0)'); grad(o, 0, 0.8, 1, 0.2, 'rgba(60,70,50,0)', 'rgba(60,70,50,0.14)');
    return o;
  }
  function voidDeck(S, seed) {
    var o = mk(S), c = o.c;
    grad(o, 0, 0, 1, 1, '#2f3438', '#4a4f52'); R(o, 0, 0, 1, 1, null, 0, 0.25);
    var g = c.createLinearGradient(0, 0.75 * S, 0, S); g.addColorStop(0, 'rgba(190,190,180,0)'); g.addColorStop(1, 'rgba(190,190,180,0.5)'); c.fillStyle = g; c.fillRect(0, 0.75 * S, S, 0.25 * S);
    R(o, 0, 0, 1, 0.1, '#f2f1ed', 0.4, 0); R(o, 0, 0.1, 1, 0.02, 'rgba(0,0,0,0.35)', null, null);
    for (var i = 0; i < 2; i++) { grad(o, i * 0.5, 0.1, 0.09, 0.9, '#fbfaf7', '#dedcd5', false); R(o, i * 0.5, 0.1, 0.09, 0.9, null, 0.3, 0); }
    c.fillStyle = 'rgba(210,200,180,0.25)'; c.fillRect(0.2 * S, 0.72 * S, 0.2 * S, 0.02 * S); c.fillRect(0.66 * S, 0.72 * S, 0.22 * S, 0.02 * S);  // benches
    return o;
  }
  function shopGlass(S, seed) {
    var o = mk(S), r = rng(seed), c = o.c;
    R(o, 0, 0, 1, 1, '#22292e', 0, 0);
    R(o, 0, 0, 1, 0.2, '#f4f2ec', 1, 0); R(o, 0, 0.2, 1, 0.015, 'rgba(0,0,0,0.3)', null, null);
    for (var i = 0; i < 3; i++) {
      var x = i / 3;
      grad(o, x + 0.012, 0.235, 0.31, 0.7, '#42535f', '#1f2b33'); R(o, x + 0.012, 0.235, 0.31, 0.7, null, 0, 1);
      var g = c.createRadialGradient((x + 0.17) * S, 0.5 * S, 0, (x + 0.17) * S, 0.55 * S, 0.24 * S);
      g.addColorStop(0, 'rgba(255,' + (200 + r() * 40 | 0) + ',' + (140 + r() * 60 | 0) + ',0.55)'); g.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = g; c.fillRect(x * S, 0.235 * S, 0.333 * S, 0.7 * S);
      c.fillStyle = 'rgba(' + (90 + r() * 140 | 0) + ',' + (80 + r() * 120 | 0) + ',' + (80 + r() * 110 | 0) + ',0.7)'; c.fillRect((x + 0.06) * S, 0.66 * S, 0.2 * S, 0.22 * S);
      c.fillStyle = 'rgba(255,255,255,0.09)'; c.beginPath(); c.moveTo((x + 0.02) * S, 0.8 * S); c.lineTo((x + 0.2) * S, 0.24 * S); c.lineTo((x + 0.25) * S, 0.24 * S); c.lineTo((x + 0.02) * S, 0.92 * S); c.fill();
      c.fillStyle = 'rgba(30,30,30,0.6)'; c.fillRect((x + 0.07) * S, 0.07 * S, 0.19 * S, 0.06 * S);
    }
    R(o, 0, 0.945, 1, 0.055, '#8b8d8c', 0, 0);
    return o;
  }
  function roofTile(S, seed) {
    var o = mk(S), r = rng(seed), c = o.c;
    wall(o, '#f0efec');
    var rows = 16, cols = 20;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols + 1; i++) {
      var x = (i - (j % 2) * 0.5) / cols, y = j / rows, v = 0.82 + r() * 0.18;
      c.fillStyle = 'rgba(' + (255 * v | 0) + ',' + (250 * v | 0) + ',' + (244 * v | 0) + ',1)'; c.fillRect(x * S, y * S, S / cols + 1, S / rows + 1);
      c.fillStyle = 'rgba(0,0,0,0.20)'; c.fillRect(x * S, (y + 1 / rows) * S - 2, S / cols + 1, 2);
      c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(x * S, y * S, 1.5, S / rows);
    }
    grime(o, seed, 1.6);
    R(o, 0, 0, 1, 1, null, 1, 0);
    return o;
  }
  function roofFlat(S, seed) {
    var o = mk(S), r = rng(seed), c = o.c; wall(o, '#eceae6'); grime(o, seed, 2.5);
    for (var i = 0; i < 14; i++) { c.fillStyle = 'rgba(80,80,75,' + (0.03 + r() * 0.05) + ')'; c.beginPath(); c.ellipse(r() * S, r() * S, (0.03 + r() * 0.1) * S, (0.02 + r() * 0.06) * S, r() * 3, 0, 7); c.fill(); }
    for (i = 0; i < 4; i++) R(o, 0, i * 0.25, 1, 0.004, 'rgba(0,0,0,0.08)', null, null);
    return o;
  }
  function roofMetal(S, seed) {
    var o = mk(S); wall(o, '#eeeeec');
    for (var i = 0; i < 32; i++) { R(o, i / 32, 0, 0.012, 1, 'rgba(0,0,0,0.13)', null, null); R(o, i / 32 + 0.014, 0, 0.006, 1, 'rgba(255,255,255,0.25)', null, null); }
    grime(o, seed, 1.5);
    return o;
  }
  function arcadeFloor(S, seed) {
    var o = mk(S), c = o.c, n = 8;
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) { c.fillStyle = (i + j) % 2 ? '#b65f45' : '#e7dcc6'; c.fillRect(i * S / n, j * S / n, S / n + 1, S / n + 1); }
    grime(o, seed, 1.4); c.strokeStyle = 'rgba(70,50,40,0.25)'; c.lineWidth = 1;
    for (i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * S / n, 0); c.lineTo(i * S / n, S); c.moveTo(0, i * S / n); c.lineTo(S, i * S / n); c.stroke(); }
    return o;
  }
  function plain(S, seed, shade) { var o = mk(S); wall(o, shade || '#f4f3ef'); grime(o, seed, 1); return o; }

  /* ---- build the stacked array textures */
  KD.buildFacadeTextures = function (THREE, S) {
    var t0 = performance.now();
    var defs = new Array(L.COUNT);
    defs[L.PLAIN] = plain(S, 1);
    defs[L.SH_UP_A] = shopUpper(S, 11, { n: 3, kind: 'louvre', shutter: '#2f6b57', arch: true, tiles: true, swag: true, fan: '#e9b44c' });
    defs[L.SH_UP_B] = shopUpper(S, 12, { n: 3, kind: 'louvre', shutter: '#3a6c8c', arch: true, tiles: true, swag: false, fan: '#d9697d' });
    defs[L.SH_UP_C] = shopUpper(S, 13, { n: 2, kind: 'louvre', shutter: '#7a4b32', arch: true, tiles: false, swag: true, plaque: '1928', fan: '#5aa86b' });
    defs[L.SH_UP_D] = shopUpper(S, 14, { n: 3, kind: 'casement', arch: false, transom: true, tiles: false, bands: true });
    defs[L.SH_UP_E] = shopUpper(S, 15, { n: 3, kind: 'louvre', shutter: '#f1ede2', arch: false, transom: true, tiles: true, swag: true });
    defs[L.SH_UP_F] = shopUpper(S, 16, { n: 2, kind: 'louvre', shutter: '#8f3b3b', arch: false, transom: true, tiles: true, plaque: '1931' });
    defs[L.SH_G_HOME] = shopGround(S, 21, 'home');
    defs[L.SH_G_SHOP] = shopGround(S, 22, 'shop');
    defs[L.SH_G_KOPI] = shopGround(S, 23, 'kopi');
    defs[L.HDB] = hdb(S, 31); defs[L.CONDO] = condo(S, 32); defs[L.GLASS] = glass(S, 33); defs[L.PANEL] = panel(S, 34);
    defs[L.HOUSE] = house(S, 35, false); defs[L.HOUSE_G] = house(S, 36, true); defs[L.INDUSTRIAL] = industrial(S, 37);
    defs[L.TERRACE_UP] = terraceUp(S, 38); defs[L.SCHOOL] = school(S, 39); defs[L.PARTY] = party(S, 40);
    defs[L.VOID] = voidDeck(S, 41); defs[L.SHOPGLASS] = shopGlass(S, 42);
    defs[L.ROOF_TILE] = roofTile(S, 51); defs[L.ROOF_FLAT] = roofFlat(S, 52); defs[L.ROOF_METAL] = roofMetal(S, 53);
    defs[L.ARCADE_FLOOR] = arcadeFloor(S, 54); defs[L.SOFFIT] = plain(S, 55, '#e9e6df');
    var n = L.COUNT, data = new Uint8Array(S * S * 4 * n), glow = new Uint8Array(S * S * n);
    for (var k = 0; k < n; k++) {
      var d = defs[k] || defs[0];
      var a = d.c.getImageData(0, 0, S, S).data, b = d.t.getImageData(0, 0, S, S).data, g = d.g.getImageData(0, 0, S, S).data;
      var off = k * S * S * 4, goff = k * S * S;
      // array textures are stored bottom row first
      for (var y = 0; y < S; y++) {
        var src = (S - 1 - y) * S * 4, dst = off + y * S * 4, gd = goff + y * S;
        for (var x = 0; x < S; x++) {
          data[dst] = a[src]; data[dst + 1] = a[src + 1]; data[dst + 2] = a[src + 2]; data[dst + 3] = b[src];
          glow[gd + x] = g[src]; src += 4; dst += 4;
        }
      }
    }
    var tex = new THREE.DataArrayTexture(data, S, S, n);
    tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType; tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
    var gt = new THREE.DataArrayTexture(glow, S, S, n);
    gt.format = THREE.RedFormat; gt.type = THREE.UnsignedByteType; gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    gt.minFilter = THREE.LinearMipmapLinearFilter; gt.magFilter = THREE.LinearFilter; gt.generateMipmaps = true; gt.unpackAlignment = 1; gt.needsUpdate = true;
    KD.texTime = performance.now() - t0;
    return { color: tex, glow: gt, canvases: defs };
  };

  /* ---- small helper textures */
  KD.canvasTexture = function (THREE, w, h, draw, opts) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    if (opts && opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = 4; return t;
  };
  KD.noiseTexture = function (THREE, size, seed, lo, hi) {
    return KD.canvasTexture(THREE, size, size, function (c, w, h) {
      var r = rng(seed), id = c.createImageData(w, h), d = id.data;
      for (var i = 0; i < w * h; i++) { var v = lo + (hi - lo) * (r() * 0.6 + r() * 0.4); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
      c.putImageData(id, 0, 0);
      c.globalAlpha = 0.5; c.filter = 'blur(2px)'; c.drawImage(c.canvas, 0, 0); c.filter = 'none'; c.globalAlpha = 1;
    }, { repeat: true });
  };
})();
