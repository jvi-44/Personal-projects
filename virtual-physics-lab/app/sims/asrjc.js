/* ASRJC 2026 Paper 4 simulations (Q1's circuit is also used by ACJC Q2) */
(function () {
  const g = 9.81, deg = Math.PI / 180;

  // ---------- Q1: wire length L in parallel with X, then a second X across which V is read ----------
  VPL.def('asrjc-q1', {
    title: 'Resistance wire with two resistors X',
    intro: '<p>Measure the battery e.m.f. E (voltmeter across the battery alone) and the resistance R of X. Then clip F and G onto the wire a distance L apart, close the switch and read V across the second resistor. Move F to increase L.</p>',
    world: { x: 0, y: 0, w: 110, h: 46 },
    zoom: 6,
    hidden: (r) => ({ E: r.uni(2.95, 3.12), R: 10 * r.uni(0.97, 1.03), k: r.uni(19.2, 21.0), r: r.uni(0.1, 0.25) }),
    controls: [
      { id: 'mode', label: 'Meter use', type: 'buttons', value: 'circuit', options: [{ value: 'emf', label: 'Voltmeter across battery' }, { value: 'ohm', label: 'Ohmmeter on X' }, { value: 'circuit', label: 'Circuit (Fig.)' }] },
      { id: 'F', label: 'Position of clip F on the wire', type: 'range', min: 2, max: 70, step: 0.1, value: 60, hideValue: true },
      { id: 'sw', label: 'Switch', type: 'toggle', value: false, labels: ['Open', 'Closed'] },
    ],
    Gpos: 92,
    V(S) {
      const H = S.h;
      if (S.c.mode === 'emf') return H.E;
      if (S.c.mode === 'ohm') return null;
      if (!S.c.sw) return 0;
      const kL = H.k * (this.Gpos - S.c.F) / 100, Rp = kL * H.R / (kL + H.R);
      return H.E / (H.R + Rp + H.r) * H.R;
    },
    meters: [
      { id: 'V', label: 'Voltmeter', unit: 'V', get: (S) => VPL.sims['asrjc-q1'].V(S), res: 0.01, noise: 0.002, blank: '—' },
      { id: 'O', label: 'Multimeter (Ω)', unit: 'Ω', get: (S) => (S.c.mode === 'ohm' ? S.h.R : null), res: 0.1, blank: '—' },
    ],
    draw(K, S) {
      const x0 = 2, yW = 34, G = this.Gpos;
      K.rule(x0, yW + 0.8, 100, 0, { every: 5, w: 2.6, label: 'metre rule' });
      K.line(x0, yW, x0 + 100, yW, 1.4, '#b45309');
      const F = x0 + +S.c.F, Gx = x0 + G;
      K.rect(F - 0.5, yW - 2.5, 1, 2.5, '#111', null); K.text(F, yW - 3.4, 'F', 11, K.ink, 'center', 700);
      K.rect(Gx - 0.5, yW - 2.5, 1, 2.5, '#111', null); K.text(Gx, yW - 3.4, 'G', 11, K.ink, 'center', 700);
      if (S.c.mode !== 'circuit') { K.text(55, 10, S.c.mode === 'emf' ? 'Voltmeter connected straight across the battery (no other load).' : 'Resistor X removed and connected to the multimeter.', 12, '#475569', 'center', 600); return; }
      K.wire([[F, yW - 2.5], [F, 6], [40, 6]]); K.switchSym(40, 6, 46, S.c.sw, 'switch'); K.wire([[46, 6], [56, 6]]); K.cell(56, 6, 62, 6, 'E'); K.wire([[62, 6], [98, 6], [98, 14]]);
      K.wire([[F, 14], [52, 14]]); K.resistor(52, 14, 66, 14, 'X'); K.wire([[66, 14], [Gx + 3, 14], [Gx + 3, yW - 1], [Gx, yW - 1]]);
      K.node(98, 14); K.resistor(98, 14, 98, 26, ''); K.text(96, 20, 'X', 11, K.ink, 'right', 700);
      K.wire([[98, 14], [106, 14], [106, 18]]); K.dial(106, 20, 2, 'V'); K.wire([[106, 22], [106, 26], [98, 26]]); K.node(98, 26);
      K.wire([[98, 26], [98, 30], [Gx + 3, 30]]);
    },
    steps: ['Measure E (voltmeter across the battery) and R (ohmmeter on X).', 'Set up the circuit. Clip F 30 cm from G, close the switch, read V, open the switch.', 'Increase L in steps up to about 90 cm.', 'Plot (E − V)/L against V: P = gradient, Q = −intercept.'],
    table: { cols: [{ k: 'L', label: 'L / cm' }, { k: 'V', label: 'V / V' }], derived: [{ k: 'y', label: '(E − V)/L / V m⁻¹', f: (r, S) => ((+S.c.Euser || 3.0) - r.V) / (r.L / 100), fmt: (v) => v.toFixed(3) }], help: 'Enter your measured E in the box below the controls first.' },
    plot: { xs: [{ label: 'V / V', f: (r) => r.V }], ys: [{ label: '(E − V)/L / V m⁻¹', f: (r) => r.y }], result: (f, S) => `P = <b>${VPL.fmt(f.m, 3)} m⁻¹</b>, Q = <b>${VPL.fmt(-f.c, 3)} V m⁻¹</b>, Q/P = ${VPL.fmt(-f.c / f.m, 3)} V (theory E/2); R = 2k/P with k = 20 Ω m⁻¹ gives ${VPL.fmt(40 / f.m, 3)} Ω` },
    check(S) { const H = S.h; return `This apparatus: E = <b>${H.E.toFixed(2)} V</b>, R = <b>${H.R.toFixed(1)} Ω</b>, wire k = <b>${H.k.toFixed(1)} Ω m⁻¹</b>. Theory: P = 2k/R = ${(2 * H.k / H.R).toFixed(2)} m⁻¹ and Q = kE/R = ${(H.k * H.E / H.R).toFixed(2)} V m⁻¹ (the small internal resistance shifts these slightly). Current L = ${(this.Gpos - S.c.F).toFixed(1)} cm.`; },
  });
  VPL.sims['asrjc-q1'].controls.push({ id: 'Euser', label: 'Your measured E / V', type: 'number', value: '', step: 0.01 });

  // ---------- Q2: compound pendulum (strip with holes) ----------
  VPL.def('asrjc-q2', {
    title: 'Oscillating wooden strip',
    intro: '<p>First balance the strip on the pivot (slide it until it is level) and measure a from end A. Then hang it from a hole (distance z from end A), push the bottom and time 20 oscillations. Repeat for other holes.</p>',
    world: { x: 0, y: 0, w: 120, h: 110 },
    zoom: 6,
    hidden: (r) => ({ L: 100, cm: 50 + r.uni(-0.6, 0.6), damp: r.uni(0.02, 0.04) }),
    controls: [
      { id: 'mode', label: 'Step', type: 'buttons', value: 'bal', options: [{ value: 'bal', label: 'Balance on pivot' }, { value: 'hang', label: 'Hang from a hole' }] },
      { id: 'piv', label: 'Pivot position under the strip', type: 'range', min: 40, max: 60, step: 0.05, value: 46, hideValue: true },
      { id: 'z', label: 'Hole (distance from end A)', type: 'select', value: 5, options: [5, 10, 15, 20, 25, 30, 35, 40].map((v) => ({ value: v, label: 'hole at ' + v + ' cm' })) },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 0, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 8, y: 30, len: 100, angle: 0, every: 5, w: 2.4 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else S.amp = 0; },
    actions: [{ label: 'Push the bottom and release', run(S) { S.amp = 6 * deg; S.t0 = S.t; } }, { label: 'Stop', run(S) { S.amp = 0; } }],
    init(S) { S.amp = 0; S.t0 = 0; S.phi = 0; },
    T(S) { const H = S.h, y = (H.cm - S.c.z) / 100, k2 = (H.L / 100) ** 2 / 12; return 2 * Math.PI * Math.sqrt((y * y + k2) / (g * y)); },
    step(S) { S.phi = S.c.mode === 'hang' && S.amp ? S.amp * Math.exp(-S.h.damp * (S.t - S.t0)) * Math.cos(2 * Math.PI * (S.t - S.t0) / this.T(S)) : 0; },
    draw(K, S) {
      const H = S.h;
      K.bench(106);
      if (S.c.mode === 'bal') {
        const tilt = Math.max(-8, Math.min(8, (H.cm - S.c.piv) * 1.5)) * deg, px = 10 + +S.c.piv, py = 101;
        K.path([[px - 2, 106], [px, py + 0.2], [px + 2, 106]], 1.2, '#374151', true, '#9ca3af');
        K.ctx.save(); K.ctx.translate(px, py); K.ctx.rotate(tilt); K.rect(-S.c.piv, -2.4, H.L, 2.4, '#d9b77e', '#7c5a2c', 1);
        for (let z = 5; z <= 40; z += 5) K.circle(-S.c.piv + z, -1.2, 0.35, '#fff', '#7c5a2c', 0.8);
        K.text(-S.c.piv + 1.5, -4, 'A', 11, K.ink, 'left', 700); K.text(-S.c.piv + H.L - 1.5, -4, 'B', 11, K.ink, 'right', 700); K.ctx.restore();
        K.text(60, 20, Math.abs(H.cm - S.c.piv) < 0.15 ? 'Balanced' : 'Not balanced: slide the pivot', 12, Math.abs(H.cm - S.c.piv) < 0.15 ? '#2d7a3e' : '#b4361f', 'center', 700);
        return;
      }
      const pv = { x: 60, y: 4 };
      K.stand(30, 106, 104); K.clampRod(30, pv.y, pv.x); K.boss(30, pv.y);
      K.ctx.save(); K.ctx.translate(pv.x, pv.y); K.ctx.rotate(S.phi);
      K.rect(-1.4, -S.c.z, 2.8, H.L, '#d9b77e', '#7c5a2c', 1);
      for (let z = 5; z <= 40; z += 5) K.circle(0, -S.c.z + z, 0.35, '#fff', '#7c5a2c', 0.8);
      K.text(2.6, -S.c.z + 1.2, 'A', 11, K.ink, 'left', 700); K.text(2.6, -S.c.z + H.L - 1.2, 'B', 11, K.ink, 'left', 700);
      K.ctx.restore(); K.circle(pv.x, pv.y, 0.45, '#111', null);
    },
    steps: ['Balance the strip on the pivot and measure a (end A to pivot) with the rule.', 'Hang it from the hole at z = 5 cm. Push and time 20 oscillations twice.', 'Repeat for six more holes.', 'y = a − z. Plot T²y against y²: M = gradient, b = √(intercept/M); g = 4π²/M.'],
    table: { cols: [{ k: 'z', label: 'z / cm' }, { k: 't1', label: 't₁ (20) / s' }, { k: 't2', label: 't₂ (20) / s' }],
      derived: [{ k: 'T', label: 'T / s', f: (r) => (r.t1 + r.t2) / 40, fmt: (v) => v.toFixed(3) }, { k: 'y', label: 'y / m', f: (r, S) => ((+S.c.auser || 50) - r.z) / 100, fmt: (v) => v.toFixed(3) },
        { k: 'Ty', label: 'T²y / s² m', f: (r) => r.T * r.T * r.y, fmt: (v) => v.toFixed(4) }, { k: 'y2', label: 'y² / m²', f: (r) => r.y * r.y, fmt: (v) => v.toFixed(4) }],
      capture: (S) => ({ z: S.c.z }), help: 'Enter your measured a in the box below the controls.' },
    plot: { xs: [{ label: 'y² / m²', f: (r) => r.y2 }], ys: [{ label: 'T²y / s² m', f: (r) => r.Ty }], result: (f) => `M = <b>${VPL.fmt(f.m, 3)} s² m⁻¹</b>, b = <b>${VPL.fmt(Math.sqrt(f.c / f.m) * 100, 3)} cm</b>, g = 4π²/M = <b>${VPL.fmt(4 * Math.PI ** 2 / f.m, 3)} m s⁻²</b>` },
    check(S) { const H = S.h; return `Centre of mass at a = <b>${H.cm.toFixed(1)} cm</b> from end A. Radius of gyration b = L/√12 = <b>${(H.L / Math.sqrt(12)).toFixed(1)} cm</b>. Current T = ${this.T(S).toFixed(3)} s.`; },
  });
  VPL.sims['asrjc-q2'].controls.push({ id: 'auser', label: 'Your measured a / cm', type: 'number', value: '', step: 0.1 });

  // ---------- Q3: toppling container ----------
  VPL.def('asrjc-q3', {
    title: 'Toppling a container of water',
    intro: '<p>Set the water height h and replace the cap. Hold <b>Push</b> to tilt the container slowly about its bottom-right edge in front of the quadrant scale; it falls when its centre of mass passes over the edge. Read the angle on the scale just before it falls (use the magnifier, and repeat).</p>',
    world: { x: 0, y: 0, w: 70, h: 50 },
    zoom: 4,
    hidden: (r) => ({ d: r.uni(4.4, 4.6), mc: r.uni(10, 14), zc: r.uni(5.3, 5.8), H: 11 }),
    controls: [
      { id: 'h', label: 'Water height h', type: 'range', min: 0, max: 7, step: 0.1, value: 1, hideValue: true },
      { id: 'push', label: 'Push', type: 'toggle', value: false, labels: ['Not pushing', 'Pushing (slowly)'] },
      { id: 'rang', label: 'Rule angle', type: 'range', min: -90, max: 90, step: 0.5, value: 90, unit: '°' },
    ],
    movables: [{ id: 'rule', type: 'rule', x: 10, y: 34, len: 15, angle: 90, w: 2 }],
    onchange(S, id) { if (id === 'rang') S.mov.rule.angle = S.c.rang; else if (id === 'h') { S.tilt = 0; S.fallen = false; S.c.push = false; } },
    actions: [{ label: 'Stand the container upright again', run(S) { S.tilt = 0; S.fallen = false; S.trial = (S.trial || 0) + 1; } }],
    init(S) { S.tilt = 0; S.fallen = false; S.trial = 0; },
    crit(S) {
      const H = S.h, mw = Math.PI * (H.d / 2) ** 2 * S.c.h, z = (H.mc * H.zc + mw * S.c.h / 2) / (H.mc + mw);
      return Math.atan((H.d / 2) / z) + VPL.rng(1000 + S.trial * 31 + Math.round(S.c.h * 10)).gauss(0, 0.6) * deg;
    },
    step(S, dt) {
      if (S.fallen) { S.tilt = Math.min(Math.PI / 2, S.tilt + dt * 3); return; }
      if (S.c.push) S.tilt += 1.6 * deg * dt;
      if (S.tilt > this.crit(S)) S.fallen = true;
    },
    draw(K, S) {
      const H = S.h, ex = 30, ey = 46;  // pivot edge (bottom-right of container)
      K.bench(46);
      // scale (quadrant) on the brick behind
      K.rect(ex, 18, 26, 28, '#ffffff', '#64748b', 0.8); K.rect(ex + 6, 12, 14, 6, '#ea8a3c', '#9a3412', 0.8);
      for (let a = 0; a <= 90; a++) {
        const r1 = 22, L = a % 10 === 0 ? 2.2 : a % 5 === 0 ? 1.5 : 0.9, ang = -Math.PI / 2 + a * deg;
        K.line(ex + Math.cos(ang) * r1, ey + Math.sin(ang) * r1, ex + Math.cos(ang) * (r1 - L), ey + Math.sin(ang) * (r1 - L), a % 10 ? 0.6 : 1);
        if (a % 10 === 0) { K.text(ex + Math.cos(ang) * (r1 - 3.6), ey + Math.sin(ang) * (r1 - 3.6), String(a), 8, K.ink, 'center', 600); K.line(ex, ey, ex + Math.cos(ang) * (r1 - 5), ey + Math.sin(ang) * (r1 - 5), 0.3, '#94a3b8'); }
      }
      K.rect(ex, ey - 0.2, 8, 0.4, '#60a5fa', null);
      K.ctx.save(); K.ctx.translate(ex, ey); K.ctx.rotate(S.tilt);
      const w = H.d;
      K.rect(-w, -H.H, w, H.H, 'rgba(241,245,249,0.85)', '#475569', 1.2);
      K.rect(-w - 0.2, -H.H - 0.8, w + 0.4, 0.8, '#1f2937', null);
      if (S.c.h > 0) K.rect(-w + 0.15, -S.c.h, w - 0.3, S.c.h - 0.15, 'rgba(59,130,246,0.45)', null);
      K.rect(-0.25, -15, 0.5, 15, '#e5e7eb', '#64748b', 0.6);   // 15 cm plastic ruler on the side, aligned with the scale
      K.line(-w, -H.H * 0.35, 0, -H.H * 0.35, 1.2, '#111'); K.line(-w, -H.H * 0.7, 0, -H.H * 0.7, 1.2, '#111');
      K.ctx.restore();
      K.text(12, 4, S.fallen ? 'It fell over. Stand it up and try again.' : (S.c.push ? 'Pushing…' : ''), 11, S.fallen ? '#b4361f' : '#475569', 'left', 700);
    },
    closeups: [{ type: 'vernier', title: 'Vernier caliper: diameter d of container A', help: 'Zero error 0.00 cm.', get: (S, n) => S.h.d + ((n % 3) - 1) * 0.004 }],
    steps: ['Measure d with the vernier caliper (below).', 'Set h ≈ 1 cm and measure it with the rule (rotate it vertical beside the container).', 'Push slowly and note the angle on the scale at which it falls. Repeat.', 'Repeat for h from 0 to 6 cm. Find the h giving the largest θ.'],
    table: { cols: [{ k: 'h', label: 'h / cm' }, { k: 'th1', label: 'θ₁ / °' }, { k: 'th2', label: 'θ₂ / °' }], derived: [{ k: 'th', label: 'θ / °', f: (r) => (r.th1 + r.th2) / 2, fmt: (v) => v.toFixed(1) }, { k: 'c2', label: 'cos²θ', f: (r) => Math.cos(r.th * deg) ** 2, fmt: (v) => v.toFixed(3) }] },
    plot: { xs: [{ label: 'h / cm', f: (r) => r.h }], ys: [{ label: 'θ / °', f: (r) => r.th }], fitOff: true },
    check(S) { const H = S.h; const c = this.crit(S) / deg; return `Container: d = <b>${H.d.toFixed(2)} cm</b>. With h = ${(+S.c.h).toFixed(1)} cm the toppling angle is about <b>${c.toFixed(0)}°</b>. The angle is largest when the water surface is at the combined centre of mass.`; },
  });
})();
