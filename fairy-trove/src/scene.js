/* The Fairy Trove — the hibiscus planet.
 * One huge red-pink hibiscus suspended in a glass sphere, ringed by an ivy garland, in pastel space.
 * Each of the day's six tasks is a grain of pollen drifting off the staminal column.
 * Needs THREE (r128). Exposes FTScene.create({canvas, stage, labels, theme, reducedMotion}).
 */
(function (root) {
  'use strict';

  var THEMES = {
    light: {
      spaceA: '#cbb7f3', spaceB: '#a6e8d0', spaceC: '#f8c3dc', spaceD: '#b6c8f5', deep: '#9a86dd',
      burst: '#ffffff', burstAmt: 0.5, inner: '#fff1f8', glassBody: 0.78,
      rim: '#8a6be0', rimAmt: 1.0, rimAlpha: 0.82, sky: '#efe4ff', ground: '#c4f2de',
      halo: '#ffffff', haloAmt: 0.55, additive: false, starAmt: 1.0, moonA: '#f6c9e2', moonB: '#bfeedd'
    },
    dark: {
      spaceA: '#2c1c58', spaceB: '#10464b', spaceC: '#5b2154', spaceD: '#1b2b66', deep: '#0c071e',
      burst: '#c7b0ff', burstAmt: 0.32, inner: '#3a2468', glassBody: 0.72,
      rim: '#f3deff', rimAmt: 1.25, rimAlpha: 0.9, sky: '#c9b4ff', ground: '#62d2b2',
      halo: '#d9b8ff', haloAmt: 0.5, additive: true, starAmt: 1.0, moonA: '#b98be0', moonB: '#63c9b0'
    }
  };

  var GLSL_COMMON = [
    'float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
    'float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);',
    '  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), d=hash21(i+vec2(1.0,1.0));',
    '  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
    'float fbm(vec2 p){ float s=0.0; float a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; } return s*1.07; }',
    'vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }',
    'vec3 toSRGB(vec3 c){ return pow(clamp(c,0.0,1.0), vec3(1.0/2.2)); }'
  ].join('\n');

  var GLSL_NEBULA = [
    'uniform vec3 uSpaceA; uniform vec3 uSpaceB; uniform vec3 uSpaceC; uniform vec3 uSpaceD; uniform vec3 uDeep; uniform float uTime;',
    'vec3 nebula(vec2 p){',
    '  float t = uTime*0.010;',
    '  float n1 = fbm(p*1.05 + vec2(t, -t*0.6));',
    '  float n2 = fbm(p*1.9 + vec2(-t*0.8, t) + n1*1.5);',
    '  float n3 = fbm(p*0.75 - vec2(4.0, 2.0) + n2*0.9);',
    '  vec3 col = mix(uSpaceA, uSpaceB, smoothstep(0.30, 0.72, n1 + (p.x - p.y)*0.16));',
    '  col = mix(col, uSpaceC, smoothstep(0.42, 0.80, n2) * 0.78);',
    '  col = mix(col, uSpaceD, smoothstep(0.48, 0.86, n3) * 0.62);',
    '  col = mix(col, uDeep, smoothstep(0.58, 1.0, fbm(p*1.5 + 7.0)) * 0.30);',
    '  return col;',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ helpers */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function create(opts) {
    var THREE = root.THREE;
    var canvas = opts.canvas, stage = opts.stage, labelLayer = opts.labels;
    var reduced = !!opts.reducedMotion;
    var api = { ok: false };
    if (!THREE) { paintFallback(canvas, opts.theme || 'light'); return finishFallback(api, opts); }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { renderer = null; }
    if (!renderer || !renderer.getContext()) { paintFallback(canvas, opts.theme || 'light'); return finishFallback(api, opts); }
    api.ok = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 1);

    var V3 = THREE.Vector3, scene = new THREE.Scene();
    var FOV = 26, CAM_Z = 7.2;
    var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, CAM_Z);

    var themeName = opts.theme === 'dark' ? 'dark' : 'light', T = THEMES[themeName];
    var col = function (hex) { return new THREE.Color(hex); };
    var lin = function (hex) { return new THREE.Color(hex).convertSRGBToLinear(); };

    var shared = {                       // uniforms shared by several shaders
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uCenter: { value: new THREE.Vector2(0, 0) }, uRadius: { value: 100 },
      uSpaceA: { value: col(T.spaceA) }, uSpaceB: { value: col(T.spaceB) }, uSpaceC: { value: col(T.spaceC) }, uSpaceD: { value: col(T.spaceD) }, uDeep: { value: col(T.deep) },
      uSky: { value: col(T.sky) }, uGround: { value: col(T.ground) },
      uKey: { value: new V3(-0.55, 0.72, 0.62).normalize() }, uRimL: { value: new V3(0.5, 0.35, -0.8).normalize() },
      uGlow: { value: 0 }
    };

    /* ---------------------------------------------------------- lights (for standard materials) */
    var hemi = new THREE.HemisphereLight(lin(T.sky), lin(T.ground), 0.95);
    var key = new THREE.DirectionalLight(0xfff4ea, 1.15); key.position.set(-2.4, 3.2, 2.8);
    var rimLight = new THREE.DirectionalLight(lin('#ff9ccd'), 0.55); rimLight.position.set(2.2, 1.4, -3);
    scene.add(hemi, key, rimLight);

    /* ---------------------------------------------------------- backdrop */
    var bgMat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: Object.assign({ uBurst: { value: col(T.burst) }, uBurstAmt: { value: T.burstAmt } }, pick(shared, ['uTime', 'uRes', 'uCenter', 'uRadius', 'uSpaceA', 'uSpaceB', 'uSpaceC', 'uSpaceD', 'uDeep'])),
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
      fragmentShader: [
        'varying vec2 vUv; uniform vec2 uRes; uniform vec2 uCenter; uniform float uRadius; uniform vec3 uBurst; uniform float uBurstAmt;',
        GLSL_COMMON, GLSL_NEBULA,
        'void main(){',
        '  vec2 frag = vUv * uRes;',
        '  vec2 p = (frag - 0.5*uRes) / min(uRes.x, uRes.y) * 2.0;',
        '  vec3 col = nebula(p);',
        '  vec2 d = (frag - uCenter) / uRadius; float r = length(d); float ang = atan(d.y, d.x);',
        '  float rays = pow(0.5 + 0.5*sin(ang*9.0 + sin(ang*3.0 + uTime*0.05)*2.0 + uTime*0.03), 3.0)*0.6',
        '             + pow(0.5 + 0.5*sin(ang*23.0 - uTime*0.04), 6.0)*0.4;',
        '  float halo = exp(-max(r - 0.85, 0.0)*1.35);',
        '  col = mix(col, uBurst, clamp(halo*(0.30 + 0.5*rays)*uBurstAmt, 0.0, 1.0));',
        '  vec2 g = frag/26.0; vec2 gi = floor(g); float rnd = hash21(gi);',
        '  vec2 sp = fract(g) - 0.5 - (vec2(hash21(gi+1.7), hash21(gi+9.3)) - 0.5)*0.7;',
        '  float tw = 0.55 + 0.45*sin(uTime*(0.6 + rnd*1.8) + rnd*40.0);',
        '  float star = step(0.86, rnd) * smoothstep(0.09, 0.0, length(sp)) * tw;',
        '  col = mix(col, vec3(1.0), star*0.9);',
        '  float vg = smoothstep(0.75, 1.9, length(p)); col = mix(col, uDeep, vg*0.42);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bg.frustumCulled = false; bg.renderOrder = -100;
    scene.add(bg);

    /* ---------------------------------------------------------- textures drawn on canvas */
    function dotTexture(stops) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      var t = new THREE.CanvasTexture(c); return t;
    }
    function blossomTexture() {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'); g.translate(64, 64);
      for (var i = 0; i < 5; i++) {
        g.save(); g.rotate(i * Math.PI * 2 / 5);
        var gr = g.createRadialGradient(0, -30, 2, 0, -30, 30);
        gr.addColorStop(0, '#fff5fa'); gr.addColorStop(0.55, '#ffb3d1'); gr.addColorStop(1, '#f2579a');
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, -31, 21, 29, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      var cg = g.createRadialGradient(0, 0, 0, 0, 0, 13);
      cg.addColorStop(0, '#fff7c2'); cg.addColorStop(0.6, '#ffd257'); cg.addColorStop(1, 'rgba(255,170,60,0.9)');
      g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill();
      return new THREE.CanvasTexture(c);
    }
    var texSoft = dotTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.75)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    var texHalo = dotTexture([[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,255,255,0.42)'], [0.7, 'rgba(255,255,255,0.10)'], [1, 'rgba(255,255,255,0)']]);
    var texBlossom = blossomTexture();

    /* ---------------------------------------------------------- sparkle points */
    function sparkleMaterial(sizeScale) {
      return new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: shared.uTime, uScale: { value: sizeScale }, uPx: { value: 1 }, uAmt: { value: 1 } },
        vertexShader: [
          'attribute float aSize; attribute float aPhase; attribute vec3 aColor; uniform float uTime; uniform float uScale; uniform float uPx;',
          'varying vec3 vC; varying float vTw; varying float vStar;',
          'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);',
          '  vTw = 0.35 + 0.65*pow(0.5 + 0.5*sin(uTime*(0.7 + fract(aPhase*7.31)*2.2) + aPhase*6.2831), 3.0);',
          '  vStar = max(step(0.72, fract(aPhase*13.7)), step(55.0, aSize)); vC = aColor;',
          '  gl_PointSize = aSize * uScale * uPx * (0.6 + 0.4*vTw) / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }'
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vC; varying float vTw; varying float vStar; uniform float uAmt;',
          'void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p);',
          '  float core = smoothstep(0.5, 0.0, d); core *= core;',
          '  float ray = max(0.0, 1.0 - abs(p.x)*22.0)*max(0.0, 1.0 - abs(p.y)*2.2) + max(0.0, 1.0 - abs(p.y)*22.0)*max(0.0, 1.0 - abs(p.x)*2.2);',
          '  float a = clamp(core*1.2 + ray*vStar*0.9, 0.0, 1.0) * vTw * uAmt;',
          '  gl_FragColor = vec4(mix(vC, vec3(1.0), core*0.6) * a, a); }'
        ].join('\n'),
        premultipliedAlpha: true
      });
    }
    function sparklePoints(n, place, sizeScale) {
      var pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n), c = new Float32Array(n * 3);
      var p = new V3(), cc = new THREE.Color();
      for (var i = 0; i < n; i++) {
        var info = place(i, p, cc) || {};
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        size[i] = info.size || 1; ph[i] = info.phase != null ? info.phase : Math.random();
        c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
      g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
      g.setAttribute('aColor', new THREE.BufferAttribute(c, 3));
      var m = new THREE.Points(g, sparkleMaterial(sizeScale));
      m.frustumCulled = false;
      return m;
    }
    var GLITTER = ['#ffffff', '#ffe9a8', '#ffc4de', '#c9f7e6', '#e6d4ff', '#ffd24a'];
    var R = rng(20261116);

    // far stars
    var stars = sparklePoints(360, function (i, p, c) {
      var a = R() * Math.PI * 2, r = 3.2 + R() * 8.5;
      p.set(Math.cos(a) * r * 1.5, (R() - 0.5) * 9, -3 - R() * 9);
      c.set(GLITTER[(R() * 5) | 0]);
      return { size: 22 + R() * R() * 90, phase: R() };
    }, 1);
    stars.renderOrder = -90; scene.add(stars);

    /* ---------------------------------------------------------- planet groups */
    var system = new THREE.Group();          // sits where the stage is on screen
    var planet = new THREE.Group();          // rotates with drag / sway
    system.add(planet); scene.add(system);

    // glow behind the sphere
    var haloMat = new THREE.SpriteMaterial({ map: texHalo, color: col(T.halo), transparent: true, depthWrite: false, depthTest: false, opacity: T.haloAmt });
    var halo = new THREE.Sprite(haloMat); halo.scale.set(3.5, 3.5, 1); halo.renderOrder = -60; system.add(halo);

    // two small moons for company
    var moonMatA = new THREE.MeshStandardMaterial({ color: lin(T.moonA), roughness: 1 });
    var moonMatB = new THREE.MeshStandardMaterial({ color: lin(T.moonB), roughness: 1 });
    var moonA = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 20), moonMatA); moonA.position.set(-1.72, 1.2, -1.6);
    var moonB = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), moonMatB); moonB.position.set(1.78, -1.12, -1.2);
    var moonRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 60), new THREE.MeshBasicMaterial({ color: col('#ffffff'), transparent: true, opacity: 0.7 }));
    moonRing.rotation.set(1.25, 0.2, 0.3); moonA.add(moonRing);
    system.add(moonA, moonB);

    var glints = sparklePoints(34, function (i, p, c) {
      var a = R() * Math.PI * 2, r = 1.25 + R() * 1.5;
      p.set(Math.cos(a) * r, Math.sin(a) * r * 0.8, -0.9 + R() * 1.4);
      c.set(GLITTER[(R() * 5) | 0]);
      return { size: 60 + R() * 110, phase: 0.72 + R() * 0.27 };       // phase > 0.72 → four-point star
    }, 1);
    system.add(glints);

    /* ---------------------------------------------------------- glass sphere */
    var glassUniforms = Object.assign({
      uInner: { value: col(T.inner) }, uBody: { value: T.glassBody },
      uRimColor: { value: col(T.rim) }, uRimAmt: { value: T.rimAmt }, uRimAlpha: { value: T.rimAlpha }
    }, pick(shared, ['uTime', 'uRes', 'uCenter', 'uRadius', 'uSpaceA', 'uSpaceB', 'uSpaceC', 'uSpaceD', 'uDeep']));
    var glassVert = 'varying vec3 vN; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz; vN = normalMatrix*normal; gl_Position = projectionMatrix*mv; }';
    var sphereGeo = new THREE.SphereGeometry(1, 96, 64);
    var glassBack = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, uniforms: glassUniforms, vertexShader: glassVert,
      fragmentShader: [
        'varying vec3 vN; varying vec3 vP; uniform vec2 uRes; uniform vec2 uCenter; uniform float uRadius; uniform vec3 uInner; uniform float uBody;',
        GLSL_COMMON, GLSL_NEBULA,
        'void main(){',
        '  vec3 N = normalize(vN); vec2 d = N.xy; float edge = clamp(length(d), 0.0, 1.0);',
        '  vec2 frag = uCenter - d*uRadius*(0.5 + 0.8*edge*edge);',           // the world seen through a ball: upside down
        '  vec2 p = (frag - 0.5*uRes)/min(uRes.x,uRes.y)*2.0;',
        '  vec3 col = nebula(p*0.85 + 3.0);',
        '  float lift = 0.42 + 0.30*(1.0 - edge) + 0.12*d.y;',
        '  col = mix(col, uInner, clamp(lift, 0.0, 1.0));',
        '  float caus = pow(max(dot(normalize(d + 1e-4), normalize(vec2(0.55,-0.83))), 0.0), 5.0)*smoothstep(0.55, 0.95, edge)*(1.0 - smoothstep(0.95, 1.0, edge));',
        '  col = mix(col, vec3(1.0,0.96,0.98), caus*0.55);',
        '  gl_FragColor = vec4(col, uBody*(0.80 + 0.2*edge));',
        '}'
      ].join('\n')
    }));
    glassBack.renderOrder = -50;
    var glassFront = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
      side: THREE.FrontSide, transparent: true, depthWrite: false, premultipliedAlpha: true, uniforms: glassUniforms, vertexShader: glassVert,
      fragmentShader: [
        'varying vec3 vN; varying vec3 vP; uniform float uTime; uniform vec3 uRimColor; uniform float uRimAmt; uniform float uRimAlpha;',
        'void main(){',
        '  vec3 N = normalize(vN); vec3 V = normalize(-vP);',
        '  float ndv = clamp(dot(N,V), 0.0, 1.0); float fres = pow(1.0 - ndv, 2.6);',
        '  vec3 Rr = reflect(-V, N);',
        '  vec3 L1 = normalize(vec3(-0.50, 0.70, 0.52));',
        '  float s1 = pow(max(dot(Rr,L1),0.0), 240.0)*1.2 + pow(max(dot(Rr,L1),0.0), 22.0)*0.16;',
        '  vec2 w = Rr.xy - vec2(-0.47, 0.50);',                                  // a tall window, reflected
        '  float win = smoothstep(0.17, 0.11, abs(w.x))*smoothstep(0.25, 0.17, abs(w.y))*smoothstep(0.0, 0.3, Rr.z);',
        '  float bars = 1.0 - 0.75*max(smoothstep(0.014, 0.004, abs(w.x)), smoothstep(0.014, 0.004, abs(w.y + 0.03)));',
        '  win *= bars * (0.55 + 0.45*smoothstep(-0.25, 0.25, w.y));',
        '  vec3 L2 = normalize(vec3(0.62,-0.56,0.5));',
        '  float s2 = pow(max(dot(Rr,L2),0.0), 26.0)*0.30;',
        '  vec3 irid = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + fres*0.85 + N.y*0.22 + N.x*0.1 + uTime*0.008));',
        '  vec3 rim = mix(uRimColor, irid, 0.42) * uRimAmt;',
        '  float edgeLine = smoothstep(0.72, 1.0, fres);',
        '  float aRim = clamp(fres*uRimAlpha + edgeLine*0.25, 0.0, 1.0);',
        '  float aSpec = clamp(s1 + win*0.62 + s2, 0.0, 1.0);',
        '  vec3 colr = rim*aRim*(1.0 - aSpec) + vec3(1.0)*aSpec;',
        '  float a = clamp(aRim*(1.0 - aSpec) + aSpec, 0.0, 1.0);',
        '  gl_FragColor = vec4(colr, a);',
        '}'
      ].join('\n')
    }));
    glassFront.renderOrder = 50;
    system.add(glassBack, glassFront);

    /* ---------------------------------------------------------- surface builders */
    function Buf() { this.pos = []; this.nor = []; this.uv = []; this.seed = []; this.idx = []; }
    Buf.prototype.geometry = function () {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
      g.setAttribute('aSeed', new THREE.Float32BufferAttribute(this.seed, 1));
      g.setIndex(this.idx);
      return g;
    };
    var _p = new V3(), _a = new V3(), _b = new V3(), _du = new V3(), _dv = new V3(), _n = new V3();
    // fn(u in 0..1, v in -1..1, out) → point. matrix places it; normals by central differences.
    function addSurface(buf, nu, nv, fn, matrix, seed, uvFn) {
      var base = buf.pos.length / 3, e = 0.004, nm = matrix ? new THREE.Matrix3().getNormalMatrix(matrix) : null;
      for (var i = 0; i <= nu; i++) {
        for (var j = 0; j <= nv; j++) {
          var u = i / nu, v = -1 + 2 * j / nv;
          fn(u, v, _p);
          var uu = clamp(u, e, 1 - 3 * e), vv = clamp(v, -1 + e, 1 - e);
          fn(uu + e, vv, _a); fn(uu - e, vv, _b); _du.subVectors(_a, _b);
          fn(uu, vv + e, _a); fn(uu, vv - e, _b); _dv.subVectors(_a, _b);
          _n.crossVectors(_du, _dv).normalize();
          if (matrix) { _p.applyMatrix4(matrix); _n.applyMatrix3(nm).normalize(); }
          buf.pos.push(_p.x, _p.y, _p.z); buf.nor.push(_n.x, _n.y, _n.z);
          if (uvFn) { var q = uvFn(u, v); buf.uv.push(q[0], q[1]); } else buf.uv.push(u, v);
          buf.seed.push(seed);
        }
      }
      for (var a = 0; a < nu; a++) for (var b = 0; b < nv; b++) {
        var i0 = base + a * (nv + 1) + b, i1 = i0 + (nv + 1);
        buf.idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
    }
    // A curved spine in the YZ plane: angle from +Y goes th0 → th1 along the length.
    function spine(th0, th1, pw, len) {
      var N = 200, ys = new Float32Array(N + 1), zs = new Float32Array(N + 1), y = 0, z = 0;
      var th = function (u) { return th0 + (th1 - th0) * (1 - Math.pow(1 - u, pw)); };
      for (var i = 1; i <= N; i++) { var t = th((i - 0.5) / N); y += Math.cos(t) * len / N; z += Math.sin(t) * len / N; ys[i] = y; zs[i] = z; }
      return {
        th: th,
        at: function (u, o) { var f = clamp(u, 0, 1) * N, k = Math.min(N - 1, Math.floor(f)), r = f - k; o.y = ys[k] + (ys[k + 1] - ys[k]) * r; o.z = zs[k] + (zs[k + 1] - zs[k]) * r; }
      };
    }

    /* ---------------------------------------------------------- the hibiscus */
    var flower = new THREE.Group();
    var AXIS = new V3(0.36, 0.56, 0.75).normalize();
    flower.quaternion.setFromUnitVectors(new V3(0, 1, 0), AXIS);
    flower.rotateY(0.5);
    flower.position.set(-0.10, -0.17, -0.12);
    flower.scale.setScalar(0.93);
    planet.add(flower);

    var petals = new Buf(), o2 = { y: 0, z: 0 };
    for (var pi = 0; pi < 5; pi++) {
      (function (k) {
        var len = 0.97 + R() * 0.08, W = 0.60 + R() * 0.04;
        var sp = spine(0.13 + R() * 0.04, 1.92 + R() * 0.2, 1.7 + R() * 0.25, len);
        var ph = R() * 6.28, ph2 = R() * 6.28;
        var width = function (u) { return W * len * (0.05 + 0.95 * Math.pow(u, 0.62) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 6)))); };
        var fn = function (u, v, o) {
          sp.at(u, o2); var t = sp.th(u), w = width(u), av = Math.abs(v);
          var edge = 1 + 0.035 * Math.sin(v * 8 + ph) * smooth(0.6, 1, u);            // gently scalloped tip
          var x = v * w * edge;
          var h = 0.15 * w * v * v * (1 - 0.75 * u)                                  // cupped toward the throat
                + 0.075 * v * (w / (W * len)) * (0.3 + 0.7 * u)                      // one edge over its neighbour
                + (0.050 * Math.sin(v * 5.6 + ph + u * 3) + 0.028 * Math.sin(v * 12.5 - ph2 + u * 5.2)) * smooth(0.3, 1, u) * (0.3 + 0.7 * Math.pow(av, 1.2))
                + 0.006 * Math.sin(u * 37 + v * 9 + ph) * Math.sin(v * 29 + ph2) * u
                - 0.018 * Math.exp(-v * v / 0.02) * u * (1 - u);                     // midrib crease
          o.set(x, o2.y + Math.sin(t) * h, o2.z - Math.cos(t) * h);
        };
        var m = new THREE.Matrix4().makeRotationY(k * Math.PI * 2 / 5 + (R() - 0.5) * 0.07);
        addSurface(petals, 54, 30, fn, m, k / 5 + 0.07);
      })(pi);
    }
    var surfaceVert = [
      'attribute float aSeed; varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying float vSeed; uniform float uTime; uniform float uSway;',
      'void main(){ vUv = uv; vSeed = aSeed; vec3 p = position;',
      '  p += normal * sin(uTime*0.8 + aSeed*6.0 + uv.x*2.4) * 0.010 * uv.x*uv.x * uSway;',
      '  vec4 mv = modelViewMatrix*vec4(p,1.0); vP = mv.xyz; vN = normalMatrix*normal; gl_Position = projectionMatrix*mv; }'
    ].join('\n');
    var BUMP = [
      'float fbm3(vec2 p){ float s=0.0; float a=0.5; for(int i=0;i<3;i++){ s+=a*vnoise(p); p=p*2.03+vec2(17.1,9.2); a*=0.5; } return s; }',
      'vec3 bumpUV(vec3 N, vec3 P, vec2 uv, vec2 grad, float s){',
      '  vec3 dp1 = dFdx(P), dp2 = dFdy(P); vec2 d1 = dFdx(uv), d2 = dFdy(uv);',
      '  vec3 p2 = cross(dp2, N), p1 = cross(N, dp1);',
      '  vec3 T = p2*d1.x + p1*d2.x; vec3 B = p2*d1.y + p1*d2.y;',
      '  float inv = inversesqrt(max(dot(T,T), dot(B,B)) + 1e-12);',
      '  return normalize(N - s*(grad.x*T + grad.y*B)*inv); }'
    ].join('\n');
    var petalMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, extensions: { derivatives: true },
      uniforms: { uTime: shared.uTime, uSway: { value: reduced ? 0 : 1 }, uKey: shared.uKey, uRimL: shared.uRimL, uSky: shared.uSky, uGround: shared.uGround, uGlow: shared.uGlow, uGlitter: { value: 1 } },
      vertexShader: surfaceVert,
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying float vSeed;',
        'uniform float uTime; uniform vec3 uKey; uniform vec3 uRimL; uniform vec3 uSky; uniform vec3 uGround; uniform float uGlow; uniform float uGlitter;',
        GLSL_COMMON, BUMP,
        'vec3 ramp(float t){',
        '  vec3 c = mix(vec3(0.22,0.006,0.065), vec3(0.50,0.018,0.14), smoothstep(0.02, 0.16, t));',
        '  c = mix(c, vec3(0.80,0.04,0.22), smoothstep(0.13, 0.38, t));',
        '  c = mix(c, vec3(0.93,0.10,0.32), smoothstep(0.34, 0.70, t));',
        '  c = mix(c, vec3(1.00,0.34,0.55), smoothstep(0.74, 1.00, t));',
        '  return c; }',
        'float veins(vec2 uv, float seed){ float u = uv.x, v = uv.y;',
        '  float wob = 0.03*sin(u*8.0 + v*5.0 + seed*9.0);',
        '  float a = abs(fract(v*5.5 + wob + 0.5) - 0.5)*2.0; float mainV = 1.0 - smoothstep(0.0, 0.045 + 0.11*u, a);',
        '  float b = abs(fract(v*16.5 + wob*2.5 + 0.5) - 0.5)*2.0; float fine = 1.0 - smoothstep(0.0, 0.2, b);',
        '  float fade = smoothstep(0.03, 0.22, u)*(1.0 - smoothstep(0.5, 0.98, u));',
        '  return (mainV*0.85 + fine*0.4)*fade; }',
        'float petalH(vec2 uv, float seed){ return -veins(uv, seed)*0.55 + fbm3(uv*vec2(15.0,10.0) + seed*5.0)*0.75; }',
        'void main(){',
        '  float front = gl_FrontFacing ? 1.0 : -1.0;',
        '  vec3 N = normalize(vN)*front; vec3 V = normalize(-vP);',
        '  float u = vUv.x, v = vUv.y;',
        '  float vein = veins(vUv, vSeed);',
        '  float mott = fbm(vUv*vec2(9.0,6.0) + vSeed*13.0);',
        '  float h0 = petalH(vUv, vSeed); float e = 0.006;',
        '  vec2 grad = vec2(petalH(vUv + vec2(e,0.0), vSeed) - h0, petalH(vUv + vec2(0.0,e), vSeed) - h0)/e;',
        '  N = bumpUV(N, vP, vUv, grad, 0.035);',
        '  float t = clamp(u + 0.10*v*v*u - 0.04 + (mott - 0.5)*0.12, 0.0, 1.0);',
        '  vec3 base = ramp(t);',
        '  base = mix(base, base*vec3(0.62,0.42,0.52), vein*0.42);',
        '  base *= 0.92 + 0.16*mott;',
        '  if(front < 0.0) base = mix(base, vec3(1.0,0.60,0.75), 0.38);',
        '  vec3 alb = toLin(base);',
        '  vec3 L = normalize(uKey); vec3 Lr = normalize(uRimL);',
        '  float ndl = dot(N,L); float wrap = clamp((ndl + 0.55)/1.55, 0.0, 1.0);',
        '  float thru = pow(clamp(-ndl, 0.0, 1.0), 1.3)*0.55 + pow(clamp(dot(-N,Lr), 0.0, 1.0), 1.2)*0.5;',
        '  float hemi = 0.5 + 0.5*N.y;',
        '  vec3 amb = mix(toLin(uGround), toLin(uSky), hemi);',
        '  float ao = mix(0.36, 1.0, smoothstep(0.0, 0.44, u));',
        '  ao *= 1.0 - 0.24*smoothstep(0.3, 1.0, -v)*(1.0 - smoothstep(0.45, 1.0, u));',
        '  vec3 colr = alb*(amb*0.40 + vec3(1.0,0.95,0.90)*wrap*0.86)*ao;',
        '  colr += alb*toLin(vec3(1.0,0.42,0.46))*thru*1.15*ao;',                      // light glowing through the petal
        '  vec3 H = normalize(L + V); float nh = max(dot(N,H), 0.0);',
        '  colr += vec3(pow(nh, 16.0)*0.13 + pow(nh, 64.0)*0.10)*ao;',
        '  float fres = pow(1.0 - max(dot(N,V), 0.0), 3.0);',
        '  colr += toLin(vec3(1.0,0.62,0.78))*fres*0.20*(0.35 + 0.65*hemi);',         // velvet edge
        '  colr += alb*uGlow*0.40;',
        '  vec2 gp = vUv*vec2(58.0,37.0); vec2 gi = floor(gp); float rnd = hash21(gi + vSeed*31.0);',
        '  vec2 gf = fract(gp) - 0.5 + (vec2(hash21(gi+3.1), hash21(gi+7.7)) - 0.5)*0.5;',
        '  float tw = pow(0.5 + 0.5*sin(uTime*(1.1 + rnd*2.4) + rnd*50.0 + dot(V.xy, vec2(15.0,11.0))), 10.0);',
        '  colr += vec3(1.0,0.93,0.88)*step(0.955, rnd)*(0.25 + tw)*smoothstep(0.22, 0.0, length(gf))*1.5*uGlitter*smoothstep(0.1, 0.5, u);',
        '  gl_FragColor = vec4(toSRGB(colr), 1.0);',
        '}'
      ].join('\n')
    });
    flower.add(new THREE.Mesh(petals.geometry(), petalMat));

    // tapering tube along a curve
    function taperTube(curve, segs, radial, rFn, closed) {
      var fr = curve.computeFrenetFrames(segs, !!closed), pos = [], nor = [], uv = [], idx = [], p = new V3();
      for (var i = 0; i <= segs; i++) {
        var t = i / segs; curve.getPointAt(closed && i === segs ? 0 : t, p);
        var k = closed && i === segs ? 0 : i, N = fr.normals[k], B = fr.binormals[k], r = rFn(t);
        for (var j = 0; j <= radial; j++) {
          var a = j / radial * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a);
          var nx = cx * N.x + sy * B.x, ny = cx * N.y + sy * B.y, nz = cx * N.z + sy * B.z;
          pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r); nor.push(nx, ny, nz); uv.push(t, j / radial);
        }
      }
      for (var a2 = 0; a2 < segs; a2++) for (var b2 = 0; b2 < radial; b2++) {
        var i0 = a2 * (radial + 1) + b2, i1 = i0 + radial + 1;
        idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }

    // staminal column: the long tube hibiscus are known for, dusted with anthers, five stigma pads at the tip
    var colCurve = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0.004, 0.26, 0.0), new V3(0.02, 0.54, 0.012), new V3(0.055, 0.82, 0.04), new V3(0.12, 1.08, 0.085)]);
    var colGeo = taperTube(colCurve, 60, 12, function (t) { return 0.034 - 0.017 * t; });
    (function tint() {                     // crimson at the throat → pale blush at the tip
      var n = colGeo.attributes.position.count, cols = new Float32Array(n * 3), uvA = colGeo.attributes.uv;
      var c0 = lin('#b3123f'), c1 = lin('#ff6f9d'), c2 = lin('#ffd9e6'), c = new THREE.Color();
      for (var i = 0; i < n; i++) { var t = uvA.getX(i); if (t < 0.5) c.copy(c0).lerp(c1, t * 2); else c.copy(c1).lerp(c2, (t - 0.5) * 2); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
      colGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    })();
    flower.add(new THREE.Mesh(colGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 })));

    var ANTHERS = 84, frames = colCurve.computeFrenetFrames(100, false);
    var antherMat = new THREE.MeshStandardMaterial({ color: lin('#ffd23f'), emissive: lin('#ff9d00'), emissiveIntensity: 0.55, roughness: 0.45 });
    var anthers = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), antherMat, ANTHERS);
    var filaments = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 5, 1), new THREE.MeshStandardMaterial({ color: lin('#ffc4d6'), roughness: 0.6 }), ANTHERS);
    var antherPts = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new V3(), P0 = new V3(), P1 = new V3(), D = new V3(), UP = new V3(0, 1, 0);
    for (var ai = 0; ai < ANTHERS; ai++) {
      var tt = 0.50 + 0.44 * (ai / ANTHERS) + (R() - 0.5) * 0.03, fi = Math.round(tt * 100), ang = ai * 2.399963 + R() * 0.5;
      colCurve.getPointAt(tt, P0);
      D.copy(frames.normals[fi]).multiplyScalar(Math.cos(ang)).addScaledVector(frames.binormals[fi], Math.sin(ang)).addScaledVector(frames.tangents[fi], 0.45 + R() * 0.3).normalize();
      var fl = 0.055 + R() * 0.04;
      P1.copy(P0).addScaledVector(D, fl);
      Q.setFromUnitVectors(UP, D);
      S.set(0.0035, fl, 0.0035); M.compose(P0.clone().addScaledVector(D, fl / 2), Q, S); filaments.setMatrixAt(ai, M);
      var as = 0.017 + R() * 0.008; S.set(as * 1.25, as * 0.8, as); M.compose(P1, Q, S); anthers.setMatrixAt(ai, M);
      antherPts.push(P1.clone());
    }
    flower.add(filaments, anthers);
    var stigmaMat = new THREE.MeshStandardMaterial({ color: lin('#a50f3a'), emissive: lin('#5c0420'), emissiveIntensity: 0.5, roughness: 0.9 });
    var tipP = colCurve.getPointAt(1), tipT = frames.tangents[100], tipN = frames.normals[100], tipB = frames.binormals[100];
    for (var si = 0; si < 5; si++) {
      var sa = si * Math.PI * 2 / 5 + 0.3;
      D.copy(tipT).multiplyScalar(0.75).addScaledVector(tipN, Math.cos(sa) * 0.7).addScaledVector(tipB, Math.sin(sa) * 0.7).normalize();
      var e1 = tipP.clone().addScaledVector(D, 0.075);
      var br = new THREE.Mesh(taperTube(new THREE.LineCurve3(tipP.clone(), e1), 2, 6, function () { return 0.008; }), new THREE.MeshStandardMaterial({ color: lin('#ffb2c8'), roughness: 0.6 }));
      var pad = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), stigmaMat); pad.position.copy(e1); pad.scale.set(1, 0.8, 1);
      flower.add(br, pad);
    }

    /* ---------------------------------------------------------- greenery */
    var leafMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, extensions: { derivatives: true },
      uniforms: { uTime: shared.uTime, uSway: { value: reduced ? 0 : 0.6 }, uKey: shared.uKey, uRimL: shared.uRimL, uSky: shared.uSky, uGround: shared.uGround },
      vertexShader: surfaceVert,
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying float vSeed;',
        'uniform vec3 uKey; uniform vec3 uRimL; uniform vec3 uSky; uniform vec3 uGround;',
        GLSL_COMMON, BUMP,
        'void main(){',
        '  float front = gl_FrontFacing ? 1.0 : -1.0; vec3 N = normalize(vN)*front; vec3 V = normalize(-vP);',
        '  float u = vUv.x, v = vUv.y; float av = abs(v);',
        '  float mid = 1.0 - smoothstep(0.0, 0.045, av);',
        '  float lat = abs(fract((u - 0.55*av)*8.0 + vSeed) - 0.5)*2.0; float latV = (1.0 - smoothstep(0.0, 0.16, lat))*smoothstep(0.03, 0.2, av)*(1.0 - smoothstep(0.75, 1.0, av));',
        '  float vein = clamp(mid + latV*0.7, 0.0, 1.0);',
        '  float mott = fbm(vUv*vec2(11.0,7.0) + vSeed*23.0);',
        '  vec2 lg = vec2(fbm3((vUv + vec2(0.01,0.0))*vec2(11.0,7.0) + vSeed*23.0), fbm3((vUv + vec2(0.0,0.01))*vec2(11.0,7.0) + vSeed*23.0)) - fbm3(vUv*vec2(11.0,7.0) + vSeed*23.0);',
        '  N = bumpUV(N, vP, vUv, lg/0.01 + vec2(0.0, sign(v)*mid*3.0), 0.03);',
        '  vec3 base = mix(vec3(0.07,0.33,0.17), vec3(0.22,0.58,0.27), smoothstep(0.0, 0.9, u*0.6 + mott*0.6));',
        '  base = mix(base, vec3(0.55,0.83,0.42), vein*0.5);',
        '  base = mix(base, vec3(0.45,0.72,0.36), fract(vSeed*7.13)*0.35);',
        '  if(front < 0.0) base = mix(base, vec3(0.58,0.78,0.52), 0.5);',
        '  vec3 alb = toLin(base);',
        '  vec3 L = normalize(uKey); float ndl = dot(N,L); float wrap = clamp((ndl + 0.35)/1.35, 0.0, 1.0);',
        '  float thru = pow(clamp(-ndl, 0.0, 1.0), 1.5)*0.6 + pow(clamp(dot(-N, normalize(uRimL)), 0.0, 1.0), 1.4)*0.4;',
        '  float hemi = 0.5 + 0.5*N.y; vec3 amb = mix(toLin(uGround), toLin(uSky), hemi);',
        '  vec3 colr = alb*(amb*0.6 + vec3(1.0,0.97,0.9)*wrap*1.05);',
        '  colr += alb*toLin(vec3(0.75,1.0,0.45))*thru*1.3;',
        '  vec3 H = normalize(L + V); float nh = max(dot(N,H), 0.0);',
        '  colr += vec3(pow(nh, 48.0)*0.38 + pow(nh, 9.0)*0.06)*step(0.0, front);',
        '  float fres = pow(1.0 - max(dot(N,V), 0.0), 4.0); colr += toLin(uSky)*fres*0.22;',
        '  gl_FragColor = vec4(toSRGB(colr), 1.0);',
        '}'
      ].join('\n')
    });
    var green = new Buf();
    // an ovate, serrated hibiscus leaf along +Z, upper face +Y
    function hibiscusLeaf(len, wid, k) {
      var sp = spine(1.25, 1.95, 1.0, len), ph = k * 4.1;
      return function (u, v, o) {
        sp.at(u, o2); var t = sp.th(u);
        var w = wid * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.78)), 0.85) * (1 + 0.07 * Math.abs(((u * 11) % 1) - 0.5) * 2 * smooth(0.1, 0.3, u));
        var h = 0.30 * Math.abs(v) * w + 0.012 * Math.sin(u * 13 + v * 3 + ph) + 0.02 * Math.sin(v * 4 + ph) * u;
        o.set(v * w, o2.y + Math.sin(t) * h, o2.z - Math.cos(t) * h);
      };
    }
    // a five-lobed ivy leaf, flat in XZ, tip along +Z
    function ivyLeaf(k) {
      var lobes = [[0, 1.0], [1.08, 0.80], [-1.08, 0.80], [2.2, 0.56], [-2.2, 0.56]];
      return {
        fn: function (u, v, o) {
          var phi = v * Math.PI, r = 0.30;
          for (var i = 0; i < 5; i++) r = Math.max(r, lobes[i][1] * Math.pow(Math.max(0, Math.cos(phi - lobes[i][0])), 5) * 0.7 + 0.30);
          r *= 1 - 0.45 * Math.pow(Math.max(0, -Math.cos(phi)), 10);
          var x = Math.sin(phi) * r * u, z = Math.cos(phi) * r * u;
          o.set(x, -0.22 * (x * x + 0.4 * z * z) + 0.03 * Math.sin(x * 9 + k), z);
        },
        uv: function (u, v) { var phi = v * Math.PI; return [0.5 + 0.5 * Math.cos(phi) * u, Math.sin(phi) * u]; }
      };
    }
    function basis(pos, dir, up, scale) {
      var z = dir.clone().normalize(), y = up.clone().addScaledVector(z, -up.dot(z)).normalize(), x = new V3().crossVectors(y, z);
      var m = new THREE.Matrix4().makeBasis(x, y, z); m.scale(new V3(scale, scale, scale)); m.setPosition(pos); return m;
    }

    // sepals + calyx cup, in flower space
    var calyx = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.0, -0.20), new THREE.Vector2(0.045, -0.19), new THREE.Vector2(0.078, -0.10), new THREE.Vector2(0.074, -0.01), new THREE.Vector2(0.092, 0.05)], 20),
      new THREE.MeshStandardMaterial({ color: lin('#4f9a4a'), roughness: 0.7, side: THREE.DoubleSide }));
    flower.add(calyx);
    var sepals = new Buf();
    for (var qi = 0; qi < 5; qi++) {
      (function (k) {
        var sp = spine(0.25, 1.35, 1.2, 0.30);
        addSurface(sepals, 10, 6, function (u, v, o) { sp.at(u, o2); var w = 0.062 * Math.pow(Math.sin(Math.PI * Math.pow(u * 0.96 + 0.02, 0.6)), 0.9); o.set(v * w, o2.y - 0.03, o2.z + 0.05 + 0.04 * v * v * w); },
          new THREE.Matrix4().makeRotationY((k + 0.5) * Math.PI * 2 / 5), 0.3 + k * 0.11);
      })(qi);
    }
    flower.add(new THREE.Mesh(sepals.geometry(), leafMat));

    // stem: leaves the calyx, sweeps down the back of the sphere and ends in a curl — nothing roots it
    flower.updateMatrixWorld(true); planet.updateMatrixWorld(true);
    var toPlanet = function (v) { return v.clone().applyMatrix4(flower.matrix); };
    var s0 = toPlanet(new V3(0, -0.19, 0)), sDir = AXIS.clone().multiplyScalar(-1);
    var stemCurve = new THREE.CatmullRomCurve3([
      s0, s0.clone().addScaledVector(sDir, 0.16), new V3(-0.10, -0.42, -0.52), new V3(-0.02, -0.63, -0.40),
      new V3(0.14, -0.76, -0.18), new V3(0.20, -0.72, 0.04), new V3(0.10, -0.63, 0.12), new V3(0.04, -0.66, 0.05)
    ], false, 'catmullrom', 0.5);
    var stemMat = new THREE.MeshStandardMaterial({ color: lin('#4c9447'), roughness: 0.65 });
    planet.add(new THREE.Mesh(taperTube(stemCurve, 90, 10, function (t) { return 0.026 * (1 - t * 0.93) + 0.002; }), stemMat));
    [[0.20, new V3(-0.80, -0.16, 0.58), 0.84, 0.27], [0.34, new V3(0.86, -0.02, 0.50), 0.86, 0.27], [0.52, new V3(-0.30, -0.62, 0.72), 0.40, 0.16]].forEach(function (L, i) {
      var at = stemCurve.getPointAt(L[0]), dir = L[1].clone().normalize();
      var pet = at.clone().addScaledVector(dir, 0.07);
      planet.add(new THREE.Mesh(taperTube(new THREE.LineCurve3(at, pet), 2, 6, function () { return 0.008; }), stemMat));
      addSurface(green, 26, 14, hibiscusLeaf(L[2], L[3], i + 1), basis(pet, dir, new V3(0.1, 0.75, 0.65), 1), 0.2 + i * 0.27);
    });

    /* ---------------------------------------------------------- ivy garland: the planet's ring */
    var ring = new THREE.Group(); ring.rotation.set(0.40, 0, -0.14);
    system.add(ring);
    var RING_R = 1.36;
    function ringCurve(phase, wob) {
      var pts = [];
      for (var i = 0; i < 64; i++) { var a = i / 64 * Math.PI * 2; pts.push(new V3(Math.cos(a) * (RING_R + 0.034 * Math.sin(a * 7 + phase)), 0.032 * Math.sin(a * 9 + phase * 2) * wob, Math.sin(a) * (RING_R + 0.034 * Math.sin(a * 7 + phase)))); }
      return new THREE.CatmullRomCurve3(pts, true);
    }
    var vineA = ringCurve(0, 1), vineB = ringCurve(Math.PI, 1);
    var vineMat = new THREE.MeshStandardMaterial({ color: lin('#5e8f3e'), roughness: 0.8 });
    ring.add(new THREE.Mesh(taperTube(vineA, 300, 7, function () { return 0.011; }, true), vineMat));
    ring.add(new THREE.Mesh(taperTube(vineB, 300, 7, function () { return 0.008; }, true), vineMat));
    var IVY = 58, tmpT = new V3(), radial = new V3(), nUp = new V3(0, 1, 0);
    for (var vi = 0; vi < IVY; vi++) {
      var vt = (vi + R() * 0.5) / IVY, cur = vi % 2 ? vineA : vineB, at2 = cur.getPointAt(vt % 1);
      cur.getTangentAt(vt % 1, tmpT); radial.copy(at2).setY(0).normalize();
      var side = vi % 2 ? 1 : -1, sz = 0.085 + R() * 0.07;
      var dir2 = tmpT.clone().multiplyScalar(0.55 * (R() < 0.5 ? 1 : -1)).addScaledVector(nUp, 0.75 * side).addScaledVector(radial, 0.25 + R() * 0.5).normalize();
      var up2 = radial.clone().multiplyScalar(0.85).addScaledVector(nUp, 0.4 * side).add(new V3((R() - 0.5) * 0.6, (R() - 0.5) * 0.6, (R() - 0.5) * 0.6));
      var lf = ivyLeaf(vi);
      addSurface(green, 3, 30, lf.fn, basis(at2, dir2, up2, sz), R(), lf.uv);
    }
    var greenery = new THREE.Mesh(green.geometry(), leafMat);
    // leaves on the stem live in planet space, ivy in ring space: split by building two meshes
    (function split() {
      // stem leaves were added first (3 surfaces of 27*15 vertices)
      var stemVerts = 3 * 27 * 15, stemIdx = 3 * 26 * 14 * 6;
      var g = greenery.geometry, gs = new THREE.BufferGeometry(), gi = new THREE.BufferGeometry();
      ['position', 'normal', 'uv', 'aSeed'].forEach(function (n) {
        var a = g.attributes[n], sz2 = a.itemSize;
        gs.setAttribute(n, new THREE.BufferAttribute(a.array.slice(0, stemVerts * sz2), sz2));
        gi.setAttribute(n, new THREE.BufferAttribute(a.array.slice(stemVerts * sz2), sz2));
      });
      var idx = Array.prototype.slice.call(g.index.array);
      gs.setIndex(idx.slice(0, stemIdx)); gi.setIndex(idx.slice(stemIdx).map(function (x) { return x - stemVerts; }));
      planet.add(new THREE.Mesh(gs, leafMat)); ring.add(new THREE.Mesh(gi, leafMat));
    })();
    // little blossoms tucked into the garland
    var blossomMat = new THREE.SpriteMaterial({ map: texBlossom, transparent: true, depthWrite: false });
    for (var bi = 0; bi < 11; bi++) {
      var bs = new THREE.Sprite(blossomMat), bp = vineA.getPointAt((bi / 11 + 0.03 + R() * 0.03) % 1), bsz = 0.085 + R() * 0.05;
      bs.position.copy(bp).add(new V3(0, 0.03 * (bi % 2 ? 1 : -1), 0)); bs.scale.set(bsz, bsz, 1); bs.material.rotation = R() * 6;
      ring.add(bs);
    }
    // fairy dust drifting along the ring; a few brighter beads stand for the day's small admin tasks
    var ringDust = sparklePoints(520, function (i, p, c) {
      var a = R() * Math.PI * 2, r = RING_R - 0.2 + Math.pow(R(), 0.8) * 0.52;
      p.set(Math.cos(a) * r, (R() - 0.5) * 0.07, Math.sin(a) * r);
      c.set(GLITTER[(R() * 6) | 0]);
      return { size: 5 + R() * R() * 20, phase: R() };
    }, 1);
    ring.add(ringDust);
    var ADMIN_MAX = 12, adminBeads = [];
    for (var ab = 0; ab < ADMIN_MAX; ab++) {
      var bead = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSoft, color: col('#fff2b8'), transparent: true, depthWrite: false }));
      bead.visible = false; ring.add(bead); adminBeads.push(bead);
    }

    /* ---------------------------------------------------------- glitter adrift inside the sphere */
    var motes = sparklePoints(240, function (i, p, c) {
      var r = Math.pow(R(), 0.5) * 0.92, a = R() * Math.PI * 2, y = (R() * 2 - 1);
      var s = Math.sqrt(1 - y * y); p.set(Math.cos(a) * s * r, y * r, Math.sin(a) * s * r);
      c.set(GLITTER[(R() * 6) | 0]);
      return { size: 4 + R() * R() * 15, phase: R() };
    }, 1);
    planet.add(motes);

    /* ---------------------------------------------------------- pollen: the six tasks */
    var SLOTS = [[-44, 40, 1], [-2, 63, 1], [58, 44, 1], [-62, -4, 0], [64, -6, 0], [30, -50, 0]];   // azimuth, elevation, primary?
    var spikeDirs = [];
    for (var sdi = 0; sdi < 46; sdi++) { var yy = 1 - 2 * (sdi + 0.5) / 46, rr = Math.sqrt(1 - yy * yy), aa = sdi * 2.399963; spikeDirs.push(new V3(Math.cos(aa) * rr, yy, Math.sin(aa) * rr)); }
    var grainGeo = new THREE.IcosahedronGeometry(1, 3);
    (function spike() {                    // hibiscus pollen grains really are spiky little spheres
      var pa = grainGeo.attributes.position, v = new V3();
      for (var i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).normalize(); var m = 0;
        for (var k = 0; k < spikeDirs.length; k++) m = Math.max(m, v.dot(spikeDirs[k]));
        v.multiplyScalar(0.80 + 0.36 * Math.pow(Math.max(0, m), 70)); pa.setXYZ(i, v.x, v.y, v.z);
      }
      grainGeo.computeVertexNormals();
    })();
    var orbs = [], tetherN = 11;
    SLOTS.forEach(function (sl, i) {
      var az = sl[0] * Math.PI / 180, el = sl[1] * Math.PI / 180, rad = 0.80;
      var home = new V3(Math.sin(az) * Math.cos(el) * rad, Math.sin(el) * rad, Math.cos(az) * Math.cos(el) * rad);
      var mat = new THREE.MeshStandardMaterial({ color: lin('#ffd24a'), emissive: lin('#ff9a1f'), emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.15, flatShading: true, transparent: true });
      var mesh = new THREE.Mesh(grainGeo, mat); mesh.userData.slot = i;
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo, color: col('#ffd978'), transparent: true, depthWrite: false }));
      var grp = new THREE.Group(); grp.add(mesh, glow); grp.position.copy(home); planet.add(grp);
      var from = antherPts[(8 + i * 13) % antherPts.length].clone().applyMatrix4(flower.matrix);
      orbs.push({ slot: i, primary: !!sl[2], home: home, grp: grp, mesh: mesh, mat: mat, glow: glow, from: from, state: 'empty', size: sl[2] ? 0.062 : 0.046, pulse: 0, title: '' });
    });
    var tethers = sparklePoints(SLOTS.length * tetherN, function (i, p, c) { p.set(0, 0, 0); c.set('#ffe08a'); return { size: 6 + (i % tetherN) * 0.9, phase: (i * 0.37) % 1 }; }, 1);
    planet.add(tethers);

    // burst particles for a finished task
    var BURST = 260, bPos = new Float32Array(BURST * 3), bVel = new Float32Array(BURST * 3), bLife = new Float32Array(BURST), bNext = 0;
    var bursts = sparklePoints(BURST, function (i, p, c) { p.set(0, -99, 0); c.set(GLITTER[i % 6]); return { size: 16 + (i % 7) * 4, phase: (i * 0.618) % 1 }; }, 1);
    bursts.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    system.add(bursts);

    /* ---------------------------------------------------------- labels */
    var chips = [];
    if (labelLayer) {
      labelLayer.textContent = '';
      orbs.forEach(function (o) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pollen-chip'; b.dataset.slot = String(o.slot);
        b.innerHTML = '<span class="pc-mark"></span><span class="pc-text"></span>';
        b.addEventListener('click', function () { if (pickCb) pickCb(o.slot, 'chip'); });
        labelLayer.appendChild(b); chips.push(b);
      });
    }
    var pickCb = null;

    /* ---------------------------------------------------------- state */
    function styleOrb(o) {
      var st = o.state, m = o.mat;
      if (st === 'empty') { m.color.copy(lin('#fff3cf')); m.emissive.copy(lin('#ffd98a')); m.emissiveIntensity = 0.25; m.opacity = 0.42; o.glow.material.color.set('#fff0c2'); o.glowAmt = 0.25; o.scale = 0.62; }
      else if (st === 'done') { m.color.copy(lin('#fff0f6')); m.emissive.copy(lin('#ff7fb5')); m.emissiveIntensity = 0.75; m.opacity = 1; o.glow.material.color.set('#ffb1d3'); o.glowAmt = 0.8; o.scale = 0.86; }
      else { m.color.copy(lin('#ffd24a')); m.emissive.copy(lin('#ff9a1f')); m.emissiveIntensity = st === 'active' ? 0.95 : 0.6; m.opacity = 1; o.glow.material.color.set('#ffd978'); o.glowAmt = st === 'active' ? 1.0 : 0.6; o.scale = 1; }
      var chip = chips[o.slot];
      if (chip) {
        chip.dataset.state = st; chip.dataset.tier = o.primary ? 'primary' : 'secondary';
        chip.querySelector('.pc-mark').textContent = st === 'done' ? '✓' : o.primary ? '★' : '✿';
        chip.querySelector('.pc-text').textContent = o.title || (o.primary ? 'Win ' + (o.slot + 1) : 'Bonus ' + (o.slot - 2));
        chip.setAttribute('aria-label', (o.primary ? 'Win-the-day task ' + (o.slot + 1) : 'Secondary task ' + (o.slot - 2)) + ': ' + (o.title || 'empty') + (st === 'done' ? ', done' : ''));
      }
    }
    orbs.forEach(styleOrb);

    api.setTasks = function (list) {           // [{title, done, active}] in slot order: 3 primary then 3 secondary
      orbs.forEach(function (o, i) {
        var t = list && list[i], st = !t || !t.title ? 'empty' : t.done ? 'done' : t.active ? 'active' : 'todo';
        var was = o.state; o.title = t && t.title ? t.title : ''; o.state = st; styleOrb(o);
        if (st === 'done' && was !== 'done' && was !== 'empty' && started) api.burst(i);
      });
      dirty = true;
    };
    api.setAdmin = function (total, done) {
      var n = Math.min(ADMIN_MAX, total || 0);
      adminBeads.forEach(function (b, i) {
        b.visible = i < n; if (!b.visible) return;
        var a = Math.PI / 2 + (i - (n - 1) / 2) * 0.115;           // fanned across the front of the ring
        b.position.set(Math.cos(a) * (RING_R + 0.12), 0.05, Math.sin(a) * (RING_R + 0.12));
        var isDone = i < (done || 0); b.material.color.set(isDone ? '#ffd24a' : '#fff6da'); b.material.opacity = isDone ? 1 : 0.75;
        b.scale.setScalar(isDone ? 0.13 : 0.09);
      });
      dirty = true;
    };
    api.setGlow = function (x) { glowTarget = clamp(x || 0, 0, 1); dirty = true; };
    api.onPick = function (fn) { pickCb = fn; };
    api.burst = function (slot, big) {
      var o = orbs[slot]; if (!o) return;
      var w = o.grp.getWorldPosition(new V3()); system.worldToLocal(w);
      var n = big ? 90 : 42;
      for (var i = 0; i < n; i++) {
        var k = bNext; bNext = (bNext + 1) % BURST;
        var a = Math.random() * Math.PI * 2, y = Math.random() * 2 - 1, s = Math.sqrt(1 - y * y), sp = (0.25 + Math.random() * 0.75) * (big ? 1.5 : 1);
        bPos[k * 3] = w.x; bPos[k * 3 + 1] = w.y; bPos[k * 3 + 2] = w.z;
        bVel[k * 3] = Math.cos(a) * s * sp; bVel[k * 3 + 1] = y * sp + 0.25; bVel[k * 3 + 2] = Math.sin(a) * s * sp;
        bLife[k] = 1.0 + Math.random() * 0.8;
      }
      o.pulse = 1; dirty = true;
    };
    api.celebrate = function () { for (var i = 0; i < 6; i++) api.burst(i, true); celebrate = 1; };
    api.setTheme = function (name) {
      themeName = name === 'dark' ? 'dark' : 'light'; T = THEMES[themeName];
      shared.uSpaceA.value.set(T.spaceA); shared.uSpaceB.value.set(T.spaceB); shared.uSpaceC.value.set(T.spaceC); shared.uSpaceD.value.set(T.spaceD); shared.uDeep.value.set(T.deep);
      shared.uSky.value.set(T.sky); shared.uGround.value.set(T.ground);
      bgMat.uniforms.uBurst.value.set(T.burst); bgMat.uniforms.uBurstAmt.value = T.burstAmt;
      glassUniforms.uInner.value.set(T.inner); glassUniforms.uBody.value = T.glassBody;
      glassUniforms.uRimColor.value.set(T.rim); glassUniforms.uRimAmt.value = T.rimAmt; glassUniforms.uRimAlpha.value = T.rimAlpha;
      hemi.color.copy(lin(T.sky)); hemi.groundColor.copy(lin(T.ground));
      haloMat.color.set(T.halo); haloMat.opacity = T.haloAmt;
      moonMatA.color.copy(lin(T.moonA)); moonMatB.color.copy(lin(T.moonB));
      dirty = true;
    };

    /* ---------------------------------------------------------- interaction */
    var yaw = 0, pitch = 0, vyaw = 0, vpitch = 0, dragging = false, lastX = 0, lastY = 0, moved = 0, idle = 0, downAt = 0;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    var target = stage || canvas;
    function onDown(e) { if (e.button != null && e.button !== 0) return; dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; downAt = performance.now(); idle = 0; }
    function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.0085; pitch = clamp(pitch + dy * 0.006, -0.55, 0.55); vyaw = dx * 0.0085; vpitch = 0; dirty = true;
    }
    function onUp(e) {
      if (!dragging) return; dragging = false;
      if (moved < 6 && performance.now() - downAt < 600 && pickCb) {
        var r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var hit = ray.intersectObjects(orbs.map(function (o) { return o.mesh; }), false)[0];
        if (hit) pickCb(hit.object.userData.slot, 'orb');
      }
    }
    target.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    /* ---------------------------------------------------------- layout */
    var cssW = 1, cssH = 1, radiusPx = 100, centerX = 0, centerY = 0, layoutKey = '';
    function layout() {
      var r = canvas.getBoundingClientRect(), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      var dpr = Math.min(root.devicePixelRatio || 1, 1.75);
      if (w !== cssW || h !== cssH || renderer.getPixelRatio() !== dpr) {
        cssW = w; cssH = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix(); shared.uRes.value.set(w, h); dirty = true;
      }
      var s = (stage || canvas).getBoundingClientRect();
      var cx = s.left - r.left + s.width / 2, cy = s.top - r.top + s.height / 2;
      var fill = typeof opts.fill === 'function' ? opts.fill(s.width, s.height) : (opts.fill || 0.62);
      var rad = Math.max(40, Math.min(s.width, s.height) * 0.5 * fill);
      var keyNow = cx.toFixed(1) + '|' + cy.toFixed(1) + '|' + rad.toFixed(1) + '|' + w + '|' + h;
      if (keyNow === layoutKey) return;
      layoutKey = keyNow; centerX = cx; centerY = cy; radiusPx = rad;
      var halfH = CAM_Z * Math.tan(FOV * Math.PI / 360), pxPerWorld = h / (2 * halfH);
      system.position.set((cx - w / 2) / pxPerWorld, -(cy - h / 2) / pxPerWorld, 0);
      system.scale.setScalar(rad / pxPerWorld);
      shared.uCenter.value.set(cx, h - cy); shared.uRadius.value = rad;
      dirty = true;
    }

    /* ---------------------------------------------------------- frame */
    var clock = new THREE.Clock(), time = 0, glowTarget = 0, celebrate = 0, dirty = true, started = false, visible = true, raf = 0;
    var wp = new V3(), tp = new V3(), mid = new V3();
    var lastDraw = 0;
    function frame(ts) {
      raf = 0;
      if (!dragging && !dirty && ts && ts - lastDraw < 31 && !reduced) { raf = requestAnimationFrame(frame); return; }
      lastDraw = ts || performance.now();
      var dt = Math.min(0.05, clock.getDelta());
      if (!reduced) time += dt;
      layout();
      var moving = !reduced || dirty || dragging || celebrate > 0.01;
      if (moving && visible) {
        shared.uTime.value = time;
        // gentle sway, drag with a little inertia, then drift back to the portrait angle
        if (!dragging) {
          yaw += vyaw; vyaw *= 0.92; idle += dt;
          if (idle > 4) { yaw += (Math.sin(yaw) * -1) * 0.012 * Math.min(1, (idle - 4) / 3); pitch += (0 - pitch) * 0.02; }
        }
        var sway = reduced ? 0 : Math.sin(time * 0.23) * 0.16;
        planet.rotation.set(pitch + (reduced ? 0 : Math.sin(time * 0.31) * 0.03), yaw + sway, 0);
        ring.rotation.y = time * 0.02;
        stars.rotation.z = time * 0.004;
        moonA.rotation.y = time * 0.1;
        shared.uGlow.value += (glowTarget + celebrate * 0.8 - shared.uGlow.value) * 0.06;
        celebrate *= 0.97;

        var tAttr = tethers.geometry.attributes.position;
        orbs.forEach(function (o, i) {
          var b = reduced ? 0 : 1;
          o.grp.position.set(o.home.x + Math.sin(time * 0.6 + i * 1.7) * 0.016 * b, o.home.y + Math.sin(time * 0.8 + i * 2.3) * 0.022 * b, o.home.z + Math.cos(time * 0.5 + i) * 0.012 * b);
          o.pulse *= 0.94;
          var beat = o.state === 'active' ? 1 + Math.sin(time * 3.2) * 0.09 : 1;
          var sc = o.size * o.scale * beat * (1 + o.pulse * 0.6);
          o.mesh.scale.setScalar(sc); o.mesh.rotation.set(time * 0.3 + i, time * 0.42 + i * 2, 0);
          var gs = o.size * (5.2 + o.glowAmt * 3.2) * (1 + o.pulse) * (o.state === 'active' ? 1 + Math.sin(time * 3.2) * 0.12 : 1);
          o.glow.scale.set(gs, gs, 1); o.glow.material.opacity = (themeName === 'dark' ? 0.75 : 0.9) * o.glowAmt;
          mid.copy(o.from).add(o.grp.position).multiplyScalar(0.5).addScaledVector(o.grp.position, 0.12);
          for (var k = 0; k < tetherN; k++) {
            var t = (k + 1) / (tetherN + 1), a = (1 - t) * (1 - t), bq = 2 * (1 - t) * t, c = t * t;
            tAttr.setXYZ(i * tetherN + k, a * o.from.x + bq * mid.x + c * o.grp.position.x, a * o.from.y + bq * mid.y + c * o.grp.position.y, a * o.from.z + bq * mid.z + c * o.grp.position.z);
          }
        });
        tAttr.needsUpdate = true;

        var bAttr = bursts.geometry.attributes.position, any = false;
        for (var k2 = 0; k2 < BURST; k2++) {
          if (bLife[k2] > 0) {
            bLife[k2] -= dt; any = true;
            bPos[k2 * 3] += bVel[k2 * 3] * dt; bPos[k2 * 3 + 1] += bVel[k2 * 3 + 1] * dt; bPos[k2 * 3 + 2] += bVel[k2 * 3 + 2] * dt;
            bVel[k2 * 3] *= 0.965; bVel[k2 * 3 + 1] = bVel[k2 * 3 + 1] * 0.965 - dt * 0.12; bVel[k2 * 3 + 2] *= 0.965;
            if (bLife[k2] <= 0) bPos[k2 * 3 + 1] = -99;
            bAttr.setXYZ(k2, bPos[k2 * 3], bPos[k2 * 3 + 1], bPos[k2 * 3 + 2]);
          }
        }
        if (any) { bAttr.needsUpdate = true; dirty = true; }

        var px = renderer.getPixelRatio() * cssH / 700;
        [stars, ringDust, motes, tethers, bursts, glints].forEach(function (m, i) { m.material.uniforms.uPx.value = px * (i === 0 ? 1 : system.scale.x) * (i === 0 ? 1.0 : 2.4); });
        renderer.render(scene, camera);
        placeChips();
        dirty = false; started = true;
      }
      if (!reduced || dragging || Math.abs(vyaw) > 0.0004 || celebrate > 0.01) raf = requestAnimationFrame(frame);
      else raf = requestAnimationFrame(idleFrame);
    }
    var idleTick = 0;
    function idleFrame() { raf = 0; idleTick++; layout(); if (dirty || idleTick % 20 === 0) frame(); else raf = requestAnimationFrame(idleFrame); }

    function placeChips() {
      if (!chips.length) return;
      var lr = labelLayer.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      var offX = cr.left - lr.left, offY = cr.top - lr.top, narrow = lr.width < 620, pad = 6;
      system.getWorldPosition(tp);
      var widths = chips.map(function (c) { return c.offsetWidth; });          // read every size before moving anything
      orbs.forEach(function (o, i) {
        var chip = chips[i]; o.grp.getWorldPosition(wp);
        var depth = wp.z - tp.z;                                                 // > 0: on the near side of the sphere
        wp.project(camera);
        var x = (wp.x * 0.5 + 0.5) * cssW + offX, y = (-wp.y * 0.5 + 0.5) * cssH + offY;
        var left = x < centerX + offX, gap = radiusPx * o.size * 1.5 + 8, w = widths[i];
        var lx = left ? x - gap - w : x + gap;
        lx = Math.max(pad, Math.min(lr.width - w - pad, lx));                    // stay inside the stage
        var ly = Math.max(14, Math.min(lr.height - 14, y));
        chip.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px) translateY(-50%)';
        var vis = clamp((depth / system.scale.x + 0.35) / 0.5, 0, 1);
        chip.style.opacity = (o.state === 'empty' ? 0.7 : 1) * vis;
        chip.style.pointerEvents = vis > 0.4 ? 'auto' : 'none';
        chip.classList.toggle('is-left', left); chip.classList.toggle('is-narrow', narrow);
      });
    }

    function onVis() { visible = !document.hidden; if (visible) { clock.getDelta(); dirty = true; if (!raf) raf = requestAnimationFrame(frame); } }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', function () { dirty = true; });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; });
    canvas.addEventListener('webglcontextrestored', function () { dirty = true; raf = requestAnimationFrame(frame); });

    api.refresh = function () { dirty = true; layoutKey = ''; };
    api.renderNow = function () { layout(); dirty = true; if (raf) cancelAnimationFrame(raf); frame(); };
    api.setReducedMotion = function (v) { reduced = !!v; petalMat.uniforms.uSway.value = reduced ? 0 : 1; leafMat.uniforms.uSway.value = reduced ? 0 : 0.6; dirty = true; };
    api.dispose = function () { if (raf) cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); renderer.dispose(); };
    api.debug = { scene: scene, camera: camera, planet: planet, flower: flower, set: function (y, p) { yaw = y; pitch = p; idle = -1e9; dirty = true; } };
    raf = requestAnimationFrame(frame);
    return api;
  }

  function pick(obj, keys) { var o = {}; keys.forEach(function (k) { o[k] = obj[k]; }); return o; }

  /* ------------------------------------------------------------------ no-WebGL fallback: a painted flower */
  function paintFallback(canvas, theme) {
    var g = canvas.getContext && canvas.getContext('2d'); if (!g) return;
    var r = canvas.getBoundingClientRect(), w = Math.max(300, r.width), h = Math.max(300, r.height), d = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = w * d; canvas.height = h * d; g.scale(d, d);
    var dark = theme === 'dark', bgG = g.createLinearGradient(0, 0, w, h);
    bgG.addColorStop(0, dark ? '#2c1c58' : '#cbb7f3'); bgG.addColorStop(0.55, dark ? '#1b2b66' : '#f8c3dc'); bgG.addColorStop(1, dark ? '#10464b' : '#a6e8d0');
    g.fillStyle = bgG; g.fillRect(0, 0, w, h);
    var st = canvas.__stage ? canvas.__stage.getBoundingClientRect() : r;
    var cx = st.left - r.left + st.width / 2, cy = st.top - r.top + st.height / 2, R0 = Math.min(st.width, st.height) * 0.3;
    var sg = g.createRadialGradient(cx - R0 * 0.3, cy - R0 * 0.4, R0 * 0.1, cx, cy, R0);
    sg.addColorStop(0, 'rgba(255,255,255,0.75)'); sg.addColorStop(0.7, 'rgba(255,240,248,0.35)'); sg.addColorStop(1, dark ? 'rgba(240,220,255,0.55)' : 'rgba(138,107,224,0.45)');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, R0, 0, Math.PI * 2); g.fill();
    for (var i = 0; i < 5; i++) {
      g.save(); g.translate(cx, cy + R0 * 0.05); g.rotate(i * Math.PI * 2 / 5 + 0.3);
      var pg = g.createRadialGradient(0, 0, R0 * 0.05, 0, -R0 * 0.4, R0 * 0.7);
      pg.addColorStop(0, '#7d0a2e'); pg.addColorStop(0.35, '#e8205f'); pg.addColorStop(0.8, '#ff4f8b'); pg.addColorStop(1, '#ff8fb5');
      g.fillStyle = pg; g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(-R0 * 0.55, -R0 * 0.15, -R0 * 0.5, -R0 * 0.72, 0, -R0 * 0.74);
      g.bezierCurveTo(R0 * 0.5, -R0 * 0.72, R0 * 0.55, -R0 * 0.15, 0, 0); g.fill(); g.restore();
    }
    g.strokeStyle = '#ffc4d6'; g.lineWidth = R0 * 0.045; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy + R0 * 0.05); g.quadraticCurveTo(cx + R0 * 0.1, cy - R0 * 0.3, cx + R0 * 0.28, cy - R0 * 0.5); g.stroke();
    g.fillStyle = '#ffd23f';
    for (var k = 0; k < 14; k++) { g.beginPath(); g.arc(cx + R0 * (0.12 + 0.012 * k) + Math.cos(k * 2.4) * R0 * 0.05, cy - R0 * (0.22 + 0.02 * k) + Math.sin(k * 2.4) * R0 * 0.05, R0 * 0.022, 0, Math.PI * 2); g.fill(); }
  }
  function finishFallback(api, opts) {
    var noop = function () {};
    if (opts.canvas) opts.canvas.__stage = opts.stage;
    api.setTasks = noop; api.setAdmin = noop; api.setGlow = noop; api.onPick = noop; api.burst = noop; api.celebrate = noop;
    api.setTheme = function (n) { paintFallback(opts.canvas, n); }; api.refresh = function () { paintFallback(opts.canvas, opts.theme); };
    api.renderNow = noop; api.setReducedMotion = noop; api.dispose = noop;
    if (opts.labels) opts.labels.hidden = true;
    return api;
  }

  root.FTScene = { create: create, THEMES: THEMES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
