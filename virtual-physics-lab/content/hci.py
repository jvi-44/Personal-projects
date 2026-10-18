import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_08_27)
P = Paper('hci', 'Hwa Chong Institution', 'HCI', '27 Aug 2026', os.path.join(PRIV, 'src', 'hci.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 springs at 90° =======================
k1, S_true = 40.0, 3.80          # N/m per spring, natural length cm
S = round(S_true + rnd.gauss(0, 0.03), 1)
rows1 = []
for m in (200, 250, 300, 350, 400, 450):
    phi = math.radians(rnd.uniform(47, 53))          # double spring direction from vertical
    T1, T2 = m / 1000 * g * math.cos(phi), m / 1000 * g * math.sin(phi)
    S1 = round(2 * S_true + 100 * 2 * T1 / k1 + rnd.gauss(0, 0.05), 1)
    S2 = round(S_true + 100 * T2 / k1 + rnd.gauss(0, 0.05), 1)
    p, q = (S1 - 2 * S) / 100, (S2 - S) / 100
    y = p * p / 4 + q * q
    rows1.append((m, S1, S2, p, q, y, (m / 1000) ** 2))
m1, c1, r21 = linfit([r[6] for r in rows1], [r[5] for r in rows1])
k_fit = g / math.sqrt(m1)
r0 = rows1[0]

P.question('Q1', 'Three springs at 90°', 11, [2, 3, 4, 5],
           'Mass hung from a double spring and a single spring meeting at 90°. Extensions p and q satisfy '
           'p²/4 + q² = g²m²/k², so a graph of (p²/4 + q²) against m² gives k.',
           sim='hci-q1', xlsx=[('HCI_Q1_springs.xlsx', 'Six sets of S₁, S₂ readings for m = 200–450 g. Process p, q, (p²/4 + q²) and m², then find k from the trendline.')], skills=['metre rule readings', 'tabulation', 'spreadsheet trendline'])

P.text(2, 110, 300, 'Metre rule held alongside the unstretched spring, eye level with the scale:\n'
       f'outer end of one hook at 10.0 cm, outer end of the other at {10 + S:.1f} cm', size=9.5, q='Q1')
P.ans(2, 'S =', f'{S:.1f} cm', q='Q1')
P.note(2, 160, 'Fig. 1.1 defines S from the outer edge of one hook to the outer edge of the other. Measure along the axis of the spring.')
P.note(2, 330, 'Record to the precision of the instrument: a metre rule gives 0.1 cm (1 mm). Always include the unit.', 'mark')
P.note(2, 420, 'Hold the rule parallel and close to the spring and read with your eye perpendicular to the scale to avoid parallax.')

P.ans(3, 'S 1 =', f'{r0[1]:.1f} cm', q='Q1')
P.ans(3, 'S 2 =', f'{r0[2]:.1f} cm', q='Q1')
P.text(3, 300, 652, f'p = {r0[1]:.1f} − 2({S:.1f}) = {100*r0[3]:.1f} cm\nq = {r0[2]:.1f} − {S:.1f} = {100*r0[4]:.1f} cm', size=9.5, q='Q1')
P.ans(3, 'p =', f'{r0[3]:.3f} m', q='Q1')
P.ans(3, 'q =', f'{r0[4]:.3f} m', q='Q1')
P.note(3, 400, 'Check the angle is 90° with a set square or protractor at the ring before every reading. Changing m changes the angle, so re-adjust the stands each time.')
P.note(3, 480, 'S1 is the length of the double spring, measured from the clamp rod to the ring (along the spring line). Measure along the spring, not vertically.')
P.note(3, 690, 'Convert to metres now: (b)(iii) asks for m², so p and q must be in m.', 'warn')

P.text(4, 141, 100, f'p²/4 + q² = ({r0[3]:.3f})²/4 + ({r0[4]:.3f})²\n            = {sci(r0[5], 4)}', size=9.5, q='Q1')
P.ans(4, '+ q 2 ) =', sci(r0[5], 3), dx=-4, q='Q1')
P.table(4, 92, 330, ['m / g', 'S₁ / cm', 'S₂ / cm', 'p / m', 'q / m', '(p²/4 + q²) / m²', 'm² / kg²'],
        [[r[0], f'{r[1]:.1f}', f'{r[2]:.1f}', f'{r[3]:.3f}', f'{r[4]:.3f}', sci(r[5], 3), f'{r[6]:.4f}'] for r in rows1],
        size=8.6, q='Q1')
P.text(4, 92, 520, 'Six sets of readings, m from 200 g to 450 g in 50 g steps (wide range, evenly spread).', size=8.6, q='Q1')
P.note(4, 245, 'Present results: each column heading has a quantity and a unit separated by a slash, e.g. S₁ / cm. Units never go in the body of the table.', 'mark')
P.note(4, 330, 'Raw lengths to 0.1 cm (the rule precision). Calculated quantities to the same s.f. as the raw data or one more.', 'mark')
P.note(4, 430, 'Aim for at least 6 values over the widest range the springs allow without over-stretching them.')
P.note(4, 520, 'Include an m² column. That is your x-variable in (d), and examiners like seeing it tabulated.')

P.graph(5, 110, 182, 320, 210, q='Q1', xlabel='m² / kg²', ylabel='(p²/4 + q²) / m²',
        xr=[0, 0.22], yr=[0, max(r[5] for r in rows1) * 1.12],
        series=[dict(pts=[(r[6], r[5]) for r in rows1])],
        lines=[dict(m=m1, c=c1)],
        eq='trendline: ' + eqn(m1, c1, 4, r2=r21),
        eqpos=(160, 196))
P.text(5, 110, 398, f'gradient = g²/k²  ⇒  k = g/√gradient = 9.81/√{m1:.4f}', size=9, q='Q1')
P.ans(5, 'k =', f'{k_fit:.1f} N m⁻¹', q='Q1')
P.write_lines(5, 'The graph is still a straight line through the origin, but the gradient g²/k² becomes '
              'g²/(2k)² = one quarter of the original gradient.', after=490, before=600, q='Q1')
P.note(5, 175, 'Write the trendline equation exactly as the spreadsheet gives it, with enough s.f. to read off the gradient.', 'mark')
P.note(5, 260, 'Linearise: y = (p²/4 + q²), x = m². Then the gradient is g²/k² and the intercept should be ≈ 0.')
P.note(5, 380, 'Sketch: label both axes with quantity and unit, mark the points as crosses, and draw the line of best fit.')
P.note(5, 470, '"Expected change": say both what changes (gradient ÷ 4) and what stays (straight line through the origin).', 'warn')

rows_xl = [[r[0], r[1], r[2]] for r in rows1]
workbook(os.path.join(X, 'HCI_Q1_springs.xlsx'), 'HCI Q1 – Springs at 90° (sample data)',
         f'Unstretched length S = {S:.1f} cm. Process the raw lengths, then plot (p²/4 + q²) against m² to find k.',
         ['m / g', 'S1 / cm', 'S2 / cm'], rows_xl,
         proc=[('p / m', f'=(B{{r}}-2*{S})/100'), ('q / m', f'=(C{{r}}-{S})/100'),
               ('(p²/4+q²) / m²', '=D{r}^2/4+E{r}^2'), ('m² / kg²', '=(A{r}/1000)^2')],
         chart=dict(x=7, y=6, title='(p²/4 + q²) against m²', xt='m² / kg²', yt='(p²/4 + q²) / m²'),
         results=[('gradient', '=SLOPE(F{first}:F{last},G{first}:G{last})', 'm² kg⁻²'),
                  ('y-intercept', '=INTERCEPT(F{first}:F{last},G{first}:G{last})', 'm²'),
                  ('k = g/√gradient', '=9.81/SQRT(SLOPE(F{first}:F{last},G{first}:G{last}))', 'N m⁻¹')])

# ======================= Q2 RC circuit =======================
C2, R2, V2 = 2200e-6, 10e3, 3.0
tau2 = R2 * C2
I_dis = []
for t in range(0, 60, 10):
    I = V2 / R2 * math.exp(-t / tau2) * 1000
    I_dis.append((t, round(I * (1 + rnd.gauss(0, 0.012)) + (0.008 if t == 0 else 0), 3)))
P.question('Q2', 'RC circuit: discharge and charging data', 15, [6, 7, 8, 9],
           'Capacitor charged through R₁ then discharged through R₂ while timing the current; an engineer\'s '
           'charging dataset is analysed (t₀, I₀, charge from area, τ from ln I graph); plan to compare ½CV² with the work done by the cell.',
           sim='hci-q2', xlsx=[('HCI_Q2a_discharge.xlsx', 'Discharge readings every 10 s. Practise ln I against t to get τ = R₂C.'), ('HCI_Q2b_charging_dataset.xlsx', 'A practice version of the engineer\'s datasetQ2b: 151 readings at 0.2 s intervals. Find t₀, I₀, Q (trapezium rule) and τ.')],
           skills=['timing readings', 'area under graph', 'ln-linearisation', 'planning'])
I20 = V2 / 3300 * math.exp(-20 / (3300 * C2)) * 1000
P.ans(6, 'I =', f'{I20:.3f} mA', q='Q2')
P.text(6, 133, 396, f'After 20 s ≈ {20/(3300*C2):.1f} R₁C (R₁C = 3.3 kΩ × 2200 µF ≈ {3300*C2:.1f} s), I has fallen to about {I20/(V2/3300*1000)*100:.0f}% of V/R₁:\nsmall but not zero.', size=8.4, q='Q2')
P.table(6, 160, 522, ['t / s', 'I / mA'], [[t, f'{i:.3f}'] for t, i in I_dis], size=8.8, cw=[60, 70], q='Q2')
P.text(6, 320, 540, 'Current is in the opposite direction\nto charging (meter shows −).\nReadings taken over several\ndischarges, a few values each run.', size=8.4, q='Q2')
P.write_lines(6, 'I falls quickly, so it is hard to read the meter at the exact instant the stopwatch reaches each 10 s mark.', after=730, q='Q2')
P.note(6, 250, 'Position 1: C charges through R₁ only (R₂ is in an open branch). Position 2: C discharges through R₂ only, so τ = R₂C.', 'why')
P.note(6, 400, 'Record the reading to the meter\'s precision (e.g. 0.058 mA). A small reading is expected: 20 s is only about 3 R₁C.', 'mark')
P.note(6, 520, 'You may need several discharges: recharge in position 1 between runs and read two or three values per run.')
P.note(6, 720, '"Problem" answers must be specific to this experiment (fast-changing reading, reaction time, sign of current), not "human error".', 'warn')

# Q2(b) engineer dataset
t0_true, I0_true, tau_b = 1.6, 0.900, 4.70
ds = []
for i in range(0, 151):
    t = round(i * 0.2, 1)
    I = 0.0 if t < t0_true else I0_true * math.exp(-(t - t0_true) / tau_b)
    I = max(0.0, I + rnd.gauss(0, 0.002)) if t >= t0_true else round(abs(rnd.gauss(0, 0.0008)), 4)
    ds.append((t, round(I, 4)))
# charge by trapezium from t0
Q_b = sum(0.5 * (ds[i][1] + ds[i + 1][1]) * 0.2 for i in range(len(ds) - 1) if ds[i][0] >= t0_true) / 1000
fit_pts = [(t - t0_true, math.log(I)) for t, I in ds if t0_true <= t <= t0_true + 15 and I > 0.02]
mb, cb, r2b = linfit([a for a, b in fit_pts], [b for a, b in fit_pts])
tau_fit = -1 / mb
P.ans(7, 't 0 =', f'{t0_true:.1f} s', q='Q2')
I0_read = next(I for t, I in ds if t >= t0_true)
P.ans(7, 'I 0 =', f'{I0_read:.3f} mA', q='Q2')
P.ans(7, 'Q =', f'{Q_b*1000:.2f} × 10⁻³ C', q='Q2')
P.write_lines(7, 'Q = area under the I–t graph from t₀ onwards, found in the spreadsheet with the trapezium rule: '
              'sum of ½(Iₙ + Iₙ₊₁)Δt over all intervals.', after=480, before=530, q='Q2')
P.graph(7, 150, 592, 260, 146, q='Q2', xlabel='(t − t₀) / s', ylabel='ln (I / mA)',
        xr=[0, 16], yr=[-3.5, 0.5], series=[dict(pts=fit_pts[::3], mark='dot')], lines=[dict(m=mb, c=cb)],
        eq=eqn(mb, cb, 4), eqpos=(300, 600), ny=4)
P.ans(7, '= ', f'{tau_fit:.2f} s', after=730, q='Q2')
P.text(7, 420, 690, f'gradient = −1/τ\nτ = 1/{abs(mb):.4f}', size=8.5, q='Q2')
P.note(7, 270, 't₀ is the time at which the current jumps from ≈ 0 (noise ≤ 0.001 mA) to its peak; I₀ is the reading at that time. Read both straight from the data column.')
P.note(7, 400, 'Units: mA × s = mC. Convert to coulombs and give 2–3 s.f.', 'warn')
P.note(7, 480, 'State the method precisely: "area under the I–t graph" plus how you found the area (trapezium sum in the spreadsheet).', 'mark')
P.note(7, 560, 'ln I = ln I₀ − (t − t₀)/τ. Plot ln I against (t − t₀) and use only the region where I ≫ noise (the tail flattens and goes noisy).', 'why')
P.note(7, 700, 'Check: τ should roughly equal the time for I to fall to 0.37 I₀ in the raw data.', 'tip')

workbook(os.path.join(X, 'HCI_Q2a_discharge.xlsx'), 'HCI Q2(a) – Discharge readings (sample data)',
         f'Discharge through R₂ = 10 kΩ. Practise: plot ln I against t; τ = −1/gradient should be ≈ R₂C.',
         ['t / s', 'I / mA'], [[t, i] for t, i in I_dis],
         proc=[('ln(I / mA)', '=LN(B{r})')],
         chart=dict(x=1, y=3, title='ln I against t (discharge)', xt='t / s', yt='ln (I / mA)'),
         results=[('gradient', '=SLOPE(C{first}:C{last},A{first}:A{last})', 's⁻¹'),
                  ('τ = −1/gradient', '=-1/SLOPE(C{first}:C{last},A{first}:A{last})', 's'),
                  ('C = τ/R₂', '=-1/SLOPE(C{first}:C{last},A{first}:A{last})/10000', 'F')])
workbook(os.path.join(X, 'HCI_Q2b_charging_dataset.xlsx'), 'HCI Q2(b) – Engineer\'s charging data (practice dataset)',
         'Find t₀ and I₀, the total charge (trapezium rule) and τ (plot ln I against t − t₀ for the clean early part).',
         ['t / s', 'I / mA'], [list(r) for r in ds],
         proc=[('t − t₀ / s', f'=IF(A{{r}}>={t0_true},A{{r}}-{t0_true},"")'),
               ('ln(I / mA)', f'=IF(AND(A{{r}}>={t0_true},B{{r}}>0.02),LN(B{{r}}),"")'),
               ('strip area / mA s', f'=IF(AND(A{{r}}>={t0_true},A{{r1}}<>""),0.5*(B{{r}}+B{{r1}})*0.2,"")')],
         chart=dict(x=3, y=4, title='ln I against (t − t₀)', xt='(t − t₀) / s', yt='ln (I / mA)'),
         results=[('t₀ (time of the jump to peak current)', t0_true, 's'), ('I₀ (reading at t₀)', I0_read, 'mA'),
                  ('Q = Σ strips', '=SUM(E{first}:E{last})/1000', 'C'),
                  ('gradient of ln I graph', f'=SLOPE(D{{first}}:D{{last}},C{{first}}:C{{last}})', 's⁻¹'),
                  ('τ = −1/gradient', f'=-1/SLOPE(D{{first}}:D{{last}},C{{first}}:C{{last}})', 's')],
         answer_note='Strip area uses the trapezium rule between consecutive readings (Δt = 0.2 s).')

# Q2(c) planning (numbered answer key in content/plans.py)
place(P, 'hci-q2c', [('lines', 8, 640, 800), ('lines', 9, 40, 420)], diagram=(8, 140, 375), notes=[(8, 120), (8, 660)], q='Q2')
P.note(9, 200, 'Precautions must be specific (polarity, voltage rating, discharge before each run, sampling rate). "Repeat readings" alone scores little.', 'warn')

# ======================= Q3 bent-wire torsion pendulum =======================
m3, k3 = 0.0680, 5.90e-3      # kg, torsion constant kg m^2 s^-2 (rubber band looped twice)
d_wire, D_bob, C3 = 0.092, 2.52, 16.4
th0 = 41
def period(C_cm, th_deg, k=k3):
    return 2 * math.pi * C_cm / 100 * math.sin(math.radians(th_deg) / 2) * math.sqrt(m3 / k)
T0 = period(C3, th0)
t10 = [round(10 * T0 * (1 + rnd.gauss(0, 0.004)), 2) for _ in range(2)]
P.question('Q3', 'Bent-wire torsion pendulum', 24, [11, 12, 13, 14, 15, 16, 17],
           'A V-shaped wire carrying two bobs hangs from a rubber band and oscillates about a vertical axis. '
           'T = 2πC sin(θ/2)√(m/k): plot T against sin(θ/2) to find k; compare two wires using T = πL√z; plan an investigation into the number of loops.',
           sim='hci-q3', xlsx=[('HCI_Q3_torsion.xlsx', 'θ and two 10-oscillation timings for six angles. Process T and sin(θ/2) and find k.')], skills=['micrometer', 'vernier caliper', 'protractor', 'timing oscillations', 'uncertainty & conclusions', 'planning'])
P.text(11, 133, 152, 'zero error = 0.00 mm\nreadings: 0.92, 0.91, 0.93 mm → mean 0.92 mm', size=9, q='Q3')
P.ans(11, 'd =', f'{d_wire:.3f}', q='Q3')
P.text(11, 133, 255, 'zero error = 0.00 cm; readings 2.52, 2.51, 2.53 cm', size=9, q='Q3')
P.ans(11, 'D =', f'{D_bob:.2f}', q='Q3')
P.ans(11, 'θ =', f'{th0}°', q='Q3')
P.note(11, 120, 'Micrometer: check the zero error first, take readings at several points along the wire and average. 0.01 mm precision → 0.001 cm here.', 'mark')
P.note(11, 230, 'Vernier caliper reads to 0.01 cm. Close the jaws gently on the bob\'s widest part and rotate it to check for roundness.')
P.note(11, 540, 'Protractor: put its centre exactly at the bend and read to the nearest degree. Extend the arms with a ruler if they are short.', 'tip')

T0_mean = sum(t10) / 20
P.ans(12, 'C =', f'{C3:.1f} cm', q='Q3')
P.text(12, 106, 635, f'Time for 10 oscillations: t₁ = {t10[0]:.2f} s, t₂ = {t10[1]:.2f} s\n'
       f'mean t = {sum(t10)/2:.2f} s\nT = t/10 = {T0_mean:.3f} s', size=9.5, q='Q3')
P.ans(12, 'T =', f'{T0_mean:.2f}', q='Q3')
P.note(12, 120, 'C runs from the top of the wire (the bend) to the centre of a bob. Measure to the top of the bob and add D/2.')
P.note(12, 520, 'C ≈ 16 cm is measured with a metre rule to 0.1 cm. State the unit (the answer line has none printed).', 'mark')
P.note(12, 640, 'Time at least 10 oscillations, twice, and average. Start and stop timing as the bob passes a fiducial marker at the equilibrium position, where it moves fastest.', 'mark')
P.note(12, 740, 'Show all raw times in your working. Examiners look for repeated readings.')

thetas = [40, 60, 80, 100, 120, 140]
rows3 = []
for th in thetas:
    thm = th + rnd.choice([-1, 0, 1])
    T = period(C3, thm)
    a, b = [round(10 * T * (1 + rnd.gauss(0, 0.005)), 2) for _ in range(2)]
    Tm = hu((a + b) / 20, 3)
    rows3.append((thm, a, b, Tm, math.sin(math.radians(thm) / 2)))
m3f, c3f, r23 = linfit([r[4] for r in rows3], [r[3] for r in rows3])
k_from = m3 * (2 * math.pi * C3 / 100 / m3f) ** 2
P.table(13, 105, 200, ['θ / °', 't₁ / s', 't₂ / s', 'T / s', 'sin (θ/2)'],
        [[r[0], f'{r[1]:.2f}', f'{r[2]:.2f}', f'{r[3]:.3f}', f'{r[4]:.3f}'] for r in rows3], size=9, q='Q3')
P.text(13, 360, 205, f'C = {C3:.1f} cm (constant)\nt = time for 10 oscillations\nT = (t₁ + t₂)/20', size=8.8, q='Q3')
P.graph(13, 105, 446, 270, 190, q='Q3', xlabel='sin (θ/2)', ylabel='T / s', xr=[0, 1.0], yr=[0, max(r[3] for r in rows3) * 1.15],
        series=[dict(pts=[(r[4], r[3]) for r in rows3])], lines=[dict(m=m3f, c=c3f)],
        eq=eqn(m3f, c3f, 4, r2=r23), eqpos=(160, 455))
P.text(13, 390, 560, f'gradient = 2πC√(m/k)\nk = m(2πC/gradient)²\n  = 0.0680(2π×0.{int(C3*10):03d}/{m3f:.3f})²', size=8.4, q='Q3')
P.ans(13, 'k =', f'{sci(k_from, 2)} kg m² s⁻²', size=9.5, q='Q3')
P.note(13, 190, 'Six values of θ across 40°–140° (as wide as the wire allows). Re-measure θ every time, because hanging the bobs changes it.', 'mark')
P.note(13, 300, 'Two timings per θ in the table, with the mean T to the same or one more d.p.')
P.note(13, 450, 'Plot T against sin(θ/2). It is a straight line through the origin with gradient 2πC√(m/k).', 'why')
P.note(13, 620, 'Units of k: from T = 2πC sin(θ/2)√(m/k), k = 4π²C²m/T² gives kg m² s⁻² (= N m).', 'warn')

# (e) two wires
thE = 36
L_long_true, C_short = 10.1, 9.05
T_long = math.pi * L_long_true / 100 * math.sqrt(m3 / k3) * (1 + rnd.gauss(0, 0.006))
L_short_true = 2 * C_short * math.sin(math.radians(thE) / 2)
T_short = math.pi * L_short_true / 100 * math.sqrt(m3 / k3) * (1 + rnd.gauss(0, 0.008))
L_long, L_short = 10.1, round(L_short_true, 1)
tl = [round(10 * T_long + d, 2) for d in (-0.03, 0.04)]
ts = [round(20 * T_short + d, 2) for d in (0.05, -0.04)]
Tl, Ts = hu(sum(tl) / 20, 3), hu(sum(ts) / 40, 3)
z1 = (Tl / (math.pi * L_long / 100)) ** 2
z2 = (Ts / (math.pi * L_short / 100)) ** 2
pctL = 0.2 / L_long * 100
pd = abs(z1 - z2) / min(z1, z2) * 100
P.ans(14, 'θ =', f'{thE}°', q='Q3')
P.ans(14, 'L =', f'{L_long:.1f} cm', q='Q3')
P.text(14, 104, 556, f'ΔL = 0.2 cm (hard to judge the centres of two moving bobs)\n%unc = 0.2/{L_long:.1f} × 100%', size=9, q='Q3')
P.ans(14, 'percentage uncertainty in L', f'{pctL:.0f}%', q='Q3')
P.text(14, 104, 665, f'10 oscillations: {tl[0]:.2f} s, {tl[1]:.2f} s\nmean = {sum(tl)/2:.3f} s, T = {sum(tl)/2:.3f}/10', size=9.5, q='Q3')
P.ans(14, 'T =', f'{Tl:.3f}', q='Q3')
P.note(14, 360, 'Keep θ identical for both wires. Bend the short wire using the protractor as a template.')
P.note(14, 520, 'Realistic ΔL is larger than the rule precision. You are judging the centres of two bobs, so ±0.1–0.2 cm is reasonable. Justify it in words.', 'mark')
P.note(14, 640, 'L = 2C sin(θ/2), so T = πL√(m/k). The relationship in (vi) is just the result from (d) rewritten in terms of L.', 'why')

P.ans(15, 'θ =', f'{thE}°', q='Q3')
P.ans(15, 'L =', f'{L_short:.1f} cm', q='Q3')
P.text(15, 104, 92, f'Short wire oscillates faster, so time 20 oscillations:\n{ts[0]:.2f} s, {ts[1]:.2f} s → mean = {sum(ts)/2:.3f} s, T = {sum(ts)/2:.3f}/20', size=9.5, q='Q3')
P.ans(15, 'T =', f'{Ts:.3f}', q='Q3')
P.text(15, 126, 430, f'z = (T / πL)²\nlong wire:  z = ({Tl:.3f} / π × 0.{int(L_long*10):03d})² = {z1:.2f}\n'
       f'short wire: z = ({Ts:.3f} / π × 0.0{int(L_short*10):02d})² = {z2:.2f}', size=9.5, q='Q3')
P.ans(15, 'first value of z', f'{z1:.1f} s² m⁻²', q='Q3')
P.ans(15, 'second value of z', f'{z2:.1f} s² m⁻²', q='Q3')
P.note(15, 90, 'With a shorter period, time more oscillations so that the total time (and its % uncertainty) is comparable.', 'tip')
P.note(15, 300, 'z = (T/πL)² carries the uncertainty of T and L. L has the larger % uncertainty, so give z to 2–3 s.f. (the same as L).', 'mark')
P.note(15, 600, 'z should equal m/k. Check it against your k from (d) for consistency.', 'tip')

support = pd <= 2 * pctL
P.write_lines(16, f'Percentage difference between the z values = {pd:.1f}%. Since z ∝ 1/L², the uncertainty in z from L alone is '
              f'about 2 × {pctL:.0f}% = {2*pctL:.0f}%. The difference is {"within" if support else "larger than"} this, so the results '
              f'{"support" if support else "do not support"} the relationship.', after=200, before=320, size=9.2, q='Q3')
P.write_lines(16, f'It is hard to judge the centres of the bobs when measuring L (and to set the same θ on the short wire): ΔL ≈ 0.2 cm '
              f'is about {0.2/L_short*100:.0f}% of the short L.', after=330, before=410, size=9.2, q='Q3')
P.write_lines(16, 'Measure the inside and outside separations of the bobs with a vernier caliper and average them, or photograph the wire '
              'against a mm scale.', after=440, before=525, size=9.2, q='Q3')
P.note(16, 160, 'Conclusion recipe: (1) % difference of the two values (2) compare with the stated % uncertainty (×2 because z ∝ L⁻²) (3) state support or not.', 'mark')
P.note(16, 330, 'Pick an error specific to part (e): judging bob centres for L, the short period, or θ changing when the bobs are hung.')
P.note(16, 440, 'The improvement must fix the error you named. "Repeat readings" or "be more careful" earn nothing.', 'warn')

place(P, 'hci-q3g', [('lines', 17, 240, 640), ('box', 18, 76, 90, 470, 640, 13.5)], notes=[(17, 180), (17, 520)], q='Q3')
P.note(17, 330, 'Inverse proportionality: plot T against 1/n for a straight line through the origin. A T against n curve on its own does not prove it.', 'why')

workbook(os.path.join(X, 'HCI_Q3_torsion.xlsx'), 'HCI Q3 – Bent-wire torsion pendulum (sample data)',
         f'C = {C3:.1f} cm, m = 68.0 g. Times are for 10 oscillations. Plot T against sin(θ/2) and find k.',
         ['θ / °', 't1 / s', 't2 / s'], [[r[0], r[1], r[2]] for r in rows3],
         proc=[('T / s', '=(B{r}+C{r})/20'), ('sin(θ/2)', '=SIN(RADIANS(A{r})/2)')],
         chart=dict(x=5, y=4, title='T against sin(θ/2)', xt='sin(θ/2)', yt='T / s'),
         results=[('gradient', '=SLOPE(D{first}:D{last},E{first}:E{last})', 's'),
                  ('intercept', '=INTERCEPT(D{first}:D{last},E{first}:E{last})', 's'),
                  ('k = m(2πC/gradient)²', f'=0.068*(2*PI()*{round(C3/100, 4)}/SLOPE(D{{first}}:D{{last}},E{{first}}:E{{last}}))^2', 'kg m² s⁻²')])

P.meta['sources'] = 'Suggested solutions written for practice; sample data generated from a physical model of each set-up.'
P.build()
