import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *

rnd = random.Random(2026_08_06)
P = Paper('acjc', 'Anglo-Chinese Junior College', 'ACJC', '6 Aug 2026', os.path.join(PRIV, 'src', 'acjc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 V-string pendulum =======================
lv = 20.0          # cm, vertex to bob centre (equal to each arm length of the V)
def T_of(th):
    return 2 * math.pi * math.sqrt((lv / 100) * (1 + math.cos(math.radians(th) / 2)) / g)
rows1 = []
for th in (90, 50, 70, 110, 130, 150):
    thm = th + rnd.choice([-1, 0, 1])
    t = [round(20 * T_of(thm) * (1 + rnd.gauss(0, 0.003)), 2) for _ in range(2)]
    Tm = sum(t) / 40
    rows1.append((thm, round(lv + rnd.gauss(0, 0.1), 1), t[0], t[1], Tm, math.cos(math.radians(thm) / 2), Tm * Tm))
r90 = rows1[0]
rows1.sort()
m1, c1, r21 = linfit([r[5] for r in rows1], [r[6] for r in rows1])
g_est = 4 * math.pi ** 2 * (lv / 100) / m1
pctT = 0.2 / (r90[2]) * 100
P.question('Q1', 'Pendulum hanging from a V-shaped string', 14, [3, 4, 5],
           'The bob swings at right angles to the rule, pivoting about the line of the rule, so its effective length grows as the V narrows. '
           'Plot T² against cos(θ/2): gradient 4π²l/g and intercept c.',
           sim='acjc-q1', xlsx=[('ACJC_Q1_V_pendulum.xlsx', 'θ and 20-oscillation timings for six angles. Plot T² against cos(θ/2).')],
           skills=['protractor', 'timing oscillations', 'uncertainty', 'linearisation'])
P.ans(3, 'l =', f'{r90[1]:.1f} cm', q='Q1')
P.ans(3, 'θ =', f'{r90[0]}°', q='Q1')
P.note(3, 470, 'l: vertex of the V to the centre of the bob (set square to find the centre). θ: protractor centred at the vertex.', 'tip')
P.text(4, 160, 95, f'20 oscillations: {r90[2]:.2f} s, {r90[3]:.2f} s\nT = {(r90[2]+r90[3])/2:.2f}/20', size=9.5, q='Q1')
P.ans(4, 'T =', f'{r90[4]:.3f} s', q='Q1')
P.text(4, 160, 240, f'Reaction time in starting and stopping ≈ 0.2 s over 20 oscillations\n% uncertainty = 0.2 / {r90[2]:.1f} × 100%', size=9.2, q='Q1')
P.ans(4, 'percentage uncertainty', f'{pctT:.1f}%', q='Q1')
P.table(4, 150, 440, ['θ / °', 'l / cm', 't₁ / s', 't₂ / s', 'T / s', 'cos(θ/2)', 'T² / s²'],
        [[r[0], f'{r[1]:.1f}', f'{r[2]:.2f}', f'{r[3]:.2f}', f'{r[4]:.3f}', f'{r[5]:.3f}', f'{r[6]:.3f}'] for r in rows1], size=8.8, q='Q1')
P.text(4, 150, 600, 't₁, t₂ = time for 20 oscillations; l kept at 20.0 cm by re-tying the vertical string.', size=8.6, q='Q1')
P.note(4, 90, 'Oscillations are fast (≈ 1.1 s), so time 20, twice.', 'mark')
P.note(4, 440, '[5]: six θ values spread over 50°–150°, l checked each time, repeats, the processed columns, and units in the headings.', 'mark')
P.graph(5, 160, 222, 290, 200, q='Q1', xlabel='cos(θ/2)', ylabel='T² / s²', xr=[0, 1.0], yr=[0, 1.8],
        series=[dict(pts=[(r[5], r[6]) for r in rows1])], lines=[dict(m=m1, c=c1, x=[0, 1.0]), dict(m=m1 * 0.85, c=c1 * 0.85, x=[0, 1.0], dash='4,2', label='X', ldy=4)],
        eq=eqn(m1, c1, 4, r2=r21), eqpos=(330, 365))
P.ans(5, 'c =', f'{c1:.3f} s²', q='Q1')
P.ans(5, 'g =', f'4π²(0.200)/{m1:.4f} = {g_est:.2f} m s⁻²', size=9.5, q='Q1')
P.write_lines(5, 'The bob also swings slightly in the plane of the V (the motion becomes elliptical), so it is hard to see where each oscillation starts and ends, '
              'and the V-string can slip on the rule, changing θ during the timing.', after=530, size=9.0, q='Q1')
P.note(5, 600, 'Line X (dashed, on the graph above): gradient 4π²l/g and c are both ∝ 1/g, so X is less steep and lies below the original line. Label it X.', 'mark')
P.note(5, 220, 'T² = (4π²l/g) cos(θ/2) + c: gradient = 4π²l/g, so g = 4π²l/gradient; intercept = c.', 'why')
workbook(os.path.join(X, 'ACJC_Q1_V_pendulum.xlsx'), 'ACJC Q1 – V-string pendulum (sample data)', 'l = 20.0 cm. Times are for 20 oscillations.',
         ['θ / °', 'l / cm', 't1 / s', 't2 / s'], [[r[0], r[1], r[2], r[3]] for r in rows1],
         proc=[('T / s', '=(C{r}+D{r})/40'), ('cos(θ/2)', '=COS(RADIANS(A{r})/2)'), ('T² / s²', '=E{r}^2')],
         chart=dict(x=6, y=7, title='T² against cos(θ/2)', xt='cos(θ/2)', yt='T² / s²'),
         results=[('gradient = 4π²l/g', '=SLOPE(G{first}:G{last},F{first}:F{last})', 's²'), ('c = intercept', '=INTERCEPT(G{first}:G{last},F{first}:F{last})', 's²'),
                  ('g = 4π²(0.200)/gradient', '=4*PI()^2*0.2/SLOPE(G{first}:G{last},F{first}:F{last})', 'm s⁻²')])

# ======================= Q2 wire with two resistors R (as ASRJC Q1) =======================
E, R, kw = 3.08, 10.0, 20.0
def V_of(Lcm):
    kL = kw * Lcm / 100
    Rp = kL * R / (kL + R)
    return E / (R + Rp + 0.12) * R
rows2 = [(L, round(V_of(L) + rnd.gauss(0, 0.003), 2)) for L in (30.0, 40.0, 50.0, 60.0, 70.0, 80.0)]
ys2 = [((E - V) / (L / 100), V) for L, V in rows2]
mP, cQ, r22 = linfit([V for y, V in ys2], [y for y, V in ys2])
QoverP = -cQ / mP
P.question('Q2', 'Resistance wire with two resistors', 11, [6, 7, 8, 9, 10],
           'A length L of wire in parallel with one resistor R, in series with a second R across which V is read. (E − V)/L = PV − Q gives Q/P = E/2 and P = 2k/R.',
           sim='asrjc-q1', xlsx=[('ACJC_Q2_wire_circuit.xlsx', 'Six (L, V) readings; plot (E − V)/L against V and find Q/P.')],
           skills=['voltmeter readings', 'trend', 'linearisation', 'checking a theory'])
P.ans(6, 'E =', f'{E:.2f} V', q='Q2')
P.note(6, 300, 'With nothing else connected, the voltmeter reads the e.m.f. (no current, so no lost volts).', 'why')
P.ans(7, 'L =', '30.0 cm', q='Q2')
P.ans(7, 'V =', f'{rows2[0][1]:.2f} V', q='Q2')
P.table(8, 150, 140, ['L / cm', 'V / V', '(E − V)/L / V m⁻¹'], [[f'{L:.1f}', f'{V:.2f}', f'{y:.3f}'] for (L, V), (y, _) in zip(rows2, ys2)], size=9.5, q='Q2')
P.write_lines(8, 'V decreases as L increases (the resistance of the parallel section rises, so the second resistor gets a smaller share of E).', after=400, size=9.0, q='Q2')
P.graph(9, 150, 238, 290, 170, q='Q2', xlabel='V / V', ylabel='(E − V)/L / V m⁻¹', xr=[1.8, 2.4], yr=[1.2, 3.2],
        series=[dict(pts=[(V, y) for y, V in ys2])], lines=[dict(m=mP, c=cQ, x=[1.8, 2.4])], eq=eqn(mP, cQ, 4, r2=r22), eqpos=(360, 350), nx=3, ny=4)
P.ans(9, 'P =', f'{-cQ:.3f}/{mP:.3f} = {QoverP:.2f} V', size=9.5, q='Q2')
P.text(9, 150, 590, f'E = 2(Q/P) = 2 × {QoverP:.2f}', size=9.5, q='Q2')
P.ans(9, 'E =', f'{2*QoverP:.2f} V', q='Q2')
P.write_lines(9, f'2(Q/P) = {2*QoverP:.2f} V differs by only {abs(2*QoverP-E)/E*100:.1f}% from the e.m.f. measured in (a) ({E:.2f} V), so the theory is justified.', after=690, size=9.0, q='Q2')
P.text(10, 150, 250, f'R = 2k/P = 2 × 20 / {mP:.3f}', size=9.5, q='Q2')
P.ans(10, 'R =', f'{2*kw/mP:.1f} Ω', q='Q2')
P.note(8, 140, 'Six (L, V) sets with the processed column and correct units.', 'mark')
P.note(9, 240, 'Q/P is the V-intercept of the line (where (E − V)/L = 0): Q/P = −intercept/gradient.', 'why')
P.note(9, 690, 'Compare numerically with the value in (a), then conclude.', 'mark')
workbook(os.path.join(X, 'ACJC_Q2_wire_circuit.xlsx'), 'ACJC Q2 – Wire and resistors (sample data)', f'E = {E:.2f} V. Plot (E − V)/L against V.',
         ['L / cm', 'V / V'], [list(r) for r in rows2], proc=[('(E − V)/L / V m⁻¹', f'=({E}-B{{r}})/(A{{r}}/100)')],
         chart=dict(x=2, y=3, title='(E − V)/L against V', xt='V / V', yt='(E − V)/L / V m⁻¹'),
         results=[('P = gradient', '=SLOPE(C{first}:C{last},B{first}:B{last})', 'm⁻¹'), ('Q = −intercept', '=-INTERCEPT(C{first}:C{last},B{first}:B{last})', 'V m⁻¹'),
                  ('Q/P', '=-INTERCEPT(C{first}:C{last},B{first}:B{last})/SLOPE(C{first}:C{last},B{first}:B{last})', 'V'),
                  ('R = 2k/P (k = 20 Ω m⁻¹)', '=40/SLOPE(C{first}:C{last},B{first}:B{last})', 'Ω')])

# ======================= Q3 sand through a funnel =======================
xA, xB = 2.52, 1.68
mA, mB = 90 * xA / (xA + xB), 90 * xB / (xA + xB)
rate = 6.05
tA = round(mA / rate + rnd.gauss(0, 0.1), 1)
tB = round(mB / rate + rnd.gauss(0, 0.1), 1)
tAB = round(90 / rate + rnd.gauss(0, 0.15), 1)
P.question('Q3', 'Sand flowing through a funnel', 25, [11, 12, 13, 14, 15, 16, 17, 18],
           'Find the masses of sand from depth measurements, time the sand through a funnel, and test whether the flow rate depends on the mass in the funnel. '
           'Plan a power-law study of hopper flow (grain size and stem diameter) and analyse a height–time dataset with a half-life.',
           sim='acjc-q3', xlsx=[('ACJC_Q3f_sand_dataset.xlsx', 'A practice version of datasetQ3f: h every 2 s. Read successive half-lives and plot ln h against t.')],
           skills=['vernier depth gauge', 'proportional reasoning', 'timing', 'significant figures', 'planning', 'half-life from data'])
P.text(11, 153, 235, 'Depth probe of the vernier from the rim to the sand surface, and from the rim to the base;\nx = difference. Surface levelled by tapping gently; three readings averaged.', size=8.6, q='Q3')
P.ans(11, 'x =', f'{xA:.2f} cm', q='Q3')
P.text(11, 153, 355, f'Δx ≈ 0.05 cm (uneven surface of the sand, not the 0.01 cm precision)\n% uncertainty = 0.05/{xA:.2f} × 100%', size=8.8, q='Q3')
P.ans(11, 'percentage uncertainty', f'{0.05/xA*100:.0f}%', q='Q3')
P.text(11, 153, 480, f'Depth of sand in B: x_B = {xB:.2f} cm. Identical containers, so m ∝ x:\n'
       f'm_A = 90 × {xA:.2f}/({xA:.2f} + {xB:.2f}),   m_B = 90 − m_A', size=8.8, q='Q3')
P.ans(11, 'm A =', f'{mA:.1f} g', q='Q3')
P.ans(11, 'm B =', f'{mB:.1f} g', q='Q3')
P.write_lines(11, 'Level the sand surface by tapping the container gently, and take depth readings at several points across the surface and average them.', after=720, size=9.0, q='Q3')
P.note(11, 230, 'You have no balance: the identical containers mean mass is proportional to depth, so the 90 g total can be shared in the ratio of depths.', 'why')
P.note(11, 410, 'Realistic Δx is bigger than the vernier precision because the sand surface is uneven.', 'mark')
P.text(12, 153, 490, f'Stopwatch started as the finger is removed, stopped when the last grains leave.\nRepeat: {tA-0.2:.1f} s, {tA+0.1:.1f} s', size=8.8, q='Q3')
P.ans(12, 't A =', f'{tA:.1f} s', q='Q3')
P.text(12, 153, 605, f'Δt ≈ 0.3 s (judging when the last grains fall + reaction)\n% uncertainty = 0.3 / {tA:.1f} × 100%', size=8.8, q='Q3')
P.ans(12, 'percentage uncertainty', f'{0.3/tA*100:.0f}%', q='Q3')
P.text(13, 153, 140, f'mass flow rate = m_A / t_A = {mA:.1f} / {tA:.1f}', size=9.5, q='Q3')
P.ans(13, 'mass flow rate', f'{mA/tA:.1f} g s⁻¹', q='Q3')
P.write_lines(13, f'm_A has 3 s.f. and t_A has 2 s.f. ({tA:.1f} s), so the rate is given to 2 s.f., the least number of s.f. in the data.', after=255, size=9.0, q='Q3')
P.table(13, 140, 500, ['sand used', 'm / g', 't₁ / s', 't₂ / s', 't / s', 'rate / g s⁻¹'],
        [['A', f'{mA:.1f}', f'{tA-0.1:.1f}', f'{tA+0.1:.1f}', f'{tA:.1f}', f'{mA/tA:.1f}'], ['B', f'{mB:.1f}', f'{tB-0.1:.1f}', f'{tB+0.1:.1f}', f'{tB:.1f}', f'{mB/tB:.1f}'],
         ['A + B', '90.0', f'{tAB-0.2:.1f}', f'{tAB+0.2:.1f}', f'{tAB:.1f}', f'{90/tAB:.2f}']], size=8.8, q='Q3')
rates = [mA / tA, mB / tB, 90 / tAB]
spread = (max(rates) - min(rates)) / min(rates) * 100
P.write_lines(13, f'The rates differ by only {spread:.0f}%, which is within the combined uncertainty (about {0.05/xA*100:.0f}% + {0.3/tA*100:.0f}% ≈ {0.05/xA*100+0.3/tA*100:.0f}%). '
              'The flow rate does not increase with the mass of sand, so the results do not support the suggestion.', after=660, size=8.8, q='Q3')
P.note(13, 140, 'Unit g s⁻¹ (or kg s⁻¹).', 'mark')
P.note(13, 420, 'Use all the sand you have: A, B and A + B give three different masses.', 'tip')
P.note(13, 660, 'Granular flow is unlike a liquid: the rate barely depends on the height of sand above the hole.', 'why')
planE = ('Apparatus: funnels (hoppers) of the same material and cone angle but different stem diameters d; samples of dry sand sieved to different grain sizes A; '
         'retort stand and clamp; top-pan balance; stopwatch (or balance + datalogger); vernier calipers; travelling microscope. '
         'Measuring A: sieve the sand with stacked sieves and use the mean of the two mesh sizes, or measure 20 grains with a travelling microscope and average. '
         'Measuring d: internal diameter of the stem with the vernier (inside jaws), two perpendicular readings. '
         'Procedure: place a fixed mass (e.g. 200 g) of sand in the funnel with the outlet blocked; remove the finger and start the stopwatch; stop when the last grains leave; '
         'f = mass/time. Repeat 3 times. '
         'Experiment 1: fixed d, at least 6 grain sizes A. Experiment 2: fixed grain size, at least 6 funnels of different d. '
         'Analysis: lg f = lg k + x lg A + y lg d. Plot lg f against lg A (d constant): gradient = x. Plot lg f against lg d (A constant): gradient = y. '
         'k = f/(A^x d^y) from any data point, or from an intercept. '
         'Control: same mass of sand, same material (density), dry sand, same funnel cone angle and material, same height of release. '
         'Precautions: dry the sand in an oven so it does not clump; tap gently if it bridges and discard that trial; catch the sand in a container on the balance; '
         'wear goggles/mask to avoid dust; repeat and average.')
rest = P.write_lines(16, planE, after=60, size=8.7, q='Q3', spill=True)
P.text(14, 120, 70, '3(e) plan: labelled diagram (drawn on this spare page)', size=9.5, q='Q3')
P.diagram(14, 160, 95, [('line', 10, 0, 10, 230), ('rect', -20, 230, 70, 8), ('line', 10, 40, 80, 40), ('rect', 78, 34, 10, 12),
                         ('line', 60, 50, 140, 50), ('line', 60, 50, 92, 130), ('line', 140, 50, 108, 130), ('line', 92, 130, 92, 160), ('line', 108, 130, 108, 160),
                         ('arrow', 92, 168, 108, 168, True), ('text', 112, 172, 'stem diameter d (vernier)', 8.5), ('text', 145, 70, 'funnel/hopper with dry sieved sand (grain size A)', 8.5),
                         ('rect', 70, 200, 60, 25), ('rect', 60, 225, 80, 8), ('text', 150, 225, 'container on top-pan balance', 8.5), ('text', 150, 200, 'stopwatch', 8.5)], q='Q3')
P.note(14, 95, 'Diagram for 3(e): hopper clamped, stem diameter labelled, collection container on a balance.', 'mark')
P.note(16, 100, 'Seven marks: equipment, measuring A and d, procedure for f, two experiments varying one variable each, log graphs for x and y, k, controls, precautions.', 'mark')
# dataset (f)
h0, kd = 20.0, math.log(2) / 30.0
dsh = []
for i in range(0, 76):
    t = 2 * i
    dsh.append((t, round(h0 * math.exp(-kd * t) * (1 + rnd.gauss(0, 0.004)), 2)))
halves = []
for target in (10.0, 5.0, 2.5):
    for i in range(1, len(dsh)):
        if dsh[i][1] <= target:
            t1, h1 = dsh[i - 1]; t2, h2 = dsh[i]
            halves.append(t1 + (h1 - target) / (h1 - h2) * (t2 - t1)); break
hl = [halves[0], halves[1] - halves[0], halves[2] - halves[1]]
mk, ck, r2k = linfit([t for t, h in dsh], [math.log(h) for t, h in dsh])
P.text(17, 153, 410, f'h₀ = {dsh[0][1]:.1f} cm. h reaches 10.0 cm at t = {halves[0]:.1f} s, 5.0 cm at {halves[1]:.1f} s, 2.5 cm at {halves[2]:.1f} s\n'
       f'successive half-lives: {hl[0]:.1f} s, {hl[1]:.1f} s, {hl[2]:.1f} s', size=8.8, q='Q3')
P.ans(17, 'mean value of T', f'{sum(hl)/3:.1f} s', q='Q3')
P.graph(18, 150, 205, 290, 200, q='Q3', xlabel='t / s', ylabel='ln(h / cm)', xr=[0, 150], yr=[-0.5, 3.2],
        series=[dict(pts=[(t, math.log(h)) for t, h in dsh[::4]])], lines=[dict(m=mk, c=ck)], eq=eqn(mk, ck, 4, r2=r2k), eqpos=(200, 345))
P.ans(18, 'k =', f'{-mk:.4f} s⁻¹', q='Q3')
P.note(17, 400, 'Interpolate between readings to find when h halves; take at least three successive half-lives and average.', 'mark')
P.note(18, 210, 'ln h = ln h₀ − kt: gradient = −k. Check: k ≈ ln 2 / T.', 'why')
workbook(os.path.join(X, 'ACJC_Q3f_sand_dataset.xlsx'), 'ACJC Q3(f) – Height of sand against time (practice dataset)', 'Find successive half-lives and plot ln h against t.',
         ['t / s', 'h / cm'], [list(r) for r in dsh], proc=[('ln(h / cm)', '=LN(B{r})')],
         chart=dict(x=1, y=3, title='ln h against t', xt='t / s', yt='ln(h / cm)'),
         results=[('k = −gradient', '=-SLOPE(C{first}:C{last},A{first}:A{last})', 's⁻¹'), ('ln2 / k', '=LN(2)/-SLOPE(C{first}:C{last},A{first}:A{last})', 's')])
P.build()
