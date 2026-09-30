// The sun garden: a living sun in deep space with a brass-and-glass greenhouse on its crown.
// Six sunflowers (3 "win the day" + 3 more) sprout when tasks are planted and bloom as they get done.
// Seeds for the week sprout as seedlings around the rim; routine steps are lanterns on the brass ring.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const R = 9; // sun radius
const BASE_Y = R + 0.15; // soil level of the greenhouse (world y)
const DOME = 4.8;
const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ───────────────────────── GLSL ───────────────────────── */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm3(vec3 p){ float s=0.,a=.5; for(int i=0;i<3;i++){ s+=a*snoise(p); p*=2.03; a*=.5; } return s; }
float fbm5(vec3 p){ float s=0.,a=.5; for(int i=0;i<5;i++){ s+=a*snoise(p); p*=2.03; a*=.5; } return s; }
`;

const SUN_V = /* glsl */ `varying vec3 vObj; varying vec3 vN; varying vec3 vV;
void main(){ vObj=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }`;
const SUN_F = /* glsl */ `uniform float uTime; uniform float uMood; uniform float uPulse; varying vec3 vObj; varying vec3 vN; varying vec3 vV;
${NOISE}
void main(){
  vec3 p=normalize(vObj); float t=uTime*0.035;
  vec3 q=vec3(fbm3(p*1.7+t), fbm3(p*1.7+vec3(5.2,1.3,2.8)-t), fbm3(p*1.7+vec3(1.7,9.2,4.1)+t*.6));
  float n=fbm5(p*2.3+q*1.5+t*.5);
  float gran=snoise(p*42.0+vec3(0.,t*6.,0.))*.5+.5;
  float spots=smoothstep(.5,.72,fbm3(p*1.2+11.0+t*.15));
  float heat=clamp(.58+.5*n+.14*(gran-.5),0.,1.)*(1.-spots*.6);
  vec3 c1=vec3(.45,.05,.01), c2=vec3(1.,.3,.03), c3=vec3(1.,.62,.14), c4=vec3(1.,.9,.62);
  vec3 col=mix(c1,c2,smoothstep(.05,.42,heat)); col=mix(col,c3,smoothstep(.42,.74,heat)); col=mix(col,c4,smoothstep(.8,1.,heat));
  float mu=max(dot(normalize(vN),normalize(vV)),0.);
  col*= .3+.7*pow(mu,.5);
  col*= .92+uMood*.3+uPulse*.45;
  col+= vec3(1.,.38,.06)*pow(1.-mu,3.)*.45;
  gl_FragColor=vec4(col,1.);
}`;

const GLOW_V = /* glsl */ `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const GLOW_F = /* glsl */ `uniform float uTime; uniform float uMood; uniform float uC; uniform float uPow; uniform vec3 uColor; varying vec3 vN; varying vec3 vP;
${NOISE}
void main(){
  float i=pow(clamp(uC-dot(vN,vec3(0.,0.,1.)),0.,4.),uPow);
  float rays=.7+.3*snoise(normalize(vP)*5.+vec3(uTime*.05));
  gl_FragColor=vec4(uColor*i*rays*(1.+uMood*.35),1.);
}`;

const FLARE_V = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const FLARE_F = /* glsl */ `uniform float uTime; uniform float uSeed; varying vec2 vUv;
${NOISE}
void main(){
  float n=snoise(vec3(vUv.x*7.-uTime*.35, vUv.y*4., uSeed));
  float a=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
  float I=a*clamp(.45+.55*n,0.,1.);
  gl_FragColor=vec4(vec3(1.,.36,.07)*I*1.6,1.);
}`;

const SKY_V = /* glsl */ `varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const SKY_F = /* glsl */ `varying vec3 vDir;
${NOISE}
void main(){
  vec3 d=normalize(vDir);
  float band=exp(-pow(dot(d,normalize(vec3(.35,1.,.25)))*3.,2.));
  float n=fbm3(d*2.6), n2=fbm3(d*6.5+3.);
  vec3 base=mix(vec3(.006,.004,.018),vec3(.022,.014,.05),d.y*.5+.5);
  vec3 neb=vec3(.38,.1,.55)*smoothstep(.05,.8,n)*.32+vec3(.06,.22,.42)*smoothstep(.25,.9,n2)*.22+vec3(.6,.15,.3)*smoothstep(.45,.95,n*n2*2.)*.2;
  vec3 milky=vec3(.55,.5,.7)*band*(.2+.55*smoothstep(-.2,.8,n2))*.3;
  gl_FragColor=vec4(base+neb*(.45+band)+milky,1.);
}`;

const POINTS_V = /* glsl */ `attribute float aSize; attribute float aPhase; attribute vec3 aColor; uniform float uTime; uniform float uPR; uniform float uAtten; varying vec3 vC; varying float vTw;
void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vTw=.65+.35*sin(uTime*(1.2+fract(aPhase)*2.)+aPhase*6.28); vC=aColor;
  float s=aSize*uPR*vTw; if(uAtten>0.) s*=uAtten/-mv.z; gl_PointSize=s; gl_Position=projectionMatrix*mv; }`;
const POINTS_F = /* glsl */ `uniform float uGain; varying vec3 vC; varying float vTw;
void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); float core=smoothstep(.16,.0,d); if(a<.01) discard;
  gl_FragColor=vec4(vC*(a*.55+core*1.6)*uGain*vTw,1.); }`;

const GRASS_V = /* glsl */ `attribute float aShade; uniform float uTime; varying float vY; varying float vShade;
void main(){ vY=uv.y; vShade=aShade; vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.);
  float w=sin(uTime*1.4+wp.x*1.1+wp.z*.8)*.5+sin(uTime*2.3+wp.z*2.1)*.25; wp.x+=w*.09*uv.y*uv.y; wp.z+=w*.05*uv.y*uv.y;
  gl_Position=projectionMatrix*viewMatrix*wp; }`;
const GRASS_F = /* glsl */ `varying float vY; varying float vShade;
void main(){ vec3 base=vec3(.02,.07,.03), tip=mix(vec3(.16,.42,.14),vec3(.42,.5,.16),vShade);
  vec3 c=mix(base,tip,pow(vY,.9)); c+=vec3(.3,.14,.04)*pow(vY,3.)*.25; gl_FragColor=vec4(c*(.7+.3*vShade),1.); }`;

const GLASS_V = /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; vW=position; gl_Position=projectionMatrix*mv; }`;
const GLASS_F = /* glsl */ `uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ float f=1.-abs(dot(normalize(vN),normalize(vV))); float fr=pow(f,3.);
  float streak=smoothstep(.985,1.,sin(vW.x*.55+vW.y*.9-uTime*.05+2.))*.35;
  vec3 c=mix(vec3(.55,.6,1.),vec3(1.,.82,.6),vW.y/${DOME.toFixed(1)}*.6)*fr*.7+vec3(1.,.95,.9)*streak*.6;
  gl_FragColor=vec4(c,.02+fr*.32+streak*.5); }`;

/* ───────────────────────── textures ───────────────────────── */
function canvasTex(size, draw) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const glowTex = () => canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,230,170,.7)"); gr.addColorStop(1, "rgba(255,180,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
const shadowTex = () => canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
const seedTex = () => canvasTex(512, (g, s) => {
  const c = s / 2;
  const bg = g.createRadialGradient(c, c, 0, c, c, c);
  bg.addColorStop(0, "#5b5a1a"); bg.addColorStop(.18, "#3b2a0e"); bg.addColorStop(.75, "#24120a"); bg.addColorStop(.92, "#6b3510"); bg.addColorStop(1, "#b0651a");
  g.fillStyle = bg; g.fillRect(0, 0, s, s);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 1400; i++) {
    const r = 6.6 * Math.sqrt(i), a = i * golden, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
    if (r > c - 6) break;
    const k = r / c;
    g.fillStyle = k < .2 ? (i % 2 ? "#8a8a2a" : "#6d6a1c") : k > .86 ? (i % 2 ? "#d68a24" : "#a85a14") : (i % 3 ? "#3a200d" : "#5a3414");
    g.beginPath(); g.ellipse(x, y, 2.4 + k * 2.2, 2 + k * 1.6, a, 0, 7); g.fill();
    if (k > .2 && k < .86 && i % 4 === 0) { g.fillStyle = "rgba(255,190,90,.25)"; g.beginPath(); g.arc(x - 1, y - 1, 1, 0, 7); g.fill(); }
  }
});
const soilTex = () => canvasTex(512, (g, s) => {
  g.fillStyle = "#24160f"; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = v > .97 ? "rgba(160,120,90,.5)" : v > .6 ? "rgba(60,38,26,.6)" : "rgba(14,8,6,.5)"; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  const gr = g.createRadialGradient(s / 2, s / 2, s * .25, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(40,70,30,.55)"); g.fillStyle = gr; g.fillRect(0, 0, s, s);
});

/* ───────────────────────── sunflower parts ───────────────────────── */
function petalGeometry(len, wid) {
  const g = new THREE.PlaneGeometry(1, 1, 4, 12);
  const p = g.attributes.position, col = [];
  const cBase = new THREE.Color("#c2410c"), cMid = new THREE.Color("#ffa90a"), cTip = new THREE.Color("#ffd84d");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + .5, x = p.getX(i);
    const w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, y * 1.08 + .04)), .75) * (1 - .18 * y);
    const X = x * 2 * w, Y = y * len;
    p.setXYZ(i, X, Y, -.22 * y * y * len + Math.abs(X) * .35);
    const c = y < .35 ? cBase.clone().lerp(cMid, y / .35) : cMid.clone().lerp(cTip, (y - .35) / .65);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(.42, .12, .5, .6, 0, 1); s.bezierCurveTo(-.5, .6, -.42, .12, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10), p = g.attributes.position, col = [];
  const a = new THREE.Color("#1f6b34"), b = new THREE.Color("#6cc26a");
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, .28 * y * y - .16 * Math.abs(x)); const c = a.clone().lerp(b, y * .8 + Math.abs(x) * .3); col.push(c.r, c.g, c.b); }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/* ───────────────────────── scene ───────────────────────── */
export function createScene(container, { onSelect, onEmpty } = {}) {
  const small = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const still = reduce || location.hash === "#still";

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
  const overlay = document.createElement("div"); overlay.className = "flower-labels"; container.appendChild(overlay);
  const tip = document.createElement("div"); tip.className = "scene-tip"; tip.hidden = true; container.appendChild(tip);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1200);
  const PR = renderer.getPixelRatio();
  const time = { value: 0 };
  const mood = { value: 0 };
  const pulse = { value: 0 };

  // environment for brass reflections: warm below, violet above
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: SKY_V, fragmentShader: `varying vec3 vDir; void main(){ vec3 d=normalize(vDir); vec3 c=mix(vec3(2.2,.9,.25),vec3(.12,.1,.35),smoothstep(-.4,.5,d.y)); c+=vec3(.6,.55,.9)*smoothstep(.85,1.,d.y); gl_FragColor=vec4(c,1.); }` })));
  scene.environment = pm.fromScene(envScene, 0.04).texture;

  /* sky + stars */
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: SKY_V, fragmentShader: SKY_F })));
  const pointsMat = (gain, atten) => new THREE.ShaderMaterial({ vertexShader: POINTS_V, fragmentShader: POINTS_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: time, uPR: { value: PR }, uGain: { value: gain }, uAtten: { value: atten } } });
  {
    const N = small ? 2600 : 4200, pos = [], size = [], ph = [], col = [];
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(380, 520)); pos.push(v.x, v.y, v.z);
      const big = Math.random() < .03; size.push(big ? rnd(4, 7) : rnd(1.2, 3)); ph.push(Math.random() * 10);
      const c = new THREE.Color().setHSL(Math.random() < .5 ? rnd(.55, .66) : rnd(.06, .14), rnd(.2, .7), rnd(.65, .92)); const k = big ? 1.4 : .9; col.push(c.r * k, c.g * k, c.b * k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, pointsMat(1, 0)));
  }

  /* sun */
  const sunGroup = new THREE.Group(); scene.add(sunGroup);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(R, small ? 96 : 144, small ? 64 : 96), new THREE.ShaderMaterial({ vertexShader: SUN_V, fragmentShader: SUN_F, uniforms: { uTime: time, uMood: mood, uPulse: pulse } }));
  sunGroup.add(sun);
  const glow = (scale, c, pow, color, k) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(R * scale, 64, 48), new THREE.ShaderMaterial({ vertexShader: GLOW_V, fragmentShader: GLOW_F, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: time, uMood: mood, uC: { value: c }, uPow: { value: pow }, uColor: { value: new THREE.Color(color).multiplyScalar(k) } } }));
    scene.add(m); return m;
  };
  glow(1.22, .72, 3.2, "#ff7a1a", .5);
  glow(1.9, .62, 4.5, "#ff4d0a", .22);
  // solar prominences, rooted on the visible face of the sun
  const flares = [];
  for (let i = 0; i < 6; i++) {
    const lat = rnd(-.9, .35), lon = rnd(0, Math.PI * 2), span = rnd(.12, .22), h = rnd(1.4, 3.2);
    const at = (la, lo, r) => new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)).multiplyScalar(r);
    const a = at(lat, lon - span, R * .99), b = at(lat + rnd(-.08, .08), lon + span, R * .99);
    const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R + h);
    const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, .5).normalize().multiplyScalar(R + h * .8), mid, b.clone().lerp(mid, .5).normalize().multiplyScalar(R + h * .8), b]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, rnd(.12, .22), 8), new THREE.ShaderMaterial({ vertexShader: FLARE_V, fragmentShader: FLARE_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: time, uSeed: { value: Math.random() * 50 } } }));
    sunGroup.add(m); flares.push(m);
  }

  /* greenhouse */
  const gh = new THREE.Group(); gh.position.y = BASE_Y; scene.add(gh);
  const brass = new THREE.MeshStandardMaterial({ color: "#d9a441", metalness: 1, roughness: .26, envMapIntensity: 1.3 });
  const stone = new THREE.MeshStandardMaterial({ color: "#2e2238", metalness: .35, roughness: .5, envMapIntensity: .8 });
  {
    const prof = [[.01, -2.3], [1.6, -2.15], [3.3, -1.55], [4.6, -.75], [5.2, -.25], [5.42, -.08], [5.42, .02], [5.2, .06]].map(([x, y]) => new THREE.Vector2(x, y));
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), stone); gh.add(bowl);
    const band = new THREE.Mesh(new THREE.TorusGeometry(5.4, .1, 16, 160), brass); band.rotation.x = Math.PI / 2; band.position.y = .02; gh.add(band);
    const band2 = new THREE.Mesh(new THREE.TorusGeometry(4.75, .05, 12, 140), brass); band2.rotation.x = Math.PI / 2; band2.position.y = -.72; gh.add(band2);
    // starmap studs around the bowl
    const studG = new THREE.OctahedronGeometry(.07, 0), studM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.4) });
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const s = new THREE.Mesh(studG, studM); s.position.set(Math.cos(a) * 5.13, -.36 + (i % 2) * .12, Math.sin(a) * 5.13); gh.add(s); }
    const soil = new THREE.Mesh(new THREE.CircleGeometry(5.22, 96), new THREE.MeshStandardMaterial({ map: soilTex(), roughness: 1 }));
    soil.rotation.x = -Math.PI / 2; soil.position.y = .03; gh.add(soil);
    // stepping-stone path
    const pathM = new THREE.MeshStandardMaterial({ color: "#6b5a4e", roughness: .85 });
    for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(rnd(.26, .34), .36, .06, 14), pathM); st.position.set(rnd(-.12, .12) + (i % 2 ? .12 : -.12), .05, 4.7 - i * .55); st.rotation.y = rnd(0, 3); gh.add(st); }
  }
  // glass dome with brass ribs and a finial
  const glassMat = new THREE.ShaderMaterial({ vertexShader: GLASS_V, fragmentShader: GLASS_F, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: time } });
  gh.add(new THREE.Mesh(new THREE.SphereGeometry(DOME, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), glassMat));
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, pts = [];
    for (let k = 0; k <= 24; k++) { const phi = k / 24 * Math.PI / 2; pts.push(new THREE.Vector3(Math.cos(a) * Math.cos(phi) * DOME, Math.sin(phi) * DOME, Math.sin(a) * Math.cos(phi) * DOME)); }
    gh.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, i % 3 ? .03 : .05, 8), brass));
  }
  for (const lat of [.0, .38, .78]) { const t = new THREE.Mesh(new THREE.TorusGeometry(Math.cos(lat) * DOME, lat ? .03 : .07, 10, 120), brass); t.rotation.x = Math.PI / 2; t.position.y = Math.sin(lat) * DOME; gh.add(t); }
  {
    const fin = new THREE.Group(); fin.position.y = DOME; gh.add(fin);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass); fin.add(cap);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(.05, .7, 12), brass); spire.position.y = .45; fin.add(spire);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.2, 1.8) })); star.position.y = .9; star.scale.set(1, 1.6, 1); fin.add(star); fin.userData.star = star;
    gh.userData.fin = fin;
  }
  // hanging lantern inside the dome
  const lampLight = new THREE.PointLight("#ffc98a", 22, 12, 1.8); lampLight.position.set(0, DOME - 1.05, 0); gh.add(lampLight);
  {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .8, 6), brass); chain.position.y = DOME - .45; gh.add(chain);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.1) })); lamp.position.y = DOME - .95; gh.add(lamp);
    const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), new THREE.MeshStandardMaterial({ color: "#d9a441", metalness: 1, roughness: .3, wireframe: true })); cage.position.y = DOME - .95; gh.add(cage);
  }

  /* grass */
  const flowerSpots = [];
  const slots = [];
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 - Math.PI / 2; slots.push({ x: Math.cos(a) * 1.35, z: Math.sin(a) * 1.35 + .1, primary: true }); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 - Math.PI / 2 + Math.PI / 3; slots.push({ x: Math.cos(a) * 2.95, z: Math.sin(a) * 2.95, primary: false }); }
  slots.forEach((s) => flowerSpots.push(s));
  {
    const bladeG = new THREE.PlaneGeometry(.06, .5, 1, 4); bladeG.translate(0, .25, 0);
    const bp = bladeG.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i) / .5; bp.setX(i, bp.getX(i) * (1 - y * .92)); }
    const N = small ? 1800 : 3400;
    const mesh = new THREE.InstancedMesh(bladeG, new THREE.ShaderMaterial({ vertexShader: GRASS_V, fragmentShader: GRASS_F, side: THREE.DoubleSide, uniforms: { uTime: time } }), N);
    const shade = new Float32Array(N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let k = 0, tries = 0;
    while (k < N && tries++ < N * 6) {
      const r = Math.sqrt(Math.random()) * 5.05, a = Math.random() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < .45 && z > 1.9) continue; // path
      if (flowerSpots.some((s) => Math.hypot(s.x - x, s.z - z) < .32)) continue;
      const h = rnd(.5, 1.25) * (r > 4.3 ? 1.25 : 1) * (r < 3.8 && r > 2.2 && Math.random() < .5 ? .55 : 1);
      e.set(rnd(-.25, .25), rnd(0, 6.28), rnd(-.25, .25)); q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, .03, z), q, new THREE.Vector3(1, h, 1)); mesh.setMatrixAt(k, m); shade[k] = Math.random(); k++;
    }
    mesh.count = k; mesh.geometry.setAttribute("aShade", new THREE.InstancedBufferAttribute(shade, 1));
    gh.add(mesh);
  }

  /* lights */
  scene.add(new THREE.HemisphereLight("#8f86ff", "#ff7a2a", .5));
  const warm = new THREE.DirectionalLight("#ffb46b", 1.5); warm.position.set(5, -4, 7); scene.add(warm);
  const cool = new THREE.DirectionalLight("#dcd6ff", 1.3); cool.position.set(-6, 16, 6); scene.add(cool);

  /* sunflowers */
  const PETAL_G = petalGeometry(.78, .15), LEAF_G = leafGeometry(), SEED_T = seedTex(), SHADOW_T = shadowTex(), GLOW_T = glowTex();
  const stemM = new THREE.MeshStandardMaterial({ color: "#2f7d3d", roughness: .55, emissive: "#0a2e14", emissiveIntensity: .4 });
  const leafM = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .6, emissive: "#0b2a12", emissiveIntensity: .35 });
  const bractM = new THREE.MeshStandardMaterial({ color: "#3f8a3a", side: THREE.DoubleSide, roughness: .6 });
  const bractG = (() => { const s = new THREE.Shape(); s.moveTo(-.06, 0); s.lineTo(0, .2); s.lineTo(.06, 0); return new THREE.ShapeGeometry(s); })();
  const discG = new THREE.SphereGeometry(.42, 48, 12, 0, Math.PI * 2, 0, .62); discG.rotateX(Math.PI / 2); discG.scale(1, 1, .45);
  const hitG = new THREE.SphereGeometry(1.05, 10, 8), hitM = new THREE.MeshBasicMaterial({ visible: false });

  function makeFlower(slot, index) {
    const g = new THREE.Group(); g.position.set(slot.x, .03, slot.z);
    const h = slot.primary ? rnd(2.45, 2.75) : rnd(1.65, 1.9);
    const sway = new THREE.Group(); g.add(sway);
    const bend = rnd(-.18, .18);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bend * .3, h * .35, .04), new THREE.Vector3(-bend * .4, h * .72, .1), new THREE.Vector3(bend * .2, h, .22)]);
    sway.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, slot.primary ? .065 : .05, 8), stemM));
    [[.26, 1], [.46, -1], [.64, 1]].slice(0, slot.primary ? 3 : 2).forEach(([t, side], k) => {
      const leaf = new THREE.Mesh(LEAF_G, leafM); leaf.position.copy(curve.getPoint(t));
      leaf.rotation.set(-.35, side * 1.25 + rnd(-.3, .3), side * (1.05 - k * .1)); leaf.scale.setScalar((slot.primary ? .8 : .6) * (1 - k * .12)); sway.add(leaf);
    });
    const head = new THREE.Group(); head.position.copy(curve.getPoint(1)); sway.add(head);
    const face = new THREE.Group(); head.add(face);
    const petalM = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .5, emissive: "#ff7a00", emissiveIntensity: .06 });
    const discM = new THREE.MeshStandardMaterial({ map: SEED_T, roughness: .85, emissive: "#ff9a20", emissiveMap: SEED_T, emissiveIntensity: .05 });
    const disc = new THREE.Mesh(discG, discM); disc.position.z = .03; face.add(disc);
    for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(bractG, bractM); const pv = new THREE.Object3D(); pv.rotation.z = i / 16 * Math.PI * 2; b.position.y = .32; b.rotation.x = .9; pv.add(b); pv.position.z = -.06; face.add(pv); }
    const petals = [];
    const N = 22;
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < N; i++) {
      const pivot = new THREE.Object3D(); pivot.rotation.z = ((i + ring * .5) / N) * Math.PI * 2 + rnd(-.04, .04);
      const arm = new THREE.Object3D(); pivot.add(arm);
      const pm2 = new THREE.Mesh(PETAL_G, petalM); pm2.position.y = .3; pm2.rotation.y = rnd(-.25, .25); pm2.scale.set(rnd(.9, 1.1), (ring ? .88 : 1.04) * rnd(.9, 1.08), 1);
      arm.add(pm2); arm.position.z = ring ? -.03 : 0; face.add(pivot); petals.push({ arm, ring, j: rnd(-.07, .07) });
    }
    const hit = new THREE.Mesh(hitG, hitM); head.add(hit);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: SHADOW_T, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; g.add(shadow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .64, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, .6), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; g.add(ring);
    // empty-slot marker: a glowing seed in a little mound
    const empty = new THREE.Group(); g.add(empty);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#3a2618", roughness: 1 })); mound.scale.y = .35; empty.add(mound);
    const seed = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.8, .7) })); seed.position.y = .12; empty.add(seed);
    const emptyHit = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), hitM); emptyHit.position.y = .2; empty.add(emptyHit);
    const label = document.createElement("button"); label.type = "button"; label.className = "flower-label"; label.addEventListener("click", () => onSelect && onSelect(index)); overlay.appendChild(label);
    g.userData = { index, primary: slot.primary, sway, head, face, petals, petalM, discM, hit, emptyHit, empty, seed, ring, shadow, label, open: 0, target: 0, grow: 0, growT: 0, active: false, id: null, phase: rnd(0, 6), hover: 0, glow: 0, done: false, q: new THREE.Quaternion() };
    sway.scale.setScalar(.001); shadow.scale.setScalar(.001);
    gh.add(g);
    return g;
  }
  const flowers = slots.map(makeFlower);

  function setOpen(f, o) {
    const u = f.userData, angle = lerp(1.38, -.1, o);
    for (const p of u.petals) p.arm.rotation.x = angle + p.j * o + (p.ring ? .12 * o : 0);
    u.face.scale.setScalar(lerp(u.primary ? .85 : .72, u.primary ? 1.28 : 1.02, o) * (1 + u.hover * .07));
  }

  /* seedlings (week seeds) + lanterns (routines) */
  const seedlingGroup = new THREE.Group(); gh.add(seedlingGroup);
  let seedlings = [];
  function setSeedlings(list) {
    seedlingGroup.clear(); seedlings = [];
    const items = list.slice(0, 20), n = items.length;
    items.forEach((s, i) => {
      const a = (i / Math.max(n, 10)) * Math.PI * 2 + Math.PI * .62, r = 4.25;
      const g = new THREE.Group(); g.position.set(Math.cos(a) * r, .03, Math.sin(a) * r);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(.018, .026, .42, 6), stemM); st.position.y = .21; g.add(st);
      for (const side of [-1, 1]) { const l = new THREE.Mesh(LEAF_G, leafM); l.scale.setScalar(.26); l.position.y = .4; l.rotation.set(-.2, 0, side * 1.1); g.add(l); }
      const bud = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshStandardMaterial({ color: "#9bd36a", emissive: "#5fae3a", emissiveIntensity: .5 })); bud.position.y = .45; g.add(bud);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), hitM); hit.position.y = .3; g.add(hit);
      g.userData = { title: s.title, hit, grow: 0, phase: rnd(0, 6) }; g.scale.setScalar(.001);
      seedlingGroup.add(g); seedlings.push(g);
    });
  }
  const lanternGroup = new THREE.Group(); gh.add(lanternGroup);
  let lanterns = [];
  function setLanterns(done, total) {
    if (lanterns.length !== total) {
      lanternGroup.clear(); lanterns = [];
      for (let i = 0; i < Math.min(total, 18); i++) {
        const a = -Math.PI / 2 + (i - (Math.min(total, 18) - 1) / 2) * .19 + Math.PI;
        const g = new THREE.Group(); g.position.set(Math.cos(a) * 5.4, .1, Math.sin(a) * 5.4);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, .4, 6), brass); post.position.y = .2; g.add(post);
        const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .22, .4) });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 8), bulbM); bulb.position.y = .46; g.add(bulb);
        g.userData = { bulbM, lit: 0, target: 0 }; lanternGroup.add(g); lanterns.push(g);
      }
    }
    lanterns.forEach((l, i) => (l.userData.target = i < done ? 1 : 0));
  }

  /* fireflies + bursts */
  const fireflies = (() => {
    const N = small ? 60 : 110, pos = new Float32Array(N * 3), size = [], ph = [], col = [], seeds = [];
    for (let i = 0; i < N; i++) { seeds.push({ r: rnd(.4, 4.2), a: rnd(0, 6.28), y: rnd(.3, 3.8), s: rnd(.08, .25) * (Math.random() < .5 ? -1 : 1), b: rnd(0, 6.28) }); size.push(rnd(18, 34)); ph.push(Math.random() * 10); const c = new THREE.Color().setHSL(rnd(.1, .15), .9, .6); col.push(c.r * 1.8, c.g * 1.8, c.b * 1.8); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1)); g.setAttribute("aPhase", new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
    const pts = new THREE.Points(g, pointsMat(.9, 1)); gh.add(pts); return { pts, pos, seeds, N };
  })();
  const bursts = [];
  function burst(i) {
    const f = flowers[i]; if (!f) return;
    const c = new THREE.Vector3(); f.userData.head.getWorldPosition(c); gh.worldToLocal(c);
    const N = 140, pos = new Float32Array(N * 3), vel = [], size = [], ph = [], col = [];
    for (let k = 0; k < N; k++) { pos.set([c.x, c.y, c.z], k * 3); vel.push(new THREE.Vector3().randomDirection().multiplyScalar(rnd(.8, 3.2)).add(new THREE.Vector3(0, 1.2, 0))); size.push(rnd(20, 46)); ph.push(k); const cc = new THREE.Color().setHSL(rnd(.09, .15), 1, .6); col.push(cc.r * 2.4, cc.g * 2.4, cc.b * 2.4); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1)); g.setAttribute("aPhase", new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
    const m = pointsMat(1.2, 1); const p = new THREE.Points(g, m); gh.add(p); bursts.push({ p, pos, vel, t: 0, m });
    f.userData.glow = 1.6;
  }

  /* post-processing */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .6, .5, .9); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* camera + controls */
  const controls = new OrbitControls(camera, renderer.domElement);
  const HOME_T = new THREE.Vector3(0, BASE_Y + 1.4, 0);
  controls.target.copy(HOME_T);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
  controls.minDistance = 6; controls.maxDistance = 70; controls.minPolarAngle = .18; controls.maxPolarAngle = 1.62;
  controls.rotateSpeed = .6; controls.zoomSpeed = .8;
  controls.autoRotate = !reduce; controls.autoRotateSpeed = .35;
  const homeDist = () => (camera.aspect < .8 ? 24 : camera.aspect < 1.2 ? 20 : 17.5);
  const homePos = () => HOME_T.clone().add(new THREE.Vector3(Math.sin(.35) * Math.cos(.3), Math.sin(.3), Math.cos(.35) * Math.cos(.3)).multiplyScalar(homeDist()));
  let fly = null; // {fromP,toP,fromT,toT,t,dur}
  const flyTo = (toP, toT, dur = 1.4) => { fly = { fromP: camera.position.clone(), toP, fromT: controls.target.clone(), toT, t: 0, dur }; };
  let idle = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; idle = 0; fly = null; hideHint(); });
  controls.addEventListener("end", () => { idle = 0; });

  const hint = document.createElement("div"); hint.className = "scene-hint"; hint.textContent = "Drag to look around · scroll to zoom · tap a flower"; container.appendChild(hint);
  function hideHint() { hint.classList.add("gone"); }
  setTimeout(hideHint, 9000);

  function resize() {
    const w = container.clientWidth || 800, h = container.clientHeight || 600;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    bloom.resolution.set(w * .5, h * .5);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container); resize();

  // intro: drift in from deep space
  if (still) { camera.position.copy(homePos()); }
  else { camera.position.set(-38, BASE_Y + 26, 78); flyTo(homePos(), HOME_T.clone(), 3.6); }

  /* picking */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null, downAt = null;
  const pickables = () => [
    ...flowers.flatMap((f) => (f.userData.active ? [[f.userData.hit, { type: "flower", i: f.userData.index }]] : [[f.userData.emptyHit, { type: "empty", i: f.userData.index }]])),
    ...seedlings.map((s, i) => [s.userData.hit, { type: "seed", i }]),
  ];
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const list = pickables(), hits = ray.intersectObjects(list.map((x) => x[0]), false);
    return hits.length ? list.find((x) => x[0] === hits[0].object)[1] : null;
  }
  renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const h = pick(e);
    if (!h) return onSelect && onSelect(-1);
    if (h.type === "flower") onSelect && onSelect(h.i);
    if (h.type === "empty") onEmpty && onEmpty(h.i);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.buttons) return;
    const h = pick(e); hovered = h;
    renderer.domElement.style.cursor = h ? "pointer" : "grab";
    if (h && (h.type === "seed" || h.type === "empty")) {
      const r = container.getBoundingClientRect();
      tip.textContent = h.type === "seed" ? `🌱 ${seedlings[h.i].userData.title}` : flowers[h.i].userData.primary ? "Plant a win here" : "Plant a task here";
      tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top - 10}px)`; tip.hidden = false;
    } else tip.hidden = true;
  });
  renderer.domElement.addEventListener("pointerleave", () => { hovered = null; tip.hidden = true; });
  renderer.domElement.addEventListener("dblclick", () => api.resetView());

  /* loop */
  const clock = new THREE.Clock();
  let selected = -1, thinking = 0, running = true;
  const v = new THREE.Vector3(), wp = new THREE.Vector3(), dummy = new THREE.Object3D();
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { clock.getDelta(); requestAnimationFrame(tick); } });

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), .05);
    time.value += dt;
    const t = time.value;
    thinking = lerp(thinking, api._thinking ? 1 : 0, .05);
    pulse.value = thinking * (.5 + .5 * Math.sin(t * 3));
    sunGroup.rotation.y += dt * .012;
    const star = gh.userData.fin.userData.star; star.rotation.y += dt * .8; star.scale.setScalar(1 + Math.sin(t * 2) * .12); star.scale.y *= 1.6;
    lampLight.intensity = 12 + Math.sin(t * 3.1) * .8 + thinking * 10;

    if (fly) {
      fly.t = Math.min(1, fly.t + dt / fly.dur); const k = easeInOut(fly.t);
      camera.position.lerpVectors(fly.fromP, fly.toP, k); controls.target.lerpVectors(fly.fromT, fly.toT, k);
      if (fly.t >= 1) fly = null;
    }
    idle += dt;
    if (!reduce && !fly && selected < 0 && idle > 12) controls.autoRotate = true;
    controls.update();

    flowers.forEach((f) => {
      const u = f.userData;
      if (u.active) u.growT = Math.min(1, u.growT + dt / 1.6); else u.growT = Math.max(0, u.growT - dt / .6);
      const gs = u.active ? easeOutBack(u.growT) : u.growT;
      u.sway.scale.setScalar(Math.max(.001, gs)); u.shadow.scale.setScalar(Math.max(.001, gs));
      u.empty.visible = !u.active && u.growT < .05;
      if (u.empty.visible) { const on = hovered && hovered.type === "empty" && hovered.i === u.index; u.seed.scale.setScalar((1 + Math.sin(t * 2.4 + u.phase) * .25) * (on ? 1.8 : 1)); }
      const tgtOpen = u.active ? u.target * Math.min(1, u.growT * 1.3) : 0;
      u.open = lerp(u.open, tgtOpen, .05);
      const hv = hovered && hovered.type === "flower" && hovered.i === u.index ? 1 : 0;
      u.hover = lerp(u.hover, hv || (selected === u.index ? .6 : 0), .15);
      setOpen(f, u.open);
      u.glow = Math.max(0, u.glow - dt * .8);
      u.petalM.emissiveIntensity = lerp(u.petalM.emissiveIntensity, (u.done ? .38 : .05) + u.hover * .12 + u.glow * .6, .08);
      u.discM.emissiveIntensity = u.done ? .22 + u.glow * .5 : .04;
      const s = reduce ? 0 : 1;
      u.sway.rotation.z = Math.sin(t * .8 + u.phase) * .035 * s; u.sway.rotation.x = Math.cos(t * .65 + u.phase) * .02 * s;
      // heads turn gently toward whoever is looking
      u.head.getWorldPosition(wp);
      dummy.position.copy(wp); dummy.lookAt(v.copy(camera.position).add(new THREE.Vector3(0, 2, 0)));
      const pq = new THREE.Quaternion(); u.head.parent.getWorldQuaternion(pq);
      const local = pq.invert().multiply(dummy.quaternion);
      u.q.slerp(local, .04); u.head.quaternion.copy(u.q);
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .25); u.head.quaternion.multiply(tilt);
      u.ring.material.opacity = lerp(u.ring.material.opacity, selected === u.index ? .9 : 0, .12);
      u.ring.scale.setScalar(1 + Math.sin(t * 3) * .06);
      // label
      v.set(0, .95, 0); u.head.localToWorld(v); u.lvis = u.active && u.growT > .4 && !!u.text;
      v.project(camera); u.lx = (v.x * .5 + .5) * container.clientWidth; u.ly = (-v.y * .5 + .5) * container.clientHeight; if (v.z > 1) u.lvis = false;
    });
    // de-overlap labels
    const placed = [];
    [...flowers].sort((a, b) => b.userData.ly - a.userData.ly).forEach((f) => {
      const u = f.userData, w = u.label.offsetWidth || 120; let y = u.ly;
      for (let k = 0; k < 8; k++) { const c = placed.find((p) => Math.abs(p.x - u.lx) < (p.w + w) / 2 + 6 && Math.abs(p.y - y) < 28); if (!c) break; y = c.y - 30; }
      placed.push({ x: u.lx, y, w });
      u.label.style.transform = `translate(-50%,-100%) translate(${u.lx.toFixed(1)}px, ${y.toFixed(1)}px)`;
      u.label.style.opacity = u.lvis ? 1 : 0; u.label.style.pointerEvents = u.lvis ? "auto" : "none";
    });

    seedlings.forEach((s) => { const u = s.userData; u.grow = Math.min(1, u.grow + dt / 1.2); s.scale.setScalar(Math.max(.001, easeOutBack(u.grow))); s.rotation.z = Math.sin(t + u.phase) * .06; });
    lanterns.forEach((l, i) => { const u = l.userData; u.lit = lerp(u.lit, u.target, .06); const fl = 1 + Math.sin(t * 7 + i * 3) * .06 * u.lit; u.bulbM.color.setRGB(lerp(.25, 3.2, u.lit) * fl, lerp(.22, 2.1, u.lit) * fl, lerp(.4, .8, u.lit)); });

    const { pos, seeds, N } = fireflies, sp = 1 + thinking * 4;
    for (let i = 0; i < N; i++) { const s = seeds[i]; s.a += s.s * dt * sp; pos[i * 3] = Math.cos(s.a) * s.r; pos[i * 3 + 1] = s.y + Math.sin(t * .7 + s.b) * .25; pos[i * 3 + 2] = Math.sin(s.a) * s.r; }
    fireflies.pts.geometry.attributes.position.needsUpdate = true;
    for (let k = bursts.length - 1; k >= 0; k--) {
      const b = bursts[k]; b.t += dt;
      for (let i = 0; i < b.vel.length; i++) { b.vel[i].y -= dt * 1.4; b.vel[i].multiplyScalar(.985); b.pos[i * 3] += b.vel[i].x * dt; b.pos[i * 3 + 1] += b.vel[i].y * dt; b.pos[i * 3 + 2] += b.vel[i].z * dt; }
      b.p.geometry.attributes.position.needsUpdate = true; b.m.uniforms.uGain.value = Math.max(0, 1.3 * (1 - b.t / 2));
      if (b.t > 2) { gh.remove(b.p); b.p.geometry.dispose(); bursts.splice(k, 1); }
    }
    composer.render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const api = {
    _thinking: false,
    /** items: 6 × {id, text, progress 0..1} (null/empty text → empty slot) */
    setFlowers(items) {
      flowers.forEach((f, i) => {
        const it = items[i], u = f.userData, on = !!(it && it.text);
        if (on && (!u.active || u.id !== it.id)) { u.growT = 0; u.open = 0; }
        u.active = on; u.id = on ? it.id : null; u.text = on ? it.text : "";
        const p = on ? Math.min(1, it.progress || 0) : 0;
        u.target = on ? .22 + .78 * p : 0; u.done = p >= 1;
        u.label.textContent = on ? `${i < 3 ? "★ " : ""}${u.text.length > 28 ? u.text.slice(0, 27) + "…" : u.text}` : "";
        u.label.dataset.tier = i < 3 ? "win" : "also"; u.label.dataset.done = u.done ? "1" : "0";
      });
    },
    setSeedlings,
    setLanterns,
    burst,
    setSelected(i) {
      selected = i;
      flowers.forEach((f, k) => f.userData.label.classList.toggle("sel", k === i));
      if (i >= 0 && flowers[i].userData.active) {
        const h = new THREE.Vector3(); flowers[i].userData.head.getWorldPosition(h);
        const dir = camera.position.clone().sub(h).setY(0).normalize();
        controls.autoRotate = false;
        flyTo(h.clone().add(dir.multiplyScalar(7.5)).add(new THREE.Vector3(0, 2.4, 0)), h.clone().add(new THREE.Vector3(0, -.3, 0)), 1.1);
      }
    },
    setMood(p) { mood.value = p; },
    setThinking(on) { api._thinking = !!on; },
    resetView() { selected = -1; flowers.forEach((f) => f.userData.label.classList.remove("sel")); flyTo(homePos(), HOME_T.clone(), 1.2); idle = 0; },
  };
  return api;
}
