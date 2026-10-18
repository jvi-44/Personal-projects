/* ACJC 2026 Paper 4 simulations (Q2 reuses the ASRJC wire circuit, asrjc-q1) */
(function () {
  const g = 9.81;
  const deg = Math.PI / 180;

  // ---------- Q1: pendulum on a V-shaped string ----------
  VPL.def('acjc-q1', {
    title: 'Pendulum on a V-shaped string',
    intro: '<p>The bob hangs from a vertical string of length <b>l</b> tied to the vertex of a V-shaped string. The ends of the V are fixed to a metre rule. Slide the ends apart to change θ. <b>Measure θ with the protractor</b> at the vertex and <b>l with the vertical rule</b>. Then press <b>Displace and release</b>: the bob swings at right angles to the rule (into the screen). The small side view shows the swing. Time 20 oscillations with the stopwatch.</p>',
    world: { x: 0, y: 0, w: 64, h: 54 },
    zoom: 5,
    hidden: (r) => ({ a: r.uni(19.7, 20.3), r: 0.8, dl: r.uni(-0.25, 0.25) }),
    controls: [
      { id: 's', label: 'Slide the string ends apart', type: 'range', min: 15, max: 39, step: 0.1, value: 28, hideValue: true },
      { id: 'l', label: 'Vertical string length (re-tie)', type: 'range', min: 15, max: 25, step: 0.1, value: 20, hideValue: true },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 0, unit: '°' },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' },
    ],
    movables: [
      { id: 'rule', type: 'rule', x: 46, y: 6, len: 40, angle: 90, w: 2.4 },
      { id: 'prot', type: 'protractor', x: 32, y: 20, r: 5, angle: 0 },
    ],
    onchange(S, id) {
      if (id === 'prot') S.mov.prot.angle = S.c.prot;
      else if (id === 'rang') S.mov.rule.angle = S.c.rang;
      else S.amp = 0;
    },
    actions: [{ label: 'Displace and release', run: (S) => { S.amp = 6 * deg; S.t0 = S.t; } }, { label: 'Stop the bob', run: (S) => { S.amp = 0; } }],
    init(S) { S.amp = 0; S.t0 = 0; },
    params(S) {
      const H = S.h, half = Math.asin(Math.min(0.999, (+S.c.s / 2) / H.a));
      const l = +S.c.l + H.dl, L = l + H.a * Math.cos(half);
      return { half, th: 2 * half / deg, l, L, T: 2 * Math.PI * Math.sqrt(L / 100 / g) };
    },
    step(S) { const p = this.params(S); S.phi = S.amp ? S.amp * Math.exp(-0.02 * (S.t - S.t0)) * Math.cos(2 * Math.PI * (S.t - S.t0) / p.T) : 0; },
    draw(K, S) {
      const p = this.params(S), H = S.h, cx = 32, ry = 5;
      K.bench(52);
      K.stand(58, 52, 50); K.clampRod(52, ry, 58); K.boss(58, ry);
      K.rule(4, ry - 0.9, 52, 0, { w: 1.8 });
      const ax = cx - +S.c.s / 2, bx = cx + +S.c.s / 2, vy = ry + H.a * Math.cos(p.half);
      K.string(ax, ry + 0.9, cx, vy); K.string(bx, ry + 0.9, cx, vy);
      K.circle(ax, ry + 0.9, 0.3, '#7a5c2e', null); K.circle(bx, ry + 0.9, 0.3, '#7a5c2e', null);
      const by = vy + p.l, z = Math.sin(S.phi || 0);
      K.string(cx, vy, cx, by - H.r);
      K.bob(cx, by, H.r * (1 + 0.5 * z));
      // side view: pivot axis is the metre rule, effective length L
      const ox = 6, oy = 30, sc = 0.32;
      K.rect(1, 27, 15, 22, '#f8fafc', '#cbd5e1', 1);
      K.text(8.5, 28.6, 'side view', 9, '#475569', 'center');
      K.circle(ox + 2.5, oy + 0.6, 0.4, '#d6c08a', '#7c6a45');
      const px = ox + 2.5 + sc * p.L * Math.sin(S.phi || 0) * 3, py = oy + 0.6 + sc * p.L * Math.cos(S.phi || 0);
      K.line(ox + 2.5, oy + 0.6, px, py, 1.2, '#7a5c2e');
      K.circle(px, py, 0.6, '#a28a4a', '#6b5a2e');
      K.text(8.5, 47.6, '(swing exaggerated ×3)', 8, '#64748b', 'center');
    },
    steps: ['Set the ends so that θ ≈ 90°. Rotate and drag the protractor to the vertex and read θ. Use the vertical rule to read l (vertex to the centre of the bob).',
      'Displace and release. Time 20 oscillations twice and find T.', 'Repeat for at least five more θ between 50° and 150°, checking l each time.',
      'Plot T² against cos(θ/2). Gradient = 4π²l/g and intercept = c.'],
    table: {
      cols: [{ k: 'th', label: 'θ / °' }, { k: 'l', label: 'l / cm' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }],
      derived: [
        { k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 40, fmt: (v) => v.toFixed(3) },
        { k: 'x', label: 'cos(θ/2)', f: (r) => Math.cos(r.th * deg / 2), fmt: (v) => v.toFixed(3) },
        { k: 'y', label: 'T² / s²', f: (r) => r.T * r.T, fmt: (v) => v.toFixed(3) },
      ],
      help: 't₁ and t₂ are the times for 20 oscillations.',
    },
    plot: { xs: [{ label: 'cos(θ/2)', f: (r) => r.x }], ys: [{ label: 'T² / s²', f: (r) => r.y }], origin: true,
      result: (f) => `c = <b>${VPL.fmt(f.c, 3)} s²</b>; g = 4π²(0.200)/gradient = <b>${VPL.fmt(4 * Math.PI ** 2 * 0.2 / f.m, 3)} m s⁻²</b>` },
    check(S, f) {
      const H = S.h, p = this.params(S);
      let s = `This apparatus: V arms a = <b>${H.a.toFixed(1)} cm</b>. Right now θ = <b>${p.th.toFixed(0)}°</b>, l = <b>${p.l.toFixed(1)} cm</b> and T = <b>${p.T.toFixed(3)} s</b>.`;
      s += ` Theory: T² = 4π²(l + a cos(θ/2))/g, so the gradient is 4π²a/g = ${(4 * Math.PI ** 2 * H.a / 100 / g).toFixed(3)} s² and c = 4π²l/g.`;
      if (f) s += ` Your gradient: ${f.m.toFixed(3)} s², giving g = ${(4 * Math.PI ** 2 * H.a / 100 / f.m).toFixed(2)} m s⁻² with the true arm length.`;
      return s;
    },
  });

  // ---------- Q3: sand through a funnel ----------
  const SRC = { A: 'Container A', B: 'Container B', AB: 'A + B together' };
  VPL.def('acjc-q3', {
    title: 'Sand flowing through a funnel',
    intro: '<p>Containers <b>A</b> and <b>B</b> are identical and hold 90 g of sand between them. There is no balance: measure each <b>depth</b> with the vernier caliper (close-ups below), and share the 90 g in the ratio of the depths. Pour a container into the funnel with your finger over the hole, then press <b>Remove finger</b> and start the stopwatch together. Stop it when the last grains leave.</p>',
    world: { x: 0, y: 0, w: 64, h: 50 },
    zoom: 4,
    hidden: (r) => { const xA = r.uni(2.45, 2.6), xB = xA * r.uni(0.62, 0.7); return { R0: r.uni(5.7, 6.4), xA, xB, mA: 90 * xA / (xA + xB), mB: 90 * xB / (xA + xB) }; },
    controls: [{ id: 'src', label: 'Sand to pour', type: 'buttons', value: 'A', options: Object.keys(SRC).map((k) => ({ value: k, label: SRC[k] })) }],
    actions: [
      { label: 'Pour into the funnel (finger over the hole)', run: (S) => { const H = S.h; S.mf = S.c.src === 'A' ? H.mA : S.c.src === 'B' ? H.mB : 90; S.open = false; S.mc = 0; S.rate = H.R0 * (1 + 0.015 * VPL.gauss()); } },
      { label: 'Remove finger', run: (S) => { if (S.mf > 0) S.open = true; } },
      { label: 'Empty the funnel and container', run: (S) => { S.mf = 0; S.mc = 0; S.open = false; } },
    ],
    init(S) { S.mf = 0; S.mc = 0; S.open = false; S.rate = S.h.R0; },
    step(S, dt) {
      if (!S.open || S.mf <= 0) return;
      const dm = Math.min(S.mf, S.rate * dt);
      S.mf -= dm; S.mc += dm;
      if (S.mf < 1e-6) { S.mf = 0; S.open = false; }
    },
    draw(K, S) {
      const H = S.h, cx = 36, top = 8, apex = 24, half = 9, sand = '#d9b46a', ink = '#475569';
      K.bench(44);
      K.stand(52, 44, 40); K.clampRod(cx + 1, 21, 52); K.boss(52, 21);
      // funnel
      K.path([[cx - half, top], [cx - 0.5, apex], [cx - 0.5, apex + 3.5]], 1.6, ink);
      K.path([[cx + half, top], [cx + 0.5, apex], [cx + 0.5, apex + 3.5]], 1.6, ink);
      if (S.mf > 0) {
        const f = Math.cbrt(S.mf / 90), h = (apex - top) * 0.85 * f, w = half * (h / (apex - top));
        K.path([[cx - w, apex - h], [cx + w, apex - h], [cx, apex]], 1, sand, true, sand);
        K.rect(cx - 0.45, apex, 0.9, 3.4, sand, null);
      }
      if (!S.open && S.mf > 0) { K.circle(cx, apex + 4.1, 0.8, '#f3c9a8', '#b07a5a'); K.text(cx + 1.6, apex + 4.6, 'finger', 9, ink); }
      if (S.open && S.mf > 0) K.line(cx, apex + 3.5, cx, 44 - Math.min(9.6, S.mc / 18), 1.2, sand);
      // collecting container
      K.path([[cx - 6, 34], [cx - 6, 44], [cx + 6, 44], [cx + 6, 34]], 1.6, ink);
      if (S.mc > 0) { const h = Math.min(9.6, S.mc / 18); K.rect(cx - 5.8, 44 - h, 11.6, h, sand, null); }
      // containers A and B
      [['A', 6, S.mf > 0 && S.c.src !== 'B' ? 0 : H.xA], ['B', 15, S.mf > 0 && S.c.src !== 'A' ? 0 : H.xB]].forEach(([lab, x, d]) => {
        K.path([[x, 37], [x, 44], [x + 6, 44], [x + 6, 37]], 1.4, ink);
        if (d > 0) K.rect(x + 0.2, 44 - d * 2.2, 5.6, d * 2.2, sand, null);
        K.text(x + 3, 35.6, lab, 11, ink, 'center', 700);
      });
      K.text(3, 4, S.open ? 'sand flowing…' : S.mf > 0 ? 'funnel loaded: hole blocked' : 'funnel empty', 10, ink);
    },
    closeups: [
      { type: 'vernier', title: 'Vernier depth probe: sand in Container A', label: 'reading in cm (depth of sand below the rim, converted)', help: 'Each press reads at a different point: the sand surface is uneven, so average a few readings.', again: 'Read at another point', get: (S, n) => S.h.xA + ((((n * 7919) % 7) - 3) * 0.012) },
      { type: 'vernier', title: 'Vernier depth probe: sand in Container B', label: 'reading in cm (depth of sand below the rim, converted)', help: 'Same method for B. Then m_A = 90 x_A/(x_A + x_B).', again: 'Read at another point', get: (S, n) => S.h.xB + ((((n * 104729) % 7) - 3) * 0.012) },
    ],
    steps: ['Read the sand depths x_A and x_B (average three readings each). Work out m_A and m_B.', 'Pour A into the funnel. Remove your finger and start the stopwatch together; stop when the last grains leave. Repeat for t_A.',
      'Repeat with B, and with A + B together (90 g).', 'Compare the mass flow rates m/t: does more sand flow faster?'],
    table: {
      cols: [{ k: 'm', label: 'm / g' }, { k: 't1', label: 't₁ / s' }, { k: 't2', label: 't₂ / s' }],
      derived: [{ k: 't', label: 't / s', f: (r) => (r.t1 + r.t2) / 2, fmt: (v) => v.toFixed(1) }, { k: 'q', label: 'rate / g s⁻¹', f: (r) => r.m / r.t, fmt: (v) => v.toFixed(2) }],
      help: 'Use your calculated masses (from the depths) in the first column.',
    },
    plot: { xs: [{ label: 'm / g', f: (r) => r.m }], ys: [{ label: 'rate / g s⁻¹', f: (r) => r.q }], origin: true,
      result: (f) => `gradient = <b>${VPL.fmt(f.m, 2)} s⁻¹</b>: a value near zero means the rate does not depend on the mass` },
    check(S) {
      const H = S.h;
      return `This apparatus: x_A = <b>${H.xA.toFixed(2)} cm</b>, x_B = <b>${H.xB.toFixed(2)} cm</b>, so m_A = <b>${H.mA.toFixed(1)} g</b> and m_B = <b>${H.mB.toFixed(1)} g</b>. The flow rate is <b>${H.R0.toFixed(2)} g s⁻¹</b> whatever the mass (±1.5% run to run): granular flow does not depend on the height of sand above the hole.`;
    },
  });
})();
