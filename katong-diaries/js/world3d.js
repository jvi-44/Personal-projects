/* Katong Diaries — the 3D world: ground, sea, parks, roads, every building, trees, sky and light. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var T = window.THREE;
  var L = KD.LAYER;

  /* ------------------------------------------------------------------ colours */
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function pal(list) { return list.map(hex); }
  var PASTEL = pal(['#bfe5d0', '#f6c4d0', '#f7e3a3', '#bcd9ee', '#d9c9ec', '#f9d3b4', '#a9ded9', '#f6f1e7', '#f3ab9c', '#cadbb8',
    '#fff0c0', '#c8d7f3', '#f0b8c6', '#8fcfc4', '#f7c59f', '#e6d5f2', '#b5e0b2', '#fbd9e2', '#a8cde8', '#f4dd8c']);
  var PASTEL_BOLD = pal(['#7fd1bd', '#f59fb5', '#f7d267', '#8fc4ea', '#c3a6ea', '#f8b185', '#67cfc6', '#f58e7c', '#9fd68f', '#f6c1d6', '#86b8f0', '#ffe08a']);
  var NEUTRAL = pal(['#f6f2ea', '#efe9df', '#f3eee0', '#e9e4d9', '#f7efe2', '#ece7e0', '#f2e8d5', '#e6e9e4', '#f4e6d8', '#f1ece4', '#e4e0d6']);
  var HDBC = pal(['#f2ede2', '#e9e4d8', '#f0e6d6', '#e6ebe4', '#f3e9e0', '#e8e2ee', '#f5e4dc', '#e3edf0', '#f1efd9', '#f6eede']);
  var CONDOC = pal(['#f3f1ec', '#e8e6e1', '#dfe3e6', '#efe7dc', '#e6e9ea']);
  var COMMC = pal(['#e9e6df', '#dcd9d2', '#e6dfd3', '#d9dde0', '#efe9e2', '#cfd6da', '#e2d8cc']);
  var INDC = pal(['#d9dcdb', '#cfd8dc', '#e2ded2', '#c9d3cd', '#dcd3c6', '#c8cfd6']);
  var SCHC = pal(['#f3ead7', '#eee6d9', '#f1e2cf', '#e7ecef', '#f4e9dc']);
  var ROOFT = pal(['#c0623f', '#b5573a', '#a94f37', '#c97a52', '#8f4a36', '#b06a4a', '#9a5a40', '#bb6b48', '#a85c3d']);
  var ROOFG = pal(['#6f7479', '#5d646b', '#7a5b4a', '#8c8478', '#4f5a66', '#70685f']);
  var ROOFFLAT = pal(['#c9c7c0', '#bfbdb6', '#d2cfc7', '#b6b8b6', '#c4c0b8']);
  var SIGNC = pal(['#f2c14e', '#f78154', '#4d9078', '#5fa8d3', '#b4436c', '#f2e8cf', '#2b2d42', '#e07a5f', '#81b29a', '#f4f1de', '#3d405b']);
  var WHITE = [247, 244, 236], PARTYC = [233, 230, 222], SOFF = [200, 196, 188];

  // flat (non-textured) geometry stores linear colour, so convert the sRGB design colours once
  function lin(c) { return [Math.round(Math.pow(c[0] / 255, 2.2) * 255), Math.round(Math.pow(c[1] / 255, 2.2) * 255), Math.round(Math.pow(c[2] / 255, 2.2) * 255)]; }
  function hexL(h) { return lin(hex(h)); }
  var AREA_COL = { 1: '#6fb0bf', 2: '#59c1dc', 3: '#ead9ab', 4: '#a9cf8f', 5: '#b8d59b', 6: '#8bbd7b', 7: '#97cc7e', 8: '#e6b98c', 9: '#b9b7b1',
    10: '#d6d0c2', 11: '#cdb994', 12: '#b6c9a4', 13: '#b08e63', 14: '#8f8d87', 15: '#5ea3b3' };
  var C_ASPHALT = hexL('#55585d'), C_ASPHALT2 = hexL('#55585d'), C_SERVICE = hexL('#6c6e71'), C_SIDE = hexL('#cbc6ba'), C_PED = hexL('#d9d3c5'),
    C_FOOT = hexL('#d2ccbe'), C_CYCLE = hexL('#b9695b'), C_STEPS = hexL('#bbb5a8'), C_CANAL = hexL('#bcbab1'), C_WATERR = hexL('#6ba7a8'),
    C_PIER = hexL('#a9865c'), C_ROCK = hexL('#8d8b85'), C_WHITE = hexL('#f1f1ec'), C_YELLOW = hexL('#e2b13a'), C_APRON = hexL('#c9c3b6'), C_APRON2 = hexL('#bdb9ae');

  /* ------------------------------------------------------------------ geometry builders */
  function Buf() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.v = 0; }
  Buf.prototype.tri = function (a, b, c, uva, uvb, uvc, col, layer, nx, ny, nz) {
    // face normal; flip winding so the front face matches the wanted normal
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    var fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    if (nx === undefined) { nx = fx; ny = fy; nz = fz; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } }
    var flip = (fx * nx + fy * ny + fz * nz) < 0;
    var P = this.p, N = this.n, C = this.c, U = this.u, v = this.v;
    P.push(a[0], a[1], a[2]); if (flip) { P.push(c[0], c[1], c[2], b[0], b[1], b[2]); } else { P.push(b[0], b[1], b[2], c[0], c[1], c[2]); }
    var qx = Math.round(nx * 127), qy = Math.round(ny * 127), qz = Math.round(nz * 127);
    N.push(qx, qy, qz, qx, qy, qz, qx, qy, qz);
    C.push(col[0], col[1], col[2], layer, col[0], col[1], col[2], layer, col[0], col[1], col[2], layer);
    U.push(uva[0], uva[1]); if (flip) { U.push(uvc[0], uvc[1], uvb[0], uvb[1]); } else { U.push(uvb[0], uvb[1], uvc[0], uvc[1]); }
    this.i.push(v, v + 1, v + 2); this.v += 3;
  };
  Buf.prototype.quad = function (a, b, c, d, u0, v0, u1, v1, col, layer, nx, ny, nz) {
    // a,b bottom (left,right); c,d top (right,left). shares 4 vertices.
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    var fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    var fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    if (nx === undefined) { nx = fx; ny = fy; nz = fz; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } }
    var flip = (fx * nx + fy * ny + fz * nz) < 0;
    var P = this.p, N = this.n, C = this.c, U = this.u, v = this.v;
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    var qx = Math.round(nx * 127), qy = Math.round(ny * 127), qz = Math.round(nz * 127);
    for (var k = 0; k < 4; k++) { N.push(qx, qy, qz); C.push(col[0], col[1], col[2], layer); }
    U.push(u0, v0, u1, v0, u1, v1, u0, v1);
    if (flip) this.i.push(v, v + 2, v + 1, v, v + 3, v + 2); else this.i.push(v, v + 1, v + 2, v, v + 2, v + 3);
    this.v += 4;
  };
  Buf.prototype.box = function (x0, z0, x1, z1, y0, y1, col, layer, top) {
    // axis-aligned box
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], 0, 0, 1, 1, col, layer, 0, 0, -1);
    this.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], 0, 0, 1, 1, col, layer, 0, 0, 1);
    this.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], 0, 0, 1, 1, col, layer, -1, 0, 0);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], 0, 0, 1, 1, col, layer, 1, 0, 0);
    if (top !== false) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], 0, 0, 1, 1, col, top || layer, 0, 1, 0);
  };
  // oriented box from a base point, two unit axes and sizes
  Buf.prototype.obox = function (ox, oz, ax, az, bx, bz, la, lb, y0, y1, col, layer) {
    var p0 = [ox, 0, oz], p1 = [ox + ax * la, 0, oz + az * la], p2 = [ox + ax * la + bx * lb, 0, oz + az * la + bz * lb], p3 = [ox + bx * lb, 0, oz + bz * lb];
    var pts = [p0, p1, p2, p3];
    for (var k = 0; k < 4; k++) {
      var a = pts[k], b = pts[(k + 1) % 4], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.sqrt(dx * dx + dz * dz) || 1;
      this.quad([a[0], y0, a[2]], [b[0], y0, b[2]], [b[0], y1, b[2]], [a[0], y1, a[2]], 0, 0, 1, 1, col, layer);
    }
    this.quad([p0[0], y1, p0[2]], [p1[0], y1, p1[2]], [p2[0], y1, p2[2]], [p3[0], y1, p3[2]], 0, 0, 1, 1, col, layer, 0, 1, 0);
  };
  Buf.prototype.toGeometry = function () {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new T.BufferAttribute(new Int8Array(this.n), 3, true));
    g.setAttribute('tint', new T.BufferAttribute(new Uint8Array(this.c), 4, true));
    g.setAttribute('uv', new T.BufferAttribute(new Float32Array(this.u), 2));
    g.setIndex(this.v > 65535 ? new T.BufferAttribute(new Uint32Array(this.i), 1) : new T.BufferAttribute(new Uint16Array(this.i), 1));
    g.computeBoundingSphere();
    return g;
  };

  // flat coloured geometry (roads, parks): position + colour only
  function Flat() { this.p = []; this.c = []; this.i = []; this.v = 0; }
  Flat.prototype.vert = function (x, y, z, c) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); return this.v++; };
  Flat.prototype.toGeometry = function (withUv) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('color', new T.BufferAttribute(new Uint8Array(this.c), 3, true));
    if (this.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(this.uv), 2));
    g.setIndex(this.v > 65535 ? new T.BufferAttribute(new Uint32Array(this.i), 1) : new T.BufferAttribute(new Uint16Array(this.i), 1));
    var n = new Float32Array(this.p.length); for (var k = 1; k < n.length; k += 3) n[k] = 1;
    g.setAttribute('normal', new T.BufferAttribute(n, 3));
    g.computeBoundingSphere();
    return g;
  };
  /* ribbon along a polyline (x,z pairs) with constant half-width and lateral offset. ys: number or array.
     from/to (metres along) optionally trim. uvScale adds uv (v = distance / uvScale). */
  Flat.prototype.ribbon = function (pts, hw, off, ys, col, opt) {
    var n = pts.length / 2; if (n < 2) return;
    var P = this.p, C = this.c, I = this.i, base = this.v, dist = 0, wantUv = opt && opt.uv;
    if (wantUv && !this.uv) this.uv = [];
    var u0 = wantUv ? opt.u0 : 0, u1 = wantUv ? opt.u1 : 0, vs = wantUv ? opt.vs : 1;
    for (var k = 0; k < n; k++) {
      var x = pts[k * 2], z = pts[k * 2 + 1], dx0, dz0, dx1, dz1;
      if (k > 0) { dx0 = x - pts[k * 2 - 2]; dz0 = z - pts[k * 2 - 1]; } else { dx0 = pts[2] - x; dz0 = pts[3] - z; }
      if (k < n - 1) { dx1 = pts[k * 2 + 2] - x; dz1 = pts[k * 2 + 3] - z; } else { dx1 = dx0; dz1 = dz0; }
      var l0 = Math.sqrt(dx0 * dx0 + dz0 * dz0) || 1, l1 = Math.sqrt(dx1 * dx1 + dz1 * dz1) || 1;
      if (k > 0) dist += l0;
      var nx = -(dz0 / l0 + dz1 / l1), nz = (dx0 / l0 + dx1 / l1), nl = Math.sqrt(nx * nx + nz * nz);
      if (nl < 1e-4) { nx = -dz0 / l0; nz = dx0 / l0; nl = 1; }
      nx /= nl; nz /= nl;
      var cs = (nx * (-dz0 / l0) + nz * (dx0 / l0)); if (cs < 0.45) cs = 0.45;      // miter limit
      var m = 1 / cs, y = typeof ys === 'number' ? ys : ys[k];
      P.push(x + nx * (off - hw) * m, y, z + nz * (off - hw) * m, x + nx * (off + hw) * m, y, z + nz * (off + hw) * m);
      C.push(col[0], col[1], col[2], col[0], col[1], col[2]);
      if (wantUv) this.uv.push(u0, dist / vs, u1, dist / vs);
      if (k > 0) { var a = base + (k - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    this.v += n * 2;
  };
  Flat.prototype.disc = function (x, z, r, y, col) {
    var b = this.v, seg = 10; this.vert(x, y, z, col);
    for (var k = 0; k < seg; k++) { var a = k / seg * Math.PI * 2; this.vert(x + Math.cos(a) * r, y, z + Math.sin(a) * r, col); }
    for (k = 0; k < seg; k++) this.i.push(b, b + 1 + (k + 1) % seg, b + 1 + k);
  };
  Flat.prototype.poly = function (rings, y, col) {
    var contour = [], holes = [], k, r, i;
    r = rings[0]; for (i = 0; i < r.length; i += 2) contour.push(new T.Vector2(r[i], r[i + 1]));
    for (k = 1; k < rings.length; k++) { var h = []; r = rings[k]; for (i = 0; i < r.length; i += 2) h.push(new T.Vector2(r[i], r[i + 1])); holes.push(h); }
    var tris;
    try { tris = T.ShapeUtils.triangulateShape(contour, holes); } catch (e) { return; }
    var all = contour; for (k = 0; k < holes.length; k++) all = all.concat(holes[k]);
    var b = this.v;
    for (i = 0; i < all.length; i++) this.vert(all[i].x, y, all[i].y, col);
    for (i = 0; i < tris.length; i++) this.i.push(b + tris[i][0], b + tris[i][2], b + tris[i][1]);
  };

  function triangulate(rings) {
    var contour = [], holes = [], k, r, i;
    r = rings[0]; for (i = 0; i < r.length; i += 2) contour.push(new T.Vector2(r[i], r[i + 1]));
    for (k = 1; k < rings.length; k++) { var h = []; r = rings[k]; for (i = 0; i < r.length; i += 2) h.push(new T.Vector2(r[i], r[i + 1])); holes.push(h); }
    var tris; try { tris = T.ShapeUtils.triangulateShape(contour, holes); } catch (e) { tris = []; }
    var all = contour; for (k = 0; k < holes.length; k++) all = all.concat(holes[k]);
    return { pts: all, tris: tris, nOuter: contour.length };
  }

  /* ------------------------------------------------------------------ building generator */
  var UNIT = {}; // layer -> [unit width m, unit height m]
  UNIT[L.HDB] = [12, 2.95]; UNIT[L.CONDO] = [8, 3.1]; UNIT[L.GLASS] = [6.4, 7.8]; UNIT[L.PANEL] = [9, 4.4]; UNIT[L.HOUSE] = [7, 3.3];
  UNIT[L.HOUSE_G] = [7, 3.3]; UNIT[L.INDUSTRIAL] = [10, 5]; UNIT[L.TERRACE_UP] = [5.5, 3.5]; UNIT[L.SCHOOL] = [12, 3.8];
  UNIT[L.PARTY] = [8, 8]; UNIT[L.PLAIN] = [6, 6]; UNIT[L.VOID] = [12, 3.2]; UNIT[L.SHOPGLASS] = [12, 4.2];

  function wallBand(B, ax, az, bx, bz, y0, y1, layer, col, wholeV) {
    var dx = bx - ax, dz = bz - az, len = Math.sqrt(dx * dx + dz * dz); if (len < 0.05 || y1 - y0 < 0.05) return;
    var nx = -dz / len, nz = dx / len, un = UNIT[layer] || [6, 6];
    var lay = layer;
    if (len < un[0] * 0.3 && layer !== L.PARTY && layer !== L.PLAIN) lay = L.PARTY;
    var u1 = Math.max(1, Math.round(len / un[0])), v1 = wholeV ? 1 : Math.max(1, Math.round((y1 - y0) / un[1]));
    if (lay === L.PARTY || lay === L.PLAIN) { u1 = len / 8; v1 = (y1 - y0) / 8; }
    B.quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], 0, 0, u1, v1, col, lay, nx, 0, nz);
  }
  function flatRoof(B, rings, y, col, layer, uvs) {
    var t = triangulate(rings), s = uvs || 12, i;
    for (i = 0; i < t.tris.length; i++) {
      var a = t.pts[t.tris[i][0]], b = t.pts[t.tris[i][1]], c = t.pts[t.tris[i][2]];
      B.tri([a.x, y, a.y], [b.x, y, b.y], [c.x, y, c.y], [a.x / s, a.y / s], [b.x / s, b.y / s], [c.x / s, c.y / s], col, layer, 0, 1, 0);
    }
  }
  function insetRoof(B, ring, inset, y, rise, col) {
    // sloped band between the wall-top ring and the raised inner ring, then a cap
    var t = triangulate([ring, inset]), i, s = 2.2;
    for (i = 0; i < t.tris.length; i++) {
      var ia = t.tris[i][0], ib = t.tris[i][1], ic = t.tris[i][2];
      var a = t.pts[ia], b = t.pts[ib], c = t.pts[ic];
      B.tri([a.x, y + (ia >= t.nOuter ? rise : 0), a.y], [b.x, y + (ib >= t.nOuter ? rise : 0), b.y], [c.x, y + (ic >= t.nOuter ? rise : 0), c.y],
        [a.x / s, a.y / s], [b.x / s, b.y / s], [c.x / s, c.y / s], col, L.ROOF_TILE);
    }
    flatRoof(B, [inset], y + rise, col, L.ROOF_TILE, s);
  }
  function gableRoof(B, a, b, c, d, y, sections, col, nfx, nfz, sideCol) {
    // a,b = front corners; d,c = back corners (a-d left side, b-c right side). ridge parallel to the front.
    var depth = (Math.hypot(d[0] - a[0], d[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1])) / 2;
    var rise = Math.min(3.2, depth / sections * 0.5 * 0.5), w = Math.hypot(b[0] - a[0], b[1] - a[1]);
    function Lp(t) { return [a[0] + (d[0] - a[0]) * t, a[1] + (d[1] - a[1]) * t]; }
    function Rp(t) { return [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t]; }
    var us = w / 2.2, vs = depth / sections / 2 / 1.7;
    for (var s = 0; s < sections; s++) {
      var t0 = s / sections, tm = (s + 0.5) / sections, t1 = (s + 1) / sections;
      var l0 = Lp(t0), r0 = Rp(t0), lm = Lp(tm), rm = Rp(tm), l1 = Lp(t1), r1 = Rp(t1), y0 = y;
      if (s === 0) { l0 = [l0[0] + nfx * 0.4, l0[1] + nfz * 0.4]; r0 = [r0[0] + nfx * 0.4, r0[1] + nfz * 0.4]; y0 = y - 0.18; }
      B.quad([l0[0], y0, l0[1]], [r0[0], y0, r0[1]], [rm[0], y + rise, rm[1]], [lm[0], y + rise, lm[1]], 0, 0, us, vs, col, L.ROOF_TILE);
      B.quad([lm[0], y + rise, lm[1]], [rm[0], y + rise, rm[1]], [r1[0], y, r1[1]], [l1[0], y, l1[1]], 0, 0, us, vs, col, L.ROOF_TILE);
      var ll = Lp(t0), rr = Rp(t0);
      B.tri([ll[0], y, ll[1]], [lm[0], y + rise, lm[1]], [l1[0], y, l1[1]], [0, 0], [0.5, 0.4], [1, 0], sideCol, L.PARTY);
      B.tri([rr[0], y, rr[1]], [rm[0], y + rise, rm[1]], [r1[0], y, r1[1]], [0, 0], [0.5, 0.4], [1, 0], sideCol, L.PARTY);
    }
    return rise;
  }
  function shade(c, f) { return [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0]; }
  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; }

  // one shophouse bay with a five-foot way. a->b is the street front, na/nb unit vectors pointing into the plot at each end.
  function arcadeBay(B, a, b, ia, ib, nx, nz, G, h, lv, col, seed, shopKind, r) {
    var ax = a[0], az = a[1], bx = b[0], bz = b[1];
    var w = Math.hypot(bx - ax, bz - az); if (w < 0.6) return;
    var tx = (bx - ax) / w, tz = (bz - az) / w;
    var a2 = [ax + ia[0] * r, az + ia[1] * r], b2 = [bx + ib[0] * r, bz + ib[1] * r];
    var up = [L.SH_UP_A, L.SH_UP_B, L.SH_UP_C, L.SH_UP_D, L.SH_UP_E, L.SH_UP_F][seed % 6];
    // upper storeys
    B.quad([ax, G, az], [bx, G, bz], [bx, h, bz], [ax, h, az], 0, 0, 1, Math.max(1, lv - 1), col, up, nx, 0, nz);
    // recessed ground-floor front
    var gl = shopKind === 1 ? L.SH_G_SHOP : shopKind === 2 ? L.SH_G_KOPI : L.SH_G_HOME;
    var gcol = shopKind ? SIGNC[(seed >> 2) % SIGNC.length] : mixc(col, WHITE, 0.45);
    B.quad([a2[0], 0.16, a2[1]], [b2[0], 0.16, b2[1]], [b2[0], G, b2[1]], [a2[0], G, a2[1]], 0, 0, 1, 1, gcol, gl, nx, 0, nz);
    // walkway floor, step, ceiling
    B.quad([ax, 0.16, az], [bx, 0.16, bz], [b2[0], 0.16, b2[1]], [a2[0], 0.16, a2[1]], 0, 0, w / 2.4, r / 2.4, [255, 255, 255], L.ARCADE_FLOOR, 0, 1, 0);
    B.quad([ax, 0, az], [bx, 0, bz], [bx, 0.16, bz], [ax, 0.16, az], 0, 0, w / 6, 0.03, [190, 186, 178], L.PLAIN, nx, 0, nz);
    B.quad([a2[0], G, a2[1]], [b2[0], G, b2[1]], [bx, G, bz], [ax, G, az], 0, 0, 1, 1, SOFF, L.SOFFIT, 0, -1, 0);
    // fascia beam
    B.quad([ax, G - 0.42, az], [bx, G - 0.42, bz], [bx, G, bz], [ax, G, az], 0, 0.2, w / 6, 0.26, WHITE, L.PLAIN, nx, 0, nz);
    // columns (half at each party line)
    var cw = 0.24, cd = 0.44;
    B.obox(ax, az, tx, tz, -nx, -nz, cw, cd, 0.16, G - 0.42, WHITE, L.PLAIN);
    B.obox(bx - tx * cw, bz - tz * cw, tx, tz, -nx, -nz, cw, cd, 0.16, G - 0.42, WHITE, L.PLAIN);
    return { a2: a2, b2: b2 };
  }

  function buildBuilding(B, b, W, ctx) {
    var ring = b.rings[0], n = ring.length / 2, k, i, j;
    if (n < 3) return;
    var seed = (b.seed * 31 + b.id * 7) >>> 0, h = b.h, mh = b.mh, kind = b.kind, lv = Math.max(1, b.lv);
    var street = W.st[b.st] || '';
    function P(idx) { idx = ((idx % n) + n) % n; return [ring[idx * 2], ring[idx * 2 + 1]]; }
    function wallsAll(layerUp, col, layerGround, gh) {
      for (var ri = 0; ri < b.rings.length; ri++) {
        var rg = b.rings[ri], m = rg.length / 2;
        for (var e = 0; e < m; e++) {
          var x0 = rg[e * 2], z0 = rg[e * 2 + 1], x1 = rg[((e + 1) % m) * 2], z1 = rg[((e + 1) % m) * 2 + 1];
          if (layerGround != null && h - mh > gh + 2.5 && mh < 0.5) {
            wallBand(B, x0, z0, x1, z1, mh, mh + gh, layerGround, col, true);
            wallBand(B, x0, z0, x1, z1, mh + gh, h, layerUp, col);
          } else wallBand(B, x0, z0, x1, z1, mh, h, layerUp, col);
        }
      }
    }
    // ---- canopies / covered walkways
    if (kind === 7) {
      var cc = [[214, 219, 222], [226, 224, 216], [196, 208, 214], [233, 231, 224]][seed % 4];
      flatRoof(B, b.rings, h, cc, L.ROOF_METAL, 6);
      var t = triangulate(b.rings);
      for (i = 0; i < t.tris.length; i++) {
        var q0 = t.pts[t.tris[i][0]], q1 = t.pts[t.tris[i][1]], q2 = t.pts[t.tris[i][2]];
        B.tri([q0.x, mh, q0.y], [q1.x, mh, q1.y], [q2.x, mh, q2.y], [0, 0], [1, 0], [0, 1], shade(cc, 0.8), L.PLAIN, 0, -1, 0);
      }
      for (k = 0; k < n; k++) { var pa = P(k), pb = P(k + 1); wallBand(B, pa[0], pa[1], pb[0], pb[1], mh, h, L.PLAIN, shade(cc, 0.92)); }
      if (n <= 10 && mh > 1.5) {
        var cx = 0, cz = 0; for (k = 0; k < n; k++) { cx += ring[k * 2]; cz += ring[k * 2 + 1]; } cx /= n; cz /= n;
        for (k = 0; k < n; k++) { var px = ring[k * 2] + (cx - ring[k * 2]) * 0.08, pz = ring[k * 2 + 1] + (cz - ring[k * 2 + 1]) * 0.08; B.box(px - 0.13, pz - 0.13, px + 0.13, pz + 0.13, 0, mh, [150, 152, 150], L.PLAIN, false); }
      }
      return;
    }
    // ---- shophouses, terrace houses, shophouse rows
    var isRow = (kind === 1 || kind === 2 || kind === 11) && b.fe !== 255 && b.fe < n;
    if (isRow) {
      var fe = b.fe, a = P(fe), bb = P(fe + 1);
      var fw = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
      var tx = (bb[0] - a[0]) / fw, tz = (bb[1] - a[1]) / fw, nx = -tz, nz = tx;       // outward (street side)
      var four = n === 4, c = P(fe + 2), d = P(fe + 3);
      var ia, ib;
      if (four) {
        var la = Math.hypot(d[0] - a[0], d[1] - a[1]) || 1, lb = Math.hypot(c[0] - bb[0], c[1] - bb[1]) || 1;
        ia = [(d[0] - a[0]) / la, (d[1] - a[1]) / la]; ib = [(c[0] - bb[0]) / lb, (c[1] - bb[1]) / lb];
      } else { ia = [-nx, -nz]; ib = [-nx, -nz]; }
      var depth = four ? (Math.hypot(d[0] - a[0], d[1] - a[1]) + Math.hypot(c[0] - bb[0], c[1] - bb[1])) / 2 : 14;
      var G = Math.min(3.9, h * 0.52), pcol, sideCol = PARTYC;
      var bold = street === 'Koon Seng Road' || street === 'Joo Chiat Place' || street === 'Tembeling Road' || street === 'Everitt Road';
      if (kind === 2) {
        pcol = (seed % 5 === 0) ? PASTEL[seed % PASTEL.length] : NEUTRAL[seed % NEUTRAL.length];
        if (bold) pcol = PASTEL_BOLD[seed % PASTEL_BOLD.length];
      } else pcol = bold ? PASTEL_BOLD[seed % PASTEL_BOLD.length] : PASTEL[seed % PASTEL.length];
      var hasPoi = ctx.poiB && ctx.poiB[b.id];
      if (kind === 1 || kind === 11) {
        var bays = kind === 11 ? Math.max(2, Math.round(fw / 5.6)) : 1, r = depth < 9 ? 1.3 : 2.1;
        for (i = 0; i < bays; i++) {
          var f0 = i / bays, f1 = (i + 1) / bays, sd = (seed + i * 2654435761) >>> 0;
          var pa2 = [a[0] + tx * fw * f0, a[1] + tz * fw * f0], pb2 = [a[0] + tx * fw * f1, a[1] + tz * fw * f1];
          var bc = kind === 11 ? (bold ? PASTEL_BOLD : PASTEL)[(sd >>> 3) % (bold ? PASTEL_BOLD.length : PASTEL.length)] : pcol;
          var sk = hasPoi ? ((sd >>> 5) % 4 === 0 ? 2 : 1) : ((sd >>> 5) % 10 < 6 ? 0 : (sd >>> 5) % 10 < 9 ? 1 : 2);
          arcadeBay(B, pa2, pb2, [ia[0] + (ib[0] - ia[0]) * f0, ia[1] + (ib[1] - ia[1]) * f0], [ia[0] + (ib[0] - ia[0]) * f1, ia[1] + (ib[1] - ia[1]) * f1], nx, nz, G, h, lv, bc, sd >>> 1, sk, r);
        }
        // side walls: open at the walkway on the ground storey
        if (four) {
          var a2 = [a[0] + ia[0] * r, a[1] + ia[1] * r], b2 = [bb[0] + ib[0] * r, bb[1] + ib[1] * r];
          wallBand(B, bb[0], bb[1], c[0], c[1], G, h, L.PARTY, sideCol); wallBand(B, b2[0], b2[1], c[0], c[1], 0, G, L.PARTY, sideCol);
          wallBand(B, d[0], d[1], a[0], a[1], G, h, L.PARTY, sideCol); wallBand(B, d[0], d[1], a2[0], a2[1], 0, G, L.PARTY, sideCol);
          wallBand(B, c[0], c[1], d[0], d[1], 0, h, L.HOUSE, shade(sideCol, 1.02));
        } else {
          for (k = 0; k < n; k++) { if (k === fe) continue; var e0 = P(k), e1 = P(k + 1); wallBand(B, e0[0], e0[1], e1[0], e1[1], 0, h, L.PARTY, sideCol); }
        }
      } else {
        // terrace house: door + window at street level, shuttered windows above, a little porch roof
        B.quad([a[0], 0, a[1]], [bb[0], 0, bb[1]], [bb[0], G, bb[1]], [a[0], G, a[1]], 0, 0, 1, 1, pcol, L.HOUSE_G, nx, 0, nz);
        B.quad([a[0], G, a[1]], [bb[0], G, bb[1]], [bb[0], h, bb[1]], [a[0], h, a[1]], 0, 0, 1, Math.max(1, lv - 1), pcol, L.TERRACE_UP, nx, 0, nz);
        if (seed % 5 < 3) {
          var pd = 2.3, py = G - 0.5;
          B.quad([a[0], py, a[1]], [bb[0], py, bb[1]], [bb[0] + nx * pd, py - 0.35, bb[1] + nz * pd], [a[0] + nx * pd, py - 0.35, a[1] + nz * pd], 0, 0, fw / 2.2, 1, ROOFT[seed % ROOFT.length], L.ROOF_TILE, 0, 1, 0);
          B.quad([a[0] + nx * pd, py - 0.35, a[1] + nz * pd], [bb[0] + nx * pd, py - 0.35, bb[1] + nz * pd], [bb[0], py, bb[1]], [a[0], py, a[1]], 0, 0, 1, 1, SOFF, L.SOFFIT, 0, -1, 0);
        }
        for (k = 0; k < n; k++) {
          if (k === fe) continue; var s0 = P(k), s1 = P(k + 1);
          wallBand(B, s0[0], s0[1], s1[0], s1[1], 0, h, (four && k === (fe + 2) % 4) ? L.HOUSE : L.PARTY, sideCol);
        }
      }
      var rc = (seed % 7 === 0) ? ROOFG[seed % ROOFG.length] : ROOFT[(seed >>> 2) % ROOFT.length];
      var regular = false;
      if (four) {
        var bw = Math.hypot(c[0] - d[0], c[1] - d[1]), sl = Math.hypot(d[0] - a[0], d[1] - a[1]), sr = Math.hypot(c[0] - bb[0], c[1] - bb[1]);
        regular = Math.min(fw, bw) / Math.max(fw, bw) > 0.62 && Math.min(sl, sr) / Math.max(sl, sr) > 0.62;
      }
      if (regular) gableRoof(B, a, bb, c, d, h, depth > 15 ? 2 : 1, rc, nx, nz, sideCol);
      else flatRoof(B, b.rings, h, rc, L.ROOF_TILE, 2.4);
      return;
    }
    // ---- everything else
    var col, up, ground = null, gh = 3.6, roofCol = ROOFFLAT[seed % ROOFFLAT.length], roofLayer = L.ROOF_FLAT;
    if (kind === 3) { col = NEUTRAL[seed % NEUTRAL.length]; up = L.HOUSE; ground = L.HOUSE_G; gh = 3.3; }
    else if (kind === 4) {
      var condoish = W.bt[b.bt] === 'apartments' || (W.nm[b.nm] && W.nm[b.nm].length > 0);
      col = condoish ? CONDOC[seed % CONDOC.length] : HDBC[seed % HDBC.length]; up = condoish ? L.CONDO : L.HDB; ground = L.VOID; gh = 3.2;
    }
    else if (kind === 5) { col = COMMC[seed % COMMC.length]; up = L.PANEL; ground = L.SHOPGLASS; gh = 4.2; }
    else if (kind === 10) { col = COMMC[seed % COMMC.length]; up = (seed % 3 === 0) ? L.PANEL : L.GLASS; ground = L.SHOPGLASS; gh = 4.2; }
    else if (kind === 6) { col = INDC[seed % INDC.length]; up = L.INDUSTRIAL; roofLayer = L.ROOF_METAL; roofCol = [[176, 186, 192], [198, 196, 188], [160, 176, 170]][seed % 3]; }
    else if (kind === 9) { col = SCHC[seed % SCHC.length]; up = L.SCHOOL; }
    else if (kind === 8) {
      col = b.rel === 1 ? [246, 244, 236] : b.rel === 2 ? [[248, 214, 208], [246, 232, 190], [214, 232, 240]][seed % 3] : b.rel === 3 ? [246, 236, 214] : [246, 244, 238];
      up = L.PLAIN;
    }
    else { col = COMMC[seed % COMMC.length]; up = L.PANEL; }
    if (b.flags & 4) ground = null;
    wallsAll(up, col, ground, gh);
    var name = W.nm[b.nm] || '';
    if (name === 'National Stadium') {   // the big dome
      ctx.landmarks.push({ type: 'dome', x: b.cx, z: b.cz, r: Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.5, y: h * 0.4 });
      return;
    }
    if (b.inset && (kind === 3 || kind === 8)) {
      var rcol = kind === 8 ? (b.rel === 1 ? [70, 150, 110] : b.rel === 3 ? [186, 70, 46] : b.rel === 2 ? [200, 120, 70] : [120, 124, 130]) : ((seed % 4 === 0) ? ROOFG[seed % ROOFG.length] : ROOFT[(seed >>> 2) % ROOFT.length]);
      insetRoof(B, ring, b.inset, h, b.rise, rcol);
    } else if (kind === 3) {
      flatRoof(B, b.rings, h, ROOFT[(seed >>> 2) % ROOFT.length], L.ROOF_TILE, 2.4);
    } else {
      flatRoof(B, b.rings, h, roofCol, roofLayer, 14);
      var area = (b.x1 - b.x0) * (b.z1 - b.z0);
      if ((kind === 4 || kind === 10 || kind === 5) && h > 14 && area > 260 && b.rings.length === 1 && !(b.flags & 4)) {
        var s = Math.min(7, Math.sqrt(area) * 0.14);
        if (ctx.inside(b, b.cx, b.cz)) B.box(b.cx - s, b.cz - s * 0.7, b.cx + s, b.cz + s * 0.7, h, h + 2.6, shade(col, 0.94), L.PLAIN, L.ROOF_FLAT);
      }
    }
    if (kind === 8 && Math.max(b.x1 - b.x0, b.z1 - b.z0) > 10) ctx.landmarks.push({ type: b.rel === 1 ? 'mosque' : b.rel === 2 ? 'gopuram' : b.rel === 4 ? 'spire' : 'none', x: b.cx, z: b.cz, y: h + (b.inset ? b.rise : 0), b: b });
  }

  /* ------------------------------------------------------------------ the world */
  function World(canvas, W, opts) {
    var self = this;
    this.W = W; this.opts = opts || {};
    this.mobile = !!opts.mobile; this.quality = opts.quality || (this.mobile ? 'low' : 'high');
    var renderer = this.renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !this.mobile, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.LinearToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = this.quality !== 'low'; renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(50, 1, 1, 60000);
    this.scene.fog = new T.Fog(0xcfe3ee, 800, 9000);
    this.time = 0; this.uniforms = { uGlow: { value: 0 }, uTime: { value: 0 } };
    this.tiles = []; this.landmarks = []; this.treeChunks = []; this.onProgress = null;
    this.poiB = opts.poiBuildings || null;

    // ---- lights
    this.hemi = new T.HemisphereLight(0xdfeeff, 0x9c9585, 1.0); this.scene.add(this.hemi);
    this.sun = new T.DirectionalLight(0xfff2dc, 2.4); this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.sun.castShadow = renderer.shadowMap.enabled;
    var sm = this.quality === 'high' ? 2048 : 1024; this.sun.shadow.mapSize.set(sm, sm);
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.6;
    this.sunDir = new T.Vector3(0.45, 0.8, 0.35).normalize();

    this._buildSky(); this._buildTextures(); this._buildGround(); this._buildAreas(); this._buildGrids(); this._buildRoads(); this._buildTreeProtos();
    this.setTimeOfDay(opts.tod || 'day', true);
  }

  World.prototype._buildTextures = function () {
    var S = this.mobile ? 256 : 512;
    this.facade = KD.buildFacadeTextures(T, S);
    var U = this.uniforms, fac = this.facade;
    var mat = this.matBuilding = new T.MeshLambertMaterial({ color: 0xffffff });
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.facadeTex = { value: fac.color }; sh.uniforms.glowTex = { value: fac.glow }; sh.uniforms.uGlow = U.uGlow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 tint;\nvarying vec4 vTint;\nvarying vec2 vFuv;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = tint; vFuv = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nprecision highp sampler2DArray;\nuniform sampler2DArray facadeTex;\nuniform sampler2DArray glowTex;\nuniform float uGlow;\nvarying vec4 vTint;\nvarying vec2 vFuv;')
        .replace('#include <map_fragment>', 'float kdLayer = floor(vTint.a * 255.0 + 0.5);\nvec4 kdT = texture(facadeTex, vec3(vFuv, kdLayer));\nvec3 kdTint = pow(vTint.rgb, vec3(2.2));\ndiffuseColor.rgb = mix(kdT.rgb, kdT.rgb * kdTint, kdT.a);')
        .replace('#include <emissivemap_fragment>', 'float kdG = texture(glowTex, vec3(vFuv, kdLayer)).r;\nfloat kdCell = fract(sin(dot(floor(vFuv) + kdLayer * 7.0, vec2(12.9898, 78.233))) * 43758.5453);\ntotalEmissiveRadiance += vec3(1.0, 0.74, 0.42) * kdG * uGlow * (0.25 + 0.75 * step(0.42, kdCell));');
    };
    this.noise = KD.noiseTexture(T, 256, 7, 200, 255);
    this.noise.repeat.set(1, 1);
  };

  World.prototype._buildSky = function () {
    var u = this.skyU = { top: { value: new T.Color(0x4f8fd6) }, hor: { value: new T.Color(0xcfe3ee) }, sunDir: { value: new T.Vector3(0, 1, 0) }, sunCol: { value: new T.Color(0xfff2dc) }, stars: { value: 0 }, cloudT: { value: 0 }, cloudLit: { value: 1 } };
    var m = new T.ShaderMaterial({
      uniforms: u, side: T.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p; }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; varying vec3 vDir;\n' +
        'uniform float cloudT; uniform float cloudLit;\n' +
        'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }\n' +
        'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }\n' +
        'void main(){ vec3 d = normalize(vDir); float h = max(d.y, 0.0); vec3 c = mix(hor, top, pow(h, 0.55));\n' +
        ' if (d.y < 0.0) c = mix(hor, hor * 0.82, min(1.0, -d.y * 6.0));\n' +
        ' float s = max(dot(d, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.22 + pow(s, 3.0) * 0.08);\n' +
        ' if (d.y > 0.0) { vec2 q = d.xz / (d.y + 0.22) * 1.4 + vec2(cloudT, cloudT * 0.6); float n = vn(q) * 0.55 + vn(q * 2.1 + 3.7) * 0.3 + vn(q * 4.3 + 9.1) * 0.15;\n' +
        '   float cl = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.18, d.y); c = mix(c, mix(hor, vec3(1.0), 0.7) * (0.55 + 0.45 * cloudLit), cl * 0.85); }\n' +
        ' if (stars > 0.01) { vec2 g = floor(d.xz / max(d.y, 0.05) * 60.0); float st = step(0.992, h21(g)) * smoothstep(0.05, 0.4, d.y); c += vec3(st) * stars; }\n' +
        ' gl_FragColor = vec4(c, 1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }'
    });
    this.sky = new T.Mesh(new T.SphereGeometry(1, 32, 16), m); this.sky.scale.setScalar(30000); this.sky.renderOrder = -100; this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  };

  World.prototype._buildGround = function () {
    var W = this.W, i;
    // sea
    var nm = KD.canvasTexture(T, 256, 256, function (c, w, h) {
      var id = c.createImageData(w, h), d = id.data, x, y;
      function H(x, y) { return Math.sin(x * 0.11 + y * 0.07) * 0.5 + Math.sin(x * 0.047 - y * 0.13 + 1.3) * 0.7 + Math.sin((x + y) * 0.23) * 0.25 + Math.sin(x * 0.31 - y * 0.29) * 0.18; }
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        var px = x / w * Math.PI * 2 * 8, py = y / h * Math.PI * 2 * 8;
        var hx = Math.sin(px) * 0.5 + Math.sin(px * 2 + py) * 0.3 + Math.sin(py * 3 - px) * 0.2, hy = Math.cos(py) * 0.5 + Math.cos(py * 2 - px) * 0.3 + Math.cos(px * 3 + py) * 0.2;
        var o = (y * w + x) * 4; d[o] = 128 + hx * 46; d[o + 1] = 128 + hy * 46; d[o + 2] = 255; d[o + 3] = 255;
      }
      c.putImageData(id, 0, 0);
    }, { repeat: true });
    nm.colorSpace = T.NoColorSpace; nm.repeat.set(900, 900);
    this.waterNormal = nm;
    this.matWater = new T.MeshStandardMaterial({ color: 0x3d8ca6, roughness: 0.22, metalness: 0.15, normalMap: nm, normalScale: new T.Vector2(0.55, 0.55) });
    var sea = new T.Mesh(new T.PlaneGeometry(70000, 70000), this.matWater); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.55; sea.renderOrder = -5;
    this.scene.add(sea); this.sea = sea;
    // land
    var f = new Flat();
    for (i = 0; i < W.land.length; i++) f.poly(W.land[i], 0, [255, 255, 255]);
    var g = f.toGeometry(), uv = new Float32Array(f.v * 2);
    for (i = 0; i < f.v; i++) { uv[i * 2] = f.p[i * 3] / 36; uv[i * 2 + 1] = f.p[i * 3 + 2] / 36; }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    this.matLand = new T.MeshLambertMaterial({ color: 0xbfcfa6, map: this.noise });
    var land = new T.Mesh(g, this.matLand); land.receiveShadow = true; land.renderOrder = -4; this.scene.add(land); this.land = land;
    // soft mist beyond the mapped radius
    var R = W.radius, seg = 120, pos = [], col = [], idx = [];
    var rings = [[R - 180, 0], [R + 260, 1], [R + 900, 1], [60000, 1]];
    for (var ri = 0; ri < rings.length; ri++) for (i = 0; i <= seg; i++) { var a = i / seg * Math.PI * 2; pos.push(Math.cos(a) * rings[ri][0], 0, Math.sin(a) * rings[ri][0]); col.push(1, 1, 1, rings[ri][1]); }
    for (ri = 0; ri < rings.length - 1; ri++) for (i = 0; i < seg; i++) { var p0 = ri * (seg + 1) + i, p1 = p0 + seg + 1; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
    var mg = new T.BufferGeometry(); mg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); mg.setAttribute('color', new T.Float32BufferAttribute(col, 4)); mg.setIndex(idx);
    this.matMist = new T.MeshBasicMaterial({ color: 0xcfe3ee, vertexColors: true, transparent: true, depthWrite: false, fog: false, side: T.DoubleSide });
    var mist = new T.Mesh(mg, this.matMist); mist.position.y = 1.2; mist.renderOrder = 50; this.scene.add(mist); this.mist = mist;
  };

  World.prototype._flatMat = function (order) {
    return new T.MeshLambertMaterial({ vertexColors: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 - order, polygonOffsetUnits: -2 - order * 2 });
  };

  World.prototype._buildAreas = function () {
    var W = this.W, f = new Flat(), fw = new Flat(), i;
    for (i = 0; i < W.areas.length; i++) {
      var a = W.areas[i];
      if (a.cls === 1 || a.cls === 2) fw.poly(a.rings, 0.03, a.cls === 2 ? lin([150, 225, 240]) : [255, 255, 255]);
      else {
        var c = hexL(AREA_COL[a.cls] || '#cccccc');
        if (a.cls === 15) c = lin([[94, 163, 179], [200, 126, 98], [98, 150, 120], [86, 128, 178]][i % 4]);
        f.poly(a.rings, 0.02, c);
      }
    }
    var m = new T.Mesh(f.toGeometry(), this._flatMat(0)); m.receiveShadow = true; m.renderOrder = -3; this.scene.add(m); this.areasMesh = m;
    var wg = fw.toGeometry();
    var wm = new T.Mesh(wg, new T.MeshStandardMaterial({ color: 0x4f9bb0, roughness: 0.25, metalness: 0.12, normalMap: this.waterNormal, normalScale: new T.Vector2(0.4, 0.4), vertexColors: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    var uv = new Float32Array(fw.v * 2); for (i = 0; i < fw.v; i++) { uv[i * 2] = fw.p[i * 3] / 70; uv[i * 2 + 1] = fw.p[i * 3 + 2] / 70; }
    wg.setAttribute('uv', new T.BufferAttribute(uv, 2));
    wm.material.normalMap = this.waterNormal.clone(); wm.material.normalMap.repeat.set(1, 1); wm.material.normalMap.needsUpdate = true; this.inlandNormal = wm.material.normalMap;
    wm.renderOrder = -2.5; this.scene.add(wm); this.waterMesh = wm;
  };

  /* spatial grids: buildings (collision + picking), junctions, elevated roads, named roads */
  World.prototype._buildGrids = function () {
    var W = this.W, CS = this.CS = 25, R = W.radius, N = this.GN = Math.ceil(2 * R / CS) + 2, i;
    this.G0 = -R - CS;
    var grid = this.bgrid = new Array(N * N);
    for (i = 0; i < W.buildings.length; i++) {
      var b = W.buildings[i]; if (b.kind === 7 || b.mh > 2.4) continue;         // canopies & raised parts don't block walking
      var x0 = Math.max(0, Math.floor((b.x0 - this.G0) / CS)), x1 = Math.min(N - 1, Math.floor((b.x1 - this.G0) / CS));
      var z0 = Math.max(0, Math.floor((b.z0 - this.G0) / CS)), z1 = Math.min(N - 1, Math.floor((b.z1 - this.G0) / CS));
      for (var gz = z0; gz <= z1; gz++) for (var gx = x0; gx <= x1; gx++) { var k = gz * N + gx; (grid[k] || (grid[k] = [])).push(i); }
    }
    // junction hash (20 m cells)
    var J = W.junctions, jh = this.jhash = {};
    for (i = 0; i < J.length; i += 3) { var key = Math.floor(J[i] / 20) + ',' + Math.floor(J[i + 1] / 20); (jh[key] || (jh[key] = [])).push(i); }
    // road grids (100 m cells): named roads for "you are on", elevated decks for walking height
    var rg = this.rgrid = {}, eg = this.egrid = {};
    for (i = 0; i < W.roads.length; i++) {
      var r = W.roads[i]; if (r.cls > 20 && r.cls !== 42) continue;
      var p = r.pts, seen = {};
      for (var q = 0; q < p.length; q += 2) {
        var ck = Math.floor(p[q] / 100) + ',' + Math.floor(p[q + 1] / 100);
        if (!seen[ck]) { seen[ck] = 1; (rg[ck] || (rg[ck] = [])).push(i); if (r.h) (eg[ck] || (eg[ck] = [])).push(i); }
      }
    }
    // walkable mask: land minus water, plus anything a road or pier crosses (bridges, jetties)
    var MS = this.MS = 2048, span = this.MSPAN = 2 * (R + 120), c = document.createElement('canvas'); c.width = c.height = MS;
    var g = c.getContext('2d'), S = MS / span, o = MS / 2;
    function ring(rr) { g.moveTo(rr[0] * S + o, rr[1] * S + o); for (var t = 2; t < rr.length; t += 2) g.lineTo(rr[t] * S + o, rr[t + 1] * S + o); g.closePath(); }
    g.fillStyle = '#000'; g.fillRect(0, 0, MS, MS); g.fillStyle = '#fff';
    for (i = 0; i < W.land.length; i++) { g.beginPath(); W.land[i].forEach(ring); g.fill('evenodd'); }
    g.fillStyle = '#000';
    for (i = 0; i < W.areas.length; i++) if (W.areas[i].cls === 1 || W.areas[i].cls === 2) { g.beginPath(); W.areas[i].rings.forEach(ring); g.fill('evenodd'); }
    g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (i = 0; i < W.roads.length; i++) {
      r = W.roads[i]; if (!(r.cls <= 20 || r.cls === 42)) continue; p = r.pts;
      g.lineWidth = Math.max(1.6, (r.w + 1.5) * S); g.beginPath(); g.moveTo(p[0] * S + o, p[1] * S + o);
      for (q = 2; q < p.length; q += 2) g.lineTo(p[q] * S + o, p[q + 1] * S + o); g.stroke();
    }
    var d = g.getImageData(0, 0, MS, MS).data, mask = this.mask = new Uint8Array(MS * MS);
    for (i = 0; i < MS * MS; i++) mask[i] = d[i * 4] > 127 ? 1 : 0;
  };
  World.prototype.onLand = function (x, z) {
    var S = this.MS / this.MSPAN, px = Math.floor(x * S + this.MS / 2), pz = Math.floor(z * S + this.MS / 2);
    if (px < 0 || pz < 0 || px >= this.MS || pz >= this.MS) return false;
    return this.mask[pz * this.MS + px] === 1;
  };
  function pip(r, x, z) {
    var inside = false, n = r.length / 2;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var xi = r[i * 2], zi = r[i * 2 + 1], xj = r[j * 2], zj = r[j * 2 + 1];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) inside = !inside;
    }
    return inside;
  }
  World.prototype.insideBuilding = function (b, x, z) {
    if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) return false;
    if (!pip(b.rings[0], x, z)) return false;
    for (var k = 1; k < b.rings.length; k++) if (pip(b.rings[k], x, z)) return false;
    return true;
  };
  World.prototype.buildingAt = function (x, z) {
    var gx = Math.floor((x - this.G0) / this.CS), gz = Math.floor((z - this.G0) / this.CS);
    if (gx < 0 || gz < 0 || gx >= this.GN || gz >= this.GN) return null;
    var cell = this.bgrid[gz * this.GN + gx]; if (!cell) return null;
    for (var i = 0; i < cell.length; i++) { var b = this.W.buildings[cell[i]]; if (this.insideBuilding(b, x, z)) return b; }
    return null;
  };
  // can a person stand here? (shophouse walkways count as open)
  World.prototype.walkable = function (x, z) {
    if (x * x + z * z > (this.W.radius - 30) * (this.W.radius - 30)) return false;
    if (!this.onLand(x, z)) return false;
    var b = this.buildingAt(x, z); if (!b) return true;
    if ((b.flags & 1) && b.fe !== 255) {       // inside the five-foot way strip?
      var r = b.rings[0], n = r.length / 2, i = b.fe, j = (i + 1) % n, ax = r[i * 2], az = r[i * 2 + 1], bx = r[j * 2], bz = r[j * 2 + 1];
      var dx = bx - ax, dz = bz - az, l = Math.sqrt(dx * dx + dz * dz) || 1, dist = Math.abs((x - ax) * (-dz / l) + (z - az) * (dx / l));
      if (dist < 1.9) return true;
    }
    return false;
  };
  World.prototype.nearJunction = function (x, z, pad) {
    var J = this.W.junctions, gx = Math.floor(x / 20), gz = Math.floor(z / 20);
    for (var a = gx - 1; a <= gx + 1; a++) for (var b = gz - 1; b <= gz + 1; b++) {
      var c = this.jhash[a + ',' + b]; if (!c) continue;
      for (var i = 0; i < c.length; i++) { var k = c[i], dx = J[k] - x, dz = J[k + 1] - z, r = J[k + 2] + (pad || 0); if (dx * dx + dz * dz < r * r) return true; }
    }
    return false;
  };
  // nearest road (optionally named) -> {road, d, x, z, t}
  World.prototype.nearestRoad = function (x, z, maxd, filter) {
    var best = null, gx = Math.floor(x / 100), gz = Math.floor(z / 100), rad = Math.ceil((maxd || 60) / 100);
    for (var a = gx - rad; a <= gx + rad; a++) for (var b = gz - rad; b <= gz + rad; b++) {
      var c = this.rgrid[a + ',' + b]; if (!c) continue;
      for (var i = 0; i < c.length; i++) {
        var r = this.W.roads[c[i]]; if (filter && !filter(r)) continue;
        var p = r.pts;
        for (var q = 0; q < p.length - 2; q += 2) {
          var x0 = p[q], z0 = p[q + 1], dx = p[q + 2] - x0, dz = p[q + 3] - z0, l2 = dx * dx + dz * dz || 1;
          var t = ((x - x0) * dx + (z - z0) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
          var cx = x0 + dx * t, cz = z0 + dz * t, d2 = (cx - x) * (cx - x) + (cz - z) * (cz - z);
          if (!best || d2 < best.d2) best = { road: r, d2: d2, x: cx, z: cz, seg: q / 2, t: t, dx: dx, dz: dz };
        }
      }
    }
    if (best) { best.d = Math.sqrt(best.d2); if (maxd && best.d > maxd) return null; }
    return best;
  };
  // deck height of an elevated road under (x,z), close to the height we are already at
  World.prototype.groundHeight = function (x, z, curY) {
    var gx = Math.floor(x / 100), gz = Math.floor(z / 100), best = 0, bestDiff = Math.abs(curY || 0);
    for (var a = gx - 1; a <= gx + 1; a++) for (var b = gz - 1; b <= gz + 1; b++) {
      var c = this.egrid[a + ',' + b]; if (!c) continue;
      for (var i = 0; i < c.length; i++) {
        var r = this.W.roads[c[i]], p = r.pts;
        for (var q = 0; q < p.length - 2; q += 2) {
          var x0 = p[q], z0 = p[q + 1], dx = p[q + 2] - x0, dz = p[q + 3] - z0, l2 = dx * dx + dz * dz || 1;
          var t = ((x - x0) * dx + (z - z0) * dz) / l2; if (t < 0 || t > 1) continue;
          var cx = x0 + dx * t, cz = z0 + dz * t, d2 = (cx - x) * (cx - x) + (cz - z) * (cz - z), hw = r.w / 2 + 0.6;
          if (d2 > hw * hw) continue;
          var hh = r.h[q / 2] + (r.h[q / 2 + 1] - r.h[q / 2]) * t, diff = Math.abs(hh - (curY || 0));
          if (diff < 1.6 && diff <= bestDiff + 1.6 && (best === 0 || diff < bestDiff)) { best = hh; bestDiff = diff; }
        }
      }
    }
    return best;
  };

  /* ---------------- roads, paths, markings, flyovers */
  World.prototype._buildRoads = function () {
    var W = this.W, self = this, TS = 1000, tiles = {}, i;
    function tile(x, z) {
      var k = Math.floor(x / TS) + ',' + Math.floor(z / TS);
      return tiles[k] || (tiles[k] = { sub: new Flat(), side: new Flat(), svc: new Flat(), main: new Flat(), mark: new Flat(), dash: new Flat(), elev: new Buf() });
    }
    // cut a polyline into the stretches that are clear of junctions
    function clearRuns(p, pad) {
      var runs = [], cur = null, n = p.length / 2;
      for (var k = 0; k < n - 1; k++) {
        var x0 = p[k * 2], z0 = p[k * 2 + 1], x1 = p[k * 2 + 2], z1 = p[k * 2 + 3], len = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(1, Math.ceil(len / 5));
        for (var s = 0; s < steps; s++) {
          var ta = s / steps, tb = (s + 1) / steps, mx = x0 + (x1 - x0) * (ta + tb) / 2, mz = z0 + (z1 - z0) * (ta + tb) / 2;
          if (self.nearJunction(mx, mz, pad)) { if (cur && cur.length >= 4) runs.push(cur); cur = null; continue; }
          if (!cur) cur = [x0 + (x1 - x0) * ta, z0 + (z1 - z0) * ta];
          cur.push(x0 + (x1 - x0) * tb, z0 + (z1 - z0) * tb);
        }
      }
      if (cur && cur.length >= 4) runs.push(cur);
      return runs;
    }
    for (i = 0; i < W.roads.length; i++) {
      var r = W.roads[i], p = r.pts, n = p.length / 2, cls = r.cls, w = r.w, mid = Math.floor(n / 2) * 2, t = tile(p[mid], p[mid + 1]);
      if (r.h) { this._elevated(t.elev, r); continue; }
      if (cls === 40 || cls === 41) { t.sub.ribbon(p, w / 2 + (cls === 40 ? 1.1 : 0.4), 0, 0.03, C_CANAL); t.sub.ribbon(p, w / 2, 0, 0.035, C_WATERR); continue; }
      if (cls === 42) { t.sub.ribbon(p, w / 2, 0, 0.3, C_PIER); continue; }
      if (cls === 43) { t.sub.ribbon(p, w / 2, 0, 0.2, C_ROCK); continue; }
      if (cls === 30) continue;
      if (cls === 20) { t.dash.ribbon(p, w / 2, 0, 0.11, C_WHITE, { uv: true, u0: 0.5, u1: 1, vs: 1.2 }); continue; }
      if (cls >= 14) {
        var pc = cls === 14 ? C_PED : cls === 17 ? C_CYCLE : cls === 18 ? C_STEPS : C_FOOT;
        t.side.ribbon(p, w / 2, 0, 0.045, pc); continue;
      }
      var major = cls <= 9, link = cls % 2 === 1 && cls <= 9;
      if (cls === 13) { t.svc.ribbon(p, w / 2, 0, 0.06, C_SERVICE); continue; }
      // pavements either side
      if (cls >= 4 && cls <= 12 && !link) { var sw = cls <= 7 ? 2.6 : 2.0; t.side.ribbon(p, sw / 2, w / 2 + sw / 2 - 0.1, 0.05, C_SIDE); t.side.ribbon(p, sw / 2, -(w / 2 + sw / 2 - 0.1), 0.05, C_SIDE); }
      t.main.ribbon(p, w / 2, 0, 0.08, major ? C_ASPHALT : C_ASPHALT2);
      if (w < 6 || link || cls === 12) continue;
      var runs = clearRuns(p, 1.5), oneway = r.flags & 1, lanes = r.lanes || Math.max(1, Math.floor((w - 0.9) / 3.3)), k, q;
      for (q = 0; q < runs.length; q++) {
        var run = new Float32Array(runs[q]);
        if (cls >= 2 && cls <= 10 && w >= 6.4) { t.mark.ribbon(run, 0.07, w / 2 - 0.28, 0.1, C_YELLOW); t.mark.ribbon(run, 0.07, -(w / 2 - 0.28), 0.1, C_YELLOW); }
        if (oneway) {
          for (k = 1; k < lanes; k++) t.dash.ribbon(run, 0.07, -w / 2 + 0.45 + (w - 0.9) * k / lanes, 0.1, C_WHITE, { uv: true, u0: 0, u1: 0.5, vs: 9 });
        } else if (lanes >= 4) {
          t.mark.ribbon(run, 0.06, 0.13, 0.1, C_WHITE); t.mark.ribbon(run, 0.06, -0.13, 0.1, C_WHITE);
          var half = lanes / 2;
          for (k = 1; k < half; k++) { var off = (w / 2 - 0.45) * k / half; t.dash.ribbon(run, 0.07, off, 0.1, C_WHITE, { uv: true, u0: 0, u1: 0.5, vs: 9 }); t.dash.ribbon(run, 0.07, -off, 0.1, C_WHITE, { uv: true, u0: 0, u1: 0.5, vs: 9 }); }
        } else if (cls <= 11) {
          t.dash.ribbon(run, 0.07, 0, 0.1, C_WHITE, { uv: true, u0: 0, u1: 0.5, vs: 9 });
        }
      }
    }
    // paved apron between each shophouse / terrace front and the kerb
    for (i = 0; i < W.buildings.length; i++) {
      var bd = W.buildings[i]; if (!(bd.kind === 1 || bd.kind === 2 || bd.kind === 11) || bd.fe === 255) continue;
      var rg = bd.rings[0], nn = rg.length / 2; if (bd.fe >= nn) continue;
      var e0 = bd.fe, e1 = (bd.fe + 1) % nn, ax = rg[e0 * 2], az = rg[e0 * 2 + 1], bx = rg[e1 * 2], bz = rg[e1 * 2 + 1];
      var ll = Math.hypot(bx - ax, bz - az) || 1, ox = -(bz - az) / ll, oz = (bx - ax) / ll;
      var nr = this.nearestRoad((ax + bx) / 2 + ox, (az + bz) / 2 + oz, 22, function (rd) { return rd.cls <= 13 && !rd.h; });
      var dep = nr ? Math.min(9, Math.max(0.6, nr.d - nr.road.w / 2 + 0.6)) : 2.5;
      var at = tile((ax + bx) / 2, (az + bz) / 2).side, v0 = at.v, pc2 = bd.kind === 2 ? C_APRON2 : C_APRON;
      at.vert(ax, 0.04, az, pc2); at.vert(bx, 0.04, bz, pc2); at.vert(bx + ox * dep, 0.04, bz + oz * dep, pc2); at.vert(ax + ox * dep, 0.04, az + oz * dep, pc2);
      at.i.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2);
    }
    // round off junctions so corners have no wedges
    var J = W.junctions;
    for (i = 0; i < J.length; i += 3) { var jt = tile(J[i], J[i + 1]); jt.main.disc(J[i], J[i + 1], Math.max(2, J[i + 2] - 2.5), 0.08, C_ASPHALT2); }
    // dash + zebra texture: left half lane dashes, right half crossing bars
    var dashTex = KD.canvasTexture(T, 64, 64, function (c) {
      c.clearRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.fillRect(0, 0, 32, 22); c.fillRect(32, 0, 32, 32);
    }, { repeat: true });
    dashTex.wrapS = T.ClampToEdgeWrapping; dashTex.magFilter = T.LinearFilter;
    this.matFlat = this._flatMat(1);
    this.matDash = new T.MeshLambertMaterial({ map: dashTex, vertexColors: true, alphaTest: 0.5, transparent: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
    this.matElev = new T.MeshLambertMaterial({ color: 0xffffff });
    var fac = this.facade, U = this.uniforms, bm = this.matBuilding;
    this.roadTiles = [];
    for (var key in tiles) {
      var tt = tiles[key], f = new Flat();
      // one mesh, painter's order: canals, pavements, service lanes, roads, solid lines
      ['sub', 'side', 'svc', 'main', 'mark'].forEach(function (name) {
        var s = tt[name], base = f.v, a;
        for (a = 0; a < s.p.length; a++) f.p.push(s.p[a]);
        for (a = 0; a < s.c.length; a++) f.c.push(s.c[a]);
        for (a = 0; a < s.i.length; a++) f.i.push(s.i[a] + base);
        f.v += s.v;
      });
      var grp = { meshes: [] };
      if (f.v) { var m1 = new T.Mesh(f.toGeometry(), this.matFlat); m1.receiveShadow = true; m1.renderOrder = -2; this.scene.add(m1); grp.meshes.push(m1); }
      if (tt.dash.v) { var m2 = new T.Mesh(tt.dash.toGeometry(), this.matDash); m2.renderOrder = -1; this.scene.add(m2); grp.meshes.push(m2); grp.dash = m2; }
      if (tt.elev.v) { var m3 = new T.Mesh(tt.elev.toGeometry(), bm); m3.castShadow = true; m3.receiveShadow = true; this.scene.add(m3); grp.meshes.push(m3); }
      this.roadTiles.push(grp);
    }
  };
  // flyovers, footbridges and MRT viaducts as real decks on pillars
  World.prototype._elevated = function (B, r) {
    var p = r.pts, n = p.length / 2, hw = r.w / 2, rail = r.cls === 30, foot = r.cls >= 14 && r.cls <= 20;
    var deck = rail ? [176, 172, 164] : foot ? [196, 192, 184] : [86, 89, 94], side = [188, 185, 177], acc = 0;
    for (var k = 0; k < n - 1; k++) {
      var x0 = p[k * 2], z0 = p[k * 2 + 1], x1 = p[k * 2 + 2], z1 = p[k * 2 + 3], dx = x1 - x0, dz = z1 - z0, l = Math.sqrt(dx * dx + dz * dz); if (l < 0.01) continue;
      var nx = -dz / l * hw, nz = dx / l * hw, y0 = r.h[k] + 0.05, y1 = r.h[k + 1] + 0.05, th = foot ? 0.35 : 1.0, ph = foot ? 1.1 : 0.9;
      var a = [x0 - nx, y0, z0 - nz], b = [x0 + nx, y0, z0 + nz], c = [x1 + nx, y1, z1 + nz], d = [x1 - nx, y1, z1 - nz];
      B.quad(a, b, c, d, 0, 0, 1, l / 6, deck, L.PLAIN, 0, 1, 0);
      if (Math.max(y0, y1) > 0.6) {
        B.quad([a[0], y0 - th, a[2]], [b[0], y0 - th, b[2]], [c[0], y1 - th, c[2]], [d[0], y1 - th, d[2]], 0, 0, 1, 1, shade(side, 0.75), L.PLAIN, 0, -1, 0);
        // sides + parapets (both faces)
        [[a, d, -1], [b, c, 1]].forEach(function (e) {
          var s0 = e[0], s1 = e[1], sg = e[2], ox = -dz / l * sg, oz = dx / l * sg;
          B.quad([s0[0], s0[1] - th, s0[2]], [s1[0], s1[1] - th, s1[2]], [s1[0], s1[1] + ph, s1[2]], [s0[0], s0[1] + ph, s0[2]], 0, 0, l / 6, 0.3, side, L.PLAIN, ox, 0, oz);
          B.quad([s0[0], s0[1], s0[2]], [s1[0], s1[1], s1[2]], [s1[0], s1[1] + ph, s1[2]], [s0[0], s0[1] + ph, s0[2]], 0, 0, l / 6, 0.3, shade(side, 0.9), L.PLAIN, -ox, 0, -oz);
        });
      }
      if (rail) B.quad([x0 - nx * 0.3, y0 + 0.04, z0 - nz * 0.3], [x0 + nx * 0.3, y0 + 0.04, z0 + nz * 0.3], [x1 + nx * 0.3, y1 + 0.04, z1 + nz * 0.3], [x1 - nx * 0.3, y1 + 0.04, z1 - nz * 0.3], 0, 0, 1, 1, [98, 92, 86], L.PLAIN, 0, 1, 0);
      // pillars
      var gap = foot ? 18 : 30, ps = foot ? 0.35 : rail ? 0.9 : 0.8;
      while (acc < l) {
        var tt = acc / l, hx = x0 + dx * tt, hz = z0 + dz * tt, hy = r.h[k] + (r.h[k + 1] - r.h[k]) * tt;
        if (hy > 2.6 && !this.nearJunction(hx, hz, 3) && this.onLand(hx, hz)) B.box(hx - ps, hz - ps, hx + ps, hz + ps, 0, hy - th + 0.05, [190, 187, 180], L.PLAIN, false);
        acc += gap;
      }
      acc -= l;
    }
  };

  /* ---------------- buildings, a tile at a time */
  World.prototype.buildTile = function (ti) {
    var W = this.W, t = W.btiles[ti], B = new Buf(), self = this, ranges = [], ids = [];
    var ctx = { landmarks: [], poiB: this.poiB, inside: function (b, x, z) { return self.insideBuilding(b, x, z); } };
    for (var i = t[2]; i < t[2] + t[3]; i++) {
      var b = W.buildings[i], start = B.i.length;
      try { buildBuilding(B, b, W, ctx); } catch (e) { if (!this._warned) { this._warned = 1; console.warn('building failed', b.id, e); } }
      if (B.i.length > start) { ranges.push(start / 3); ids.push(i); }
    }
    if (!B.v) return null;
    var m = new T.Mesh(B.toGeometry(), this.matBuilding);
    m.castShadow = true; m.receiveShadow = true; m.userData = { ranges: ranges, ids: ids, tile: ti };
    this.scene.add(m); this.tiles.push(m);
    for (i = 0; i < ctx.landmarks.length; i++) this._landmark(ctx.landmarks[i]);
    return m;
  };
  World.prototype._landmark = function (lm) {
    var m;
    if (lm.type === 'dome') {
      m = new T.Mesh(new T.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.45, metalness: 0.1 }));
      m.scale.set(lm.r * 1.02, lm.r * 0.52, lm.r * 1.02); m.position.set(lm.x, lm.y, lm.z);
    } else if (lm.type === 'mosque') {
      m = new T.Group();
      var r = Math.min(7, Math.max(3, (lm.b.x1 - lm.b.x0) * 0.16));
      var dome = new T.Mesh(new T.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), new T.MeshLambertMaterial({ color: 0xd9b24c }));
      dome.position.y = r * 0.25; m.add(dome);
      var min = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 16, 8), new T.MeshLambertMaterial({ color: 0xf6f3ea })); min.position.set(r * 1.6, 3, r * 1.2); m.add(min);
      var cap = new T.Mesh(new T.ConeGeometry(1.1, 3, 8), new T.MeshLambertMaterial({ color: 0x3f8f6a })); cap.position.set(r * 1.6, 12.4, r * 1.2); m.add(cap);
      m.position.set(lm.x, lm.y, lm.z);
    } else if (lm.type === 'gopuram') {
      m = new T.Group(); var cols = [0xe36f8f, 0x4fa6c9, 0xf2c14e, 0x6dbb8a, 0xe9805a], s = 4.2;
      for (var k = 0; k < 5; k++) { var bx = new T.Mesh(new T.BoxGeometry(s * (1 - k * 0.15) * 1.6, 2.2, s * (1 - k * 0.15)), new T.MeshLambertMaterial({ color: cols[k] })); bx.position.y = 1.1 + k * 2.2; m.add(bx); }
      var top = new T.Mesh(new T.CylinderGeometry(0.2, 1.6, 1.8, 8), new T.MeshLambertMaterial({ color: 0xd9b24c })); top.position.y = 11.8; m.add(top);
      var b = lm.b, rg = b.rings[0], n = rg.length / 2, fx = lm.x, fz = lm.z;
      m.position.set(fx, lm.y - 1, fz);
    } else if (lm.type === 'spire') {
      m = new T.Group();
      var tw = new T.Mesh(new T.BoxGeometry(3.2, 7, 3.2), new T.MeshLambertMaterial({ color: 0xf4f2ec })); tw.position.y = 3.5; m.add(tw);
      var sp = new T.Mesh(new T.ConeGeometry(2.4, 8, 4), new T.MeshLambertMaterial({ color: 0x70767c })); sp.position.y = 11; sp.rotation.y = Math.PI / 4; m.add(sp);
      m.position.set(lm.x, lm.y - 0.5, lm.z);
    } else return;
    m.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
    this.scene.add(m); this.landmarks.push(m);
  };

  /* ---------------- trees */
  World.prototype._buildTreeProtos = function () {
    function merge(parts) {
      var pos = [], col = [], idx = [], nor = [], base = 0;
      parts.forEach(function (pt) {
        var g = pt.g.index ? pt.g.toNonIndexed() : pt.g; g.computeVertexNormals();
        var p = g.attributes.position, nn = g.attributes.normal, c = new T.Color(pt.c), c2 = pt.c2 ? new T.Color(pt.c2) : null;
        var ymin = Infinity, ymax = -Infinity, i;
        for (i = 0; i < p.count; i++) { ymin = Math.min(ymin, p.getY(i)); ymax = Math.max(ymax, p.getY(i)); }
        for (i = 0; i < p.count; i++) {
          pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(nn.getX(i), nn.getY(i), nn.getZ(i));
          var tt = (p.getY(i) - ymin) / ((ymax - ymin) || 1), cc = c2 ? c.clone().lerp(c2, tt) : c;
          col.push(cc.r, cc.g, cc.b); idx.push(base + i);
        }
        base += p.count;
      });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
    }
    function ico(r, sx, sy, sz, x, y, z, det) { var g = new T.IcosahedronGeometry(r, det || 0); g.scale(sx, sy, sz); g.translate(x, y, z); return g; }
    function cyl(r0, r1, h, y, seg, x, z) { var g = new T.CylinderGeometry(r0, r1, h, seg || 6, 1, true); g.translate(x || 0, y + h / 2, z || 0); return g; }
    var trunk = '#6b5340';
    // rain tree: tall trunk, wide umbrella crown
    var rain = merge([{ g: cyl(0.2, 0.36, 8.4, 0, 6), c: trunk }, { g: ico(4.2, 1.2, 0.48, 1.2, 0, 9.6, 0, 1), c: '#4a8a42', c2: '#86bf62' },
      { g: ico(2.7, 1.1, 0.6, 1, 2.4, 8.8, 1.1), c: '#447f3d', c2: '#78b259' }, { g: ico(2.7, 1, 0.6, 1.1, -2.2, 9.0, -1.3), c: '#4c8d44', c2: '#8cc466' }]);
    // palm
    var parts = [{ g: cyl(0.14, 0.22, 8.2, 0, 5), c: '#8a7558' }];
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2, g = new T.PlaneGeometry(0.9, 3.6, 1, 3), p = g.attributes.position;
      for (var i = 0; i < p.count; i++) { var yy = p.getY(i) + 1.8; p.setXYZ(i, p.getX(i) * (1 - yy / 4.2), -Math.pow(yy / 3.6, 2) * 1.5, yy); }
      g.rotateY(a); g.translate(0, 8.3, 0); parts.push({ g: g, c: '#4f8f3f', c2: '#3c7a33' });
    }
    var palm = merge(parts);
    var small = merge([{ g: cyl(0.12, 0.18, 2.6, 0, 5), c: trunk }, { g: ico(2.1, 1, 0.95, 1, 0, 4.1, 0, 1), c: '#4c8a3c', c2: '#8cc060' }]);
    var c1 = new T.ConeGeometry(2.0, 5.2, 7); c1.translate(0, 5.4, 0); var c2 = new T.ConeGeometry(1.4, 4.4, 7); c2.translate(0, 8.4, 0);
    var casu = merge([{ g: cyl(0.14, 0.2, 3.2, 0, 5), c: trunk }, { g: c1, c: '#2f6a45', c2: '#4b8c5a' }, { g: c2, c: '#356f48', c2: '#5a9a62' }]);
    this.treeGeo = [rain, palm, small, casu];
    var U = this.uniforms;
    this.matTree = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
    this.matTree.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat kdW = max(position.y - 2.5, 0.0) * 0.035; float kdP = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;\ntransformed.x += sin(uTime * 1.2 + kdP + position.y * 0.3) * kdW; transformed.z += cos(uTime * 0.9 + kdP) * kdW;\n#endif');
    };
  };
  World.prototype.buildTrees = function () {
    var W = this.W, CH = 1000, chunks = {}, i, k, self = this, keep = this.mobile ? 0.55 : 1;
    for (i = 0; i < W.trees.length; i++) {
      var d = W.trees[i].data;
      for (k = 0; k < d.length; k += 4) {
        if (keep < 1 && ((k * 2654435761) >>> 0) / 4294967296 > keep) continue;
        var key = Math.floor(d[k] / CH) + ',' + Math.floor(d[k + 1] / CH), c = chunks[key] || (chunks[key] = [[], [], [], []]);
        c[d[k + 2] | 0].push(d[k], d[k + 1], d[k + 3]);
      }
    }
    var dummy = new T.Object3D(), col = new T.Color();
    for (var key2 in chunks) {
      var parts = key2.split(','), cx = (+parts[0] + 0.5) * CH, cz = (+parts[1] + 0.5) * CH;
      for (var ty = 0; ty < 4; ty++) {
        var arr = chunks[key2][ty], n = arr.length / 3; if (!n) continue;
        var im = new T.InstancedMesh(this.treeGeo[ty], this.matTree, n), r = KD.rng(n * 7 + ty);
        for (k = 0; k < n; k++) {
          var s = arr[k * 3 + 2] * (ty === 0 ? 1.15 : 1);
          dummy.position.set(arr[k * 3], 0, arr[k * 3 + 1]); dummy.rotation.set(0, r() * 6.28, 0); dummy.scale.set(s, s * (0.85 + r() * 0.3), s); dummy.updateMatrix();
          im.setMatrixAt(k, dummy.matrix);
          col.setHSL(0, 0, 0.82 + r() * 0.3); im.setColorAt(k, col);
        }
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.castShadow = this.quality === 'high'; im.receiveShadow = false;
        im.boundingSphere = new T.Sphere(new T.Vector3(cx, 6, cz), CH * 0.75);
        im.userData = { cx: cx, cz: cz, total: n };
        this.scene.add(im); this.treeChunks.push(im);
      }
    }
  };

  /* ---------------- progressive loading */
  World.prototype.buildAll = function (done) {
    var self = this, total = this.W.btiles.length, ti = 0, treesDone = false;
    function step() {
      var t0 = performance.now();
      while (ti < total && performance.now() - t0 < 22) { self.buildTile(ti++); }
      if (!treesDone && ti >= Math.min(total, 12)) { self.buildTrees(); treesDone = true; }
      if (self.onProgress) self.onProgress(ti / total, ti);
      if (ti < total) (self.opts.sync ? step : requestAnimationFrame)(step); else { self.ready = true; if (done) done(); }
    }
    step();
  };

  /* ---------------- time of day */
  var TOD = {
    morning: { top: 0x6fa9e0, hor: 0xf6dcc4, fog: 0xead9cc, sun: 0xffe2bd, sunI: 2.1, hemiS: 0xe6efff, hemiG: 0xa59a88, hemiI: 0.95, dir: [-0.72, 0.42, 0.25], exp: 1.02, glow: 0.0, stars: 0, water: 0x4a93a8, land: 0xc2d0a8, label: 'Morning' },
    day: { top: 0x3f86d8, hor: 0xcfe6f2, fog: 0xd3e6ef, sun: 0xfff4e2, sunI: 2.6, hemiS: 0xdcecff, hemiG: 0x9c9686, hemiI: 1.05, dir: [0.38, 0.86, 0.3], exp: 1.0, glow: 0.0, stars: 0, water: 0x3d8ca6, land: 0xbfcfa6, label: 'Midday' },
    golden: { top: 0x5a7fc0, hor: 0xffc28a, fog: 0xf3c9a4, sun: 0xffb066, sunI: 2.5, hemiS: 0xffd9c0, hemiG: 0x8f7f76, hemiI: 0.8, dir: [0.82, 0.24, -0.35], exp: 1.05, glow: 0.35, stars: 0, water: 0x5f8fa0, land: 0xc7c79a, label: 'Golden hour' },
    night: { top: 0x070d24, hor: 0x24304f, fog: 0x1c2640, sun: 0x8fa6e0, sunI: 0.55, hemiS: 0x41507c, hemiG: 0x1c1e2a, hemiI: 0.75, dir: [-0.3, 0.75, -0.4], exp: 1.25, glow: 1.6, stars: 1, water: 0x16314a, land: 0x55664f, label: 'Night' }
  };
  KD.TOD = TOD;
  World.prototype.setTimeOfDay = function (name, instant) {
    var t = TOD[name] || TOD.day; this.tod = name;
    this._todTarget = t; if (instant || !this._todCur) { this._todCur = JSON.parse(JSON.stringify(t)); this._applyTod(this._todCur); }
  };
  function lerpHex(a, b, t) { var ca = new T.Color(a), cb = new T.Color(b); return ca.lerp(cb, t).getHex(); }
  World.prototype._applyTod = function (c) {
    this.skyU.top.value.set(c.top); this.skyU.hor.value.set(c.hor); this.skyU.sunCol.value.set(c.sun); this.skyU.stars.value = c.stars;
    this.scene.fog.color.set(c.fog); this.matMist.color.set(c.fog);
    this.sun.color.set(c.sun); this.sun.intensity = c.sunI; this.hemi.color.set(c.hemiS); this.hemi.groundColor.set(c.hemiG); this.hemi.intensity = c.hemiI;
    this.sunDir.set(c.dir[0], c.dir[1], c.dir[2]).normalize(); this.skyU.sunDir.value.copy(this.sunDir);
    this.renderer.toneMappingExposure = c.exp; this.uniforms.uGlow.value = c.glow;
    this.matWater.color.set(c.water); this.matLand.color.set(c.land);
  };
  World.prototype._tickTod = function (dt) {
    var c = this._todCur, t = this._todTarget; if (!c || !t || c === t) return;
    var k = Math.min(1, dt * 1.8), done = true;
    ['top', 'hor', 'fog', 'sun', 'hemiS', 'hemiG', 'water', 'land'].forEach(function (key) { if (c[key] !== t[key]) { c[key] = lerpHex(c[key], t[key], k); if (Math.abs(c[key] - t[key]) > 0) done = false; } });
    ['sunI', 'hemiI', 'exp', 'glow', 'stars'].forEach(function (key) { c[key] += (t[key] - c[key]) * k; if (Math.abs(c[key] - t[key]) > 0.01) done = false; });
    for (var i = 0; i < 3; i++) { c.dir[i] += (t.dir[i] - c.dir[i]) * k; if (Math.abs(c.dir[i] - t.dir[i]) > 0.01) done = false; }
    this._applyTod(c);
    this._todSteps = (this._todSteps || 0) + 1;
    if (done || this._todSteps > 240) { this._todCur = JSON.parse(JSON.stringify(t)); this._applyTod(this._todCur); this._todSteps = 0; this._todTarget = this._todCur; }
  };

  /* ---------------- per-frame */
  World.prototype.resize = function (w, h) {
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };
  // focus = point the shadows and detail centre on; range = how far the eye can usefully see
  World.prototype.update = function (dt, focus, viewDist, walking) {
    this.time += dt; this.uniforms.uTime.value = this.time;
    this._tickTod(dt);
    var cam = this.camera;
    this.sky.position.copy(cam.position); this.skyU.cloudT.value = this.time * 0.004; this.skyU.cloudLit.value = Math.min(1, this.sun.intensity / 2.2);
    this.waterNormal.offset.x = this.time * 0.004; this.waterNormal.offset.y = this.time * 0.0027;
    if (this.inlandNormal) { this.inlandNormal.offset.x = this.time * 0.01; this.inlandNormal.offset.y = this.time * 0.006; }
    // fog + clip planes follow the view scale
    var fog = this.scene.fog;
    if (walking) { fog.near = 180; fog.far = this.mobile ? 1500 : 2400; cam.near = 0.25; cam.far = 34000; }
    else { fog.near = viewDist * 1.6 + 300; fog.far = viewDist * 7 + 5200; cam.near = Math.max(1, viewDist * 0.02); cam.far = 60000; }
    cam.updateProjectionMatrix();
    // shadows hug the focus
    if (this.sun.castShadow) {
      var size = walking ? 170 : Math.min(2600, Math.max(260, viewDist * 0.9)), sc = this.sun.shadow.camera;
      sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = size * 6 + 400; sc.updateProjectionMatrix();
      var tex = size * 2 / this.sun.shadow.mapSize.x, fx = Math.round(focus.x / tex) * tex, fz = Math.round(focus.z / tex) * tex;
      this.sun.target.position.set(fx, 0, fz); this.sun.position.set(fx + this.sunDir.x * size * 3, this.sunDir.y * size * 3, fz + this.sunDir.z * size * 3);
      this.sun.shadow.normalBias = walking ? 0.25 : Math.min(3, size * 0.004);
    } else { this.sun.position.copy(this.sunDir).multiplyScalar(1000); this.sun.target.position.set(0, 0, 0); }
    // thin out far trees; hide the tiny stuff from high up
    var far = walking ? (this.mobile ? 900 : 1500) : Math.max(1500, viewDist * 3.5), i;
    for (i = 0; i < this.treeChunks.length; i++) {
      var t = this.treeChunks[i], dx = t.userData.cx - focus.x, dz = t.userData.cz - focus.z, d = Math.sqrt(dx * dx + dz * dz);
      if (d > far + 800) { t.visible = false; continue; }
      t.visible = true;
      var f = walking ? (d < 700 ? 1 : 0.5) : (viewDist < 900 ? 1 : viewDist < 2500 ? 0.6 : 0.3);
      t.count = Math.max(1, Math.floor(t.userData.total * f));
    }
    var showDash = walking || viewDist < 1400;
    for (i = 0; i < this.roadTiles.length; i++) if (this.roadTiles[i].dash) this.roadTiles[i].dash.visible = showDash;
  };
  World.prototype.render = function () { this.renderer.render(this.scene, this.camera); };

  /* ---------------- picking */
  World.prototype.pickBuilding = function (ndcX, ndcY) {
    var rc = this._rc || (this._rc = new T.Raycaster()); rc.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    var hits = rc.intersectObjects(this.tiles, false);
    if (!hits.length) return null;
    var h = hits[0], ud = h.object.userData, f = h.faceIndex, lo = 0, hi = ud.ranges.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (ud.ranges[mid] <= f) lo = mid; else hi = mid - 1; }
    return { building: this.W.buildings[ud.ids[lo]], point: h.point, distance: h.distance };
  };
  World.prototype.pickGround = function (ndcX, ndcY) {
    var rc = this._rc || (this._rc = new T.Raycaster()); rc.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    var o = rc.ray.origin, d = rc.ray.direction; if (d.y >= -1e-4) return null;
    var t = -o.y / d.y; return new T.Vector3(o.x + d.x * t, 0, o.z + d.z * t);
  };
  // translucent highlight over one building
  World.prototype.highlight = function (b) {
    if (this._hl) { this.scene.remove(this._hl); this._hl.geometry.dispose(); this._hl = null; }
    if (!b) return;
    var pos = [], idx = [], r = b.rings[0], n = r.length / 2, y0 = b.mh, y1 = b.h + (b.inset ? b.rise : (b.kind === 1 || b.kind === 2 || b.kind === 11) ? 2.6 : 0) + 0.4, i;
    for (i = 0; i < n; i++) { pos.push(r[i * 2], y0, r[i * 2 + 1], r[i * 2], y1, r[i * 2 + 1]); }
    for (i = 0; i < n; i++) { var a = i * 2, c = ((i + 1) % n) * 2; idx.push(a, c, a + 1, c, c + 1, a + 1); }
    var t = triangulate([r]), base = n * 2;
    for (i = 0; i < t.pts.length; i++) pos.push(t.pts[i].x, y1, t.pts[i].y);
    for (i = 0; i < t.tris.length; i++) idx.push(base + t.tris[i][0], base + t.tris[i][2], base + t.tris[i][1]);
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    var m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xff4f8b, transparent: true, opacity: 0.34, depthWrite: false, side: T.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.renderOrder = 40; this.scene.add(m); this._hl = m;
  };

  KD.World = World;
  KD.hex = hex;
})();
