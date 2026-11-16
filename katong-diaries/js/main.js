/* Katong Diaries — start-up, the frame loop and the glue between the world, the pins and the panels. */
(function () {
  'use strict';
  var KD = window.KD, T = window.THREE;
  var $ = function (id) { return document.getElementById(id); };

  function fail(msg) { var l = $('loader'); l.hidden = false; $('loadMsg').textContent = msg; $('loadBar').style.width = '0'; }

  function boot() {
    KD.installIcons(); KD.fast = /shot=1/.test(location.search);
    if (!T) return fail('The 3D library did not load. Check your connection and reload.');
    var canvas = $('gl');
    try { if (!document.createElement('canvas').getContext('webgl2')) return fail('This browser cannot show the 3D map. It needs WebGL 2.'); } catch (e0) { return fail('This browser cannot show the 3D map.'); }
    var touch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    var mobile = touch && Math.min(window.innerWidth, window.innerHeight) < 820;
    var W = KD.decodeWorld(window.KD_WORLD), PL = window.KD_PLACES, places = PL.places, byId = {}, poiB = {};
    places.forEach(function (p) { byId[p.id] = p; if (p.bi != null) poiB[p.bi] = 1; });
    KD.Store.init();
    var prefs = KD.Store.prefs, world;
    try { world = new KD.World(canvas, W, { mobile: mobile, poiBuildings: poiB, tod: prefs.tod || 'day', preserve: /shot=1/.test(location.search) }); }
    catch (e) { console.error(e); return fail('This device could not start 3D graphics.'); }
    var avatar = new KD.Avatar({ outfit: prefs.outfit, skin: prefs.skin, hair: prefs.hair });
    world.scene.add(avatar.group); avatar.group.visible = false;
    var controls = new KD.Controls(world, canvas, avatar);
    var markers = new KD.Markers(world, places, $('labels'));
    var TODS = ['morning', 'day', 'golden', 'night'], marked = {}, tour = null, route = null, ring, ringT = 0;

    // ground ring: where a tap will take you
    ring = new T.Mesh(new T.RingGeometry(0.55, 0.78, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 60; world.scene.add(ring);

    var app = {
      world: world, controls: controls, markers: markers, avatar: avatar, places: places, byId: byId, malls: PL.malls, dates: PL.dates, sources: PL.sources, touch: touch,
      setMode: function (m) { stopTour(); controls.setMode(m); },
      selectPlace: function (p, fly) {
        markers.setSelected(p || null);
        world.highlight(p && p.bi != null ? W.buildings[p.bi] : null);
        if (p && fly && controls.mode === 'map') controls.flyTo(p.x, p.z, Math.min(controls.g.dist, p.c === 'mall' || p.c === 'park' ? 520 : 360));
      },
      goWalk: function (x, z, mode, place) {
        stopTour(); controls.teleport(x, z, x, z);
        if (controls.mode !== mode) controls.setMode(mode, true); else controls._startBlend(0.9);
        if (place) ui.toast('Dropped you outside ' + place.n);
      },
      cycleTod: function () { var i = (TODS.indexOf(world.tod) + 1) % TODS.length; world.setTimeOfDay(TODS[i]); KD.Store.setPref('tod', TODS[i]); ui.setTod(TODS[i]); },
      setOutfit: function (o) { avatar.set(o); for (var k in o) KD.Store.setPref(k, o[k]); },
      applyPrefs: function () { var p = KD.Store.prefs; avatar.set({ outfit: p.outfit, skin: p.skin, hair: p.hair }); if (p.tod && p.tod !== world.tod) world.setTimeOfDay(p.tod); },
      syncPins: function () {
        var log = KD.Store.log, id;
        for (id in marked) if (!log[id] || !log[id].s) { if (byId[id]) markers.setState(byId[id], 0); delete marked[id]; }
        for (id in log) if (byId[id] && log[id].s && marked[id] !== log[id].s) { markers.setState(byId[id], log[id].s); marked[id] = log[id].s; }
      },
      showRoute: function (d) {
        if (route) { world.scene.remove(route); route.geometry.dispose(); route = null; }
        if (!d) return;
        var pts = d.stops.map(function (s) { return byId[s.id]; }).filter(Boolean), pos = [], idx = [], i, v = 0;
        if (pts.length < 2) return;
        var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
        for (i = 0; i < pts.length; i++) { x0 = Math.min(x0, pts[i].x); x1 = Math.max(x1, pts[i].x); z0 = Math.min(z0, pts[i].z); z1 = Math.max(z1, pts[i].z); }
        var ext = Math.max(x1 - x0, z1 - z0), hw = Math.max(1.6, ext * 0.006);
        for (i = 0; i < pts.length - 1; i++) {
          var a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw;
          pos.push(a.x - nx, 1.5, a.z - nz, a.x + nx, 1.5, a.z + nz, b.x + nx, 1.5, b.z + nz, b.x - nx, 1.5, b.z - nz); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
        }
        for (i = 0; i < pts.length; i++) { var c = v; pos.push(pts[i].x, 1.6, pts[i].z); v++; for (var k = 0; k < 16; k++) { var an = k / 16 * 6.2832; pos.push(pts[i].x + Math.cos(an) * hw * 2.4, 1.6, pts[i].z + Math.sin(an) * hw * 2.4); v++; } for (k = 0; k < 16; k++) idx.push(c, c + 1 + k, c + 1 + (k + 1) % 16); }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        route = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xee3f80, transparent: true, opacity: 0.78, depthTest: false, side: T.DoubleSide, fog: false })); route.renderOrder = 45; world.scene.add(route);
        if (controls.mode !== 'map') controls.setMode('map');
        controls.flyTo((x0 + x1) / 2, (z0 + z1) / 2, Math.max(380, ext * 1.5), undefined, 1.05);
      },
      playTour: function (d) {
        stopTour(); if (!d) return; if (controls.mode !== 'map') controls.setMode('map');
        var stops = d.stops.map(function (s) { return byId[s.id]; }).filter(Boolean), i = 0;
        function next() {
          if (!tour) return; if (i >= stops.length) { stopTour(); app.showRoute(d); ui.toast('That is the route. Tap a stop to plan it'); return; }
          var p = stops[i]; controls.flyTo(p.x, p.z, 230, controls.g.yaw + 0.5, 0.62); ui.openPlace(p, false); ui.toast((i + 1) + ' of ' + stops.length + ' · ' + d.stops[i].t + ' · ' + p.n); i++;
          tour.timer = setTimeout(next, 4200);
        }
        tour = { timer: 0 }; next();
      }
    };
    function stopTour() { if (tour) { clearTimeout(tour.timer); tour = null; } }
    canvas.addEventListener('pointerdown', stopTour);

    var ui = new KD.UI(app); KD.app = app; KD.ui = ui;
    controls.onMode = function (m) { ui.setMode(m); if (m !== 'map') ui.toast(m === 'stroll' ? 'Strolling. Drag to look around' : 'Street view. Tap the road to walk there'); };
    ui.setMode('map'); app.syncPins();

    // ---- taps: a pin, else a building, else the ground
    controls.onTap = function (cx, cy) {
      var r = canvas.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, w = r.width, h = r.height, walking = controls.walking();
      var p = markers.pick(x, y, world.camera, w, h, walking);
      if (p) { ui.openPlace(p, false); return; }
      var nx = (x / w) * 2 - 1, ny = -(y / h) * 2 + 1, hit = world.pickBuilding(nx, ny), gp = world.pickGround(nx, ny);
      var gd = gp ? gp.distanceTo(world.camera.position) : 1e9;
      if (hit && hit.distance < gd) {
        if (walking && hit.distance > 220) return;
        ui.openBuilding(hit.building); return;
      }
      if (gp && walking && gd < 260) {
        if (world.walkable(gp.x, gp.z)) { controls.walkTo(gp.x, gp.z); ring.position.set(gp.x, 0.12, gp.z); ringT = 1.4; }
        else ui.toast('Can\'t walk there');
      }
    };

    // ---- joystick
    (function () {
      var joy = $('joy'), knob = $('joyKnob'), id = null, cx = 0, cy = 0, R = 40;
      function set(e) { var dx = e.clientX - cx, dy = e.clientY - cy, l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; controls.joy.x = dx / R; controls.joy.y = -dy / R; }
      joy.addEventListener('pointerdown', function (e) { id = e.pointerId; joy.setPointerCapture(id); var r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e); e.preventDefault(); });
      joy.addEventListener('pointermove', function (e) { if (e.pointerId === id) set(e); });
      function end(e) { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; controls.joy.x = controls.joy.y = 0; }
      joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    })();

    // ---- mini map (walking)
    var mini = $('mini'), mc = mini.getContext('2d'), stamp = 0;
    function drawMini() {
      var S = mini.width, R = 240, sc = S / (R * 2), px = controls.pos.x, pz = controls.pos.z, yaw = controls.look.yaw, i;
      var cs = getComputedStyle(document.documentElement);
      mc.clearRect(0, 0, S, S); mc.save(); mc.beginPath(); mc.arc(S / 2, S / 2, S / 2, 0, 7); mc.clip();
      mc.fillStyle = world.tod === 'night' ? '#1d2a33' : '#dfe8d6'; mc.fillRect(0, 0, S, S);
      mc.translate(S / 2, S / 2); mc.rotate(yaw); mc.scale(sc, sc); mc.translate(-px, -pz);
      mc.lineCap = 'round'; mc.lineJoin = 'round'; stamp++;
      var gx0 = Math.floor((px - R * 1.5) / 100), gx1 = Math.floor((px + R * 1.5) / 100), gz0 = Math.floor((pz - R * 1.5) / 100), gz1 = Math.floor((pz + R * 1.5) / 100);
      for (var pass = 0; pass < 2; pass++) for (var gx = gx0; gx <= gx1; gx++) for (var gz = gz0; gz <= gz1; gz++) {
        var cell = world.rgrid[gx + ',' + gz]; if (!cell) continue;
        for (i = 0; i < cell.length; i++) {
          var r = W.roads[cell[i]]; if (r._s === stamp + pass * 0.5) continue; r._s = stamp + pass * 0.5;
          var big = r.cls <= 13; if ((pass === 0) === big) continue;
          var p = r.pts; mc.beginPath(); mc.moveTo(p[0], p[1]); for (var k = 2; k < p.length; k += 2) mc.lineTo(p[k], p[k + 1]);
          mc.strokeStyle = big ? (world.tod === 'night' ? '#55626e' : '#ffffff') : (world.tod === 'night' ? '#34424c' : '#c9d2c2'); mc.lineWidth = big ? Math.max(r.w, 5) : 2.5; mc.stroke();
        }
      }
      for (i = 0; i < places.length; i++) {
        var pl = places[i]; if (!markers.visible(pl)) continue; var dx = pl.x - px, dz = pl.z - pz; if (dx * dx + dz * dz > R * R * 1.3) continue;
        mc.fillStyle = (KD.CAT[pl.c] || KD.CAT.shop).color; mc.beginPath(); mc.arc(pl.x, pl.z, pl.hot ? 8 : 5, 0, 7); mc.fill();
        if (pl.hot) { mc.strokeStyle = '#fff'; mc.lineWidth = 2; mc.stroke(); }
      }
      mc.restore();
      mc.save(); mc.translate(S / 2, S / 2);
      mc.fillStyle = '#ee3f80'; mc.strokeStyle = '#fff'; mc.lineWidth = 3; mc.beginPath(); mc.moveTo(0, -15); mc.lineTo(10, 11); mc.lineTo(0, 5); mc.lineTo(-10, 11); mc.closePath(); mc.fill(); mc.stroke();
      mc.rotate(yaw); mc.fillStyle = world.tod === 'night' ? '#fff' : '#172626'; mc.font = '600 20px sans-serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText('N', 0, -S / 2 + 18);
      mc.restore();
    }

    // ---- loading
    var hidLoader = false;
    function hideLoader() {
      if (hidLoader) return; hidLoader = true; $('loader').hidden = true;
      if (!KD.Store.prefs.welcomed && !/shot=1/.test(location.search)) ui.openWelcome();
    }
    world.onProgress = function (f, n) {
      $('loadBar').style.width = Math.round(f * 100) + '%';
      $('loadMsg').textContent = f < 0.2 ? 'Painting the shophouses' : f < 0.6 ? 'Planting rain trees' : 'Building the rest of the east';
      if (n >= Math.min(24, W.btiles.length)) hideLoader();
    };
    world.buildAll(function () { hideLoader(); });

    // ---- frame loop
    var last = performance.now(), hudT = 0, miniT = 0, sizeW = 0, sizeH = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w !== sizeW || h !== sizeH) { sizeW = w; sizeH = h; world.resize(w, h); }
      controls.update(dt);
      var walking = controls.walking(), f = controls.focus(), vd = controls.viewDist();
      world.update(dt, f, vd, walking);
      markers.update(dt, world.camera, w, h, vd, walking, world.renderer.getPixelRatio());
      if (ringT > 0) { ringT -= dt; ring.material.opacity = Math.max(0, Math.min(0.9, ringT)); var sc = 1 + (1.4 - ringT) * 0.5; ring.scale.set(sc, sc, sc); ring.visible = true; } else ring.visible = false;
      world.render();
      if (walking) {
        hudT -= dt; miniT -= dt;
        if (miniT <= 0) { miniT = 0.08; drawMini(); }
        if (hudT <= 0) {
          hudT = 0.35;
          var nr = world.nearestRoad(f.x, f.z, 40, function (r) { return r.name && r.cls <= 14; }), near = [];
          for (var i = 0; i < places.length; i++) { var p = places[i]; if (!p.hot || !markers.visible(p)) continue; var d = Math.hypot(p.x - f.x, p.z - f.z); if (d < 170) near.push({ p: p, d: d }); }
          near.sort(function (a, b) { return a.d - b.d; });
          ui.setHud(nr ? W.names[nr.road.name] : '', near.slice(0, touch ? 2 : 3));
        }
      } else { var cp = $('compass'); if (cp) cp.style.transform = 'rotate(' + (-controls.bearing()) + 'deg)'; }
    }
    requestAnimationFrame(frame);
    window.addEventListener('resize', function () { sizeW = 0; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
