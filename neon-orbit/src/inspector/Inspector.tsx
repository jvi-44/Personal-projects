import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { engine } from '../globe/engine';
import { profileFor } from '../sat/facts';
import { useStore } from '../state/store';
import { fmt, useTicker } from '../ui/hooks';
import { buildModel, type BuiltModel } from './models';
import './inspector.css';

const HOLO_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const HOLO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uScale;
  uniform float uHi;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float scan = 0.5 + 0.5 * sin(vW.y / uScale * 60.0 - uTime * 4.0);
    float band = smoothstep(0.96, 1.0, fract(vW.y / uScale * 1.5 - uTime * 0.25));
    vec3 c = mix(uColor, vec3(1.0), uHi * 0.55);
    float a = 0.025 + f * 0.6 + band * 0.25 + uHi * 0.2;
    gl_FragColor = vec4(c * (0.45 + f * 1.1 + band), a * (0.75 + 0.25 * scan));
  }`;

interface Rig {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  model: BuiltModel;
  radius: number;
  holoMats: Map<string, THREE.ShaderMaterial>;
  solidMats: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  edges: THREE.LineSegments[];
  setHolo: (on: boolean) => void;
  setExplode: (t: number) => void;
  focus: (partId: string | null) => void;
  highlight: (partId: string | null) => void;
  dispose: () => void;
}

function createRig(canvas: HTMLCanvasElement, host: HTMLElement, kind: Parameters<typeof buildModel>[0], color: string, hotspots: () => HTMLElement[]): Rig {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07020f');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const model = buildModel(kind, color);
  scene.add(model.root);
  const bbox = new THREE.Box3().setFromObject(model.root);
  const sphere = bbox.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.05);
  model.root.position.sub(sphere.center);

  const camera = new THREE.PerspectiveCamera(40, 1, radius / 100, radius * 100);
  camera.position.set(radius * 1.7, radius * 0.9, radius * 2.1);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.minDistance = radius * 0.3;
  controls.maxDistance = radius * 8;

  const sun = new THREE.DirectionalLight('#fff4e8', 2.0);
  sun.position.set(radius * 3, radius * 4, radius * 2);
  scene.add(sun, new THREE.HemisphereLight('#c9a7ff', '#1a0630', 0.6));
  const rim = new THREE.DirectionalLight(color, 1.2);
  rim.position.set(-radius * 3, -radius, -radius * 2);
  scene.add(rim);

  // Floor grid + orientation guides.
  const grid = new THREE.GridHelper(radius * 6, 24, new THREE.Color('#ff2bd6'), new THREE.Color('#3a1560'));
  grid.position.y = -radius * 1.15;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.55;
  scene.add(grid);
  // Orientation gizmo in the grid corner: pink = toward Earth, green = direction of flight.
  const gizmo = new THREE.Vector3(-radius * 1.3, -radius * 0.6, -radius * 1.3);
  scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), gizmo, radius * 0.45, 0xff2bd6, radius * 0.08, radius * 0.04));
  scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), gizmo, radius * 0.45, 0x39ff88, radius * 0.08, radius * 0.04));

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (20 + Math.random() * 30));
    pts.push(v.x, v.y, v.z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#d9c8ff', size: radius * 0.05, sizeAttenuation: true })));

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0.35);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Materials: remember the PBR ones, build a hologram shader per part.
  const solidMats = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const holoMats = new Map<string, THREE.ShaderMaterial>();
  const edges: THREE.LineSegments[] = [];
  const partOf = new Map<THREE.Object3D, string>();
  for (const p of model.parts) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: HOLO_VERT,
      fragmentShader: HOLO_FRAG,
      uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uScale: { value: radius }, uHi: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    holoMats.set(p.id, mat);
    p.object.traverse((o) => partOf.set(o, p.id));
  }
  const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35), transparent: true, opacity: 0.55 });
  model.root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    solidMats.set(o, o.material);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), lineMat);
    e.visible = false;
    o.add(e);
    edges.push(e);
  });

  const setHolo = (on: boolean) => {
    for (const [m, mat] of solidMats) {
      const pid = partOf.get(m);
      m.material = on && pid ? holoMats.get(pid)! : mat;
    }
    for (const e of edges) e.visible = on;
    bloom.strength = on ? 0.75 : 0.35;
    bloom.threshold = on ? 0.3 : 0.85;
  };
  const env = scene.environment;
  const setHoloFull = (on: boolean) => {
    setHolo(on);
    scene.environment = on ? null : env;
  };

  const setExplode = (t: number) => {
    for (const p of model.parts) {
      const base = p.object.userData.basePosition as THREE.Vector3;
      p.object.position.copy(base).addScaledVector(p.explode, t * 2.5);
    }
  };

  let hi: string | null = null;
  const highlight = (id: string | null) => {
    hi = id;
    for (const [pid, m] of holoMats) m.uniforms.uHi.value = pid === id ? 1 : 0;
    for (const [mesh, mat] of solidMats) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const mm of mats) if (mm instanceof THREE.MeshStandardMaterial) {
        if (mm.userData.baseEmissive === undefined) mm.userData.baseEmissive = mm.emissive.clone();
        mm.emissive.copy(partOf.get(mesh) === id ? new THREE.Color(color).multiplyScalar(0.35) : mm.userData.baseEmissive);
      }
    }
  };

  const focusTarget = new THREE.Vector3();
  let focusing = 0;
  const focus = (id: string | null) => {
    const p = model.parts.find((x) => x.id === id);
    if (!p) focusTarget.set(0, 0, 0);
    else p.object.localToWorld(focusTarget.copy(p.anchor));
    focusing = 45;
    controls.autoRotate = false;
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    for (const m of holoMats.values()) m.uniforms.uTime.value = t;
    if (focusing > 0) {
      controls.target.lerp(focusTarget, 0.12);
      focusing--;
    }
    controls.update();
    composer.render();
    // Project hotspot anchors to screen.
    const els = hotspots();
    const w = host.clientWidth;
    const h = host.clientHeight;
    model.parts.forEach((p, i) => {
      const el = els[i];
      if (!el) return;
      p.object.localToWorld(tmp.copy(p.anchor));
      tmp.project(camera);
      const hidden = tmp.z > 1;
      el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      el.style.opacity = hidden ? '0' : '1';
      el.dataset.hi = String(p.id === hi);
    });
  };
  loop();

  return {
    renderer,
    composer,
    scene,
    camera,
    controls,
    model,
    radius,
    holoMats,
    solidMats,
    edges,
    setHolo: setHoloFull,
    setExplode,
    focus,
    highlight,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.Points) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      for (const m of holoMats.values()) m.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}

export default function Inspector() {
  useTicker(500);
  const set = useStore((s) => s.set);
  const sat = engine.selectedSat;
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hotRefs = useRef<HTMLElement[]>([]);
  const rig = useRef<Rig | null>(null);
  const [holo, setHolo] = useState(true);
  const [explode, setExplode] = useState(0);
  const [spin, setSpin] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const color = sat ? engine.displayGroup(sat).color : '#b026ff';
  const kind = sat?.kind ?? 'generic';
  const info = useMemo(() => {
    const m = buildModel(kind, color);
    return { title: m.title, summary: m.summary, parts: m.parts.map((p) => ({ id: p.id, label: p.label, detail: p.detail })) };
  }, [kind, color]);
  const parts = info.parts;

  useEffect(() => {
    if (!canvas.current || !host.current) return;
    try {
      rig.current = createRig(canvas.current, host.current, kind, color, () => hotRefs.current);
      rig.current.setHolo(true);
    } catch (e) {
      useStore.getState().notify(`3D inspector failed: ${e instanceof Error ? e.message : e}`, 'error');
    }
    return () => {
      rig.current?.dispose();
      rig.current = null;
    };
  }, [kind, color]);

  useEffect(() => rig.current?.setHolo(holo), [holo]);
  useEffect(() => rig.current?.setExplode(explode), [explode]);
  useEffect(() => {
    if (rig.current) rig.current.controls.autoRotate = spin;
  }, [spin]);
  useEffect(() => rig.current?.highlight(active), [active]);

  if (!sat) {
    return null;
  }
  const t = engine.telemetry();
  const prof = profileFor(sat);
  const choose = (id: string | null) => {
    setActive(id);
    rig.current?.focus(id);
    setSpin(false);
  };
  const activePart = parts.find((p) => p.id === active);

  return (
    <div className="insp" role="dialog" aria-modal="true" aria-label={`3D inspector: ${sat.name}`}>
      <div className="insp-stage" ref={host}>
        <canvas ref={canvas} />
        {parts.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              if (el) hotRefs.current[i] = el;
            }}
            className="hotspot"
            onClick={() => choose(active === p.id ? null : p.id)}
            onMouseEnter={() => rig.current?.highlight(p.id)}
            onMouseLeave={() => rig.current?.highlight(active)}
            aria-label={p.label}
          >
            <span>{i + 1}</span>
          </button>
        ))}
        <div className="insp-axes">
          <span style={{ color: 'var(--pink)' }}>▼ nadir / Earth</span>
          <span style={{ color: 'var(--green)' }}>▶ velocity</span>
        </div>
        {activePart && (
          <div className="insp-callout panel">
            <div className="panel-head">
              <span className="idx">{parts.indexOf(activePart) + 1}</span> {activePart.label}
            </div>
            <div className="panel-body">{activePart.detail}</div>
          </div>
        )}
      </div>

      <aside className="insp-side panel scroll">
        <div className="panel-head">
          <span className="idx">◈</span> Inspector <span className="spacer" />
          <button className="btn icon ghost" onClick={() => set({ inspectorOpen: false })} aria-label="Close inspector">
            ✕
          </button>
        </div>
        <div className="panel-body">
          <div className="label">{info.title}</div>
          <div className="target-name">{sat.name}</div>
          <div className="hint">
            NORAD {sat.norad} · {sat.intlDes}
          </div>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{prof?.mission ?? info.summary}</p>
          {t?.state && (
            <div className="kv">
              <div>
                <div className="label">Altitude</div>
                <div className="value">
                  {fmt.num(t.state.altKm, 1)}
                  <small>km</small>
                </div>
              </div>
              <div>
                <div className="label">Speed</div>
                <div className="value">
                  {fmt.num(t.state.speedKms, 2)}
                  <small>km/s</small>
                </div>
              </div>
              <div>
                <div className="label">Over</div>
                <div className="value">
                  {fmt.lat(t.state.lat)} {fmt.lon(t.state.lon)}
                </div>
              </div>
              <div>
                <div className="label">Lighting</div>
                <div className="value">{t.state.sunlit > 0.5 ? '☀ sunlit' : '☾ eclipse'}</div>
              </div>
            </div>
          )}

          <div className="label" style={{ margin: '10px 0 4px' }}>
            Features — click to focus
          </div>
          <ol className="insp-parts">
            {parts.map((p, i) => (
              <li key={p.id}>
                <button aria-pressed={active === p.id} onClick={() => choose(active === p.id ? null : p.id)} onMouseEnter={() => rig.current?.highlight(p.id)} onMouseLeave={() => rig.current?.highlight(active)}>
                  <span className="n">{i + 1}</span>
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="sep" />
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <span className="label">Exploded view</span>
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} aria-label="Exploded view" style={{ maxWidth: 170 }} />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className={`btn ${holo ? 'on' : ''}`} onClick={() => setHolo(!holo)} aria-pressed={holo}>
              Hologram
            </button>
            <button className={`btn ${spin ? 'on' : ''}`} onClick={() => setSpin(!spin)} aria-pressed={spin}>
              Auto-rotate
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                choose(null);
                setExplode(0);
                setSpin(true);
              }}
            >
              Reset
            </button>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Procedural model of the {info.title.toLowerCase()} class, at approximate real-world scale. Layout is illustrative, not an engineering drawing.
          </p>
        </div>
      </aside>
    </div>
  );
}
