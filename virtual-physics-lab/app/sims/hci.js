/* HCI 2026 Paper 4 simulations */
(function () {
  const g = 9.81;
  const deg = Math.PI / 180;

  // ---------- Q1: three springs at 90° ----------
  VPL.def('hci-q1', {
    title: 'Three springs at 90°',
    intro: '<p>A ring is held by a <b>double spring</b> (left, two springs in series) and a <b>single spring</b> (right). Move the bosses until the springs meet at <b>90°</b> (check it with the protractor), then measure the lengths with the metre rule. Use the magnifier to read the scale to the nearest millimetre.</p>',
    world: { x: 0, y: 0, w: 72, h: 56 },
    zoom: 5,
    hidden: (r) => ({ k: r.uni(36, 44), S: r.uni(3.6, 4.0), mass0: 0.012 }),
    controls: [
      { id: 'm', label: 'Mass m', type: 'select', value: 200, options: [100, 150, 200, 250, 300, 350, 400, 450, 500].map((v) => ({ value: v, label: v + ' g' })) },
      { id: 'yl', label: 'Left boss height', type: 'range', min: 4, max: 30, step: 0.1, value: 8, unit: 'cm from top', hideValue: true },
      { id: 'yr', label: 'Right boss height', type: 'range', min: 4, max: 30, step: 0.1, value: 10, unit: 'cm from top', hideValue: true },
      { id: 'xr', label: 'Right stand position', type: 'range', min: 40, max: 66, step: 0.1, value: 56, hideValue: true },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 0, unit: '°' },
      { id: 'rang', label: 'Metre rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
    ],
    movables: [
      { id: 'rule', type: 'rule', x: 6, y: 40, len: 50, angle: 0, every: 1 },
      { id: 'prot', type: 'protractor', x: 52, y: 46, r: 6, angle: 0 },
    ],
    init(S) { S.P = { x: 30, y: 30 }; S.v = { x: 0, y: 0 }; },
    onchange(S, id) { if (id === 'prot') S.mov.prot.angle = S.c.prot; if (id === 'rang') S.mov.rule.angle = S.c.rang; },
    geo(S) { return { A: { x: 12, y: 2 + +S.c.yl }, B: { x: +S.c.xr - 4, y: 2 + +S.c.yr } }; },
    step(S, dt) {
      const { A, B } = this.geo(S), P = S.P, H = S.h, m = S.c.m / 1000 + H.mass0;
      const dA = Math.hypot(A.x - P.x, A.y - P.y), dB = Math.hypot(B.x - P.x, B.y - P.y);
      const T1 = Math.max(0, (H.k / 2) * (dA - 2 * H.S) / 100), T2 = Math.max(0, H.k * (dB - H.S) / 100);
      const Fx = T1 * (A.x - P.x) / dA + T2 * (B.x - P.x) / dB, Fy = T1 * (A.y - P.y) / dA + T2 * (B.y - P.y) / dB + m * g;
      S.v.x = (S.v.x + (Fx / m) * 100 * dt) * Math.exp(-6 * dt); S.v.y = (S.v.y + (Fy / m) * 100 * dt) * Math.exp(-6 * dt);
      P.x += S.v.x * dt; P.y += S.v.y * dt;
      S.T1 = T1; S.T2 = T2;
    },
    draw(K, S) {
      const { A, B } = this.geo(S), P = S.P, H = S.h;
      K.bench(53);
      K.stand(8, 53, 52); K.stand(+S.c.xr, 53, 52);
      K.clampRod(8, A.y, A.x + 0.6); K.boss(8, A.y);
      K.clampRod(B.x - 0.6, B.y, +S.c.xr); K.boss(+S.c.xr, B.y);
      // double spring: two springs in series, joined by small links
      const mx = (A.x + P.x) / 2, my = (A.y + P.y) / 2;
      K.spring(A.x, A.y, mx, my, { coils: 16, r: 0.55, hook: 0.7 });
      K.spring(mx, my, P.x, P.y, { coils: 16, r: 0.55, hook: 0.7 });
      K.spring(B.x, B.y, P.x, P.y, { coils: 16, r: 0.55, hook: 0.7 });
      K.circle(P.x, P.y, 0.75, null, '#4b5563', 2.2);
      K.line(P.x, P.y + 0.75, P.x, P.y + 3, 1.2, '#374151');
      K.hanger(P.x, P.y + 3, Math.round(S.c.m / 50), S.c.m + ' g');
      K.text(3, 3, 'S (unstretched, one spring) ≈ measure on the spare spring →', 10, '#475569');
      // spare spring for measuring S (lying on bench)
      K.spring(40, 50.4, 40 + H.S, 50.4, { coils: 14, r: 0.5, hook: 0.65 });
      K.text(40, 48.6, 'spare spring', 9, '#475569');
    },
    steps: ['Measure <b>S</b> on the spare spring lying on the bench (outer edge of hook to outer edge).', 'Set m = 200 g. Adjust the bosses until the angle at the ring is 90° (rotate the protractor to check).',
      'Rotate the metre rule to lie along each spring and read <b>S₁</b> (double spring) and <b>S₂</b> (single spring).', 'Repeat for at least five more masses, re-adjusting to 90° each time.',
      'Plot (p²/4 + q²) against m² and find k from the gradient.'],
    table: {
      cols: [{ k: 'm', label: 'm / g' }, { k: 'S1', label: 'S₁ / cm' }, { k: 'S2', label: 'S₂ / cm' }],
      derived: [
        { k: 'p', label: 'p / m', f: (r, S) => (r.S1 - 2 * S.c.Suser) / 100, fmt: (v) => v.toFixed(3) },
        { k: 'q', label: 'q / m', f: (r, S) => (r.S2 - S.c.Suser) / 100, fmt: (v) => v.toFixed(3) },
        { k: 'y', label: '(p²/4 + q²) / m²', f: (r) => r.p * r.p / 4 + r.q * r.q },
        { k: 'x', label: 'm² / kg²', f: (r) => (r.m / 1000) ** 2, fmt: (v) => v.toFixed(4) },
      ],
      capture: (S) => ({ m: S.c.m }),
      help: 'Enter your measured S in the box first (processed columns use it). Type S₁ and S₂ to 0.1 cm.',
    },
    plot: { xs: [{ label: 'm² / kg²', f: (r) => r.x }], ys: [{ label: '(p²/4 + q²) / m²', f: (r) => r.y }], origin: true,
      result: (f) => `k = g/√gradient = <b>${VPL.fmt(g / Math.sqrt(f.m), 3)} N m⁻¹</b>` },
    check(S, f) {
      const H = S.h;
      let s = `This apparatus: k = <b>${H.k.toFixed(1)} N m⁻¹</b> per spring, S = <b>${H.S.toFixed(2)} cm</b>.`;
      if (f) { const k = g / Math.sqrt(f.m); s += ` Your graph gives k = ${k.toFixed(1)} N m⁻¹ (${((k / H.k - 1) * 100).toFixed(1)}% from the true value).`; }
      const ang = this.angle(S);
      s += `<br>Current angle between the springs: ${ang.toFixed(1)}°. ${Math.abs(ang - 90) < 1.5 ? 'Good, that is close to 90°.' : 'Adjust until it is 90° before reading.'}`;
      return s;
    },
    angle(S) { const { A, B } = this.geo(S), P = S.P; const a = Math.atan2(A.y - P.y, A.x - P.x), b = Math.atan2(B.y - P.y, B.x - P.x); let d = Math.abs(a - b) / deg; return d > 180 ? 360 - d : d; },
  });
  // S input lives in the controls list so it persists
  VPL.sims['hci-q1'].controls.push({ id: 'Suser', label: 'Your measured S / cm', type: 'number', value: '', step: 0.1 });

  // ---------- Q2: RC charge / discharge ----------
  VPL.def('hci-q2', {
    title: 'RC circuit: discharge through R₂',
    intro: '<p>Set S to position 1 and wait for the capacitor to charge through R₁. Then switch to position 2 and <b>start the stopwatch at the same moment</b>. Read the ammeter every 10 s up to 50 s. You will probably need a few attempts: recharge in position 1 between runs.</p>',
    world: { x: 0, y: 0, w: 64, h: 40 },
    zoom: 3,
    hidden: (r) => ({ C: 2200e-6 * r.uni(0.9, 1.15), V: r.uni(2.95, 3.1), R1: 3300 * r.uni(0.99, 1.01), R2: 10000 * r.uni(0.99, 1.01) }),
    controls: [{ id: 'sw', label: 'Switch S', type: 'buttons', value: 0, options: [{ value: 1, label: 'Position 1' }, { value: 0, label: 'Open' }, { value: 2, label: 'Position 2' }] }],
    init(S) { S.q = 0; S.I = 0; },
    dt: 1 / 120,
    step(S, dt) {
      const H = S.h; let I = 0;
      if (S.c.sw == 1) I = (H.V - S.q / H.C) / H.R1;
      else if (S.c.sw == 2) I = -(S.q / H.C) / H.R2;
      S.q += I * dt; S.I = I;
    },
    meters: [{ id: 'A', label: 'Ammeter (2 mA range)', unit: 'mA', get: (S) => S.I * 1000, res: 0.001, noise: 0.0006 }],
    draw(K, S) {
      const ink = '#1d2633';
      K.cell(26, 6, 34, 6, 'V');
      K.wire([[10, 6], [26, 6]]); K.wire([[34, 6], [44, 6], [44, 10]]);
      K.resistor(44, 10, 44, 18, ''); K.text(47, 14, 'R₁ = 3.3 kΩ', 10, ink, 'left', 600);
      K.wire([[44, 18], [44, 21]]); K.node(44, 21);
      K.resistor(44, 21, 44, 30, ''); K.text(47, 25.5, 'R₂ = 10 kΩ', 10, ink, 'left', 600);
      K.wire([[44, 30], [44, 34], [10, 34], [10, 24.5]]);
      K.wire([[10, 6], [10, 17.5]]);
      K.circle(10, 17.5, 0.35, '#fff', ink, 1.2); K.circle(10, 24.5, 0.35, '#fff', ink, 1.2);
      K.text(8, 17.5, '1', 10, ink, 'right', 700); K.text(8, 24.5, '2', 10, ink, 'right', 700);
      const pivot = [15, 21];
      K.circle(pivot[0], pivot[1], 0.35, '#fff', ink, 1.2);
      const tip = S.c.sw == 1 ? [10.4, 17.7] : S.c.sw == 2 ? [10.4, 24.3] : [11, 21.2];
      K.line(pivot[0], pivot[1], tip[0], tip[1], 2, '#b45309');
      K.text(13, 15.6, 'S', 11, ink, 'center', 700);
      K.wire([[15.4, 21], [21, 21]]); K.cap(21, 21, 26, 21, 'C'); K.text(22.6, 19.2, '+', 10, ink); K.text(24.6, 19.2, '−', 10, ink);
      K.wire([[26, 21], [29, 21]]); K.dial(31, 21, 2, 'A'); K.wire([[33, 21], [44, 21]]);
      const I = S.I * 1000 + 0.0006 * VPL.gauss();
      K.meterBox(26, 26, 'mA', (I).toFixed(3), 'DC', 11);
      const Vc = S.q / S.h.C;
      K.rect(52, 6, 9, 14, '#f8fafc', '#94a3b8', 1);
      K.rect(53.5, 8 + 10 * (1 - Math.min(1, Vc / S.h.V)), 6, 10 * Math.min(1, Vc / S.h.V), 'rgba(21,80,200,0.35)', null);
      K.text(56.5, 21.6, 'charge on C', 9, '#475569', 'center');
    },
    steps: ['Put S in position 1 and wait about 20 s. Record the ammeter reading I.', 'Switch to position 2 and start the stopwatch together. Read I at t = 0, 10, 20, 30, 40 and 50 s.',
      'Recharge and repeat to fill in any readings you missed.', 'Plot ln|I| against t; the gradient is −1/(R₂C).'],
    table: {
      cols: [{ k: 't', label: 't / s' }, { k: 'I', label: 'I / mA' }],
      derived: [{ k: 'ln', label: 'ln(|I| / mA)', f: (r) => Math.log(Math.abs(r.I)), fmt: (v) => v.toFixed(3) }],
      help: 'Record the magnitude or the signed value. The processed column uses |I|.',
    },
    plot: { xs: [{ label: 't / s', f: (r) => r.t }], ys: [{ label: 'ln(|I| / mA)', f: (r) => r.ln }, { label: 'I / mA', f: (r) => Math.abs(r.I) }],
      result: (f) => `If ln I is plotted: τ = −1/gradient = <b>${VPL.fmt(-1 / f.m, 3)} s</b>, C = τ/R₂ = <b>${VPL.fmt(-1 / f.m / 1e4 * 1e6, 3)} µF</b>` },
    check(S, f) {
      const H = S.h, tau = H.R2 * H.C;
      let s = `This apparatus: C = <b>${(H.C * 1e6).toFixed(0)} µF</b>, cell V = ${H.V.toFixed(2)} V, so τ = R₂C = <b>${tau.toFixed(1)} s</b> and I(0) = ${(H.V / H.R2 * 1000).toFixed(3)} mA.`;
      if (f && f.m < 0) s += ` Your ln I graph gives τ = ${(-1 / f.m).toFixed(1)} s.`;
      return s;
    },
  });

  // ---------- Q3: bent-wire torsion pendulum ----------
  VPL.def('hci-q3', {
    title: 'Bent-wire torsion pendulum',
    intro: '<p>The V-shaped wire hangs from a rubber band looped over a rod. Set the bend angle, then <b>measure θ with the protractor</b> and <b>C with the rule</b> while the wire is still. Press <b>Twist and release</b> and time the oscillations about the vertical axis with the stopwatch. The micrometer and vernier close-ups are below.</p>',
    world: { x: 0, y: 0, w: 60, h: 46 },
    zoom: 5,
    hidden: (r) => ({ k1: r.uni(2.6, 3.4) * 1e-3, Clong: r.uni(16.0, 16.8), Cshort: r.uni(8.8, 9.4), d: r.uni(0.90, 0.94), D: r.uni(2.49, 2.55), dth: r.uni(-2.5, 2.5), m: 0.068 }),
    controls: [
      { id: 'th', label: 'Bend the wire to about', type: 'range', min: 30, max: 150, step: 1, value: 40, unit: '°' },
      { id: 'wire', label: 'Wire', type: 'buttons', value: 'long', options: [{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }] },
      { id: 'n', label: 'Loops of rubber band', type: 'buttons', value: 2, options: [1, 2, 3, 4] },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 180, unit: '°' },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' },
    ],
    movables: [
      { id: 'rule', type: 'rule', x: 44, y: 6, len: 30, angle: 90, w: 2.4 },
      { id: 'prot', type: 'protractor', x: 30, y: 8.6, r: 5.5, angle: 180 },
    ],
    onchange(S, id) { if (id === 'prot') S.mov.prot.angle = S.c.prot; if (id === 'rang') S.mov.rule.angle = S.c.rang; if (id !== 'prot' && id !== 'rang') { S.amp = 0; S.phi = 0; } },
    actions: [{ label: 'Twist and release (≈ 90°)', run: (S) => { S.amp = 90 * deg; S.t0 = S.t; } }, { label: 'Stop the wire', run: (S) => { S.amp = 0; } }],
    init(S) { S.amp = 0; S.t0 = 0; },
    params(S) {
      const H = S.h, C = S.c.wire === 'long' ? H.Clong : H.Cshort, th = (+S.c.th + H.dth) * deg;
      const n = +S.c.n, k = H.k1 * n * n * (1 - 0.06 * (n - 1));
      return { C, th, k, T: 2 * Math.PI * (C / 100) * Math.sin(th / 2) * Math.sqrt(H.m / k) };
    },
    step(S) { const p = this.params(S); S.phi = S.amp ? S.amp * Math.exp(-0.035 * (S.t - S.t0)) * Math.cos(2 * Math.PI * (S.t - S.t0) / p.T) : 0; },
    draw(K, S) {
      const p = this.params(S), O = { x: 30, y: 8.6 };
      K.bench(44);
      K.stand(52, 44, 42); K.clampRod(12, 4.5, 52); K.boss(52, 4.5);
      K.rect(28.8, 4.0, 2.4, 4.4, '#d6c08a', '#7c6a45', 1); // rubber band loops
      for (let i = 0; i < S.c.n; i++) K.line(28.9, 5 + i * 0.8, 31.1, 5 + i * 0.8, 1, '#7c6a45');
      const half = p.th / 2, cphi = Math.cos(S.phi || 0), sphi = Math.sin(S.phi || 0);
      [-1, 1].forEach((sgn) => {
        const bx = O.x + sgn * p.C * Math.sin(half) * cphi, by = O.y + p.C * Math.cos(half), z = sgn * sphi;
        K.path([[O.x, O.y], [O.x + (bx - O.x) * 0.5 + sgn * 0.3, O.y + (by - O.y) * 0.5], [bx, by - 1.0]], 1.8, '#475569');
        K.circle(bx, by - 1.0, 0.35, null, '#475569', 1.4);
        K.bob(bx, by, 1.25 * (1 + 0.12 * z));
      });
      K.text(5, 41, (S.c.wire === 'long' ? 'long wire' : 'short wire') + ' · ' + S.c.n + ' loop' + (S.c.n > 1 ? 's' : ''), 10, '#475569');
    },
    closeups: [
      { type: 'micrometer', title: 'Micrometer: wire diameter d', help: 'Zero error is 0.00 mm. Each reading is at a different point along the wire.', get: (S, n) => S.h.d + (((n * 7919) % 5) - 2) * 0.004 },
      { type: 'vernier', title: 'Vernier caliper: bob diameter D', help: 'Read the main scale at the vernier zero, then find the vernier line that best matches a main-scale line.', get: (S, n) => S.h.D + (((n * 104729) % 3) - 1) * 0.008 },
    ],
    steps: ['Measure d (micrometer) and D (vernier) below.', 'Set θ ≈ 40°. Measure θ with the protractor at the bend and C (bend to bob centre) with the rule.',
      'Twist and release; time 10 oscillations twice and find T.', 'Repeat for at least five more values of θ between 40° and 140°.',
      'Plot T against sin(θ/2). k = m(2πC/gradient)², with m = 68.0 g.', 'Part (e): compare the long and short wires at the same θ using T = πL√z.'],
    table: {
      cols: [{ k: 'th', label: 'θ / °' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }],
      derived: [{ k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 20, fmt: (v) => v.toFixed(3) }, { k: 's', label: 'sin(θ/2)', f: (r) => Math.sin(r.th * deg / 2), fmt: (v) => v.toFixed(3) }],
      help: 't₁ and t₂ are the times for 10 oscillations. Enter your measured C in the box below the controls.',
    },
    plot: { xs: [{ label: 'sin(θ/2)', f: (r) => r.s }], ys: [{ label: 'T / s', f: (r) => r.T }], origin: true,
      result: (f, S) => { const C = +S.c.Cuser || 16.4; return `k = m(2πC/gradient)² = <b>${VPL.fmt(0.068 * (2 * Math.PI * C / 100 / f.m) ** 2, 3)} kg m² s⁻²</b> (using C = ${C} cm)`; } },
    check(S, f) {
      const p = this.params(S), H = S.h;
      let s = `This apparatus (${S.c.n} loops): k = <b>${p.k.toExponential(2)} kg m² s⁻²</b>. Long wire C = ${H.Clong.toFixed(1)} cm, short wire C = ${H.Cshort.toFixed(1)} cm. The current true θ is ${(p.th / deg).toFixed(1)}° and T = ${p.T.toFixed(3)} s. Wire d = ${H.d.toFixed(2)} mm, bob D = ${H.D.toFixed(2)} cm.`;
      if (f) { const C = +S.c.Cuser || H.Clong; const k = H.m * (2 * Math.PI * C / 100 / f.m) ** 2; s += `<br>Your graph gives k = ${k.toExponential(2)} (${((k / p.k - 1) * 100).toFixed(0)}% from true).`; }
      return s;
    },
  });
  VPL.sims['hci-q3'].controls.push({ id: 'Cuser', label: 'Your measured C / cm', type: 'number', value: '', step: 0.1 });
})();
