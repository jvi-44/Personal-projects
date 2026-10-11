/* Chem Virtual Lab · 3D bench engine (Three.js r128)
   Actors are apparatus; each step is a list of phases that tween actor props.
   State after every step is precomputed, so stepping back or jumping is exact. */
(function () {
'use strict';
const TAU = Math.PI * 2;
const LAB = window.LAB = { ok: false };
let renderer, scene, camera, controls, clock, stageEl, running = false, labelsOn = true;
let actors = {}, actorList = [], states = [], ex = null, queue = [], cur = null, idleCb = null, camTw = null;
let userMovedCam = false;
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const tc1 = new THREE.Color(), tc2 = new THREE.Color();
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);

/* ---------- geometry + material helpers ---------- */
const V2 = a => a.map(p => new THREE.Vector2(p[0], p[1]));
const latheG = (pts, seg) => new THREE.LatheGeometry(V2(pts), seg || 40);
const cyl = (rt, rb, h, seg, open, ts, tl) => new THREE.CylinderGeometry(rt, rb, h, seg || 24, 1, !!open, ts || 0, tl || TAU);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, a, b) => new THREE.SphereGeometry(r, a || 16, b || 12);
const MC = {};
const cm = (k, f) => MC[k] || (MC[k] = f());
const glassM = () => cm('glass', () => new THREE.MeshStandardMaterial({ color: 0xdcefff, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
const rimM = () => cm('rim', () => new THREE.MeshBasicMaterial({ color: 0xeef8ff, transparent: true, opacity: 0.55, depthWrite: false }));
function S(c, r, m) { r = r == null ? 0.55 : r; m = m || 0; return cm('s' + c + r + m, () => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })); }
function own(c, r, m, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r == null ? 0.55 : r, metalness: m || 0 }, extra || {})); }
function basic(c, op, add) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }); }
function mk(geo, mat, parent, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (!mat.transparent) { m.castShadow = true; m.receiveShadow = true; }
  if (parent) parent.add(m);
  return m;
}
function glass(parent, pts, seg) { const m = mk(latheG(pts, seg), glassM(), parent); m.renderOrder = 3; return m; }
function rim(parent, r, y, t) { const m = mk(new THREE.TorusGeometry(r, t || 0.011, 6, 40), rimM(), parent, [0, y, 0], [Math.PI / 2, 0, 0]); m.renderOrder = 4; return m; }
function rodBetween(parent, a, b, r, mat) {
  const A = v3(a[0], a[1], a[2]), B = v3(b[0], b[1], b[2]); const d = B.clone().sub(A); const L = d.length();
  const m = mk(cyl(r, r, L, 10), mat, parent); m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize()); return m;
}
function rAt(wall, y) {
  if (y <= wall[0][1]) return wall[0][0];
  for (let i = 1; i < wall.length; i++) { const a = wall[i - 1], b = wall[i]; if (y <= b[1]) { const t = (y - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * t; } }
  return wall[wall.length - 1][0];
}
function liquidProfile(wall, y0, y1, k) {
  const pts = [[0, y0], [rAt(wall, y0) * k, y0]];
  for (const w of wall) if (w[1] > y0 + 1e-4 && w[1] < y1 - 1e-4) pts.push([w[0] * k, w[1]]);
  pts.push([rAt(wall, y1) * k, y1], [0, y1]);
  return pts;
}
class Liquid {
  constructor(parent, wall, o) {
    o = o || {}; this.wall = wall; this.k = o.k || 0.92;
    this.mat = new THREE.MeshStandardMaterial({ color: '#cfe3f2', transparent: true, opacity: o.op || 0.78, roughness: o.rough == null ? 0.2 : o.rough, metalness: o.metal || 0, side: THREE.DoubleSide, depthWrite: (o.op || 0.78) > 0.9 });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat); this.mesh.renderOrder = 1; this.mesh.visible = false;
    parent.add(this.mesh); this.a = -9; this.b = -9;
  }
  set(a, b, col) {
    if (col) this.mat.color.set(col);
    if (b - a < 0.006) { this.mesh.visible = false; return; }
    this.mesh.visible = true;
    if (Math.abs(a - this.a) > 0.0012 || Math.abs(b - this.b) > 0.0012) {
      this.mesh.geometry.dispose(); this.mesh.geometry = latheG(liquidProfile(this.wall, a, b, this.k), 32); this.a = a; this.b = b;
    }
  }
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  const api = { t, last: null, set(txt) { if (txt === api.last) return; api.last = txt; draw(g, w, h, txt); t.needsUpdate = true; } };
  return api;
}
function lcd(w, h, bg, fg) {
  return canvasTex(w, h, (g, W, H, txt) => {
    g.fillStyle = bg || '#0c1a14'; g.fillRect(0, 0, W, H);
    g.fillStyle = fg || '#86f7b8'; g.font = '600 ' + Math.round(H * 0.56) + 'px "IBM Plex Mono", ui-monospace, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 2);
  });
}
function screen(parent, tex, w, h, pos, rot) { return mk(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.t }), parent, pos, rot); }

/* ---------- labels (screen-sized sprites) ---------- */
const LABEL_STYLES = {
  label: { bg: 'rgba(247,250,248,0.95)', fg: '#16231f', bd: 'rgba(22,35,31,0.3)', font: '500 11px "IBM Plex Sans", system-ui, sans-serif' },
  read: { bg: 'rgba(10,22,18,0.92)', fg: '#93f5c0', bd: 'rgba(147,245,192,0.5)', font: '600 12px "IBM Plex Mono", ui-monospace, monospace' },
  note: { bg: 'rgba(31,95,168,0.95)', fg: '#ffffff', bd: 'rgba(255,255,255,0.4)', font: '600 12px "IBM Plex Sans", system-ui, sans-serif' },
  warn: { bg: 'rgba(184,90,20,0.96)', fg: '#ffffff', bd: 'rgba(255,255,255,0.4)', font: '600 12px "IBM Plex Sans", system-ui, sans-serif' }
};
function makeLabel(style) {
  const cv = document.createElement('canvas'); const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }));
  sp.renderOrder = 30; sp.userData = { cv, tex, text: null, aspect: 1, hpx: 20, style: style || 'label' };
  sp.visible = false; scene.add(sp); return sp;
}
function setLabelText(sp, text) {
  const u = sp.userData; if (u.text === text) return; u.text = text;
  const st = LABEL_STYLES[u.style] || LABEL_STYLES.label; const dpr = 2;
  const g = u.cv.getContext('2d'); const font = st.font.replace(/(\d+)px/, (m, n) => (n * dpr) + 'px');
  g.font = font; const lines = String(text).split('\n'); let w = 0; for (const l of lines) w = Math.max(w, g.measureText(l).width);
  const fs = parseInt(st.font.match(/(\d+)px/)[1], 10) * dpr; const lh = fs * 1.28, px = 7 * dpr, py = 4 * dpr;
  const W = Math.ceil(w + px * 2), H = Math.ceil(lh * lines.length + py * 2);
  u.cv.width = W; u.cv.height = H; g.font = font;
  const r = 6 * dpr; g.beginPath(); g.moveTo(r, 1); g.lineTo(W - r, 1); g.quadraticCurveTo(W - 1, 1, W - 1, r); g.lineTo(W - 1, H - r); g.quadraticCurveTo(W - 1, H - 1, W - r, H - 1); g.lineTo(r, H - 1); g.quadraticCurveTo(1, H - 1, 1, H - r); g.lineTo(1, r); g.quadraticCurveTo(1, 1, r, 1); g.closePath();
  g.fillStyle = st.bg; g.fill(); g.lineWidth = 2; g.strokeStyle = st.bd; g.stroke();
  g.fillStyle = st.fg; g.textBaseline = 'middle'; g.textAlign = 'center';
  lines.forEach((l, i) => g.fillText(l, W / 2, py + lh * (i + 0.5)));
  u.tex.needsUpdate = true; u.aspect = W / H; u.hpx = H / dpr;
}
function makeLeader() {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe9f2ef, transparent: true, opacity: 0.55, depthTest: false }));
  l.renderOrder = 29; l.frustumCulled = false; l.visible = false; scene.add(l); return l;
}

/* ---------- particles ---------- */
const parts = [];
let steamTexture = null;
function steamTex() {
  if (steamTexture) return steamTexture;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); steamTexture = new THREE.CanvasTexture(c); return steamTexture;
}
const pGeo = sph(1, 10, 8);
const pMat = (c, op) => cm('p' + c + op, () => new THREE.MeshStandardMaterial({ color: c, transparent: op < 1, opacity: op, roughness: 0.15 }));
function spawn(o) {
  if (parts.length > 650) return;
  let obj;
  if (o.k === 'steam') obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex(), color: o.col || '#ffffff', transparent: true, opacity: o.op || 0.4, depthWrite: false }));
  else obj = new THREE.Mesh(pGeo, pMat(o.col || '#cfe3f2', o.op || 0.85));
  obj.position.copy(o.p); obj.scale.setScalar(o.size || 0.025); obj.renderOrder = 2; scene.add(obj);
  o.obj = obj; o.age = 0; o.seed = Math.random() * 10; o.v = o.v || v3(0, 0, 0); parts.push(o);
}
function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.age += dt; const o = q.obj;
    if (q.k === 'drop') q.v.y -= 7 * dt;
    else if (q.k === 'bub') { q.v.x = Math.sin(q.age * 11 + q.seed) * 0.06; q.v.z = Math.cos(q.age * 9 + q.seed) * 0.06; }
    else if (q.k === 'steam') { const f = q.age / q.life; o.material.opacity = (q.op || 0.4) * (1 - f) * Math.min(1, q.age * 6); o.scale.setScalar(q.size * (1 + f * 2.4)); }
    o.position.addScaledVector(q.v, dt);
    let dead = q.age > q.life;
    if (q.k === 'drop' && o.position.y < q.floor) dead = true;
    if (q.k === 'bub' && q.top != null && o.position.y > q.top) dead = true;
    if (dead) { scene.remove(o); if (q.k === 'steam') o.material.dispose(); parts.splice(i, 1); }
  }
}
function clearParticles() { for (const q of parts) { scene.remove(q.obj); if (q.k === 'steam') q.obj.material.dispose(); } parts.length = 0; }
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- actor ---------- */
class Actor {
  constructor(id, type, o) {
    this.id = id; this.o = o; this.type = type; this.acc = {};
    const F = TYPES[type]; if (!F) throw new Error('Unknown apparatus type ' + type);
    this.root = new THREE.Group();
    const r = F(o, this) || {};
    this.obj = r.obj || new THREE.Group(); this.root.add(this.obj);
    if (o.s) this.obj.scale.setScalar(o.s);
    if (o.rot) this.obj.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    this.up = r.up || null; this.read = r.read || null; this.spout = r.spout || null;
    this.d = Object.assign({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, vis: 1, shake: 0, swirl: 0, pour: 0, py: 0.3, lab: '' }, r.d || {});
    for (const k in o) if (k in this.d) this.d[k] = o[k];
    this.p = Object.assign({}, this.d);
    const s = o.s || 1;
    this.lo = (o.lo || r.lo || [0, 1.2, 0]).map(v => v * (o.lo ? 1 : s));
    this.la = o.la ? o.la : (r.la ? r.la.map(v => v * s) : null);
    this.always = !!r.always;
    this.lab = makeLabel(r.style || o.style || 'label');
    this.leader = r.noLeader || o.noLeader ? null : makeLeader();
    this.rs = this.read ? makeLabel('read') : null;
  }
  w(x, y, z) { return this.obj.localToWorld(v3(x, y, z)); }
  emit(key, rate, dt, fn) { let a = (this.acc[key] || 0) + rate * dt; while (a >= 1) { fn(); a -= 1; } this.acc[key] = a; }
  frame(dt, t) {
    const p = this.p, R = this.root;
    let sx = 0, sz = 0, rz = p.rz;
    if (p.swirl > 0.01) { sx = Math.cos(t * 7) * 0.05 * p.swirl; sz = Math.sin(t * 7) * 0.05 * p.swirl; }
    if (p.shake > 0.01) rz += Math.sin(t * 9) * 0.35 * p.shake;
    R.position.set(p.x + sx, p.y, p.z + sz); R.rotation.set(p.rx, p.ry, rz);
    R.scale.setScalar(Math.max(0.0001, p.vis)); R.visible = p.vis > 0.02;
    R.updateMatrixWorld(true);
    if (R.visible) {
      if (this.up) this.up(p, dt, t);
      if (p.pour > 0.01 && this.spout) {
        const sp = this.spout;
        this.emit('pour', 40 * p.pour, dt, () => spawn({ k: 'drop', p: this.w(sp[0], sp[1], sp[2]).add(v3(rnd(-0.01, 0.01), 0, rnd(-0.01, 0.01))), v: v3(rnd(0.05, 0.15), -0.1, 0), life: 3, floor: p.py, col: p.col || '#cfe3f2', size: 0.03, op: 0.8 }));
      }
    }
  }
}

/* ---------- apparatus library ---------- */
const T = {};
const CF_WALL = [[0.42, 0.0], [0.45, 0.04], [0.44, 0.12], [0.17, 0.92], [0.15, 1.0], [0.15, 1.3]];
function bubbles(A, rate, dt, y0, top, rmax, col) {
  A.emit('bub', rate, dt, () => { const r = Math.random() * rmax, a = Math.random() * TAU; spawn({ k: 'bub', p: A.w(Math.cos(a) * r, y0, Math.sin(a) * r), v: v3(0, rnd(0.45, 0.8), 0), life: 4, top: A.w(0, top, 0).y, size: rnd(0.012, 0.024), col: col || '#ffffff', op: 0.65 }); });
}
function steamFrom(A, rate, dt, x, y, z, col, size) {
  A.emit('steam', rate, dt, () => spawn({ k: 'steam', p: A.w(x + rnd(-0.05, 0.05), y, z + rnd(-0.05, 0.05)), v: v3(rnd(-0.05, 0.05), rnd(0.35, 0.6), rnd(-0.05, 0.05)), life: rnd(1.4, 2.2), size: size || 0.16, col: col || '#ffffff', op: 0.38 }));
}
function dripFrom(A, key, rate, dt, x, y, z, floor, col) {
  A.emit(key, rate, dt, () => spawn({ k: 'drop', p: A.w(x, y, z), v: v3(0, -0.15, 0), life: 3, floor: floor, col: col, size: 0.024, op: 0.85 }));
}

T.conical = (o, A) => {
  const g = new THREE.Group();
  glass(g, [[0, 0]].concat(CF_WALL, [[0.175, 1.32]])); rim(g, 0.163, 1.31);
  const L = new Liquid(g, CF_WALL), P = new Liquid(g, CF_WALL, { op: 0.97, k: 0.9, rough: 0.9 });
  const stopper = mk(cyl(0.17, 0.135, 0.2, 20), S('#3b2a25', 0.85), g, [0, 1.36, 0]);
  if (o.side) { const arm = mk(cyl(0.035, 0.035, 0.46, 12, true), glassM(), g, [0.366, 1.06, 0], [0, 0, -1.85]); arm.renderOrder = 3; }
  return {
    obj: g, d: { lv: 0, col: '#cfe3f2', ppt: 0, pptc: '#f4f4f0', fizz: 0, stop: o.stop ? 1 : 0 }, lo: [0, 1.8, 0], la: [0, 1.15, 0], spout: [0.16, 1.32, 0],
    up(p, dt) {
      const y0 = 0.025, yp = y0 + p.ppt * 0.1, top = Math.max(yp, y0 + p.lv * 0.95);
      P.set(y0, yp, p.pptc); L.set(yp, top, p.col); stopper.visible = p.stop > 0.5;
      if (p.fizz > 0.02 && p.lv > 0.02) bubbles(A, p.fizz * 40, dt, y0 + 0.03, top - 0.02, 0.3);
    }
  };
};
const BK_WALL = [[0.37, 0.0], [0.375, 0.02], [0.375, 0.95]];
T.beaker = (o, A) => {
  const g = new THREE.Group();
  glass(g, [[0, 0]].concat(BK_WALL, [[0.4, 0.975]])); rim(g, 0.39, 0.97);
  const L = new Liquid(g, BK_WALL, { k: 0.95 }), P = new Liquid(g, BK_WALL, { op: 0.97, k: 0.94, rough: 0.9 });
  if (o.ticks !== false) for (let i = 1; i <= 4; i++) mk(box(0.09, 0.008, 0.004), S('#ffffff', 0.6), g, [0, i * 0.18, 0.377]);
  return {
    obj: g, d: { lv: 0, col: '#cfe3f2', ppt: 0, pptc: '#f4f4f0', fizz: 0 }, lo: [0, 1.35, 0], la: [0.2, 0.9, 0], spout: [0.4, 0.97, 0],
    up(p, dt) {
      const y0 = 0.02, yp = y0 + p.ppt * 0.12, top = Math.max(yp, y0 + p.lv * 0.9);
      P.set(y0, yp, p.pptc); L.set(yp, top, p.col);
      if (p.fizz > 0.02 && p.lv > 0.02) bubbles(A, p.fizz * 40, dt, y0 + 0.03, top - 0.02, 0.3);
    }
  };
};
const VF_WALL = [[0.3, 0.0], [0.42, 0.12], [0.45, 0.3], [0.38, 0.5], [0.22, 0.62], [0.09, 0.72], [0.075, 0.78], [0.075, 1.9]];
T.vflask = (o, A) => {
  const g = new THREE.Group();
  glass(g, [[0, 0]].concat(VF_WALL, [[0.09, 1.92]])); rim(g, 0.085, 1.91); rim(g, 0.078, 1.55, 0.006);
  const L = new Liquid(g, VF_WALL, { k: 0.9 });
  const stopper = mk(cyl(0.1, 0.075, 0.16, 16), S('#e7e2d4', 0.35), g, [0, 1.98, 0]);
  return {
    obj: g, d: { lv: 0, col: '#cfe3f2', stop: 0 }, lo: [0.7, 1.7, 0], la: [0.08, 1.55, 0], spout: [0.08, 1.92, 0],
    up(p) { L.set(0.03, 0.03 + p.lv * 1.52, p.col); stopper.visible = p.stop > 0.5; }
  };
};
const MC_WALL = [[0.17, 0.06], [0.17, 1.7]];
T.mcyl = (o, A) => {
  const g = new THREE.Group();
  mk(cyl(0.3, 0.3, 0.06, 6), S('#d9e6ee', 0.3), g, [0, 0.03, 0]);
  glass(g, [[0, 0.06]].concat(MC_WALL, [[0.2, 1.72]])); rim(g, 0.19, 1.71);
  for (let i = 1; i <= 9; i++) mk(box(i % 2 ? 0.05 : 0.09, 0.008, 0.004), S('#ffffff', 0.6), g, [0, 0.06 + i * 0.16, 0.172]);
  const L = new Liquid(g, MC_WALL, { k: 0.93 });
  return { obj: g, d: { lv: 0, col: '#cfe3f2' }, lo: [0.55, 1.6, 0], la: [0.15, 1.4, 0], spout: [0.2, 1.72, 0], up(p) { L.set(0.07, 0.07 + p.lv * 1.55, p.col); } };
};
T.burette = (o, A) => {
  const g = new THREE.Group(); const L0 = o.lift || 0; const top = 5.6 + L0, bot = 1.9 + L0, y0 = 5.35 + L0, y50 = 2.15 + L0;
  const tube = mk(cyl(0.07, 0.07, top - bot, 20, true), glassM(), g, [0, (top + bot) / 2, 0]); tube.renderOrder = 3; rim(g, 0.07, top, 0.01);
  const tip = mk(cyl(0.07, 0.016, 0.38, 16, true), glassM(), g, [0, 1.69 + L0, 0]); tip.renderOrder = 3;
  mk(cyl(0.05, 0.05, 0.22, 12), S('#e9e2d0', 0.4), g, [0, bot - 0.03, 0], [0, 0, Math.PI / 2]);
  mk(box(0.04, 0.2, 0.06), S('#2c5d9a', 0.4), g, [0.14, bot - 0.03, 0]);
  for (let i = 0; i <= 50; i += 5) mk(box(i % 10 === 0 ? 0.08 : 0.05, 0.008, 0.004), S('#ffffff', 0.6), g, [-0.02, y0 - (i / 50) * (y0 - y50), 0.071]);
  const lm = new THREE.MeshStandardMaterial({ color: '#cfe3f2', transparent: true, opacity: 0.85, roughness: 0.2 });
  const liq = mk(cyl(0.062, 0.062, 1, 16), lm, g); liq.renderOrder = 1;
  const tipLiq = mk(cyl(0.058, 0.012, 0.34, 12), lm, g, [0, 1.69 + L0, 0]); tipLiq.renderOrder = 1;
  const fun = new THREE.Group(); glass(fun, [[0.03, 0], [0.035, 0.18], [0.24, 0.48], [0.25, 0.5]]); fun.position.set(0, top - 0.08, 0); g.add(fun);
  if (o.stand !== false) {
    mk(box(1.4, 0.06, 0.9), S('#2d3438', 0.4, 0.3), g, [-0.45, 0.03, -0.1]);
    mk(cyl(0.03, 0.03, 6.2 + L0, 12), S('#b9c0c4', 0.3, 0.8), g, [-0.95, (6.2 + L0) / 2, -0.35]);
    mk(box(0.18, 0.14, 0.14), S('#444c50', 0.4, 0.5), g, [-0.95, 4.6 + L0, -0.35]);
    mk(box(0.85, 0.05, 0.05), S('#b9c0c4', 0.3, 0.8), g, [-0.5, 4.6 + L0, -0.2]);
    mk(box(0.1, 0.22, 0.2), S('#3b4246', 0.6, 0.3), g, [-0.05, 4.6 + L0, 0]);
  }
  const dy = o.dripY != null ? o.dripY : 0.45;
  const cap = o.cap || 50;
  return {
    obj: g, d: { rd: cap * 1.2, col: '#cfe3f2', drip: 0, fun: 0 }, lo: [0.75, 5.0 + L0, 0], la: [0.07, 4.9 + L0, 0],
    read(p) { if (p.rd > cap + 0.2) return null; return { text: p.rd.toFixed(2) + ' cm³', at: [0.5, y0 - (p.rd / cap) * (y0 - y50), 0] }; },
    up(p, dt) {
      const has = p.rd < cap * 1.08; const y = Math.min(y0 + 0.15, y0 - (p.rd / cap) * (y0 - y50)); const h = Math.max(0.001, y - bot);
      liq.visible = has && h > 0.01; liq.scale.y = h; liq.position.y = bot + h / 2; tipLiq.visible = has; lm.color.set(p.col); fun.visible = p.fun > 0.5;
      if (p.drip > 0.02) dripFrom(A, 'drip', p.drip * 7, dt, 0, 1.5 + L0, 0, dy, p.col);
    }
  };
};
const PIP_WALL = [[0.012, 0], [0.022, 0.25], [0.025, 0.9], [0.1, 1.05], [0.11, 1.35], [0.1, 1.5], [0.025, 1.62], [0.025, 2.7]];
T.pipette = (o, A) => {
  const g = new THREE.Group();
  glass(g, [[0, 0]].concat(PIP_WALL, [[0.028, 2.72]]), 20); rim(g, 0.027, 2.25, 0.006);
  if (o.filler !== false) { const f = mk(sph(0.14, 16, 12), S('#b3262d', 0.6), g, [0, 3.0, 0]); f.scale.set(1, 1.15, 1); mk(cyl(0.04, 0.04, 0.25, 10), S('#8f1e24', 0.6), g, [0, 2.75, 0]); }
  const L = new Liquid(g, PIP_WALL, { k: 0.8 });
  const fl = o.dripY != null ? o.dripY : 0.3;
  return {
    obj: g, d: { lv: 0, col: '#cfe3f2', drip: 0 }, lo: [0.55, 2.4, 0], la: [0.03, 2.2, 0],
    up(p, dt) { L.set(0.005, 0.005 + p.lv * 2.24, p.col); if (p.drip > 0.02) dripFrom(A, 'drip', p.drip * 10, dt, 0, 0, 0, fl, p.col); }
  };
};
T.dropper = (o, A) => {
  const g = new THREE.Group(); const W = [[0.01, 0], [0.025, 0.12], [0.035, 0.25], [0.035, 0.7]];
  glass(g, [[0, 0]].concat(W), 16);
  const b = mk(sph(0.065, 14, 10), S('#7c2a2a', 0.7), g, [0, 0.8, 0]); b.scale.set(1, 1.5, 1);
  const L = new Liquid(g, W, { k: 0.8 }); const fl = o.dripY != null ? o.dripY : 0.3;
  return { obj: g, d: { lv: 0.4, col: '#cfe3f2', drip: 0 }, lo: [0.45, 0.85, 0], la: [0.03, 0.6, 0],
    up(p, dt) { L.set(0.004, 0.004 + p.lv * 0.6, p.col); if (p.drip > 0.02) dripFrom(A, 'drip', p.drip * 3, dt, 0, 0, 0, fl, p.col); } };
};
const BT_WALL = [[0.05, 0.0], [0.1, 0.03], [0.125, 0.1], [0.13, 0.2], [0.13, 1.5]];
T.btube = (o, A) => {
  const g = new THREE.Group();
  glass(g, [[0, 0]].concat(BT_WALL, [[0.145, 1.51]]), 28); rim(g, 0.138, 1.505);
  const L = new Liquid(g, BT_WALL, { k: 0.9 }), P = new Liquid(g, BT_WALL, { op: 0.97, k: 0.88, rough: 0.9 });
  let holder = null;
  if (o.holder) { holder = new THREE.Group(); mk(new THREE.TorusGeometry(0.15, 0.02, 6, 20), S('#9aa0a3', 0.4, 0.8), holder, [0, 1.25, 0], [Math.PI / 2, 0, 0]); mk(box(0.05, 0.05, 0.4), S('#9aa0a3', 0.4, 0.8), holder, [0, 1.25, 0.34]); mk(box(0.08, 0.08, 0.6), S('#8a5a32', 0.8), holder, [0, 1.25, 0.82]); g.add(holder); }
  const drops = new THREE.Group(); for (let i = 0; i < 12; i++) { const a = rnd(0, TAU), y = rnd(1.0, 1.45); mk(sph(0.016, 8, 6), pMat('#e6f2fb', 0.8), drops, [Math.cos(a) * 0.125, y, Math.sin(a) * 0.125]); } g.add(drops);
  return {
    obj: g, d: { lv: 0, col: '#cfe3f2', sol: 0, solc: '#f3f2ec', steam: 0, cond: 0, fizz: 0 }, lo: [0.5, 1.5, 0], la: [0.13, 1.3, 0], spout: [0.14, 1.51, 0],
    up(p, dt) {
      const y0 = 0.01, ys = y0 + p.sol * 0.35; P.set(y0, ys, p.solc); L.set(ys, Math.max(ys, y0 + p.lv * 1.4), p.col);
      drops.visible = p.cond > 0.05; drops.scale.setScalar(Math.max(0.01, p.cond));
      if (p.steam > 0.02) steamFrom(A, p.steam * 6, dt, 0, 1.55, 0, '#ffffff', 0.12);
      if (p.fizz > 0.02) bubbles(A, p.fizz * 25, dt, 0.08, y0 + p.lv * 1.4 - 0.02, 0.07);
    }
  };
};
const CR_WALL = [[0.17, 0.0], [0.2, 0.03], [0.3, 0.4], [0.32, 0.42]];
T.crucible = (o, A) => {
  const g = new THREE.Group(); const m = own('#eee8dc', 0.75, 0, { side: THREE.DoubleSide });
  mk(latheG([[0, 0]].concat(CR_WALL)), m, g);
  const L = new Liquid(g, CR_WALL, { op: 0.98, k: 0.9, rough: 0.9 });
  const pool = mk(cyl(0.17, 0.18, 0.03, 24), S('#aab1b8', 0.25, 0.9), g, [0, 0.05, 0]);
  const lid = new THREE.Group(); mk(latheG([[0, 0.07], [0.1, 0.065], [0.3, 0.012], [0.345, 0]]), m, lid); mk(sph(0.05, 10, 8), m, lid, [0, 0.09, 0]); lid.position.y = 0.42; g.add(lid);
  return {
    obj: g, d: { sol: 0, solc: '#2f6fd6', lid: o.lid ? 1 : 0, hot: 0, steam: 0, stc: '#ffffff', pb: 0, col: '#aab1b8' }, lo: [0.6, 0.75, 0], la: [0.3, 0.38, 0], spout: [0.33, 0.43, 0],
    up(p, dt) {
      L.set(0.03, 0.03 + p.sol * 0.24, p.solc); lid.visible = p.lid > 0.5;
      pool.visible = p.pb > 0.02; pool.scale.set(1, Math.max(0.05, p.pb * 2), 1);
      m.emissive.set('#ff4a12'); m.emissiveIntensity = p.hot * 0.55;
      if (p.steam > 0.02) steamFrom(A, p.steam * 7, dt, 0, 0.45, 0, p.stc, 0.17);
    }
  };
};
T.tripod = (o, A) => {
  const g = new THREE.Group(); const h = o.h || 1.1; const mt = S('#3a3f42', 0.5, 0.6);
  mk(new THREE.TorusGeometry(0.42, 0.025, 8, 36), mt, g, [0, h, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + Math.PI / 6; rodBetween(g, [0.42 * Math.cos(a), h, 0.42 * Math.sin(a)], [0.62 * Math.cos(a), 0, 0.62 * Math.sin(a)], 0.022, mt); }
  if (o.gauze) { mk(box(1.0, 0.015, 1.0), S('#8b9093', 0.8, 0.4), g, [0, h + 0.03, 0]); mk(cyl(0.26, 0.26, 0.018, 24), S('#d8d2c6', 0.9), g, [0, h + 0.035, 0]); }
  if (o.tri) { const wt = S('#f1ede4', 0.8); const pts = [0, 1, 2].map(i => { const a = i * TAU / 3 - Math.PI / 2; return [0.36 * Math.cos(a), h + 0.035, 0.36 * Math.sin(a)]; }); for (let i = 0; i < 3; i++) rodBetween(g, pts[i], pts[(i + 1) % 3], 0.028, wt); }
  return { obj: g, lo: [0.95, h * 0.6, 0], la: [0.5, h * 0.6, 0] };
};
function flameGroup(lum) {
  const fg = new THREE.Group();
  if (lum) {
    mk(new THREE.ConeGeometry(0.07, 0.38, 14, 1, true), basic('#ffb23a', 0.75, true), fg, [0, 0.19, 0]);
    mk(sph(0.07, 12, 8), basic('#ff9a2a', 0.6, true), fg, [0, 0.0, 0]);
    mk(new THREE.ConeGeometry(0.035, 0.2, 10, 1, true), basic('#fff0a8', 0.9, true), fg, [0, 0.1, 0]);
  } else {
    mk(new THREE.ConeGeometry(0.08, 0.6, 16, 1, true), basic('#78b8ff', 0.4, true), fg, [0, 0.3, 0]);
    mk(new THREE.ConeGeometry(0.048, 0.26, 14, 1, true), basic('#3a63ff', 0.85, true), fg, [0, 0.13, 0]);
  }
  return fg;
}
T.bunsen = (o, A) => {
  const g = new THREE.Group();
  mk(cyl(0.26, 0.3, 0.07, 24), S('#2c3236', 0.4, 0.6), g, [0, 0.035, 0]);
  mk(cyl(0.065, 0.065, 0.75, 16), S('#b8bec2', 0.3, 0.85), g, [0, 0.45, 0]);
  mk(cyl(0.085, 0.085, 0.1, 16), S('#8d9397', 0.3, 0.8), g, [0, 0.16, 0]);
  mk(cyl(0.03, 0.03, 0.3, 8), S('#8d9397', 0.3, 0.8), g, [-0.2, 0.1, 0], [0, 0, Math.PI / 2]);
  const fg = flameGroup(false); fg.position.y = 0.83; g.add(fg);
  const light = new THREE.PointLight('#7fb2ff', 0, 3); light.position.y = 1.1; g.add(light);
  return { obj: g, d: { fl: 0 }, lo: [0.55, 0.5, 0], la: [0.07, 0.5, 0],
    up(p, dt, t) { fg.visible = p.fl > 0.02; const f = Math.max(0.01, p.fl); fg.scale.set(f, f * (1 + 0.08 * Math.sin(t * 31) + 0.05 * Math.sin(t * 47)), f); light.intensity = p.fl * 0.9; } };
};
T.balance = (o, A) => {
  const g = new THREE.Group();
  mk(box(1.2, 0.26, 1.0), S('#e6eaec', 0.45), g, [0, 0.13, 0]);
  mk(box(1.2, 0.06, 0.25), S('#cfd5d8', 0.5), g, [0, 0.22, 0.42], [-0.3, 0, 0]);
  const scr = lcd(256, 64); screen(g, scr, 0.56, 0.14, [0.0, 0.235, 0.555], [-0.3, 0, 0]);
  mk(cyl(0.05, 0.05, 0.05, 10), S('#9aa2a6', 0.3, 0.8), g, [0, 0.29, 0]);
  mk(cyl(0.4, 0.4, 0.03, 32), S('#c4cacd', 0.25, 0.85), g, [0, 0.315, 0]);
  return { obj: g, d: { rd: 0, hot: 0 }, lo: [0, 0.9, 0.75], la: [0.3, 0.2, 0.5],
    up(p, dt) { scr.set(p.rd.toFixed(o.dp == null ? 2 : o.dp) + ' g'); if (p.hot > 0.02) A.emit('heat', p.hot * 6, dt, () => spawn({ k: 'steam', p: A.w(rnd(-0.3, 0.3), 0.5, rnd(-0.3, 0.3)), v: v3(0, 0.7, 0), life: 1.3, size: 0.12, col: '#ffb27a', op: 0.3 })); } };
};
const WB_WALL = [[0.15, 0], [0.15, 0.32]];
T.wbottle = (o, A) => {
  const g = new THREE.Group(); glass(g, [[0, 0]].concat(WB_WALL, [[0.16, 0.33]]), 28); rim(g, 0.155, 0.33);
  const P = new Liquid(g, WB_WALL, { op: 0.98, k: 0.92, rough: 0.9 });
  return { obj: g, d: { sol: 0, solc: '#f3f2ec' }, lo: [0, 0.75, 0], la: [0.1, 0.3, 0], spout: [0.16, 0.33, 0], up(p) { P.set(0.01, 0.01 + p.sol * 0.16, p.solc); } };
};
T.desic = (o, A) => {
  const g = new THREE.Group(); const W = [[0.45, 0], [0.52, 0.08], [0.55, 0.6], [0.62, 0.66]];
  glass(g, [[0, 0]].concat(W)); rim(g, 0.6, 0.66);
  mk(cyl(0.5, 0.5, 0.02, 32), S('#c9ccc8', 0.7), g, [0, 0.25, 0]);
  for (let i = 0; i < 40; i++) { const a = rnd(0, TAU), r = rnd(0, 0.42); mk(sph(0.035, 8, 6), S('#f6f6f1', 0.9), g, [Math.cos(a) * r, rnd(0.04, 0.14), Math.sin(a) * r]); }
  const lid = new THREE.Group(); glass(lid, [[0, 0.3], [0.25, 0.26], [0.55, 0.08], [0.64, 0]]); mk(sph(0.07, 12, 8), glassM(), lid, [0, 0.34, 0]); g.add(lid);
  return { obj: g, d: { lid: 1 }, lo: [0, 1.4, 0], la: [0.5, 0.8, 0], up(p) { lid.position.set((1 - p.lid) * 1.35, 0.66 - (1 - p.lid) * 0.66, 0); } };
};
T.syringe = (o, A) => {
  const g = new THREE.Group(); const L = 2.2, R = 0.17;
  const barrel = mk(cyl(R, R, L, 24, true), glassM(), g, [L / 2 + 0.15, 0, 0], [0, 0, Math.PI / 2]); barrel.renderOrder = 3;
  const cap = mk(new THREE.CircleGeometry(R, 24), glassM(), g, [0.15, 0, 0], [0, Math.PI / 2, 0]); cap.renderOrder = 3;
  const noz = mk(cyl(0.035, 0.06, 0.15, 12), glassM(), g, [0.075, 0, 0], [0, 0, Math.PI / 2]); noz.renderOrder = 3;
  for (let i = 0; i <= 10; i++) mk(box(0.008, i % 5 === 0 ? 0.12 : 0.07, 0.004), S('#ffffff', 0.6), g, [0.2 + i * 0.19, R - 0.02, 0.15]);
  const pl = new THREE.Group(); mk(cyl(R * 0.95, R * 0.95, 0.06, 24), S('#d7dadb', 0.3), pl, [0, 0, 0], [0, 0, Math.PI / 2]);
  const rodM = new THREE.MeshStandardMaterial({ color: '#dbe5ea', transparent: true, opacity: 0.6, roughness: 0.2 });
  mk(cyl(0.05, 0.05, 2.0, 12), rodM, pl, [1.0, 0, 0], [0, 0, Math.PI / 2]); mk(cyl(0.2, 0.2, 0.04, 24), rodM, pl, [2.0, 0, 0], [0, 0, Math.PI / 2]); g.add(pl);
  const gasM = basic(o.gc || '#d8eeff', 0.16); const gas = mk(cyl(R * 0.92, R * 0.92, 1, 16), gasM, g, [0, 0, 0], [0, 0, Math.PI / 2]);
  if (o.stand) {
    const h = o.h || 1.5, sx = L / 2 + 0.15;
    mk(box(1.2, 0.06, 0.8), S('#2d3438', 0.4, 0.3), g, [sx, -h + 0.03, -0.2]);
    mk(cyl(0.03, 0.03, h + 0.8, 12), S('#b9c0c4', 0.3, 0.8), g, [sx, -h + (h + 0.8) / 2, -0.5]);
    mk(box(0.1, 0.1, 0.5), S('#b9c0c4', 0.3, 0.8), g, [sx, 0, -0.27]);
    mk(new THREE.TorusGeometry(R + 0.03, 0.025, 6, 20), S('#3b4246', 0.5, 0.4), g, [sx, 0, 0], [0, Math.PI / 2, 0]);
  }
  return { obj: g, d: { rd: 0 }, lo: [1.2, 0.75, 0], la: [1.2, 0.2, 0],
    read(p) { return o.read === false ? null : { text: p.rd.toFixed(1) + ' cm³', at: [0.25 + p.rd / 100 * 1.9, -0.42, 0] }; },
    up(p) { const x = 0.2 + p.rd / 100 * 1.9; pl.position.x = x; const len = Math.max(0.001, x - 0.16); gas.scale.y = len; gas.position.x = 0.16 + len / 2; gas.visible = p.rd > 0.5; } };
};
T.stube = (o, A) => {
  const g = new THREE.Group(); const W = [[0.03, 0], [0.055, 0.03], [0.06, 0.06], [0.06, 0.38]];
  glass(g, [[0, 0]].concat(W), 18); rim(g, 0.062, 0.38, 0.006);
  const P = new Liquid(g, W, { op: 0.98, k: 0.85, rough: 0.9 });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.38, 0, 0, 1, 0]), 3));
  const str = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf2e6c8 })); g.add(str);
  return { obj: g, d: { sol: 0.5, solc: '#262626', str: 0.6 }, lo: [0.4, 0.5, 0], la: [0.05, 0.3, 0], spout: [0.06, 0.38, 0],
    up(p) { P.set(0.005, 0.005 + p.sol * 0.25, p.solc); const a = geo.attributes.position; a.setY(1, 0.38 + p.str); a.needsUpdate = true; str.visible = p.str > 0.02; } };
};
T.tubing = (o, A) => {
  const g = new THREE.Group(); const pts = o.pts.map(q => v3(q[0], q[1], q[2]));
  const m = o.glass ? glassM() : own(o.col || '#6e4a3a', 0.75);
  const t = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, o.r || 0.035, 10, false), m, g); if (o.glass) t.renderOrder = 3;
  return { obj: g, d: { col: o.col || '#6e4a3a' }, lo: o.lo || [0, 0.4, 0], la: o.la || null, up(p) { if (!o.glass) m.color.set(p.col); } };
};
T.trough = (o, A) => {
  const g = new THREE.Group(); const w = o.w || 2.2, h = o.h || 0.7, d = o.dd || 1.1;
  const b = mk(box(w, h, d), glassM(), g, [0, h / 2, 0]); b.renderOrder = 3;
  const wm = new THREE.MeshStandardMaterial({ color: '#9fcbea', transparent: true, opacity: 0.32, roughness: 0.1, depthWrite: false });
  const water = mk(box(w - 0.04, 1, d - 0.04), wm, g); water.renderOrder = 1;
  return { obj: g, d: { lv: 0.75 }, lo: [w / 2 + 0.4, 0.5, 0], la: [w / 2, 0.4, 0], up(p) { const hh = Math.max(0.001, p.lv * h); water.scale.y = hh; water.position.y = 0.02 + hh / 2; water.visible = p.lv > 0.01; } };
};
T.invcyl = (o, A) => {
  const g = new THREE.Group(); const bur = !!o.bur; const r = bur ? 0.075 : 0.2, h = bur ? 3.4 : 2.1;
  const t = mk(cyl(r, r, h, 20, true), glassM(), g, [0, h / 2, 0]); t.renderOrder = 3;
  if (bur) { mk(cyl(0.05, 0.05, 0.2, 10), S('#e9e2d0', 0.4), g, [0, h + 0.05, 0], [0, 0, Math.PI / 2]); mk(cyl(0.02, 0.06, 0.2, 10), glassM(), g, [0, h + 0.18, 0]); }
  else { const c = mk(new THREE.CircleGeometry(r, 20), glassM(), g, [0, h, 0], [Math.PI / 2, 0, 0]); c.renderOrder = 3; }
  for (let i = 1; i <= 9; i++) mk(box(0.05, 0.007, 0.004), S('#ffffff', 0.6), g, [0, h - 0.15 - i * (h - 0.4) / 10, r + 0.002]);
  const wm = new THREE.MeshStandardMaterial({ color: '#9fcbea', transparent: true, opacity: 0.45, roughness: 0.1, depthWrite: false });
  const water = mk(cyl(r * 0.92, r * 0.92, 1, 16), wm, g); water.renderOrder = 1;
  if (o.stand) {
    const sh = o.sh || 0.2;
    mk(box(1.0, 0.06, 0.7), S('#2d3438', 0.4, 0.3), g, [-0.9, -sh + 0.03, -0.25]);
    mk(cyl(0.03, 0.03, h + 0.8, 12), S('#b9c0c4', 0.3, 0.8), g, [-0.9, -sh + (h + 0.8) / 2, -0.35]);
    mk(box(0.9, 0.05, 0.05), S('#b9c0c4', 0.3, 0.8), g, [-0.45, h * 0.62, -0.2]);
    mk(box(0.1, 0.2, 0.2 + r), S('#3b4246', 0.6, 0.3), g, [-r - 0.05, h * 0.62, 0]);
  }
  return { obj: g, d: { gas: 0, bub: 0 }, lo: [0.7, h * 0.8, 0], la: [r, h * 0.8, 0],
    read(p) { if (!o.read) return null; const v = bur ? (50 - p.gas * 50) : p.gas * 100; return { text: (bur ? v.toFixed(2) : v.toFixed(0)) + ' cm³', at: [r + 0.45, h - p.gas * (h - 0.3), 0] }; },
    up(p, dt) { const top = h - p.gas * (h - 0.3); const hh = Math.max(0.001, top - 0.01); water.scale.y = hh; water.position.y = 0.01 + hh / 2;
      if (p.bub > 0.02) A.emit('bub', p.bub * 18, dt, () => spawn({ k: 'bub', p: A.w(rnd(-r * 0.5, r * 0.5), 0.05, rnd(-r * 0.5, r * 0.5)), v: v3(0, rnd(1.0, 1.5), 0), life: 4, top: A.w(0, top, 0).y, size: rnd(0.02, 0.035), col: '#ffffff', op: 0.75 })); } };
};
const CUP_WALL = [[0.24, 0.03], [0.255, 0.06], [0.33, 0.92]];
T.cup = (o, A) => {
  const g = new THREE.Group();
  if (o.beaker !== false) { glass(g, [[0, 0]].concat(BK_WALL, [[0.4, 0.975]])); rim(g, 0.39, 0.97); }
  const cm2 = own('#f6f3ea', 0.95, 0, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  const cup = mk(latheG([[0, 0.03]].concat(CUP_WALL, [[0.345, 0.94]])), cm2, g); cup.renderOrder = 2;
  const L = new Liquid(g, CUP_WALL, { k: 0.93 });
  const lid = mk(cyl(0.36, 0.36, 0.03, 28), own('#f6f3ea', 0.95, 0, { transparent: true, opacity: 0.7 }), g, [0, 0.955, 0]); lid.renderOrder = 2;
  return { obj: g, d: { lv: 0, col: '#cfe3f2', lid: 0, fizz: 0 }, lo: [0, 1.4, 0], la: [0.3, 0.8, 0], spout: [0.35, 0.94, 0],
    up(p, dt) { const top = 0.07 + p.lv * 0.8; L.set(0.07, top, p.col); lid.visible = p.lid > 0.5; if (p.fizz > 0.02 && p.lv > 0.02) bubbles(A, p.fizz * 30, dt, 0.1, top - 0.02, 0.2); } };
};
T.thermo = (o, A) => {
  const g = new THREE.Group(); const len = o.len || 2.4, mn = o.min == null ? 0 : o.min, mx = o.max == null ? 110 : o.max;
  const rod = mk(cyl(0.032, 0.032, len, 12), glassM(), g, [0, len / 2 + 0.05, 0]); rod.renderOrder = 3;
  mk(sph(0.045, 12, 10), S('#c0392b', 0.4), g, [0, 0.06, 0]);
  const col = mk(cyl(0.011, 0.011, 1, 8), S('#c0392b', 0.4), g);
  return { obj: g, d: { T: o.T == null ? 25 : o.T }, lo: [-0.5, len * 0.7, 0], la: [0, len * 0.7, 0],
    read(p) { return o.read === false ? null : { text: p.T.toFixed(o.dp == null ? 1 : o.dp) + ' °C', at: [0.42, len * 0.9, 0] }; },
    up(p) { const f = Math.min(1, Math.max(0, (p.T - mn) / (mx - mn))); const h = 0.12 + f * (len - 0.35); col.scale.y = h; col.position.y = 0.07 + h / 2; } };
};
T.watch = (o, A) => {
  const g = new THREE.Group();
  mk(cyl(0.3, 0.3, 0.12, 28), S('#2b3236', 0.5, 0.3), g, [0, 0.38, 0], [Math.PI / 2, 0, 0]);
  mk(cyl(0.05, 0.05, 0.1, 10), S('#a9b0b4', 0.3, 0.8), g, [0, 0.72, 0]);
  mk(box(0.4, 0.08, 0.3), S('#2b3236', 0.5, 0.3), g, [0, 0.04, 0]); mk(box(0.06, 0.2, 0.06), S('#2b3236', 0.5, 0.3), g, [0, 0.15, 0]);
  const scr = lcd(256, 96, '#c9d6b8', '#1d2a1a'); screen(g, scr, 0.42, 0.16, [0, 0.38, 0.062]);
  return { obj: g, d: { rd: 0 }, lo: [0, 1.0, 0], la: [0, 0.7, 0],
    up(p) { const s = Math.max(0, p.rd); const m = Math.floor(s / 60); scr.set(String(m).padStart(2, '0') + ':' + (s - m * 60).toFixed(1).padStart(4, '0')); } };
};
const CAL_WALL = [[0.34, 0], [0.35, 0.02], [0.35, 0.8]];
T.calor = (o, A) => {
  const g = new THREE.Group(); const m = own('#b8733f', 0.32, 0.75, { side: THREE.DoubleSide });
  mk(latheG([[0, 0]].concat(CAL_WALL, [[0.39, 0.82]])), m, g);
  const L = new Liquid(g, CAL_WALL, { k: 0.95 });
  return { obj: g, d: { lv: 0, col: '#cfe3f2' }, lo: [0.75, 0.75, 0], la: [0.35, 0.6, 0], spout: [0.39, 0.82, 0], up(p) { L.set(0.03, 0.03 + p.lv * 0.72, p.col); } };
};
T.lamp = (o, A) => {
  const g = new THREE.Group(); const W = [[0.2, 0], [0.3, 0.06], [0.32, 0.18], [0.26, 0.36], [0.1, 0.46], [0.07, 0.52], [0.07, 0.58]];
  glass(g, [[0, 0]].concat(W)); const L = new Liquid(g, W, { k: 0.92 });
  mk(cyl(0.08, 0.08, 0.06, 12), S('#9aa0a3', 0.4, 0.8), g, [0, 0.6, 0]); mk(cyl(0.025, 0.025, 0.18, 8), S('#f4f1e6', 0.9), g, [0, 0.7, 0]);
  const cap = mk(new THREE.ConeGeometry(0.1, 0.25, 14), S('#9aa0a3', 0.4, 0.8), g, [0, 0.76, 0]);
  const fg = flameGroup(true); fg.position.y = 0.82; g.add(fg); const light = new THREE.PointLight('#ffb35a', 0, 4); light.position.y = 1.0; g.add(light);
  return { obj: g, d: { lv: 0.55, col: '#e9eef2', fl: 0, cap: 0 }, lo: [0.65, 0.4, 0], la: [0.3, 0.3, 0],
    up(p, dt, t) { L.set(0.02, 0.02 + p.lv * 0.4, p.col); cap.visible = p.cap > 0.5; fg.visible = p.fl > 0.02; const f = Math.max(0.01, p.fl); fg.scale.set(f, f * (1 + 0.1 * Math.sin(t * 23) + 0.06 * Math.sin(t * 41)), f); light.intensity = p.fl * 1.2; } };
};
T.shield = (o, A) => {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#a8b1b6', metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.32, depthWrite: false });
  const s = mk(cyl(o.r || 1.25, o.r || 1.25, o.h || 2.6, 40, true, Math.PI / 3, 4 * Math.PI / 3), m, g, [0, (o.h || 2.6) / 2, 0]); s.renderOrder = 2;
  return { obj: g, lo: [-(o.r || 1.25) - 0.2, (o.h || 2.6) * 0.8, 0], la: [-(o.r || 1.25), (o.h || 2.6) * 0.75, 0] };
};
T.stand = (o, A) => {
  const g = new THREE.Group(); const H = o.h || 4, rx = o.rodx == null ? -0.45 : o.rodx, rz = o.rodz == null ? -0.3 : o.rodz; const met = S('#b9c0c4', 0.3, 0.8);
  mk(box(1.2, 0.06, 0.8), S('#2d3438', 0.4, 0.3), g, [rx + 0.35, 0.03, rz + 0.2]);
  mk(cyl(0.03, 0.03, H, 12), met, g, [rx, H / 2, rz]);
  for (const c of (o.c || [])) {
    mk(box(0.16, 0.13, 0.13), S('#444c50', 0.4, 0.5), g, [rx, c.y, rz]);
    const len = Math.hypot(c.x - rx, (c.z || 0) - rz); const arm = mk(box(len, 0.045, 0.045), met, g, [(rx + c.x) / 2, c.y, (rz + (c.z || 0)) / 2]); arm.rotation.y = -Math.atan2((c.z || 0) - rz, c.x - rx);
    if (c.ring) mk(new THREE.TorusGeometry(c.ring, 0.022, 6, 28), S('#3b4246', 0.5, 0.4), g, [c.x, c.y, c.z || 0], [Math.PI / 2, 0, 0]);
    else mk(box(0.09, 0.2, 0.22), S('#3b4246', 0.6, 0.3), g, [c.x - (c.w || 0.12), c.y, c.z || 0]);
  }
  return { obj: g, lo: [rx, H + 0.25, rz], la: [rx, H - 0.2, rz] };
};
const FN_WALL = [[0.02, 0], [0.03, 0.45], [0.06, 0.55], [0.45, 0.98], [0.46, 1.0]];
const PAPER_WALL = [[0.02, 0.6], [0.37, 0.97]];
T.funnel = (o, A) => {
  const g = new THREE.Group(); glass(g, FN_WALL, 32); rim(g, 0.455, 0.995);
  let paper = null; if (o.paper) { paper = mk(latheG([[0, 0.585]].concat([[0.02, 0.6], [0.38, 0.985]])), own('#f8f6ef', 0.95, 0, { side: THREE.DoubleSide }), g); }
  const L = new Liquid(g, o.paper ? PAPER_WALL : FN_WALL.slice(2), { k: 0.95 }); const P = new Liquid(g, PAPER_WALL, { op: 0.98, k: 0.96, rough: 0.9 });
  const fl = o.dripY != null ? o.dripY : 0.3;
  return { obj: g, d: { lv: 0, col: '#cfe3f2', ppt: 0, pptc: '#f4f4f0', drip: 0 }, lo: [0.75, 0.95, 0], la: [0.42, 0.95, 0],
    up(p, dt) { const yb = 0.6, yp = yb + p.ppt * 0.14; P.set(yb, yp, p.pptc); L.set(yp, Math.max(yp, yb + p.lv * 0.34), p.col); if (p.drip > 0.02) dripFrom(A, 'drip', p.drip * 8, dt, 0, 0, 0, fl, o.filc || '#cfe3f2'); } };
};
const ED_WALL = [[0.22, 0.0], [0.32, 0.05], [0.42, 0.14], [0.46, 0.2]];
T.evap = (o, A) => {
  const g = new THREE.Group(); const m = own('#efe9dd', 0.7, 0, { side: THREE.DoubleSide });
  mk(latheG([[0, 0]].concat(ED_WALL)), m, g);
  const L = new Liquid(g, ED_WALL, { k: 0.95 }), P = new Liquid(g, ED_WALL, { op: 0.98, k: 0.93, rough: 0.9 });
  return { obj: g, d: { lv: 0, col: '#cfe3f2', sol: 0, solc: '#f1d77a', steam: 0, hot: 0 }, lo: [0.75, 0.4, 0], la: [0.44, 0.18, 0],
    up(p, dt) { const y0 = 0.012, ys = y0 + p.sol * 0.05; P.set(y0, ys, p.solc); L.set(ys, Math.max(ys, y0 + p.lv * 0.17), p.col); m.emissive.set('#ff4a12'); m.emissiveIntensity = p.hot * 0.5; if (p.steam > 0.02) steamFrom(A, p.steam * 7, dt, 0, 0.2, 0, '#ffffff', 0.18); } };
};
const SF_WALL = [[0.022, 0.0], [0.025, 0.7], [0.04, 0.9], [0.16, 1.15], [0.3, 1.5], [0.36, 1.75], [0.3, 1.95], [0.16, 2.08], [0.09, 2.15], [0.09, 2.32]];
T.sepf = (o, A) => {
  const g = new THREE.Group(); glass(g, [[0.018, 0]].concat(SF_WALL.slice(1), [[0.1, 2.33]])); rim(g, 0.095, 2.33);
  mk(cyl(0.045, 0.045, 0.24, 12), S('#f2f2ee', 0.4), g, [0, 0.78, 0], [0, 0, Math.PI / 2]);
  const handle = mk(box(0.04, 0.2, 0.06), S('#2c5d9a', 0.4), g, [0.15, 0.78, 0]);
  const stopper = new THREE.Group(); mk(sph(0.11, 14, 10), glassM(), stopper, [0, 2.48, 0]); mk(cyl(0.09, 0.08, 0.14, 14), glassM(), stopper, [0, 2.36, 0]); g.add(stopper);
  const L1 = new Liquid(g, SF_WALL, { k: 0.9 }), L2 = new Liquid(g, SF_WALL, { k: 0.9 });
  const fl = o.dripY != null ? o.dripY : 0.3;
  return { obj: g, d: { l1: 0, c1: '#7b3fa1', l2: 0, c2: '#e9d29a', stop: 1, tap: 0, drip: 0, vent: 0 }, lo: [0.9, 1.9, 0], la: [0.32, 1.7, 0],
    read(p) { return null; },
    up(p, dt) {
      const ya = 0.82 + p.l1 * 1.3, yb = Math.max(ya, 0.82 + p.l2 * 1.3);
      L1.set(0.82, ya, p.c1); L2.set(ya, yb, p.c2); stopper.visible = p.stop > 0.5; handle.rotation.x = p.tap * Math.PI / 2;
      if (p.drip > 0.02) dripFrom(A, 'drip', p.drip * 9, dt, 0, 0, 0, fl, p.c1);
      if (p.vent > 0.02) steamFrom(A, p.vent * 10, dt, 0, -0.05, 0, '#e8e2f0', 0.1);
    } };
};
const GB_WALL = [[0.28, 0.0], [0.3, 0.04], [0.3, 0.75], [0.22, 0.88], [0.13, 0.95], [0.13, 1.1]];
T.gbottle = (o, A) => {
  const g = new THREE.Group(); glass(g, [[0, 0]].concat(GB_WALL)); rim(g, 0.13, 1.1);
  const cap = mk(cyl(0.155, 0.155, 0.16, 20), S('#1f2427', 0.6), g, [0, 1.13, 0]);
  const L1 = new Liquid(g, GB_WALL, { k: 0.92 }), L2 = new Liquid(g, GB_WALL, { k: 0.92 });
  return { obj: g, d: { l1: 0, c1: '#7b3fa1', l2: 0, c2: '#cfe3f2', cap: 0 }, lo: [0.7, 1.2, 0], la: [0.3, 0.8, 0],
    up(p) { const ya = 0.02 + p.l1 * 0.9, yb = Math.max(ya, 0.02 + p.l2 * 0.9); L1.set(0.02, ya, p.c1); L2.set(ya, yb, p.c2); cap.visible = p.cap > 0.5; } };
};
T.bath = (o, A) => {
  const g = new THREE.Group(); const w = o.w || 2.4, h = o.h || 0.8, d = o.dd || 1.3;
  const wall = new THREE.MeshStandardMaterial({ color: '#c9d0d4', metalness: 0.55, roughness: 0.35, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  mk(box(w, 0.05, d), S('#b8c0c4', 0.35, 0.6), g, [0, 0.025, 0]);
  for (const [px, pz, ww, dd] of [[0, -d / 2, w, 0.04], [0, d / 2, w, 0.04], [-w / 2, 0, 0.04, d], [w / 2, 0, 0.04, d]]) { const m = mk(box(ww, h, dd), wall, g, [px, h / 2, pz]); m.renderOrder = 2; }
  mk(box(0.8, 0.35, 0.06), S('#2b3236', 0.5, 0.3), g, [w / 2 - 0.5, h - 0.2, d / 2 + 0.03]);
  const scr = lcd(256, 80); screen(g, scr, 0.6, 0.19, [w / 2 - 0.5, h - 0.2, d / 2 + 0.065]);
  const wm = new THREE.MeshStandardMaterial({ color: '#8fc2e6', transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false });
  const water = mk(box(w - 0.08, 1, d - 0.08), wm, g); water.renderOrder = 1;
  return { obj: g, d: { T: 25, lv: 0.75 }, lo: [-w / 2 + 0.3, h + 0.45, 0], la: [-w / 2 + 0.3, h, 0],
    up(p) { scr.set(p.T.toFixed(1) + ' °C'); const hh = Math.max(0.001, p.lv * h); water.scale.y = hh; water.position.y = 0.05 + hh / 2; } };
};
T.psu = (o, A) => {
  const g = new THREE.Group(); mk(box(1.1, 0.62, 0.7), S('#2b3135', 0.5, 0.3), g, [0, 0.31, 0]);
  const scr = lcd(320, 80); screen(g, scr, 0.7, 0.18, [-0.1, 0.42, 0.352]);
  mk(cyl(0.07, 0.07, 0.06, 16), S('#9aa0a3', 0.4, 0.7), g, [0.38, 0.42, 0.37], [Math.PI / 2, 0, 0]);
  mk(cyl(0.045, 0.045, 0.08, 10), S('#c0392b', 0.5), g, [0.15, 0.15, 0.37], [Math.PI / 2, 0, 0]); mk(cyl(0.045, 0.045, 0.08, 10), S('#15191b', 0.5), g, [0.35, 0.15, 0.37], [Math.PI / 2, 0, 0]);
  return { obj: g, d: { on: 0, rd: 0 }, lo: [0, 0.95, 0], la: [0, 0.6, 0], up(p) { scr.set(p.on > 0.5 ? (o.v || 12).toFixed(1) + ' V  ' + p.rd.toFixed(2) + ' A' : 'OFF'); } };
};
T.meter = (o, A) => {
  const g = new THREE.Group(); mk(box(0.72, 0.5, 0.36), S('#e4e0d6', 0.6), g, [0, 0.25, 0]);
  const scr = lcd(256, 80); screen(g, scr, 0.56, 0.18, [0, 0.31, 0.181]);
  mk(cyl(0.04, 0.04, 0.08, 10), S('#c0392b', 0.5), g, [-0.2, 0.09, 0.19], [Math.PI / 2, 0, 0]); mk(cyl(0.04, 0.04, 0.08, 10), S('#15191b', 0.5), g, [0.2, 0.09, 0.19], [Math.PI / 2, 0, 0]);
  return { obj: g, d: { rd: 0 }, lo: [0, 0.85, 0], la: [0, 0.5, 0], up(p) { scr.set(p.rd.toFixed(o.dp == null ? 2 : o.dp) + ' ' + (o.u || 'V')); } };
};
T.rods = (o, A) => {
  const g = new THREE.Group(); const gap = o.gap || 0.12;
  mk(cyl(0.24, 0.2, 0.22, 20), S('#4b2e2a', 0.85), g, [0, 2.0, 0]);
  mk(cyl(0.045, 0.045, 2.3, 12), S('#26292b', 0.6, 0.3), g, [-gap, 1.15, 0]); mk(cyl(0.045, 0.045, 2.3, 12), S('#26292b', 0.6, 0.3), g, [gap, 1.15, 0]);
  return { obj: g, lo: [0.55, 2.2, 0], la: [0.2, 2.0, 0] };
};
T.plate = (o, A) => {
  const g = new THREE.Group(); const c = o.metal === 'Cu' ? '#c46f3d' : '#9ea7ae';
  mk(box(0.3, 1.3, 0.04), S(c, 0.35, 0.8), g, [0, 0.65, 0]); mk(box(0.1, 0.12, 0.08), S(o.clip || '#c0392b', 0.5), g, [0, 1.32, 0]);
  return { obj: g, lo: [0, 1.75, 0], la: [0, 1.3, 0] };
};
function rbWall(R, nr, nh) { const pts = []; const pe = Math.acos(nr / R); for (let i = 0; i <= 18; i++) { const ph = -Math.PI / 2 + (i / 18) * (pe + Math.PI / 2); pts.push([R * Math.cos(ph), R + R * Math.sin(ph)]); } const yn = R + R * Math.sin(pe); pts.push([nr, yn + nh]); pts[0][0] = 0.001; return pts; }
const RB_WALL = rbWall(0.45, 0.1, 0.45);
T.rbf = (o, A) => {
  const g = new THREE.Group(); glass(g, [[0, 0]].concat(RB_WALL, [[0.115, RB_WALL[RB_WALL.length - 1][1] + 0.02]])); rim(g, 0.11, RB_WALL[RB_WALL.length - 1][1] + 0.01);
  const L = new Liquid(g, RB_WALL, { k: 0.93 }), P = new Liquid(g, RB_WALL, { op: 0.98, k: 0.92, rough: 0.9 });
  const chips = new THREE.Group(); for (let i = 0; i < 6; i++) mk(box(0.05, 0.04, 0.05), S('#f2efe7', 0.9), chips, [rnd(-0.12, 0.12), 0.04, rnd(-0.12, 0.12)], [rnd(0, 3), rnd(0, 3), 0]); g.add(chips);
  return { obj: g, d: { lv: 0, col: '#cfe3f2', boil: 0, ppt: 0, pptc: '#f4f4f0', chips: o.chips ? 1 : 0 }, lo: [0.75, 0.9, 0], la: [0.4, 0.7, 0], spout: [0.11, 1.36, 0],
    up(p, dt) { const y0 = 0.02, yp = y0 + p.ppt * 0.14, top = Math.max(yp, y0 + p.lv * 0.85); P.set(y0, yp, p.pptc); L.set(yp, top, p.col); chips.visible = p.chips > 0.5; if (p.boil > 0.02 && p.lv > 0.02) bubbles(A, p.boil * 45, dt, 0.05, top - 0.02, 0.25); } };
};
T.cond = (o, A) => {
  const g = new THREE.Group(); const L = o.len || 2.2;
  const inner = mk(cyl(0.055, 0.055, L, 16, true), glassM(), g, [0, L / 2, 0]); inner.renderOrder = 3;
  const jacket = mk(cyl(0.15, 0.15, L - 0.5, 24, true), glassM(), g, [0, L / 2, 0]); jacket.renderOrder = 3;
  rim(g, 0.15, 0.25); rim(g, 0.15, L - 0.25);
  const nubIn = mk(cyl(0.035, 0.035, 0.28, 10), glassM(), g, [0.25, 0.42, 0], [0, 0, Math.PI / 2]); nubIn.renderOrder = 3;
  const nubOut = mk(cyl(0.035, 0.035, 0.28, 10), glassM(), g, [0.25, L - 0.42, 0], [0, 0, Math.PI / 2]); nubOut.renderOrder = 3;
  const wm = basic('#7fbfff', 0.22); const water = mk(cyl(0.142, 0.142, L - 0.52, 20, true), wm, g, [0, L / 2, 0]); water.renderOrder = 1;
  const flowIn = o.flip ? L - 0.42 : 0.42, flowOut = o.flip ? 0.42 : L - 0.42;
  return { obj: g, d: { water: 0, vap: 0 }, lo: [0.7, L * 0.5, 0], la: [0.15, L * 0.5, 0],
    up(p, dt) { water.visible = p.water > 0.05; wm.opacity = 0.22 * p.water;
      if (p.water > 0.05) A.emit('flow', 10 * p.water, dt, () => { const a = A.w(0.1, flowIn, 0), b = A.w(0.1, flowOut, 0); const life = 1.8; spawn({ k: 'flow', p: a.clone().add(v3(0, 0, rnd(-0.08, 0.08))), v: b.sub(a).multiplyScalar(1 / life), life, size: 0.018, col: '#5aa7ff', op: 0.9 }); });
      if (p.vap > 0.05) A.emit('vap', 6 * p.vap, dt, () => { const a = A.w(0, o.flip ? 0.2 : L - 0.2, 0), b = A.w(0, o.flip ? L - 0.1 : 0.1, 0); const life = 1.6; spawn({ k: 'flow', p: a, v: b.sub(a).multiplyScalar(1 / life), life, size: 0.022, col: o.vc || '#e7f2fb', op: 0.9 }); }); } };
};
T.still = (o, A) => {
  const g = new THREE.Group(); const t = mk(cyl(0.1, 0.1, 0.6, 16, true), glassM(), g, [0, 0.3, 0]); t.renderOrder = 3;
  rodBetween(g, [0, 0.45, 0], [0.42, 0.3, 0], 0.055, glassM()).renderOrder = 3; rim(g, 0.1, 0.6);
  return { obj: g, lo: [-0.6, 0.5, 0], la: [-0.1, 0.4, 0] };
};
T.mantle = (o, A) => {
  const g = new THREE.Group(); mk(cyl(0.62, 0.56, 0.55, 32), S('#2f5e8f', 0.5, 0.3), g, [0, 0.275, 0]);
  const im = own('#9d978d', 0.95); const inner = mk(new THREE.SphereGeometry(0.5, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), im, g, [0, 0.55, 0]); inner.material.side = THREE.DoubleSide;
  mk(new THREE.TorusGeometry(0.56, 0.03, 8, 32), S('#24496f', 0.5, 0.3), g, [0, 0.55, 0], [Math.PI / 2, 0, 0]);
  mk(box(0.5, 0.3, 0.2), S('#24496f', 0.5, 0.3), g, [0, 0.18, 0.62]); mk(cyl(0.06, 0.06, 0.06, 14), S('#15191b', 0.5), g, [-0.1, 0.18, 0.74], [Math.PI / 2, 0, 0]);
  const led = mk(sph(0.03, 8, 6), own('#5a1010', 0.4), g, [0.13, 0.18, 0.72]);
  return { obj: g, d: { heat: 0 }, lo: [0.95, 0.4, 0], la: [0.6, 0.35, 0],
    up(p) { im.emissive.set('#ff4a12'); im.emissiveIntensity = p.heat * 0.7; led.material.emissive.set('#ff2a2a'); led.material.emissiveIntensity = p.heat > 0.05 ? 1.2 : 0; } };
};
T.icebath = (o, A) => {
  const g = new THREE.Group(); const W = [[0.8, 0], [0.82, 0.02], [0.85, 0.6]];
  glass(g, [[0, 0]].concat(W)); rim(g, 0.85, 0.6);
  const L = new Liquid(g, W, { k: 0.96, op: 0.45 }); L.set(0.02, 0.4, '#bfe0f5');
  const im = new THREE.MeshStandardMaterial({ color: '#f4fbff', transparent: true, opacity: 0.8, roughness: 0.15 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + rnd(-0.1, 0.1), r = rnd(0.58, 0.7); mk(box(0.14, 0.12, 0.14), im, g, [Math.cos(a) * r, rnd(0.33, 0.42), Math.sin(a) * r], [rnd(0, 1), rnd(0, 1), 0]); }
  return { obj: g, lo: [1.1, 0.5, 0], la: [0.8, 0.4, 0] };
};
T.grod = (o, A) => {
  const g = new THREE.Group(); mk(cyl(0.022, 0.022, o.len || 1.3, 10), new THREE.MeshStandardMaterial({ color: '#e3f2fa', transparent: true, opacity: 0.65, roughness: 0.1 }), g, [0, (o.len || 1.3) / 2, 0]);
  return { obj: g, lo: [0.35, (o.len || 1.3) + 0.15, 0], la: [0, o.len || 1.3, 0] };
};
T.tile = (o, A) => { const g = new THREE.Group(); mk(box(o.w || 1.1, 0.03, o.w || 1.1), S('#f4f4f1', 0.45), g, [0, 0.015, 0]); return { obj: g, lo: [0.75, 0.15, 0.4], la: [0.4, 0.03, 0.4] }; };
T.hood = (o, A) => {
  const g = new THREE.Group(); const w = o.w || 7, h = o.h || 4.6, d = o.dd || 2.8; const fm = S('#c7cfcf', 0.75); const z0 = -d / 2;
  mk(box(w, h, 0.06), S('#9fb0b0', 0.85), g, [0, h / 2, z0]);
  mk(box(0.1, h, d), fm, g, [-w / 2, h / 2, 0]); mk(box(0.1, h, d), fm, g, [w / 2, h / 2, 0]); mk(box(w + 0.1, 0.5, d), fm, g, [0, h + 0.25, 0]);
  const sash = mk(box(w - 0.1, 1.2, 0.03), new THREE.MeshStandardMaterial({ color: '#cfe8f0', transparent: true, opacity: 0.15, roughness: 0.05, depthWrite: false }), g, [0, h - 0.6, d / 2]); sash.renderOrder = 4;
  mk(box(w - 0.1, 0.08, 0.06), fm, g, [0, h - 1.2, d / 2]);
  return { obj: g, lo: [0, h + 0.75, d / 2], la: [0, h + 0.5, d / 2] };
};
T.note = (o, A) => ({ obj: new THREE.Group(), lo: [0, 0, 0], noLeader: true, style: o.style || 'note', always: true });
T.arrow = (o, A) => {
  const g = new THREE.Group(); const m = basic(o.col || '#ffd166', 0.95); const len = o.len || 0.8;
  mk(cyl(0.025, 0.025, len - 0.18, 8), m, g, [0, (len - 0.18) / 2, 0]); mk(new THREE.ConeGeometry(0.07, 0.18, 12), m, g, [0, len - 0.09, 0]);
  const d = v3(o.dir[0], o.dir[1], o.dir[2]).normalize(); g.quaternion.setFromUnitVectors(UP, d);
  return { obj: g, lo: [0, 0, 0], noLeader: true };
};
T.box = (o, A) => { const g = new THREE.Group(); mk(box(o.w || 0.5, o.h || 0.1, o.dd || 0.5), o.metal ? S(o.col || '#9aa0a3', 0.3, 0.8) : S(o.col || '#ffffff', 0.6), g, [0, (o.h || 0.1) / 2, 0]); return { obj: g, lo: [0, (o.h || 0.1) + 0.3, 0] }; };
T.washb = (o, A) => {
  const g = new THREE.Group(); const W = [[0.28, 0], [0.3, 0.05], [0.3, 0.85], [0.18, 1.0], [0.09, 1.05], [0.09, 1.12]];
  const m = own('#eef3f4', 0.55, 0, { transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }); const b = mk(latheG([[0, 0]].concat(W)), m, g); b.renderOrder = 2;
  const L = new Liquid(g, W, { k: 0.9 }); L.set(0.02, 0.6, '#cfe3f2');
  mk(cyl(0.13, 0.13, 0.12, 16), S('#e5e5e0', 0.6), g, [0, 1.15, 0]);
  mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(0, 1.2, 0), v3(0, 1.55, 0), v3(0.15, 1.7, 0), v3(0.45, 1.65, 0)]), 20, 0.022, 8), S('#e5e5e0', 0.6), g);
  return { obj: g, d: { drip: 0 }, lo: [0, 2.0, 0], la: [0.1, 1.7, 0], up(p, dt) { if (p.drip > 0.02) A.emit('d', 30 * p.drip, dt, () => spawn({ k: 'drop', p: A.w(0.46, 1.64, 0), v: A.w(1.2, 1.4, 0).sub(A.w(0, 1.64, 0)).multiplyScalar(0.5), life: 3, floor: o.dripY != null ? o.dripY : 0.3, col: '#d9ecfa', size: 0.02, op: 0.85 })); } };
};
T.buchner = (o, A) => {
  const g = new THREE.Group(); const m = own('#efe9dd', 0.7, 0, { side: THREE.DoubleSide });
  mk(latheG([[0.035, 0], [0.05, 0.5], [0.12, 0.55], [0.4, 0.62], [0.42, 0.95]]), m, g);
  mk(cyl(0.39, 0.39, 0.02, 28), S('#e6dfd2', 0.8), g, [0, 0.64, 0]);
  const P = mk(cyl(0.385, 0.385, 1, 28), own('#f7f7f2', 0.9), g); const L = new Liquid(g, [[0.39, 0.65], [0.41, 0.95]], { k: 0.97 });
  mk(cyl(0.12, 0.1, 0.15, 16), S('#4b2e2a', 0.85), g, [0, 0.05, 0]);
  return { obj: g, d: { ppt: 0, pptc: '#f7f7f2', lv: 0, col: '#cfe3f2' }, lo: [0.8, 1.0, 0], la: [0.42, 0.9, 0],
    up(p) { const h = Math.max(0.001, p.ppt * 0.08); P.scale.y = h; P.position.y = 0.65 + h / 2; P.visible = p.ppt > 0.02; P.material.color.set(p.pptc); L.set(0.65 + h, Math.max(0.65 + h, 0.65 + h + p.lv * 0.25), p.col); } };
};
T.oven = (o, A) => {
  const g = new THREE.Group(); const sm = S('#d7dbdd', 0.45, 0.35); const w = 1.8, h = 1.3, d = 1.2;
  mk(box(w, 0.06, d), sm, g, [0, 0.03, 0]); mk(box(w, 0.06, d), sm, g, [0, h, 0]); mk(box(0.06, h, d), sm, g, [-w / 2, h / 2, 0]); mk(box(0.06, h, d), sm, g, [w / 2, h / 2, 0]);
  const back = own('#6b6f71', 0.7); mk(box(w, h, 0.06), back, g, [0, h / 2, -d / 2]);
  mk(box(w - 0.1, 0.02, d - 0.1), S('#8d9396', 0.5, 0.7), g, [0, 0.45, 0]);
  const door = mk(box(w, h, 0.03), new THREE.MeshStandardMaterial({ color: '#d7eef6', transparent: true, opacity: 0.18, depthWrite: false }), g, [0, h / 2 + 0.02, d / 2]); door.renderOrder = 4;
  const scr = lcd(256, 80); screen(g, scr, 0.5, 0.15, [w / 2 - 0.4, h - 0.15, d / 2 + 0.02]);
  return { obj: g, d: { on: 0 }, lo: [0, h + 0.35, 0], la: [0, h, 0], up(p) { back.emissive.set('#ff6a20'); back.emissiveIntensity = p.on * 0.35; scr.set(p.on > 0.5 ? 'ON' : 'OFF'); } };
};
T.mp = (o, A) => {
  const g = new THREE.Group();
  mk(box(1.1, 0.3, 0.9), S('#2b3236', 0.5, 0.3), g, [0, 0.15, 0]); const scr = lcd(256, 80); screen(g, scr, 0.5, 0.15, [0, 0.15, 0.452]);
  mk(box(0.7, 0.5, 0.6), S('#b9bfc4', 0.35, 0.7), g, [0, 0.55, 0]);
  const cap = mk(cyl(0.02, 0.02, 0.9, 8), glassM(), g, [0.18, 1.0, 0.1]); cap.renderOrder = 3;
  const sm = own('#f7f7f2', 0.9, 0, { transparent: true, opacity: 1 }); const sample = mk(cyl(0.017, 0.017, 0.1, 8), sm, g, [0.18, 0.86, 0.1]);
  const lens = mk(cyl(0.18, 0.18, 0.02, 24), new THREE.MeshStandardMaterial({ color: '#dff2ff', transparent: true, opacity: 0.25, depthWrite: false }), g, [0.18, 0.88, 0.35], [Math.PI / 2, 0, 0]); lens.renderOrder = 4;
  mk(new THREE.TorusGeometry(0.18, 0.02, 6, 24), S('#2b3236', 0.5), g, [0.18, 0.88, 0.35]);
  return { obj: g, d: { T: 25, melt: 0, solc: '#f7f7f2' }, lo: [-0.7, 1.0, 0], la: [-0.35, 0.7, 0],
    up(p) { scr.set(p.T.toFixed(1) + ' °C'); sm.color.set(p.solc); sm.opacity = 1 - p.melt * 0.7; sample.scale.y = 1 - p.melt * 0.35; } };
};

/* ---------- engine ---------- */
LAB.init = function (canvas, stage) {
  stageEl = stage;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#1a2427'); scene.fog = new THREE.Fog('#1a2427', 16, 34);
  camera = new THREE.PerspectiveCamera(36, 1.6, 0.05, 120);
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 1.5; controls.maxDistance = 24; controls.maxPolarAngle = Math.PI * 0.49; controls.screenSpacePanning = true;
    controls.addEventListener('start', () => { camTw = null; userMovedCam = true; });
  }
  scene.add(new THREE.HemisphereLight('#e3f1ff', '#2a2420', 0.75));
  const key = new THREE.DirectionalLight('#fff6ea', 1.0); key.position.set(4, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 30; key.shadow.bias = -0.0006; scene.add(key);
  const fill = new THREE.DirectionalLight('#cfe2ff', 0.35); fill.position.set(-6, 4, -3); scene.add(fill);
  const rimL = new THREE.DirectionalLight('#ffffff', 0.45); rimL.position.set(0, 5, -8); scene.add(rimL);
  const bench = mk(box(22, 0.4, 7), own('#273033', 0.55, 0.1), scene, [0, -0.2, 0]); bench.castShadow = false;
  mk(box(22, 0.06, 0.08), own('#3a4448', 0.4, 0.3), scene, [0, -0.03, 3.5]);
  const wall = mk(new THREE.PlaneGeometry(40, 16), own('#1f2a2d', 0.95), scene, [0, 7.6, -3.5]); wall.receiveShadow = true;
  const grid = new THREE.GridHelper(40, 80, 0x2a3639, 0x243033); grid.rotation.x = Math.PI / 2; grid.position.set(0, 7.6, -3.48); scene.add(grid);
  clock = new THREE.Clock();
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  LAB.ok = true; return true;
};
function resize() {
  if (!renderer) return; const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
function fitCam(c) {
  const p = v3(c[0], c[1], c[2]), t = v3(c[3], c[4], c[5]);
  const asp = camera.aspect || 1.6; if (asp < 1.45) { const k = Math.pow(1.45 / asp, 0.85); p.sub(t).multiplyScalar(k).add(t); }
  return [p, t];
}
function setCam(c, instant) {
  if (!c) return; const [p, t] = fitCam(c);
  if (instant || reduceMotion) { camera.position.copy(p); if (controls) controls.target.copy(t); camera.lookAt(t); camTw = null; return; }
  camTw = { t: 0, d: 1.3, p0: camera.position.clone(), t0: controls ? controls.target.clone() : t.clone(), p1: p, t1: t };
}
function clearScene() {
  queue = []; cur = null; clearParticles();
  for (const a of actorList) { scene.remove(a.root); scene.remove(a.lab); if (a.leader) scene.remove(a.leader); if (a.rs) scene.remove(a.rs); }
  actors = {}; actorList = []; states = [];
}
function phasesOf(step) {
  if (step.ph) return step.ph.map(p => Array.isArray(p) ? { d: p[0], s: p[1] } : p);
  if (step.s) return [{ d: step.dur || 1.4, s: step.s }];
  return [];
}
function snapshot() { const s = {}; for (const a of actorList) s[a.id] = Object.assign({}, a.d); return s; }
function applyTo(state, part) { for (const id in part) { if (!state[id]) { console.warn('[lab] no actor', id); continue; } state[id] = Object.assign({}, state[id], part[id]); } }
LAB.load = function (def) {
  clearScene(); ex = def;
  for (const spec of def.actors) { const a = new Actor(spec[0], spec[1], spec[2] || {}); actors[a.id] = a; actorList.push(a); scene.add(a.root); }
  states = [snapshot()];
  def.steps.forEach((st, i) => { const s = {}; for (const id in states[i]) s[id] = Object.assign({}, states[i][id]); for (const ph of phasesOf(st)) applyTo(s, ph.s); states.push(s); });
  for (const a of actorList) Object.assign(a.p, states[0][a.id]);
  userMovedCam = false; setCam(def.cam, true);
};
LAB.go = function (k, opts) {
  if (!ex) return; opts = opts || {};
  queue = []; cur = null; clearParticles();
  queue.push({ d: opts.instant ? 0.001 : 0.5, s: states[k] });
  for (const ph of phasesOf(ex.steps[k])) queue.push(ph);
  setCam(ex.steps[k].cam || ex.cam, !!opts.instant);
  startNext();
};
LAB.resetView = function (k) { if (ex) setCam((ex.steps[k] && ex.steps[k].cam) || ex.cam, false); };
LAB.onIdle = function (fn) { idleCb = fn; };
LAB.busy = function () { return !!cur || queue.length > 0; };
LAB.setLabels = function (on) { labelsOn = on; };
LAB.start = function () { if (running || !renderer) return; running = true; clock.getDelta(); requestAnimationFrame(loop); };
LAB.stop = function () { running = false; };
function startNext() {
  cur = queue.shift() || null;
  if (!cur) { if (idleCb) idleCb(); return; }
  cur.t = 0; cur.from = {};
  for (const id in cur.s) {
    const a = actors[id]; if (!a) continue; const f = {};
    for (const k in cur.s[id]) {
      const v = cur.s[id][k], ov = a.p[k];
      if (typeof v === 'number' && typeof ov === 'number') f[k] = ov;
      else if (typeof v === 'string' && v[0] === '#' && typeof ov === 'string' && ov[0] === '#') f[k] = ov;
      else a.p[k] = v;
    }
    cur.from[id] = f;
  }
}
function tween(dt) {
  if (!cur) return; cur.t += dt; const r = Math.min(1, cur.t / Math.max(cur.d, 0.001));
  const e = r < 0.5 ? 4 * r * r * r : 1 - Math.pow(-2 * r + 2, 3) / 2;
  for (const id in cur.from) {
    const a = actors[id], f = cur.from[id], to = cur.s[id];
    for (const k in f) { const fv = f[k], tv = to[k]; if (typeof fv === 'number') a.p[k] = fv + (tv - fv) * e; else { tc1.set(fv); tc2.set(tv); tc1.lerp(tc2, e); a.p[k] = '#' + tc1.getHexString(); } }
  }
  if (r >= 1) startNext();
}
const tmpV = v3(0, 0, 0);
function updateLabels() {
  const H = stageEl.clientHeight || 600; const k = 2 * Math.tan(camera.fov * Math.PI / 360) / H;
  for (const a of actorList) {
    const vis = a.root.visible && a.p.vis > 0.6;
    const text = a.p.lab;
    const show = vis && text && (labelsOn || a.always);
    a.lab.visible = !!show;
    if (show) {
      setLabelText(a.lab, text); const u = a.lab.userData; a.lab.scale.set(k * u.hpx * u.aspect, k * u.hpx, 1);
      const base = a.root.position; a.lab.position.set(base.x + a.lo[0], base.y + a.lo[1], base.z + a.lo[2]);
      if (a.leader) {
        const la = a.la || [0, a.lo[1] * 0.6, 0]; const arr = a.leader.geometry.attributes.position.array;
        arr[0] = a.lab.position.x; arr[1] = a.lab.position.y; arr[2] = a.lab.position.z; arr[3] = base.x + la[0]; arr[4] = base.y + la[1]; arr[5] = base.z + la[2];
        a.leader.geometry.attributes.position.needsUpdate = true; a.leader.visible = true;
      }
    } else if (a.leader) a.leader.visible = false;
    if (a.rs) {
      const R = vis ? a.read(a.p) : null;
      if (R && R.text) { setLabelText(a.rs, R.text); const u = a.rs.userData; a.rs.scale.set(k * u.hpx * u.aspect, k * u.hpx, 1); a.rs.position.copy(a.w(R.at[0], R.at[1], R.at[2])); a.rs.visible = true; }
      else a.rs.visible = false;
    }
  }
}
function loop() {
  if (!running) return; requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta()) * (LAB.speed || 1), t = clock.elapsedTime;
  tween(dt);
  if (camTw) {
    camTw.t += dt; const r = Math.min(1, camTw.t / camTw.d); const e = 1 - Math.pow(1 - r, 3);
    camera.position.lerpVectors(camTw.p0, camTw.p1, e);
    const tt = tmpV.copy(camTw.t0).lerp(camTw.t1, e); if (controls) controls.target.copy(tt); else camera.lookAt(tt);
    if (r >= 1) camTw = null;
  }
  if (controls) controls.update();
  for (const a of actorList) a.frame(dt, t);
  // flow particles: no gravity, die by life
  updateParticles(dt);
  updateLabels();
  renderer.render(scene, camera);
}
})();
