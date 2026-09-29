// The sun-garden: a glowing 3D sun in space with a glass greenhouse on top.
// Six sunflowers (3 "win the day" + 3 secondary) grow inside; they bloom as tasks get done.
import * as THREE from "../vendor/three.module.min.js";

const R = 10; // sun radius
const DOME = 4.3; // greenhouse radius

const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

function glowTexture(stops) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function seedTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const bg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  bg.addColorStop(0, "#3a2210"); bg.addColorStop(1, "#5b3a1a");
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 420; i++) {
    const r = 4.6 * Math.sqrt(i), a = i * golden;
    const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
    if (Math.hypot(x - 128, y - 128) > 122) break;
    g.fillStyle = i % 3 ? "#8a5a22" : "#c99542";
    g.beginPath(); g.arc(x, y, 2.4 + i * 0.004, 0, 7); g.fill();
  }
  return new THREE.CanvasTexture(c);
}

const SUN_VERT = `varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `;
const SUN_FRAG = `precision highp float; varying vec3 vP; varying vec3 vN; uniform float uT; uniform float uE;
  float h(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5;} return s; }
  void main(){
    vec3 p=normalize(vP)*2.4;
    float t=uT*.06;
    float c=fbm(p+vec3(t,-t*.7,t*.4));
    float g=fbm(p*3.0-vec3(t*2.0,0.,t));
    float spots=smoothstep(.62,.8,fbm(p*.9+7.0+t*.3));
    vec3 deep=vec3(.86,.28,.03), mid=vec3(1.,.55,.08), hot=vec3(1.,.86,.36);
    vec3 col=mix(deep,mid,smoothstep(.25,.65,c)); col=mix(col,hot,smoothstep(.5,.85,g)*.7);
    col*=1.0-spots*.35;
    float rim=pow(1.0-max(dot(normalize(vN),vec3(0,0,1)),0.),2.2);
    col+=vec3(1.,.55,.15)*rim*.55;
    gl_FragColor=vec4(col*(0.85+uE*.35),1.);
  }`;

/* ───────── sunflower ───────── */
function petalGeometry(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(wid, len * 0.25, wid * 0.9, len * 0.8, 0, len);
  s.bezierCurveTo(-wid * 0.9, len * 0.8, -wid, len * 0.25, 0, 0);
  const g = new THREE.ShapeGeometry(s, 8);
  const pos = g.attributes.position, col = [];
  const a = new THREE.Color("#f08a00"), b = new THREE.Color("#ffd23a");
  for (let i = 0; i < pos.count; i++) { const c = a.clone().lerp(b, pos.getY(i) / len); col.push(c.r, c.g, c.b); }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const PETAL_G = petalGeometry(0.72, 0.17);
const PETAL_M = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, emissive: "#803300", emissiveIntensity: 0.05 });
const LEAF_G = (() => {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.35, 0.15, 0.4, 0.55, 0, 0.9); s.bezierCurveTo(-0.4, 0.55, -0.35, 0.15, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
})();
const LEAF_M = new THREE.MeshStandardMaterial({ color: "#3fa34d", side: THREE.DoubleSide, roughness: 0.7, emissive: "#0c3d1a", emissiveIntensity: 0.3 });
const STEM_M = new THREE.MeshStandardMaterial({ color: "#3d9a4a", roughness: 0.7, emissive: "#0c3d1a", emissiveIntensity: 0.25 });

function makeFlower(primary) {
  const g = new THREE.Group();
  const h = primary ? 2.9 : 2.0;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, h * 0.4, 0.05), new THREE.Vector3(-0.05, h * 0.75, 0.12), new THREE.Vector3(0, h, 0.2)]);
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, primary ? 0.075 : 0.055, 8), STEM_M);
  g.add(stem);
  [0.28, 0.5].forEach((t, i) => {
    const leaf = new THREE.Mesh(LEAF_G, LEAF_M);
    const p = curve.getPoint(t); leaf.position.copy(p);
    leaf.rotation.set(-0.5, i ? -1.3 : 1.3, i ? -1.0 : 1.0);
    leaf.scale.setScalar(primary ? 0.85 : 0.6);
    g.add(leaf);
  });
  const head = new THREE.Group();
  head.position.copy(curve.getPoint(1));
  head.rotation.x = -0.35;
  const sepal = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshStandardMaterial({ color: "#3d8f3f", side: THREE.DoubleSide }));
  sepal.position.z = -0.05; head.add(sepal);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 32), [
    new THREE.MeshStandardMaterial({ color: "#4a2c12", roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ map: seedTexture(), roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: "#3a2410" }),
  ]);
  disk.rotation.x = Math.PI / 2; disk.position.z = 0.02; head.add(disk);
  const petals = [];
  const N = 18;
  for (let ring = 0; ring < 2; ring++) {
    for (let i = 0; i < N; i++) {
      const pivot = new THREE.Object3D();
      pivot.rotation.z = ((i + ring * 0.5) / N) * Math.PI * 2;
      const arm = new THREE.Object3D(); pivot.add(arm);
      const m = new THREE.Mesh(PETAL_G, PETAL_M);
      m.position.y = 0.3; m.scale.setScalar(ring ? 0.92 : 1.05);
      arm.add(m);
      arm.position.z = ring ? -0.02 : 0;
      head.add(pivot); petals.push({ arm, ring, jitter: rnd(-0.06, 0.06) });
    }
  }
  g.add(head);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(head.position);
  g.add(hit);
  g.userData = { head, petals, hit, open: 0, target: 0, primary, phase: Math.random() * 6, top: head.position.clone() };
  return g;
}

function setOpen(f, o) {
  const { head, petals, primary } = f.userData;
  const angle = lerp(1.35, -0.08, o); // +x rotation folds petals toward the face (bud); ~0 is fully open
  petals.forEach((p) => { p.arm.rotation.x = angle + p.jitter * o + (p.ring ? 0.1 * o : 0); });
  head.scale.setScalar(lerp(primary ? 0.9 : 0.75, primary ? 1.3 : 1.05, o));
}

/* ───────── scene ───────── */
export function createScene(container, { onSelect } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const labels = document.createElement("div"); labels.className = "flower-labels"; container.appendChild(labels);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#070512");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);

  // stars
  const starGeo = new THREE.BufferGeometry();
  const sp = [], sc = [];
  for (let i = 0; i < 3200; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(120, 220));
    sp.push(v.x, v.y, v.z);
    const c = new THREE.Color().setHSL(rnd(0.55, 0.15) % 1, rnd(0, 0.5), rnd(0.6, 1));
    sc.push(c.r, c.g, c.b);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  starGeo.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9 }));
  scene.add(stars);
  // soft nebulae
  [["#5b2bd6", -70, 30, -120, 90], ["#c2358a", 90, -20, -140, 80], ["#2a6fd6", 20, 60, -160, 100]].forEach(([col, x, y, z, s]) => {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, col + "aa"], [0.5, col + "33"], [1, col + "00"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    spr.position.set(x, y, z); spr.scale.setScalar(s * 2); scene.add(spr);
  });

  // sun
  const sunMat = new THREE.ShaderMaterial({ vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, uniforms: { uT: { value: 0 }, uE: { value: 0 } } });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), sunMat);
  sun.position.y = 0;
  scene.add(sun);
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0.3, "#ffb03aff"], [0.42, "#ff8a1a99"], [0.7, "#ff5a0a22"], [1, "#ff5a0a00"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  corona.scale.setScalar(R * 3.4); scene.add(corona);
  const corona2 = corona.clone(); corona2.material = corona.material.clone(); corona2.material.opacity = 0.5; corona2.scale.setScalar(R * 5.5); scene.add(corona2);

  // garden bed + greenhouse
  const garden = new THREE.Group(); garden.position.y = R + 0.2; scene.add(garden); // sits just above the sun's apex so it never pokes through the soil
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(DOME + 0.35, DOME + 1.7, 4.2, 64, 1, true), new THREE.MeshStandardMaterial({ color: "#8a6a45", roughness: 0.75, metalness: 0.15, emissive: "#3a1c05", emissiveIntensity: 0.6, side: THREE.DoubleSide }));
  bed.position.y = -2.0; garden.add(bed);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(DOME + 0.3, 64), new THREE.MeshLambertMaterial({ color: "#5a3a22" }));
  soil.rotation.x = -Math.PI / 2; soil.position.y = 0.01; garden.add(soil);
  const grass = new THREE.Mesh(new THREE.RingGeometry(DOME - 0.35, DOME + 0.3, 64), new THREE.MeshStandardMaterial({ color: "#3f8f45", roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = 0.02; garden.add(grass);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DOME, 0.06, 10, 96), new THREE.MeshStandardMaterial({ color: "#e9e4ff", metalness: 0.6, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; garden.add(rim);
  const domeGeo = new THREE.SphereGeometry(DOME, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const glass = new THREE.Mesh(domeGeo, new THREE.MeshPhysicalMaterial({ color: "#cfd8ff", transparent: true, opacity: 0.09, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 }));
  garden.add(glass);
  const frame = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(DOME + 0.01, 3).clone()), new THREE.LineBasicMaterial({ color: "#d9d2ff", transparent: true, opacity: 0.32 }));
  // keep only the upper hemisphere of the geodesic frame
  const fp = frame.geometry.attributes.position, keep = [];
  for (let i = 0; i < fp.count; i += 2) {
    if (fp.getY(i) >= -0.001 && fp.getY(i + 1) >= -0.001) keep.push(fp.getX(i), fp.getY(i), fp.getZ(i), fp.getX(i + 1), fp.getY(i + 1), fp.getZ(i + 1));
  }
  frame.geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
  garden.add(frame);

  // lighting
  scene.add(new THREE.HemisphereLight("#ffe2b0", "#5a2a0a", 0.75));
  const sunLight = new THREE.PointLight("#ffb85a", 34, 40, 1.8); sunLight.position.set(0, R + 3.6, 1.5); scene.add(sunLight);
  const fill = new THREE.DirectionalLight("#a99cff", 0.7); fill.position.set(-6, 6, 10); scene.add(fill);

  // flowers: 3 primaries in an inner triangle, 3 secondaries on the outer ring
  const flowers = [];
  const slots = [];
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; slots.push({ x: Math.cos(a) * 1.55, z: Math.sin(a) * 1.55 * 0.9, primary: true }); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.PI / 2 + Math.PI / 3; slots.push({ x: Math.cos(a) * 3.05, z: Math.sin(a) * 3.05 * 0.95, primary: false }); }
  slots.forEach((s, i) => {
    const f = makeFlower(s.primary);
    f.position.set(s.x, 0, s.z);
    f.rotation.y = -Math.atan2(s.x, s.z) * 0.15;
    f.userData.index = i;
    f.hit_ = f.userData.hit;
    garden.add(f); flowers.push(f);
    setOpen(f, 0);
    const el = document.createElement("button"); el.className = "flower-label"; el.type = "button";
    el.addEventListener("click", () => onSelect && onSelect(i));
    labels.appendChild(el); f.userData.label = el;
    // sprout ring for empty slot
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 40), new THREE.MeshBasicMaterial({ color: "#ffe28a", transparent: true, opacity: 0, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, 0.05, s.z); garden.add(ring); f.userData.ring = ring;
  });

  // routine seedlings around the rim
  const seedlings = new THREE.Group(); garden.add(seedlings);
  function setRoutines(done, total) {
    seedlings.clear();
    const n = Math.max(0, Math.min(total, 14));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2, r = DOME - 0.75;
      const g = new THREE.Group(); g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const isDone = i < Math.round((done / Math.max(1, total)) * n);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, isDone ? 0.55 : 0.28, 6), STEM_M); st.position.y = isDone ? 0.27 : 0.14; g.add(st);
      const l = new THREE.Mesh(LEAF_G, LEAF_M); l.scale.setScalar(0.22); l.position.y = 0.15; l.rotation.set(-0.4, i, 0.3); g.add(l);
      if (isDone) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: "#ffd23a", emissive: "#ff9d00", emissiveIntensity: 0.6 })); b.position.y = 0.6; g.add(b); }
      seedlings.add(g);
    }
  }

  // pollen motes
  const motes = (() => {
    const N = 90, pos = new Float32Array(N * 3), vel = [];
    for (let i = 0; i < N; i++) { pos.set([rnd(-3, 3), rnd(0.3, 3.6), rnd(-3, 3)], i * 3); vel.push(new THREE.Vector3(rnd(-0.1, 0.1), rnd(0.02, 0.14), rnd(-0.1, 0.1))); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, color: "#ffe9a0", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    garden.add(pts); return { pts, vel, pos, N };
  })();
  const bursts = [];
  function burst(idx) {
    const f = flowers[idx]; if (!f) return;
    const N = 60, pos = new Float32Array(N * 3), vel = [];
    const c = f.userData.top.clone().add(f.position);
    for (let i = 0; i < N; i++) { pos.set([c.x, c.y, c.z], i * 3); vel.push(new THREE.Vector3().randomDirection().multiplyScalar(rnd(0.8, 2.6))); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, color: "#ffd84a", transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    garden.add(pts); bursts.push({ pts, vel, pos, t: 0 });
  }

  // camera orbit (drag = orbit, wheel = zoom)
  const cam = { az: 0.25, el: 0.36, dist: 22, target: new THREE.Vector3(0, R - 0.8, 0), tAz: 0.25, tEl: 0.36, tDist: 22 };
  let dragging = false, moved = 0, lastX = 0, lastY = 0, userTouched = false;
  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; dom.setPointerCapture(e.pointerId); });
  dom.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    cam.tAz -= dx * 0.006; cam.tEl = Math.max(0.08, Math.min(1.25, cam.tEl + dy * 0.005)); userTouched = true;
  });
  dom.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 5) pick(e);
  });
  dom.addEventListener("wheel", (e) => { e.preventDefault(); cam.tDist = Math.max(9, Math.min(46, cam.tDist + e.deltaY * 0.015)); userTouched = true; }, { passive: false });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(flowers.map((f) => f.userData.hit), false);
    if (hits.length) { const f = flowers.find((f) => f.userData.hit === hits[0].object); onSelect && onSelect(f.userData.index); }
  }
  dom.addEventListener("pointermove", (e) => {
    if (dragging) return;
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    dom.style.cursor = ray.intersectObjects(flowers.map((f) => f.userData.hit), false).length ? "pointer" : "grab";
  });

  const baseDist = () => (camera.aspect < 1 ? 22 * 1.35 : 22);
  function resize() {
    const w = container.clientWidth || 800, h = container.clientHeight || 600;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!userTouched) cam.tDist = baseDist();
  }
  new ResizeObserver(resize).observe(container); resize();

  let selected = -1, energy = 0, hover = null;
  const v = new THREE.Vector3();
  const clock = new THREE.Clock();
  let reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    sunMat.uniforms.uT.value = t; sunMat.uniforms.uE.value = lerp(sunMat.uniforms.uE.value, energy, 0.05);
    corona.scale.setScalar(R * (3.3 + sunMat.uniforms.uE.value * 0.7 + Math.sin(t * 0.8) * 0.05));
    stars.rotation.y += dt * 0.004;
    if (!userTouched && !reduce) cam.tAz = 0.25 + Math.sin(t * 0.12) * 0.22;
    cam.az = lerp(cam.az, cam.tAz, 0.08); cam.el = lerp(cam.el, cam.tEl, 0.08); cam.dist = lerp(cam.dist, cam.tDist, 0.08);
    camera.position.set(
      cam.target.x + Math.sin(cam.az) * Math.cos(cam.el) * cam.dist,
      cam.target.y + Math.sin(cam.el) * cam.dist,
      cam.target.z + Math.cos(cam.az) * Math.cos(cam.el) * cam.dist);
    camera.lookAt(cam.target);

    flowers.forEach((f, i) => {
      const u = f.userData;
      u.open = lerp(u.open, u.target, 0.06);
      setOpen(f, u.open);
      const sway = reduce ? 0 : Math.sin(t * 0.9 + u.phase) * 0.025;
      f.rotation.z = sway; f.rotation.x = Math.cos(t * 0.7 + u.phase) * 0.012;
      u.head.rotation.x = -0.35 + Math.sin(t * 0.5 + u.phase) * 0.03;
      f.visible = u.active !== false;
      u.ring.material.opacity = lerp(u.ring.material.opacity, i === selected ? 0.9 : 0, 0.15);
      u.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05 + (i === selected ? 0.25 : 0));
      // label (screen position collected, de-overlapped below)
      if (u.label) {
        v.copy(u.top); v.y += 0.85; f.localToWorld(v); v.project(camera);
        const w = container.clientWidth, h = container.clientHeight;
        u.lx = (v.x * 0.5 + 0.5) * w; u.ly = (-v.y * 0.5 + 0.5) * h; u.lvis = v.z < 1 && !!u.text;
      }
    });
    // stack overlapping labels upward so every task name stays readable
    const placed = [];
    flowers.filter((f) => f.userData.label).sort((a, b) => b.userData.ly - a.userData.ly).forEach((f) => {
      const u = f.userData, w = u.label.offsetWidth || 120;
      let y = u.ly;
      for (let k = 0; k < 8; k++) {
        const c = placed.find((p) => Math.abs(p.x - u.lx) < (p.w + w) / 2 + 4 && Math.abs(p.y - y) < 26);
        if (!c) break;
        y = c.y - 27;
      }
      placed.push({ x: u.lx, y, w });
      u.label.style.transform = `translate(-50%,-100%) translate(${u.lx}px, ${y}px)`;
      u.label.style.opacity = u.lvis ? 1 : 0;
    });
    // motes
    const { pos, vel, N } = motes;
    for (let i = 0; i < N; i++) {
      pos[i * 3] += vel[i].x * dt; pos[i * 3 + 1] += vel[i].y * dt; pos[i * 3 + 2] += vel[i].z * dt;
      if (pos[i * 3 + 1] > 3.9) { pos[i * 3 + 1] = 0.3; pos[i * 3] = rnd(-3, 3); pos[i * 3 + 2] = rnd(-3, 3); }
    }
    motes.pts.geometry.attributes.position.needsUpdate = true;
    for (let k = bursts.length - 1; k >= 0; k--) {
      const b = bursts[k]; b.t += dt;
      for (let i = 0; i < b.vel.length; i++) { b.vel[i].y -= dt * 1.2; b.pos[i * 3] += b.vel[i].x * dt; b.pos[i * 3 + 1] += b.vel[i].y * dt; b.pos[i * 3 + 2] += b.vel[i].z * dt; }
      b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = Math.max(0, 1 - b.t / 1.6);
      if (b.t > 1.6) { garden.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(k, 1); }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    /** tasks: array of 6 {text, progress 0..1, tier} (missing/empty text → bare sprout ring) */
    setFlowers(items) {
      flowers.forEach((f, i) => {
        const it = items[i], u = f.userData;
        u.text = it && it.text ? it.text : "";
        u.active = !!(it && it.text);
        u.target = it && it.text ? 0.3 + 0.7 * Math.min(1, it.progress || 0) : 0;
        if (u.label) { u.label.textContent = u.text ? `${i < 3 ? "★" + (i + 1) : "·" + (i + 1)}  ${u.text.length > 26 ? u.text.slice(0, 25) + "…" : u.text}` : ""; u.label.dataset.tier = i < 3 ? "primary" : "secondary"; u.label.dataset.done = it && it.progress >= 1 ? "1" : "0"; }
      });
    },
    setSelected(i) { selected = i; flowers.forEach((f, k) => f.userData.label?.classList.toggle("sel", k === i)); },
    setEnergy(e) { energy = e; },
    setRoutines,
    burst,
    resetCamera() { userTouched = false; cam.tEl = 0.36; cam.tDist = baseDist(); },
  };
}
