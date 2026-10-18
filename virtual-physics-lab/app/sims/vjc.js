/* VJC 2026 Paper 4 simulations (also used by TJC Q1 and Q3) */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q1: two masses on a string (double pendulum) ----------
  VPL.def('vjc-q1', {
    title: 'Two masses on a string below a split cork',
    intro: '<p>Slide the string through the split cork to set x (bottom of the cork to the top of the upper string loop), measure it with the rule, then move the bottom mass a little to the left and release. Time 10 oscillations.</p>',
    world: { x: 0, y: 0, w: 56, h: 80 },
    zoom: 5,
    hidden: (r) => ({ l2: r.uni(19.5, 20.5) / 100, off: 1.5, mix: r.uni(0.03, 0.08) }),
    controls: [
      { id: 'x', label: 'Length of string below the cork', type: 'range', min: 4, max: 36, step: 0.1, value: 10, hideValue: true },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 30, y: 6, len: 50, angle: 90, w: 2.4, every: 5 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else { S.a1 = S.a2 = S.w1 = S.w2 = 0; } },
    init(S) { S.a1 = S.a2 = S.w1 = S.w2 = 0; },
    lens(S) { return { l1: (+S.c.x + S.h.off) / 100, l2: S.h.l2 }; },
    actions: [{ label: 'Move the bottom mass left and release', run(S) {
      const { l1, l2 } = VPL.sims['vjc-q1'].lens(S), s = l1 + l2;
      const w2 = g * (s - Math.sqrt(s * s - 2 * l1 * l2)) / (l1 * l2), r = 2 - w2 * l1 / g;
      const A = 0.05; S.a1 = -A; S.a2 = -A * r * (1 + S.h.mix); S.w1 = S.w2 = 0;
    } }, { label: 'Stop', run(S) { S.a1 = S.a2 = S.w1 = S.w2 = 0; } }],
    dt: 1 / 600,
    step(S, dt) {
      const { l1, l2 } = this.lens(S);
      const a1 = g * (S.a2 - 2 * S.a1) / l1 - 0.03 * S.w1, a2 = 2 * g * (S.a1 - S.a2) / l2 - 0.03 * S.w2;
      S.w1 += a1 * dt; S.w2 += a2 * dt; S.a1 += S.w1 * dt; S.a2 += S.w2 * dt;
    },
    draw(K, S) {
      const top = { x: 20, y: 5 }, { l1, l2 } = this.lens(S), L1 = l1 * 100, L2 = l2 * 100;
      K.bench(77); K.stand(44, 77, 74); K.clampRod(18, 4, 44); K.boss(44, 4);
      K.rect(18.6, 2.6, 2.8, 2.4, '#c8a173', '#7c5a2c', 1); K.text(17.5, 3.8, 'split cork', 9, '#475569', 'right');
      const p1 = { x: top.x + L1 * Math.sin(S.a1), y: top.y + L1 * Math.cos(S.a1) };
      const p2 = { x: p1.x + L2 * Math.sin(S.a2), y: p1.y + L2 * Math.cos(S.a2) };
      K.string(top.x, top.y, p1.x, p1.y - 1.4); K.circle(p1.x, p1.y - 1.0, 0.4, null, '#7a5c2e', 1.2);
      K.circle(p1.x, p1.y, 1.4, '#9ca3af', '#374151', 1); K.circle(p1.x, p1.y, 0.3, '#fff', null);
      K.string(p1.x, p1.y + 1.4, p2.x, p2.y - 1.4); K.circle(p2.x, p2.y - 1.0, 0.4, null, '#7a5c2e', 1.2);
      K.circle(p2.x, p2.y, 1.4, '#9ca3af', '#374151', 1); K.circle(p2.x, p2.y, 0.3, '#fff', null);
    },
    steps: ['Set x ≈ 10 cm and measure it (bottom of cork to top of the upper loop).', 'Release from the left; time 10 oscillations twice.', 'Repeat for at least five more values of x (5–30 cm).', 'Plot T⁴ against x: P = gradient, Q = intercept.'],
    table: { cols: [{ k: 'x', label: 'x / cm' }, { k: 't1', label: 't₁ (10) / s' }, { k: 't2', label: 't₂ (10) / s' }],
      derived: [{ k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 20, fmt: (v) => v.toFixed(3) }, { k: 'T4', label: 'T⁴ / s⁴', f: (r) => ((r.t1 + r.t2) / 20) ** 4, fmt: (v) => v.toFixed(3) }] },
    plot: { xs: [{ label: 'x / cm', f: (r) => r.x }], ys: [{ label: 'T⁴ / s⁴', f: (r) => r.T4 }], result: (f) => `P = <b>${VPL.fmt(f.m, 3)} s⁴ cm⁻¹</b>, Q = <b>${VPL.fmt(f.c, 3)} s⁴</b>` },
    check(S) { const { l1, l2 } = this.lens(S), s = l1 + l2, w2 = g * (s - Math.sqrt(s * s - 2 * l1 * l2)) / (l1 * l2); return `Current x = <b>${(+S.c.x).toFixed(1)} cm</b>; lower string ${(l2 * 100).toFixed(1)} cm. The slow swinging mode has T = <b>${(2 * Math.PI / Math.sqrt(w2)).toFixed(3)} s</b>.`; },
  });

  // ---------- Q2: rubber band loading and unloading ----------
  const Fload = (e) => 22 * e + 900 * e ** 3 - 1500 * e ** 4;
  const solve = (fn, F) => { let a = 0, b = 0.2; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (fn(m) < F) a = m; else b = m; } return (a + b) / 2; };
  VPL.def('vjc-q2', {
    title: 'Loading and unloading a rubber band',
    intro: '<p>Measure the unstretched band on the bench (L₀). Hang it from the clamp rod and add masses one at a time, measuring L each time; then remove them one at a time. The unloading readings do not retrace the loading ones: plot both to see the hysteresis loop.</p>',
    world: { x: 0, y: 0, w: 60, h: 64 },
    zoom: 5,
    hidden: (r) => ({ L0: r.uni(8.3, 8.9), s: r.uni(0.92, 1.08) }),
    controls: [{ id: 'm', label: 'Total hanging mass (hanger included)', type: 'buttons', value: 50, options: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550].map((v) => ({ value: v, label: v + ' g' })) },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' }],
    movables: [{ id: 'rule', type: 'rule', x: 28, y: 6, len: 30, angle: 90, w: 2.4 }],
    onchange(S, id) {
      if (id === 'rang') { S.mov.rule.angle = S.c.rang; return; }
      const F = S.c.m / 1000 * g / S.h.s;
      if (F >= (S.lastF || 0)) { S.e = Math.max(S.e || 0, solve(Fload, F)); S.emax = Math.max(S.emax || 0, S.e); }
      else { const em = S.emax, fu = (e) => Fload(e) * (0.55 + 0.45 * (e / em) ** 3); S.e = Math.min(S.e, solve(fu, F)); }
      S.lastF = F;
    },
    actions: [{ label: 'Take the band off (rest it, reset history)', run(S) { S.e = 0; S.emax = 0; S.lastF = 0; } }],
    init(S) { S.e = solve(Fload, S.c.m / 1000 * g / S.h.s); S.emax = S.e; S.lastF = S.c.m / 1000 * g / S.h.s; },
    draw(K, S) {
      const top = { x: 18, y: 6 }, L = S.h.L0 + S.e * 100;
      K.bench(62); K.stand(44, 62, 60); K.clampRod(16, 6, 44); K.boss(44, 6);
      K.line(top.x - 0.4, top.y, top.x - 0.4, top.y + L, 3, '#a16207'); K.line(top.x + 0.4, top.y, top.x + 0.4, top.y + L, 3, '#a16207');
      K.circle(top.x, top.y + L + 0.4, 0.6, null, '#374151', 1.2);
      K.hanger(top.x, top.y + L + 1, Math.max(1, S.c.m / 50), S.c.m + ' g');
      K.line(6, 61, 6 + S.h.L0, 61, 3, '#a16207'); K.text(6, 59.4, 'spare band, unstretched', 9, '#475569');
    },
    steps: ['Measure L₀ of the spare band on the bench (rotate the rule to 0°).', 'Add masses in 50 g steps up to 550 g, measuring L each time (top of the band at the rod to the bottom of its loop).', 'Remove the masses one at a time, measuring L again.', 'Plot F = mg against e = L − L₀ for both; the loop area is the energy lost.'],
    table: { cols: [{ k: 'm', label: 'm / g' }, { k: 'L', label: 'L / cm' }], derived: [{ k: 'F', label: 'F / N', f: (r) => r.m / 1000 * g, fmt: (v) => v.toFixed(3) }, { k: 'e', label: 'e / m', f: (r, S) => (r.L - (+S.c.L0user || 8.6)) / 100, fmt: (v) => v.toFixed(3) }],
      capture: (S) => ({ m: S.c.m }), help: 'Record loading rows first, then unloading rows. Enter your L₀ in the box below the controls.' },
    plot: { xs: [{ label: 'e / m', f: (r) => r.e }], ys: [{ label: 'F / N', f: (r) => r.F }] },
    check(S) { return `This band: L₀ = <b>${S.h.L0.toFixed(1)} cm</b>. Current extension ${(S.e * 100).toFixed(1)} cm (maximum reached ${(S.emax * 100).toFixed(1)} cm). On unloading the band is longer for the same load: that gap is the hysteresis.`; },
  });
  VPL.sims['vjc-q2'].controls.push({ id: 'L0user', label: 'Your measured L₀ / cm', type: 'number', value: '', step: 0.1 });

  // ---------- Q3: coil in parallel with a resistance box ----------
  const RHO = 1.72e-8;
  VPL.def('vjc-q3', {
    title: 'Resistance of a coil of wire',
    intro: '<p>Measure the coil diameter D (vernier) and the wire diameter d (micrometer), and the length of the winding along the tube (rule), then estimate the wire length. In the circuit, the coil is in parallel with a resistance box R; close the switch, read I, open it, change R.</p>',
    world: { x: 0, y: 0, w: 86, h: 46 },
    zoom: 5,
    hidden: (r) => ({ E: r.uni(1.48, 1.56), r: r.uni(0.35, 0.6), Y: { D: 4.0 * r.uni(0.99, 1.01), d: 0.27, c: 0.25, len: 7.5 * r.uni(0.98, 1.02) }, Z: { D: 3.0 * r.uni(0.99, 1.01), d: 0.39, c: 0.37, len: 0 } }),
    coil(S) {
      const H = S.h, Y = H.Y; const NY = Y.len * 10 / Y.d, LY = NY * Math.PI * (Y.D + Y.d / 10);
      if (S.c.coil === 'Y') return { D: Y.D, d: Y.d, len: Y.len, L: LY, X: RHO * LY / 100 / (Math.PI * (Y.c / 2000) ** 2) };
      const Z = H.Z, LZ = 0.75 * LY, NZ = LZ / (Math.PI * (Z.D + Z.d / 10));
      return { D: Z.D, d: Z.d, len: NZ * Z.d / 10, L: LZ, X: RHO * LZ / 100 / (Math.PI * (Z.c / 2000) ** 2) };
    },
    controls: [
      { id: 'coil', label: 'Coil', type: 'buttons', value: 'Y', options: [{ value: 'Y', label: 'Tube Y' }, { value: 'Z', label: 'Tube Z' }] },
      { id: 'R', label: 'Resistance box R', type: 'select', value: 15, options: [15, 12, 10, 8, 6, 4, 2].map((v) => ({ value: v, label: v + ' Ω' })) },
      { id: 'sw', label: 'Switch', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
      { id: 'mm', label: 'Multimeter across the coil alone', type: 'toggle', value: false, labels: ['Not connected', 'Ohmmeter on coil'] },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 8, y: 33, len: 15, angle: 0, w: 2 }],
    meters: [
      { id: 'I', label: 'Ammeter', unit: 'A', get: (S) => { if (!S.c.sw) return 0; const X = VPL.sims['vjc-q3'].coil(S).X, R = +S.c.R; return S.h.E / (S.h.r + 0.1 + X * R / (X + R)); }, res: 0.001, noise: 0.0005 },
      { id: 'O', label: 'Ohmmeter (coil)', unit: 'Ω', get: (S) => (S.c.mm ? VPL.sims['vjc-q3'].coil(S).X : null), res: 0.01, blank: '—' },
    ],
    draw(K, S) {
      const c = this.coil(S), cx = 10, cy = 22, w = c.len * 1.0, h = c.D * 1.2;
      K.rect(cx - 1, cy - h / 2, w + 4, h, '#d6b98c', '#7c5a2c', 1);
      const n = Math.round(c.len * 10 / c.d);
      for (let i = 0; i < n; i += 2) { const x = cx + 1 + (i / n) * w; K.line(x, cy - h / 2, x, cy + h / 2, 0.5, '#b45309'); }
      K.text(cx + w / 2 + 1, cy - h / 2 - 1.4, 'tube ' + S.c.coil, 11, K.ink, 'center', 700);
      // circuit
      const x0 = 40;
      K.cell(56, 6, 62, 6, 'cell'); K.wire([[x0, 6], [56, 6]]); K.wire([[62, 6], [70, 6]]); K.switchSym(70, 6, 76, S.c.sw, 'switch'); K.wire([[76, 6], [82, 6], [82, 26]]);
      K.wire([[x0, 6], [x0, 14]]); K.dial(x0, 16, 2, 'A'); K.wire([[x0, 18], [x0, 26], [48, 26]]);
      K.node(48, 26); K.wire([[48, 26], [48, 20], [56, 20]]); K.rect(56, 18.5, 12, 3, '#fde68a', '#92400e', 1); K.text(62, 20, 'coil ' + S.c.coil, 9, K.ink, 'center', 700);
      K.wire([[68, 20], [74, 20], [74, 26]]); K.wire([[48, 26], [48, 32], [56, 32]]); K.resistor(56, 32, 68, 32, 'R = ' + S.c.R + ' Ω'); K.wire([[68, 32], [74, 32], [74, 26]]); K.node(74, 26);
      K.wire([[74, 26], [82, 26]]);
    },
    closeups: [
      { type: 'vernier', title: 'Vernier caliper: coil diameter D', help: 'Across the winding. Zero error 0.00 cm.', get: (S, n) => VPL.sims['vjc-q3'].coil(S).D + ((n % 3) - 1) * 0.005 },
      { type: 'micrometer', title: 'Micrometer: wire diameter d (with enamel)', help: 'Zero error 0.00 mm.', get: (S, n) => VPL.sims['vjc-q3'].coil(S).d + (((n + 2) % 3) - 1) * 0.004 },
    ],
    steps: ['Measure D and d with the close-up instruments, and the winding length with the rule.', 'N = winding length/d; L = Nπ(D + d).', 'Coil Y: R = 15 Ω, close the switch, read I. Repeat for six more values of R.', 'Plot IR against R: X = intercept/gradient. Repeat for coil Z and compare with the ohmmeter.'],
    table: { cols: [{ k: 'R', label: 'R / Ω' }, { k: 'I', label: 'I / A' }], derived: [{ k: 'IR', label: 'IR / V', f: (r) => r.I * r.R, fmt: (v) => v.toFixed(3) }], capture: (S) => ({ R: S.c.R }) },
    plot: { xs: [{ label: 'R / Ω', f: (r) => r.R }], ys: [{ label: 'IR / V', f: (r) => r.IR }], result: (f) => `G = ${VPL.fmt(f.m, 3)} A, H = ${VPL.fmt(f.c, 3)} V, X = H/G = <b>${VPL.fmt(f.c / f.m, 3)} Ω</b>` },
    check(S) { const c = this.coil(S); return `Coil ${S.c.coil}: D = ${c.D.toFixed(2)} cm, d = ${c.d.toFixed(2)} mm, winding length ${c.len.toFixed(2)} cm, wire length <b>${c.L.toFixed(0)} cm</b>, resistance <b>${c.X.toFixed(2)} Ω</b>. Cell e.m.f. ${S.h.E.toFixed(2)} V with internal resistance ${S.h.r.toFixed(2)} Ω, which makes H/G come out low.`; },
  });
})();
