/* Katong Diaries — place pins (one GPU point each), their name labels and tap picking. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var T = window.THREE;

  function Markers(world, places, labelRoot) {
    this.world = world; this.places = places; this.root = labelRoot;
    this.catOn = KD.CATS.map(function () { return 1; }); this.hotOnly = true; this.selected = null; this.states = {};
    var n = places.length, pos = new Float32Array(n * 3), cat = new Float32Array(n), hot = new Float32Array(n), st = new Float32Array(n), i;
    var B = world.W.buildings;
    for (i = 0; i < n; i++) {
      var p = places[i], y = 7;
      if (p.bi != null && B[p.bi]) { var b = B[p.bi]; y = b.h + ((b.kind === 1 || b.kind === 2 || b.kind === 11) ? 3.4 : b.inset ? b.rise + 1.5 : 2.5) + 2.5; }
      if (p.c === 'park' || p.c === 'photo') y = Math.max(y, 9);
      p.y = y; p._i = i;
      pos[i * 3] = p.x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = p.z;
      cat[i] = (KD.CAT[p.c] || KD.CAT.shop).i; hot[i] = p.hot ? 1 : 0;
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aCat', new T.BufferAttribute(cat, 1));
    g.setAttribute('aHot', new T.BufferAttribute(hot, 1)); g.setAttribute('aState', new T.BufferAttribute(st, 1));
    g.boundingSphere = new T.Sphere(new T.Vector3(0, 0, 0), 9000);
    this.stateAttr = g.attributes.aState;
    // atlas: 8 x 2 cells, one pin face per category
    var CELL = 96, atlas = KD.canvasTexture(T, CELL * 8, CELL * 2, function (c) {
      c.clearRect(0, 0, CELL * 8, CELL * 2);
      KD.CATS.forEach(function (ct, k) {
        var cx = (k % 8) * CELL + CELL / 2, cy = Math.floor(k / 8) * CELL + CELL / 2;
        c.save(); c.translate(cx, cy);
        c.beginPath(); c.arc(0, 0, CELL * 0.4, 0, 7); c.fillStyle = ct.color; c.fill();
        c.lineWidth = CELL * 0.07; c.strokeStyle = '#fff'; c.stroke();
        var s = CELL * 0.5 / 24; c.translate(-12 * s, -12 * s); c.scale(s, s);
        c.strokeStyle = '#fff'; c.lineWidth = 2.1; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(new Path2D(KD.ICON_PATHS[ct.icon]));
        c.restore();
      });
    });
    atlas.flipY = false; atlas.minFilter = T.LinearFilter; atlas.generateMipmaps = false;
    this.U = { atlas: { value: atlas }, uScale: { value: 1 }, uRef: { value: 800 }, uFar: { value: 3000 }, uHotOnly: { value: 1 }, uCats: { value: this.catOn }, uSel: { value: -1 }, uTime: { value: 0 } };
    var m = new T.ShaderMaterial({
      uniforms: this.U, transparent: true, depthWrite: false, depthTest: true,
      vertexShader: 'attribute float aCat; attribute float aHot; attribute float aState;\nuniform float uScale; uniform float uRef; uniform float uFar; uniform float uHotOnly; uniform float uCats[16]; uniform float uSel; uniform float uTime;\n' +
        'varying float vCat; varying float vState; varying float vAlpha; varying float vSel;\n' +
        'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z;\n' +
        ' float vis = uCats[int(aCat + 0.5)]; if (uHotOnly > 0.5 && aHot < 0.5 && aState < 0.5) vis = 0.0;\n' +
        ' float sel = step(abs(float(gl_VertexID) - uSel), 0.5); if (sel > 0.5) vis = 1.0;\n' +
        ' float far = uFar * mix(1.0, 3.2, max(aHot, step(0.5, aState))); float fade = 1.0 - smoothstep(far * 0.72, far, d);\n' +
        ' float size = mix(17.0, 27.0, aHot) * uScale * clamp(uRef / d, 0.62, 1.25) * mix(1.0, 1.35 + 0.08 * sin(uTime * 4.0), sel);\n' +
        ' gl_PointSize = size * step(0.5, vis); vCat = aCat; vState = aState; vAlpha = fade * vis; vSel = sel;\n' +
        ' if (vis < 0.5 || fade < 0.02) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }',
      fragmentShader: 'uniform sampler2D atlas; varying float vCat; varying float vState; varying float vAlpha; varying float vSel;\n' +
        'void main(){ vec2 pc = gl_PointCoord; float r = length(pc - 0.5);\n' +
        ' float col = mod(vCat + 0.5, 8.0) - 0.5; float row = floor((vCat + 0.5) / 8.0);\n' +
        ' vec2 uv = (vec2(floor(col + 0.5), row) + (pc - 0.5) * 1.16 + 0.5) / vec2(8.0, 2.0);\n' +
        ' vec4 c = texture2D(atlas, uv); if (r > 0.43) c.a = 0.0;\n' +
        ' vec3 ringCol = vState > 1.5 ? vec3(0.11, 0.62, 0.46) : vec3(0.93, 0.25, 0.5); float ring = smoothstep(0.5, 0.48, r) * smoothstep(0.40, 0.43, r);\n' +
        ' if (vState > 0.5) { c.rgb = mix(c.rgb, ringCol, ring); c.a = max(c.a, ring); }\n' +
        ' if (vSel > 0.5) { float sr = smoothstep(0.5, 0.47, r) * smoothstep(0.39, 0.43, r); c.rgb = mix(c.rgb, vec3(1.0), sr); c.a = max(c.a, sr); }\n' +
        ' c.a *= vAlpha; if (c.a < 0.03) discard; gl_FragColor = c;\n #include <colorspace_fragment>\n }'
    });
    this.points = new T.Points(g, m); this.points.renderOrder = 70; this.points.frustumCulled = false; world.scene.add(this.points);
    // label pool
    this.pool = []; this.maxLabels = world.mobile ? 14 : 30;
    for (i = 0; i < this.maxLabels; i++) { var el = document.createElement('div'); el.className = 'lbl'; labelRoot.appendChild(el); this.pool.push({ el: el, id: null }); }
    this._v = new T.Vector3(); this._t = 0; this.screen = new Float32Array(n * 3);
  }
  Markers.prototype.visible = function (p) {
    if (this.selected === p) return true;
    if (!this.catOn[(KD.CAT[p.c] || KD.CAT.shop).i]) return false;
    if (this.hotOnly && !p.hot && !this.states[p.id]) return false;
    return true;
  };
  Markers.prototype.setFilter = function (catOn, hotOnly) { this.catOn = catOn; this.hotOnly = hotOnly; this.U.uCats.value = catOn; this.U.uHotOnly.value = hotOnly ? 1 : 0; this._t = 0; };
  Markers.prototype.setState = function (place, s) { this.states[place.id] = s; this.stateAttr.array[place._i] = s; this.stateAttr.needsUpdate = true; };
  Markers.prototype.setSelected = function (place) { this.selected = place; this.U.uSel.value = place ? place._i : -1; this._t = 0; };

  /* project everything, then place a few non-overlapping labels */
  Markers.prototype.update = function (dt, cam, w, h, viewDist, walking, pixelRatio) {
    var U = this.U; U.uTime.value += dt; U.uScale.value = pixelRatio * (this.world.mobile ? 1.15 : 1);
    U.uRef.value = walking ? 120 : Math.max(250, viewDist); U.uFar.value = walking ? 420 : Math.max(1500, viewDist * 2.2);
    this._t -= dt; if (this._t > 0) return; this._t = 0.14;
    var P = this.places, v = this._v, S = this.screen, i, cand = [], far = U.uFar.value;
    var cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (i = 0; i < P.length; i++) {
      var p = P[i]; S[i * 3 + 2] = -1;
      if (!this.visible(p)) continue;
      var dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz), lim = far * ((p.hot || this.states[p.id]) ? 3.2 : 1);
      if (d > lim && p !== this.selected) continue;
      v.set(p.x, p.y, p.z).project(cam);
      if (v.z > 1 || v.z < -1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) continue;
      var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h; S[i * 3] = sx; S[i * 3 + 1] = sy; S[i * 3 + 2] = d;
      var pr = (p === this.selected ? 1e6 : 0) + (p.hot ? 4000 : 0) + (this.states[p.id] ? 2500 : 0) + (p.c === 'mall' ? 1500 : 0) - d * (walking ? 6 : 0.4);
      if (walking && d > (p.hot || p === this.selected ? 330 : 150)) continue;
      cand.push([pr, i, sx, sy, d]);
    }
    cand.sort(function (a, b) { return b[0] - a[0]; });
    var used = [], shown = 0, pool = this.pool, k;
    for (k = 0; k < cand.length && shown < this.maxLabels; k++) {
      var c = cand[k], pl = P[c[1]], lw = Math.min(190, pl.n.length * 6.6 + 16), lx = c[2] - lw / 2, ly = c[3] + 13, ok = true;
      if (lx < 4 || lx + lw > w - 4 || ly < 60 || ly > h - 30) continue;
      if (walking && pl !== this.selected && !this.clearSight(cx, cy, cz, pl)) continue;
      for (var j = 0; j < used.length; j++) { var u = used[j]; if (lx < u[0] + u[2] + 6 && lx + lw + 6 > u[0] && ly < u[1] + 22 && ly + 22 > u[1]) { ok = false; break; } }
      if (!ok) continue;
      used.push([lx, ly, lw]);
      var slot = pool[shown++];
      if (slot.id !== pl.id) { slot.id = pl.id; slot.el.textContent = pl.n; slot.el.className = 'lbl' + (pl.hot ? ' hot' : '') + (pl === this.selected ? ' sel' : ''); }
      else if ((pl === this.selected) !== slot.sel) slot.el.className = 'lbl' + (pl.hot ? ' hot' : '') + (pl === this.selected ? ' sel' : '');
      slot.sel = pl === this.selected;
      slot.el.style.transform = 'translate(' + Math.round(lx) + 'px,' + Math.round(ly) + 'px)';
    }
    for (k = shown; k < pool.length; k++) if (pool[k].id !== null) { pool[k].id = null; pool[k].el.style.transform = 'translate(-9999px,-9999px)'; }
  };
  /* is there a building between the eye and this pin? (2D walk along the sight line) */
  Markers.prototype.clearSight = function (cx, cy, cz, p) {
    var w = this.world, dx = p.x - cx, dz = p.z - cz, dy = p.y - cy, d = Math.sqrt(dx * dx + dz * dz), n = Math.min(60, Math.ceil(d / 4));
    for (var i = 1; i < n; i++) {
      var t = i / n, b = w.buildingAt(cx + dx * t, cz + dz * t);
      if (b && b.id !== p.bi && b.h > cy + dy * t + 0.5) return false;
    }
    return true;
  };
  /* nearest drawn pin under a tap */
  Markers.prototype.pick = function (x, y, cam, w, h, walking) {
    var P = this.places, v = this._v, best = null, bd = 1e9, far = this.U.uFar.value;
    for (var i = 0; i < P.length; i++) {
      var p = P[i]; if (!this.visible(p)) continue;
      v.set(p.x, p.y, p.z); var d = v.distanceTo(cam.position);
      if (d > far * ((p.hot || this.states[p.id]) ? 3.2 : 1) && p !== this.selected) continue;
      v.project(cam); if (v.z > 1 || v.z < -1) continue;
      var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h, r = (p.hot ? 17 : 13) + (this.world.mobile ? 6 : 2);
      var dd = Math.hypot(sx - x, sy - y);
      if (dd < r && dd < bd) { bd = dd; best = p; }
    }
    if (best && walking) {   // pins hidden behind a building are not tappable
      var hit = this.world.pickBuilding((x / w) * 2 - 1, -(y / h) * 2 + 1);
      var pd = Math.hypot(best.x - cam.position.x, best.y - cam.position.y, best.z - cam.position.z);
      if (hit && hit.distance < pd - 8) return null;
    }
    return best;
  };
  KD.Markers = Markers;
})();
