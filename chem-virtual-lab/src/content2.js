/* ============ 5 · GAS COLLECTION ============ */
function gasRig(o) {
  // conical flask with side arm at x=-0.9, tubing to a 100 cm³ gas syringe at x=0.2
  return [
    ['bal', 'balance', { x: -3.8, z: 1.0, lab: 'analytical balance' }],
    ['bur', 'burette', { x: -2.4, dripY: 0.4, rd: 0, col: o.liqCol, lab: o.burLab }],
    ['cf', 'conical', { x: -2.4, side: true, lab: '250 cm³ conical flask with side arm' }],
    ['tube', 'stube', { x: -3.8, y: 0.33, z: 1.0, sol: 0, solc: o.solCol, str: 0.5, lab: o.tubeLab }],
    ['tub', 'tubing', { vis: 0, pts: [[-0.313, 0.997, 0], [-0.2, 1.15, 0], [0.0, 1.27, 0], [0.2, 1.25, 0]] }],
    ['syr', 'syringe', { x: 0.2, y: 1.25, stand: true, h: 1.25, vis: 0, lab: '100 cm³ graduated gas syringe' }],
    ['n1', 'note', { x: 1.4, y: 2.2, z: 0.3, vis: 0 }]
  ];
}
function gasSteps(o) {
  return [
    { t: 'Pre-calculations', d: o.preD, dg: [{ k: 'calc', h: 'Quantities', l: o.pre }] },
    { t: 'Measure the liquid', d: 'Using a ‹burette›, ~add~ «' + o.vol + '» into a clean and dry ‹250 cm³ conical flask with a side arm›.', cam: [-1.6, 3.0, 5.6, -2.4, 1.6, 0],
      ph: [[2.6, { bur: { drip: 1, rd: o.volN }, cf: { lv: 0.3, col: o.liqCol } }], [0.3, { bur: { drip: 0 } }]] },
    { t: 'Weigh the solid in a small tube', d: 'Using an ‹analytical balance›, ~weigh~ accurately about «' + o.mass + '» in a ‹small tube› and tie it to a string.', cam: [-3.2, 1.8, 3.6, -3.8, 0.5, 0.9],
      ph: [[1.4, { tube: { sol: 0.5 }, bal: { rd: o.massN } }]] },
    { t: 'Set up the apparatus', d: '~Set up~ the apparatus: flask, ‹rubber tubing› and ‹100 cm³ graduated gas syringe› clamped to a retort stand.', cam: [-0.6, 2.6, 6.4, -0.4, 1.1, 0],
      ph: [[1.2, { cf: { x: -0.9 } }], [0.8, { tub: { vis: 1 }, syr: { vis: 1 } }]] },
    { t: 'Lower the tube; stopper', d: '~Lower~ the filled tube into the conical flask, taking care that the reagents «do not mix». ~Stopper~ the flask.', cam: [-0.9, 2.2, 4.4, -0.9, 0.9, 0],
      ph: [[1.0, { tube: { x: -0.9, y: 1.8, z: 0 }, bal: { rd: 0 } }], [0.9, { tube: { y: 0.55, str: 0.75 } }], [0.4, { cf: { stop: 1 } }]] },
    { t: 'Check the syringe reads zero', d: '~Check~ that the initial reading of the ‹100.0 cm³ gas syringe› is set at the «zero mark».', cam: [0.8, 1.8, 3.6, 0.9, 1.2, 0],
      ph: [[0.5, { n1: { vis: 1, lab: 'initial reading: 0.0 cm³' } }]] },
    { t: 'Release the tube', d: 'At a suitable time, ~loosen~ the stopper slightly to release the string so the reagents mix. ~Stopper~ the flask immediately.', cam: [-0.9, 2.2, 4.4, -0.9, 0.9, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [0.3, { cf: { stop: 0 } }], [0.7, { tube: { y: 0.1, rz: 1.3, str: 0.45 } }], [0.3, { cf: { stop: 1 } }], [1.0, { cf: { fizz: 0.6, ppt: o.ppt || 0, pptc: o.solCol } }]] },
    { t: 'Swirl', d: '~Swirl~ the conical flask so that the reagents are well mixed.', cam: [-0.4, 2.4, 5.4, -0.4, 1.0, 0],
      ph: [[1.8, { cf: { swirl: 1, fizz: 1 }, tube: { swirl: 1 }, syr: { rd: o.vN * 0.45 } }], [0.4, { cf: { swirl: 0 }, tube: { swirl: 0 } }]] },
    { t: 'Wait for a constant reading', d: 'Allow the reaction to proceed until it has ceased, shown by a «constant reading» of the syringe.', why: 'Waiting after the reaction stops lets the temperature and pressure settle before you read the volume.', cam: [0.4, 2.2, 5.0, 0.6, 1.1, 0],
      ph: [[3.2, { syr: { rd: o.vN }, cf: { fizz: 0.2 } }], [1.0, { cf: { fizz: 0 } }], [0.4, { n1: { vis: 1, lab: 'reading constant' } }]] },
    { t: 'Record the final reading', d: '~Record~ the final reading, «V cm³», on the graduated gas syringe.', cam: [0.8, 1.8, 3.6, 0.9, 1.2, 0], ph: [[0.4, { n1: { lab: 'V = ' + o.vN.toFixed(1) + ' cm³' } }]],
      dg: [{ k: 'table', h: 'Results', head: ['Reading', 'Value'], rows: [['Final gas syringe reading / cm³', 'V₂'], ['Initial gas syringe reading / cm³', 'V₁'], ['Volume of gas evolved / cm³', 'V₂ − V₁']] }] },
    { t: 'Repeat; use the results', d: '~Repeat~ the experiment to get consistent volumes of gas. Then use the «average» V.', why: 'Step 8 (constant reading) and this step (repeat) are what make the result accurate and reliable.', cam: [-0.4, 3.0, 7.6, -0.6, 1.2, 0], ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'calc', h: 'Calculation', l: o.calc }].concat(o.extra || []) }
  ];
}
EX.push({
  id: 'gas-we4', topic: 5, tag: 'WE4', name: 'Concentration of H₂O₂',
  q: 'Hydrogen peroxide decomposes: 2$H2O2$(aq) → 2$H2O$(l) + $O2$(g), catalysed by $MnO2$. Plan to find the actual concentration of an $H2O2$ sample (approx. 0.140–0.160 mol dm⁻³). Provided: 100 cm³ of $H2O2$, 2.0 g powdered $MnO2$, a 100 cm³ graduated gas syringe. 1 mol of gas occupies 24 dm³ under laboratory conditions.',
  tamp: { T: 'Gas collection.', A: 'Reaction flask: mix $MnO2$(s) + $H2O2$. Collect $O2$ in a 100 cm³ gas syringe.', M: 'Volume of $H2O2$ (burette); mass of $MnO2$; initial and final syringe readings.', P: 'Assume V(gas) ≈ 50–90% of 100 cm³ → set-up → mix → constant reading → repeat.' },
  cam: [-0.8, 3.2, 8.4, -1.0, 1.2, 0],
  actors: gasRig({ liqCol: C.w, burLab: '50.00 cm³ burette · H₂O₂(aq)', solCol: C.mno2, tubeLab: 'MnO₂ in small tube on string' }),
  steps: gasSteps({
    preD: 'A ‹100 cm³ gas syringe› is used, so ~assume~ «72.0 cm³» of $O2$ is collected (within 50–90% of capacity). Work back to the volume of $H2O2$.',
    pre: ['Let volume of $O2$ collected = 72.0 cm³', 'n($O2$) = 72.0 × 10⁻³ / 24 = 3.00 × 10⁻³ mol', '2$H2O2$ → 2$H2O$ + $O2$', 'n($H2O2$) = 2 × 3.00 × 10⁻³ = 6.00 × 10⁻³ mol', 'Assume [$H2O2$] = 0.150 mol dm⁻³', 'Volume of $H2O2$ = 6.00 × 10⁻³ / 0.150 × 1000 = <b>40.0 cm³</b>'],
    vol: '40.00 cm³ of $H2O2$(aq)', volN: 40, mass: '1.00 g of $MnO2$(s)', massN: 1.00, vN: 72.0,
    calc: ['Assume average volume of $O2$ = V cm³', 'n($O2$) = V / 24000 mol', 'n($H2O2$) = 2V / 24000 = V / 12000 mol', '[$H2O2$] = V/12000 × 1000/40.00 = <b>V / 480 mol dm⁻³</b>'],
    extra: [{ k: 'list', h: '(b) Titration vs gas collection', items: ['Titration gives the more accurate concentration.', 'Gas volume fluctuates with temperature and pressure, and some $O2$ may escape while the flask is being stoppered.'] }]
  })
});
EX.push({
  id: 'gas-we5', topic: 5, tag: 'WE5', name: '% Na₂CO₃ in a mixture',
  q: '$Na2CO3$(s) + 2$HCl$(aq) → 2$NaCl$(aq) + $CO2$(g) + $H2O$(l). FA 1 is about 80% $Na2CO3$ and 20% $NaCl$ by mass. Plan to find the percentage by mass of $Na2CO3$ in FA 1. Provided: 1.00 g FA 1, 100 cm³ of 0.200 mol dm⁻³ $HCl$, a 100 cm³ gas syringe. Use excess $HCl$; 1 mol gas = 24 dm³.',
  tamp: { T: 'Gas collection.', A: 'Solid mixture is limiting: assume 50 cm³ $CO2$ to find its mass. $HCl$ in excess.', M: 'Mass of FA 1; volume of $HCl$; initial and final syringe readings.', P: 'Same set-up as WE4, with FA 1 in the small tube.' },
  cam: [-0.8, 3.2, 8.4, -1.0, 1.2, 0],
  actors: gasRig({ liqCol: C.w, burLab: '50.00 cm³ burette · 0.200 mol dm⁻³ HCl', solCol: C.wh, tubeLab: 'FA 1 in small tube on string' }),
  steps: gasSteps({
    preD: '~Assume~ «50.0 cm³» of $CO2$ is collected to find the mass of FA 1, then check the volume of $HCl$ is in excess.',
    pre: ['Assume 50.0 cm³ of $CO2$ is collected', 'n($CO2$) = 50.0 / 24000 = 2.083 × 10⁻³ mol = n($Na2CO3$)', 'mass of $Na2CO3$ = 2.083 × 10⁻³ × 106.0 = 0.2208 g', 'FA 1 is 80% $Na2CO3$ → mass of FA 1 = 0.2208 / 0.8 = <b>0.276 g</b>', 'n($HCl$) needed = 2 × 2.083 × 10⁻³ = 4.166 × 10⁻³ mol', 'V($HCl$) = 4.166 × 10⁻³ / 0.200 = 20.8 cm³', '$HCl$ must be in excess (and allow a repeat) → use <b>30 cm³</b>'],
    vol: '30.00 cm³ of $HCl$(aq)', volN: 30, mass: '0.275 g of FA 1', massN: 0.275, vN: 50.0,
    calc: ['Let average volume of $CO2$ = V cm³; mass of FA 1 used = m g (tube is fully submerged so all of it reacts)', 'n($CO2$) = V / 24000 mol = n($Na2CO3$)', 'mass of $Na2CO3$ = V / 24000 × 106.0 g', '% $Na2CO3$ = (106.0V / 24000) / m × 100 = <b>53V / (120m) %</b>']
  })
});
EX.push({
  id: 'gas-methods', topic: 5, tag: 'Methods', name: 'Collection methods compared',
  q: 'Three common ways to collect and measure a gas: a graduated gas syringe, an inverted measuring cylinder filled with water, and an inverted burette filled with water. Which to choose, and how the readings differ.',
  tamp: { T: 'Gas collection.', A: 'Is the gas soluble in water? How much gas is expected?', M: 'Initial and final readings of the collecting apparatus.', P: 'Reaction vessel + collecting apparatus; plan for 50–90% of its capacity.' },
  cam: [-0.4, 3.0, 8.0, -0.4, 1.1, 0],
  actors: [
    ['cfA', 'conical', { x: -1.6, side: true, lv: 0.28, stop: 1, ppt: 0.06, pptc: C.wh, lab: 'reaction flask' }],
    ['tubA', 'tubing', { pts: [[-1.013, 0.997, 0], [-0.9, 1.16, 0], [-0.62, 1.27, 0], [-0.4, 1.25, 0]] }],
    ['syrA', 'syringe', { x: -0.4, y: 1.25, stand: true, h: 1.25, lab: 'gas syringe' }],
    ['cfB', 'conical', { x: -1.9, lv: 0.25, stop: 1, ppt: 0.06, pptc: '#8d969c', vis: 0, lab: 'Zn + HCl(aq)' }],
    ['tubB', 'tubing', { vis: 0, r: 0.03, pts: [[-1.9, 1.45, 0], [-1.9, 1.85, 0], [-1.3, 2.0, 0], [-0.55, 1.55, 0], [-0.25, 0.8, 0], [-0.05, 0.12, 0], [0.55, 0.07, 0], [0.9, 0.14, 0]] }],
    ['tr', 'trough', { x: 0.75, vis: 0, lab: 'trough of water' }],
    ['icyl', 'invcyl', { x: 0.9, y: 0.12, stand: true, sh: 0.12, read: true, vis: 0, lab: 'inverted 100 cm³ measuring cylinder' }],
    ['ibur', 'invcyl', { x: 0.9, y: 0.12, bur: true, stand: true, sh: 0.12, read: true, vis: 0, lab: 'inverted burette' }],
    ['n1', 'note', { x: 0.6, y: 3.2, vis: 0, style: 'warn' }]
  ],
  steps: [
    { t: 'Why collect a gas?', d: 'Measuring the gas evolved when one reagent is in excess lets you find: «R», a «concentration» or «percentage purity», an «M<sub>r</sub>», or follow «kinetics».',
      dg: [{ k: 'table', h: 'Reactions and uses', head: ['Reaction', 'Experiments'], rows: [['$Na2CO3$(s) + 2$HCl$(aq) → 2$NaCl$ + $H2O$ + $CO2$', '% purity of $Na2CO3$; M<sub>r</sub> of $Na2CO3$; rate of $CO2$ evolution'], ['$Zn$(s) + 2$HCl$(aq) → $ZnCl2$ + $H2$', '% Zn in a sheet; A<sub>r</sub> of Zn; molar gas constant R'], ['$H2O2$(aq) → $H2O$ + ½$O2$ ($MnO2$ catalyst)', '[$H2O2$]; volume strength; rate of $O2$ evolution']] }, { k: 'list', h: 'General guideline', items: ['Assume the volume of gas collected is 50–90% of the capacity of the collecting apparatus, and use it for the pre-calculations.'] }] },
    { t: 'Gas syringe', d: 'The gas pushes the plunger of a ‹graduated gas syringe› out. Works for any gas, including those soluble in water.', cam: [-0.6, 2.4, 5.4, -0.4, 1.1, 0],
      ph: [[3.4, { cfA: { fizz: 1 }, syrA: { rd: 68 } }], [0.6, { cfA: { fizz: 0 } }]],
      dg: [{ k: 'table', h: 'Results', head: ['Reading', ''], rows: [['Final gas syringe reading / cm³', 'V₂'], ['Initial gas syringe reading / cm³', 'V₁'], ['Volume of gas evolved / cm³', 'V₂ − V₁']] }] },
    { t: 'Inverted measuring cylinder', d: 'The gas bubbles into a ‹100 cm³ measuring cylinder› filled with water and inverted in a trough, pushing the water down.', cam: [-0.4, 2.8, 6.8, -0.3, 1.2, 0],
      ph: [[0.6, { cfA: { vis: 0 }, tubA: { vis: 0 }, syrA: { vis: 0 } }], [0.8, { cfB: { vis: 1 }, tubB: { vis: 1 }, tr: { vis: 1 }, icyl: { vis: 1 } }], [3.6, { cfB: { fizz: 1 }, icyl: { gas: 0.62, bub: 1 } }], [0.6, { cfB: { fizz: 0 }, icyl: { bub: 0 } }]],
      dg: [{ k: 'table', h: 'Results', head: ['Reading', ''], rows: [['Final measuring cylinder reading / cm³', 'V₂'], ['Initial measuring cylinder reading / cm³', 'V₁'], ['Volume of gas evolved / cm³', 'V₂ − V₁']] }] },
    { t: 'Inverted burette', d: 'Same idea with a ‹burette› filled with water and inverted. The scale is upside down, so the reading «decreases» as gas collects. Maximum volume: «50.00 cm³».', cam: [0.2, 2.8, 6.4, 0.4, 1.6, 0],
      ph: [[0.5, { icyl: { vis: 0, gas: 0 } }], [0.6, { ibur: { vis: 1 } }], [3.6, { cfB: { fizz: 1 }, ibur: { gas: 0.72, bub: 1 } }], [0.6, { cfB: { fizz: 0 }, ibur: { bub: 0 } }]],
      dg: [{ k: 'table', h: 'Results', head: ['Reading', ''], rows: [['Final burette reading / cm³', 'V₁'], ['Initial burette reading / cm³', 'V₂'], ['Volume of gas evolved / cm³', 'V₂ − V₁']] }] },
    { t: 'Is the gas soluble in water?', d: 'For collection over water, the gas must be «insoluble» or only poorly soluble in water. $CO2$, $NH3$, $SO2$, $NO2$ and HX (X = Cl, Br, I) dissolve, so collect them in a ‹gas syringe›.', ph: [[0.5, { n1: { vis: 1, lab: 'CO₂ dissolves → use a gas syringe' } }]] },
    { t: 'Limitations', d: 'Gas collection is fast but not very accurate.', ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'list', h: 'Sources of inaccuracy', items: ['Some gases (e.g. $CO2$) dissolve in the water in displacement methods.', 'Gas escapes in the lag time between mixing and replacing the stopper.', 'Swirling is variable, which changes the volume collected.', 'Air and gas are compressible; heat of reaction causes thermal expansion.', 'Gas volume depends on temperature and pressure.', 'The ideal gas equation is only an estimate, poor for gases that deviate from ideal behaviour.'] }] },
    { t: 'Your method summary', d: 'Put it together: measure the liquid with a ‹burette› into a ‹conical flask with side arm›; hang the solid in a small tube on a string; check the syringe zero; release, swirl, wait for a constant reading; record; repeat. Assume «1 mol = 24 dm³» at laboratory conditions.',
      ph: [[0.6, { cfB: { vis: 0 }, tubB: { vis: 0 }, tr: { vis: 0 }, ibur: { vis: 0 } }], [0.8, { cfA: { vis: 1 }, tubA: { vis: 1 }, syrA: { vis: 1 } }]], cam: [-0.6, 2.4, 5.4, -0.4, 1.1, 0] }
  ]
});

/* ============ 6 · ENERGETICS ============ */
EX.push({
  id: 'en-we6', topic: 6, tag: 'WE6', name: 'ΔH of solution of NH₄Cl',
  q: '$NH4Cl$ (solubility 383 g dm⁻³) is used in ice packs. $NH4Cl$(s) + aq → $NH4Cl$(aq), ΔH<sub>soln</sub> ≈ +15 kJ mol⁻¹. Plan to determine ΔH<sub>soln</sub>. Provided: 20 g solid $NH4Cl$, a polystyrene cup, a thermometer.',
  tamp: { T: 'Energetics: enthalpy change of solution.', A: 'Solubility limits the mass; ΔH ≈ +15 kJ mol⁻¹ lets you pre-calculate; polystyrene cup.', M: 'Mass of $NH4Cl$ (by difference); initial and lowest temperature.', P: 'Water in cup → initial T → add weighed solid → stir → lowest T → reweigh bottle → repeat.' },
  cam: [0, 3.0, 8.0, 0, 1.2, 0],
  actors: [
    ['bur', 'burette', { x: -1.2, rd: 0, dripY: 0.5, lab: '50.00 cm³ burette · deionised water' }],
    ['cup', 'cup', { x: -1.2, lab: 'polystyrene cup in 250 cm³ beaker' }],
    ['th', 'thermo', { x: -1.12, y: 0.12, z: 1.0, len: 2.0, min: 0, max: 50, T: 26.0, vis: 0, lab: 'thermometer' }],
    ['bal', 'balance', { x: 1.6, z: 0.3, lab: 'analytical balance' }],
    ['wb', 'wbottle', { x: 1.6, y: 0.33, z: 0.3, solc: C.wh, lab: 'weighing bottle' }],
    ['n1', 'note', { x: -1.2, y: 2.7, z: 1.0, vis: 0 }]
  ],
  steps: [
    { t: 'Pre-calculation', d: '~Assume~ «50.0 cm³» of water and a temperature change of «−7 °C», then work out the mass of $NH4Cl$ to use. Check it is below the solubility limit.',
      dg: [{ k: 'calc', h: 'Mass of NH₄Cl', l: ['Let volume of water = 50.0 cm³', 'Max mass that dissolves = 383/1000 × 50 = 19.15 g', 'Let ΔT = −7 °C', 'Heat change = 50 × 4.18 × (−7) = −1463 J', 'ΔH<sub>soln</sub> ≈ +15 kJ mol⁻¹ → n($NH4Cl$) = 1463 / (15 × 10³) = 0.09753 mol', 'mass = 0.09753 × (14.0 + 4.0 + 35.5) = <b>5.22 g</b> (well below 19.15 g)'] }] },
    { t: 'Water into the cup; initial T', d: 'Using a ‹50.00 cm³ burette›, ~transfer~ «50.00 cm³ of deionised water» into a clean and dry ‹polystyrene cup› supported in a ‹250 cm³ beaker›, and put the lid on. ~Take~ the initial temperature with the thermometer.', why: 'Keep the solution to no more than half the cup so nothing spills when the solid is added.', cam: [-0.8, 2.8, 5.6, -1.2, 1.4, 0.4],
      ph: [[2.6, { bur: { drip: 1, rd: 50 }, cup: { lv: 0.42 } }], [0.3, { bur: { drip: 0 } }], [0.9, { cup: { z: 1.0 } }], [0.4, { cup: { lid: 1 }, th: { vis: 1 } }], [0.4, { n1: { vis: 1, lab: 'initial T = 26.0 °C' } }]] },
    { t: 'Weigh the NH₄Cl', d: 'Using an ‹analytical balance›, ~weigh~ accurately about «5.22 g of $NH4Cl$» in a clean and dry ‹weighing bottle›. Record the total mass of the bottle and solid.', cam: [1.9, 1.9, 3.6, 1.6, 0.5, 0.3],
      ph: [[0.3, { n1: { vis: 0 } }], [1.4, { wb: { sol: 0.6 }, bal: { rd: 22.48 } }]] },
    { t: 'Add, stir, lowest T', d: '~Empty~ the solid into the cup, cover with the lid and ~stir~ gently with the thermometer until all the $NH4Cl$ dissolves. ~Record~ the «lowest temperature» reached.', cam: [-0.4, 2.2, 4.6, -0.9, 1.1, 0.8],
      ph: [[1.0, { wb: P('wb', 1, -1.28, 1.15, 1.0), cup: { lid: 0 }, bal: { rd: 0 } }], [0.9, { wb: { sol: 0.02 } }], [0.6, { wb: { x: 1.6, y: 0.33, z: 0.3, rz: 0 }, cup: { lid: 1 } }], [3.0, { th: { swirl: 0.8, T: 19.2 } }], [0.4, { th: { swirl: 0 } }], [0.4, { n1: { vis: 1, lab: 'lowest T = 19.2 °C' } }]] },
    { t: 'Weigh the emptied bottle', d: '~Weigh~ the emptied weighing bottle and record its mass. Mass used = difference.', why: 'Weighing by difference accounts for any solid left clinging to the bottle.', cam: [1.9, 1.9, 3.6, 1.6, 0.5, 0.3],
      ph: [[0.3, { n1: { vis: 0 } }], [1.0, { bal: { rd: 17.27 } }], [0.4, { n1: { vis: 1, x: 1.6, y: 1.4, z: 0.3, lab: 'mass used = 5.21 g' } }]] },
    { t: 'Repeat and calculate', d: '~Repeat~ steps 1–4. Calculate ΔH for each experiment and take the «average» of the two values.', cam: [0, 3.0, 8.0, 0, 1.2, 0], ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'table', h: 'Table of results', head: ['Measurement', ''], rows: [['Mass of weighing bottle and solid $NH4Cl$ / g', ''], ['Mass of emptied weighing bottle / g', ''], ['Mass of solid $NH4Cl$ used / g', 'm<sub>A</sub>'], ['Lowest temperature reached / °C', ''], ['Initial temperature / °C', ''], ['Change in temperature / °C', '−T']] },
        { k: 'calc', h: 'ΔH of solution', l: ['Assume c = 4.18 J g⁻¹ K⁻¹ and no heat absorbed from the surroundings', 'q = 50.0 × 4.18 × (−T) = −209T J', 'n($NH4Cl$) = m<sub>A</sub> / 53.5 mol', 'ΔH<sub>soln</sub> = −q / n = −(−209T)(53.5) / m<sub>A</sub> = <b>+11181.5T / m<sub>A</sub> J mol⁻¹</b>', 'Endothermic: temperature falls, so ΔH is positive.'] }] }
  ]
});
EX.push({
  id: 'en-tt', topic: 6, tag: 'T–t', name: 'Temperature–time method',
  q: 'Correcting for heat lost to (or gained from) the surroundings: record temperature over time, add the reagent at t = 3.0 min, then extrapolate back.',
  tamp: { T: 'Energetics: continuous temperature readings.', A: 'Heat loss makes the highest reading too low.', M: 'Temperature every 0.5 min; time of mixing.', P: '≥ 3 readings before mixing → add at 3.0 min → ≥ 5 readings after the max → plot and extrapolate.' },
  cam: [0, 2.8, 7.0, 0, 1.1, 0],
  actors: [
    ['mc', 'mcyl', { x: -2.0, z: 0.3, s: 0.8, lv: 0.6, lab: 'reagent B' }],
    ['cup', 'cup', { x: -0.4, lv: 0.35, lid: 1, lab: 'Styrofoam cup · reagent A' }],
    ['th', 'thermo', { x: -0.32, y: 0.12, len: 2.0, min: 0, max: 50, T: 25.0, lab: 'thermometer' }],
    ['w', 'watch', { x: 1.5, z: 0.4, lab: 'stopwatch' }]
  ],
  steps: [
    { t: 'Readings before mixing', d: '~Monitor~ the temperature of the solution at regular intervals, e.g. every «0.5 min». Take at least «3 readings» (including the initial one) before adding the other reagent.', cam: [0.4, 2.2, 5.0, 0.4, 1.0, 0.2],
      ph: [[3.0, { w: { rd: 150 } }]], dg: [{ k: 'table', h: 'Record', head: ['Time / min', 'Temperature / °C'], rows: [['0.0', ''], ['0.5', ''], ['1.0', ''], ['1.5', ''], ['2.0', ''], ['2.5', ''], ['3.0 (add reagent)', '—'], ['3.5', ''], ['4.0', ''], ['…', '']] }] },
    { t: 'Add the reagent at 3.0 min', d: 'At a suitable time (e.g. «t = 3.0 min»), ~add~ the other reagent and keep taking readings every 0.5 min.', cam: [-0.8, 2.4, 5.2, -0.8, 1.0, 0.2],
      ph: [[0.6, { w: { rd: 180 }, cup: { lid: 0 } }], [0.9, { mc: P('mcyl', 0.8, -0.5, 1.15, 0) }], [0.3, { mc: { pour: 1, py: 0.4 } }], [1.2, { mc: { lv: 0.05 }, cup: { lv: 0.6 } }], [0.3, { mc: { pour: 0 } }], [0.8, { mc: { x: -2.0, y: 0, z: 0.3, rz: 0 }, cup: { lid: 1 } }]] },
    { t: 'Readings after mixing', d: 'Take at least «5 readings after» the highest (or lowest) temperature is reached, so the cooling line can be plotted reliably. A ‹stopwatch› is needed.', cam: [0.4, 2.2, 5.0, 0.4, 1.0, 0.2],
      ph: [[2.2, { th: { T: 31.2, swirl: 0.6 }, w: { rd: 240 } }], [3.4, { th: { T: 30.2, swirl: 0 }, w: { rd: 420 } }]] },
    { t: 'Plot and extrapolate', d: '~Plot~ temperature against time. Draw two best-fit lines: one before mixing, one for the cooling (or warming) after the reaction. ~Extrapolate~ both to «t = 3.0 min»; the gap is ΔT.', dg: [{ k: 'graph', g: 'ttExo' }, { k: 'graph', g: 'ttEndo' }] }
  ]
});
EX.push({
  id: 'en-we7', topic: 6, tag: 'WE7', name: 'Thermometric titration',
  q: 'Neutralisation is exothermic: as $H2SO4$ is added to $NaOH$ in a Styrofoam cup, the temperature rises until the end-point, then falls. 2$NaOH$ + $H2SO4$ → $Na2SO4$ + 2$H2O$. Plan to find [$H2SO4$] precisely. Provided: FA 1 2.00 mol dm⁻³ $NaOH$, FA 2 ≈ 0.75 mol dm⁻³ $H2SO4$, burette, Styrofoam cup, thermometer, graph paper.',
  tamp: { T: 'Energetics: thermometric titration.', A: 'Burette clue: add FA 2 in portions; end-point is where the temperature peaks.', M: 'Volume of FA 2 added; highest temperature after each portion.', P: 'Pipette FA 1 → initial T → add 3.00 cm³ portions → highest T each time → graph.' },
  cam: [0.6, 3.6, 8.6, 0.2, 1.8, 0],
  actors: [
    ['fa1', 'beaker', { x: -2.3, z: 0.8, lv: 0.6, lab: 'FA 1 · 2.00 mol dm⁻³ NaOH' }],
    ['pip', 'pipette', { x: -2.3, y: 0.15, z: 0.8, vis: 0, lab: '25.0 cm³ pipette' }],
    ['bur', 'burette', { x: 0.2, dripY: 0.5, lab: '50.00 cm³ burette' }],
    ['cup', 'cup', { x: 0.2, lab: 'Styrofoam cup in 250 cm³ beaker' }],
    ['th', 'thermo', { x: 0.35, y: 0.12, z: 0.1, len: 2.0, min: 0, max: 50, T: 25.0, vis: 0, lab: 'thermometer' }],
    ['n1', 'note', { x: 1.5, y: 2.4, z: 0.4, vis: 0 }]
  ],
  steps: [
    { t: '(a) Estimate the end-point', d: '~Estimate~ the volume of ≈ 0.75 mol dm⁻³ $H2SO4$ needed to neutralise «25.0 cm³ of 2.00 mol dm⁻³ $NaOH$», so you know how far past it to go.',
      dg: [{ k: 'calc', h: 'Expected end-point', l: ['n($NaOH$) = 25.0 × 10⁻³ × 2.00 = 5.00 × 10⁻² mol', 'n($H2SO4$) = ½ × 5.00 × 10⁻² = 2.50 × 10⁻² mol', 'V($H2SO4$) = 2.50 × 10⁻² / 0.75 × 1000 = <b>33.3 cm³</b>', 'So take 5 more readings past 33.3 cm³ → add up to 48.00 cm³.'] }] },
    { t: 'Fill the burette with FA 2', d: '~Fill~ a ‹50.00 cm³ burette› with «FA 2».', cam: [1.8, 3.6, 6.0, 0.2, 3.2, 0], ph: [[0.4, { bur: { fun: 1 } }], [2.0, { bur: { rd: 0 } }], [0.3, { bur: { fun: 0, lab: 'burette · FA 2 (H₂SO₄)' } }]] },
    { t: 'Pipette FA 1 into the cup', d: '~Pipette~ «25.0 cm³ of FA 1» into the clean and dry ‹Styrofoam cup› supported in a ‹250 cm³ beaker›.', cam: [-0.8, 2.8, 6.0, -1.0, 1.2, 0.4],
      ph: [[0.4, { pip: { vis: 1 } }], [1.1, { pip: { lv: 1 }, fa1: { lv: 0.45 } }], [1.2, { pip: { x: 0.0, y: 0.45, z: 0.2 } }], [1.4, { pip: { lv: 0, drip: 1 }, cup: { lv: 0.22 } }], [0.3, { pip: { drip: 0, vis: 0 } }]] },
    { t: 'Steady initial temperature', d: 'Use a ‹thermometer› to measure the «steady initial temperature» of FA 1. Record it as T<sub>i</sub>.', cam: [0.9, 2.2, 4.0, 0.3, 1.2, 0], ph: [[0.6, { th: { vis: 1 } }], [0.3, { n1: { vis: 1, lab: 'Tᵢ = 25.0 °C' } }]] },
    { t: 'Add 3.00 cm³; highest T', d: '~Run~ «3.00 cm³ of FA 2» into the cup. ~Stir~ and record the «highest temperature» observed.', cam: [1.4, 2.6, 4.6, 0.3, 1.4, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.2, { bur: { drip: 1, rd: 3.0 }, cup: { lv: 0.25 } }], [0.3, { bur: { drip: 0 } }], [1.2, { th: { T: 26.05, swirl: 0.6 } }], [0.3, { th: { swirl: 0 } }], [0.3, { n1: { vis: 1, lab: '3.00 cm³ → 26.1 °C' } }]] },
    { t: 'Repeat to 48.00 cm³', d: 'Immediately ~add~ another «3.00 cm³» and repeat the measurement, until a total of «48.00 cm³» of FA 2 has been added.', why: 'The end-point is expected at 33.3 cm³, so going to 48.00 cm³ gives 5 readings after it for a reliable best-fit line.', cam: [1.4, 2.6, 4.6, 0.3, 1.4, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [4.0, { bur: { drip: 1, rd: 33.0 }, cup: { lv: 0.4 }, th: { T: 36.6, swirl: 0.6 } }], [0.6, { n1: { vis: 1, lab: 'peak near 33 cm³' } }], [2.6, { bur: { rd: 48.0 }, cup: { lv: 0.5 }, th: { T: 34.6 } }], [0.3, { bur: { drip: 0 }, th: { swirl: 0 }, n1: { lab: 'temperature falls after the end-point' } }]],
      dg: [{ k: 'table', h: 'Results (record every 3.00 cm³)', head: ['Volume of FA 2 / cm³', 'Highest temperature / °C', 'ΔT / °C'], rows: [['0.00', '', '0.0'], ['3.00', '', ''], ['6.00 … 30.00', '', ''], ['33.00', '', ''], ['36.00 … 48.00', '', '']] }] },
    { t: '(c) Sketch the graph', d: '~Plot~ ΔT against volume of FA 2. Draw two best-fit lines; they intersect at the end-point, «V<sub>eq</sub>».', ph: [[0.3, { n1: { vis: 0 } }]], dg: [{ k: 'graph', g: 'thermoTitr' }] },
    { t: '(d) Calculate [H₂SO₄]', d: 'Use V<sub>eq</sub> from the graph.', cam: [0.6, 3.6, 8.6, 0.2, 1.8, 0],
      dg: [{ k: 'calc', h: 'Concentration and ΔH', l: ['n($H2SO4$) = ½ × 5.00 × 10⁻² = 2.50 × 10⁻² mol', '[$H2SO4$] = 2.50 × 10⁻² / (V<sub>eq</sub> × 10⁻³) = <b>25 / V<sub>eq</sub> mol dm⁻³</b>', 'Heat released by neutralisation = heat gained by solution', 'ΔH<sub>neut</sub> = −(V<sub>A</sub> + V<sub>B</sub>) × ρ × c × ΔT / n($H2O$)'] }] }
  ]
});
EX.push({
  id: 'en-we8', topic: 6, tag: 'WE8', name: 'Varying volumes, total 110 cm³',
  q: 'Find [$H2SO4$] and ΔH<sub>neut</sub> graphically by mixing different volumes of $H2SO4$ (FA 1, ≈ 1.0 mol dm⁻³) and $NaOH$ (FA 2, 2.0 mol dm⁻³), keeping the total volume at 110 cm³. Provided: Styrofoam cup, thermometer, usual equipment.',
  tamp: { T: 'Energetics: mix different volumes of two reagents.', A: 'Total volume kept at 110 cm³ (clue). Measuring cylinders.', M: 'Volumes of FA 1 and FA 2; initial and highest temperature.', P: 'FA 1 in cup → initial T → add FA 2 (same initial T) → highest T → clean → repeat with new volumes.' },
  cam: [-0.8, 2.8, 7.2, -0.8, 1.1, 0],
  actors: [
    ['mcA', 'mcyl', { x: -2.9, z: -0.2, lv: 0.9, lab: '100 cm³ cylinder · FA 1 (H₂SO₄)' }],
    ['mcB', 'mcyl', { x: -1.8, z: 0.4, lv: 0, lab: '100 cm³ cylinder · FA 2 (NaOH)' }],
    ['cup', 'cup', { x: 0.4, lab: 'Styrofoam cup in 250 cm³ beaker' }],
    ['th', 'thermo', { x: 0.5, y: 0.12, len: 2.0, min: 0, max: 50, T: 25.0, vis: 0, lab: 'thermometer' }],
    ['n1', 'note', { x: 0.4, y: 2.6, vis: 0 }]
  ],
  steps: [
    { t: 'Pre-calculation: find V<sub>eq</sub>', d: 'Let V<sub>eq</sub> be the volume of $H2SO4$ at the stoichiometric point, so (110 − V<sub>eq</sub>) is the volume of $NaOH$. Use the approximate concentration to find it.',
      dg: [{ k: 'calc', h: 'Expected V<sub>eq</sub>', l: ['$NaOH$ : $H2SO4$ = 2 : 1, so n($NaOH$) = 2 × n($H2SO4$)', '(110 − V<sub>eq</sub>)/1000 × 2.00 = 2 × V<sub>eq</sub>/1000 × 1.0', 'V<sub>eq</sub> = <b>55.0 cm³</b>, and 110 − V<sub>eq</sub> = 55.0 cm³', 'Plan at least 5 runs before AND after 55.0 cm³.'] }] },
    { t: 'FA 1 into the cup', d: 'Using a ‹100 cm³ measuring cylinder›, ~transfer~ «10.0 cm³ of FA 1» into a clean and dry ‹Styrofoam cup› supported in a ‹250 cm³ beaker›.', cam: [-0.8, 2.4, 5.6, -0.6, 1.0, 0],
      ph: [[1.0, { mcA: X(P('mcyl', 1, 0.3, 1.15, 0)) }], [0.3, { mcA: { pour: 1, py: 0.3 } }], [0.7, { mcA: { lv: 0.81 }, cup: { lv: 0.06 } }], [0.3, { mcA: { pour: 0 } }], [0.9, { mcA: { x: -2.9, y: 0, z: -0.2, rz: 0 } }]] },
    { t: 'Steady initial temperature', d: 'Use the ‹thermometer› to measure and record the «steady initial temperature» of FA 1.', cam: [0.9, 2.0, 3.8, 0.45, 1.1, 0], ph: [[0.5, { th: { vis: 1 } }], [0.3, { n1: { vis: 1, lab: 'initial T = 25.0 °C' } }]] },
    { t: 'Measure FA 2 at the same T', d: 'Using another ‹100 cm³ measuring cylinder›, ~measure~ «100.0 cm³ of FA 2». Ensure FA 1 and FA 2 have the «same initial temperature».', cam: [-1.4, 2.2, 4.6, -1.6, 1.0, 0.3], ph: [[0.3, { n1: { vis: 0 } }], [1.4, { mcB: { lv: 0.9 } }]] },
    { t: 'Mix; highest temperature', d: '~Add~ FA 2 to FA 1. Use the thermometer to ~stir~ gently. Measure and record the «highest temperature» of the mixture.', cam: [-0.4, 2.4, 5.4, -0.4, 1.1, 0],
      ph: [[1.0, { mcB: P('mcyl', 1, 0.3, 1.15, 0) }], [0.3, { mcB: { pour: 1, py: 0.3 } }], [1.4, { mcB: { lv: 0 }, cup: { lv: 0.62 } }], [0.3, { mcB: { pour: 0 } }], [0.9, { mcB: { x: -1.8, y: 0, z: 0.4, rz: 0 } }], [1.6, { th: { T: 27.5, swirl: 0.6 } }], [0.3, { th: { swirl: 0 }, n1: { vis: 1, lab: 'Expt 1: 10.0 + 100.0 → 27.5 °C' } }]] },
    { t: 'Empty, wash, dry the cup', d: '~Empty~, ~wash~ and carefully ~dry~ the Styrofoam cup before the next run.', why: 'Leftover solution or water would change the volumes and the heat capacity of the next mixture.', cam: [0.4, 2.2, 5.0, 0.4, 1.0, 0],
      ph: [[0.3, { n1: { vis: 0 }, th: { vis: 0, T: 25.0 } }], [1.4, { cup: { lv: 0 } }]] },
    { t: 'Repeat with new volumes', d: '~Repeat~ steps 1–5 with the volumes in the table, so that the total volume of the mixture is always «110 cm³». Record every measurement.', cam: [-0.4, 2.4, 5.4, -0.4, 1.1, 0],
      ph: [[0.4, { mcA: { lv: 0.9 } }], [1.0, { mcA: P('mcyl', 1, 0.3, 1.15, 0) }], [0.3, { mcA: { pour: 1, py: 0.3 } }], [0.9, { mcA: { lv: 0.36 }, cup: { lv: 0.33 } }], [0.3, { mcA: { pour: 0 } }], [0.8, { mcA: { x: -2.9, y: 0, z: -0.2, rz: 0 }, th: { vis: 1 } }], [0.8, { mcB: { lv: 0.45 } }], [1.0, { mcB: P('mcyl', 1, 0.3, 1.15, 0) }], [0.3, { mcB: { pour: 1, py: 0.3 } }], [1.0, { mcB: { lv: 0 }, cup: { lv: 0.62 } }], [0.3, { mcB: { pour: 0 } }], [0.8, { mcB: { x: -1.8, y: 0, z: 0.4, rz: 0 } }], [1.6, { th: { T: 37.5, swirl: 0.6 } }], [0.3, { th: { swirl: 0 }, n1: { vis: 1, lab: 'Expt 6: 60.0 + 50.0 → 37.5 °C' } }]],
      dg: [{ k: 'table', h: 'Volumes (total 110 cm³)', head: ['Expt', 'FA 1 / cm³', 'FA 2 / cm³', 'Initial T / °C', 'Highest T / °C', 'ΔT / °C'], rows: [['1', '10.0', '100.0', '', '', ''], ['2', '20.0', '90.0', '', '', ''], ['3', '30.0', '80.0', '', '', ''], ['4', '40.0', '70.0', '', '', ''], ['5', '50.0', '60.0', '', '', ''], ['6', '60.0', '50.0', '', '', ''], ['7', '70.0', '40.0', '', '', ''], ['8', '80.0', '30.0', '', '', ''], ['9', '90.0', '20.0', '', '', ''], ['10', '100.0', '10.0', '', '', '']], cap: 'Expts 1–5: at least 5 readings before V<sub>eq</sub> = 55.0 cm³; expts 6–10: at least 5 after.' }] },
    { t: 'Graph and calculations', d: '~Plot~ ΔT against volume of FA 1. The two best-fit lines meet at V<sub>eq</sub> and ΔT<sub>eq</sub>.', ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'graph', g: 'mixVol' }, { k: 'calc', h: 'From the graph', l: ['At V<sub>eq</sub>: n($NaOH$) = (110 − V<sub>eq</sub>)/1000 × 2.0 = n($H2O$)', 'n($H2SO4$) = ½ × n($NaOH$)', '[$H2SO4$] = ½ n($NaOH$) / (V<sub>eq</sub> × 10⁻³) mol dm⁻³', 'q = 110 × c × ΔT<sub>eq</sub> J (no heat loss assumed)', 'ΔH<sub>neut</sub> = −110 × c × ΔT<sub>eq</sub> / (n($H2O$) × 10³) kJ mol⁻¹'] }, { k: 'list', h: '(d) Could Ba(OH)₂ be used?', items: ['No. $Ba^2+$ reacts with $SO4^2-$ to form a $BaSO4$ precipitate; its enthalpy change of precipitation interferes with the temperature readings.'] }] }
  ]
});
EX.push({
  id: 'en-we9', topic: 6, tag: 'WE9', name: 'ΔH<sub>c</sub> via Hess’ law',
  q: '5-decyne is partially hydrogenated to cis-dec-5-ene (Lindlar catalyst). ΔH<sub>1</sub> cannot be measured directly. Given ΔH<sub>c</sub>(H₂) = −286 kJ mol⁻¹, plan to find one of the enthalpy changes needed. Provided: 5-decyne, cis-dec-5-ene, metal calorimeter, spirit lamp, thermometer.',
  tamp: { T: 'Energetics: enthalpy change of combustion.', A: 'Hess’ law with ΔH<sub>c</sub> data; metal calorimeter + spirit lamp.', M: 'Mass of lamp + fuel before and after; water temperature before and after.', P: 'Water in calorimeter → initial T → weigh lamp → burn until ΔT ≈ 5–10 °C → final T → reweigh.' },
  cam: [0.4, 3.2, 8.6, 0.2, 1.4, 0],
  actors: [
    ['shield', 'shield', { x: 0, lab: 'wind shield' }],
    ['st', 'stand', { x: -2.1, h: 4.2, c: [{ y: 3.0, x: 2.2, w: 0.07 }], lab: 'retort stand' }],
    ['trip', 'tripod', { x: 0, gauze: true, lab: 'tripod + wire gauze' }],
    ['cal', 'calor', { x: 0, y: 1.15, lab: 'metal calorimeter' }],
    ['th', 'thermo', { x: 0.1, y: 1.22, len: 2.2, min: 0, max: 60, T: 24.5, vis: 0, lab: 'thermometer' }],
    ['lamp', 'lamp', { x: 2.0, z: 1.1, lv: 0.15, cap: 1, lab: 'spirit lamp' }],
    ['bal', 'balance', { x: 3.3, z: 0.5, lab: 'balance' }],
    ['mc', 'mcyl', { x: -2.7, z: 0.9, lv: 0.9, lab: '100 cm³ measuring cylinder · water' }],
    ['n1', 'note', { x: 0.2, y: 3.8, vis: 0 }]
  ],
  steps: [
    { t: '(a) Hess’ law cycle', d: 'Combustion data link the two compounds. The enthalpy changes needed are «ΔH<sub>c</sub>(5-decyne)» and «ΔH<sub>c</sub>(cis-dec-5-ene)».', dg: [{ k: 'graph', g: 'hess' }, { k: 'calc', h: 'By Hess’ law', l: ['ΔH<sub>1</sub> = [ΔH<sub>c</sub>(5-decyne) + (−286)] − ΔH<sub>c</sub>(cis-dec-5-ene)', 'or ΔH<sub>r</sub> = ΣΔH<sub>c</sub>(reactants) − ΣΔH<sub>c</sub>(products)'] }] },
    { t: 'Water into the calorimeter', d: 'Using a ‹100 cm³ measuring cylinder›, ~place~ «100 cm³ of water» in the ‹metal calorimeter›.', cam: [-0.8, 2.8, 5.6, -0.8, 1.6, 0.3],
      ph: [[1.1, { mc: P('mcyl', 1, -0.15, 2.15, 0) }], [0.3, { mc: { pour: 1, py: 1.5 } }], [1.6, { mc: { lv: 0.05 }, cal: { lv: 0.8 } }], [0.3, { mc: { pour: 0 } }], [0.9, { mc: { x: -2.7, y: 0, z: 0.9, rz: 0 } }]] },
    { t: 'Initial temperature → C', d: 'Using a ‹thermometer›, ~measure~ and record the «steady initial temperature» of the water.', cam: [0.8, 2.6, 4.2, 0.1, 2.0, 0], ph: [[0.5, { th: { vis: 1 } }], [0.3, { n1: { vis: 1, lab: 'C = 24.5 °C' } }]] },
    { t: 'Fill the spirit lamp', d: '~Add~ «5-decyne» (or cis-dec-5-ene) to the ‹spirit lamp›.', cam: [2.4, 1.8, 3.8, 2.2, 0.5, 0.9], ph: [[0.3, { n1: { vis: 0 } }], [0.4, { lamp: { cap: 0 } }], [1.2, { lamp: { lv: 0.6 } }], [0.3, { lamp: { cap: 1 } }]] },
    { t: 'Weigh lamp + fuel → A', d: '~Weigh~ and record the total mass of the spirit lamp and fuel.', cam: [3.4, 1.9, 3.6, 3.2, 0.6, 0.5], ph: [[1.0, { lamp: { x: 3.3, y: 0.33, z: 0.5 } }], [0.8, { bal: { rd: 68.42 } }], [0.3, { n1: { vis: 1, x: 3.3, y: 1.6, z: 0.5, lab: 'A = 68.42 g' } }]] },
    { t: 'Place the lamp under the calorimeter', d: '~Place~ the spirit lamp under the calorimeter as in the set-up: calorimeter on a ‹tripod› and ‹wire gauze›, thermometer clamped to a ‹retort stand› and immersed in the water, all inside a ‹wind shield›.', cam: [0.4, 3.2, 8.6, 0.2, 1.4, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.4, { lamp: { x: 0, y: 0, z: 0 }, bal: { rd: 0 } }]] },
    { t: 'Burn until T rises 5–10 °C → D', d: '~Light~ the wick. When the water temperature has risen by about «5–10 °C» (e.g. 7 °C), ~extinguish~ the flame and record the «final temperature».', why: 'A 5–10 °C rise is large enough to measure, but small enough to limit heat loss.', cam: [1.0, 2.0, 4.6, 0.1, 1.4, 0],
      ph: [[0.4, { lamp: { cap: 0 } }], [0.6, { lamp: { fl: 1 } }], [4.0, { th: { T: 31.5 }, lamp: { lv: 0.55 } }], [0.4, { lamp: { cap: 1, fl: 0 } }], [0.3, { n1: { vis: 1, lab: 'D = 31.5 °C (ΔT = 7.0 °C)' } }]] },
    { t: 'Cool and reweigh → B', d: 'Allow the spirit lamp to cool sufficiently, then ~reweigh~ the lamp and remaining fuel. Record the new total mass.', why: 'Keep the cap on: volatile fuel evaporates fast, especially right after the flame is put out.', cam: [3.4, 1.9, 3.6, 3.2, 0.6, 0.5],
      ph: [[0.3, { n1: { vis: 0 } }], [1.4, { lamp: { x: 3.3, y: 0.33, z: 0.5 } }], [0.8, { bal: { rd: 68.21 } }], [0.3, { n1: { vis: 1, x: 3.3, y: 1.6, z: 0.5, lab: 'B = 68.21 g' } }]],
      dg: [{ k: 'table', h: 'Measurements', head: ['Measurement', 'Label'], rows: [['Mass of spirit lamp + fuel before combustion / g', 'A'], ['Mass of spirit lamp + fuel after combustion / g', 'B'], ['Temperature of water before combustion / °C', 'C'], ['Temperature of water after combustion / °C', 'D']] }] },
    { t: '(c) Calculate ΔH<sub>c</sub>', d: 'Assume density of water 1.0 g cm⁻³ and c = 4.18 J g⁻¹ K⁻¹, with no heat lost.', ph: [[0.3, { n1: { vis: 0 } }]], cam: [0.4, 3.2, 8.6, 0.2, 1.4, 0],
      dg: [{ k: 'calc', h: 'Enthalpy change of combustion', l: ['Mass of fuel burnt = (A − B) g', 'n(fuel) = (A − B) / M<sub>r</sub> = E mol', 'ΔT = (D − C) K; mass of water = m g (100 g here)', 'q = m × 4.18 × (D − C) J', 'ΔH<sub>c</sub> = <b>−4.18m(D − C) / (E × 10³) kJ mol⁻¹</b>'] }] },
    { t: '(d) Errors and improvements', d: 'Two sources of error that affect accuracy, and how to fix them.',
      dg: [{ k: 'table', h: 'Errors and improvements', head: ['Possible error', 'Improvement'], rows: [['Incomplete combustion of fuel.', 'Increase oxygen around the flame (e.g. a beaker of $H2O2$ with a little $MnO2$ beside the set-up).'], ['Fuel lost by evaporation, especially just after the flame is extinguished.', 'Cover the wick with a cap when not in use.'], ['Heat lost from the flame due to draughts.', 'Use a wind shield.'], ['A thermometer with 1 °C divisions for a 5–10 °C change.', 'Use a 0.1 °C thermometer, or a thermocouple / data logger.'], ['Slow thermometer response → maximum reading too low.', 'Smaller bulb, or a temperature probe.'], ['Heat capacity of the calorimeter ignored.', 'Calibrate with a fuel of known ΔH<sub>c</sub> (e.g. hexane).']] }] },
    { t: 'Calibrating the calorimeter', d: 'Burn «hexane» (ΔH<sub>c</sub> = −4163 kJ mol⁻¹) in the same set-up to find the heat capacity C of calorimeter + water. Then reuse C for each fuel.',
      dg: [{ k: 'calc', h: 'Heat capacity C', l: ['Mass of hexane burnt = (P − Q) g; n = (P − Q) / M<sub>r</sub> = R mol', 'Heat released = 4163 × 10³ × R J', '4163 × 10³ × R = C(T<sub>f</sub> − T<sub>i</sub>)', 'C = <b>4163 × 10³ × R / (T<sub>f</sub> − T<sub>i</sub>) J K⁻¹</b>', 'For each fuel: q = CΔT; ΔH<sub>c</sub> = −CΔT / n'] }] }
  ]
});

/* ============ 7 · KINETICS ============ */
EX.push({
  id: 'kin-we10', topic: 7, tag: 'WE10', name: 'Iodine clock: order w.r.t. S₂O₈²⁻',
  q: '$S2O8^2-$ + 2$I^-$ → $I2$ + 2$SO4^2-$ (I); $I2$ + 2$S2O3^2-$ → 2$I^-$ + $S4O6^2-$ (II). A small constant amount of $S2O3^2-$ removes $I2$ until it runs out; then $I2$ turns starch blue-black. Plan a series of experiments to find the order with respect to $S2O8^2-$ by the clock method. Expt 1: 5 cm³ KI, 5 cm³ $Na2S2O3$, 40 cm³ water, 10 cm³ $Na2S2O8$.',
  tamp: { T: 'Kinetics: clock reaction.', A: 'Vary V($S2O8^2-$) to vary its concentration; water keeps V<sub>total</sub> constant. Don’t mix $I^-$ and $S2O8^2-$ early.', M: 'Volumes of each reagent; time t for blue-black.', P: 'KI + thiosulfate + water + starch → add $S2O8^2-$ last and start stopwatch → time → repeat ×5.' },
  cam: [-0.6, 2.8, 7.2, -0.6, 1.0, 0],
  actors: [
    ['tile', 'tile', { x: 0.2, lab: 'white tile' }],
    ['bk', 'beaker', { x: 0.2, y: 0.03, s: 0.75, lab: '100 cm³ beaker' }],
    ['mcKI', 'mcyl', { x: -2.9, z: 0.5, s: 0.55, lv: 0.5, lab: 'KI' }],
    ['mcTS', 'mcyl', { x: -2.4, z: 0.9, s: 0.55, lv: 0.5, lab: 'Na₂S₂O₃' }],
    ['mcW', 'mcyl', { x: -1.7, z: -0.3, s: 0.85, lv: 0.8, lab: 'water · 50 cm³ cylinder' }],
    ['mcPS', 'mcyl', { x: -1.0, z: 0.9, s: 0.55, lv: 1.0, lab: 'Na₂S₂O₈ · 10 cm³ cylinder' }],
    ['drp', 'dropper', { x: 0.2, y: 1.05, vis: 0, dripY: 0.3, lab: 'starch' }],
    ['w', 'watch', { x: 1.6, z: 0.4, lab: 'stopwatch' }],
    ['towel', 'box', { x: 2.7, z: 0.2, w: 1.0, h: 0.012, dd: 0.9, col: '#f2efe6', vis: 0, lab: 'paper towel' }],
    ['n1', 'note', { x: 0.2, y: 1.9, vis: 0 }]
  ],
  steps: [
    { t: '(a) Plan the volumes', d: 'Only V($S2O8^2-$) changes. Water makes up the difference so the «total volume stays 60 cm³»; then V($S2O8^2-$) ∝ [$S2O8^2-$].', dg: [{ k: 'table', h: 'Volumes of reagents', head: ['Expt', 'KI / cm³', '$Na2S2O3$ / cm³', '$H2O$ / cm³', '$Na2S2O8$, V / cm³'], rows: [['1', '5', '5', '40', '10'], ['2', '5', '5', '30', '20'], ['3', '5', '5', '20', '30'], ['4', '5', '5', '10', '40'], ['5', '5', '5', '0', '50']] }] },
    { t: 'KI and thiosulfate', d: 'Using a ‹10 cm³ measuring cylinder›, ~add~ «5 cm³ of KI» and «5 cm³ of $Na2S2O3$» to a ‹100 cm³ beaker›.', cam: [-0.8, 2.2, 4.6, -0.6, 0.7, 0.3],
      ph: [[0.9, { mcKI: P('mcyl', 0.55, 0.12, 0.98, 0) }], [0.3, { mcKI: { pour: 1, py: 0.2 } }], [0.8, { mcKI: { lv: 0.02 }, bk: { lv: 0.08 } }], [0.2, { mcKI: { pour: 0 } }], [0.7, { mcKI: { x: -2.9, y: 0, z: 0.5, rz: 0 } }], [0.9, { mcTS: P('mcyl', 0.55, 0.12, 0.98, 0) }], [0.3, { mcTS: { pour: 1, py: 0.2 } }], [0.8, { mcTS: { lv: 0.02 }, bk: { lv: 0.15 } }], [0.2, { mcTS: { pour: 0 } }], [0.7, { mcTS: { x: -2.4, y: 0, z: 0.9, rz: 0 } }]] },
    { t: 'Water and starch', d: 'Using a ‹50 cm³ measuring cylinder›, ~add~ «40 cm³ of distilled water» and «5 drops of starch» solution to the same beaker.', cam: [-0.8, 2.2, 4.6, -0.6, 0.7, 0.3],
      ph: [[0.9, { mcW: P('mcyl', 0.85, 0.12, 1.0, 0) }], [0.3, { mcW: { pour: 1, py: 0.25 } }], [1.2, { mcW: { lv: 0.05 }, bk: { lv: 0.6 } }], [0.2, { mcW: { pour: 0 } }], [0.8, { mcW: { x: -1.7, y: 0, z: -0.3, rz: 0 } }], [0.4, { drp: { vis: 1 } }], [0.9, { drp: { drip: 0.7 } }], [0.3, { drp: { drip: 0, vis: 0 } }]] },
    { t: 'Mix; place on the white tile', d: '~Mix~ the contents by swirling the beaker, and place it on a ‹white tile›.', why: 'The white tile makes the sudden blue-black colour easy to spot.', cam: [0.4, 1.8, 3.6, 0.2, 0.5, 0.2], ph: [[1.6, { bk: { swirl: 1 } }], [0.3, { bk: { swirl: 0 } }]] },
    { t: 'Add S₂O₈²⁻; start the stopwatch', d: 'At an appropriate time, ~transfer~ «10 cm³ of $Na2S2O8$» from a ‹10 cm³ measuring cylinder› and ~start~ the stopwatch at the same time.', why: '$S2O8^2-$ goes in last: it starts reaction I, so the timing begins exactly when it is added.', cam: [0.0, 2.0, 4.6, 0.3, 0.7, 0.4],
      ph: [[0.9, { mcPS: P('mcyl', 0.55, 0.12, 0.98, 0) }], [0.3, { mcPS: { pour: 1, py: 0.25 } }], [0.8, { mcPS: { lv: 0.02 }, bk: { lv: 0.72 }, w: { rd: 0.6 } }], [0.2, { mcPS: { pour: 0 } }], [0.7, { mcPS: { x: -1.0, y: 0, z: 0.9, rz: 0 } }]] },
    { t: 'Time to blue-black', d: '~Record~ the time taken, «t», for the solution to turn «blue-black».', cam: [0.8, 1.8, 3.6, 0.8, 0.5, 0.2],
      ph: [[3.4, { w: { rd: 48.6 } }], [0.25, { bk: { col: C.bb } }], [0.3, { n1: { vis: 1, lab: 't = 48.6 s' } }]] },
    { t: 'Discard, wash, drain', d: '~Discard~ the reaction mixture and ~wash~ the beaker thoroughly with water. Stand it upside down on a paper towel to drain.', cam: [1.4, 2.0, 4.4, 1.4, 0.5, 0.2],
      ph: [[0.3, { n1: { vis: 0 } }], [0.6, { towel: { vis: 1 } }], [1.0, { bk: { lv: 0, col: C.w } }], [1.2, { bk: { x: 2.7, y: 0.75, z: 0.2, rz: Math.PI } }]] },
    { t: 'Repeat; analyse', d: '~Repeat~ steps 1–6 for Experiments 2–5 with the volumes in the table. Same amount of $I2$ forms each time the stopwatch stops, so «rate ∝ 1/t»; constant V<sub>total</sub> means «[$S2O8^2-$] ∝ V».', cam: [-0.6, 2.8, 7.2, -0.6, 1.0, 0], ph: [[1.2, { bk: { x: 0.2, y: 0.03, z: 0, rz: 0 }, towel: { vis: 0 } }]],
      dg: [{ k: 'table', h: 'Method 1: inspection (Expts 1 and 2)', head: ['When V doubles…', 'then', 'order'], rows: [['1/t is constant', 'rate does not change', '0'], ['1/t doubles', '1/t ∝ V → rate ∝ [$S2O8^2-$]', '1'], ['1/t × 4', '1/t ∝ V² → rate ∝ [$S2O8^2-$]²', '2']] }, { k: 'table', h: 'Method 2: Vⁿt', head: ['If this is constant…', 'order'], rows: [['t', '0'], ['Vt', '1'], ['V²t', '2']] }, { k: 'graph', g: 'clock' }] }
  ]
});
EX.push({
  id: 'kin-we11', topic: 7, tag: 'WE11', name: 'Sampling: order w.r.t. H₂O₂',
  q: '2$H2O2$(aq) → 2$H2O$(l) + $O2$(g), catalysed by $FeCl3$. The $H2O2$ remaining at any time is found by titration with acidified $KMnO4$. Provided: $H2O2$(aq), $FeCl3$(aq), cold dilute $H2SO4$, 0.02 mol dm⁻³ $KMnO4$, stopwatch. Plan a sampling, quenching and titration method.',
  tamp: { T: 'Kinetics: continuous method (sample, quench, titrate).', A: 'Cold dilute $H2SO4$ quenches (cools and dilutes) and acidifies for the $KMnO4$ titration.', M: 'Time of quenching; initial and final burette readings.', P: 'Start reaction → at set times take an aliquot → quench → titrate → plot V($KMnO4$) against t.' },
  cam: [-0.2, 3.4, 9.2, -0.2, 1.6, 0],
  actors: [
    ['mc100', 'mcyl', { x: -3.4, z: 0.4, lv: 0.9, lab: '100 cm³ cylinder · H₂O₂' }],
    ['mc10', 'mcyl', { x: -3.0, z: -0.6, s: 0.55, lv: 0.45, col: C.fe, lab: '10 cm³ cylinder · FeCl₃' }],
    ['cf1', 'conical', { x: -1.6, lab: 'reaction mixture' }],
    ['w', 'watch', { x: -0.2, z: -0.7, lab: 'stopwatch' }],
    ['mc50', 'mcyl', { x: 0.2, z: 1.0, s: 0.8, lv: 0, lab: '50 cm³ cylinder · cold dilute H₂SO₄' }],
    ['pip', 'pipette', { x: -1.6, y: 0.15, vis: 0, lab: '10.0 cm³ pipette' }],
    ['bur', 'burette', { x: 2.2, dripY: 0.45, lab: '50.00 cm³ burette' }],
    ['tile', 'tile', { x: 2.2 }],
    ['cf2', 'conical', { x: 2.2, y: 0.03, lab: 'second conical flask' }],
    ['n1', 'note', { x: 3.3, y: 2.0, z: 0.5, vis: 0 }]
  ],
  steps: [
    { t: 'Equation and quenching', d: 'Write the titration equation, and note why «cold dilute $H2SO4$» is used.', dg: [{ k: 'calc', h: '(a) H₂O₂ + KMnO₄', l: ['[O]: $H2O2$ → $O2$ + 2$H^+$ + 2e⁻', '[R]: $MnO4^-$ + 8$H^+$ + 5e⁻ → $Mn^2+$ + 4$H2O$', 'Overall: 2$MnO4^-$ + 6$H^+$ + 5$H2O2$ → 2$Mn^2+$ + 8$H2O$ + 5$O2$'] }, { k: 'list', h: '(b) Why cold dilute H₂SO₄?', items: ['Adding it dilutes and cools the mixture, greatly slowing the decomposition (quenching).', 'It also provides the acidic medium for the titration with $MnO4^-$.'] }] },
    { t: 'Fill the burette with KMnO₄', d: '~Fill~ a ‹burette› with the «$KMnO4$» solution provided.', cam: [3.6, 3.6, 6.2, 2.2, 3.2, 0], ph: [[0.4, { bur: { fun: 1, col: C.kmn } }], [2.0, { bur: { rd: 0 } }], [0.3, { bur: { fun: 0, lab: 'burette · 0.02 mol dm⁻³ KMnO₄' } }]] },
    { t: '100.0 cm³ of H₂O₂', d: 'Using a ‹100 cm³ measuring cylinder›, ~add~ «100.0 cm³ of $H2O2$» to a ‹250 cm³ conical flask› labelled «reaction mixture».', cam: [-2.0, 2.6, 5.6, -2.2, 1.0, 0.2],
      ph: [[1.0, { mc100: P('mcyl', 1, -1.7, 1.45, 0) }], [0.3, { mc100: { pour: 1, py: 0.35 } }], [1.6, { mc100: { lv: 0.05 }, cf1: { lv: 0.5 } }], [0.3, { mc100: { pour: 0 } }], [0.9, { mc100: { x: -3.4, y: 0, z: 0.4, rz: 0 } }]] },
    { t: 'Add FeCl₃; start the stopwatch', d: 'Using a ‹10 cm³ measuring cylinder›, ~add~ «2.0 cm³ of $FeCl3$» to the same flask. ~Start~ the stopwatch and swirl to mix.', why: '$FeCl3$ is a catalyst, so only a small volume is needed.', cam: [-2.0, 2.6, 5.6, -2.2, 1.0, 0.2],
      ph: [[1.0, { mc10: P('mcyl', 0.55, -1.7, 1.45, 0) }], [0.3, { mc10: { pour: 1, py: 0.5 } }], [0.6, { mc10: { lv: 0.05 }, cf1: { col: '#ecdfa2', lv: 0.52 } }], [0.2, { mc10: { pour: 0 } }], [0.8, { mc10: { x: -3.0, y: 0, z: -0.6, rz: 0 } }], [1.4, { cf1: { swirl: 1, fizz: 0.5 }, w: { rd: 15 } }], [0.3, { cf1: { swirl: 0 } }]] },
    { t: 'Measure cold dilute H₂SO₄', d: 'Using a ‹50 cm³ measuring cylinder›, ~measure~ «50.0 cm³ of cold, dilute $H2SO4$».', cam: [0.2, 2.2, 4.6, 0.2, 0.8, 0.8], ph: [[1.4, { mc50: { lv: 0.85 }, w: { rd: 45 } }]] },
    { t: 'Pipette a 10.0 cm³ aliquot', d: 'Using a ‹10.0 cm³ pipette›, ~transfer~ a «10.0 cm³ aliquot» of the reaction mixture to a second ‹250 cm³ conical flask›.', cam: [0.4, 2.8, 6.6, 0.4, 1.2, 0.5],
      ph: [[0.6, { cf2: { z: 1.0 } }], [0.4, { pip: { vis: 1 } }], [1.0, { pip: { lv: 1, col: '#ecdfa2' }, w: { rd: 90 } }], [1.3, { pip: { x: 2.2, y: 0.5, z: 1.0 } }], [1.2, { pip: { lv: 0, drip: 1 }, cf2: { lv: 0.06, col: '#ecdfa2' } }], [0.3, { pip: { drip: 0, vis: 0 } }]] },
    { t: 'Quench at t = 2 min', d: 'At «t = 2 min», ~transfer~ the «50.0 cm³ of cold dilute $H2SO4$» into the second conical flask and swirl.', cam: [1.4, 2.4, 5.0, 1.6, 1.0, 0.8],
      ph: [[0.6, { w: { rd: 120 } }], [1.0, { mc50: P('mcyl', 0.8, 2.08, 1.5, 1.0) }], [0.3, { mc50: { pour: 1, py: 0.3 } }], [1.4, { mc50: { lv: 0.04 }, cf2: { lv: 0.26, col: '#f1e9c4' } }], [0.3, { mc50: { pour: 0 } }], [0.9, { mc50: { x: 0.2, y: 0, z: 1.0, rz: 0 } }], [0.3, { n1: { vis: 1, lab: 'quenched at t = 2 min' } }]] },
    { t: 'Titrate immediately', d: 'Immediately ~titrate~ the $H2O2$ in the second flask against $KMnO4$. End-point: «yellow → orange / pale pink». Record the results.', why: 'Yellow comes from $Fe^3+$; at the end-point, very dilute pink $MnO4^-$ mixes with it to give orange. Only one titration is possible per aliquot.', cam: [3.4, 2.4, 4.8, 2.2, 1.4, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [0.8, { cf2: { z: 0 } }], [3.0, { bur: { drip: 1, rd: 17.6 }, cf2: { swirl: 1, lv: 0.32 } }], [1.0, { bur: { drip: 0.25, rd: 18.4 } }], [0.4, { bur: { drip: 0 }, cf2: { col: '#f2a77c', swirl: 0 } }], [0.3, { n1: { vis: 1, lab: 'end-point: yellow → orange / pale pink' } }]] },
    { t: 'Wash; repeat every 5 min', d: '~Wash~ out the second flask with water. ~Repeat~ steps 4–8 at «5-minute intervals».', cam: [-0.2, 3.4, 9.2, -0.2, 1.6, 0], ph: [[0.3, { n1: { vis: 0 } }], [1.0, { cf2: { lv: 0, col: C.w } }]],
      dg: [{ k: 'table', h: 'Results', head: ['t / min', '2', '7', '12', '17', '22', '27', '32', '37', '42'], rows: [['Final burette reading / cm³', '', '', '', '', '', '', '', '', ''], ['Initial burette reading / cm³', '', '', '', '', '', '', '', '', ''], ['V($KMnO4$) used / cm³', '', '', '', '', '', '', '', '', '']] }] },
    { t: 'Plot V(KMnO₄) against t', d: '~Plot~ the volume of $KMnO4$ used against time. Because each aliquot is the same 10.0 cm³, «V($KMnO4$) ∝ [$H2O2$] remaining».', dg: [{ k: 'graph', g: 'kmno4' }, { k: 'calc', h: 'Why V ∝ [H₂O₂]', l: ['$MnO4^-$ : $H2O2$ = 2 : 5', 'V($KMnO4$) × [$KMnO4$] = 2/5 × V(aliquot) × [$H2O2$]', 'V(aliquot) is constant (10.0 cm³), so V($KMnO4$) ∝ [$H2O2$]'] }] }
  ]
});
