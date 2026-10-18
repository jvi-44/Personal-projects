import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *

rnd = random.Random(2026_08_24 + 3)
P = Paper('asrjc', 'Anderson Serangoon Junior College', 'ASRJC', '24 Aug 2026', os.path.join(PRIV, 'src', 'asrjc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 wire in parallel with X, in series with X =======================
E, R, kw, rint = 3.04, 10.0, 20.4, 0.15
def V_of(Lcm):
    kL = kw * Lcm / 100
    Rp = kL * R / (kL + R)
    I = E / (R + Rp + rint)
    return I * R
rows1 = [(L, round(V_of(L) + rnd.gauss(0, 0.003), 2)) for L in (30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0)]
ys1 = [((E - V) / (L / 100), V) for L, V in rows1]
mP, cQ, r21 = linfit([V for y, V in ys1], [y for y, V in ys1])
Pv, Qv = mP, -cQ
P.question('Q1', 'Resistance wire in a series–parallel circuit', 14, [2, 3, 4],
           'A length L of wire in parallel with one resistor X, in series with a second X across which V is measured. '
           '(E − V)/L = PV − Q with P = 2k/R and Q = kE/R. Sketch how a smaller R changes the line, then integrate an AC current dataset.',
           sim='asrjc-q1', xlsx=[('ASRJC_Q1_wire_circuit.xlsx', 'Seven (L, V) readings. Compute (E − V)/L and plot it against V.'),
                                 ('ASRJC_Q1g_ac_dataset.xlsx', 'A practice version of datasetQ1g: sinusoidal current every 0.25 ms. Integrate the first half-cycle for Q₁.')],
           skills=['voltmeter and ohmmeter readings', 'tabulation', 'non-obvious linearisation', 'area under I–t'])
P.ans(2, 'E =', f'{E:.2f} V', q='Q1')
P.ans(2, 'R =', f'{R:.1f} Ω', q='Q1')
P.ans(2, 'L =', '30.0 cm', q='Q1')
P.ans(2, 'V =', f'{rows1[0][1]:.2f} V', q='Q1')
P.note(2, 160, 'E: voltmeter straight across the battery with nothing else connected (open circuit). R: multimeter on the 200 Ω range, resistor out of the circuit.', 'mark')
P.note(2, 600, 'Measure L between the contact points of the clips F and G (not the clip edges).', 'tip')
P.table(3, 130, 110, ['L / cm', 'V / V', '(E − V)/L / V m⁻¹'], [[f'{L:.1f}', f'{V:.2f}', f'{y:.3f}'] for (L, V), (y, _) in zip(rows1, ys1)], size=9.5, q='Q1')
P.graph(3, 130, 462, 300, 215, q='Q1', xlabel='V / V', ylabel='(E − V)/L / V m⁻¹', xr=[1.75, 2.25], yr=[1.2, 3.0],
        series=[dict(pts=[(V, y) for y, V in ys1])], lines=[dict(m=mP, c=cQ, x=[1.75, 2.25])], eq=eqn(mP, cQ, 4, r2=r21), eqpos=(300, 470), nx=4, ny=4)
P.ans(3, 'P =', f'{Pv:.2f} m⁻¹', q='Q1')
P.ans(3, 'Q =', f'{Qv:.2f} V m⁻¹', q='Q1')
P.note(3, 110, 'Seven values of L from 30 to 90 cm, with the calculated (E − V)/L column. V to 0.01 V.', 'mark')
P.note(3, 470, 'Plot y = (E − V)/L against x = V. Gradient = P; intercept = −Q, so Q = −(intercept).', 'why')
P.note(3, 740, 'Units: P has unit m⁻¹ (V m⁻¹ ÷ V). Q has unit V m⁻¹.', 'mark')
P.text(4, 100, 150, 'W is steeper (P ∝ 1/R larger) with a more negative y-intercept (Q ∝ 1/R larger).\n'
       'Both lines meet the V-axis at the same point, V = Q/P = E/2, because the ratio is unchanged.', size=8.6, q='Q1')
# (g) AC dataset
I0, f = 0.120, 50.0
dsa = []
for i in range(0, 161):
    t = i * 0.00025
    dsa.append((round(t, 5), round(I0 * math.sin(2 * math.pi * f * t) + rnd.gauss(0, 0.0008), 4)))
Q1 = sum(0.5 * (dsa[i][1] + dsa[i + 1][1]) * 0.00025 for i in range(40))
P.ans(4, 'Q 1 =', f'{Q1*1000:.2f} × 10⁻³ C', q='Q1')
P.write_lines(4, 'Q₁ = area under the I–t graph from t = 0 to half a period (0.010 s, where I returns to zero), using the trapezium rule in the spreadsheet.',
              after=360, size=9.2, q='Q1')
P.note(4, 80, 'Draw W on your sketch in (e). The key features are a steeper gradient and the same V-intercept.', 'mark')
P.note(4, 320, 'Find the half period from the data (when I next crosses zero). Q₁ ≈ 2I₀/ω is a quick check.', 'tip')
workbook(os.path.join(X, 'ASRJC_Q1_wire_circuit.xlsx'), 'ASRJC Q1 – Wire, two resistors X (sample data)', f'E = {E:.2f} V, R = {R:.1f} Ω.',
         ['L / cm', 'V / V'], [list(r) for r in rows1], proc=[('(E − V)/L / V m⁻¹', f'=({E}-B{{r}})/(A{{r}}/100)')],
         chart=dict(x=2, y=3, title='(E − V)/L against V', xt='V / V', yt='(E − V)/L / V m⁻¹'),
         results=[('P = gradient', '=SLOPE(C{first}:C{last},B{first}:B{last})', 'm⁻¹'), ('Q = −intercept', '=-INTERCEPT(C{first}:C{last},B{first}:B{last})', 'V m⁻¹'),
                  ('Q/P (expect E/2)', '=-INTERCEPT(C{first}:C{last},B{first}:B{last})/SLOPE(C{first}:C{last},B{first}:B{last})', 'V')])
workbook(os.path.join(X, 'ASRJC_Q1g_ac_dataset.xlsx'), 'ASRJC Q1(g) – AC current data (practice dataset)', 'Integrate I over the first half-period for Q₁.',
         ['t / s', 'I / A'], [list(r) for r in dsa], proc=[('strip charge / C', '=IF(A{r1}<>"",0.5*(B{r}+B{r1})*(A{r1}-A{r}),"")')],
         chart=dict(x=1, y=2, title='I against t', xt='t / s', yt='I / A', trend=False, line=True),
         results=[('Q₁ = Σ strips for 0 ≤ t ≤ 0.010 s', '=SUM(C6:C45)', 'C')])

# ======================= Q2 compound pendulum strip =======================
a2, kg = 50.0, 100.0 / math.sqrt(12)
rows2 = []
for z in (5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0):
    y = a2 - z
    T = 2 * math.pi * math.sqrt(((y / 100) ** 2 + (kg / 100) ** 2) / (g * y / 100))
    t20 = [round(20 * T * (1 + rnd.gauss(0, 0.003)), 2) for _ in range(2)]
    Tm = sum(t20) / 40
    rows2.append((z, *t20, Tm, y, Tm * Tm * y / 100, (y / 100) ** 2))
mM, cM, r22 = linfit([r[6] for r in rows2], [r[5] for r in rows2])
bb = math.sqrt(cM / mM)
gv = 4 * math.pi ** 2 / mM
P.question('Q2', 'Oscillating wooden strip (compound pendulum)', 13, [6, 7, 8, 9],
           'Find the balance point, hang the strip from holes at distance y = a − z from its centre of mass, and plot T²y against y²: '
           'gradient M = 4π²/g, intercept Mb². Plan how a magnet, coil and voltage sensor could time the swing.',
           sim='asrjc-q2', xlsx=[('ASRJC_Q2_compound_pendulum.xlsx', 'z and 20-oscillation timings for seven holes. Compute y, T²y and y²; find M, b and g.')],
           skills=['balance point', 'timing oscillations', 'linearisation', 'planning with sensors'])
P.ans(6, 'a =', f'{a2:.1f} cm', q='Q2')
P.text(6, 140, 270, 'strip balanced on the pivot; rule from end A to the pivot edge', size=9, q='Q2')
P.ans(6, 'z =', f'{rows2[0][0]:.1f} cm', q='Q2')
r0 = rows2[0]
P.text(7, 190, 115, f'20 oscillations: {r0[1]:.2f} s, {r0[2]:.2f} s → T = {(r0[1]+r0[2])/2:.2f}/20', size=9.5, q='Q2')
P.ans(7, 'T =', f'{r0[3]:.3f} s', q='Q2')
P.table(7, 140, 215, ['z / cm', 't₁ / s', 't₂ / s', 'T / s', 'y / cm', 'T²y / s² m', 'y² / m²'],
        [[f'{r[0]:.1f}', f'{r[1]:.2f}', f'{r[2]:.2f}', f'{r[3]:.3f}', f'{r[4]:.1f}', f'{r[5]:.4f}', f'{r[6]:.4f}'] for r in rows2], size=8.6, q='Q2')
P.graph(7, 140, 567, 300, 172, q='Q2', xlabel='y² / m²', ylabel='T²y / s² m', xr=[0, 0.22], yr=[0, 1.4],
        series=[dict(pts=[(r[6], r[5]) for r in rows2])], lines=[dict(m=mM, c=cM, x=[0, 0.22])], eq=eqn(mM, cM, 4, r2=r22), eqpos=(160, 575))
P.ans(7, 'M =', f'{mM:.2f} s² m⁻¹', q='Q2')
P.ans(7, 'b =', f'√({cM:.3f}/{mM:.2f}) = {bb*100:.1f} cm', size=9.5, q='Q2')
P.text(8, 106, 110, f'g = 4π²/M = 4π² / {mM:.3f}', size=10, q='Q2')
P.ans(8, 'g =', f'{gv:.2f} m s⁻²', q='Q2')
P.note(6, 300, 'a locates the centre of mass. Balance carefully: a 0.5 cm error in a shifts every y.', 'tip')
P.note(7, 110, 'T barely changes between holes (it has a minimum when y = b), so time 20 oscillations and keep 3 d.p. in T to see the trend.', 'why')
P.note(7, 220, 'Seven holes, two timings each, with the processed columns needed for the graph (y, T²y, y²) and units.', 'mark')
P.note(7, 580, 'T²y = My² + Mb²: plot T²y against y². Gradient = M, intercept = Mb², so b = √(intercept/M).', 'why')
P.note(8, 100, 'Check: g should come out near 9.8 m s⁻². b ≈ L/√12 for a uniform strip.', 'tip')
plan2 = ('Fix the bar magnet to end B (pole facing down) and set up a flat coil on the bench just below the lowest point of the swing, '
         'so the magnet passes close to (but does not touch) the coil. Connect the coil to a voltage sensor and datalogger (sampling at about 500 Hz). '
         'Displace the strip by a small angle and release. Each time the magnet passes over the coil an e.m.f. pulse is induced; the magnet passes twice per oscillation, '
         'so the period is the time between alternate pulses (or between alternate zero-crossings in the middle of the pulses). '
         'Find the time for 10 oscillations from the datalogger record and divide by 10. '
         'Precautions: use small amplitudes; keep the coil close to the magnet\'s path but not touching it; keep iron/steel objects away; '
         'use a high sampling rate; keep the coil fixed with tape; repeat and average.')
P.write_lines(9, plan2, after=460, size=9.0, q='Q2')
P.diagram(9, 160, 240, [('rect', 120, 0, 10, 170, '#f3e6c4'), ('circle', 125, 10, 2), ('text', 135, 12, 'pivot (nail)', 8.5), ('rect', 118, 170, 14, 22, '#fca5a5'),
                        ('text', 140, 185, 'bar magnet at end B', 8.5), ('rect', 96, 205, 58, 8), ('text', 160, 212, 'coil (flat, fixed)', 8.5),
                        ('line', 125, 213, 125, 220), ('rect', 180, 160, 80, 30), ('text', 220, 178, 'voltage sensor', 8.5, 'middle'), ('dash', [(154, 209), (180, 180)]),
                        ('rect', 280, 160, 70, 30), ('text', 315, 178, 'datalogger', 8.5, 'middle'), ('line', 260, 175, 280, 175),
                        ('arrow', 95, 150, 155, 150, True), ('text', 125, 145, 'small swing', 8, 'middle')], q='Q2')
P.note(9, 240, 'Diagram must show: strip pivoted, magnet on B, coil beneath the path, and the sensor and datalogger connected to the coil.', 'mark')
P.note(9, 480, 'Key physics: two pulses per oscillation. The period is the interval between alternate pulses.', 'why')
workbook(os.path.join(X, 'ASRJC_Q2_compound_pendulum.xlsx'), 'ASRJC Q2 – Compound pendulum (sample data)', f'a = {a2:.1f} cm. Times are for 20 oscillations.',
         ['z / cm', 't1 / s', 't2 / s'], [[r[0], r[1], r[2]] for r in rows2],
         proc=[('T / s', '=(B{r}+C{r})/40'), ('y / m', f'=({a2}-A{{r}})/100'), ('T²y / s² m', '=D{r}^2*E{r}'), ('y² / m²', '=E{r}^2')],
         chart=dict(x=7, y=6, title='T²y against y²', xt='y² / m²', yt='T²y / s² m'),
         results=[('M = gradient', '=SLOPE(F{first}:F{last},G{first}:G{last})', 's² m⁻¹'), ('b = √(intercept/M)', '=SQRT(INTERCEPT(F{first}:F{last},G{first}:G{last})/SLOPE(F{first}:F{last},G{first}:G{last}))', 'm'),
                  ('g = 4π²/M', '=4*PI()^2/SLOPE(F{first}:F{last},G{first}:G{last})', 'm s⁻²')])

# ======================= Q3 container stability =======================
d3, mc, zc = 4.52, 12.0, 5.6
def theta(h):
    mw = 1.0 * math.pi * (d3 / 2) ** 2 * h
    z = (mc * zc + mw * h / 2) / (mc + mw)
    return math.degrees(math.atan((d3 / 2) / z))
hs = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
rows3 = []
for h in hs:
    hm = round(h + (rnd.gauss(0, 0.04) if h else 0), 1)
    t = [round(theta(hm) + rnd.gauss(0, 0.8)) for _ in range(2)]
    rows3.append((hm, t[0], t[1], (t[0] + t[1]) / 2))
hbest = max(rows3, key=lambda r: r[3])[0]
h1 = rows3[1]
P.question('Q3', 'Stability of a container of water', 23, [10, 11, 12, 13, 14, 15],
           'Tilt a capped container until it topples and read the angle on a quadrant scale. Adding water first lowers then raises the centre of mass, '
           'so the toppling angle θ peaks. Test cos²θ = kh/((d/2)² + h²) and plan how to choose the minimum stable diameter.',
           sim='asrjc-q3', xlsx=[('ASRJC_Q3_container.xlsx', 'θ against h from 0 to 6 cm; find the h for maximum θ and test the suggested relationship.')],
           skills=['vernier caliper', 'judging a tipping angle', 'centre of mass reasoning', 'evaluation', 'planning'])
P.ans(10, 'd =', f'{d3:.2f} cm', q='Q3')
P.text(10, 130, 150, 'vernier jaws across the widest part; zero error 0.00 cm; repeated at 90°: 4.52, 4.53 cm', size=8.8, q='Q3')
P.ans(10, 'h =', f'{h1[0]:.1f} cm', q='Q3')
P.text(11, 130, 95, f'Δh ≈ 0.1 cm (meniscus and the base thickness make the zero hard to locate)\n% uncertainty = 0.1/{h1[0]:.1f} × 100%', size=9.2, q='Q3')
P.ans(11, 'percentage uncertainty', f'{0.1/h1[0]*100:.0f}%', q='Q3')
P.ans(12, 'θ =', f'{h1[3]:.0f}°', q='Q3')
P.ans(12, 'cos θ =', f'{math.cos(math.radians(h1[3])):.3f}', q='Q3')
P.write_lines(12, '1. The container tips over quickly, so it is hard to judge the exact angle at which it starts to fall (and to read the scale at that instant). '
              '2. The container may slide along the metal ruler instead of pivoting about its bottom edge, and the water sloshes, shifting the centre of mass.',
              after=280, before=410, size=9.0, q='Q3')
P.write_lines(12, 'Film the tilt with a slow-motion camera placed level with the scale and read θ from the last frame before it falls '
              '(or push slowly with a thin rod at a fixed height, with a stop strip at the base to prevent sliding).', after=480, size=9.0, q='Q3')
P.note(10, 160, 'Vernier to 0.01 cm. Check for zero error and measure across two perpendicular diameters.', 'mark')
P.note(11, 90, 'The half-metre rule reads to 0.1 cm, but a realistic Δh also includes judging the base and the meniscus.', 'mark')
P.note(12, 280, 'Two distinct sources (one mark each). They must be about THIS set-up.', 'mark')
P.table(13, 140, 140, ['h / cm', 'θ₁ / °', 'θ₂ / °', 'θ / °'], [[f'{r[0]:.1f}', r[1], r[2], f'{r[3]:.1f}'] for r in rows3], size=9.5, q='Q3')
P.text(13, 340, 160, f'θ is largest at about h = {hbest:.1f} cm\n(between the readings either side,\nthe peak lies near {hbest:.1f}–{hbest+0.5:.1f} cm)', size=9.0, q='Q3')
P.ans(13, 'h =', f'≈ {hbest+0.3:.1f} cm', q='Q3')
P.write_lines(13, 'A small amount of water sits below the centre of mass of the container, so adding it lowers the combined centre of mass and θ increases. '
              'Once the water surface is above the combined centre of mass, adding more water raises it, so θ decreases. θ is greatest when the centre of mass is at the water surface.',
              after=480, size=8.8, q='Q3')
P.note(13, 140, 'Include h = 0 (empty, capped) through 6 cm in steps of 1 cm, two trials each. Take extra readings near the peak.', 'mark')
P.note(13, 480, 'Explain with centre of mass: the toppling angle satisfies tan θ = (d/2)/(height of CM).', 'why')
r2_, r4_ = rows3[1], rows3[4]
def kval(r):
    return math.cos(math.radians(r[3])) ** 2 * ((d3 / 2) ** 2 + r[0] ** 2) / r[0]
k1, k2 = kval(r2_), kval(r4_)
P.text(14, 130, 200, f'k = cos²θ [(d/2)² + h²] / h\nh = {r2_[0]:.1f} cm, θ = {r2_[3]:.1f}°: k = {math.cos(math.radians(r2_[3]))**2:.3f} × ({(d3/2)**2:.2f} + {r2_[0]**2:.2f}) / {r2_[0]:.1f}\n'
       f'h = {r4_[0]:.1f} cm, θ = {r4_[3]:.1f}°: k = {math.cos(math.radians(r4_[3]))**2:.3f} × ({(d3/2)**2:.2f} + {r4_[0]**2:.2f}) / {r4_[0]:.1f}', size=9.0, q='Q3')
P.ans(14, 'first value of k', f'{k1:.1f} cm', q='Q3')
P.ans(14, 'second value of k', f'{k2:.1f} cm', q='Q3')
P.write_lines(14, 'h was measured to 2 s.f. (e.g. 1.0 cm, 4.0 cm) and θ to 2 s.f., so k is given to 2 s.f.', after=450, before=500, size=9.2, q='Q3')
pdk = abs(k1 - k2) / min(k1, k2) * 100
P.write_lines(14, f'The k values differ by {pdk:.0f}%, much more than the {0.1/h1[0]*100:.0f}% uncertainty in h, so the results do not support the suggested relationship.',
              after=690, size=9.2, q='Q3')
P.note(14, 190, 'Use two well-separated values of h (not neighbours near the peak) so a real difference shows.', 'tip')
plan3 = ('Use containers made of the same material with the same height and cap but different diameters d (at least 6, e.g. 3 cm to 9 cm). '
         'Fill each with the same depth (or the same proportion of the height) of soya sauce or water, as in actual use; measure d with vernier calipers. '
         'Tilt each container slowly from the top in front of the quadrant scale, as in (c), with a stop strip at the base edge so it pivots and does not slide; record the toppling angle θ. '
         'Repeat 3 times and average. Control: same height, wall material/thickness, cap, liquid, fill height and the same push point; level bench. '
         'Table: d / cm | θ₁ / ° | θ₂ / ° | θ₃ / ° | mean θ / ° | tan θ. '
         'Analysis: plot tan θ against d (expected straight line since tan θ = d/(2 × CM height)) or θ against d, and read off (interpolate) the diameter at which θ = 30°: '
         'this is the minimum diameter; a smaller container topples at less than 30°. '
         'Precautions: push slowly and gently; view the scale at eye level (or film it) to avoid parallax; wipe spills; check the container is upright with a set square before each trial.')
P.write_lines(15, plan3, after=280, size=9.0, q='Q3')
P.note(15, 290, 'Bullets to hit: procedure, control of variables, a table with units, how to find d at θ = 30° (graph and interpolation), and precautions.', 'mark')
P.note(15, 560, 'Linear option: tan θ against d is a straight line, which makes interpolation reliable.', 'why')
workbook(os.path.join(X, 'ASRJC_Q3_container.xlsx'), 'ASRJC Q3 – Toppling angle against water height (sample data)', f'd = {d3:.2f} cm.',
         ['h / cm', 'θ1 / °', 'θ2 / °'], [[r[0], r[1], r[2]] for r in rows3],
         proc=[('θ / °', '=(B{r}+C{r})/2'), ('cos²θ', '=COS(RADIANS(D{r}))^2'), ('k = cos²θ((d/2)²+h²)/h / cm', f'=IF(A{{r}}>0,E{{r}}*(({d3}/2)^2+A{{r}}^2)/A{{r}},"")')],
         chart=dict(x=1, y=4, title='θ against h', xt='h / cm', yt='θ / °', ttype='poly'),
         results=[('max θ (from data)', '=MAX(D{first}:D{last})', '°')])
P.build()
