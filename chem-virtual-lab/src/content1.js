/* Content · helpers + topics 1–4.
   Text markup: ~verb~  «quantity»  ‹apparatus›  $chem formula$ (digits → subscripts, ^2+ → superscript). */
const C = {
  w: '#cfe3f2', mo_y: '#f0c22e', mo_o: '#e8661c', tp_b: '#5d9fe6', tp_pb: '#a8cdf2', kmn: '#6a1b62', pink: '#f1b3cf',
  cu: '#2f72d0', cuw: '#efeee6', wh: '#f4f3ee', mno2: '#272727', fe: '#e4c04c', i2aq: '#d7a24c', i2dcm: '#7b3fa1', bb: '#18193b',
  pale_y: '#efe19c', ce: '#f1d77a', pb: '#aab1b8', molten: '#d9a85a', br2: '#9c4a1c', cuso4: '#3f86d6', meth: '#d8e8f2', cinn: '#f1e3b0',
  ether: '#eef0d6', aq: '#d5e6ef', oil: '#e9dc9a', asp: '#f6f5ef', cloudy: '#e6ebee'
};
const SP = { crL: [-0.33, 0.43], beaker: [0.4, 0.97], mcyl: [0.2, 1.72], conical: [0.16, 1.32], wb: [0.16, 0.33], cr: [0.33, 0.43], btube: [0.14, 1.51], cup: [0.35, 0.94], rbf: [0.11, 1.36], stube: [0.06, 0.38], vflask: [0.08, 1.92], calor: [0.39, 0.82] };
/* Position a vessel so its spout sits at (tx, ty, tz) while tilted by rz (default −1.25 rad, pouring to the right). */
function P(kind, s, tx, ty, tz, rz) {
  rz = rz == null ? -1.25 : rz; const sp = SP[kind]; const lx = sp[0] * s, ly = sp[1] * s; const c = Math.cos(rz), sn = Math.sin(rz);
  const o = { x: tx - (lx * c - ly * sn), y: ty - (lx * sn + ly * c), rz }; if (tz != null) o.z = tz; return o;
}
const X = (...objs) => Object.assign({}, ...objs);
const EX = [];
const TOPICS = [
  { n: 1, id: 'intro', name: 'Introduction', icon: 'notebook',
    sum: 'TAMP framework · parts of a written plan · variables · writing a procedural step · common apparatus',
    cheat: ['<b>TAMP</b>: Topic & Aim → Analyse clues → Measurements → Process.', 'A plan: aim, theory, pre-experimental calculations, procedure, results table, treatment of results, safety, reliability.', 'Independent variable is <b>changed</b>; dependent variable is <b>measured</b>; constant variables are <b>controlled</b>.', 'Every step = <b class="kv">verb</b> + <span class="kq">quantity & identity of chemical</span> + <span class="ka">apparatus (with capacity)</span>.', 'Safety: state the precaution <b>and</b> the risk it tackles.'] },
  { n: 2, id: 'vol', name: 'Volumetric Analysis', icon: 'burette',
    sum: 'Acid–base, redox, back and double-indicator titrations · micro-titration and dilution',
    cheat: ['Assume a titre of 20.00–25.00 cm³ for pre-calculations; preferred titre 10.00–30.00 cm³.', 'Strong acid–strong base: any of thymolphthalein, thymol blue, methyl orange. Strong acid–weak base: methyl orange. Weak acid–strong base: thymolphthalein / thymol blue.', 'Methyl orange: red → orange → yellow. Thymolphthalein: colourless → blue.', '$KMnO4$ titrations need no indicator; acidify with dilute $H2SO4$ (never $HCl$).', 'Iodine–thiosulfate: add starch only near the end-point (pale yellow); blue-black → colourless.', 'Micro-titration: if V(FA 1) &lt; 10 cm³ dilute FA 1; if &gt; 30 cm³ dilute FA 2. DF = drops FA 1 / drops FA 2; V<sub>D</sub> = 250 / DF.', 'Repeat until two titres agree within 0.10 cm³.'] },
  { n: 3, id: 'grav1', name: 'Gravimetry 1', icon: 'crucible',
    sum: '5 simple steps + table (A, B, C, D, D)', user: true,
    cheat: ['Using an analytical balance, weigh and record the mass of an empty, clean and dry crucible.', 'Weigh accurately about 5.00 g of [hydrated solid]. Record the total mass of the crucible and the [hydrated solid].', 'Using a Bunsen burner, heat the crucible and its contents gently at first, then strongly for 10 min.', 'Cool and weigh the crucible and its contents. Then, record the total mass of the crucible and its contents again.', 'Repeat the heating–cooling–weighing process until a constant mass is achieved.', 'Table: A (empty) · B (with solid) · C (after 1st heating) · D · D (constant).'] },
  { n: 4, id: 'grav2', name: 'Gravimetry 2', icon: 'funnel',
    sum: 'Precipitation: mix → filter → wash → dry–cool–weigh to constant mass',
    cheat: ['Mix two solutions (sample must be dissolved first).', 'Filter through pre-weighed filter paper; wash the precipitate with cold deionised water.', 'Dry in the oven, cool in a desiccator, weigh. Repeat dry–cool–weigh until constant mass.', '$SO4^2-$ → $BaCl2$ or $Pb(NO3)2$; halides → $AgNO3$ or $Pb(NO3)2$; $Pb^2+$ → $H2SO4$/$Na2SO4$/$HCl$/$NaCl$/$KBr$/$KI$; $Ba^2+$ → $H2SO4$/$Na2SO4$; $Ag^+$ → $HCl$/$NaCl$/$KBr$/$KI$.', 'Avoid reagents that also precipitate impurities.'] },
  { n: 5, id: 'gas', name: 'Gas Collection', icon: 'syringe',
    sum: 'Methods: gas syringe · water displacement · inverted measuring cylinder · inverted burette', user: true,
    cheat: ['<b>Methods:</b> gas syringe · water displacement · inverted measuring cylinder · inverted burette.', '<b>Purposes:</b> derive R / find concentration or percentage purity / M<sub>r</sub> / kinetics.', '<b>[Set-up]</b> Measure liquid volume (burette), conical flask with side arm. Measure solid (excess) in small tube tied to string → lower into flask & stopper, ensure no mix.', 'Check zero mark of gas syringe → loosen to release solid, swirl, reaction proceeds until constant reading of gas syringe → record final reading. Repeat for consistent results.', '<b>[Analysis]</b> Assume 1 mol occupies 24 dm³ at laboratory conditions (essentially r.t.p.).', 'Plan for V<sub>gas</sub> ≈ 50–90% of the collecting apparatus capacity.'] },
  { n: 6, id: 'en', name: 'Energetics', icon: 'thermo',
    sum: 'Calorimeter for ΔH<sub>rxn/soln/neut</sub> · calorimeter for ΔH<sub>c</sub> · three analysis methods', user: true,
    cheat: ['<b>Set-up types:</b> calorimeter (Styrofoam cup in beaker) for ΔH<sub>rxn/soln/neut</sub>; metal calorimeter + spirit lamp for ΔH<sub>c</sub>.', '<b>Analysis 1:</b> temperature against time: find maximum temperature change (1 set-up, 2 experiments + average).', '<b>Analysis 2:</b> temperature against volume of reagent added (thermometric titration).', '<b>Analysis 3:</b> temperature against volume of reagent added (multiple set-ups with varying volumes of each solution, total volume constant).', 'q = mcΔT; ΔH = −mcΔT / n. Assume a 5–10 °C change for pre-calculations.', 'Keep solution volume ≤ half the cup so solid can be added without spilling.'] },
  { n: 7, id: 'kin', name: 'Kinetics', icon: 'watch',
    sum: 'Clock method · continuous method (sample, quench, titrate)', user: true,
    cheat: ['<b>Clock method:</b> vary initial volumes [multiple reaction mixtures] → record 1× time taken for set observation.', '<b>Continuous method:</b> draw out aliquot at various times, quench & titrate → plot [conc] against time.', 'Clock: keep total volume constant with water, so V<sub>reactant</sub> ∝ [reactant]; rate ∝ 1/t.', 'Last reagent added starts the reaction; start the stopwatch at the same moment.', 'At least 5 runs for a graph.'] },
  { n: 8, id: 'eq', name: 'Equilibria', icon: 'sepfunnel',
    sum: 'Set up → reach equilibrium → measure (titrimetry / gravimetry / colorimetry) → calculate K',
    cheat: ['Stages: set up reaction → allow time to reach equilibrium → determine amounts → calculate K.', 'Titrimetry for K<sub>c</sub>, K<sub>a</sub>/K<sub>b</sub>, K<sub>sp</sub>, K<sub>D</sub>; gravimetry for solubility/K<sub>sp</sub>; colorimetry for K<sub>stab</sub>.', 'Never change the conditions that set K (e.g. temperature) while measuring: use a thermostatically controlled water bath.', 'Filter saturated solutions with a dry funnel, dry filter paper and dry flask.'] },
  { n: 9, id: 'ec', name: 'Electrochemistry', icon: 'cell',
    sum: 'Electrolytic cell (Q = It = nF) · electrochemical cell and the Nernst equation',
    cheat: ['Electrolytic cell: external power supply drives a non-spontaneous redox reaction. Q = It = n<sub>e</sub>F.', 'Electrochemical cell: chemical → electrical energy. Two half-cells, salt bridge, high-resistance voltmeter.', 'Nernst: E<sub>cell</sub> = E<sup>⦵</sup><sub>cell</sub> − (RT/nF) ln Q.', 'Serial dilution: 2.50 cm³ into a 25 cm³ volumetric flask = ×10 dilution.'] },
  { n: 10, id: 'org', name: 'Organic Synthesis', icon: 'condenser',
    sum: 'Reaction · isolation/separation · purification · identification', user: true,
    cheat: ['<b>Reaction:</b> crude sample of desired product.', '<b>Isolation/Separation:</b> crude sample of product separated from reaction mixture (removing impurities).', '<b>Purification:</b> removing trace impurities.', '<b>Identification:</b> confirm identity and purity of compound.', 'Heat under reflux: water in at the bottom of the condenser. Avoid naked flames; use a heating mantle or water/oil bath.', 'Pure solid melts sharply (within ~1 °C).'] }
];

/* ============ 1 · INTRODUCTION ============ */
EX.push({
  id: 'intro-tamp', topic: 1, tag: 'Plan', name: 'TAMP & writing a plan',
  q: 'How to turn any planning question into a clear, logical plan: the TAMP framework, the parts of a written plan, and how to word each procedural step.',
  tamp: { T: 'Identify the topic tested and the aim.', A: 'Analyse clues in the description, apparatus, chemicals and bulleted points.', M: 'Decide quantities: assumed values or calculated from clues.', P: 'Recall the typical series of steps for that topic and adapt it.' },
  cam: [-0.6, 3.0, 8.4, -0.8, 1.2, 0],
  actors: [
    ['bal', 'balance', { x: -3.1, z: 0.4, lab: 'electronic balance' }],
    ['wb', 'wbottle', { x: -3.1, y: 0.33, z: 0.4, lab: 'weighing bottle' }],
    ['stock', 'beaker', { x: -1.9, z: 0.1, lv: 0.55, lab: 'NaOH(aq)' }],
    ['mc', 'mcyl', { x: -0.5, z: 0.1, s: 0.85, lab: '25 cm³ measuring cylinder' }],
    ['nT', 'note', { x: 1.6, y: 3.0, vis: 0, lab: 'T · Topic & Aim' }],
    ['nA', 'note', { x: 1.6, y: 2.45, vis: 0, lab: 'A · Analyse clues' }],
    ['nM', 'note', { x: 1.6, y: 1.9, vis: 0, lab: 'M · Measurements' }],
    ['nP', 'note', { x: 1.6, y: 1.35, vis: 0, lab: 'P · Process' }]
  ],
  steps: [
    { t: 'T · Topic & Aim', d: '~Identify~ the «topic» being tested and the «aim» of the experiment. This narrows your thinking fast, and the typical ‹process› for that kind of experiment should come to mind.', s: { nT: { vis: 1 } }, dg: [{ k: 'tamp' }] },
    { t: 'A · Analyse clues', d: '~Analyse~ the clues in the question: the description of the experiment, the apparatus provided, the chemicals provided and the bulleted points. These tell you how to adapt the typical process.', s: { nA: { vis: 1 } }, why: 'Clues often hide in the list of apparatus, e.g. "a boiling tube and a holder" or "100 cm³ gas syringe".' },
    { t: 'M · Measurements', d: '~Decide~ and write down the quantities of chemicals to be used and measured. Some are «assumed» to take particular values (e.g. a titre of 25.00 cm³); others are «calculated» from the clues or your assumptions.', s: { nM: { vis: 1 } } },
    { t: 'P · Process', d: 'Each type of experiment has a typical ‹process›: a series of steps and considerations you should remember. How much of it you use depends on what you analysed.', s: { nP: { vis: 1 } }, dg: [{ k: 'table', h: 'Parts of a written plan', head: ['Heading', 'What to write'], rows: [['1 Aim', 'Read the question carefully; state the aim.'], ['2 Theory', 'Chemistry principles; dependent and independent variables.'], ['3 Pre-experimental calculations ✓', 'Make suitable assumptions to work out masses or volumes to use.'], ['4 Procedure ✓', 'Numbered sequence of steps; every apparatus with capacity; every mass or volume.'], ['5 Results ✓', 'Tables to record the data.'], ['6 Treatment of results ✓', 'Use hypothetical results (e.g. y cm³) to show how the aim is reached; formulae, graphs.'], ['7 Safety ✓', 'A risk and the precaution that tackles it.'], ['8 Reliability', 'Measures that make results reliable, e.g. repeat titrations.']] }] },
    { t: 'Anatomy of a step (1)', d: 'Using a ‹25 cm³ measuring cylinder›, ~measure~ «20.0 cm³ of $NaOH$(aq)».', cam: [-1.0, 2.2, 4.8, -1.0, 1.0, 0.1],
      ph: [[0.5, { nT: { vis: 0 }, nA: { vis: 0 }, nM: { vis: 0 }, nP: { vis: 0 } }], [0.9, { stock: P('beaker', 1, -0.55, 1.62, 0.1) }], [0.3, { stock: { pour: 1, py: 0.3 } }], [1.6, { stock: { lv: 0.38 }, mc: { lv: 0.8 } }], [0.3, { stock: { pour: 0 } }], [0.9, { stock: { x: -1.9, y: 0, rz: 0 } }]],
      dg: [{ k: 'list', h: 'Each step has three parts', items: ['<b class="kv">A verb</b>: an action word, e.g. weigh, transfer, dissolve.', '<span class="kq">Quantity and identity of chemical</span>, e.g. 20.00 cm³ of NaOH.', '<span class="ka">Instrument or apparatus, with its capacity</span>, e.g. 250 cm³ conical flask, electronic balance, 25.0 cm³ pipette.'] }] },
    { t: 'Anatomy of a step (2)', d: 'Using an ‹electronic balance›, ~weigh~ accurately about «2.5 g of $Na2CO3$» into a clean and dry ‹weighing bottle›.', cam: [-2.4, 1.9, 3.6, -3.0, 0.5, 0.4],
      ph: [[1.6, { wb: { sol: 0.6 }, bal: { rd: 2.50 } }]] },
    { t: 'Safety: risk + precaution', d: 'A safety suggestion must ~always~ tackle the accompanying risk. Name the hazard and say how the precaution prevents harm.', cam: [-0.6, 3.0, 8.4, -0.8, 1.2, 0],
      dg: [{ k: 'table', h: 'Write it like this', head: ['✓ Good', '✗ Too vague'], rows: [['Gloves and lab coat should be worn as concentrated sulfuric acid is corrosive and can cause burns if it comes in contact with the skin.', 'Gloves should be worn.'], ['Fill the burette with hydrochloric acid with the aid of a funnel, below eye level, to prevent corrosive acid splashing into the eyes.', 'Wear goggles.'], ['Pipette using a pipette filler, never by mouth, to avoid swallowing corrosive or toxic chemicals.', 'Be careful when pipetting.']] }] },
    { t: 'Reliability', d: 'State and explain measures that make results reliable, e.g. ~repeat~ the titration to get at least two titre values within «0.10 cm³» of each other, or carry out the experiment in a ‹thermostatically controlled water bath› so the temperature stays constant.' }
  ]
});

EX.push({
  id: 'intro-var1', topic: 1, tag: 'Ex 1', name: 'Variables: Mg + HCl rate',
  q: 'Hydrochloric acid and magnesium ribbon react to produce hydrogen gas: $2HCl$(aq) + $Mg$(s) → $MgCl2$(aq) + $H2$(g). Plan an experiment, based on the volume of gas produced, to investigate how the rate depends on the concentration of the hydrochloric acid.',
  tamp: { T: 'Kinetics (gas collection).', A: 'Rate followed by volume of $H2$ collected.', M: 'Volume of $H2$ in a set time, or time for a set volume.', P: 'Change [$HCl$] only; keep everything else constant.' },
  cam: [-0.4, 2.8, 7.6, -0.5, 1.0, 0],
  actors: [
    ['cf', 'conical', { x: -1.6, side: true, lv: 0.28, lab: 'HCl(aq)' }],
    ['mg', 'box', { x: -2.6, z: 0.7, w: 0.5, h: 0.015, dd: 0.07, col: '#c4c9cd', metal: true, lab: 'Mg ribbon' }],
    ['tub', 'tubing', { pts: [[-1.02, 0.99, 0], [-0.9, 1.16, 0], [-0.62, 1.27, 0], [-0.4, 1.25, 0]] }],
    ['syr', 'syringe', { x: -0.4, y: 1.25, stand: true, h: 1.25, lab: '100 cm³ gas syringe' }],
    ['w', 'watch', { x: 2.6, z: 0.6, lab: 'stopwatch' }],
    ['n1', 'note', { x: -1.6, y: 2.3, vis: 0 }]
  ],
  steps: [
    { t: 'Name the three variables', d: 'Before planning, ~state~ what you change, what you measure and what you keep the same.', dg: [{ k: 'table', h: 'Variables', head: ['Type', 'In this experiment'], rows: [['Independent (changed)', 'concentration of $HCl$'], ['Dependent (measured)', 'volume of $H2$ collected in a specified time, or time taken to produce a specified volume of $H2$'], ['Constant (controlled)', 'temperature; amount / length / mass / surface area of magnesium ribbon']] }] },
    { t: 'Independent variable', d: 'The ~independent variable~ is the one you choose to change: here the «concentration of $HCl$». Each run uses $HCl$ of a different concentration.', s: { n1: { vis: 1, lab: 'change [HCl] between runs' } } },
    { t: 'Dependent variable', d: 'The ~dependent variable~ is the one you measure: the «volume of $H2$» collected in the ‹gas syringe› in a set time (or the time for a set volume).', cam: [-0.8, 2.4, 5.6, -0.8, 1.0, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [0.9, { mg: { x: -1.6, y: 1.7, z: 0 } }], [0.6, { mg: { y: 0.06, rz: 0.2 } }], [0.4, { cf: { stop: 1 } }], [4.0, { cf: { fizz: 1 }, syr: { rd: 62 }, w: { rd: 60 }, mg: { vis: 0.3 } }], [0.6, { cf: { fizz: 0 }, n1: { vis: 1, lab: 'volume of H₂ in 60 s' } }]] },
    { t: 'Constant variables', d: 'Keep the «temperature» and the «amount / length / mass / surface area of magnesium ribbon» the same in every run, so only [$HCl$] can affect the rate.', s: { n1: { lab: 'keep temperature and Mg constant' } } }
  ]
});

EX.push({
  id: 'intro-var2', topic: 1, tag: 'Ex 2', name: 'Variables: PbCl₂ stoichiometry',
  q: 'Different volumes of 0.20 mol dm⁻³ $NaCl$ are added to a fixed volume of 0.10 mol dm⁻³ $Pb(NO3)2$. Each precipitate of $PbCl2$ is filtered, washed with distilled water, dried and weighed. Plan an experiment to confirm or reject the stoichiometry $Pb(NO3)2$ + 2$NaCl$ → $PbCl2$ + 2$NaNO3$.',
  tamp: { T: 'Gravimetry (precipitation) used to test a stoichiometry.', A: 'Fixed volume of $Pb(NO3)2$; vary the volume of $NaCl$.', M: 'Volume of $NaCl$; mass of dry $PbCl2$.', P: 'Mix → filter → wash → dry → weigh; repeat with different volumes.' },
  cam: [0.6, 3.2, 8.6, 0.6, 1.5, 0],
  actors: [
    ['bur', 'burette', { x: -1.2, rd: 0, dripY: 0.4, lab: '50.00 cm³ burette · NaCl(aq)' }],
    ['bk', 'beaker', { x: -1.2, lv: 0.3, lab: 'Pb(NO₃)₂(aq), fixed volume' }],
    ['cf2', 'conical', { x: 0.9 }],
    ['fun', 'funnel', { x: 0.9, y: 1.05, s: 0.8, paper: true, dripY: 0.3, lab: 'filter funnel + paper' }],
    ['bal', 'balance', { x: 2.8, z: 0.4, lab: 'electronic balance' }],
    ['dish', 'evap', { x: 2.8, y: 0.33, z: 0.4, vis: 0, lab: 'dried PbCl₂' }],
    ['n1', 'note', { x: 0.9, y: 3.0, vis: 0 }]
  ],
  steps: [
    { t: 'Name the three variables', d: '~Identify~ the variables before writing the procedure.', dg: [{ k: 'table', h: 'Variables', head: ['Type', 'In this experiment'], rows: [['Independent', 'volume / amount / mass of $NaCl$'], ['Dependent', 'mass / amount of $PbCl2$'], ['Constant', 'temperature (and the fixed volume of $Pb(NO3)2$)']] }] },
    { t: 'Add NaCl(aq) from the burette', d: '~Run~ a measured volume of «0.20 mol dm⁻³ $NaCl$» from the ‹burette› into the fixed volume of $Pb(NO3)2$. A white precipitate of $PbCl2$ forms.', cam: [-0.6, 2.4, 5.0, -1.2, 1.2, 0],
      ph: [[2.4, { bur: { drip: 1, rd: 12 }, bk: { ppt: 0.25, col: C.cloudy, lv: 0.36 } }], [0.4, { bur: { drip: 0 } }]] },
    { t: 'Filter and wash', d: '~Filter~ the mixture through ‹filter paper› and ~wash~ the precipitate with distilled water.',
      ph: [[1.0, { bk: P('beaker', 1, 0.78, 2.0, 0) }], [0.3, { bk: { pour: 1, py: 1.4 } }], [1.6, { bk: { lv: 0.03, ppt: 0 }, fun: { ppt: 0.5, lv: 0.4, drip: 1 }, cf2: { lv: 0.2 } }], [0.4, { bk: { pour: 0 } }], [0.9, { bk: { x: -1.2, y: 0, rz: 0 }, fun: { lv: 0, drip: 0 } }]] },
    { t: 'Dry and weigh', d: 'Thoroughly ~dry~ the precipitate, then ~weigh~ it on the ‹electronic balance›: this is the dependent variable.', cam: [2.6, 2.0, 4.6, 2.4, 0.5, 0.3],
      ph: [[0.6, { dish: { vis: 1, sol: 0.7, solc: C.wh } }], [1.2, { bal: { rd: 0.83 } }], [0.4, { n1: { vis: 1, x: 2.8, y: 1.4, lab: 'mass of PbCl₂ for this volume of NaCl' } }]] },
    { t: 'Repeat and plot', d: '~Repeat~ with different volumes of $NaCl$. The mass of $PbCl2$ rises, then stays constant once all $Pb^2+$ has precipitated. The break point gives the mole ratio.', dg: [{ k: 'graph', g: 'stoich' }] }
  ]
});

EX.push({
  id: 'intro-app', topic: 1, tag: 'Kit', name: 'Common apparatus',
  q: 'A tour of the apparatus that appears in almost every plan. Step through to see what each one is for.',
  tamp: { T: 'Know the apparatus.', A: 'Match each job to the right piece.', M: 'State capacities (e.g. 250 cm³ graduated flask).', P: 'Name the apparatus in every step.' },
  cam: [0, 4.4, 13.5, -0.2, 1.4, 0],
  actors: [
    ['pip', 'pipette', { x: -5.0, lab: 'pipette + pipette filler' }],
    ['vf', 'vflask', { x: -4.0, lab: 'graduated (volumetric) flask' }],
    ['wash', 'washb', { x: -3.1, lab: 'wash bottle', dripY: 0.2 }],
    ['cf', 'conical', { x: -1.9, lv: 0.2, lab: 'conical flask' }],
    ['bk', 'beaker', { x: -0.8, lv: 0.4, lab: 'beaker' }],
    ['cf2', 'conical', { x: 0.35 }],
    ['fun', 'funnel', { x: 0.35, y: 1.05, s: 0.8, lab: 'filter funnel' }],
    ['mc', 'mcyl', { x: 1.35, s: 0.9, lv: 0.3, lab: 'measuring cylinder' }],
    ['rod', 'grod', { x: 2.05, rz: -0.12, lab: 'glass rod' }],
    ['drp', 'dropper', { x: 2.6, y: 0.0, lab: 'dropping pipette' }],
    ['bur', 'burette', { x: 4.4, rd: 0, lab: 'burette' }]
  ],
  steps: [
    { t: 'Pipette (with filler)', d: 'A ‹pipette› delivers one fixed volume accurately. Common sizes: «10.0, 20.0 and 25.0 cm³». Fill it with a ‹pipette filler›, never by mouth.', cam: [-4.2, 2.6, 4.4, -4.6, 1.5, 0], ph: [[1.6, { pip: { lv: 1 } }]] },
    { t: 'Graduated (volumetric) flask', d: 'Makes a solution up to an exact total volume, e.g. «250 cm³» or «100 cm³». Fill to the mark, then stopper and shake.', cam: [-3.6, 2.4, 4.0, -4.0, 1.1, 0], ph: [[1.6, { vf: { lv: 1 } }], [0.5, { vf: { stop: 1 } }]] },
    { t: 'Wash bottle', d: 'Holds deionised water for rinsing apparatus, transferring washings, and topping up to the mark.', cam: [-2.6, 2.2, 4.0, -3.0, 1.0, 0], ph: [[1.2, { wash: { drip: 1 } }], [0.3, { wash: { drip: 0 } }]] },
    { t: 'Conical flask', d: 'Holds the solution being titrated. Its shape lets you ~swirl~ continuously without spilling. A ‹250 cm³ conical flask› is standard.', cam: [-1.6, 2.0, 3.8, -1.9, 0.7, 0], ph: [[1.6, { cf: { swirl: 1 } }], [0.4, { cf: { swirl: 0 } }]] },
    { t: 'Beaker', d: 'For dissolving a weighed solid and holding or transferring solutions, e.g. a ‹100 cm³ beaker› to dissolve a sample before making it up in a graduated flask.', cam: [-0.5, 2.0, 3.6, -0.8, 0.6, 0] },
    { t: 'Filter funnel', d: 'Lined with filter paper to separate a solid; also guides liquid into a burette or graduated flask without spills.', cam: [0.6, 2.4, 3.8, 0.35, 1.3, 0] },
    { t: 'Measuring cylinder', d: 'Measures volumes quickly where top accuracy is not needed (e.g. excess acid or water). Pick a capacity close to the volume: a ‹25 cm³ measuring cylinder› for 20.0 cm³.', cam: [1.5, 2.2, 3.8, 1.35, 1.0, 0] },
    { t: 'Glass rod', d: 'Stirs to dissolve solids, and guides liquid down into a funnel during quantitative transfer.', cam: [2.1, 1.9, 3.4, 2.05, 0.7, 0] },
    { t: 'Dropping pipette', d: 'Adds liquid drop by drop: indicator, or deionised water when nearing the graduation mark.', cam: [2.7, 1.6, 3.0, 2.6, 0.5, 0], ph: [[1.2, { drp: { drip: 1 } }], [0.3, { drp: { drip: 0 } }]] },
    { t: 'Burette', d: 'Delivers a variable, measured volume. Capacity «50.00 cm³»; record readings to «2 decimal places».', cam: [5.6, 4.0, 6.0, 4.4, 3.0, 0], ph: [[2.0, { bur: { drip: 1, rd: 8.4 } }], [0.3, { bur: { drip: 0 } }]] }
  ]
});

/* ============ 2 · VOLUMETRIC ANALYSIS ============ */
EX.push({
  id: 'vol-we1', topic: 2, tag: 'WE1', name: 'Purity of impure Na₂CO₃',
  q: 'A solid sample contains about 80% by mass of $Na2CO3$. Design an experiment to find the percentage purity accurately by titration. Available: 3 g impure $Na2CO3$, 0.100 mol dm⁻³ dilute $HCl$, acid–base indicators, usual titration apparatus.',
  tamp: { T: 'Volumetric analysis: acid–base titration (strong acid – weak base).', A: 'Solid sample → make a standard solution in a 250 cm³ graduated flask. $HCl$ in the burette, $Na2CO3$ in the conical flask.', M: 'Mass of impure sample, m g; average titre, V cm³.', P: 'Pre-calc → weigh → dissolve → transfer → make up → shake → pipette → titrate → repeat.' },
  cam: [0.2, 3.6, 9.6, 0, 1.7, 0],
  actors: [
    ['bal', 'balance', { x: -3.3, z: 0.4, lab: 'electronic balance' }],
    ['wb', 'wbottle', { x: -3.3, y: 0.33, z: 0.4, lab: 'weighing bottle' }],
    ['bk', 'beaker', { x: -2.0, z: 0.3, s: 0.75, lab: '100 cm³ beaker' }],
    ['rod', 'grod', { x: -2.05, y: 0.05, z: 0.3, rz: 0.22, vis: 0, lab: 'glass rod' }],
    ['wash', 'washb', { x: -2.75, y: 0.15, z: 0.3, vis: 0, dripY: 0.3, lab: 'deionised water' }],
    ['vf', 'vflask', { x: -0.6, z: 0.2, lab: '250 cm³ graduated flask' }],
    ['fun', 'funnel', { x: -0.6, y: 1.62, z: 0.2, s: 0.55, vis: 0, lab: 'funnel' }],
    ['drp', 'dropper', { x: -0.6, y: 2.15, z: 0.2, vis: 0, dripY: 1.6, lab: 'dropping pipette' }],
    ['pip', 'pipette', { x: -0.6, y: 0.9, z: 0.2, vis: 0, lab: '25.0 cm³ pipette' }],
    ['bur', 'burette', { x: 1.9, dripY: 0.45, lab: '50.00 cm³ burette' }],
    ['tile', 'tile', { x: 1.9, lab: 'white tile' }],
    ['cf', 'conical', { x: 1.9, y: 0.03, lab: '250 cm³ conical flask' }],
    ['ind', 'dropper', { x: 1.9, y: 1.6, z: 1.0, vis: 0, col: C.mo_y, dripY: 0.25, lab: 'methyl orange' }],
    ['n1', 'note', { x: 3.1, y: 2.0, z: 0.4, vis: 0 }]
  ],
  steps: [
    { t: 'Pre-experimental calculation', d: '~Assume~ an average titre of «25.00 cm³» of $HCl$ and back-calculate the mass of impure sample to weigh.', dg: [{ k: 'calc', h: 'Mass of impure Na₂CO₃ to use', l: ['Let the average volume of $HCl$ used = 25.00 cm³', 'n($HCl$) = 25.00/1000 × 0.100 = 2.50 × 10⁻³ mol', '$Na2CO3$ + 2$HCl$ → 2$NaCl$ + $CO2$ + $H2O$', 'n($Na2CO3$) in 25.0 cm³ = ½ × 2.50 × 10⁻³ = 1.25 × 10⁻³ mol', 'n($Na2CO3$) in 250 cm³ = 10 × 1.25 × 10⁻³ = 1.25 × 10⁻² mol', 'mass of $Na2CO3$ = 1.25 × 10⁻² × 106.0 = 1.325 g', 'Sample is about 80% $Na2CO3$ → mass to use = 1.325 / 0.80 = <b>1.66 g</b>'] }] },
    { t: 'Weigh the sample', d: 'Using an ‹electronic balance›, ~weigh~ out accurately about «1.66 g» of the impure $Na2CO3$ sample in a clean and dry ‹weighing bottle›.', cam: [-2.6, 2.0, 3.6, -3.2, 0.5, 0.35], ph: [[1.6, { wb: { sol: 0.55 }, bal: { rd: 1.66 } }]] },
    { t: 'Dissolve', d: '~Dissolve~ the sample in some deionised water in a ‹100 cm³ beaker›. Transfer the sample quantitatively: rinse the weighing bottle a few times with deionised water and transfer all the washings into the beaker.', why: 'Every grain of the weighed solid must end up in the solution, otherwise the calculated purity is too low.', cam: [-2.0, 2.3, 4.6, -2.5, 0.8, 0.3],
      ph: [[0.9, { wb: P('wb', 1, -2.12, 0.95, 0.3), bal: { rd: 0 } }], [0.8, { wb: { sol: 0 }, bk: { ppt: 0.3 } }], [0.7, { wb: { x: -3.3, y: 0.33, z: 0.4, rz: 0 } }], [0.5, { wash: { vis: 1 } }], [1.3, { wash: { drip: 1 }, bk: { lv: 0.45 } }], [0.3, { wash: { drip: 0 } }], [0.4, { rod: { vis: 1 } }], [1.6, { rod: { swirl: 1 }, bk: { ppt: 0 } }], [0.4, { rod: { swirl: 0 }, wash: { vis: 0 } }]] },
    { t: 'Transfer to the graduated flask', d: '~Transfer~ the solution quantitatively into a ‹250 cm³ graduated flask› with the aid of a ‹funnel› and a ‹glass rod›. Rinse the beaker a few times with deionised water and transfer all the washings into the flask.', cam: [-1.0, 2.6, 5.0, -1.0, 1.4, 0.2],
      ph: [[0.6, { fun: { vis: 1 }, rod: { vis: 0 } }], [1.0, { bk: P('beaker', 0.75, -0.62, 2.3, 0.2) }], [0.3, { bk: { pour: 1, py: 0.9 } }], [1.8, { bk: { lv: 0.02 }, vf: { lv: 0.32 } }], [0.3, { bk: { pour: 0 } }], [0.9, { bk: { x: -2.0, y: 0, z: 0.3, rz: 0, lv: 0 } }]] },
    { t: 'Make up to the mark', d: '~Fill~ the graduated flask to the «250 cm³ mark» with more deionised water. Use a ‹dropping pipette› to add the water drop by drop when nearing the mark.', why: 'Read the bottom of the meniscus at eye level with the mark.', cam: [-0.2, 2.4, 3.4, -0.6, 1.6, 0.2],
      ph: [[0.6, { wash: { vis: 1, x: -1.16, y: 0.62, z: 0.2 } }], [1.6, { wash: { drip: 1 }, vf: { lv: 0.92 } }], [0.3, { wash: { drip: 0 } }], [0.5, { wash: { vis: 0 }, fun: { vis: 0 }, drp: { vis: 1 } }], [1.4, { drp: { drip: 1 }, vf: { lv: 1 } }], [0.3, { drp: { drip: 0 } }], [0.4, { drp: { vis: 0 } }]] },
    { t: 'Stopper and shake', d: '~Stopper~ the graduated flask and ~shake~ the solution thoroughly so that it is homogeneous. Label the solution «FA 3».', cam: [-0.4, 2.4, 4.2, -0.6, 1.2, 0.2],
      ph: [[0.5, { vf: { stop: 1 } }], [0.5, { vf: { y: 0.5 } }], [1.8, { vf: { shake: 1.6 } }], [0.6, { vf: { shake: 0, y: 0, lab: 'FA 3 · Na₂CO₃(aq)' } }]] },
    { t: 'Fill the burette', d: '~Fill~ the ‹burette› with the «0.100 mol dm⁻³ $HCl$» provided.', safe: 'Fill the burette with the aid of a funnel and below eye level, to prevent corrosive acid splashing into the eyes.', cam: [3.6, 3.6, 6.2, 1.9, 3.2, 0],
      ph: [[0.5, { bur: { fun: 1 } }], [2.0, { bur: { rd: 0 } }], [0.4, { bur: { fun: 0, lab: '50.00 cm³ burette · 0.100 mol dm⁻³ HCl' } }]] },
    { t: 'Pipette FA 3 + indicator', d: '~Pipette~ «25.0 cm³ of FA 3» into a ‹250 cm³ conical flask›. ~Add~ «2 drops» of ‹methyl orange› indicator.', safe: 'Use the pipette filler; never draw solution up by mouth.', cam: [0.7, 2.8, 6.4, 0.6, 1.4, 0.5],
      ph: [[0.6, { cf: { z: 1.0 } }], [0.5, { pip: { vis: 1 } }], [1.2, { pip: { lv: 1 }, vf: { lv: 0.9 } }], [1.1, { pip: { x: 1.9, y: 0.5, z: 1.0 } }], [1.4, { pip: { lv: 0, drip: 1 }, cf: { lv: 0.14 } }], [0.3, { pip: { drip: 0 } }], [0.4, { pip: { vis: 0 }, ind: { vis: 1 } }], [1.0, { ind: { drip: 0.7 }, cf: { col: C.mo_y } }], [0.3, { ind: { drip: 0 } }], [0.3, { ind: { vis: 0 } }]] },
    { t: 'Titrate to the end-point', d: '~Titrate~ the solution in the conical flask against the $HCl$ in the burette, swirling continuously. ~Stop~ when one drop of $HCl$ changes the colour from «yellow to orange».', why: 'Strong acid – weak base titration: methyl orange (range pH 3.2–4.4) lies within the region of rapid pH change (about pH 3.5–6.5).', cam: [3.4, 2.4, 4.8, 1.9, 1.4, 0],
      ph: [[0.8, { cf: { z: 0 } }], [3.0, { bur: { drip: 1, rd: 23.6 }, cf: { swirl: 1, lv: 0.2 } }], [1.4, { bur: { drip: 0.25, rd: 24.7 } }], [0.5, { bur: { rd: 24.75, drip: 0 }, cf: { col: C.mo_o, swirl: 0, lv: 0.21 } }], [0.4, { n1: { vis: 1, lab: 'end-point: yellow → orange' } }]] },
    { t: 'Record and repeat', d: '~Record~ the titration results in a table. ~Repeat~ the titration until at least «two consistent results» are obtained (two titres within «0.10 cm³» of each other).', cam: [3.4, 2.4, 4.8, 1.9, 1.4, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [0.8, { cf: { z: 1.0, col: C.mo_y, lv: 0.14 } }], [1.2, { bur: { rd: 0 } }], [0.6, { cf: { z: 0 } }], [2.4, { bur: { drip: 1, rd: 24.7 }, cf: { swirl: 1, lv: 0.2 } }], [0.4, { bur: { drip: 0 }, cf: { col: C.mo_o, swirl: 0 } }]],
      dg: [{ k: 'table', h: 'Results (sample values)', head: ['Titration', 'Rough', '1', '2'], rows: [['Final burette reading / cm³', '24.85', '49.55', '24.75'], ['Initial burette reading / cm³', '0.00', '24.85', '0.00'], ['Volume of $HCl$ used / cm³', '24.85', '24.70 ✓', '24.75 ✓']], cap: '24.70 and 24.75 agree within 0.10 cm³, so average them.' }] },
    { t: 'Treatment of results', d: 'Let the mass of sample be «m g» and the average titre «V cm³». Express the percentage purity in terms of m and V, then check it by substituting sensible values.', cam: [0.2, 3.6, 9.6, 0, 1.7, 0],
      dg: [{ k: 'calc', h: 'Percentage purity', l: ['n($HCl$) = V/1000 × 0.100 = 1.00 × 10⁻⁴ V mol', 'n($Na2CO3$) in 25.0 cm³ = ½ × 1.00 × 10⁻⁴ V = 5.00 × 10⁻⁵ V mol', 'n($Na2CO3$) in 250 cm³ = 10 × 5.00 × 10⁻⁵ V = 5.00 × 10⁻⁴ V mol', 'mass of $Na2CO3$ = 5.00 × 10⁻⁴ V × 106.0 = 0.0530 V g', '% purity = (0.0530 V / m) × 100 = <b>5.30 V / m %</b>', '<i>Assumption:</i> the impurity is water-soluble and does not react with dilute $HCl$.'] }] }
  ]
});

EX.push({
  id: 'vol-we2', topic: 2, tag: 'WE2', name: 'Methanoic acid remaining',
  q: 'An old bottle of methanoic acid (a weak acid that slowly decomposes: $HCO2H$ → $CO$ + $H2O$). Plan a titration to find the concentration remaining. Available: 150 cm³ of the solution (FA 1), 0.200 mol dm⁻³ $NaOH$ (FA 2), 250 cm³ graduated flask, deionised water, thymolphthalein and methyl orange. A test found 20 drops of FA 1 needed 4 drops of FA 2.',
  tamp: { T: 'Volumetric analysis: weak acid – strong base titration.', A: 'Micro-titration: FA 2 is too concentrated → dilute it ×5 to make FA 3.', M: 'Volume of FA 2 for dilution (50.00 cm³); titre x cm³.', P: 'Dilute FA 2 → fill burette with FA 3 → pipette FA 1 + thymolphthalein → titrate → repeat.' },
  cam: [0, 3.6, 9.8, -0.2, 1.8, 0],
  actors: [
    ['bt', 'btube', { x: -3.6, z: 0.7, s: 0.8, lab: 'boiling tube' }],
    ['d1', 'dropper', { x: -3.6, y: 1.45, z: 0.7, vis: 0, dripY: 0.25, lab: 'FA 1' }],
    ['d2', 'dropper', { x: -3.6, y: 1.45, z: 0.7, vis: 0, dripY: 0.25, lab: 'FA 2' }],
    ['bur2', 'burette', { x: -1.6, lift: 0.55, dripY: 0.6, lab: 'burette · FA 2 (0.200 mol dm⁻³ NaOH)' }],
    ['vf', 'vflask', { x: -1.6, lab: '250 cm³ graduated flask' }],
    ['wash', 'washb', { x: -2.18, y: 0.46, z: 0.9, vis: 0, dripY: 1.5, lab: 'deionised water' }],
    ['drp', 'dropper', { x: -1.6, y: 2.15, z: 0.9, vis: 0, dripY: 1.6, lab: 'dropping pipette' }],
    ['fa1', 'beaker', { x: 0.2, z: 0.8, lv: 0.6, lab: 'FA 1 (HCOOH)' }],
    ['pip', 'pipette', { x: 0.2, y: 0.15, z: 0.8, vis: 0, lab: '25.0 cm³ pipette' }],
    ['bur', 'burette', { x: 2.2, dripY: 0.45, lab: 'burette' }],
    ['tile', 'tile', { x: 2.2 }],
    ['cf', 'conical', { x: 2.2, y: 0.03, lab: '250 cm³ conical flask' }],
    ['ind', 'dropper', { x: 2.2, y: 1.6, z: 1.0, vis: 0, col: '#e6eef3', dripY: 0.25, lab: 'thymolphthalein' }],
    ['n1', 'note', { x: 3.3, y: 2.0, z: 0.5, vis: 0 }]
  ],
  steps: [
    { t: 'Read the micro-titration', d: '«20 drops of FA 1» needed only «4 drops of FA 2». FA 2 is too concentrated, so it must be ~diluted~ before it is used in the burette.', cam: [-3.0, 1.9, 3.6, -3.6, 0.8, 0.6],
      ph: [[0.4, { d1: { vis: 1 } }], [1.6, { d1: { drip: 1 }, bt: { lv: 0.12 } }], [0.3, { d1: { drip: 0, vis: 0 } }], [0.4, { d2: { vis: 1 } }], [1.0, { d2: { drip: 0.6 }, bt: { lv: 0.14, col: C.tp_b } }], [0.3, { d2: { drip: 0, vis: 0 } }]],
      dg: [{ k: 'calc', h: 'Dilution needed', l: ['Dilution factor = drops of FA 1 / drops of FA 2 = 20 / 4 = 5', 'Dilute FA 2 five times so 20 drops of FA 1 need 20 drops of diluted FA 2 (FA 3).', '250 cm³ of FA 3 in a 250 cm³ graduated flask', 'Volume of FA 2 to use = 250 / 5 = <b>50 cm³</b>', '[$NaOH$] in FA 3 = 0.200 / 5 = 0.0400 mol dm⁻³'] }] },
    { t: 'Run 50.00 cm³ of FA 2 into the flask', d: 'Using a ‹burette›, ~add~ «50.00 cm³ of FA 2» into a ‹250 cm³ graduated flask›.', cam: [-0.4, 3.2, 5.6, -1.6, 2.0, 0],
      ph: [[0.4, { bur2: { fun: 1 } }], [1.2, { bur2: { rd: 0 } }], [0.3, { bur2: { fun: 0 } }], [2.6, { bur2: { drip: 1, rd: 50 }, vf: { lv: 0.3 } }], [0.3, { bur2: { drip: 0 } }]] },
    { t: 'Make up to the mark', d: '~Fill~ the graduated flask to the «250 cm³ mark» with ‹deionised water›. Use a ‹dropping pipette› to add water drop by drop when nearing the mark.', cam: [-1.0, 2.4, 4.4, -1.6, 1.4, 0.8],
      ph: [[0.7, { vf: { z: 0.9 } }], [0.5, { wash: { vis: 1 } }], [1.6, { wash: { drip: 1 }, vf: { lv: 0.93 } }], [0.3, { wash: { drip: 0, vis: 0 } }], [0.4, { drp: { vis: 1 } }], [1.3, { drp: { drip: 1 }, vf: { lv: 1 } }], [0.3, { drp: { drip: 0, vis: 0 } }]] },
    { t: 'Stopper, shake, label FA 3', d: '~Stopper~ the graduated flask and ~shake~ the solution so it is homogeneous. Label the solution «FA 3».', cam: [-1.0, 2.4, 4.6, -1.6, 1.2, 0.8],
      ph: [[0.5, { vf: { stop: 1, y: 0.5 } }], [1.8, { vf: { shake: 1.6 } }], [0.6, { vf: { shake: 0, y: 0, lab: 'FA 3 · 0.0400 mol dm⁻³ NaOH' } }]] },
    { t: 'Fill another burette with FA 3', d: '~Fill~ another ‹burette› with «FA 3».', cam: [3.6, 3.6, 6.2, 2.2, 3.2, 0],
      ph: [[0.4, { bur: { fun: 1 } }], [2.0, { bur: { rd: 0 } }], [0.3, { bur: { fun: 0, lab: 'burette · FA 3' } }]] },
    { t: 'Pipette FA 1 + thymolphthalein', d: '~Pipette~ «25.0 cm³ of FA 1» into a ‹250 cm³ conical flask› and ~add~ «2 drops» of ‹thymolphthalein›.', why: 'Weak acid – strong base titration: thymolphthalein changes colour in the alkaline region of rapid pH change (about pH 7.5–10.5).', cam: [1.2, 2.6, 6.0, 1.2, 1.2, 0.8],
      ph: [[0.6, { cf: { z: 1.0 } }], [0.5, { pip: { vis: 1 } }], [1.1, { pip: { lv: 1 }, fa1: { lv: 0.45 } }], [1.1, { pip: { x: 2.2, y: 0.5, z: 1.0 } }], [1.4, { pip: { lv: 0, drip: 1 }, cf: { lv: 0.14 } }], [0.3, { pip: { drip: 0, vis: 0 } }], [0.4, { ind: { vis: 1 } }], [0.8, { ind: { drip: 0.7 } }], [0.3, { ind: { drip: 0, vis: 0 } }]] },
    { t: 'Titrate: colourless → pale blue', d: '~Titrate~ FA 1 against FA 3, swirling. ~Stop~ when one drop of FA 3 changes the solution from «colourless to pale blue».', cam: [3.7, 2.4, 4.8, 2.2, 1.4, 0],
      ph: [[0.8, { cf: { z: 0 } }], [3.0, { bur: { drip: 1, rd: 20.4 }, cf: { swirl: 1, lv: 0.2 } }], [1.2, { bur: { drip: 0.25, rd: 21.3 } }], [0.5, { bur: { drip: 0, rd: 21.35 }, cf: { col: C.tp_pb, swirl: 0 } }], [0.3, { n1: { vis: 1, lab: 'end-point: colourless → pale blue' } }]] },
    { t: 'Record and repeat', d: '~Record~ results in a table. ~Repeat~ until at least «two consistent results» are obtained (titres within «0.10 cm³» of each other).', ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'table', h: 'Results table', head: ['Titration', '1', '2'], rows: [['Final burette reading / cm³', '', ''], ['Initial burette reading / cm³', '', ''], ['Volume of FA 3 used / cm³', '', '']] }] },
    { t: 'Treatment of results', d: 'The label reads «0.1 mol dm⁻³» methanoic acid. With average titre «x cm³», find the percentage decomposed.', cam: [0, 3.6, 9.8, -0.2, 1.8, 0],
      dg: [{ k: 'calc', h: 'Percentage decomposition', l: ['[$NaOH$] in FA 3 = 0.200 / 5 = 0.0400 mol dm⁻³', 'n($NaOH$) = x/1000 × 0.0400 = 4 × 10⁻⁵ x mol', '$HCOOH$ + $NaOH$ → $HCOONa$ + $H2O$', 'n($HCOOH$) in 25.0 cm³ FA 1 = 4 × 10⁻⁵ x mol', '[$HCOOH$] in FA 1 = 4 × 10⁻⁵ x ÷ (25.0/1000) = 0.0016x mol dm⁻³', '% remaining = 0.0016x / 0.1 × 100 = 1.6x %', '% decomposed = <b>(100 − 1.6x) %</b>'] }] }
  ]
});

EX.push({
  id: 'vol-micro', topic: 2, tag: 'Micro', name: 'Micro-titration & dilution',
  q: 'A micro-titration is a quick check that two solutions have suitable concentrations for a full titration. FA 1 goes in the burette (titrant); FA 2 is pipetted into the conical flask.',
  tamp: { T: 'Volumetric analysis: checking concentrations.', A: 'Compare drops of FA 1 with 10 drops of FA 2.', M: 'D<sub>FA1</sub> drops → estimated V<sub>FA1</sub>.', P: '10 drops FA 2 → wash dropper → add FA 1 dropwise, counting → decide what to dilute.' },
  cam: [0.2, 3.0, 8.4, 0.2, 1.1, 0],
  actors: [
    ['fa2', 'beaker', { x: -2.8, z: 0.4, s: 0.75, lv: 0.6, lab: 'FA 2' }],
    ['bt', 'btube', { x: -1.3, z: 0.6, s: 0.9, lab: 'boiling tube' }],
    ['water', 'beaker', { x: 0.2, z: 0.4, s: 0.75, lv: 0.6, lab: 'deionised water' }],
    ['fa1', 'beaker', { x: 1.4, z: 0.4, s: 0.75, lv: 0.6, lab: 'FA 1' }],
    ['dp', 'dropper', { x: -2.8, y: 0.9, z: 0.4, lv: 0, dripY: 0.2, lab: 'dropping pipette' }],
    ['ind', 'dropper', { x: -1.3, y: 1.6, z: 0.6, vis: 0, col: C.mo_y, dripY: 0.2, lab: 'indicator' }],
    ['bur', 'burette', { x: 3.6, lift: 0.55, dripY: 0.6, vis: 0, lab: 'burette · FA 2' }],
    ['vf', 'vflask', { x: 3.6, vis: 0, lab: '250 cm³ graduated flask' }],
    ['n1', 'note', { x: -1.3, y: 2.4, z: 0.6, vis: 0 }]
  ],
  steps: [
    { t: '10 drops of FA 2', d: 'Using a ‹dropping pipette›, ~add~ «10 drops of FA 2» to a ‹boiling tube›. If necessary, add a suitable indicator (or acid).', cam: [-1.8, 2.2, 4.4, -1.9, 0.9, 0.5],
      ph: [[1.0, { dp: { y: 0.25, lv: 0.6 } }], [0.9, { dp: { x: -1.3, y: 1.55, z: 0.6 } }], [1.6, { dp: { drip: 1, lv: 0.25 }, bt: { lv: 0.1 } }], [0.3, { dp: { drip: 0 } }], [0.4, { ind: { vis: 1 } }], [0.7, { ind: { drip: 0.6 }, bt: { col: C.mo_y } }], [0.3, { ind: { drip: 0, vis: 0 } }]] },
    { t: 'Wash the dropper', d: '~Wash~ the dropping pipette with ‹deionised water›, then with «FA 1».', why: 'Rinsing with FA 1 last stops leftover water diluting it.', cam: [0.4, 2.0, 4.4, 0.6, 0.8, 0.4],
      ph: [[0.9, { dp: { x: 0.2, y: 0.9, z: 0.4 } }], [0.5, { dp: { y: 0.25, lv: 0.6 } }], [0.5, { dp: { y: 0.9, lv: 0 } }], [0.9, { dp: { x: 1.4 } }], [0.5, { dp: { y: 0.25, lv: 0.6 } }], [0.5, { dp: { y: 0.9 } }]] },
    { t: 'Add FA 1 drop by drop', d: 'Using the «same» dropping pipette, ~add~ FA 1 drop by drop to the boiling tube. ~Count~ the drops and ~shake~ the tube after each one, until the colour changes. Record D<sub>FA1</sub>.', cam: [-1.0, 2.0, 4.0, -1.3, 1.0, 0.6],
      ph: [[1.0, { dp: { x: -1.3, y: 1.55, z: 0.6 } }], [2.2, { dp: { drip: 0.6, lv: 0.2 }, bt: { lv: 0.2, shake: 0.4 } }], [0.5, { dp: { drip: 0 }, bt: { col: C.mo_o, shake: 0 } }], [0.4, { n1: { vis: 1, lab: 'count the drops: D(FA 1)' } }]] },
    { t: 'Estimate the full-scale titre', d: '10 drops of FA 2 stands in for «25.0 cm³» pipetted, so V<sub>FA1</sub> ≈ (D<sub>FA1</sub> / 10) × 25.0 cm³. Aim for «10.00–30.00 cm³».', ph: [[0.3, { n1: { vis: 0 } }]],
      dg: [{ k: 'table', h: 'Interpreting micro-titration results', head: ['D(FA 2) / drops', 'D(FA 1) / drops', 'V(FA 1) / cm³', 'Remarks'], rows: [['10', '10', '25.0', 'Ideal: use as is.'], ['10', '12', '30.0', 'At the upper limit; acceptable.'], ['10', '4', '10.0', 'At the lower limit: small titre, higher % error.']], cap: 'If V(FA 1) < 10.00 cm³, FA 1 is too concentrated: dilute FA 1. If V(FA 1) > 30.00 cm³, FA 2 is too concentrated: dilute FA 2.' }] },
    { t: 'Example: 67 drops', d: 'A student used 10 drops of FA 2 and needed «67 drops of FA 1». Which solution is diluted, and how much is used for 250 cm³?',
      dg: [{ k: 'calc', h: 'Working', l: ['V(FA 1) ≈ 67/10 × 25.0 = 167.5 cm³ (far above 30 cm³) → <b>dilute FA 2</b>', 'Aim: V(FA 1) ≈ 25 cm³ when 25.0 cm³ of diluted FA 2 is titrated', 'Dilution factor, DF = drops of FA 1 / drops of FA 2 = 67 / 10 = 6.7', 'V<sub>D</sub> = 250 / DF = 250 / 6.7 = <b>37.3 cm³</b> of FA 2'] }] },
    { t: 'Carry out the dilution', d: 'Using a ‹burette›, ~introduce~ «37.30 cm³ of FA 2» into a clean ‹250 cm³ volumetric flask›. ~Add~ deionised water to the mark, then stopper and shake.', cam: [4.6, 3.2, 6.0, 3.6, 2.0, 0],
      ph: [[0.6, { bur: { vis: 1, rd: 0 }, vf: { vis: 1 } }], [2.6, { bur: { drip: 1, rd: 37.3 }, vf: { lv: 0.25 } }], [0.3, { bur: { drip: 0 } }], [1.4, { vf: { lv: 1 } }], [0.4, { vf: { stop: 1 } }], [0.5, { vf: { z: 0.9, y: 0.4 } }], [1.4, { vf: { shake: 1.5 } }], [0.5, { vf: { shake: 0, y: 0 } }]] }
  ]
});

/* ============ 3 · GRAVIMETRY 1 (thermal decomposition) ============ */
EX.push({
  id: 'grav-we1', topic: 3, tag: 'WE1', name: 'Value of n in CuSO₄·nH₂O',
  q: 'A sample of hydrated copper(II) sulfate is $CuSO4.nH2O$. Design an experiment to find n accurately by weighing (gravimetric analysis), not titration. Available: 5 g of $CuSO4.nH2O$(s), crucible, weighing balance, Bunsen burner.',
  tamp: { T: 'Gravimetry: thermal decomposition.', A: 'Heat about 5 g of solid in a crucible to drive off the water of crystallisation.', M: 'Masses A (empty), B (with solid), C, D, D (after heating).', P: 'Weigh → add solid → heat gently then strongly → cool → weigh → repeat to constant mass.' },
  cam: [0, 3.0, 8.2, 0, 0.9, 0],
  actors: [
    ['bal', 'balance', { x: -2.6, z: 0.4, lab: 'analytical balance' }],
    ['cr', 'crucible', { x: -2.6, y: 0.33, z: 0.4, sol: 0, solc: C.cu, lab: 'crucible' }],
    ['wb', 'wbottle', { x: -1.4, z: 0.7, sol: 0.65, solc: C.cu, lab: 'CuSO₄·nH₂O' }],
    ['trip', 'tripod', { x: 0.7, tri: true, lab: 'tripod + pipe-clay triangle' }],
    ['bun', 'bunsen', { x: 0.7, lab: 'Bunsen burner' }],
    ['des', 'desic', { x: 2.7, z: 0.1, lab: 'desiccator' }],
    ['n1', 'note', { x: -2.6, y: 1.5, z: 0.4, vis: 0 }],
    ['n2', 'note', { x: 0.7, y: 2.5, vis: 0 }]
  ],
  steps: [
    { t: 'Weigh the empty crucible → A', d: 'Using an ‹analytical balance›, ~weigh~ and record the mass of an empty, clean and dry ‹crucible›.', cam: [-2.0, 1.9, 3.4, -2.6, 0.5, 0.3], ph: [[1.0, { bal: { rd: 18.42 } }], [0.4, { n1: { vis: 1, lab: 'A = 18.42 g' } }]] },
    { t: 'Add ~5.00 g of solid → B', d: '~Weigh~ accurately about «5.00 g of $CuSO4.nH2O$» into the crucible. Record the total mass of the crucible and the solid.', cam: [-2.0, 1.9, 3.4, -2.6, 0.5, 0.3],
      ph: [[0.3, { n1: { vis: 0 } }], [0.9, { wb: P('wb', 1, -2.66, 0.95, 0.4) }], [1.2, { wb: { sol: 0.1 }, cr: { sol: 0.55 }, bal: { rd: 23.43 } }], [0.8, { wb: { x: -1.4, y: 0, z: 0.7, rz: 0 } }], [0.3, { n1: { vis: 1, lab: 'B = 23.43 g' } }]] },
    { t: 'Heat gently, then strongly for 10 min', d: 'Using a ‹Bunsen burner›, ~heat~ the crucible and its contents «gently at first», then «strongly for 10 min».', why: 'Gentle heating first prevents the solid spattering. Strong heating drives off all the water of crystallisation; the solid turns from blue to white.', safe: 'Handle the hot crucible with crucible tongs, and let it cool before touching it.', cam: [1.6, 2.3, 4.4, 0.7, 1.0, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.2, { cr: { x: 0.7, y: 1.11, z: 0 }, bal: { rd: 0 } }], [0.6, { bun: { fl: 0.55 } }], [1.6, { cr: { steam: 0.6, hot: 0.15 } }], [0.8, { bun: { fl: 1 } }], [2.4, { cr: { steam: 1, solc: C.cuw, hot: 0.4 } }], [1.0, { cr: { steam: 0.2 } }], [0.4, { n2: { vis: 1, lab: 'blue → white: water driven off' } }]] },
    { t: 'Cool, then weigh → C', d: '~Cool~ the crucible and contents (in a ‹desiccator›), then ~weigh~ and record the total mass again.', why: 'Weigh at room temperature. Hot air rising from a hot crucible lifts it slightly, so it reads lighter than its true mass. The desiccator keeps the air dry so the anhydrous solid does not reabsorb moisture.', cam: [0.2, 2.6, 7.2, 0, 0.6, 0],
      ph: [[0.5, { bun: { fl: 0 }, n2: { vis: 0 }, cr: { steam: 0 } }], [0.6, { des: { lid: 0 } }], [1.2, { cr: { x: 2.7, y: 0.27, z: 0.1 } }], [0.6, { des: { lid: 1 } }], [1.4, { cr: { hot: 0 } }], [0.6, { des: { lid: 0 } }], [1.3, { cr: { x: -2.6, y: 0.33, z: 0.4 } }], [0.6, { des: { lid: 1 }, bal: { rd: 21.70 } }], [0.3, { n1: { vis: 1, lab: 'C = 21.70 g' } }]] },
    { t: 'Repeat to constant mass → D, D', d: '~Repeat~ the heating–cooling–weighing process until a «constant mass» is achieved.', why: 'Constant mass shows the sample is completely decomposed. Possible error: uneven heating can leave part of the sample undecomposed.', cam: [0.2, 2.6, 7.2, 0, 0.6, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.0, { cr: { x: 0.7, y: 1.11, z: 0 }, bal: { rd: 0 } }], [0.4, { bun: { fl: 1 } }], [1.4, { cr: { hot: 0.4, steam: 0.1 } }], [0.4, { bun: { fl: 0 }, cr: { steam: 0 } }], [1.2, { cr: { x: -2.6, y: 0.33, z: 0.4, hot: 0 } }], [0.6, { bal: { rd: 21.62 } }], [0.3, { n1: { vis: 1, lab: 'D = 21.62 g, then 21.62 g ✓' } }]],
      dg: [{ k: 'table', h: 'Tabulation of results', head: ['Measurement', 'Label', 'Sample / g'], rows: [['Mass of empty crucible / g', 'A', '18.42'], ['Mass of crucible and $CuSO4.nH2O$ / g', 'B', '23.43'], ['Mass after first heating / g', 'C', '21.70'], ['Mass after second heating / g', 'D', '21.62'], ['Mass after third heating / g', 'D', '21.62']] }, { k: 'graph', g: 'massHeat' }] },
    { t: 'Analysis: find n', d: 'Use A, B and D to find the amounts of $CuSO4$ and $H2O$, then their ratio.',
      dg: [{ k: 'calc', h: 'Value of n', l: ['$CuSO4.nH2O$(s) → $CuSO4$(s) + n$H2O$(g)', 'Mass of $CuSO4$ left = (D − A) g; M<sub>r</sub> = 159.6', 'n($CuSO4$) = (D − A) / 159.6 mol', 'Mass of $H2O$ driven off = (B − D) g', 'n($H2O$) = (B − D) / 18.0 mol', 'n = n($H2O$) / n($CuSO4$) = <b>(159.6 / 18.0) × (B − D) / (D − A)</b>', 'Sample: 8.867 × 1.81 / 3.20 = 5.0'] }] }
  ]
});

EX.push({
  id: 'grav-we2', topic: 3, tag: 'WE2', name: '% NaHCO₃ in a mixture',
  q: '$Na2CO3$ does not decompose on heating with a Bunsen burner; $NaHCO3$ does: 2$NaHCO3$(s) → $Na2CO3$(s) + $H2O$(g) + $CO2$(g). Plan to find the percentage by mass of $NaHCO3$ in a mixture by heating and weighing alone. Available: 2 g of mixture, a boiling tube and a holder, weighing balance, Bunsen burner.',
  tamp: { T: 'Gravimetry: thermal decomposition.', A: '"A boiling tube and a holder": heat in a boiling tube.', M: 'Three masses: empty tube A, tube + sample B, after heating D.', P: 'Weigh → heat gently then strongly → cool → weigh → repeat to constant mass.' },
  cam: [-0.4, 3.0, 8.0, -0.4, 1.0, 0],
  actors: [
    ['bal', 'balance', { x: -2.4, z: 0.1, lab: 'weighing balance' }],
    ['bt', 'btube', { x: -2.4, y: 0.33, z: 0.1, holder: true, lab: 'boiling tube + holder' }],
    ['wb', 'wbottle', { x: -1.1, z: 0.7, sol: 0.6, solc: C.wh, lab: 'NaHCO₃ / Na₂CO₃ mixture' }],
    ['bun', 'bunsen', { x: 1.0, lab: 'Bunsen burner' }],
    ['n1', 'note', { x: -2.4, y: 2.4, z: 0.1, vis: 0 }],
    ['n2', 'note', { x: 1.6, y: 2.6, vis: 0 }]
  ],
  steps: [
    { t: 'Weigh the empty boiling tube → A', d: 'Using an analytical ‹weighing balance›, ~weigh~ an empty, dry and clean ‹boiling tube› and record its mass.', cam: [-1.7, 2.3, 4.0, -2.4, 1.0, 0.1], ph: [[1.0, { bal: { rd: 24.15 } }], [0.3, { n1: { vis: 1, lab: 'A = 24.15 g' } }]] },
    { t: 'Add ~2.00 g of mixture → B', d: '~Transfer~ about «2.00 g» of the mixture into the boiling tube. ~Weigh~ the tube and contents and record the total mass.', cam: [-1.7, 2.3, 4.0, -2.4, 1.0, 0.1],
      ph: [[0.3, { n1: { vis: 0 } }], [0.9, { wb: P('wb', 1, -2.45, 2.0, 0.1) }], [1.2, { wb: { sol: 0.05 }, bt: { sol: 0.22 }, bal: { rd: 26.15 } }], [0.8, { wb: { x: -1.1, y: 0, z: 0.7, rz: 0 } }], [0.3, { n1: { vis: 1, lab: 'B = 26.15 g' } }]] },
    { t: 'Heat gently, then strongly for 10 min', d: 'Using a ‹Bunsen burner›, ~heat~ the boiling tube and contents gently at first, then strongly for «10 minutes». Make sure the water droplets that condense on the cooler parts of the tube are also driven off.', safe: 'Hold the tube with a test-tube holder, keep it moving up and down so one spot is not overheated (prevents spurting), and point the mouth away from yourself and others.', cam: [1.4, 2.4, 4.6, 0.8, 1.3, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.3, { bt: { x: 0.95, y: 1.2, z: 0, rz: 0.8 }, bal: { rd: 0 } }], [0.5, { bun: { fl: 0.55 } }], [1.6, { bt: { steam: 0.5, cond: 1, shake: 0.2 } }], [0.6, { bun: { fl: 1 } }], [2.2, { bt: { cond: 0, steam: 0.3, sol: 0.18 } }], [0.6, { bt: { steam: 0, shake: 0 } }], [0.4, { n2: { vis: 1, lab: 'droplets on the cool walls must be driven off' } }]] },
    { t: 'Cool, then weigh → C', d: 'Allow the boiling tube and contents to ~cool~, then ~weigh~ and record the total mass.', cam: [-0.6, 2.6, 6.4, -1.0, 1.0, 0],
      ph: [[0.4, { bun: { fl: 0 }, n2: { vis: 0 } }], [1.4, { bt: { x: -2.4, y: 0.33, z: 0.1, rz: 0 } }], [0.6, { bal: { rd: 25.82 } }], [0.3, { n1: { vis: 1, lab: 'C = 25.82 g' } }]] },
    { t: 'Repeat to constant mass → D', d: '~Repeat~ the heating–cooling–weighing process until a «constant mass» is achieved.', cam: [-0.6, 2.6, 6.4, -1.0, 1.0, 0],
      ph: [[0.3, { n1: { vis: 0 } }], [1.2, { bt: { x: 0.95, y: 1.2, z: 0, rz: 0.8 }, bal: { rd: 0 } }], [0.4, { bun: { fl: 1 } }], [1.4, { bt: { shake: 0.2 } }], [0.4, { bun: { fl: 0 }, bt: { shake: 0 } }], [1.2, { bt: { x: -2.4, y: 0.33, z: 0.1, rz: 0 } }], [0.6, { bal: { rd: 25.78 } }], [0.3, { n1: { vis: 1, lab: 'D = 25.78 g, then 25.78 g ✓' } }]],
      dg: [{ k: 'table', h: 'Tabulation of results', head: ['Measurement', 'Label'], rows: [['Mass of empty boiling tube / g', 'A'], ['Mass of boiling tube and sample / g', 'B'], ['Mass after first heating / g', 'C'], ['Mass after second heating / g', 'D'], ['Mass after third heating / g', 'D']] }] },
    { t: 'Analysis + crucible vs boiling tube', d: 'Mass lost (B − D) is the $H2O$ and $CO2$ given off. One mole of each is lost per 2 mol $NaHCO3$.',
      dg: [{ k: 'calc', h: '% by mass of NaHCO₃', l: ['Mass of mixture = (B − A) g; mass of $H2O$ + $CO2$ lost = (B − D) g', '1 mol $H2O$ + 1 mol $CO2$ = 18.0 + 44.0 = 62.0 g', 'n($H2O$) lost = n($CO2$) lost = (B − D) / 62.0 mol', 'n($NaHCO3$) = 2(B − D) / 62.0 = (B − D) / 31.0 mol', 'mass of $NaHCO3$ = 84.0(B − D) / 31.0 g', '% $NaHCO3$ = <b>8400(B − D) / [31.0(B − A)] %</b>'] }, { k: 'list', h: '(b) Why a crucible without a lid can be better', items: ['In an open crucible, water vapour is lost more easily.', 'In a boiling tube, water vapour condenses on the cooler upper walls as droplets, so further heating is needed to remove them.'] }] }
  ]
});

/* ============ 4 · GRAVIMETRY 2 (precipitation) ============ */
EX.push({
  id: 'grav-we3', topic: 4, tag: 'WE3', name: 'PbCO₃ contaminated with BaCO₃',
  q: 'A $PbCO3$ sample is contaminated with solid $BaCO3$. Its percentage purity is found gravimetrically: dissolve in dilute $HNO3$, precipitate $PbCl2$ with hot dilute $HCl$, filter, wash, dry, cool and weigh.',
  tamp: { T: 'Gravimetry: precipitation.', A: '$Cl^-$ precipitates $Pb^2+$ but not $Ba^2+$. Sample must be dissolved first.', M: 'Mass of sample (0.5 g); mass of dry $PbCl2$, m g.', P: 'Dissolve → precipitate → settle → filter → wash → dry → cool → weigh → repeat to constant mass.' },
  cam: [0, 3.6, 10.2, 0, 1.0, 0],
  actors: [
    ['bal', 'balance', { x: -3.6, z: 0.6, lab: 'balance' }],
    ['bk', 'beaker', { x: -3.6, y: 0.33, z: 0.6, s: 0.75, lab: 'small beaker' }],
    ['mcN', 'mcyl', { x: -2.8, z: -0.6, s: 0.7, lv: 0.7, lab: 'dilute HNO₃' }],
    ['mcH', 'mcyl', { x: -1.6, z: -0.6, s: 0.7, lv: 0.7, lab: 'hot dilute HCl' }],
    ['rod', 'grod', { x: -2.25, y: 0.05, z: 0.3, rz: 0.22, vis: 0 }],
    ['tt', 'btube', { x: -0.9, z: 0.9, s: 0.65, vis: 0, lab: 'test tube' }],
    ['drp', 'dropper', { x: -0.9, y: 1.3, z: 0.9, vis: 0, dripY: 0.5, lab: 'conc. HCl' }],
    ['cf', 'conical', { x: 0.6, lab: 'filtrate' }],
    ['fun', 'funnel', { x: 0.6, y: 1.05, s: 0.8, paper: true, dripY: 0.3, lab: 'funnel + filter paper' }],
    ['wash', 'washb', { x: -0.16, y: 0.41, z: 0, vis: 0, dripY: 1.5, lab: 'cold deionised water' }],
    ['cr', 'crucible', { x: 1.9, z: 0.6, sol: 0, solc: C.wh, lab: 'pre-weighed crucible' }],
    ['des', 'desic', { x: 1.9, z: -0.9, lab: 'desiccator' }],
    ['oven', 'oven', { x: 3.6, z: -0.3, lab: 'oven' }],
    ['n1', 'note', { x: -0.9, y: 2.0, z: 0.9, vis: 0 }]
  ],
  steps: [
    { t: 'Weigh 0.5 g of sample', d: '~Weigh~ accurately «0.5 g» of the sample into a ‹small beaker›.', cam: [-3.0, 1.9, 3.4, -3.6, 0.5, 0.5], ph: [[1.3, { bk: { ppt: 0.12 }, bal: { rd: 0.50 } }]] },
    { t: 'Dissolve in dilute HNO₃', d: '~Add~ «20 cm³ of dilute $HNO3$» to the sample. ~Stir~ and mix well.', why: 'The sample and the precipitating agent must both be in solution. If the solid were left, the precipitate would coat it and stop further reaction.', cam: [-2.4, 2.2, 4.6, -2.6, 0.8, 0.1],
      ph: [[0.8, { bk: { x: -2.2, y: 0, z: 0.3 }, bal: { rd: 0 } }], [0.9, { mcN: P('mcyl', 0.7, -2.27, 0.95, 0.3) }], [0.3, { mcN: { pour: 1, py: 0.3 } }], [1.4, { mcN: { lv: 0.04 }, bk: { lv: 0.3, fizz: 0.8 } }], [0.3, { mcN: { pour: 0 } }], [0.8, { mcN: { x: -2.8, y: 0, z: -0.6, rz: 0 } }], [0.4, { rod: { vis: 1 } }], [1.4, { rod: { swirl: 1 }, bk: { ppt: 0, fizz: 0.2 } }], [0.4, { rod: { swirl: 0 }, bk: { fizz: 0 } }]] },
    { t: 'Add hot dilute HCl → PbCl₂', d: '~Add~ «20 cm³ of hot dilute $HCl$» (about «0.200 mol dm⁻³») and ~stir~ vigorously. White $PbCl2$ precipitates; $Ba^2+$ stays in solution.', why: 'Dilute $H2SO4$ would not work: sulfate would precipitate both $Pb^2+$ and $Ba^2+$.', cam: [-2.4, 2.2, 4.6, -2.6, 0.8, 0.1],
      ph: [[0.9, { mcH: P('mcyl', 0.7, -2.27, 0.95, 0.3) }], [0.3, { mcH: { pour: 1, py: 0.3 } }], [1.4, { mcH: { lv: 0.04 }, bk: { lv: 0.55, ppt: 0.25, col: C.cloudy } }], [0.3, { mcH: { pour: 0 } }], [0.8, { mcH: { x: -1.6, y: 0, z: -0.6, rz: 0 } }], [1.4, { rod: { swirl: 1.4 } }], [0.4, { rod: { swirl: 0 } }]],
      dg: [{ k: 'calc', h: 'Suitable [HCl]', l: ['Assume the sample is 100% $PbCO3$', 'n($PbCO3$) = 0.5 / 267.2 = 1.8713 × 10⁻³ mol', 'n($Cl^-$) needed = 2 × 1.8713 × 10⁻³ = 3.7425 × 10⁻³ mol', '[$HCl$] needed = 3.7425 × 10⁻³ / (20 × 10⁻³) = 0.187 mol dm⁻³', 'Use <b>0.200 mol dm⁻³</b>. Anything above 0.187 works, but keep it ≤ 2 mol dm⁻³ as the acid is corrosive.'] }] },
    { t: 'Cool, settle, check completeness', d: 'Allow the mixture to ~cool~ and the precipitate to ~settle~. To check that all $Pb^2+$ has precipitated, ~decant~ a little of the clear solution and add a few drops of concentrated $HCl$.', why: 'No new precipitate means all the $Pb^2+$ is already in the precipitate.', cam: [-1.6, 2.2, 4.6, -1.6, 0.8, 0.6],
      ph: [[1.2, { rod: { vis: 0 }, bk: { col: C.w } }], [0.4, { tt: { vis: 1 } }], [1.0, { bk: P('beaker', 0.75, -0.95, 1.15, 0.9) }], [0.3, { bk: { pour: 0.5, py: 0.35 } }], [0.8, { bk: { lv: 0.5 }, tt: { lv: 0.25 } }], [0.2, { bk: { pour: 0 } }], [0.9, { bk: { x: -2.2, y: 0, z: 0.3, rz: 0 } }], [0.4, { drp: { vis: 1 } }], [0.9, { drp: { drip: 0.6 } }], [0.3, { drp: { drip: 0, vis: 0 } }], [0.4, { n1: { vis: 1, lab: 'no precipitate → all Pb²⁺ removed' } }]] },
    { t: 'Filter and wash', d: '~Filter~ the mixture and ~wash~ the precipitate with a suitable solvent: «cold» deionised water.', why: '$PbCl2$ is soluble in hot water, so wash with cold water.', cam: [0.2, 2.6, 5.2, 0.3, 1.2, 0],
      ph: [[0.3, { n1: { vis: 0 }, tt: { vis: 0 } }], [1.0, { bk: P('beaker', 0.75, 0.42, 2.0, 0) }], [0.3, { bk: { pour: 1, py: 1.4 } }], [1.8, { bk: { lv: 0.02, ppt: 0 }, fun: { ppt: 0.45, lv: 0.4, drip: 1 }, cf: { lv: 0.25 } }], [0.3, { bk: { pour: 0 } }], [0.9, { bk: { x: -2.2, y: 0, z: 0.3, rz: 0, lv: 0 } }], [0.4, { wash: { vis: 1 } }], [1.4, { wash: { drip: 1 }, fun: { lv: 0.3 } }], [0.4, { wash: { drip: 0, vis: 0 } }], [0.8, { fun: { lv: 0, drip: 0 }, cf: { lv: 0.32 } }]] },
    { t: 'Transfer to the crucible', d: '~Transfer~ the precipitate into a ‹pre-weighed crucible›.', cam: [1.2, 2.2, 4.4, 1.3, 0.8, 0.3], ph: [[1.6, { fun: { ppt: 0 }, cr: { sol: 0.3 } }]] },
    { t: 'Dry in the oven', d: '~Dry~ the precipitate and crucible in the ‹oven› for about «10 min».', cam: [3.0, 2.4, 4.8, 3.2, 0.8, -0.3],
      ph: [[0.5, { oven: { on: 1 } }], [1.4, { cr: { x: 3.4, y: 0.48, z: -0.3 } }], [2.0, { cr: { hot: 0.2 } }]] },
    { t: 'Cool in a desiccator', d: '~Cool~ the precipitate and crucible in a ‹desiccator›.', cam: [2.6, 2.4, 4.6, 2.4, 0.5, -0.6],
      ph: [[0.5, { oven: { on: 0 }, des: { lid: 0 } }], [1.4, { cr: { x: 1.9, y: 0.27, z: -0.9 } }], [0.6, { des: { lid: 1 } }], [1.4, { cr: { hot: 0 } }]] },
    { t: 'Weigh; repeat to constant mass', d: '~Weigh~ the precipitate and crucible. ~Repeat~ drying, cooling and weighing until a «constant mass» is obtained.', why: 'Constant mass ensures the precipitate is completely dry. This is the key improvement to the original 9-step procedure.', cam: [-2.4, 2.4, 5.2, -2.6, 0.6, 0.4],
      ph: [[0.6, { des: { lid: 0 } }], [1.6, { cr: { x: -3.6, y: 0.33, z: 0.6 } }], [0.6, { des: { lid: 1 }, bal: { rd: 16.79 } }]],
      dg: [{ k: 'calc', h: 'Percentage purity (m g of PbCl₂)', l: ['M<sub>r</sub>: $PbCl2$ = 278.2; $PbCO3$ = 267.2', 'n($PbCl2$) = m / 278.2 mol = n($PbCO3$)', 'mass of $PbCO3$ = m / 278.2 × 267.2 = 0.9604 m g', '% purity = 0.9604 m / 0.5 × 100 = <b>192 m %</b>'] }] }
  ]
});
