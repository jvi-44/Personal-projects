/* NYJC 2026 Paper 4 simulations (Q3's apparatus is also used by SAJC Q1) */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q1: T-shaped pendulum ----------
  VPL.def('nyjc-q1', {
    title: 'T-shaped pendulum with slotted masses',
    intro: '<p>Bolt a slotted mass into the hole at distance x on each side of the nail, push the bottom of the pendulum and time 20 oscillations. Measure x with the rule (centre of bolt to nail). Change M to see what happens to a and b in T² = ax² + b.</p>',
    world: { x: 0, y: 0, w: 70, h: 62 },
    zoom: 5,
    hidden: (r) => ({ K: 0.1018 * r.uni(0.97, 1.03), I0: 0.003985 * r.uni(0.97, 1.03), damp: r.uni(0.02, 0.04) }),
    controls: [
      { id: 'x', label: 'Hole used (distance from nail)', type: 'select', value: 10, options: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((v) => ({ value: v, label: 'hole ' + v / 2 })) },
      { id: 'M', label: 'Each slotted mass', type: 'buttons', value: 50, options: [{ value: 0, label: 'none' }, { value: 50, label: '50 g' }, { value: 100, label: '100 g' }, { value: 150, label: '150 g' }] },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 6, y: 14, len: 50, angle: 0, every: 1, w: 2.4 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else { S.amp = 0; } },
    actions: [{ label: 'Push the bottom and release', run(S) { S.amp = 6 * deg; S.t0 = S.t; } }, { label: 'Stop', run(S) { S.amp = 0; } }],
    init(S) { S.amp = 0; S.t0 = 0; S.phi = 0; },
    T(S) { const H = S.h, M = S.c.M / 1000, x = (+S.c.x + 0) / 100; return 2 * Math.PI * Math.sqrt((H.I0 + 2 * M * x * x) / H.K); },
    step(S) { const T = this.T(S); S.phi = S.amp ? S.amp * Math.exp(-S.h.damp * (S.t - S.t0)) * Math.cos(2 * Math.PI * (S.t - S.t0) / T) : 0; },
    draw(K, S) {
      const pv = { x: 34, y: 10 };
      K.bench(59); K.rect(28, 57.8, 14, 1.2, '#4b5563', '#1f2937'); K.rect(33.5, 2, 1, 56, '#9aa5b1', '#4b5563', 0.8);
      K.ctx.save(); K.ctx.translate(pv.x, pv.y); K.ctx.rotate(S.phi);
      K.rect(-26, -1.2, 52, 2.4, '#d1d5db', '#4b5563', 1);
      for (let h = 2; h <= 24; h += 2) { K.circle(h, 0, 0.35, '#fff', '#4b5563', 0.8); K.circle(-h, 0, 0.35, '#fff', '#4b5563', 0.8); }
      K.rect(-1.6, 1.2, 3.2, 38, '#d1d5db', '#4b5563', 1);
      if (+S.c.M) [-1, 1].forEach((s) => { K.circle(s * S.c.x, 0, 1.2 + S.c.M / 100, '#e5e7eb', '#1f2937', 1.2); K.circle(s * S.c.x, 0, 0.45, '#111', null); });
      K.ctx.restore();
      K.circle(pv.x, pv.y, 0.45, '#111', null); K.text(pv.x + 1, pv.y - 2.4, 'nail', 9, '#475569');
      K.text(4, 57, (+S.c.M ? `two ${S.c.M} g masses` : 'no masses'), 10, '#475569');
    },
    steps: ['Fit two 50 g masses in the holes 10 cm from the nail. Measure x with the rule.', 'Push and release; time 20 oscillations twice, find T.', 'Choose another x that fills the gap in Fig. 1.4 and repeat.',
      'Change M to 100 g and measure T at two values of x to find a and b for that M.', 'Planning link: with no masses (x = 0), T² = b.'],
    table: {
      cols: [{ k: 'M', label: 'M / g' }, { k: 'x', label: 'x / cm' }, { k: 't1', label: 't₁ (20) / s' }, { k: 't2', label: 't₂ (20) / s' }],
      derived: [{ k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 40, fmt: (v) => v.toFixed(3) }, { k: 'T2', label: 'T² / s²', f: (r) => ((r.t1 + r.t2) / 40) ** 2, fmt: (v) => v.toFixed(3) }, { k: 'x2', label: 'x² / cm²', f: (r) => r.x * r.x, fmt: (v) => v.toFixed(0) }],
      capture: (S) => ({ M: S.c.M }),
    },
    plot: { xs: [{ label: 'x² / cm²', f: (r) => r.x2 }], ys: [{ label: 'T² / s²', f: (r) => r.T2 }], result: (f) => `a = <b>${VPL.fmt(f.m, 3)} s² cm⁻²</b>, b = <b>${VPL.fmt(f.c, 3)} s²</b> (use rows with one value of M)` },
    check(S) { const H = S.h, M = S.c.M / 1000; const a = 8 * Math.PI ** 2 * M / H.K / 1e4, b = 4 * Math.PI ** 2 * H.I0 / H.K; return `This pendulum with two ${S.c.M} g masses: a = <b>${a.toExponential(3)} s² cm⁻²</b>, b = <b>${b.toFixed(3)} s²</b>. a ∝ M; b does not depend on M. Current T = ${this.T(S).toFixed(3)} s.`; },
  });

  // ---------- Q2: strip leaning on a smooth board ----------
  const STRIPS = { long: { L: 50.0, M: 45.2 }, short: { L: 30.0, M: 27.1 } };
  VPL.def('nyjc-q2', {
    title: 'Strip leaning on a smooth board',
    intro: '<p>Lean the strip against the smooth vertical board. Move its foot outwards until it slips, then bring it back until it <b>just</b> stays. Measure θ with the protractor at the foot. The limiting angle varies a little from trial to trial, as on a real bench, so repeat it.</p>',
    world: { x: 0, y: 0, w: 76, h: 60 },
    zoom: 4,
    hidden: (r) => ({ mu: r.uni(0.36, 0.44), seed: Math.floor(r() * 1e6) }),
    controls: [
      { id: 'strip', label: 'Strip', type: 'buttons', value: 'long', options: [{ value: 'long', label: 'Longer' }, { value: 'short', label: 'Shorter' }] },
      { id: 'end', label: 'Slotted mass', type: 'buttons', value: 'A', options: [{ value: 'A', label: 'near lower end (A)' }, { value: 'B', label: 'near upper end (B)' }] },
      { id: 'foot', label: 'Foot distance from the board', type: 'range', min: 4, max: 46, step: 0.1, value: 20, hideValue: true },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 0, unit: '°' },
    ],
    movables: [{ id: 'prot', type: 'protractor', x: 40, y: 54, r: 6, angle: 0 }, { id: 'rule', type: 'rule', x: 8, y: 55.5, len: 60, angle: 0, w: 2.2, every: 5 }],
    onchange(S, id) { if (id === 'prot') { S.mov.prot.angle = S.c.prot; return; } if (id === 'foot') { if (S.fall >= 1) { S.fall = 0; S.trial++; } return; } S.trial = (S.trial || 0) + 1; S.fall = 0; },
    init(S) { S.trial = 0; S.fall = 0; },
    crit(S) {
      const st = STRIPS[S.c.strip], d = 10, dd = S.c.end === 'A' ? d : st.L - d, M = st.M / 1000, Sm = 0.1;
      const base = Math.atan((M / 2 + Sm * dd / st.L) / ((M + Sm) * S.h.mu));
      const r = VPL.rng(S.h.seed + S.trial * 7919);
      return base + r.gauss(0, 0.9) * deg;
    },
    step(S, dt) {
      const st = STRIPS[S.c.strip], th = Math.acos(Math.min(1, S.c.foot / st.L));
      if (th < this.crit(S) || S.fall > 0) S.fall = Math.min(1, S.fall + dt * 1.4);
    },
    draw(K, S) {
      const st = STRIPS[S.c.strip], bx = 12, by = 54;
      K.bench(54);
      K.rect(bx - 1.2, 4, 1.2, 50, '#f1f5f9', '#64748b', 1); K.text(bx - 2, 3, 'smooth board', 9, '#475569', 'right');
      K.stand(4, 54, 52); K.clampRod(4, 8, bx - 1.2); K.boss(4, 8);
      let foot = bx + +S.c.foot, th = Math.acos(Math.min(1, S.c.foot / st.L));
      if (S.fall > 0) { th = th * (1 - S.fall); foot = bx + st.L * Math.cos(th); }
      const top = { x: foot - st.L * Math.cos(th), y: by - st.L * Math.sin(th) };
      K.ctx.save(); K.ctx.translate(foot, by); K.ctx.rotate(Math.PI + th);
      K.rect(0, -0.9, st.L, 0.9, '#d9b77e', '#7c5a2c', 1);
      const dd = S.c.end === 'A' ? 10 : st.L - 10;
      K.rect(dd - 0.8, -2.3, 1.6, 1.4, '#6b7280', '#1f2937');
      K.ctx.restore();
      if (S.fall >= 1) K.text(40, 20, 'Slipped! Move the foot closer and try again.', 12, '#b4361f', 'center', 700);
      void top;
    },
    actions: [{ label: 'Reset after a slip', run(S) { S.fall = 0; S.trial++; } }],
    steps: ['Measure L and d_A for the longer strip.', 'Mass near the lower end: move the foot out until it slips, then back until it just stays. Measure θ_A with the protractor.', 'Repeat a few times to estimate Δθ.',
      'Invert (mass near the upper end) and find θ_B.', 'Repeat with the shorter strip. Calculate F_A and F_B and k = F_A/F_B.'],
    table: {
      cols: [{ k: 'L', label: 'L / cm' }, { k: 'M', label: 'M / g' }, { k: 'd', label: 'd / cm' }, { k: 'th', label: 'θ / °' }],
      derived: [{ k: 'F', label: 'F', f: (r) => (r.M / 2 + 100 * r.d / r.L) / ((r.M + 100) * Math.tan(r.th * deg)), fmt: (v) => v.toFixed(3) }],
      capture: (S) => ({ L: STRIPS[S.c.strip].L.toFixed(1), M: STRIPS[S.c.strip].M.toFixed(1), d: S.c.end === 'A' ? '10.0' : (STRIPS[S.c.strip].L - 10).toFixed(1) }),
      help: 'Each row is one configuration. F should come out the same for all four (it is the friction coefficient).',
    },
    check(S) { return `The coefficient of static friction for this bench is <b>μ = ${S.h.mu.toFixed(3)}</b>. F_A and F_B should both be close to μ, so k = F_A/F_B ≈ 1. Current limiting angle for this trial: ${(this.crit(S) / deg).toFixed(1)}°.`; },
  });

  // ---------- Q3: two wires joined by a sliding lead ----------
  const SWG = [0.234, 0.274, 0.315, 0.376, 0.457];
  VPL.def('nyjc-q3', {
    title: 'Two wires joined by a sliding lead',
    intro: '<p>The current flows along length x of wire F, through lead C, then along the rest of wire G. Slide C (read x on the rules with the magnifier), close the switch, read I, and open the switch again. Measure both wire diameters with the micrometer below.</p>',
    world: { x: 0, y: 0, w: 120, h: 50 },
    zoom: 6,
    hidden: (r) => { const i = r.pick([0, 1]); return { dF: SWG[i] * r.uni(0.99, 1.01), dG: SWG[i + 2 + (r() < 0.5 ? 0 : 1)] * r.uni(0.99, 1.01), rho: 4.9e-7 * r.uni(0.97, 1.03), E: r.uni(1.45, 1.55), r: r.uni(0.2, 0.5) }; },
    controls: [
      { id: 'x', label: 'Position of lead C', type: 'range', min: 5, max: 95, step: 0.1, value: 50, hideValue: true },
      { id: 'sw', label: 'Switch', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
    ],
    init(S) { S.heat = 0; },
    step(S, dt) { S.heat += ((S.c.sw ? 1 : 0) - S.heat) * dt / 40; },
    I(S) {
      const H = S.h, AF = Math.PI * (H.dF / 2000) ** 2, AG = Math.PI * (H.dG / 2000) ** 2, x = S.c.x / 100, k = 1 + 0.012 * S.heat;
      return H.E / (k * (H.rho * x / AF + H.rho * (1 - x) / AG) + H.r);
    },
    meters: [{ id: 'I', label: 'Ammeter', unit: 'A', get: (S) => (S.c.sw ? VPL.sims['nyjc-q3'].I(S) : 0), res: 0.001, noise: 0.0004 }],
    draw(K, S) {
      const x0 = 10, yF = 20, yG = 34;
      K.rule(x0, yF + 0.6, 100, 0, { every: 5, w: 2.6, label: 'metre rule F' });
      K.rule(x0, yG + 0.6, 100, 0, { every: 5, w: 2.6, label: 'metre rule G' });
      K.line(x0, yF, x0 + 100, yF, 1.2, '#b45309'); K.line(x0, yG, x0 + 100, yG, 2.0, '#b45309');
      K.text(x0 + 102, yF, 'F', 12, K.ink, 'left', 700); K.text(x0 + 102, yG, 'G', 12, K.ink, 'left', 700);
      const cx = x0 + +S.c.x;
      K.path([[cx, yF], [cx - 1.5, (yF + yG) / 2], [cx, yG]], 1.8, '#111'); K.rect(cx - 0.6, yF - 1, 1.2, 1.4, '#1f2937', null); K.rect(cx - 0.6, yG - 1, 1.2, 1.4, '#1f2937', null);
      K.text(cx - 2.8, (yF + yG) / 2, 'C', 11, K.ink, 'right', 700);
      K.wire([[x0, yF], [x0 - 4, yF], [x0 - 4, 6], [40, 6]]); K.cell(40, 6, 48, 6, 'cell');
      K.wire([[48, 6], [60, 6]]); K.switchSym(60, 6, 66, S.c.sw, 'switch'); K.wire([[66, 6], [80, 6]]); K.dial(82, 6, 2, 'A');
      K.wire([[84, 6], [116, 6], [116, yG], [x0 + 100, yG]]);
      K.meterBox(88, 40, 'A', (S.c.sw ? VPL.sims['nyjc-q3'].I(S) : 0).toFixed(3), 'DC', 11);
    },
    closeups: [
      { type: 'micrometer', title: 'Micrometer: wire on rule F (d_F)', help: 'Zero error 0.00 mm.', get: (S, n) => S.h.dF + ((n % 3) - 1) * 0.003 },
      { type: 'micrometer', title: 'Micrometer: wire on rule G (d_G)', help: 'Zero error 0.00 mm.', get: (S, n) => S.h.dG + (((n + 1) % 3) - 1) * 0.003 },
    ],
    steps: ['Measure d_F and d_G with the micrometer (several readings each).', 'Set x = 50.0 cm on both rules. Close the switch, read I, open the switch.', 'Repeat for six or more values of x across the rules.',
      'Plot 1/I against x (in m): P = gradient, Q = intercept.', 'd_G/d_F = √(1 + LP/Q) with L = 1.000 m.'],
    table: {
      cols: [{ k: 'x', label: 'x / cm' }, { k: 'I', label: 'I / A' }],
      derived: [{ k: 'xm', label: 'x / m', f: (r) => r.x / 100, fmt: (v) => v.toFixed(3) }, { k: 'inv', label: '1/I / A⁻¹', f: (r) => 1 / r.I, fmt: (v) => v.toFixed(3) }],
    },
    plot: { xs: [{ label: 'x / m', f: (r) => r.xm }], ys: [{ label: '1/I / A⁻¹', f: (r) => r.inv }], result: (f) => `P = <b>${VPL.fmt(f.m, 3)} A⁻¹ m⁻¹</b>, Q = <b>${VPL.fmt(f.c, 3)} A⁻¹</b>, d_G/d_F = √(1 + P/Q) = <b>${VPL.fmt(Math.sqrt(1 + f.m / f.c), 3)}</b>` },
    check(S) { const H = S.h; return `Wire diameters: d_F = <b>${H.dF.toFixed(3)} mm</b>, d_G = <b>${H.dG.toFixed(3)} mm</b> (ratio ${(H.dG / H.dF).toFixed(3)}). Cell e.m.f. ${H.E.toFixed(2)} V with ${H.r.toFixed(2)} Ω internal/lead resistance, which makes the graph ratio slightly smaller than the micrometer ratio. Leaving the switch closed heats the wires and lowers I.`; },
  });
})();
