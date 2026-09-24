import * as THREE from 'three';
import type { ModelKind } from '../sat/types';

/**
 * Procedural satellite models, built at roughly real scale in metres.
 * Axes follow glTF / Cesium conventions so the same model can fly on the globe:
 *   +Y = zenith (away from Earth), −Y = nadir, +Z = direction of flight.
 */

export interface Part {
  id: string;
  label: string;
  detail: string;
  object: THREE.Object3D;
  /** Hotspot position in the part's local space. */
  anchor: THREE.Vector3;
  /** Exploded-view offset direction (world units at t = 1). */
  explode: THREE.Vector3;
}

export interface BuiltModel {
  root: THREE.Group;
  parts: Part[];
  title: string;
  summary: string;
}

// ───────────────────────────── textures & materials ─────────────────────────────

let solarTex: THREE.CanvasTexture | null = null;
function solarTexture(): THREE.CanvasTexture {
  if (solarTex) return solarTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#1a1650');
  grad.addColorStop(1, '#2b1d6e');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#8f8fb8';
  g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 128);
    g.moveTo(0, i);
    g.lineTo(128, i);
    g.stroke();
  }
  g.strokeStyle = 'rgba(160,160,220,0.35)';
  g.lineWidth = 1;
  for (let i = 8; i < 128; i += 8) {
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(128, i);
    g.stroke();
  }
  solarTex = new THREE.CanvasTexture(c);
  solarTex.wrapS = solarTex.wrapT = THREE.RepeatWrapping;
  solarTex.colorSpace = THREE.SRGBColorSpace;
  return solarTex;
}

let foilTex: THREE.CanvasTexture | null = null;
function foilTexture(): THREE.CanvasTexture {
  if (foilTex) return foilTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b8902a';
  g.fillRect(0, 0, 128, 128);
  // Crinkled multi-layer insulation.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * 128;
    const y = rnd() * 128;
    const l = 4 + rnd() * 18;
    const a = rnd() * Math.PI;
    g.strokeStyle = rnd() > 0.5 ? 'rgba(255,230,150,0.55)' : 'rgba(90,60,10,0.45)';
    g.lineWidth = 1 + rnd() * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  foilTex = new THREE.CanvasTexture(c);
  foilTex.wrapS = foilTex.wrapT = THREE.RepeatWrapping;
  foilTex.colorSpace = THREE.SRGBColorSpace;
  return foilTex;
}

const M = {
  foil: () => new THREE.MeshStandardMaterial({ color: 0xffffff, map: foilTexture(), metalness: 0.85, roughness: 0.38 }),
  silverFoil: () => new THREE.MeshStandardMaterial({ color: 0xc8c8d8, metalness: 0.9, roughness: 0.3 }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xb9b5c8, metalness: 0.15, roughness: 0.7 }),
  grey: () => new THREE.MeshStandardMaterial({ color: 0x8a8898, metalness: 0.6, roughness: 0.45 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x24222e, metalness: 0.5, roughness: 0.5 }),
  black: () => new THREE.MeshStandardMaterial({ color: 0x07060a, metalness: 0.2, roughness: 0.9 }),
  solar: (rx = 1, ry = 1) => {
    const t = solarTexture().clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.28, color: 0xffffff });
  },
  glow: (hex: string) => new THREE.MeshStandardMaterial({ color: hex, emissive: new THREE.Color(hex), emissiveIntensity: 2.2 }),
};

// ───────────────────────────────── primitives ─────────────────────────────────

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos?: [number, number, number], rot?: [number, number, number]) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  return m;
}

const box = (w: number, h: number, d: number, mat: THREE.Material, pos?: [number, number, number]) => mesh(new THREE.BoxGeometry(w, h, d), mat, pos);

/** Cylinder along an axis. */
function cyl(r: number, len: number, mat: THREE.Material, axis: 'x' | 'y' | 'z', pos?: [number, number, number], seg = 24, r2 = r) {
  const m = mesh(new THREE.CylinderGeometry(r, r2, len, seg), mat, pos);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

/** Cylinder between two points. */
function strut(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/** Solar blanket lying in the XZ plane. */
function solarPanel(w: number, l: number, cells = 1) {
  return box(w, 0.06, l, M.solar(Math.max(1, Math.round(w / cells)), Math.max(1, Math.round(l / cells))));
}

/** Parabolic dish opening toward +Y. */
function dish(radius: number, depth: number, mat: THREE.Material) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const r = (i / 16) * radius;
    pts.push(new THREE.Vector2(r, (r * r * depth) / (radius * radius)));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), mat);
  (m.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  return m;
}

function helix(r: number, h: number, turns: number, tube: number, mat: THREE.Material) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= turns * 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, -(i / (turns * 24)) * h, Math.sin(a) * r));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, tube, 5), mat);
}

/** Square lattice truss along X. */
function truss(len: number, s: number, bays: number) {
  const g = new THREE.Group();
  const mat = M.grey();
  const h = s / 2;
  const corners: [number, number][] = [
    [h, h],
    [h, -h],
    [-h, -h],
    [-h, h],
  ];
  for (const [y, z] of corners) g.add(strut(new THREE.Vector3(-len / 2, y, z), new THREE.Vector3(len / 2, y, z), s * 0.05, mat));
  for (let i = 0; i <= bays; i++) {
    const x = -len / 2 + (i / bays) * len;
    for (let c = 0; c < 4; c++) {
      const [y1, z1] = corners[c];
      const [y2, z2] = corners[(c + 1) % 4];
      g.add(strut(new THREE.Vector3(x, y1, z1), new THREE.Vector3(x, y2, z2), s * 0.03, mat));
      if (i < bays) {
        const x2 = -len / 2 + ((i + 1) / bays) * len;
        g.add(strut(new THREE.Vector3(x, y1, z1), new THREE.Vector3(x2, y2, z2), s * 0.025, mat));
      }
    }
  }
  return g;
}

function group(...children: THREE.Object3D[]) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ─────────────────────────────────── models ───────────────────────────────────

function iss(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Omit<Part, 'object'> & { object: THREE.Object3D }) => {
    root.add(p.object);
    parts.push(p);
  };

  add({ id: 'truss', label: 'Integrated Truss Structure', detail: 'The ~109 m backbone — carries power, cooling loops and the rails the robotic arm rides on.', object: truss(100, 4.5, 20), anchor: v(30, 2.5, 0), explode: v(0, 6, 0) });

  // Eight solar array wings: two per corner module, fore and aft.
  const wings = new THREE.Group();
  for (const x of [-50, -36, 36, 50]) {
    for (const side of [1, -1]) {
      const mast = cyl(0.25, 34, M.grey(), 'z', [x, 0, side * 19]);
      const a = solarPanel(4.6, 33, 1.2);
      a.position.set(x - 2.8, 0, side * 19);
      const b = solarPanel(4.6, 33, 1.2);
      b.position.set(x + 2.8, 0, side * 19);
      wings.add(mast, a, b);
    }
    wings.add(box(3, 3, 3, M.grey(), [x, 0, 0]));
  }
  add({ id: 'arrays', label: 'Solar Array Wings', detail: 'Eight 35 m wings, since 2021 supplemented by roll-out iROSA arrays, turn to track the Sun and power the whole station.', object: wings, anchor: v(50, 0, 30), explode: v(0, 0, 0) });

  const rad = new THREE.Group();
  for (const x of [-16, -10, 10, 16]) {
    const p = box(4.5, 0.15, 13, M.white(), [x, -9, 0]);
    p.rotation.x = Math.PI / 2;
    rad.add(p, cyl(0.2, 7, M.grey(), 'y', [x, -3, 0]));
  }
  add({ id: 'radiators', label: 'Heat-rejection radiators', detail: 'Ammonia loops carry waste heat out to these white panels, which radiate it to space.', object: rad, anchor: v(16, -12, 0), explode: v(0, -8, 0) });

  const modR = 2.1;
  const dest = cyl(modR, 8.5, M.white(), 'z', [0, -4, 5]);
  add({ id: 'destiny', label: 'Destiny (US lab)', detail: 'NASA’s primary research laboratory, attached in 2001.', object: dest, anchor: v(0, 2.2, 0), explode: v(0, -3, 4) });
  const harmony = group(cyl(modR, 7.2, M.white(), 'z', [0, -4, 13]), mesh(new THREE.SphereGeometry(1.2, 16, 12), M.grey(), [0, -4, 17]));
  add({ id: 'harmony', label: 'Harmony (Node 2)', detail: 'Connecting hub for the European and Japanese labs and visiting crew vehicles.', object: harmony, anchor: v(0, -1.8, 13), explode: v(0, -2, 10) });
  const columbus = cyl(modR * 1.05, 7, M.white(), 'x', [-5.6, -4, 13]);
  add({ id: 'columbus', label: 'Columbus (ESA)', detail: 'Europe’s science laboratory, attached in 2008.', object: columbus, anchor: v(0, 2.2, 0), explode: v(-8, 0, 3) });
  const kibo = group(cyl(modR * 1.1, 11, M.white(), 'x', [7.6, -4, 13]), box(5, 0.6, 5, M.grey(), [15.5, -4, 13]), cyl(1.3, 4, M.white(), 'y', [5, -0.5, 13]));
  add({ id: 'kibo', label: 'Kibo (JAXA)', detail: 'Japan’s largest module, with an exposed platform for experiments left outside.', object: kibo, anchor: v(12, -1.5, 13), explode: v(9, 0, 3) });
  const russian = group(
    cyl(modR, 5.5, M.white(), 'z', [0, -4, -2.5]),
    cyl(modR * 0.98, 12.6, M.white(), 'z', [0, -4, -12]),
    cyl(modR * 1.05, 13, M.white(), 'z', [0, -4, -25]),
    solarPanel(10, 2.4, 1).translateX(-7.5).translateY(-4).translateZ(-27),
    solarPanel(10, 2.4, 1).translateX(7.5).translateY(-4).translateZ(-27),
  );
  add({ id: 'zvezda', label: 'Zvezda & Zarya (Russian segment)', detail: 'Zarya (1998) was the first module launched; Zvezda (2000) provides life support, crew quarters and propulsion.', object: russian, anchor: v(0, -1.8, -25), explode: v(0, -2, -10) });

  const armMat = M.white();
  const p0 = v(-3, 2.5, 3);
  const p1 = v(-3, 9, 9);
  const p2 = v(3, 13, 15);
  const arm = group(strut(p0, p1, 0.2, armMat), strut(p1, p2, 0.2, armMat), mesh(new THREE.SphereGeometry(0.45, 12, 8), M.grey(), [p1.x, p1.y, p1.z]), mesh(new THREE.SphereGeometry(0.45, 12, 8), M.glow(accent), [p2.x, p2.y, p2.z]));
  add({ id: 'arm', label: 'Canadarm2', detail: 'A 17.6 m robotic arm from the Canadian Space Agency that catches cargo ships and moves spacewalkers.', object: arm, anchor: p2.clone(), explode: v(0, 8, 0) });

  return { root, parts, title: 'International Space Station', summary: 'Crewed orbiting laboratory run by NASA, Roscosmos, ESA, JAXA and CSA.' };
}

function tiangong(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const r = 2.1;
  const core = group(cyl(r, 11, M.white(), 'z', [0, 0, -3]), cyl(r * 0.7, 5, M.white(), 'z', [0, 0, 5]), cyl(r * 1.05, 3, M.grey(), 'z', [0, 0, -10]));
  add({ id: 'tianhe', label: 'Tianhe core module', detail: 'Launched April 2021: living quarters, life support and the station’s main control.', object: core, anchor: v(0, r + 0.2, -3), explode: v(0, 0, -6) });
  const node = mesh(new THREE.SphereGeometry(1.7, 20, 14), M.grey(), [0, 0, 8.5]);
  add({ id: 'node', label: 'Docking hub', detail: 'Spherical node with ports for the lab modules and visiting Shenzhou / Tianzhou craft.', object: node, anchor: v(0, 1.8, 0), explode: v(0, 0, 4) });
  for (const [side, id, name, yr] of [
    [1, 'wentian', 'Wentian lab', 'July 2022'],
    [-1, 'mengtian', 'Mengtian lab', 'October 2022'],
  ] as const) {
    const lab = group(cyl(r, 17.9, M.white(), 'x', [side * 11, 0, 8.5]));
    add({ id, label: `${name} module`, detail: `Science module added in ${yr}; carries its own large solar wings.`, object: lab, anchor: v(side * 11, r + 0.2, 8.5), explode: v(side * 6, 0, 0) });
    const wings = group(
      solarPanel(4.2, 27, 1.2).translateX(side * 20).translateZ(8.5 + 15),
      solarPanel(4.2, 27, 1.2).translateX(side * 20).translateZ(8.5 - 15),
      cyl(0.25, 34, M.grey(), 'z', [side * 20, 0, 8.5]),
    );
    add({ id: `${id}-arrays`, label: 'Flexible solar wings', detail: 'Large flexible wings that swivel to follow the Sun.', object: wings, anchor: v(side * 20, 0, 22), explode: v(side * 6, 0, 0) });
  }
  const acc = mesh(new THREE.SphereGeometry(0.4, 10, 8), M.glow(accent), [0, 2.4, 0]);
  root.add(acc);
  return { root, parts, title: 'Tiangong space station', summary: 'China’s three-module crewed station operated by the China Manned Space Agency.' };
}

function starlink(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const bus = box(4.1, 0.35, 2.7, M.silverFoil());
  add({ id: 'bus', label: 'Flat-panel bus', detail: 'Thin chassis designed to stack dozens of satellites inside one Falcon 9 fairing.', object: bus, anchor: v(-1.5, 0.2, 0.8), explode: v(0, 0, 0) });
  const arrays = group(
    solarPanel(12.5, 2.6, 0.8).translateX(8.6).translateY(0.6),
    solarPanel(12.5, 2.6, 0.8).translateX(-8.6).translateY(0.6),
    cyl(0.06, 4.6, M.grey(), 'x', [0, 0.45, 0]),
  );
  add({ id: 'arrays', label: 'Solar arrays', detail: 'V2 Mini satellites carry two large wings (earlier v1.x craft had a single wing) that follow the Sun.', object: arrays, anchor: v(12, 0.7, 0), explode: v(0, 2, 0) });
  const pa = new THREE.Group();
  for (const [x, z] of [
    [-1.2, -0.7],
    [1.2, -0.7],
    [-1.2, 0.7],
    [1.2, 0.7],
  ])
    pa.add(box(1.6, 0.08, 1.1, M.dark(), [x, -0.22, z]));
  add({ id: 'phased', label: 'Phased-array antennas', detail: 'Electronically steered Ku/Ka-band beams to user terminals and gateways — no moving dish.', object: pa, anchor: v(1.2, -0.3, 0.7), explode: v(0, -1.6, 0) });
  const lasers = group(cyl(0.16, 0.3, M.grey(), 'y', [1.8, 0.35, 1.2]), cyl(0.16, 0.3, M.grey(), 'y', [-1.8, 0.35, 1.2]), cyl(0.16, 0.3, M.grey(), 'y', [0, 0.35, -1.2]));
  for (const l of lasers.children) l.add(mesh(new THREE.CircleGeometry(0.1, 16), M.glow(accent), [0, 0.16, 0], [-Math.PI / 2, 0, 0]));
  add({ id: 'lasers', label: 'Laser links', detail: 'Optical inter-satellite links relay traffic between satellites, so data can cross oceans without a ground station.', object: lasers, anchor: v(1.8, 0.55, 1.2), explode: v(0, 1.2, 0) });
  const thr = group(cyl(0.12, 0.35, M.dark(), 'z', [0, 0, -1.5], 16, 0.18), mesh(new THREE.CircleGeometry(0.1, 16), M.glow('#7fb8ff'), [0, 0, -1.68], [0, Math.PI, 0]));
  add({ id: 'thruster', label: 'Hall-effect thruster', detail: 'Electric propulsion (argon on V2 Mini) for orbit raising, collision avoidance and controlled de-orbit.', object: thr, anchor: v(0, 0, -1.7), explode: v(0, 0, -1.2) });
  const st = group(box(0.18, 0.18, 0.25, M.dark(), [-1.9, 0.3, -1.1]), box(0.18, 0.18, 0.25, M.dark(), [-1.6, 0.3, -1.1]));
  add({ id: 'startrackers', label: 'Star trackers', detail: 'Cameras that recognise star patterns to know exactly which way the satellite is pointing.', object: st, anchor: v(-1.75, 0.45, -1.1), explode: v(-0.5, 1, 0) });
  return { root, parts, title: 'Starlink satellite', summary: 'SpaceX broadband satellite (V2 Mini-style layout).' };
}

function gnss(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const bus = box(2.2, 2.2, 2, M.foil());
  add({ id: 'bus', label: 'Bus & atomic clocks', detail: 'Inside: rubidium, caesium or hydrogen-maser clocks that keep time to a few billionths of a second — the heart of positioning.', object: bus, anchor: v(0, 1.2, 1), explode: v(0, 0, 0) });
  const wings = new THREE.Group();
  for (const s of [1, -1]) {
    wings.add(cyl(0.06, 1.6, M.grey(), 'x', [s * 1.9, 0, 0]));
    for (let i = 0; i < 3; i++) wings.add(solarPanel(2.4, 1.9, 0.6).translateX(s * (3.9 + i * 2.5)));
  }
  add({ id: 'arrays', label: 'Solar wings', detail: 'Rotate once per orbit to keep facing the Sun while the body keeps its antennas on Earth.', object: wings, anchor: v(8, 0.1, 0), explode: v(0, 0, 0) });
  const ant = new THREE.Group();
  ant.add(cyl(0.95, 0.08, M.white(), 'y', [0, -1.15, 0], 32));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const h = helix(0.07, 0.45, 5, 0.012, M.grey());
    h.position.set(Math.cos(a) * 0.7, -1.2, Math.sin(a) * 0.7);
    ant.add(h);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const h = helix(0.07, 0.45, 5, 0.012, M.grey());
    h.position.set(Math.cos(a) * 0.3, -1.2, Math.sin(a) * 0.3);
    ant.add(h);
  }
  add({ id: 'nav', label: 'Navigation antenna array', detail: 'Helical elements broadcast the L-band ranging signals your phone’s receiver times to find its position.', object: ant, anchor: v(0.7, -1.6, 0), explode: v(0, -1.5, 0) });
  const lra = new THREE.Group();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) lra.add(box(0.07, 0.04, 0.07, M.silverFoil(), [0.75 + i * 0.09, -1.12, -0.75 + j * 0.09]));
  add({ id: 'lra', label: 'Laser retro-reflector', detail: 'Corner-cube array that bounces ground-station lasers back, used to check the orbit to centimetres.', object: lra, anchor: v(0.9, -1.2, -0.62), explode: v(0.5, -1, -0.5) });
  const ttc = group(cyl(0.05, 0.6, M.grey(), 'y', [0.6, 1.4, 0.6]), mesh(new THREE.SphereGeometry(0.1, 10, 8), M.glow(accent), [0.6, 1.75, 0.6]));
  add({ id: 'ttc', label: 'TT&C antenna', detail: 'Telemetry, tracking & command link used by ground control to upload clock and orbit corrections.', object: ttc, anchor: v(0.6, 1.8, 0.6), explode: v(0, 1.2, 0) });
  return { root, parts, title: 'Navigation satellite', summary: 'GNSS spacecraft in medium Earth orbit, broadcasting precise time and orbit data.' };
}

function eo(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const bus = box(2.4, 2.2, 3.4, M.foil());
  add({ id: 'bus', label: 'Service module', detail: 'Power, attitude control, data storage and propulsion for the mission.', object: bus, anchor: v(-1.2, 1.1, 1), explode: v(0, 0, 0) });
  const wing = group(cyl(0.05, 1.8, M.grey(), 'x', [2.1, 0.6, 0]));
  for (let i = 0; i < 3; i++) wing.add(solarPanel(2.2, 3.2, 0.55).translateX(4.2 + i * 2.3).translateY(0.6));
  wing.rotation.x = 0.35;
  add({ id: 'array', label: 'Solar array', detail: 'A single sun-tracking wing — typical for sun-synchronous imaging satellites.', object: wing, anchor: v(7.5, 0.6, 0), explode: v(1.5, 0, 0) });
  const inst = group(
    box(1.8, 1.2, 1.9, M.silverFoil(), [-0.2, -1.7, 0.4]),
    cyl(0.42, 0.9, M.dark(), 'y', [-0.5, -2.6, 0.9], 24),
    mesh(new THREE.CircleGeometry(0.34, 24), M.black(), [-0.5, -3.06, 0.9], [Math.PI / 2, 0, 0]),
    box(0.6, 0.3, 1.5, M.black(), [0.5, -2.35, 0.2]),
  );
  add({ id: 'instrument', label: 'Imaging instrument', detail: 'The payload looks straight down (nadir); multispectral bands see vegetation, water and heat invisible to the eye.', object: inst, anchor: v(-0.5, -3.1, 0.9), explode: v(0, -2, 0) });
  const xb = group(cyl(0.06, 0.5, M.grey(), 'y', [0.8, -1.35, -1.3]), dish(0.3, 0.12, M.white()).translateX(0.8).translateY(-1.8).translateZ(-1.3));
  (xb.children[1] as THREE.Mesh).rotation.x = Math.PI;
  add({ id: 'xband', label: 'X-band downlink', detail: 'Steerable antenna that dumps imagery to ground stations at hundreds of megabits per second.', object: xb, anchor: v(0.8, -1.95, -1.3), explode: v(0.6, -1.2, -0.6) });
  const st = group(...[-0.6, 0, 0.6].map((x) => cyl(0.12, 0.35, M.dark(), 'y', [x, 1.3, -1.4], 12, 0.08)));
  add({ id: 'startrackers', label: 'Star trackers', detail: 'Keep pointing accurate to arc-seconds so pixels land on the right spot on the ground.', object: st, anchor: v(0, 1.55, -1.4), explode: v(0, 1, -0.5) });
  const gps = group(box(0.3, 0.05, 0.3, M.white(), [0.7, 1.13, 1.2]), mesh(new THREE.SphereGeometry(0.05, 8, 6), M.glow(accent), [0.7, 1.18, 1.2]));
  add({ id: 'gnss', label: 'GNSS receiver antenna', detail: 'Uses GPS/Galileo signals for precise orbit determination and time-tagging every image.', object: gps, anchor: v(0.7, 1.2, 1.2), explode: v(0, 0.8, 0.4) });
  return { root, parts, title: 'Earth-observation satellite', summary: 'Sun-synchronous imager (layout inspired by Landsat / Sentinel-class spacecraft).' };
}

function hubble(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const tube = group(cyl(2.1, 8, M.silverFoil(), 'z', [0, 0, 1.5], 32), cyl(2.1, 0.2, M.dark(), 'z', [0, 0, 5.5], 32));
  add({ id: 'ota', label: 'Optical telescope assembly', detail: 'Houses the 2.4 m primary mirror. Corrective optics fitted by astronauts in 1993 fixed its famous focusing flaw.', object: tube, anchor: v(0, 2.2, 2), explode: v(0, 0, 0) });
  const door = mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.1, 32), M.silverFoil());
  const hinge = new THREE.Group();
  hinge.position.set(0, 2.1, 5.6);
  door.position.set(0, 0, 2.05);
  door.rotation.x = Math.PI / 2;
  hinge.add(door);
  hinge.rotation.x = -1.2;
  add({ id: 'door', label: 'Aperture door', detail: 'Can swing shut to protect the optics if the telescope ever points too close to the Sun.', object: hinge, anchor: v(0, 0, 2.05), explode: v(0, 1, 1) });
  const aft = group(cyl(2.25, 4.6, M.silverFoil(), 'z', [0, 0, -4.8], 32), cyl(2.25, 0.2, M.dark(), 'z', [0, 0, -7.1], 32));
  add({ id: 'aft', label: 'Aft shroud (instruments)', detail: 'Holds the science instruments — including WFC3, ACS, COS and STIS — swapped by astronauts on five servicing missions.', object: aft, anchor: v(0, 2.4, -5), explode: v(0, 0, -3) });
  const arrays = new THREE.Group();
  for (const s of [1, -1]) {
    arrays.add(cyl(0.08, 2.2, M.grey(), 'x', [s * 3.2, 0, -1.5]));
    const p = solarPanel(2.6, 7.1, 0.7);
    p.position.set(s * 5.4, 0, -1.5);
    p.rotation.z = Math.PI / 2;
    arrays.add(p);
  }
  add({ id: 'arrays', label: 'Solar arrays', detail: 'Rigid arrays installed in 2002 (Servicing Mission 3B).', object: arrays, anchor: v(5.4, 1.5, -1.5), explode: v(0, 0, 0) });
  const hga = new THREE.Group();
  for (const s of [1, -1]) {
    hga.add(cyl(0.05, 4.2, M.grey(), 'y', [0, s * 4, -2]));
    const d = dish(0.7, 0.25, M.white());
    d.position.set(0, s * 6.1, -2);
    if (s < 0) d.rotation.x = Math.PI;
    hga.add(d);
  }
  hga.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.glow(accent), [0, 6.2, -2]));
  add({ id: 'hga', label: 'High-gain antennas', detail: 'Relay science data through NASA’s TDRS satellites in geostationary orbit.', object: hga, anchor: v(0, 6.3, -2), explode: v(0, 0, 0) });
  return { root, parts, title: 'Hubble Space Telescope', summary: 'NASA/ESA observatory launched in 1990 aboard Space Shuttle Discovery (STS-31).' };
}

function geo(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const bus = box(3, 3.4, 4, M.foil());
  add({ id: 'bus', label: 'Spacecraft bus', detail: 'Box-shaped platform with power electronics, batteries and thermal control; payload transponders line its walls.', object: bus, anchor: v(-1.5, 1.7, 1.5), explode: v(0, 0, 0) });
  const wings = new THREE.Group();
  for (const s of [1, -1]) {
    wings.add(cyl(0.07, 3, M.grey(), 'x', [s * 3, 0, 0]));
    for (let i = 0; i < 4; i++) wings.add(solarPanel(3.4, 2.4, 0.6).translateX(s * (6.2 + i * 3.5)));
  }
  add({ id: 'arrays', label: 'North–south solar wings', detail: 'Stretch perpendicular to the orbit and rotate once a day to face the Sun.', object: wings, anchor: v(15, 0.1, 0), explode: v(0, 0, 0) });
  const refl = new THREE.Group();
  for (const s of [1, -1]) {
    const d = dish(1.4, 0.45, M.white());
    // Open outward (±Z) and tilted down toward Earth.
    d.rotation.x = s * (Math.PI / 2 + 0.35);
    d.position.set(0, -0.6, s * 2.9);
    refl.add(d, cyl(0.12, 0.8, M.grey(), 'y', [0, -1.9, s * 1.6]));
  }
  add({ id: 'reflectors', label: 'Deployable reflectors', detail: 'Shape beams onto a country or region from 35,786 km up; feed horns below illuminate them.', object: refl, anchor: v(0, -0.6, 3.5), explode: v(0, 0, 1.5) });
  const earth = group(dish(0.5, 0.18, M.white()).translateY(-1.95).rotateX(Math.PI), cyl(0.2, 0.5, M.grey(), 'y', [1, -1.9, -1]), mesh(new THREE.SphereGeometry(0.08, 8, 6), M.glow(accent), [1, -2.2, -1]));
  add({ id: 'earthdeck', label: 'Earth deck antennas', detail: 'Tracking and spot-beam antennas pointing permanently at the same patch of Earth.', object: earth, anchor: v(0, -2.2, 0), explode: v(0, -1.5, 0) });
  const thr = group(cyl(0.25, 0.6, M.dark(), 'y', [0, 2, 0], 16, 0.4));
  add({ id: 'engine', label: 'Apogee / station-keeping thrusters', detail: 'Circularise the orbit after launch and nudge the satellite back into its assigned slot.', object: thr, anchor: v(0, 2.4, 0), explode: v(0, 1.5, 0) });
  return { root, parts, title: 'Geostationary satellite', summary: 'Parked 35,786 km above the equator, it appears fixed in the sky from the ground.' };
}

function cubesat(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  const body = group(box(0.1, 0.1, 0.34, M.solar(1, 3)));
  for (const x of [-0.05, 0.05]) for (const y of [-0.05, 0.05]) body.add(box(0.008, 0.008, 0.34, M.grey(), [x, y, 0]));
  add({ id: 'body', label: '3U structure', detail: 'Three 10 cm cubes stacked — a standardised size that rides into orbit as a secondary payload.', object: body, anchor: v(0.05, 0.05, 0.1), explode: v(0, 0, 0) });
  const panels = group(solarPanel(0.1, 0.33, 0.05).translateX(0.105).translateY(0.05), solarPanel(0.1, 0.33, 0.05).translateX(-0.105).translateY(0.05));
  add({ id: 'panels', label: 'Deployable solar panels', detail: 'Unfold after deployment to multiply the power available to the tiny spacecraft.', object: panels, anchor: v(0.15, 0.06, 0.1), explode: v(0, 0.08, 0) });
  const ant = group(strut(v(0.05, -0.05, 0.17), v(0.3, -0.05, 0.17), 0.002, M.grey()), strut(v(-0.05, -0.05, 0.17), v(-0.05, -0.3, 0.17), 0.002, M.grey()));
  add({ id: 'antennas', label: 'UHF / VHF antennas', detail: 'Tape-spring antennas for telemetry and commands with university ground stations.', object: ant, anchor: v(0.28, -0.05, 0.17), explode: v(0.04, -0.04, 0.04) });
  const cam = group(cyl(0.025, 0.03, M.dark(), 'y', [0, -0.065, -0.1]), mesh(new THREE.CircleGeometry(0.018, 16), M.glow(accent), [0, -0.081, -0.1], [Math.PI / 2, 0, 0]));
  add({ id: 'payload', label: 'Payload', detail: 'Camera, sensor or technology demonstrator — the reason the mission exists.', object: cam, anchor: v(0, -0.085, -0.1), explode: v(0, -0.05, 0) });
  return { root, parts, title: 'Small satellite / CubeSat', summary: 'Compact spacecraft built from standard units — the workhorse of universities and start-ups.' };
}

function generic(accent: string): BuiltModel {
  const root = new THREE.Group();
  const parts: Part[] = [];
  const add = (p: Part) => (root.add(p.object), parts.push(p));
  add({ id: 'bus', label: 'Spacecraft bus', detail: 'Structure, power, attitude control and computers that keep the payload alive.', object: box(1.8, 1.6, 2, M.foil()), anchor: v(-0.9, 0.8, 1), explode: v(0, 0, 0) });
  const wings = new THREE.Group();
  for (const s of [1, -1]) {
    wings.add(cyl(0.04, 1, M.grey(), 'x', [s * 1.4, 0, 0]));
    wings.add(solarPanel(3.2, 1.6, 0.5).translateX(s * 3.5));
  }
  add({ id: 'arrays', label: 'Solar arrays', detail: 'Convert sunlight into electrical power; batteries carry the craft through eclipse.', object: wings, anchor: v(4.5, 0.1, 0), explode: v(0, 0, 0) });
  const d = dish(0.55, 0.2, M.white());
  d.rotation.x = Math.PI;
  d.position.set(0, -1.1, 0);
  add({ id: 'antenna', label: 'Communications antenna', detail: 'Sends data home and receives commands.', object: group(d, cyl(0.05, 0.4, M.grey(), 'y', [0, -0.9, 0])), anchor: v(0, -1.3, 0), explode: v(0, -1, 0) });
  add({ id: 'payload', label: 'Payload', detail: 'The instrument or transponder that defines the mission.', object: group(box(0.8, 0.5, 0.8, M.silverFoil(), [0.2, 1.05, 0.3]), mesh(new THREE.SphereGeometry(0.06, 8, 6), M.glow(accent), [0.2, 1.35, 0.3])), anchor: v(0.2, 1.4, 0.3), explode: v(0, 1, 0) });
  return { root, parts, title: 'Satellite', summary: 'General-purpose spacecraft layout.' };
}

const BUILDERS: Record<ModelKind, (accent: string) => BuiltModel> = { iss, station: tiangong, starlink, gnss, eo, hubble, geo, cubesat, generic };

export function buildModel(kind: ModelKind, accent: string): BuiltModel {
  const m = BUILDERS[kind](accent);
  m.root.name = kind;
  for (const p of m.parts) {
    p.object.name = p.id;
    p.object.userData.basePosition = p.object.position.clone();
  }
  return m;
}
