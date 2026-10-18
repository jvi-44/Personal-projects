/* DHS 2026 Paper 4 simulations */
(function () {
  const g = 9.81, rho = 1.2;
  const deg = Math.PI / 180;

  // ---------- Q1: paper cone terminal velocity ----------
  VPL.def('dhs-q1', {
    title: 'Falling paper cone',
    intro: '<p>Choose how big a sector to cut from the filter paper. The rest is taped into a cone. Measure its diameter <b>d</b> with the vernier (close-up below). Press <b>Release</b>: the cone starts about 10 cm above the top of the vertical metre rule. Time it from the 100 cm mark until it lands. The fall is short, so repeat several times. Use the slow-motion setting to see the motion (the stopwatch still reads real time).</p>',
    world: { x: 0, y: 0, w: 60, h: 122 },
    zoom: 3,
    hidden: (r) => ({ a: r.uni(5.45, 5.55), mp: r.uni(0.78, 0.86) / 1000, Cd: r.uni(0.76, 0.84) }),
    controls: [
      { id: 'cut', label: 'Sector cut away', type: 'buttons', value: 60, options: [60, 90, 120, 150].map((v) => ({ value: v, label: v + '°' })) },
      { id: 'clips', label: 'Paperclips inside (part g)', type: 'buttons', value: 0, options: [0, 1, 2, 3] },
    ],
    speed: [1, 0.5, 0.25],
    actions: [{ label: 'Release from above the rule', run: (S) => { S.y = 4; S.v = 0; S.falling = true; } }, { label: 'Pick the cone up', run: (S) => { S.falling = false; S.y = 4; S.v = 0; } }],
    onchange(S) { S.falling = false; S.y = 4; S.v = 0; },
    init(S) { S.y = 4; S.v = 0; S.falling = false; },
    cone(S) {
      const H = S.h, phi = (360 - S.c.cut) * deg, d = H.a * phi / Math.PI;
      const m = H.mp * (360 - S.c.cut) / 360 + 0.00045 * S.c.clips;
      const ht = Math.sqrt(Math.max(0.5, H.a * H.a - d * d / 4));
      return { d, m, ht, vt: Math.sqrt(2 * m * g / (rho * H.Cd * Math.PI * (d / 100) ** 2 / 4)) };
    },
    step(S, dt) {
      if (!S.falling) return;
      const c = this.cone(S), b = 0.5 * rho * S.h.Cd * Math.PI * (c.d / 100) ** 2 / 4;
      const a = g - (b / c.m) * S.v * S.v;
      S.v += a * dt; S.y += S.v * dt * 100;
      if (S.y >= 114 - c.ht) { S.y = 114 - c.ht; S.v = 0; S.falling = false; }
    },
    meters: [],
    draw(K, S) {
      const c = this.cone(S), cx = 30;
      K.bench(114);
      K.stand(16, 114, 104); K.clampRod(16, 30, 41); K.boss(16, 30);
      K.rule(43, 14, 100, 90, { w: 2.4, start: 0 });
      K.text(46.5, 14, '100 cm mark (top)', 9, '#475569');
      const top = S.y, half = c.d / 2;
      K.path([[cx - half, top], [cx + half, top], [cx, top + c.ht]], 1.4, '#64748b', true, '#f8fafc');
      K.path([[cx - half, top], [cx + half, top]], 1.4, '#64748b');
      for (let i = 0; i < S.c.clips; i++) K.rect(cx - 0.6, top + c.ht - 1.6 - i * 0.7, 1.2, 0.5, '#94a3b8', null);
      K.text(3, 6, S.falling ? 'falling…' : 'cone held', 9, '#94a3b8');
    },
    closeups: [{ type: 'vernier', title: 'Vernier calipers: diameter of the cone rim', help: 'The cone is not perfectly round: take two perpendicular readings and average.', again: 'Measure across another diameter',
      get: (S, n) => { const c = VPL.sims['dhs-q1'].cone(S); return c.d + ((((n * 7919) % 5) - 2) * 0.03); } }],
    steps: ['Cut a 60° sector and form the cone. Measure d with the vernier (two perpendicular readings).', 'Release the cone. Time from the 100 cm mark to the bench. Repeat at least 5 times; v = 1.000 m / mean t.',
      'Cut a larger sector and repeat. Compare vd for the two cones (and v√d).', 'Part (g): add paperclips. Notice how much faster it falls: why does a stopwatch struggle?'],
    table: {
      cols: [{ k: 'd', label: 'd / cm' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }, { k: 't3', label: 't₃ / s' }],
      derived: [
        { k: 't', label: 'mean t / s', f: (r) => (r.t1 + r.t2 + r.t3) / 3, fmt: (v) => v.toFixed(3) },
        { k: 'v', label: 'v / m s⁻¹', f: (r) => 1 / r.t, fmt: (v) => v.toFixed(2) },
        { k: 'vd', label: 'vd / m² s⁻¹', f: (r) => r.v * r.d / 100, fmt: (v) => v.toFixed(3) },
        { k: 'vr', label: 'v√d', f: (r) => r.v * Math.sqrt(r.d / 100), fmt: (v) => v.toFixed(3) },
      ],
      help: 'h = 1.000 m (100 cm mark to the bench).',
    },
    plot: { xs: [{ label: 'lg(d / cm)', f: (r) => Math.log10(r.d) }, { label: '1/d / cm⁻¹', f: (r) => 1 / r.d }], ys: [{ label: 'lg(v / m s⁻¹)', f: (r) => Math.log10(r.v) }, { label: 'v / m s⁻¹', f: (r) => r.v }],
      result: (f) => `gradient = <b>${VPL.fmt(f.m, 3)}</b> (on lg v against lg d this is the power of d)` },
    check(S) {
      const c = this.cone(S);
      return `This cone: d = <b>${c.d.toFixed(2)} cm</b>, mass ${(c.m * 1000).toFixed(2)} g, terminal velocity <b>${c.vt.toFixed(2)} m s⁻¹</b>, so a 1.000 m fall at terminal velocity takes ${(1 / c.vt).toFixed(3)} s. `
        + 'The paper mass is proportional to d and the drag to v²d², so v ∝ 1/√d: vd is not constant, v√d is.';
    },
  });

  // ---------- Q2: five-resistor network ----------
  VPL.def('dhs-q2', {
    title: 'Five-resistor network',
    intro: '<p>Four resistors R in series (J to N) with the cell and ammeter. A fifth resistor R joins J to a flying lead <b>X</b>. Connect X to J, K, L, M or N (n = 0 … 4), close the switch and read the current. Use the multimeter across the cell, with the switch open, to find E.</p>',
    world: { x: 0, y: 0, w: 64, h: 46 },
    zoom: 3,
    hidden: (r) => ({ R: 33 * r.uni(0.97, 1.03), E: r.uni(1.5, 1.6), r: r.uni(0.5, 1.2), RA: 0.4 }),
    controls: [
      { id: 'X', label: 'Connect X to', type: 'buttons', value: 0, options: ['J', 'K', 'L', 'M', 'N'].map((v, i) => ({ value: i, label: v })) },
      { id: 'sw', label: 'Switch', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
      { id: 'Euser', label: 'Your measured E / V', type: 'number', value: '', step: 0.01 },
    ],
    I(S) {
      if (!S.c.sw) return 0;
      const H = S.h, n = +S.c.X;
      return H.E / (H.R * (4 - n * n / (n + 1)) + H.r + H.RA);
    },
    meters: [
      { id: 'A', label: 'Ammeter (200 mA)', unit: 'mA', get: (S) => VPL.sims['dhs-q2'].I(S) * 1000, res: 0.01, noise: 0.01 },
      { id: 'V', label: 'Multimeter across the cell', unit: 'V', get: (S) => S.h.E - VPL.sims['dhs-q2'].I(S) * S.h.r, res: 0.01, noise: 0.002 },
    ],
    draw(K, S) {
      const ink = '#1d2633', xr = 36, ys = [8, 16, 24, 32, 40];   // N, M, L, K, J from top
      K.cell(16, 4, 24, 4, 'E');
      K.wire([[6, 4], [16, 4]]); K.wire([[24, 4], [xr, 4], [xr, ys[0]]]);
      ['N', 'M', 'L', 'K'].forEach((lab, i) => { K.resistor(xr, ys[i], xr, ys[i + 1], ''); K.text(xr + 2, (ys[i] + ys[i + 1]) / 2, 'R', 11, ink, 'left', 700); });
      ['N', 'M', 'L', 'K', 'J'].forEach((lab, i) => { K.circle(xr, ys[i], 0.35, '#fff', ink, 1.2); K.text(xr - 1.2, ys[i], lab, 11, ink, 'right', 700); });
      K.wire([[xr, ys[4]], [xr, 43], [16, 43]]);
      K.switchSym(12, 43, 16, !!S.c.sw, 'S');
      K.wire([[12, 43], [6, 43], [6, 26]]); K.dial(6, 22, 2.4, 'A'); K.wire([[6, 19.6], [6, 4]]);
      // fifth resistor from J to X
      K.wire([[xr, 42], [48, 42], [48, 36]]); K.resistor(48, 36, 48, 28, ''); K.text(50, 32, 'R', 11, ink, 'left', 700);
      const n = +S.c.X, ty = ys[4 - n];
      K.path([[48, 28], [48, 24], [44, ty - 0.3 * 0], [xr + 0.4, ty]], 1.6, '#b45309');
      K.text(47, 21.5, 'X', 12, '#b45309', 'center', 700);
      K.text(52, 8, 'n = ' + n, 12, ink, 'left', 700);
    },
    steps: ['Connect X to J (n = 0), close the switch and read I₀. Open the switch.', 'Repeat with X at K, L, M and N (n = 1 … 4).',
      'With the switch open, read E across the cell with the multimeter and type it in the box.', 'Plot 1/I against n²/(n + 1). R = −gradient × E.'],
    table: {
      cols: [{ k: 'n', label: 'n' }, { k: 'I', label: 'I / mA' }],
      derived: [{ k: 'x', label: 'n²/(n + 1)', f: (r) => r.n * r.n / (r.n + 1), fmt: (v) => v.toFixed(3) }, { k: 'y', label: '(1/I) / A⁻¹', f: (r) => 1000 / r.I, fmt: (v) => v.toFixed(2) }],
      capture: (S) => ({ n: +S.c.X }),
    },
    plot: { xs: [{ label: 'n²/(n + 1)', f: (r) => r.x }], ys: [{ label: '(1/I) / A⁻¹', f: (r) => r.y }],
      result: (f, S) => { const E = +S.c.Euser; return `x-intercept = <b>${VPL.fmt(-f.c / f.m, 3)}</b>` + (E ? `; R = −gradient × E = <b>${VPL.fmt(-f.m * E, 3)} Ω</b>` : ' (type your E to get R)'); } },
    check(S, f) {
      const H = S.h;
      let s = `This apparatus: R = <b>${H.R.toFixed(1)} Ω</b>, E = <b>${H.E.toFixed(3)} V</b>, cell internal resistance ${H.r.toFixed(2)} Ω and ammeter ${H.RA} Ω.`;
      s += ` The extra resistance makes the x-intercept (4R + r + R_A)/R = ${((4 * H.R + H.r + H.RA) / H.R).toFixed(3)}, slightly above 4.`;
      if (f && +S.c.Euser) s += ` Your R: ${(-f.m * S.c.Euser).toFixed(1)} Ω.`;
      return s;
    },
  });

  // ---------- Q3: bifilar suspension ----------
  VPL.def('dhs-q3', {
    title: 'Bifilar suspension (playground ride)',
    intro: '<p>The bottom half-metre rule hangs from the top rule by two string loops a distance <b>d</b> apart. Measure <b>d</b> and <b>l</b> with the movable rule. Press <b>Twist and release</b>: the rule turns about a vertical axis (the top-view inset shows the angle). Time 10 or 20 oscillations. For part (e), add the two masses and move them to a distance <b>x</b> either side of the centre.</p>',
    world: { x: 0, y: 0, w: 70, h: 56 },
    zoom: 4,
    hidden: (r) => ({ Mr: r.uni(0.044, 0.048), lS: r.uni(19.9, 20.5), lL: r.uni(34.8, 35.4), m: 0.05, Im: 2e-6 }),
    controls: [
      { id: 'loops', label: 'String loops', type: 'buttons', value: 'short', options: [{ value: 'short', label: 'Shorter' }, { value: 'long', label: 'Larger' }] },
      { id: 'd', label: 'Separation of the loops', type: 'range', min: 20, max: 44, step: 0.1, value: 40, hideValue: true },
      { id: 'mass', label: 'Two masses on the rule', type: 'toggle', value: false, labels: ['Off', 'On'] },
      { id: 'x', label: 'Mass positions (± from centre)', type: 'range', min: 0, max: 24, step: 0.1, value: 4, hideValue: true },
      { id: 'rang', label: 'Movable rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 10, y: 52, len: 50, angle: 0, w: 2.2 }],
    meters: [{ id: 'M', label: 'Balance: rule + both masses', unit: 'g', get: (S) => (S.h.Mr + 2 * S.h.m) * 1000, res: 0.1, noise: 0 }],
    actions: [{ label: 'Twist and release (≈ 10°)', run: (S) => { S.amp = 10 * deg; S.t0 = S.t; } }, { label: 'Stop the rule', run: (S) => { S.amp = 0; } }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else S.amp = 0; },
    init(S) { S.amp = 0; S.t0 = 0; S.phi = 0; },
    params(S) {
      const H = S.h, l = (S.c.loops === 'short' ? H.lS : H.lL) / 100, d = +S.c.d / 100, x = +S.c.x / 100;
      const on = !!S.c.mass, M = H.Mr + (on ? 2 * H.m : 0);
      const I = H.Mr * (0.25 + 0.025 ** 2) / 12 + (on ? 2 * H.m * x * x + 2 * H.Im : 0);
      return { l, d, x, M, I, T: 2 * Math.PI * Math.sqrt(4 * I * l / (M * g * d * d)) };
    },
    step(S) { const p = this.params(S); S.phi = S.amp ? S.amp * Math.exp(-0.03 * (S.t - S.t0)) * Math.cos(2 * Math.PI * (S.t - S.t0) / p.T) : 0; },
    draw(K, S) {
      const p = this.params(S), cx = 35, yt = 8, ink = '#475569';
      K.bench(54);
      K.stand(6, 54, 50); K.stand(64, 54, 50);
      K.clampRod(6, yt + 0.8, 10); K.clampRod(60, yt + 0.8, 64); K.boss(6, yt + 0.8); K.boss(64, yt + 0.8);
      K.rule(10, yt, 50, 0, { w: 1.6 });
      const yb = yt + 1.6 + p.l * 100, c = Math.cos(S.phi || 0), hd = p.d * 50;
      [-1, 1].forEach((s) => { K.string(cx + s * hd, yt + 1.6, cx + s * hd * c, yb); K.string(cx + s * hd + 0.4, yt + 1.6, cx + s * hd * c + 0.4, yb); });
      K.rule(cx - 25 * c, yb, 50 * c, 0, { w: 1.4 });
      if (S.c.mass) [-1, 1].forEach((s) => K.rect(cx + s * p.x * 100 * c - 1.2, yb - 2.2, 2.4, 2.2, '#64748b', '#334155'));
      // top view
      const ox = 56, oy = 40, r = 6;
      K.rect(ox - 7.5, oy - 6.5, 15, 13, '#f8fafc', '#cbd5e1', 1);
      K.text(ox, oy - 5.2, 'top view', 8, ink, 'center');
      const ex = r * Math.cos(S.phi || 0), ey = r * Math.sin(S.phi || 0);
      K.line(ox - ex, oy - ey, ox + ex, oy + ey, 2.4, '#c8a45a');
      K.circle(ox, oy, 0.25, ink, null);
      K.text(ox, oy + 5.6, `${((S.phi || 0) / deg).toFixed(0)}°`, 8, ink, 'center');
    },
    steps: ['Shorter loops, d ≈ 40 cm. Measure d and l (bottom face of the top rule to the top face of the bottom rule).', 'Twist and release. Time 20 oscillations twice to find T.',
      'Larger loops, smaller d (≈ 30 cm): measure d, l and T again. Work out k = T²d²/l for both.', 'Part (e): masses on, larger loops, same d. Vary x from about 4 to 24 cm and find T each time.',
      'Plot T² against x². The intercept C gives I₀ = CMgd²/(4π²l), using M from the balance.'],
    table: {
      cols: [{ k: 'x', label: 'x / cm' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }],
      derived: [
        { k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 20, fmt: (v) => v.toFixed(3) },
        { k: 'T2', label: 'T² / s²', f: (r) => r.T * r.T, fmt: (v) => v.toFixed(3) },
        { k: 'x2', label: 'x² / m²', f: (r) => (r.x / 100) ** 2, fmt: (v) => v.toFixed(4) },
      ],
      help: 't₁ and t₂ are the times for 10 oscillations (part e).',
    },
    plot: { xs: [{ label: 'x² / m²', f: (r) => r.x2 }], ys: [{ label: 'T² / s²', f: (r) => r.T2 }], origin: true,
      result: (f) => `C = <b>${VPL.fmt(f.c, 3)} s²</b>, gradient = <b>${VPL.fmt(f.m, 3)} s² m⁻²</b>` },
    check(S, f) {
      const p = this.params(S), H = S.h;
      let s = `Right now: d = <b>${(p.d * 100).toFixed(1)} cm</b>, l = <b>${(p.l * 100).toFixed(1)} cm</b>, T = <b>${p.T.toFixed(3)} s</b>. Rule mass ${(H.Mr * 1000).toFixed(1)} g, so k = 16π²I₀/(M_rule g) = ${(16 * Math.PI ** 2 * (0.25 + 0.025 ** 2) / 12 / g).toFixed(3)} s² m.`;
      if (f) s += ` From your intercept, the printed formula gives I₀ = ${(f.c * (H.Mr + 2 * H.m) * g * p.d * p.d / (4 * Math.PI ** 2 * p.l)).toExponential(2)} kg m² (4× the true ${(H.Mr * 0.250625 / 12).toExponential(2)}).`;
      return s;
    },
  });
})();
