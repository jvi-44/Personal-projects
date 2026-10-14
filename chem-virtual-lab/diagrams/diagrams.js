/* The diagrams themselves. Each: section, title, where it is used, drawing, must-show checklist. */
const SECTIONS = [
  { id: 'vol', name: 'Volumetric analysis' }, { id: 'grav', name: 'Gravimetry' }, { id: 'gas', name: 'Gas collection' },
  { id: 'en', name: 'Energetics' }, { id: 'kin', name: 'Kinetics' }, { id: 'eq', name: 'Equilibria' },
  { id: 'ec', name: 'Electrochemistry' }, { id: 'org', name: 'Organic synthesis' }
];
const DIA = [];
const D = o => DIA.push(o);

/* ---------- volumetric ---------- */
D({ sec: 'vol', title: 'Titration set-up', from: 'Volumetric WE1, WE2 · Equilibria WE1, WE3 · Kinetics WE11', w: 420, h: 340, draw() {
  let s = stand(110, 330, 22, 70, 250) + clamp(110, 95, 200, 9);
  s += burette(200, 26, 196, 46);
  s += `<rect class="gl wf" x="148" y="314" width="104" height="8"/>`;
  s += conical(200, 314, { w: 84, h: 96, level: 0.36 }).s;
  s += lab('50.00 cm³ burette', 206, 70, 270, 62) + lab('HCl(aq) — name the\nsolution in the burette', 206, 130, 270, 128) + lab('meniscus: read the bottom,\nat eye level', 206, 46, 270, 30) + lab('tap', 212, 199, 270, 196);
  s += lab('250 cm³ conical flask', 224, 260, 270, 250) + lab('25.0 cm³ FA 3 + 2 drops\nmethyl orange', 214, 298, 270, 292) + lab('white tile', 246, 318, 270, 330) + lab('retort stand\nand clamp', 110, 200, 60, 200, 'end');
  return s; },
  must: ['Burette clamped <b>vertically</b>; tip just inside the neck of the flask.', 'Label the solution in the burette <b>and</b> the solution (with volume) in the conical flask.', 'Conical flask on a <b>white tile</b> (makes the colour change easy to see).', 'Capacities: 50.00 cm³ burette, 250 cm³ conical flask.'] });

D({ sec: 'vol', title: 'Making up a standard solution', from: 'Volumetric WE1 (solid) · WE2 and micro-titration (dilution)', w: 420, h: 330, draw() {
  const v = vflask(150, 318, { level: 1 });
  let s = v.s + dropper(150, 108, 40) + drops(150, 118, 2);
  s += `<path class="gl wf" d="M300,250 L302,262 L314,262 L316,250 L320,244 L296,244 Z"/>`;
  s += lab('dropping pipette: add\ndeionised water drop by drop\nnear the mark', 154, 70, 230, 64) + lab('graduation mark: bottom of\nmeniscus on the mark, at eye level', 158, 153, 230, 140) + lab('250 cm³ graduated\n(volumetric) flask', 190, 260, 230, 214) + lab('solution', 150, 290, 110, 300, 'end') + lab('stopper, then invert\nand shake', 308, 248, 330, 300, 'middle');
  return s; },
  must: ['Neck with a single <b>graduation mark</b>; capacity stated (250 cm³ or 100 cm³).', 'Liquid level at the mark (bottom of meniscus).', 'Dissolve the solid in a beaker first; transfer with a funnel and glass rod, rinsing the washings in.', 'For a dilution, run the stock solution in from a <b>burette</b> (or pipette).'] });

D({ sec: 'vol', title: 'Micro-titration', from: 'Volumetric: checking concentrations', w: 420, h: 300, draw() {
  let s = btube(130, 110, 285, 13, 262) + dropper(130, 82, 40) + drops(130, 92, 3);
  s += lab('dropping pipette with FA 1\n(acts like the burette)', 134, 30, 200, 30) + lab('drops counted: D(FA 1)', 132, 100, 200, 96) + lab('boiling tube', 143, 180, 200, 170) + lab('10 drops of FA 2 (+ indicator)\n(acts like the conical flask)', 140, 270, 200, 262);
  return s; },
  must: ['10 drops of FA 2 in a boiling tube; FA 1 added from a dropping pipette.', 'Rinse the dropper with deionised water, then with FA 1, before adding FA 1.', 'Shake after each drop; count drops to the colour change.', 'V(FA 1) ≈ D(FA 1)/10 × 25.0 cm³.'] });

/* ---------- gravimetry ---------- */
D({ sec: 'grav', title: 'Heating a solid in a crucible', from: 'Gravimetry WE1 (CuSO₄·nH₂O) · Equilibria WE2 uses an evaporating dish the same way', w: 420, h: 320, draw() {
  let s = tripod(180, 170, 96, 312) + pipeclay(180, 168, 70);
  s += crucible(180, 132, { wt: 60, wb: 34, h: 42, fill: 0.45, lid: true });
  s += bunsen(180, 312, 66);
  s += lab('crucible lid (optional)', 200, 124, 260, 106) + lab('crucible', 204, 140, 260, 136) + lab('hydrated solid', 186, 160, 260, 160) + lab('pipe-clay triangle', 214, 168, 260, 184) + lab('tripod', 232, 240, 260, 252) + lab('Bunsen burner', 186, 280, 260, 280) + lab('heat gently at first,\nthen strongly for 10 min', 182, 206, 260, 216);
  return s; },
  must: ['Crucible sitting <b>in a pipe-clay triangle</b> on a tripod.', 'Bunsen burner directly underneath.', 'Heat gently first (stops spattering), then strongly; then cool and weigh; repeat to constant mass.', 'Use crucible tongs to handle the hot crucible.'] });

D({ sec: 'grav', title: 'Heating in a boiling tube', from: 'Gravimetry WE2 (NaHCO₃ / Na₂CO₃)', w: 420, h: 310, draw() {
  let s = `<line class="hold" x1="102" y1="112" x2="54" y2="172"/>`;
  s += `<g transform="translate(205,190) rotate(-52)">` + `<path class="sol" d="M-13,-26 L-13,-13 A13,13 0 0 0 13,-13 L13,-26 Z"/><path class="gl" d="M-13,-150 L-13,-13 A13,13 0 0 0 13,-13 L13,-150"/>` + `<rect class="mt" x="-17" y="-128" width="34" height="7"/>` + [[-9, -96], [7, -104], [-4, -112], [9, -84]].map(p => `<circle class="liqs" cx="${p[0]}" cy="${p[1]}" r="2"/>`).join('') + '</g>';
  s += bunsen(208, 302, 52);
  s += lab('boiling tube: mouth pointing away\nfrom yourself and others', 90, 96, 30, 40, 'start') + lab('test-tube holder', 70, 152, 30, 200, 'start') + lab('mixture of NaHCO₃\nand Na₂CO₃', 196, 180, 270, 170) + lab('water droplets condense on the\ncool walls: heat them off too', 132, 132, 270, 112) + lab('Bunsen burner', 214, 262, 270, 262);
  return s; },
  must: ['Tube held with a <b>test-tube holder</b>, tilted, mouth pointing away from people.', 'Move the tube in the flame so it is not heated at one spot (prevents spurting).', 'Condensed water on the cool upper walls must also be driven off.', 'A crucible without a lid lets water vapour escape more easily.'] });

D({ sec: 'grav', title: 'Desiccator', from: 'Gravimetry WE1, WE3 · Electrochemistry WE4', w: 420, h: 280, draw() {
  let s = desic(170, 262) + crucible(170, 192, { wt: 46, wb: 26, h: 38, fill: 0.4 });
  s += lab('air-tight lid', 196, 168, 260, 150) + lab('crucible cooling in\na dry atmosphere', 190, 210, 260, 200) + lab('perforated plate', 214, 232, 260, 236) + lab('drying agent\n(anhydrous CaCl₂)', 205, 252, 260, 268);
  return s; },
  must: ['Air-tight lid, perforated plate, drying agent underneath.', 'Why: lets the hot crucible cool to room temperature without absorbing moisture.', 'Weigh only when cool: hot air rising makes the reading too low.'] });

D({ sec: 'grav', title: 'Gravity filtration', from: 'Gravimetry WE3 (PbCl₂) · Equilibria WE2, WE3 (dry apparatus)', w: 420, h: 320, draw() {
  let s = conical(170, 310, { w: 84, h: 96, level: 0.28 }).s + funnel(170, 150, 96, 44, true);
  s += `<path class="sol" d="M158,192 L170,208 L182,192 Z"/>`;
  s += lab('filter funnel', 214, 152, 260, 140) + lab('filter paper', 200, 172, 260, 168) + lab('residue (precipitate)', 176, 198, 260, 196) + lab('filtrate', 182, 296, 260, 296) + lab('conical flask', 204, 260, 260, 252);
  return s; },
  must: ['Funnel lined with folded filter paper; stem inside the flask neck.', 'Label <b>residue</b> on the paper and <b>filtrate</b> below.', 'Wash the precipitate with cold deionised water (PbCl₂ dissolves in hot water).', 'For saturated solutions: dry funnel, dry filter paper, dry flask.'] });

/* ---------- gas ---------- */
D({ sec: 'gas', title: 'Gas syringe set-up', from: 'Gas collection WE4 (O₂ from H₂O₂), WE5 (CO₂ from Na₂CO₃)', w: 440, h: 350, draw() {
  const c = conical(100, 318, { w: 90, h: 104, side: true, stopper: true, level: 0.32 });
  let s = c.s;
  s += `<path class="str" d="M88,262 L93,214 L95,200 L90,184"/>` + btube(88, 262, 292, 7, 270, { solid: true });
  s += tube([[c.arm[0], c.arm[1]], [168, c.arm[1] - 2], [184, 196], [190, 176], [204, 172]]);
  s += syringe(212, 172, 150, 0.42);
  s += stand(300, 318, 130, 260, 350) + `<rect class="mt" x="294" y="158" width="12" height="28"/>`;
  s += lab('100 cm³ graduated gas syringe', 290, 160, 290, 126, 'middle') + lab('plunger moves out', 356, 172, 390, 214, 'middle') + lab('rubber tubing', 180, 206, 222, 236) + lab('stopper', 112, 207, 150, 140) + lab('conical flask with side arm', 140, 286, 168, 298) + lab('small tube of MnO₂(s)\ntied to a string', 84, 278, 6, 168, 'start') + lab('40.00 cm³ H₂O₂(aq)', 70, 306, 30, 340, 'start') + lab('retort stand', 300, 260, 340, 270);
  return s; },
  must: ['Solid in a <b>small tube tied to a string</b>, hung above the liquid so they do not mix until the stopper is loosened.', 'Flask stoppered; side arm connected by rubber tubing to a <b>graduated gas syringe</b>, clamped.', 'Syringe reads zero at the start; read again when the reading is constant.', 'Capacity stated (100 cm³); plan for 50–90% of it.'] });

D({ sec: 'gas', title: 'Collecting over water: inverted measuring cylinder', from: 'Gas collection: methods', w: 480, h: 350, draw() {
  const c = conical(80, 318, { w: 84, h: 98, stopper: true, level: 0.3, ppt: 7 });
  let s = c.s;
  s += trough(170, 380, 214, 318, 236);
  s += tube([[80, 208], [80, 150], [150, 150], [178, 178], [186, 300], [250, 300], [262, 286]], true);
  s += invcyl(270, 96, 280, 40, 64);
  for (const [x, y] of [[266, 270], [272, 250], [268, 226], [274, 204]]) s += `<circle class="gl wf" cx="${x}" cy="${y}" r="3"/>`;
  s += `<rect class="mt" x="420" y="310" width="50" height="8"/><line class="rod" x1="456" y1="310" x2="456" y2="120"/>` + `<rect class="mt" x="451" y="144" width="10" height="12"/><line class="rod2" x1="451" y1="150" x2="296" y2="150"/><path class="gl" d="M296,143 L292,143 L292,157 L296,157"/>`;
  s += lab('100 cm³ measuring cylinder,\nfilled with water, inverted', 290, 200, 300, 176, 'start') + lab('gas collected', 290, 124, 300, 108, 'start') + lab('delivery tube', 120, 150, 120, 126, 'middle') + lab('trough of water', 360, 300, 400, 336, 'middle') + lab('bubbles of gas', 276, 250, 330, 262) + lab('Zn + HCl(aq)', 80, 302, 60, 340, 'start');
  return s; },
  must: ['Cylinder full of water, inverted, mouth <b>under</b> the water in the trough; clamped.', 'Delivery tube end under the mouth of the cylinder.', 'Volume = final − initial reading.', 'Only for gases that are insoluble or poorly soluble in water (not CO₂, NH₃, SO₂, NO₂, HX).'] });

D({ sec: 'gas', title: 'Collecting over water: inverted burette', from: 'Gas collection: methods', w: 420, h: 330, draw() {
  let s = trough(110, 300, 214, 318, 236);
  s += invcyl(200, 30, 284, 14, 54, { tap: true });
  s += tube([[60, 150], [100, 150], [128, 180], [138, 302], [190, 302], [198, 290]], true);
  s += `<circle class="gl wf" cx="200" cy="270" r="2.5"/><circle class="gl wf" cx="199" cy="240" r="2.5"/>`;
  s += lab('tap closed (at the top)', 209, 18, 260, 18) + lab('gas collected', 205, 56, 260, 62) + lab('burette full of water,\ninverted (scale upside down)', 207, 150, 260, 140) + lab('trough of water', 290, 300, 330, 300) + lab('from reaction flask', 70, 150, 60, 128, 'middle');
  s += note('volume = initial − final reading\n(maximum 50.00 cm³)', 120, 336 - 6, 'start', 'nt');
  return s; },
  must: ['Burette filled with water, inverted, tap at the top closed.', 'Readings fall as gas collects: volume = initial − final.', 'Can only hold 50.00 cm³ of gas.'] });

/* ---------- energetics ---------- */
D({ sec: 'en', title: 'Calorimeter: polystyrene cup', from: 'Energetics WE6 (ΔH soln), temperature–time method, WE8', w: 420, h: 320, draw() {
  let s = cup(170, 310, 0.45) + thermo(188, 50, 284);
  s += lab('thermometer (also used to stir)', 191, 90, 250, 70) + lab('lid', 214, 203, 250, 190) + lab('polystyrene (Styrofoam) cup', 212, 236, 250, 226) + lab('reaction mixture\n(≤ half the cup)', 160, 282, 250, 280) + lab('250 cm³ beaker\n(supports the cup)', 220, 306, 250, 318);
  return s; },
  must: ['Polystyrene cup <b>inside a 250 cm³ beaker</b>, with a lid.', 'Thermometer through the lid, bulb in the solution.', 'Solution no more than half the cup, so a solid can be added without spilling.'] });

D({ sec: 'en', title: 'Thermometric titration', from: 'Energetics WE7', w: 420, h: 340, draw() {
  let s = stand(80, 330, 20, 40, 200) + clamp(80, 80, 170, 9) + burette(170, 22, 172, 38);
  s += cup(170, 330, 0.3) + thermo(196, 140, 304);
  s += lab('burette containing FA 2\n(H₂SO₄), added 3.00 cm³ at a time', 176, 60, 220, 50) + lab('thermometer', 199, 170, 250, 160) + lab('Styrofoam cup + lid', 214, 240, 250, 228) + lab('25.0 cm³ FA 1 (NaOH)', 186, 310, 250, 300) + lab('beaker', 216, 324, 250, 334) + lab('clamp', 120, 80, 120, 110, 'middle');
  return s; },
  must: ['Burette clamped above the cup; thermometer in the solution.', 'Record the highest temperature after each 3.00 cm³ portion.', 'Continue well past the end-point (≥ 5 readings after it).'] });

D({ sec: 'en', title: 'Enthalpy change of combustion', from: 'Energetics WE9 (5-decyne / cis-dec-5-ene; calibrate with hexane)', w: 440, h: 350, draw() {
  let s = stand(60, 340, 30, 20, 120) + clamp(60, 66, 200, 7);
  s += calor(190, 232, 92, 92, 0.75);
  s += gauze(190, 236, 140) + tripod(190, 236, 112, 340);
  s += lamp(190, 340, 40, 18);
  s += thermo(200, 44, 218);
  s += `<line class="shield" x1="112" y1="340" x2="112" y2="118"/><line class="shield" x1="272" y1="340" x2="272" y2="118"/>`;
  s += lab('thermometer', 203, 100, 300, 70) + lab('metal calorimeter', 236, 160, 300, 150) + lab('100 cm³ water', 214, 214, 300, 190) + lab('wire gauze', 240, 234, 300, 228) + lab('tripod', 250, 300, 300, 290) + lab('spirit lamp with fuel', 210, 330, 300, 336) + lab('wind shield', 272, 250, 300, 254) + lab('retort stand', 60, 200, 30, 180, 'end');
  return s; },
  must: ['Spirit lamp (wick partly in fuel) <b>under</b> the calorimeter.', 'Calorimeter on a tripod and wire gauze; thermometer clamped and immersed in the water.', 'Wind shield around the set-up.', 'Weigh lamp + fuel before and after; stop when ΔT ≈ 5–10 °C.'] });

/* ---------- kinetics ---------- */
D({ sec: 'kin', title: 'Iodine clock reaction', from: 'Kinetics WE10', w: 470, h: 310, draw() {
  let s = `<rect class="gl wf" x="90" y="282" width="130" height="8"/>` + beaker(155, 282, 92, 104, 0.6) + watch(330, 250);
  s += mcyl(155, 98, 70, 18, 0.5);
  s += arrow(155, 104, 155, 172) + lab('10 cm³ measuring cylinder:\nadd Na₂S₂O₈ LAST', 164, 50, 230, 40);
  s += lab('100 cm³ beaker: KI, Na₂S₂O₃,\nwater and starch', 196, 236, 250, 150) + lab('white tile', 210, 288, 250, 302) + lab('stopwatch: start as Na₂S₂O₈\ngoes in; stop at blue-black', 346, 246, 360, 220, 'start');
  return s; },
  must: ['Total volume constant in every run (vary water).', 'Last reagent added starts the stopwatch.', 'White tile under the beaker to see the blue-black colour.'] });

/* ---------- equilibria ---------- */
D({ sec: 'eq', title: 'Separating funnel', from: 'Equilibria WE1 (K<sub>D</sub>) · Organic WE6 (extraction)', w: 420, h: 340, draw() {
  let s = stand(70, 332, 40, 40, 140) + `<line class="rod2" x1="75" y1="140" x2="140" y2="140"/>` + ring(170, 140, 32);
  s += sepf(170, 70, { l1: 100, l2: 38 });
  s += beaker(170, 332, 90, 74, 0.25);
  s += lab('stopper', 180, 56, 240, 40) + lab('upper layer (less dense,\ne.g. water, ether)', 196, 124, 240, 100) + lab('lower layer (denser, e.g. DCM)', 196, 176, 240, 162) + lab('ring on retort stand', 140, 140, 84, 22, 'start') + lab('tap', 187, 210, 240, 214) + lab('beaker', 218, 300, 240, 306);
  return s; },
  must: ['Pear-shaped funnel with stopper and tap, supported in a ring.', 'Two layers: the <b>denser</b> one at the bottom (DCM 1.33 &gt; water 1.00 &gt; ether 0.71).', 'Shake with the tap pointing up; open the tap briefly to release pressure.', 'Remove the stopper before running off the lower layer.'] });

D({ sec: 'eq', title: 'Saturated solution at constant temperature', from: 'Equilibria WE2 (Ce(SO₄)₂), WE3 (KHT)', w: 440, h: 320, draw() {
  let s = bath(40, 290, 160, 312, 196) + conical(165, 306, { w: 84, h: 100, level: 0.42, ppt: 7 }).s;
  s += thermo(178, 70, 292) + `<line class="rod2" x1="146" y1="96" x2="158" y2="298"/>`;
  s += lab('thermometer', 181, 110, 300, 96) + lab('glass rod (stir)', 148, 120, 100, 100, 'end') + lab('saturated solution', 190, 284, 300, 262) + lab('excess undissolved solid', 186, 302, 300, 290) + lab('thermostatically controlled\nwater bath (e.g. 25 °C)', 286, 230, 300, 210);
  return s; },
  must: ['Flask in a <b>thermostatically controlled</b> water bath, with a thermometer in the solution.', 'Some solid left undissolved (shows the solution is saturated).', 'Allow time (10–30 min) to reach equilibrium, then filter with dry apparatus.'] });

/* ---------- electrochemistry ---------- */
D({ sec: 'ec', title: 'Electrolysis of molten PbBr₂', from: 'Electrochemistry WE4 (Avogadro’s constant)', w: 440, h: 350, draw() {
  let s = stand(80, 340, 100, 50, 150) + clamp(80, 150, 200, 26);
  s += tripod(200, 238, 104, 340) + pipeclay(200, 236, 74);
  s += crucible(200, 200, { wt: 74, wb: 42, h: 42, fill: 0.6, molten: true });
  s += bunsen(200, 340, 38);
  s += `<rect class="rodg" x="186" y="112" width="7" height="122"/><rect class="rodg" x="207" y="112" width="7" height="122"/><rect class="bung" x="172" y="142" width="56" height="16" rx="2"/>`;
  s += wire([[189, 112], [189, 60], [288, 60]]) + meter(300, 60, 'A') + wire([[312, 60], [356, 60], [356, 74]]) + `<rect class="gl wf" x="340" y="74" width="84" height="40"/>` + note('DC power\nsupply 12 V', 382, 90, 'middle', 'nt') + wire([[210, 112], [210, 92], [300, 92], [300, 124], [400, 124], [400, 114]]);
  s += lab('ammeter (in series)', 300, 48, 300, 30, 'middle') + lab('graphite rods\n(electrodes)', 186, 180, 70, 196, 'end') + lab('two-hole rubber bung', 228, 150, 250, 160) + lab('crucible', 236, 206, 260, 196) + lab('molten PbBr₂', 214, 228, 260, 226) + lab('pipe-clay triangle', 236, 236, 260, 252) + lab('tripod', 252, 290, 280, 290) + lab('Bunsen burner', 206, 316, 280, 318);
  s += note('set up in a fume cupboard (Br₂ is toxic)', 10, 24, 'start', 'nt b');
  return s; },
  must: ['Graphite rods through a two-hole bung, dipping into the PbBr₂ in a crucible.', 'Ammeter in series with the DC supply.', 'Crucible in a pipe-clay triangle on a tripod, heated by a Bunsen (PbBr₂ melts at 373 °C).', 'Fume cupboard; handle the hot crucible with tongs.'] });

D({ sec: 'ec', title: 'Electrochemical cell (Zn / Cu)', from: 'Electrochemistry WE5 (Nernst)', w: 440, h: 346, draw() {
  let s = beaker(120, 300, 110, 116, 0.66) + beaker(320, 300, 110, 116, 0.66);
  s += `<rect class="plate" x="98" y="150" width="12" height="136"/><rect class="plateC" x="330" y="150" width="12" height="136"/>`;
  s += `<path class="sb1" d="M150,276 L150,170 L290,170 L290,276"/><path class="sb2" d="M150,276 L150,170 L290,170 L290,276"/>`;
  s += wire([[104, 150], [104, 70], [208, 70]]) + meter(220, 70, 'V') + wire([[232, 70], [336, 70], [336, 150]]);
  s += lab('high-resistance voltmeter', 230, 62, 270, 40) + lab('Zn(s)', 98, 166, 60, 150, 'end') + lab('Cu(s)', 342, 166, 380, 150) + lab('1.00 mol dm⁻³ ZnSO₄(aq)', 120, 286, 120, 318, 'middle') + lab('CuSO₄(aq)', 320, 286, 320, 318, 'middle') + lab('salt bridge: filter paper\nsoaked in saturated KNO₃(aq)', 220, 166, 220, 130, 'middle');
  s += note('both beakers in a thermostatic water bath at 298 K', 220, 342, 'middle', 'nt');
  return s; },
  must: ['Two half-cells: metal electrode in a solution of its own ions.', '<b>Salt bridge</b> (filter paper soaked in saturated KNO₃) dipping into both solutions.', '<b>High-resistance voltmeter</b> connected across the electrodes.', 'Same temperature for both (298 K); new salt bridge for each reading.'] });

/* ---------- organic ---------- */
D({ sec: 'org', title: 'Heating under reflux', from: 'Organic WE6 (methyl cinnamate), WE7 (aspirin)', w: 420, h: 360, draw() {
  let s = stand(60, 350, 40, 30, 130) + clamp(60, 130, 170, 16);
  s += mantle(170, 350, 132, 64);
  const r = rbf(170, 336, 44, 30, 0.45, { chips: true }); s += r.s;
  const c = cond(170, r.top, 176, -90, { nubSide: 1 }); s += c.s;
  s += arrow(c.nubA[0] + 34, c.nubA[1], c.nubA[0] + 2, c.nubA[1]) + arrow(c.nubB[0] + 2, c.nubB[1], c.nubB[0] + 34, c.nubB[1]);
  s += note('water in', c.nubA[0] + 38, c.nubA[1] + 4, 'start', 'nt b') + note('water out', c.nubB[0] + 38, c.nubB[1] + 4, 'start', 'nt b');
  s += lab('open top: never stopper', 170, r.top - 176, 250, 18) + lab('Liebig condenser\n(vertical)', 186, 140, 260, 140) + lab('round-bottom flask', 206, 266, 260, 250) + lab('reaction mixture', 176, 316, 260, 274) + lab('boiling chips', 176, 330, 260, 298) + lab('heating mantle\n(no naked flame)', 236, 340, 260, 330);
  return s; },
  must: ['Condenser fitted <b>vertically</b> on the round-bottom flask.', 'Water <b>in at the bottom</b>, out at the top.', 'Top left <b>open</b> (a sealed system could explode).', 'Safe heating: heating mantle or water/oil bath, not a naked flame. Boiling chips.'] });

D({ sec: 'org', title: 'Distillation', from: 'Organic WE6 (recover methanol at 65 °C)', w: 460, h: 372, draw() {
  let s = mantle(170, 350, 128, 62);
  const r = rbf(170, 336, 42, 22, 0.45, { chips: true }); s += r.s;
  s += `<path class="gl" d="M161,${r.top} L161,150 L179,150 L179,170 L204,179 M179,${r.top} L179,182 L204,191"/>`;
  s += thermo(170, 80, 172);
  const c = cond(204, 185, 200, 20, { nubSide: -1 }); s += c.s;
  const e = c.P(200, 0);
  s += tube([[e[0], e[1]], [e[0] + 9, e[1] + 7], [e[0] + 12, e[1] + 26]], true);
  s += conical(e[0] + 12, 350, { w: 64, h: 76, level: 0.25 }).s;
  s += arrow(c.nubB[0] + 6, c.nubB[1] - 24, c.nubB[0] + 1, c.nubB[1] - 3) + arrow(c.nubA[0], c.nubA[1] - 2, c.nubA[0] - 4, c.nubA[1] - 26);
  s += note('water in (lower end)', c.nubB[0] + 8, c.nubB[1] - 30, 'middle', 'nt b') + note('water out', c.nubA[0] - 4, c.nubA[1] - 32, 'middle', 'nt b');
  s += lab('thermometer: bulb level\nwith the side arm', 172, 110, 230, 76, 'start') + lab('still head', 161, 200, 100, 196, 'end') + lab('Liebig condenser (sloping)', 300, 230, 300, 262, 'middle') + lab('distillate (methanol)', e[0] + 10, 342, e[0] - 20, 304, 'end') + lab('round-bottom flask\n+ boiling chips', 140, 318, 100, 270, 'end') + lab('heating mantle', 120, 344, 100, 362, 'end');
  return s; },
  must: ['Thermometer bulb <b>level with the side arm</b> (measures the vapour boiling off).', 'Condenser sloping down to the receiver; water <b>in at the lower end</b>.', 'Collect the fraction at its boiling point (methanol 65 °C).', 'Heating mantle; boiling chips.'] });

D({ sec: 'org', title: 'Vacuum filtration', from: 'Organic: four main steps · WE7 (aspirin)', w: 420, h: 330, draw() {
  const c = conical(170, 322, { w: 90, h: 100, side: true, level: 0.18 }); let s = c.s;
  s += `<rect class="bung" x="156" y="${c.top - 12}" width="28" height="16" rx="2"/>`;
  s += `<path class="gl wf" d="M120,140 L220,140 L220,182 L176,190 L176,${c.top + 20} L164,${c.top + 20} L164,190 L120,182 Z"/><line class="dash2" x1="124" x2="216" y1="176" y2="176"/><rect class="sol" x="124" y="166" width="92" height="9"/>`;
  s += tube([[c.arm[0], c.arm[1] - 4], [270, c.arm[1] - 4]]) + arrow(270, c.arm[1] - 4, 300, c.arm[1] - 4);
  s += lab('Buchner funnel', 220, 150, 260, 130) + lab('crystals on filter paper', 214, 170, 260, 160) + lab('rubber bung', 184, c.top - 4, 260, c.top - 10) + lab('Buchner (side-arm) flask', 210, 290, 260, 300) + lab('filtrate', 176, 310, 120, 318, 'end') + note('to vacuum pump', 306, c.arm[1], 'start', 'nt');
  return s; },
  must: ['Buchner funnel with filter paper, sealed into a side-arm flask by a bung.', 'Side arm connected to a vacuum pump.', 'Wet the paper, apply the vacuum, pour quickly, wash the crystals with cold solvent.'] });

D({ sec: 'org', title: 'Cooling while adding a reagent dropwise', from: 'Organic WE6 (conc. H₂SO₄), WE7 (H₃PO₄)', w: 420, h: 320, draw() {
  let s = ice(170, 310, 210, 92);
  const r = rbf(170, 304, 40, 30, 0.42); s += r.s + dropper(170, r.top - 12, 40) + drops(170, r.top - 2, 2);
  s += lab('dropping pipette: add conc. acid\ndropwise, swirling after each drop', 174, r.top - 60, 230, r.top - 70) + lab('round-bottom flask', 204, 264, 300, 196) + lab('ice–water bath', 268, 300, 300, 250) + lab('reaction mixture', 170, 292, 110, 196, 'end');
  return s; },
  must: ['Flask standing in an <b>ice–water bath</b>.', 'Reagent added <b>dropwise</b> (dropper or dropping funnel) with swirling or stirring.', 'Why: the addition is exothermic; cooling and slow addition limit the heat released and side reactions.'] });

/* ---------- graphs ---------- */
const GR = [
  { sec: 'grav', title: 'Mass against number of heatings', from: 'Gravimetry WE1, WE2, WE3', g: 'massHeat', must: ['Mass falls, then levels off: <b>constant mass</b> (D = D).', 'Constant mass means decomposition (or drying) is complete.'] },
  { sec: 'grav', title: 'Mass of precipitate against volume added', from: 'Introduction Ex 2 (PbCl₂ stoichiometry)', g: 'stoich', must: ['Straight line up, then horizontal once all Pb²⁺ has precipitated.', 'The break point gives the mole ratio.'] },
  { sec: 'gas', title: 'Gas volume against time', from: 'Gas collection: reading until constant', g: 'gasTime', must: ['Volume rises quickly, then levels off when the reaction stops.', 'Record V only when the syringe reading is constant.'] },
  { sec: 'en', title: 'Temperature against time (exothermic)', from: 'Energetics: temperature–time method', g: 'ttExo', must: ['≥ 3 readings before mixing at 3.0 min; ≥ 5 after the maximum.', 'Two best-fit lines, both <b>extrapolated to t = 3.0 min</b>; ΔT is the vertical gap.'] },
  { sec: 'en', title: 'Temperature against time (endothermic)', from: 'Energetics: temperature–time method', g: 'ttEndo', must: ['Same method; the solution warms back up after the minimum.', 'ΔT is negative.'] },
  { sec: 'en', title: 'Thermometric titration', from: 'Energetics WE7', g: 'thermoTitr', must: ['Rising line, then falling line; they intersect at the end-point, V<sub>eq</sub>.', 'Label the end-point on the volume axis.'] },
  { sec: 'en', title: 'Mixing varying volumes (total constant)', from: 'Energetics WE8', g: 'mixVol', must: ['Peak at the stoichiometric ratio: label V<sub>eq</sub> and ΔT<sub>eq</sub>.', 'Left side: acid limiting; right side: alkali limiting.'] },
  { sec: 'kin', title: '1/t against V: finding the order', from: 'Kinetics WE10 (clock method)', g: 'clock', must: ['Horizontal → order 0. Straight line through origin (1/t vs V) → order 1. Straight line through origin (1/t vs V²) → order 2.'] },
  { sec: 'kin', title: 'V(KMnO₄) against time', from: 'Kinetics WE11 (sampling method)', g: 'kmno4', must: ['Straight line down → zero order.', 'Curve with constant half-life → first order.'] },
  { sec: 'eq', title: 'Solubility against temperature', from: 'Equilibria WE2 (Ce(SO₄)₂)', g: 'solub', must: ['Five temperatures, one point each; smooth curve.', 'For Ce(SO₄)₂ the curve slopes down (solubility falls as T rises).'] },
  { sec: 'ec', title: 'E(cell) against ln(1/[Cu²⁺])', from: 'Electrochemistry WE5', g: 'ecell', must: ['Straight line, gradient −0.0128 (from the Nernst equation).', 'Read Y for the unknown X; [Cu²⁺] = 1/e<sup>Y</sup>.'] }
];
G.gasTime = () => { const v = t => 72 * (1 - Math.exp(-t / 1.4)); return plot({ title: 'Gas volume against time', xr: [0, 8], yr: [0, 85], xt: [0, 2, 4, 6, 8], yt: [0, 20, 40, 60, 80], xl: 'time / min', yl: 'volume of gas / cm³',
  body: (X, Y) => { let p = ''; for (let t = 0; t <= 8; t += 0.2) p += (t ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(v(t)).toFixed(1); return '<path class="ln" d="' + p + '"/>' + [1, 2, 3, 4, 5, 6, 7].map(t => cross(t, v(t), X, Y)).join('') + '<line class="dash" x1="' + X(4.5) + '" x2="' + X(8) + '" y1="' + Y(72) + '" y2="' + Y(72) + '"/>' + txt(X(4.6), Y(72) - 6, 'constant reading = V', 'tl'); } }); };
