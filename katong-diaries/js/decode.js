/* Katong Diaries — decode the packed world data (window.KD_WORLD) into typed arrays.
   Coordinates: metres from Starbucks Katong Square. x = east, z = south, y = up. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});

  function bytes(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u;
  }

  /* read a ring: u16 n, i32 x0, i32 z0, then int16 deltas (decimetres) */
  function readRing(dv, o) {
    var n = dv.getUint16(o.p, true); o.p += 2;
    var a = new Float32Array(n * 2);
    var x = dv.getInt32(o.p, true), z = dv.getInt32(o.p + 4, true); o.p += 8;
    a[0] = x / 10; a[1] = z / 10;
    for (var i = 1; i < n; i++) {
      x += dv.getInt16(o.p, true); z += dv.getInt16(o.p + 2, true); o.p += 4;
      a[i * 2] = x / 10; a[i * 2 + 1] = z / 10;
    }
    return a;
  }

  KD.decodeWorld = function (raw) {
    var W = { origin: raw.origin, radius: raw.radius, tile: raw.tile, names: raw.names };
    var u, dv, o, i, n;

    // ---- roads
    u = bytes(raw.roads.b64); dv = new DataView(u.buffer); o = { p: 0 };
    var roads = [];
    while (o.p < u.length) {
      var r = {
        cls: dv.getUint8(o.p), w: dv.getUint8(o.p + 1) / 10, flags: dv.getUint8(o.p + 2),
        layer: dv.getInt8(o.p + 3), lanes: dv.getUint8(o.p + 4), name: dv.getUint16(o.p + 5, true)
      };
      o.p += 7;
      r.pts = readRing(dv, o);
      if (r.flags & 32) {
        n = r.pts.length / 2; r.h = new Float32Array(n);
        for (i = 0; i < n; i++) r.h[i] = dv.getUint8(o.p + i) / 4;
        o.p += n;
      } else r.h = null;
      roads.push(r);
    }
    W.roads = roads;

    // ---- junctions
    u = bytes(raw.junctions.b64); dv = new DataView(u.buffer);
    n = raw.junctions.n; var J = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      J[i * 3] = dv.getInt32(i * 9, true) / 10; J[i * 3 + 1] = dv.getInt32(i * 9 + 4, true) / 10; J[i * 3 + 2] = dv.getUint8(i * 9 + 8) / 10;
    }
    W.junctions = J;

    // ---- areas
    u = bytes(raw.areas.b64); dv = new DataView(u.buffer); o = { p: 0 };
    var areas = [];
    while (o.p < u.length) {
      var a = { cls: dv.getUint8(o.p), rings: [] }; var nr = dv.getUint8(o.p + 1); o.p += 2;
      for (i = 0; i < nr; i++) a.rings.push(readRing(dv, o));
      areas.push(a);
    }
    W.areas = areas;

    // ---- land
    u = bytes(raw.land.b64); dv = new DataView(u.buffer); o = { p: 0 };
    var land = [];
    while (o.p < u.length) {
      var lr = []; var nl = dv.getUint8(o.p); o.p += 1;
      for (i = 0; i < nl; i++) lr.push(readRing(dv, o));
      land.push(lr);
    }
    W.land = land;

    // ---- buildings
    var B = raw.buildings;
    u = bytes(B.b64); dv = new DataView(u.buffer); o = { p: 0 };
    var mu = bytes(B.meta), mdv = new DataView(mu.buffer);
    var bl = new Array(B.n), bi = 0;
    while (o.p < u.length) {
      var b = {
        id: bi, kind: dv.getUint8(o.p), lv: dv.getUint8(o.p + 1), h: dv.getUint16(o.p + 2, true) / 10,
        mh: dv.getUint16(o.p + 4, true) / 10, fe: dv.getUint8(o.p + 6), flags: dv.getUint8(o.p + 7),
        seed: dv.getUint8(o.p + 8), rel: dv.getUint8(o.p + 9), rings: [], inset: null, rise: 0
      };
      var nb = dv.getUint8(o.p + 10); o.p += 11;
      for (i = 0; i < nb; i++) b.rings.push(readRing(dv, o));
      if (b.flags & 2) { b.rise = dv.getUint8(o.p) / 10; o.p += 1; b.inset = readRing(dv, o); }
      b.hn = mdv.getUint16(bi * 7, true); b.st = mdv.getUint16(bi * 7 + 2, true);
      b.nm = mdv.getUint16(bi * 7 + 4, true); b.bt = mdv.getUint8(bi * 7 + 6);
      // centroid-ish (bbox centre) for quick lookups
      var rg = b.rings[0], x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (i = 0; i < rg.length; i += 2) {
        if (rg[i] < x0) x0 = rg[i]; if (rg[i] > x1) x1 = rg[i];
        if (rg[i + 1] < z0) z0 = rg[i + 1]; if (rg[i + 1] > z1) z1 = rg[i + 1];
      }
      b.x0 = x0; b.x1 = x1; b.z0 = z0; b.z1 = z1; b.cx = (x0 + x1) / 2; b.cz = (z0 + z1) / 2;
      bl[bi++] = b;
    }
    W.buildings = bl;
    W.btiles = B.tiles;           // [ix, iz, start, count] nearest-first
    W.hn = B.hn; W.st = B.st; W.nm = B.nm; W.bt = B.bt;

    // ---- trees (per tile)
    var T = raw.trees;
    u = bytes(T.b64); dv = new DataView(u.buffer); var p = 0;
    var tt = [];
    for (i = 0; i < T.tiles.length; i++) {
      var ti = T.tiles[i], cnt = ti[2], arr = new Float32Array(cnt * 4), ox = ti[0] * raw.tile, oz = ti[1] * raw.tile;
      for (var k = 0; k < cnt; k++) {
        var v = dv.getUint8(p + 4);
        arr[k * 4] = ox + dv.getUint16(p, true) / 10; arr[k * 4 + 1] = oz + dv.getUint16(p + 2, true) / 10;
        arr[k * 4 + 2] = v & 3; arr[k * 4 + 3] = (v >> 2) / 32;
        p += 5;
      }
      tt.push({ ix: ti[0], iz: ti[1], data: arr });
    }
    W.trees = tt;
    return W;
  };
})();
