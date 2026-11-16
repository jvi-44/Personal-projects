/* Katong Diaries — the avatar and her wardrobe. Low-poly, built from primitives, with a simple walk cycle. */
(function () {
  'use strict';
  var KD = (window.KD = window.KD || {});
  var T = window.THREE;

  KD.SKINS = ['#f6d7c0', '#eac0a0', '#c98f66', '#8c5a3c'];
  KD.HAIRS = ['#1d1614', '#3b2618', '#6b4226', '#b5793f', '#d9b36a', '#c0392b'];
  KD.OUTFITS = [
    { id: 'pilates', name: 'Pilates princess', desc: 'Matching sage set, slick bun, tote and an iced matcha', sw: ['#a9c2a0', '#f4ede0', '#9cc46a'] },
    { id: 'coolgirl', name: 'Cool girl', desc: 'Baby tee, baggy jeans, tiny shades, shoulder bag', sw: ['#f7f7f4', '#8fb1d6', '#1c1c1e'] },
    { id: 'boho', name: 'Boho', desc: 'Crochet top, tiered maxi skirt, straw hat', sw: ['#f3e6cf', '#c8693f', '#d8b877'] },
    { id: 'oldmoney', name: 'Old money brunch', desc: 'Knit polo, pleated tennis skirt, loafers, headband', sw: ['#f2ead8', '#22324f', '#7a4a2b'] },
    { id: 'coastal', name: 'Coastal girl', desc: 'Striped shirt, white shorts, bucket hat, straw tote', sw: ['#6f9fd8', '#ffffff', '#e9d9b0'] },
    { id: 'kebaya', name: 'Nyonya kebaya', desc: 'Embroidered kebaya and batik sarong, a nod to Peranakan Katong', sw: ['#f2a7bd', '#1f6f78', '#d9a441'] },
    { id: 'y2k', name: 'Y2K night out', desc: 'Pink crop top, low-rise cargos, platform boots, space buns', sw: ['#ff9ec7', '#4a4e57', '#c9b6f2'] }
  ];

  function mat(c) { return new T.MeshLambertMaterial({ color: c }); }
  function mesh(g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; }
  function cyl(rt, rb, h, seg) { return new T.CylinderGeometry(rt, rb, h, seg || 10); }

  function Avatar(opts) {
    opts = opts || {};
    this.group = new T.Group();
    this.skin = opts.skin || KD.SKINS[1]; this.hair = opts.hair || KD.HAIRS[1]; this.outfit = opts.outfit || 'pilates';
    this.phase = 0; this.speed = 0;
    this.build();
  }
  Avatar.prototype.build = function () {
    var g = this.group, i;
    for (i = g.children.length - 1; i >= 0; i--) { var ch = g.children[i]; g.remove(ch); ch.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
    var o = this.outfit, skin = mat(this.skin), hair = mat(this.hair);
    // ---- per-outfit palette
    var P = {
      pilates: { top: '#a9c2a0', mid: 'skin', hip: '#a9c2a0', leg: '#a9c2a0', arm: 'skin', shoe: '#fbfbf8', sock: '#ffffff', flare: 1 },
      coolgirl: { top: '#f7f7f4', mid: '#f7f7f4', hip: '#8fb1d6', leg: '#8fb1d6', arm: 'skin', shoe: '#f2f2ee', baggy: 1 },
      boho: { top: '#f3e6cf', mid: '#f3e6cf', hip: '#c8693f', leg: 'skin', arm: 'skin', shoe: '#b98a55' },
      oldmoney: { top: '#f2ead8', mid: '#f2ead8', hip: '#22324f', leg: 'skin', arm: 'skin', shoe: '#6b3f24', sock: '#ffffff' },
      coastal: { top: '#6f9fd8', mid: '#6f9fd8', hip: '#ffffff', leg: 'skin', arm: '#6f9fd8', shoe: '#c9a36b' },
      kebaya: { top: '#f2a7bd', mid: '#f2a7bd', hip: '#1f6f78', leg: 'skin', arm: '#f2a7bd', shoe: '#e0507f' },
      y2k: { top: '#ff9ec7', mid: 'skin', hip: '#4a4e57', leg: '#4a4e57', arm: 'skin', shoe: '#1c1c1e', baggy: 1, platform: 1 }
    }[o] || {};
    function M(c) { return c === 'skin' ? skin : mat(c); }
    // ---- legs
    this.legs = [];
    for (i = 0; i < 2; i++) {
      var sx = i ? 0.085 : -0.085, lg = new T.Group(); lg.position.set(sx, 0.86, 0);
      var lw = P.baggy ? 0.085 : 0.062;
      lg.add(mesh(cyl(lw + 0.008, P.flare ? 0.085 : lw, 0.78, 10), M(P.leg), 0, -0.4, 0));
      if (P.sock) lg.add(mesh(cyl(0.05, 0.048, 0.14, 8), mat(P.sock), 0, -0.72, 0));
      var sh = mesh(new T.BoxGeometry(0.095, P.platform ? 0.13 : 0.075, 0.235), mat(P.shoe), 0, P.platform ? -0.79 : -0.82, 0.045); lg.add(sh);
      g.add(lg); this.legs.push(lg);
    }
    // ---- hips, midriff, chest
    g.add(mesh(cyl(0.135, 0.15, 0.2, 12), M(P.hip), 0, 0.93, 0));
    g.add(mesh(cyl(0.125, 0.132, 0.16, 12), M(P.mid), 0, 1.1, 0));
    g.add(mesh(cyl(0.165, 0.128, 0.26, 12), M(P.top), 0, 1.3, 0));
    g.add(mesh(cyl(0.045, 0.05, 0.08, 8), skin, 0, 1.46, 0));
    // ---- arms
    this.arms = [];
    for (i = 0; i < 2; i++) {
      var ax = i ? 0.2 : -0.2, ar = new T.Group(); ar.position.set(ax, 1.4, 0);
      ar.add(mesh(cyl(0.045, 0.036, 0.54, 8), M(P.arm), 0, -0.27, 0));
      if (P.arm === 'skin' && o !== 'pilates' && o !== 'y2k') ar.add(mesh(cyl(0.056, 0.05, 0.15, 8), M(P.top), 0, -0.07, 0));   // short sleeve
      ar.add(mesh(new T.SphereGeometry(0.043, 8, 6), skin, 0, -0.56, 0));
      ar.rotation.z = i ? 0.09 : -0.09;
      g.add(ar); this.arms.push(ar);
    }
    // ---- head + face
    var head = new T.Group(); head.position.set(0, 1.59, 0); g.add(head); this.head = head;
    var hd = mesh(new T.SphereGeometry(0.118, 18, 14), skin); hd.scale.set(1, 1.1, 1.02); head.add(hd);
    var eye = mat('#2a1c18');
    head.add(mesh(new T.SphereGeometry(0.014, 6, 6), eye, -0.042, 0.012, 0.108)); head.add(mesh(new T.SphereGeometry(0.014, 6, 6), eye, 0.042, 0.012, 0.108));
    var lip = mesh(new T.BoxGeometry(0.034, 0.008, 0.01), mat('#c9566a'), 0, -0.05, 0.112); head.add(lip);
    var blush = new T.MeshLambertMaterial({ color: '#f08fa0', transparent: true, opacity: 0.45 });
    head.add(mesh(new T.SphereGeometry(0.02, 6, 6), blush, -0.07, -0.022, 0.092)); head.add(mesh(new T.SphereGeometry(0.02, 6, 6), blush, 0.07, -0.022, 0.092));
    // ---- hair
    var cap = mesh(new T.SphereGeometry(0.128, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, 0, 0.012, -0.012); cap.scale.set(1.02, 1.12, 1.06); cap.rotation.x = -0.24; head.add(cap);
    function longHair(len, w) { var h = mesh(cyl(0.118 * w, 0.085 * w, len, 10), hair, 0, -len / 2 + 0.06, -0.06); h.scale.z = 0.62; head.add(h); }
    function bun(x, y, z, r) { head.add(mesh(new T.SphereGeometry(r, 10, 8), hair, x, y, z)); }
    if (o === 'pilates') { bun(0, 0.1, -0.11, 0.055); head.add(mesh(new T.TorusGeometry(0.04, 0.012, 6, 12), mat('#f4ede0'), 0, 0.085, -0.095)); }
    else if (o === 'coolgirl') { var pt = mesh(cyl(0.035, 0.018, 0.3, 8), hair, 0, -0.1, -0.13); pt.rotation.x = 0.25; head.add(pt); }
    else if (o === 'boho') longHair(0.52, 1.08);
    else if (o === 'oldmoney') { longHair(0.42, 1.0); var hb = mesh(new T.TorusGeometry(0.122, 0.014, 6, 20, Math.PI), mat('#22324f'), 0, 0.02, 0); hb.rotation.y = Math.PI / 2; hb.rotation.z = 0; hb.rotation.x = 0; hb.rotation.set(0, 0, 0); hb.rotateZ(0); head.add(hb); }
    else if (o === 'coastal') longHair(0.3, 1.0);
    else if (o === 'kebaya') { bun(0, 0.02, -0.14, 0.06); head.add(mesh(new T.SphereGeometry(0.022, 8, 6), mat('#e0304f'), 0.05, 0.05, -0.15)); head.add(mesh(new T.SphereGeometry(0.018, 8, 6), mat('#ffd6e0'), 0.02, 0.085, -0.15)); }
    else if (o === 'y2k') { bun(-0.085, 0.13, -0.02, 0.048); bun(0.085, 0.13, -0.02, 0.048); head.add(mesh(new T.SphereGeometry(0.014, 6, 6), mat('#c9b6f2'), -0.06, 0.09, 0.09)); head.add(mesh(new T.SphereGeometry(0.014, 6, 6), mat('#ffe066'), 0.065, 0.085, 0.085)); }
    // ---- accessories
    if (o === 'coolgirl') { head.add(mesh(new T.BoxGeometry(0.19, 0.036, 0.02), mat('#101012'), 0, 0.014, 0.112)); }
    if (o === 'boho') { head.add(mesh(cyl(0.3, 0.31, 0.012, 20), mat('#d8b877'), 0, 0.1, 0)); head.add(mesh(cyl(0.118, 0.13, 0.1, 16), mat('#d8b877'), 0, 0.15, 0)); head.add(mesh(cyl(0.132, 0.132, 0.025, 16), mat('#7a4a2b'), 0, 0.115, 0)); }
    if (o === 'coastal') { head.add(mesh(cyl(0.105, 0.2, 0.1, 16), mat('#efe3c4'), 0, 0.1, 0)); head.add(mesh(cyl(0.1, 0.106, 0.06, 16), mat('#efe3c4'), 0, 0.17, 0)); }
    // skirts
    if (o === 'boho') { g.add(mesh(cyl(0.15, 0.24, 0.34, 14), mat('#c8693f'), 0, 0.72, 0)); g.add(mesh(cyl(0.24, 0.33, 0.34, 14), mat('#b55a34'), 0, 0.4, 0)); g.add(mesh(cyl(0.33, 0.37, 0.1, 14), mat('#e7c9a0'), 0, 0.19, 0)); }
    if (o === 'oldmoney') { g.add(mesh(cyl(0.15, 0.27, 0.27, 16), mat('#22324f'), 0, 0.78, 0)); g.add(mesh(cyl(0.07, 0.11, 0.05, 10), mat('#f2ead8'), 0, 1.45, 0.01)); }
    if (o === 'kebaya') { g.add(mesh(cyl(0.155, 0.17, 0.74, 14), mat('#1f6f78'), 0, 0.5, 0)); g.add(mesh(cyl(0.172, 0.172, 0.06, 14), mat('#d9a441'), 0, 0.17, 0)); g.add(mesh(cyl(0.168, 0.168, 0.03, 14), mat('#d9a441'), 0, 0.45, 0));
      g.add(mesh(cyl(0.17, 0.19, 0.2, 12), mat('#f2a7bd'), 0, 0.98, 0)); g.add(mesh(new T.BoxGeometry(0.03, 0.42, 0.02), mat('#c9567a'), 0, 1.2, 0.155)); }
    if (o === 'coastal') { for (i = 0; i < 3; i++) g.add(mesh(cyl(0.168 - i * 0.012, 0.164 - i * 0.012, 0.03, 12), mat('#ffffff'), 0, 1.38 - i * 0.075, 0)); g.add(mesh(cyl(0.155, 0.17, 0.2, 12), mat('#ffffff'), 0, 0.8, 0)); }
    if (o === 'y2k') { g.add(mesh(new T.BoxGeometry(0.12, 0.1, 0.05), mat('#c9b6f2'), 0.2, 1.0, 0.03)); }
    // bags + cup
    function strap(col, y0) { var s = mesh(new T.BoxGeometry(0.02, 0.5, 0.02), mat(col), -0.21, y0, 0.0); g.add(s); }
    if (o === 'pilates') { g.add(mesh(new T.BoxGeometry(0.05, 0.3, 0.26), mat('#f4ede0'), -0.25, 0.98, 0)); strap('#f4ede0', 1.25);
      var cup = new T.Group(); cup.add(mesh(cyl(0.035, 0.028, 0.12, 10), mat('#9cc46a'), 0, 0, 0)); cup.add(mesh(cyl(0.037, 0.037, 0.015, 10), mat('#ffffff'), 0, 0.066, 0)); cup.add(mesh(cyl(0.005, 0.005, 0.1, 5), mat('#222'), 0.01, 0.11, 0)); cup.position.set(0, -0.58, 0.05); this.arms[1].add(cup); }
    if (o === 'coolgirl') { g.add(mesh(new T.BoxGeometry(0.06, 0.13, 0.24), mat('#1c1c1e'), -0.24, 1.08, 0)); strap('#1c1c1e', 1.3); }
    if (o === 'boho') { g.add(mesh(new T.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), mat('#c9a36b'), -0.27, 0.98, 0)); strap('#8a5a33', 1.25); }
    if (o === 'oldmoney') { var b2 = new T.Group(); b2.add(mesh(new T.BoxGeometry(0.06, 0.13, 0.19), mat('#7a4a2b'), 0, -0.1, 0)); b2.add(mesh(new T.TorusGeometry(0.05, 0.008, 5, 12, Math.PI), mat('#7a4a2b'), 0, -0.035, 0)); b2.children[1].rotation.y = Math.PI / 2; b2.position.set(0, -0.56, 0); this.arms[0].add(b2); }
    if (o === 'coastal') { g.add(mesh(new T.BoxGeometry(0.06, 0.28, 0.32), mat('#e9d9b0'), -0.26, 0.96, 0)); strap('#e9d9b0', 1.25); }
    if (o === 'kebaya') { var cl = mesh(new T.BoxGeometry(0.05, 0.1, 0.17), mat('#d9a441'), 0, -0.6, 0); this.arms[0].add(cl); }
  };
  Avatar.prototype.set = function (o) {
    var ch = false;
    if (o.outfit && o.outfit !== this.outfit) { this.outfit = o.outfit; ch = true; }
    if (o.skin && o.skin !== this.skin) { this.skin = o.skin; ch = true; }
    if (o.hair && o.hair !== this.hair) { this.hair = o.hair; ch = true; }
    if (ch) this.build();
  };
  // speed in m/s. swings limbs when moving, breathes when idle.
  Avatar.prototype.update = function (dt, speed) {
    this.speed += (speed - this.speed) * Math.min(1, dt * 10);
    var s = this.speed, k = Math.min(1, s / 3.2);
    this.phase += dt * (2.6 + s * 1.5);
    var sw = Math.sin(this.phase) * (0.18 + 0.5 * k) * (s > 0.1 ? 1 : 0), run = s > 6 ? 1.25 : 1;
    var skirt = this.outfit === 'kebaya' ? 0.35 : this.outfit === 'boho' ? 0.6 : 1;
    this.legs[0].rotation.x = sw * run * skirt; this.legs[1].rotation.x = -sw * run * skirt;
    this.arms[0].rotation.x = -sw * 0.85; this.arms[1].rotation.x = this.outfit === 'pilates' ? -0.9 + sw * 0.1 : sw * 0.85;
    var bob = s > 0.1 ? Math.abs(Math.sin(this.phase)) * 0.035 * (0.5 + k) : Math.sin(this.phase * 0.5) * 0.006;
    this.group.position.y = (this.baseY || 0) + bob;
    this.head.rotation.y = s > 0.1 ? 0 : Math.sin(this.phase * 0.22) * 0.25;
    this.head.rotation.z = Math.sin(this.phase * 0.5) * 0.02;
  };
  KD.Avatar = Avatar;

  /* small turntable preview for the outfit picker */
  KD.AvatarPreview = function (canvas) {
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.outputColorSpace = T.SRGBColorSpace;
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 1.05, 4.3); cam.lookAt(0, 0.92, 0);
    sc.add(new T.HemisphereLight(0xffffff, 0xd8c8c0, 1.6)); var d = new T.DirectionalLight(0xfff4e6, 2.2); d.position.set(2, 4, 3); sc.add(d);
    var disc = new T.Mesh(new T.CircleGeometry(0.62, 40), new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); disc.rotation.x = -Math.PI / 2; sc.add(disc);
    var av = new KD.Avatar({}); sc.add(av.group);
    var on = false, last = 0;
    function loop(t) {
      if (!on) return; var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      var w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== Math.round(w * r.getPixelRatio())) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      av.group.rotation.y = t * 0.0007; av.update(dt, 1.1); r.render(sc, cam); requestAnimationFrame(loop);
    }
    return { avatar: av, start: function () { if (!on) { on = true; requestAnimationFrame(loop); } }, stop: function () { on = false; } };
  };
})();
