/* EJC 2026 Paper 4 simulations */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q1: spring + string parametric oscillator ----------
  // Spring hangs from the clamp tooth and stays vertical; its lower end bounces (z) and the string pendulum (length d)
  // swings from it. Lagrangian of a pendulum on a vertically moving, spring-supported pivot.
  VPL.def('ejc-q1', {
    title: 'Spring–string parametric oscillator',
    intro: '<p><b>Spring only:</b> pull the mass down and time 20 vertical oscillations to find T. <b>Spring + string:</b> tie the string so that d ≈ gT²/π², pull the mass about 15 cm sideways and release. Watch the <b>coils</b>: energy swaps between swinging and bouncing. Time the interval between two moments when the coils stay still.</p>',
    world: { x: 0, y: 0, w: 60, h: 96 },
    zoom: 4,
    speed: [1, 2, 4],
    hidden: (r) => ({ k: r.uni(23, 28), L0: r.uni(4.6, 5.4), hang: 2.0, damp: r.uni(0.004, 0.008) }),
    controls: [
      { id: 'm', label: 'Mass m', type: 'buttons', value: 300, options: [{ value: 300, label: '300 g' }, { value: 400, label: '400 g' }] },
      { id: 'mode', label: 'Set-up', type: 'buttons', value: 'spring', options: [{ value: 'spring', label: 'Spring only (Fig. 1.1)' }, { value: 'string', label: 'Spring + string (Fig. 1.2)' }] },
      { id: 'd', label: 'Tie the knot so d is about', type: 'range', min: 30, max: 75, step: 0.5, value: 45, unit: 'cm' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 40, y: 3, len: 90, angle: 90, every: 5 }],
    init(S) { this.rest(S); },
    onchange(S) { this.rest(S); },
    rest(S) {
      const H = S.h, m = S.c.m / 1000;
      S.z = H.L0 + (m * g / H.k) * 100; S.vz = 0; S.th = 0; S.w = 0;
    },
    actions: [
      { label: 'Pull down 2 cm and release', run(S) { const H = S.h, m = S.c.m / 1000; S.z = H.L0 + (m * g / H.k) * 100 + 2; S.vz = 0; S.th = 0; S.w = 0; } },
      { label: 'Pull 15 cm sideways and release', run(S) { if (S.c.mode !== 'string') return; const H = S.h, m = S.c.m / 1000; S.th = Math.asin(Math.min(0.9, 15 / S.c.d)); S.w = 0; S.z = H.L0 + (m * g * Math.cos(S.th) / H.k) * 100; S.vz = 0; } },
      { label: 'Stop the motion', run(S) { VPL.sims['ejc-q1'].rest(S); } },
    ],
    dt: 1 / 600,
    step(S, dt) {
      const H = S.h, m = S.c.m / 1000, k = H.k;
      let z = S.z / 100, L0 = H.L0 / 100;
      if (S.c.mode === 'spring') {
        const a = g - (k / m) * (z - L0) - H.damp * 20 * S.vz / 100;
        S.vz += a * 100 * dt; S.z += S.vz * dt; return;
      }
      const d = S.c.d / 100, th = S.th, c = Math.cos(th), s = Math.sin(th);
      const zdd = (d * c * S.w * S.w + g * c * c - (k / m) * (z - L0)) / (c * c) - H.damp * 20 * S.vz / 100;
      const thdd = -(g - zdd) * s / d - H.damp * S.w;
      S.vz += zdd * 100 * dt; S.w += thdd * dt;
      S.z += S.vz * dt; S.th += S.w * dt;
    },
    draw(K, S) {
      const top = { x: 24, y: 6 };
      K.bench(93); K.stand(34, 93, 90); K.clampRod(22, top.y - 1, 34); K.boss(34, top.y - 1);
      K.rect(22.6, top.y - 2.2, 2.8, 1.6, '#4b5563', '#1f2937');
      const zb = top.y + S.z;
      K.spring(top.x, top.y, top.x, zb, { coils: 22, r: 0.9, hook: 0.9 });
      if (S.c.mode === 'spring') { K.hanger(top.x, zb, Math.round(S.c.m / 50), S.c.m + ' g'); return; }
      const d = S.c.d, mx = top.x + (d - 2) * Math.sin(S.th), my = zb + (d - 2) * Math.cos(S.th);
      K.string(top.x, zb, mx, my);
      const cx = top.x + d * Math.sin(S.th), cy = zb + d * Math.cos(S.th);
      K.ctx.save(); K.ctx.translate(cx, cy); K.ctx.rotate(-S.th);
      K.line(0, -2, 0, -0.8, 1.4, '#374151');
      for (let i = 0; i < Math.round(S.c.m / 100); i++) K.rect(-2, -0.8 + i * 0.55, 4, 0.5, i % 2 ? '#9ca3af' : '#b7bec7', '#374151', 0.6);
      K.ctx.restore();
    },
    steps: ['Spring only, m = 300 g: pull down and release. Time 20 oscillations twice and find T.', 'Calculate l = gT²/π². Switch to Spring + string and set d ≈ l. Measure d (top of string to centre of masses) with the rule.',
      'Pull 15 cm sideways and release. Watch the coils and time the interval t between two "coils still" moments.', 'Repeat with m = 400 g.', 'Calculate k = t²/m² for both and compare using your % uncertainty in t.'],
    table: {
      cols: [{ k: 'm', label: 'm / kg' }, { k: 'T', label: 'T / s' }, { k: 'd', label: 'd / cm' }, { k: 't', label: 't / s' }],
      derived: [{ k: 'l', label: 'l = gT²/π² / m', f: (r) => g * r.T * r.T / Math.PI ** 2, fmt: (v) => v.toFixed(3) }, { k: 'kk', label: 'k = t²/m² / s² kg⁻²', f: (r) => r.t * r.t / (r.m * r.m), sf: 3 }],
      capture: (S) => ({ m: S.c.m / 1000 }),
    },
    check(S) {
      const H = S.h, m = S.c.m / 1000, T = 2 * Math.PI * Math.sqrt(m / H.k);
      return `This spring: k = <b>${H.k.toFixed(1)} N m⁻¹</b>. For ${S.c.m} g the vertical period is <b>${T.toFixed(3)} s</b>, so the tuned length is l = gT²/π² = <b>${(g * T * T / Math.PI ** 2 * 100).toFixed(1)} cm</b>. Your current d = ${S.c.d} cm. Energy exchange is strongest when d is close to l; detuning makes it weak and irregular.`;
    },
  });

  // ---------- Q2: NTC thermistor ----------
  VPL.def('ejc-q2', {
    title: 'NTC thermistor in air and hot water',
    intro: '<p>Close the switch to read I and V and work out R = V/I. Then put the thermistor in the hot water, wait about a minute, and read the thermometer and the meters. The water cools slowly, so you can collect a full R–T data set. Use ×10 speed if you want.</p>',
    world: { x: 0, y: 0, w: 70, h: 44 },
    zoom: 3,
    speed: [1, 10, 30],
    hidden: (r) => ({ R25: 10000 * r.uni(0.95, 1.05), B: r.uni(3800, 4050), emf: r.uni(1.5, 1.58), rint: r.uni(0.8, 1.6), Troom: r.uni(25, 27.5) }),
    controls: [
      { id: 'sw', label: 'Switch', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
      { id: 'where', label: 'Thermistor is in', type: 'buttons', value: 'air', options: [{ value: 'air', label: 'Air' }, { value: 'water', label: 'Beaker of water' }] },
    ],
    actions: [{ label: 'Fill beaker with hot water (≈ 70 °C)', run(S) { S.Tw = 69 + Math.random() * 3; } }],
    init(S) { S.Tw = S.h.Troom; S.Tth = S.h.Troom; },
    step(S, dt) {
      const H = S.h;
      S.Tw += (H.Troom - S.Tw) * dt / 1400;
      const target = S.c.where === 'water' ? S.Tw : H.Troom, tau = S.c.where === 'water' ? 6 : 35;
      S.Tth += (target - S.Tth) * dt / tau;
    },
    R(S) { const H = S.h; return H.R25 * Math.exp(H.B * (1 / (S.Tth + 273.15) - 1 / 298.15)); },
    meters: [
      { id: 'th', label: 'Thermometer', unit: '°C', get: (S) => (S.c.where === 'water' ? S.Tw : S.h.Troom), fmt: (v) => (Math.round(v * 2) / 2).toFixed(1) },
      { id: 'V', label: 'Voltmeter', unit: 'V', get: (S) => { if (!S.c.sw) return 0; const R = VPL.sims['ejc-q2'].R(S); return S.h.emf * R / (R + S.h.rint + 10); }, res: 0.01, noise: 0.002 },
      { id: 'I', label: 'Ammeter', unit: 'mA', get: (S) => { if (!S.c.sw) return 0; const R = VPL.sims['ejc-q2'].R(S); return S.h.emf / (R + S.h.rint + 10) * 1000; }, res: 0.001, noise: 0.0004 },
    ],
    draw(K, S) {
      K.bench(42);
      K.cell(10, 8, 18, 8, 'cell'); K.wire([[4, 8], [10, 8]]); K.wire([[18, 8], [24, 8]]);
      K.switchSym(24, 8, 28, S.c.sw, 'switch'); K.wire([[28, 8], [34, 8]]); K.dial(36, 8, 2, 'A'); K.wire([[38, 8], [48, 8], [48, 20]]);
      K.wire([[4, 8], [4, 30], (S.c.where === 'water' ? [44, 30] : [30, 30])]);
      const tx = S.c.where === 'water' ? 46 : 30, ty = S.c.where === 'water' ? 33 : 26;
      K.wire([[48, 20], [tx + 2, 20], [tx + 2, ty - 1]]);
      K.wire([[S.c.where === 'water' ? 44 : 30, 30], [tx - 1, 30], [tx - 1, ty - 1]]);
      K.rect(tx - 1.4, ty - 1, 3.8, 2.4, '#7c2d12', '#431407', 1); K.text(tx + 0.5, ty + 2.6, 'thermistor', 9, '#431407', 'center');
      K.dial(14, 20, 2, 'V'); K.wire([[14, 18], [14, 14], [24, 14], [24, 30]]); K.wire([[14, 22], [14, 26], [8, 26], [8, 30]]);
      // beaker
      const hot = (S.Tw - S.h.Troom) / 45;
      K.rect(40, 26, 14, 15.6, null, '#64748b', 1.6);
      if (S.Tw > S.h.Troom + 0.3 || S.c.where === 'water') K.rect(40.4, 30, 13.2, 11.2, `rgba(${Math.round(120 + 120 * hot)},${Math.round(170 - 60 * hot)},${Math.round(230 - 150 * hot)},0.45)`, null);
      K.rect(51.5, 20, 0.8, 20, '#f1f5f9', '#64748b', 0.8); K.circle(51.9, 40, 0.8, '#dc2626', '#7f1d1d', 0.8);
      K.text(51.9, 18.8, 'thermometer', 9, '#475569', 'center');
      K.text(47, 43.2, 'beaker', 9, '#475569', 'center');
    },
    steps: ['Read the room temperature. Close the switch, record I and V, and calculate R. Open the switch.', 'Fill the beaker with hot water and move the thermistor into it. Wait 1 minute.', 'Record T, V and I. Calculate R.', 'Extension: as the water cools, take readings every 5 °C and plot ln R against 1/T.'],
    table: {
      cols: [{ k: 'T', label: 'T / °C' }, { k: 'V', label: 'V / V' }, { k: 'I', label: 'I / mA' }],
      derived: [{ k: 'R', label: 'R / kΩ', f: (r) => r.V / r.I, sf: 3 }, { k: 'lnR', label: 'ln(R / Ω)', f: (r) => Math.log(r.V / r.I * 1000), fmt: (v) => v.toFixed(3) }, { k: 'invT', label: '1/T / 10⁻³ K⁻¹', f: (r) => 1000 / (r.T + 273.15), fmt: (v) => v.toFixed(4) }],
    },
    plot: { xs: [{ label: '1/T / 10⁻³ K⁻¹', f: (r) => r.invT }, { label: 'T / °C', f: (r) => r.T }], ys: [{ label: 'ln(R / Ω)', f: (r) => r.lnR }, { label: 'R / kΩ', f: (r) => r.R }],
      result: (f) => `If ln R against 1/T: B = gradient × 1000 = <b>${VPL.fmt(f.m * 1000, 3)} K</b>` },
    check(S) { const H = S.h; return `This thermistor: R = <b>${(H.R25 / 1000).toFixed(2)} kΩ</b> at 25 °C with B = <b>${H.B.toFixed(0)} K</b>, so R(T) = R₂₅ e^{B(1/T − 1/298)}. Room temperature is ${H.Troom.toFixed(1)} °C. The thermistor is currently at ${S.Tth.toFixed(1)} °C with R = ${(VPL.sims['ejc-q2'].R(S) / 1000).toFixed(2)} kΩ.`; },
  });

  // ---------- Q3: rod in equilibrium (pivot + pulley) ----------
  VPL.def('ejc-q3', {
    title: 'Rod held by a string over a pulley',
    intro: '<p>The rod pivots at its right eye. Mass Q (70 g) sits at distance q from the right eye. Slide P (50 g) until the <b>rod is parallel to the bench</b> (measure the height of both ends). Then measure p, q and θ. The sliders have no numbers on purpose: use the rule.</p>',
    world: { x: -32, y: 0, w: 124, h: 70 },
    zoom: 5,
    hidden: (r) => ({ R: r.uni(0.83, 0.95), px: -20 + r.uni(-0.6, 0.6), py: 22 + r.uni(-0.6, 0.6), S: r.uni(79.6, 80.4) }),
    controls: [
      { id: 'q', label: 'Position of Q', type: 'range', min: 20, max: 78, step: 0.1, value: 26, hideValue: true },
      { id: 'p', label: 'Position of P', type: 'range', min: 4, max: 79, step: 0.1, value: 60, hideValue: true },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
      { id: 'prot', label: 'Protractor rotation', type: 'range', min: -180, max: 180, step: 1, value: 0, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: -8, y: 52, len: 100, angle: 0, every: 5 }, { id: 'prot', type: 'protractor', x: 0, y: 48, r: 6, angle: 0 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; if (id === 'prot') S.mov.prot.angle = S.c.prot; },
    pivot: { x: 80, y: 46 },
    solve(S) {
      const H = S.h, pv = this.pivot, T = 0.150 * g, W = 0.0981;
      const torque = (phi) => {
        const ex = pv.x - H.S * Math.cos(phi), ey = pv.y - H.S * Math.sin(phi);
        const dx = H.px - ex, dy = H.py - ey, L = Math.hypot(dx, dy);
        const rx = (ex - pv.x) / 100, ry = (ey - pv.y) / 100;
        let tq = rx * (T * dy / L) - ry * (T * dx / L);   // z-torque of tension (y down)
        const arm = (d) => -(d / 100) * Math.cos(phi);       // horizontal lever of a weight at distance d left of pivot
        tq -= (H.R * arm(H.S / 2) + 5 * W * arm(+S.c.p) + 7 * W * arm(+S.c.q)) * -1;
        return tq;
      };
      let a = -20 * deg, b = 20 * deg;
      for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (torque(a) * torque(m) <= 0) b = m; else a = m; }
      return (a + b) / 2;
    },
    step(S, dt) { const target = this.solve(S); S.phi = S.phi == null ? target : S.phi + (target - S.phi) * Math.min(1, dt * 4); },
    draw(K, S) {
      const H = S.h, pv = this.pivot, phi = S.phi || 0;
      K.bench(62);
      K.stand(H.px, 62, 50); K.boss(H.px, 15);
      K.stand(84, 62, 50); K.boss(84, 44); K.clampRod(80.5, 44, 84);
      K.circle(H.px, H.py + 2.6, 2.6, '#d1d5db', '#374151', 1.2); K.circle(H.px, H.py + 2.6, 0.4, '#374151', null);
      K.line(H.px, 15, H.px, H.py, 1.2, '#7a5c2e');
      // hanger on left side of pulley
      const hy = 34; K.string(H.px - 2.6, H.py + 2.6, H.px - 2.6, hy); K.hanger(H.px - 2.6, hy, 3, '150 g');
      const ex = pv.x - H.S * Math.cos(phi), ey = pv.y - H.S * Math.sin(phi);
      K.string(H.px + 0.4, H.py + 0.6, ex, ey - 0.4);
      K.ctx.save(); K.ctx.translate(pv.x, pv.y); K.ctx.rotate(phi);
      K.rect(-H.S - 5, 0.4, H.S + 9, 1.6, '#d9b77e', '#7c5a2c', 1);
      K.circle(-H.S, 0, 0.55, null, '#475569', 1.4); K.circle(0, 0, 0.55, null, '#475569', 1.4);
      K.rect(-S.c.p - 1, -1.6, 2, 2, '#64748b', '#1f2937'); K.text(-S.c.p, -2.6, 'P', 10, '#1f2937', 'center', 700);
      K.rect(-S.c.q - 1.2, -2.0, 2.4, 2.4, '#475569', '#1f2937'); K.text(-S.c.q, -3.0, 'Q', 10, '#1f2937', 'center', 700);
      K.ctx.restore();
      K.text(pv.x - H.S, pv.y + 4.5, 'left eye', 9, '#475569', 'center'); K.text(pv.x, pv.y + 4.5, 'right eye (pivot)', 9, '#475569', 'center');
    },
    steps: ['Measure S between the centres of the eyes (rotate the rule to the rod).', 'Set q ≈ 26 cm. Slide P until the rod is parallel to the bench. Check by measuring the height of each end above the bench.',
      'Measure q, p and the angle θ between the string and the rod.', 'Repeat for five more values of q between 25 cm and 75 cm.', 'Plot τ_Q against τ_P. A = intercept, B = gradient. R = F sin θ − 2A/S with F = 2.94 N.'],
    table: {
      cols: [{ k: 'q', label: 'q / cm' }, { k: 'p', label: 'p / cm' }],
      derived: [{ k: 'tp', label: 'τ_P / N m', f: (r) => 5 * 0.0981 * r.p / 100, fmt: (v) => v.toFixed(4) }, { k: 'tq', label: 'τ_Q / N m', f: (r) => 7 * 0.0981 * r.q / 100, fmt: (v) => v.toFixed(4) }],
    },
    plot: { xs: [{ label: 'τ_P / N m', f: (r) => r.tp }], ys: [{ label: 'τ_Q / N m', f: (r) => r.tq }],
      result: (f, S) => { const th = +S.c.thuser, Su = +S.c.Suser; return `A = <b>${VPL.fmt(f.c, 3)} N m</b>, B = <b>${VPL.fmt(f.m, 3)}</b>` + (th && Su ? `, R = F sin θ − 2A/S = <b>${VPL.fmt(2.94 * Math.sin(th * deg) - 2 * f.c / (Su / 100), 3)} N</b>` : ' (enter θ and S to get R)'); } },
    check(S, f) {
      const H = S.h, pv = this.pivot, phi = S.phi || 0;
      const ex = pv.x - H.S * Math.cos(phi), ey = pv.y - H.S * Math.sin(phi);
      const th = Math.abs(Math.atan2(H.py - ey, H.px - ex) - phi) / deg;
      return `This rod weighs R = <b>${H.R.toFixed(3)} N</b>; S = ${H.S.toFixed(1)} cm. The rod is currently tilted by ${(phi / deg).toFixed(2)}° (${Math.abs(phi / deg) < 0.15 ? 'parallel to the bench' : 'not yet level'}); the string makes θ ≈ ${(180 - th).toFixed(1)}° with the rod.`;
    },
  });
  VPL.sims['ejc-q3'].controls.push({ id: 'Suser', label: 'Your measured S / cm', type: 'number', value: '', step: 0.1 }, { id: 'thuser', label: 'Your measured θ / °', type: 'number', value: '', step: 1 });
})();
