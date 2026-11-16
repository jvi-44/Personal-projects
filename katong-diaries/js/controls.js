/* Katong Diaries — the three ways to look around:
   map    bird's-eye, drag to pan, right-drag / two fingers to turn and tilt, wheel / pinch to zoom
   stroll third person behind the avatar
   pov    first person at eye height, like Street View: drag to look, tap the road to walk there */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var T = window.THREE;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function angDiff(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

  function Controls(world, canvas, avatar) {
    var self = this;
    this.world = world; this.canvas = canvas; this.avatar = avatar; this.cam = world.camera;
    this.mode = 'map';
    this.m = { tx: -95, tz: -300, dist: 1250, yaw: -0.55, el: 0.78 }; this.g = { tx: -95, tz: -300, dist: 1250, yaw: -0.55, el: 0.78 };
    this.pos = new T.Vector3(6, 0, 20); this.heading = Math.PI; this.placed = false;
    this.look = { yaw: 0, pitch: 0.2, dist: 8.5, pov: 0.04, fov: 72 }; this.lg = { yaw: 0, pitch: 0.2, dist: 8.5, pov: 0.04, fov: 72 };
    this.keys = {}; this.joy = { x: 0, y: 0 }; this.run = false; this.auto = null; this.speed = 0;
    this.blend = 1; this.from = { p: new T.Vector3(), q: new T.Quaternion(), fov: 45 }; this.dummy = new T.PerspectiveCamera();
    this.hover = null; this.onTap = null; this.onMode = null; this.idle = 0;
    this.ptr = {}; this.np = 0; this.pinch = null;

    canvas.addEventListener('pointerdown', function (e) {
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      self.ptr[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), btn: e.button, moved: 0, mod: e.ctrlKey || e.shiftKey || e.metaKey };
      self.np = Object.keys(self.ptr).length; self.pinch = null; self.idle = 0;
      if (document.activeElement && document.activeElement !== canvas && document.activeElement.blur) document.activeElement.blur();
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = self.ptr[e.pointerId];
      if (!p) { if (e.pointerType === 'mouse') self.hover = { x: e.clientX, y: e.clientY }; return; }
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
      self.idle = 0;
      if (self.np === 1) self._drag(dx, dy, p);
      else if (self.np === 2) self._pinch();
    });
    function up(e) {
      var p = self.ptr[e.pointerId]; if (!p) return;
      delete self.ptr[e.pointerId]; self.np = Object.keys(self.ptr).length; self.pinch = null;
      if (self.np === 0 && p.moved < 8 && performance.now() - p.t < 600 && p.btn === 0 && self.onTap) self.onTap(e.clientX, e.clientY);
    }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () { self.hover = null; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault(); self.idle = 0;
      var k = Math.exp(clamp(e.deltaY, -240, 240) * 0.0012);
      if (self.mode === 'map') self._zoomAt(k, e.clientX, e.clientY);
      else if (self.mode === 'stroll') self.lg.dist = clamp(self.lg.dist * k, 3.2, 70);
      else self.lg.fov = clamp(self.lg.fov * k, 38, 88);
    }, { passive: false });
    window.addEventListener('keydown', function (e) {
      var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      self.keys[e.code] = 1; self.idle = 0;
      if (/^(Arrow|Space)/.test(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { self.keys[e.code] = 0; });
    window.addEventListener('blur', function () { self.keys = {}; });
  }

  Controls.prototype._drag = function (dx, dy, p) {
    var h = this.canvas.clientHeight || 800;
    if (this.mode === 'map') {
      if (p.btn === 2 || p.btn === 1 || p.mod) { this.g.yaw += dx * 0.0052; this.g.el = clamp(this.g.el + dy * 0.004, 0.16, 1.52); }
      else {
        var wpp = 2 * this.m.dist * Math.tan(this.cam.fov * Math.PI / 360) / h, y = this.m.yaw;
        var rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y), f = wpp / Math.max(0.4, Math.sin(this.m.el));
        this.g.tx += -rx * dx * wpp + fx * dy * f; this.g.tz += -rz * dx * wpp + fz * dy * f; this._clampTarget();
        this.m.tx = this.g.tx; this.m.tz = this.g.tz;
      }
    } else if (this.mode === 'stroll') {
      this.lg.yaw += dx * 0.0055; this.lg.pitch = clamp(this.lg.pitch + dy * 0.004, 0.03, 1.3);
    } else {
      var s = this.look.fov / 72; this.lg.yaw += dx * 0.0038 * s; this.lg.pov = clamp(this.lg.pov + dy * 0.0034 * s, -1.2, 1.2);
    }
  };
  Controls.prototype._pinch = function () {
    var ids = Object.keys(this.ptr), a = this.ptr[ids[0]], b = this.ptr[ids[1]];
    var d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), my = (a.y + b.y) / 2, mx = (a.x + b.x) / 2;
    if (this.pinch) {
      var k = this.pinch.d / Math.max(20, d), da = angDiff(this.pinch.ang, ang);
      if (this.mode === 'map') { this._zoomAt(k, mx, my); this.g.yaw += da; this.g.el = clamp(this.g.el + (my - this.pinch.my) * 0.005, 0.16, 1.52); }
      else if (this.mode === 'stroll') { this.lg.dist = clamp(this.lg.dist * k, 3.2, 70); this.lg.yaw += da; }
      else this.lg.fov = clamp(this.lg.fov * k, 38, 88);
    }
    this.pinch = { d: d, ang: ang, my: my };
  };
  Controls.prototype._zoomAt = function (k, cx, cy) {
    var old = this.g.dist, nd = clamp(old * k, 45, 9500); if (nd === old) return;
    var r = this.canvas.getBoundingClientRect(), gp = this.world.pickGround(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    if (gp && nd < old) { var f = 1 - nd / old; this.g.tx += (gp.x - this.g.tx) * f * 0.9; this.g.tz += (gp.z - this.g.tz) * f * 0.9; this._clampTarget(); }
    this.g.dist = nd;
  };
  Controls.prototype._clampTarget = function () {
    var R = this.world.W.radius - 150, d = Math.hypot(this.g.tx, this.g.tz);
    if (d > R) { this.g.tx *= R / d; this.g.tz *= R / d; }
  };

  /* a spot near (x,z) where someone can stand: the closest street, otherwise spiral outwards */
  Controls.prototype.standNear = function (x, z) {
    var w = this.world;
    var nr = w.nearestRoad(x, z, 90, function (r) { return r.cls <= 20 && !r.h; });
    if (nr) {
      // step from the road centre towards the place so we end up on its side of the street
      var dx = x - nr.x, dz = z - nr.z, l = Math.hypot(dx, dz) || 1, off = Math.min(l - 1, nr.road.w / 2 + 1.2);
      for (var o = off; o >= 0; o -= 1) { var px = nr.x + dx / l * o, pz = nr.z + dz / l * o; if (w.walkable(px, pz)) return { x: px, z: pz }; }
    }
    if (w.walkable(x, z)) return { x: x, z: z };
    for (var r = 3; r < 140; r += 3) for (var a = 0; a < 12; a++) { var qx = x + Math.cos(a * 0.5236) * r, qz = z + Math.sin(a * 0.5236) * r; if (w.walkable(qx, qz)) return { x: qx, z: qz }; }
    return { x: 6, z: 20 };
  };
  Controls.prototype.teleport = function (x, z, faceX, faceZ) {
    var s = this.standNear(x, z); this.pos.set(s.x, 0, s.z); this.placed = true; this.auto = null;
    if (faceX !== undefined) {
      var yaw = Math.atan2(-(faceX - s.x), -(faceZ - s.z));
      if (Math.hypot(faceX - s.x, faceZ - s.z) < 0.5) yaw = this.look.yaw;
      this.lg.yaw = this.look.yaw = yaw; this.heading = yaw + Math.PI;
    }
    this._startBlend(0.9);
  };
  Controls.prototype._startBlend = function (dur) { this.from.p.copy(this.cam.position); this.from.q.copy(this.cam.quaternion); this.from.fov = this.cam.fov; this.blend = KD.fast ? 1 : 0; this.blendDur = dur || 1; };

  Controls.prototype.setMode = function (mode, keep) {
    if (mode === this.mode) return;
    var prev = this.mode; this._startBlend(1.1);
    if (mode === 'map') {
      this.g.tx = this.m.tx = this.pos.x; this.g.tz = this.m.tz = this.pos.z; this.g.yaw = this.m.yaw = this.look.yaw;
      this.g.dist = this.m.dist = 520; this.g.el = this.m.el = 0.8;
    } else if (prev === 'map') {
      var far = Math.hypot(this.pos.x - this.m.tx, this.pos.z - this.m.tz);
      if (!keep && (!this.placed || far > Math.max(260, this.m.dist * 0.6))) { var s = this.standNear(this.m.tx, this.m.tz); this.pos.set(s.x, 0, s.z); this.placed = true; }
      if (!keep) { this.lg.yaw = this.look.yaw = this.m.yaw; this.heading = this.m.yaw + Math.PI; }
      this.lg.pitch = this.look.pitch = 0.22; this.lg.pov = this.look.pov = 0.03;
    } else { this.lg.pov = this.look.pov = 0.03; }
    this.auto = null; this.mode = mode;
    this.avatar.group.visible = mode === 'stroll';
    if (this.onMode) this.onMode(mode, prev);
  };
  Controls.prototype.flyTo = function (x, z, dist, yaw, el) {
    this.g.tx = x; this.g.tz = z; if (dist) this.g.dist = dist; if (yaw !== undefined) this.g.yaw = yaw; if (el) this.g.el = el; this._clampTarget();
  };
  Controls.prototype.walkTo = function (x, z) { this.auto = { x: x, z: z, t: 0 }; };
  Controls.prototype.focus = function () { return this.mode === 'map' ? { x: this.m.tx, z: this.m.tz } : { x: this.pos.x, z: this.pos.z }; };
  Controls.prototype.viewDist = function () { return this.mode === 'map' ? this.m.dist : this.mode === 'stroll' ? this.look.dist : 2; };
  Controls.prototype.walking = function () { return this.mode !== 'map'; };

  Controls.prototype._move = function (dt) {
    var K = this.keys, ix = 0, iz = 0, w = this.world;
    if (K.KeyW || K.ArrowUp) iz += 1; if (K.KeyS || K.ArrowDown) iz -= 1; if (K.KeyA || K.ArrowLeft) ix -= 1; if (K.KeyD || K.ArrowRight) ix += 1;
    ix += this.joy.x; iz += this.joy.y;
    if (K.KeyQ) this.lg.yaw += dt * 1.6; if (K.KeyE) this.lg.yaw -= dt * 1.6;
    var il = Math.hypot(ix, iz), vx = 0, vz = 0, sp = (this.run || K.ShiftLeft || K.ShiftRight) ? 11 : 3.6, yaw = this.look.yaw;
    if (il > 0.05) {
      if (il > 1) { ix /= il; iz /= il; il = 1; }
      var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      vx = (fx * iz + rx * ix) * sp; vz = (fz * iz + rz * ix) * sp; this.auto = null;
    } else if (this.auto) {
      var dx = this.auto.x - this.pos.x, dz = this.auto.z - this.pos.z, d = Math.hypot(dx, dz); this.auto.t += dt;
      if (d < 0.6 || this.auto.t > 60) this.auto = null; else { var s2 = Math.min(d > 25 ? 9 : 5, d / dt); vx = dx / d * s2; vz = dz / d * s2; }
    }
    var moved = 0;
    if (vx || vz) {
      var nx = this.pos.x + vx * dt, nz = this.pos.z + vz * dt, r = 0.35, ok = function (x, z) { return w.walkable(x + r, z) && w.walkable(x - r, z) && w.walkable(x, z + r) && w.walkable(x, z - r); };
      var px = this.pos.x, pz = this.pos.z;
      if (ok(nx, nz)) { this.pos.x = nx; this.pos.z = nz; }
      else if (ok(nx, pz)) { this.pos.x = nx; }
      else if (ok(px, nz)) { this.pos.z = nz; }
      else if (this.auto) this.auto = null;
      moved = Math.hypot(this.pos.x - px, this.pos.z - pz) / dt;
      if (moved > 0.2) { var th = Math.atan2(vx, vz); this.heading += angDiff(this.heading, th) * Math.min(1, dt * 10); }
    }
    this.speed = moved;
    var gy = w.groundHeight(this.pos.x, this.pos.z, this.pos.y); this.pos.y += (gy - this.pos.y) * Math.min(1, dt * 12);
  };

  Controls.prototype.update = function (dt) {
    var m = this.m, g = this.g, L = this.look, LG = this.lg, K = this.keys, cam = this.cam, d = this.dummy, k = KD.fast ? 1 : Math.min(1, dt * 9);
    this.idle += dt;
    if (this.mode === 'map') {
      var ps = m.dist * 0.9 * dt, y = m.yaw, mx = 0, mz = 0;
      if (K.KeyW || K.ArrowUp) mz += 1; if (K.KeyS || K.ArrowDown) mz -= 1; if (K.KeyA || K.ArrowLeft) mx -= 1; if (K.KeyD || K.ArrowRight) mx += 1;
      if (mx || mz) { g.tx += (Math.cos(y) * mx - Math.sin(y) * mz) * ps; g.tz += (-Math.sin(y) * mx - Math.cos(y) * mz) * ps; this._clampTarget(); }
      if (K.KeyQ) g.yaw += dt * 1.2; if (K.KeyE) g.yaw -= dt * 1.2;
      if (K.Equal || K.NumpadAdd) g.dist = clamp(g.dist * (1 - dt * 1.4), 45, 9500); if (K.Minus || K.NumpadSubtract) g.dist = clamp(g.dist * (1 + dt * 1.4), 45, 9500);
      m.tx += (g.tx - m.tx) * k; m.tz += (g.tz - m.tz) * k; m.dist += (g.dist - m.dist) * k; m.yaw += (g.yaw - m.yaw) * k; m.el += (g.el - m.el) * k;
      var ce = Math.cos(m.el);
      d.position.set(m.tx + Math.sin(m.yaw) * ce * m.dist, Math.sin(m.el) * m.dist, m.tz + Math.cos(m.yaw) * ce * m.dist);
      d.lookAt(m.tx, 0, m.tz); d.fov = 42;
    } else {
      this._move(dt);
      L.yaw += (LG.yaw - L.yaw) * Math.min(1, dt * 14); L.pitch += (LG.pitch - L.pitch) * k; L.dist += (LG.dist - L.dist) * k; L.pov += (LG.pov - L.pov) * Math.min(1, dt * 14); L.fov += (LG.fov - L.fov) * k;
      var av = this.avatar; av.group.position.x = this.pos.x; av.group.position.z = this.pos.z; av.baseY = this.pos.y; av.group.rotation.y = this.heading; av.update(dt, this.speed);
      if (this.mode === 'stroll') {
        var cp = Math.cos(L.pitch), ox = Math.sin(L.yaw) * cp, oy = Math.sin(L.pitch), oz = Math.cos(L.yaw) * cp, hx = this.pos.x, hy = this.pos.y + 1.45, hz = this.pos.z, dist = L.dist, w = this.world;
        for (var s = 1; s <= 12; s++) {           // keep the camera out of walls
          var t = s / 12 * L.dist, qx = hx + ox * t, qz = hz + oz * t, qy = hy + oy * t, b = w.buildingAt(qx, qz);
          if (b && qy < b.h + 0.5 && !w.walkable(qx, qz)) { dist = Math.max(1.6, (s - 1) / 12 * L.dist); break; }
        }
        d.position.set(hx + ox * dist, Math.max(0.5, hy + oy * dist), hz + oz * dist); d.lookAt(hx, hy + 0.1, hz); d.fov = 55;
      } else {
        var c2 = Math.cos(L.pov); d.position.set(this.pos.x, this.pos.y + 1.62, this.pos.z);
        d.lookAt(this.pos.x - Math.sin(L.yaw) * c2, this.pos.y + 1.62 + Math.sin(L.pov), this.pos.z - Math.cos(L.yaw) * c2); d.fov = L.fov;
      }
    }
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + dt / (this.blendDur || 1)); var e = ease(this.blend);
      cam.position.lerpVectors(this.from.p, d.position, e); cam.quaternion.slerpQuaternions(this.from.q, d.quaternion, e); cam.fov = this.from.fov + (d.fov - this.from.fov) * e;
    } else { cam.position.copy(d.position); cam.quaternion.copy(d.quaternion); cam.fov = d.fov; }
  };
  // compass bearing the camera faces, degrees clockwise from north
  Controls.prototype.bearing = function () { var y = this.mode === 'map' ? this.m.yaw : this.look.yaw; return ((-y * 180 / Math.PI) % 360 + 360) % 360; };
  KD.Controls = Controls;
})();
