/* SAJC 2026 Paper 4 simulations (Q1 reuses NYJC's two-wire circuit; Q2 is also used by TJC Q2) */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q2: mass hung from two rubber bands on a hacksaw blade ----------
  VPL.def('sajc-q2', {
    title: 'Two rubber bands on a hacksaw blade',
    intro: '<p>Hang the mass from both bands. Measure α (one band to the blade) with the protractor and b (band length, blade to hook) with the rule. For the second mass, move the tops of the bands until <b>b is the same as before</b>. The spare band on the bench is for measuring the unstretched length.</p>',
    world: { x: 0, y: 0, w: 64, h: 48 },
    zoom: 5,
    hidden: (r) => ({ L0: r.uni(5.8, 6.2), k: r.uni(44, 52), hook: 0.8 }),
    controls: [
      { id: 'm', label: 'Mass m', type: 'buttons', value: 300, options: [100, 200, 300, 400].map((v) => ({ value: v, label: v + ' g' })) },
      { id: 's', label: 'Distance between tops of bands', type: 'range', min: 4, max: 20, step: 0.05, value: 8, hideValue: true },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 180, unit: '°' },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 60, unit: '°' },
    ],
    movables: [{ id: 'prot', type: 'protractor', x: 36, y: 8, r: 5, angle: 180 }, { id: 'rule', type: 'rule', x: 40, y: 10, len: 20, angle: 60, w: 2.2 }],
    onchange(S, id) { if (id === 'prot') S.mov.prot.angle = S.c.prot; if (id === 'rang') S.mov.rule.angle = S.c.rang; },
    solve(S) {
      const H = S.h, half = S.c.s / 2, mg = S.c.m / 1000 * g;
      const f = (b) => 2 * H.k * Math.max(0, b - H.L0) / 100 * Math.sqrt(Math.max(0, 1 - (half / b) ** 2)) - mg;
      let a = Math.max(H.L0, half) + 1e-4, c = 60;
      for (let i = 0; i < 80; i++) { const m = (a + c) / 2; if (f(a) * f(m) <= 0) c = m; else a = m; }
      const b = (a + c) / 2; return { b, alpha: Math.acos(Math.min(1, half / b)) };
    },
    draw(K, S) {
      const cx = 32, y0 = 8, sol = this.solve(S), half = S.c.s / 2;
      K.bench(46); K.rect(cx - 8, 44.8, 16, 1.2, '#4b5563', '#1f2937'); K.rect(cx - 0.4, 5, 0.8, 40, '#9aa5b1', '#4b5563', 0.8);
      K.rect(4, y0 - 0.8, 56, 0.8, '#cbd5e1', '#475569', 0.8);
      for (let x = 4.3; x < 60; x += 0.45) K.path([[x, y0 - 0.8], [x + 0.22, y0 - 1.3], [x + 0.45, y0 - 0.8]], 0.5, '#475569');
      K.boss(cx, y0 - 0.4);
      const hx = cx, hy = y0 + sol.b * Math.sin(sol.alpha);
      [[cx - half, y0], [cx + half, y0]].forEach(([x, y]) => { K.line(x, y, hx, hy, 3.2, '#a16207'); K.line(x, y, hx, hy, 1.2, '#facc15'); });
      K.circle(hx, hy + 0.5, 0.5, null, '#374151', 1.2);
      K.hanger(hx, hy + 1.0, S.c.m / 50, S.c.m + ' g');
      K.line(14, 44, 14 + S.h.L0, 44, 3.2, '#a16207'); K.line(14, 44, 14 + S.h.L0, 44, 1.2, '#facc15'); K.text(14, 42.4, 'spare band (unstretched)', 9, '#475569');
    },
    steps: ['Set the tops about 8 cm apart and hang 300 g. Measure α and b.', 'Change to 200 g. Move the tops apart until b is the same again. Measure α.',
      'Measure the unstretched length of the spare band, so e = b − l₀.', 'C = sin α / m for each; k = g/(2eC).'],
    table: {
      cols: [{ k: 'm', label: 'm / kg' }, { k: 'a', label: 'α / °' }, { k: 'b', label: 'b / cm' }],
      derived: [{ k: 'C', label: 'C = sin α / m / kg⁻¹', f: (r) => Math.sin(r.a * deg) / r.m, fmt: (v) => v.toFixed(3) }],
      capture: (S) => ({ m: S.c.m / 1000 }),
    },
    plot: { xs: [{ label: 'm / kg', f: (r) => r.m }], ys: [{ label: 'sin α', f: (r) => Math.sin(r.a * deg) }], origin: true, result: (f) => `C = gradient = <b>${VPL.fmt(f.m, 3)} kg⁻¹</b>` },
    check(S) { const H = S.h, sol = this.solve(S); return `These bands: unstretched length <b>${H.L0.toFixed(1)} cm</b>, k = <b>${H.k.toFixed(1)} N m⁻¹</b>. Right now b = ${sol.b.toFixed(1)} cm and α = ${(sol.alpha / deg).toFixed(1)}°. (If α is near 90° the bands are almost vertical: move the tops further apart.)`; },
  });

  // ---------- Q3: coupled pendulums ----------
  VPL.def('sajc-q3', {
    title: 'Coupled pendulums on a common string',
    intro: '<p>Both pendulums hang 45 cm below the common string. Pull A towards you and release: watch the energy pass to B and back. Time from release until <b>A first stops</b>. Change the separation x, the tension, or the length of B. The lower panel is a side view of the swing (towards/away from you).</p>',
    world: { x: 0, y: 0, w: 80, h: 62 },
    zoom: 4,
    speed: [1, 2, 4],
    hidden: (r) => ({ base: r.uni(8.0, 10.0), slope: r.uni(0.7, 0.9), taut: r.uni(1.45, 1.7), damp: r.uni(0.012, 0.02) }),
    controls: [
      { id: 'x', label: 'Separation x of the pendulums', type: 'range', min: 5, max: 25, step: 0.1, value: 15, hideValue: true },
      { id: 'taut', label: 'Common string', type: 'buttons', value: 'normal', options: [{ value: 'normal', label: 'taut (not fully)' }, { value: 'taut', label: 'as taut as possible' }] },
      { id: 'y', label: 'B shorter than A by', type: 'buttons', value: 0, options: [{ value: 0, label: '0 cm' }, { value: 4, label: '4 cm' }, { value: 8, label: '8 cm' }] },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 20, y: 16, len: 40, angle: 0, w: 2.2, every: 5 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else { S.a = S.b = S.va = S.vb = 0; } },
    actions: [{ label: 'Pull A towards you and release', run(S) { S.a = 0.12; S.b = 0; S.va = S.vb = 0; } }, { label: 'Stop both', run(S) { S.a = S.b = S.va = S.vb = 0; } }],
    init(S) { S.a = S.b = S.va = S.vb = 0; },
    params(S) {
      const H = S.h, L = 0.45, LB = 0.45 - S.c.y / 100;
      const ttarget = (H.base + H.slope * S.c.x) * (S.c.taut === 'taut' ? H.taut : 1);
      const w0 = Math.sqrt(g / L), kap = 2 * w0 * Math.PI / ttarget;   // small-coupling beat: t = π/(ω₂ − ω₁)
      return { wA: g / L, wB: g / LB, kap };
    },
    dt: 1 / 400,
    step(S, dt) {
      const p = this.params(S), d = S.h.damp;
      const aa = -p.wA * S.a - p.kap * (S.a - S.b) - d * S.va, ab = -p.wB * S.b - p.kap * (S.b - S.a) - d * S.vb;
      S.va += aa * dt; S.vb += ab * dt; S.a += S.va * dt; S.b += S.vb * dt;
    },
    draw(K, S) {
      const cx = 40, y0 = 8, half = S.c.x / 2, sag = S.c.taut === 'taut' ? 0.3 : 1.2;
      K.bench(60); K.stand(8, 60, 54); K.stand(72, 60, 54); K.boss(8, 7); K.boss(72, 7);
      K.path([[8, 7], [cx - half, y0 + sag * 0.8], [cx, y0 + sag], [cx + half, y0 + sag * 0.8], [72, 7]], 1.0, '#7a5c2e');
      const LA = 45, LB = 45 - S.c.y;
      const ya = y0 + sag * 0.8;
      K.string(cx - half, ya, cx - half, ya + LA); K.bob(cx - half, ya + LA, 1.1 + 0.6 * S.a);
      K.string(cx + half, ya, cx + half, ya + LB); K.bob(cx + half, ya + LB, 1.1 + 0.6 * S.b);
      K.text(cx - half - 2.2, ya + LA, 'A', 11, K.ink, 'right', 700); K.text(cx + half + 2.2, ya + LB, 'B', 11, K.ink, 'left', 700);
      // side-view traces of displacement
      K.rect(4, 4, 18, 10, '#ffffffcc', '#94a3b8', 0.6); K.text(5, 5.4, 'side view of swing', 8, '#475569');
      K.line(8, 9, 8 + S.a * 40, 9, 2.4, '#1550c8'); K.circle(8 + S.a * 40, 9, 0.7, '#1550c8', null); K.text(5, 9, 'A', 8, '#1550c8');
      K.line(8, 12, 8 + S.b * 40, 12, 2.4, '#b45309'); K.circle(8 + S.b * 40, 12, 0.7, '#b45309', null); K.text(5, 12, 'B', 8, '#b45309');
    },
    steps: ['Set x ≈ 15 cm (measure with the rule between the strings). Release A and time until A first stops; repeat.', 'Repeat for at least two more x between 5 cm and 25 cm.', 'At your chosen x, make the string as taut as possible and time again.', 'Try a length difference y and compare with Table 3.1.'],
    table: { cols: [{ k: 'x', label: 'x / cm' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }], derived: [{ k: 't', label: 't / s', f: (r) => (r.t1 + r.t2) / 2, fmt: (v) => v.toFixed(1) }] },
    plot: { xs: [{ label: 'x / cm', f: (r) => r.x }], ys: [{ label: 't / s', f: (r) => r.t }] },
    check(S) { const H = S.h; const t = (H.base + H.slope * S.c.x) * (S.c.taut === 'taut' ? H.taut : 1); return `With the current separation (x = ${(+S.c.x).toFixed(1)} cm) and ${S.c.taut === 'taut' ? 'maximum' : 'normal'} tension, A should first stop after about <b>${t.toFixed(1)} s</b> (equal lengths). A length difference makes the transfer incomplete, so A never quite stops.`; },
  });
})();
