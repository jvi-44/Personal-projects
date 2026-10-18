/* NJC 2026 Paper 4 simulations */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q1: capacitor timing circuit ----------
  const COMBOS = [
    { v: 'p3', label: 'three 5 kΩ in parallel', f: (r) => 1 / (1 / r[0] + 1 / r[1] + 1 / r[2]) },
    { v: 'p2', label: 'two in parallel', f: (r) => 1 / (1 / r[0] + 1 / r[1]) },
    { v: 's1', label: 'one 5 kΩ', f: (r) => r[0] },
    { v: 'sp', label: 'one + (two in parallel)', f: (r) => r[2] + 1 / (1 / r[0] + 1 / r[1]) },
    { v: 's2', label: 'two in series', f: (r) => r[0] + r[1] },
    { v: 's3', label: 'three in series', f: (r) => r[0] + r[1] + r[2] },
  ];
  VPL.def('njc-q1', {
    title: 'Capacitor timing circuit',
    intro: '<p>With S1 open and S2 closed, close switch A and read V. Then (A closed) open S2, <b>close S1 and start the stopwatch together</b>. The reading jumps negative and creeps back up; stop the watch as it passes 0.00 V. Open A and S1, close S2 to discharge before the next run.</p>',
    world: { x: 0, y: 0, w: 66, h: 44 },
    zoom: 3,
    hidden: (r) => ({ C: 2200e-6 * r.uni(0.9, 1.1), P: 4.7 * r.uni(0.98, 1.02), E: r.uni(3.92, 4.04), r5: [r.uni(4.9, 5.1), r.uni(4.9, 5.1), r.uni(4.9, 5.1)] }),
    controls: [
      { id: 'A', label: 'Switch A', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
      { id: 'S1', label: 'Switch S1', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
      { id: 'S2', label: 'Switch S2', type: 'toggle', value: true, labels: ['Open', 'Closed'] },
      { id: 'comb', label: 'Resistors between W and Z', type: 'select', value: 's1', options: COMBOS.map((c) => ({ value: c.v, label: c.label })) },
    ],
    init(S) { S.Vc = 0; },
    R(S) { return COMBOS.find((c) => c.v === S.c.comb).f(S.h.r5); },
    dt: 1 / 120,
    step(S, dt) {
      const H = S.h, R = (this.R(S) + H.P) * 1e3;
      if (S.c.S2) S.Vc += (0 - S.Vc) * Math.min(1, dt / 0.05);
      else if (S.c.S1 && S.c.A) S.Vc += (H.E - S.Vc) * dt / (R * H.C);
      else if (S.c.S1) S.Vc += (0 - S.Vc) * dt / ((R + 2000) * H.C);
    },
    volt(S) {
      if (!S.c.A) return 0;
      const E = S.h.E; let VY = 0;
      if (S.c.S1 && S.c.S2) VY = E; else if (S.c.S1) VY = E - S.Vc;
      return E / 2 - VY;
    },
    meters: [
      { id: 'V', label: 'Voltmeter', unit: 'V', get: (S) => VPL.sims['njc-q1'].volt(S), res: 0.01, noise: 0.002 },
      { id: 'R', label: 'Multimeter (W–Z)', unit: 'kΩ', get: (S) => VPL.sims['njc-q1'].R(S), res: 0.01 },
    ],
    draw(K, S) {
      const ink = K.ink;
      K.cell(30, 5, 34, 5, '4 V'); K.wire([[8, 5], [30, 5]]); K.wire([[34, 5], [44, 5]]); K.switchSym(44, 5, 50, S.c.A, 'switch A'); K.wire([[50, 5], [58, 5], [58, 11]]);
      K.wire([[8, 5], [8, 11]]); K.node(8, 11); K.wire([[8, 11], [14, 11]]); K.resistor(14, 11, 24, 11, '1 kΩ'); K.wire([[24, 11], [36, 11]]); K.node(30, 11);
      K.resistor(36, 11, 46, 11, '1 kΩ'); K.wire([[46, 11], [58, 11]]); K.node(58, 11); K.text(59.5, 11, 'X', 11, ink, 'left', 700);
      K.wire([[30, 11], [30, 14]]); K.dial(30, 16, 2, 'V'); K.wire([[30, 18], [30, 26]]); K.node(30, 26); K.text(31, 24.6, 'Y', 11, ink, 'left', 700);
      K.wire([[8, 11], [8, 17]]); K.switchSym(8, 17, 8.01, S.c.S1, ''); K.text(5, 19.5, 'S1', 10, ink, 'right', 700);
      K.line(8, 17, S.c.S1 ? 8 : 10.5, S.c.S1 ? 23 : 21.5, 1.6, '#b45309');
      K.node(8, 26); K.wire([[8, 23], [8, 26], [20, 26]]); K.cap(20, 26, 25, 26, 'C'); K.wire([[25, 26], [30, 26]]);
      K.line(8, 26, S.c.S2 ? 8 : 10.5, S.c.S2 ? 32 : 30.5, 1.6, '#b45309'); K.text(5, 29.5, 'S2', 10, ink, 'right', 700);
      K.wire([[8, 32], [8, 36], [30, 36], [30, 26]]);
      K.wire([[30, 26], [34, 26]]); K.resistor(34, 26, 42, 26, 'P'); K.wire([[42, 26], [45, 26]]); K.node(45, 26); K.text(45, 28.2, 'W', 10, ink, 'center', 700);
      K.rect(46, 24, 8, 4, '#eef2ff', '#64748b', 0.8); K.text(50, 26, COMBOS.find((c) => c.v === S.c.comb).label, 7, '#334155', 'center');
      K.node(55, 26); K.text(55, 28.2, 'Z', 10, ink, 'center', 700); K.wire([[55, 26], [58, 26], [58, 11]]);
      K.meterBox(34, 33, 'V', VPL.sims['njc-q1'].volt(S).toFixed(2), 'DC', 11);
    },
    steps: ['Measure R between W and Z with the multimeter.', 'S1 open, S2 closed: close A and record V. Open A.', 'Close A, open S2, then close S1 and start the stopwatch together. Stop it when V passes zero; record t.',
      'Open A and S1, close S2 (discharge). Repeat for six combinations of the 5 kΩ resistors.', 'Plot t against R; b/a = intercept/gradient.'],
    table: { cols: [{ k: 'R', label: 'R / kΩ' }, { k: 't', label: 't / s' }], capture: (S) => ({ R: VPL.sims['njc-q1'].R(S).toFixed(2) }) },
    plot: { xs: [{ label: 'R / kΩ', f: (r) => r.R }], ys: [{ label: 't / s', f: (r) => r.t }], result: (f) => `b/a = <b>${VPL.fmt(f.c / f.m, 3)} kΩ</b>; C = a/ln 2 = ${VPL.fmt(f.m / Math.LN2 * 1e-3 * 1e6, 3)} µF` },
    check(S, f) { const H = S.h; return `This circuit: P = <b>${H.P.toFixed(2)} kΩ</b>, C = <b>${(H.C * 1e6).toFixed(0)} µF</b>, supply = ${H.E.toFixed(2)} V. Theory: t = (P + R)C ln 2, so b/a should equal P.` + (f ? ` Your b/a = ${(f.c / f.m).toFixed(2)} kΩ.` : ''); },
  });

  // ---------- Q2: cooling of hot water ----------
  const CONT = { small: { r: 2.6, label: 'small beaker (100 ml)' }, large: { r: 4.2, label: 'large beaker' }, wide: { r: 6.0, label: 'wide dish' }, tall: { r: 1.9, label: 'narrow tube' } };
  VPL.def('njc-q2', {
    title: 'Cooling of hot water',
    intro: '<p>Pour hot water into the container and read the thermometer (use the magnifier on the scale) every 20 s as it falls from 80 °C to 70 °C. Try other containers with the same 100 g of water to see how the cooling constant k depends on surface area.</p>',
    world: { x: 0, y: 0, w: 60, h: 46 },
    zoom: 5,
    speed: [1, 5, 20],
    hidden: (r) => ({ room: r.uni(27, 30), alpha: r.uni(2.4, 2.8) * 1e-5, beta: r.uni(1.0, 1.4) * 1e-4 }),
    controls: [
      { id: 'cont', label: 'Container', type: 'select', value: 'small', options: Object.entries(CONT).map(([v, c]) => ({ value: v, label: c.label })) },
      { id: 'sensor', label: 'Temperature sensor', type: 'toggle', value: false, labels: ['Off', 'On (0.1 °C)'] },
    ],
    actions: [{ label: 'Pour in 100 g of hot water (≈ 85 °C)', run(S) { S.th = 84 + Math.random() * 2; S.t = 0; } }],
    init(S) { S.th = S.h.room; },
    k(S) { const r = CONT[S.c.cont].r, h = 100 / (Math.PI * r * r); const Sa = 2 * Math.PI * r * r + 2 * Math.PI * r * h; return S.h.alpha * Sa + S.h.beta; },
    step(S, dt) { S.th += -(S.th - S.h.room) * this.k(S) * dt; },
    meters: [{ id: 'T', label: 'Sensor', unit: '°C', get: (S) => (S.c.sensor ? S.th : null), res: 0.1, noise: 0.03, blank: 'off' }],
    draw(K, S) {
      const c = CONT[S.c.cont], r = c.r, h = 100 / (Math.PI * r * r), base = 40, cx = 22;
      K.bench(42);
      K.rect(cx - r - 0.4, base - h - 3, 2 * r + 0.8, h + 3, null, '#64748b', 1.6);
      const hot = Math.max(0, Math.min(1, (S.th - S.h.room) / 55));
      K.rect(cx - r, base - h, 2 * r, h, `rgba(${Math.round(120 + 120 * hot)},${Math.round(170 - 60 * hot)},${Math.round(230 - 150 * hot)},0.5)`, null);
      // thermometer: 0.5 °C small ticks, 1 °C, labels every 10
      const tx = cx + r * 0.4, tTop = 4, scale = 0.38; // cm per °C
      K.rect(tx - 0.45, tTop, 0.9, 38 - tTop, '#f8fafc', '#64748b', 0.8);
      K.circle(tx, 39.6, 0.9, '#dc2626', '#7f1d1d', 0.8);
      const y0 = 38;  // 0 °C at y = 38 - 0*scale ... use 0..90 °C over 34 cm
      const Y = (T) => y0 - (T / 100) * 34;
      K.rect(tx - 0.12, Y(S.th), 0.24, 39 - Y(S.th), '#dc2626', null);
      for (let T = 0; T <= 100; T++) { const L = T % 10 === 0 ? 0.9 : T % 5 === 0 ? 0.65 : 0.4; K.line(tx + 0.45, Y(T), tx + 0.45 + L, Y(T), T % 10 ? 0.6 : 1); if (T % 10 === 0) K.text(tx + 1.7, Y(T), String(T), 8, K.ink, 'left', 600); }
      K.text(cx, 44.5, c.label + ' · r = ' + r.toFixed(1) + ' cm', 9, '#475569', 'center');
      if (S.c.sensor) { K.line(cx - r * 0.4, base - h - 6, cx - r * 0.4, base - 1.5, 2, '#334155'); K.text(cx - r * 0.4, base - h - 7, 'sensor', 9, '#334155', 'center'); }
    },
    steps: ['Pour in the hot water. When the thermometer passes 80 °C, start the stopwatch.', 'Read θ every 20 s until it falls below 70 °C.', 'Plot θ against t and draw a tangent at 75 °C for dθ/dt.', 'Planning extension: repeat in other containers (same 100 g) and find k from ln(θ − θ_room) against t.'],
    table: {
      cols: [{ k: 't', label: 't / s' }, { k: 'th', label: 'θ / °C' }],
      derived: [{ k: 'ln', label: 'ln(θ − θ_room)', f: (r, S) => Math.log(r.th - (+S.c.room || 30)), fmt: (v) => v.toFixed(4) }],
      help: 'Enter room temperature in the box below the controls (default 30 °C) for the ln column.',
    },
    plot: { xs: [{ label: 't / s', f: (r) => r.t }], ys: [{ label: 'θ / °C', f: (r) => r.th }, { label: 'ln(θ − θ_room)', f: (r) => r.ln }],
      result: (f) => `gradient = ${VPL.fmt(f.m, 3)} (for the θ–t data this is the average dθ/dt; for ln data k = −gradient = <b>${VPL.fmt(-f.m, 3)} s⁻¹</b>)` },
    check(S) { const k = this.k(S); return `Room temperature = <b>${S.h.room.toFixed(1)} °C</b>. For the ${CONT[S.c.cont].label}, k = <b>${k.toExponential(2)} s⁻¹</b>, so at 75 °C dθ/dt = −k(75 − θ_room) = <b>${(-k * (75 - S.h.room)).toFixed(3)} °C s⁻¹</b>.`; },
  });
  VPL.sims['njc-q2'].controls.push({ id: 'room', label: 'Room temperature you use / °C', type: 'number', value: 30, step: 0.5 });

  // ---------- Q3: conical pendulum ----------
  VPL.def('njc-q3', {
    title: 'Conical pendulum',
    intro: '<p>Left: side view with the knot in your hand. Right: the graph paper seen from above. Set the compass, draw the circle, set the knot distance p, then start the bob circling just above the circle and time 20 revolutions. Measure D on the paper and p on the string with the rule.</p>',
    world: { x: 0, y: 0, w: 92, h: 50 },
    zoom: 5,
    hidden: (r) => ({ wob: r.uni(0.15, 0.35), dr: r.uni(-0.2, 0.2), knot: r.uni(-0.15, 0.15) }),
    controls: [
      { id: 'rad', label: 'Compass radius', type: 'range', min: 7, max: 10, step: 0.05, value: 9, hideValue: true },
      { id: 'p', label: 'Knot distance from bob', type: 'range', min: 11, max: 22, step: 0.05, value: 19, hideValue: true },
      { id: 'run', label: 'Bob', type: 'toggle', value: false, labels: ['At rest', 'Circling'] },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 34, y: 4, len: 30, angle: 90, w: 2.4 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; },
    init(S) { S.ph = 0; },
    geom(S) {
      const H = S.h, p = +S.c.p + H.knot, rho = (S.c.run ? +S.c.rad + H.dr + H.wob * Math.sin(S.t * 0.37) : 0);
      const th = Math.asin(Math.min(0.95, rho / p)), T = 2 * Math.PI * Math.sqrt((p / 100) * Math.cos(th) / g);
      return { p, rho, th, T };
    },
    step(S, dt) { const G = this.geom(S); if (S.c.run) S.ph += 2 * Math.PI * dt / G.T; },
    draw(K, S) {
      const G = this.geom(S);
      // side view
      const kx = 20, ky = 6, z = 1;
      K.text(18, 2, 'side view', 10, '#475569', 'center', 700);
      const bx = kx + G.rho * Math.cos(S.ph) * 0.95, by = ky + G.p * Math.cos(G.th);
      K.rect(0, 40, 40, 0.5, '#e7e5e4', '#a8a29e', 0.6);
      K.text(20, 42.3, 'graph paper on the bench', 8.5, '#78716c', 'center');
      K.circle(kx, ky - 0.6, 0.6, '#7a5c2e', null); K.text(kx - 1.6, ky - 1.8, 'knot (held)', 8.5, '#475569', 'right');
      K.string(kx, ky, bx, by - 1.0); K.bob(bx, by, 1.0 * z);
      K.line(kx, ky, kx, 40, 0.6, 'rgba(71,85,105,0.5)');
      // top view
      const cx = 66, cy = 24;
      K.text(66, 2, 'top view of the paper', 10, '#475569', 'center', 700);
      K.rect(46, 5, 40, 40, '#fbfaf5', '#cbd5e1', 0.8);
      for (let x = 46; x <= 86; x += 0.5) K.line(x, 5, x, 45, x % 5 === 1 ? 0.6 : 0.25, x % 5 === 1 ? '#93c5fd' : '#dbeafe');
      for (let y = 5; y <= 45; y += 0.5) K.line(46, y, 86, y, y % 5 === 0 ? 0.6 : 0.25, y % 5 === 0 ? '#93c5fd' : '#dbeafe');
      K.circle(cx, cy, +S.c.rad, null, '#334155', 1.1);
      K.line(cx - 0.6, cy - 0.6, cx + 0.6, cy + 0.6, 1.2); K.line(cx - 0.6, cy + 0.6, cx + 0.6, cy - 0.6, 1.2);
      if (S.c.run) K.bob(cx + G.rho * Math.cos(S.ph), cy + G.rho * Math.sin(S.ph), 1.0);
    },
    steps: ['Set the compass to about 9 cm and draw the circle; measure D through the centre with the rule (rotate it to 0°).', 'Set the knot about 19 cm from the bob; measure p with the rule (vertical).',
      'Start the bob circling and time 20 revolutions, twice.', 'sin θ = D/2p. Repeat with p ≈ 13 cm.', 'ε = T²/(p cos θ) for each; g = 4π²/ε.'],
    table: {
      cols: [{ k: 'p', label: 'p / cm' }, { k: 'D', label: 'D / cm' }, { k: 't1', label: 't₁ (20 rev) / s' }, { k: 't2', label: 't₂ (20 rev) / s' }],
      derived: [{ k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 40, fmt: (v) => v.toFixed(3) }, { k: 'th', label: 'θ / °', f: (r) => Math.asin(r.D / (2 * r.p)) / deg, fmt: (v) => v.toFixed(1) },
        { k: 'pc', label: 'p cos θ / m', f: (r) => r.p / 100 * Math.cos(r.th * deg), fmt: (v) => v.toFixed(4) }, { k: 'eps', label: 'ε / s² m⁻¹', f: (r) => r.T * r.T / r.pc, sf: 3 }],
    },
    plot: { xs: [{ label: 'p cos θ / m', f: (r) => r.pc }], ys: [{ label: 'T² / s²', f: (r) => r.T * r.T }], origin: true, result: (f) => `ε = gradient = <b>${VPL.fmt(f.m, 3)} s² m⁻¹</b>, g = 4π²/ε = <b>${VPL.fmt(4 * Math.PI ** 2 / f.m, 3)} m s⁻²</b>` },
    check(S) { const G = this.geom(S); return `Current set-up: true p = <b>${G.p.toFixed(1)} cm</b>, circle diameter = <b>${(2 * S.c.rad).toFixed(1)} cm</b>, θ ≈ ${(G.th / deg).toFixed(1)}°, T = <b>${G.T.toFixed(3)} s</b>. Theory: ε = 4π²/g = 4.02 s² m⁻¹.`; },
  });
})();
