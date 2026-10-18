import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_08_27)
P = Paper('dhs', 'Dunman High School', 'DHS', '27 Aug 2026', os.path.join(PRIV, 'src', 'dhs.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 paper cone terminal velocity =======================
# cone mass ∝ remaining paper ∝ d; drag ∝ v²d², so v ∝ 1/√d (not 1/d)
def v_of(d):
    return 1.45 * math.sqrt(0.0916 / (d / 100))
d1a, d1b = 9.12, 9.20
d1 = (d1a + d1b) / 2
d2a, d2b = 7.35, 7.41
d2 = (d2a + d2b) / 2
h = 1.000
t1s = [0.69, 0.72, 0.66, 0.70, 0.71]
t1 = sum(t1s) / len(t1s)
v1 = h / t1
t2s = [round(h / v_of(d2) + e, 2) for e in (0.02, -0.03, 0.01, -0.01, 0.02)]
t2 = sum(t2s) / len(t2s)
v2 = h / t2
k1, k2 = v1 * d1 / 100, v2 * d2 / 100
diffk = abs(k1 - k2) / min(k1, k2) * 100
ut = (max(t1s) - min(t1s)) / 2 / t1 * 100
P.question('Q1', 'Terminal velocity of a paper cone', 14, [2, 3, 4, 5, 6, 7],
           'Time a filter-paper cone falling at terminal velocity, then cut a smaller cone and test v ∝ 1/d. '
           'Plan a loaded-cone (paperclip) experiment and find the energy dissipated from the area under a drag force–distance graph.',
           sim='dhs-q1', xlsx=[('DHS_Q1h_drag_dataset.xlsx', 'A practice version of datasetQ1h: drag force F against distance s. Area under the graph (trapezium rule) up to 1.000 m.')],
           skills=['vernier calipers', 'timing short intervals', 'significant figures', 'testing proportionality', 'planning', 'area under a graph'])
P.text(2, 122, 615, f'Two perpendicular diameters across the rim: {d1a:.2f} cm, {d1b:.2f} cm\nd = ({d1a:.2f} + {d1b:.2f}) / 2', size=9.5, q='Q1')
P.ans(2, 'd =', f'{d1:.2f} cm', q='Q1')
P.note(2, 600, 'Measure across the rim in two perpendicular directions: the taped cone is rarely perfectly round.', 'tip')
P.text(3, 122, 420, 'Released from about 30 cm above the top of the rule so that it has (very nearly) reached\nterminal velocity before the 100 cm mark.\n'
       'Timed from passing the top of the rule until it lands on the bench.\n'
       't / s: ' + ', '.join(f'{t:.2f}' for t in t1s), size=8.8, q='Q1')
P.ans(3, 'h =', f'{h*100:.1f} cm', q='Q1')
P.ans(3, 't =', f'{t1:.2f} s', q='Q1')
P.text(3, 122, 600, f'v = h / t = {h:.3f} / {t1:.2f}', size=9.5, q='Q1')
P.ans(3, 'v =', f'{v1:.1f} m s⁻¹', q='Q1')
P.note(3, 420, 'A fall of under a second: repeat at least 5 times and average to beat random reaction-time errors.', 'mark')
P.write_lines(4, f't = {t1:.2f} s is known to 2 s.f. (the timings scatter by ±0.03 s, so the hundredths place is the least certain), while h = 1.000 m is to 4 s.f.; '
              'so v is given to 2 s.f., the least number of s.f. of the data used.', after=62, before=225, size=9.0, q='Q1')
P.write_lines(4, f'The fall time (≈ {t1:.1f} s) is short compared with the reaction time in starting and stopping the stopwatch (≈ 0.1–0.2 s), '
              'so the percentage uncertainty in t is large.', after=231, before=400, size=9.0, q='Q1')
P.text(4, 122, 655, f'Two perpendicular diameters: {d2a:.2f} cm, {d2b:.2f} cm', size=9.5, q='Q1')
P.ans(4, 'd =', f'{d2:.2f} cm', q='Q1')
P.table(5, 99, 150, ['cone', 'd / cm', 't / s (five drops)', 'mean t / s', 'v / m s⁻¹', 'vd / m² s⁻¹', 'v√d / m^(3/2) s⁻¹'],
        [['1', f'{d1:.2f}', ' '.join(f'{t:.2f}' for t in t1s), f'{t1:.2f}', f'{v1:.1f}', f'{k1:.3f}', f'{v1*math.sqrt(d1/100):.3f}'],
         ['2', f'{d2:.2f}', ' '.join(f'{t:.2f}' for t in t2s), f'{t2:.2f}', f'{v2:.1f}', f'{k2:.3f}', f'{v2*math.sqrt(d2/100):.3f}']], size=8.0, q='Q1')
P.text(5, 99, 220, 'h = 1.000 m for both cones. vd and v√d are calculated from the unrounded mean times.', size=8.6, q='Q1')
P.write_lines(5, f'If v ∝ 1/d, then vd should be constant. The two values of vd differ by {diffk:.0f}%. '
              f'The percentage uncertainty in v is about {ut:.0f}% (half the spread of t) and in d about 1%, so about {ut+1:.0f}% in vd. '
              f'Since {diffk:.0f}% > {ut+1:.0f}%, the difference is not explained by the uncertainty: I do not agree that v is inversely proportional to d. '
              '(v√d is nearly constant instead. The paper mass ∝ d, while the drag ∝ v²d², which gives v ∝ 1/√d.)', after=300, size=8.9, q='Q1')
P.note(5, 150, 'Two cones only: calculate k = vd for each, compare the percentage difference with your estimated uncertainty, then conclude.', 'mark')
P.note(5, 470, 'Why not 1/d: cutting a bigger sector reduces the weight as well as the diameter.', 'why')
place(P, 'dhs-q1g', [('lines', 6, 320, 760)], notes=[(6, 330)], q='Q1')
# (h) dataset
W, vt = 0.020, 3.0
s0 = vt * vt / (2 * g)
dsF = [(round(0.025 * i, 3), round(W * (1 - math.exp(-0.025 * i / s0)) * (1 + rnd.gauss(0, 0.006)), 5)) for i in range(49)]
E_d = sum((dsF[i][1] + dsF[i + 1][1]) / 2 * (dsF[i + 1][0] - dsF[i][0]) for i in range(40))
P.graph(7, 120, 290, 340, 230, q='Q1', xlabel='s / m', ylabel='F / N', xr=[0, 1.2], yr=[0, 0.022], ny=4, nx=6,
        series=[dict(pts=[(s, F) for s, F in dsF[::2]], mark='dot')],
        curves=[dict(pts=[(s, W * (1 - math.exp(-s / s0))) for s, _ in dsF])],
        notes=[(300, 470, 'area from s = 0 to 1.000 m', 8.5), (300, 482, '= energy dissipated', 8.5)])
P.text(7, 99, 540, 'Work done against drag = ∫F ds, so the energy dissipated is the area under the F–s graph\nfrom s = 0 to 1.000 m. In the spreadsheet: strip area = ½(F₁ + F₂)(s₂ − s₁) for each pair of\nrows (trapezium rule), then sum the strips up to 1.000 m.', size=8.4, q='Q1')
P.ans(7, 'energy dissipated', f'{E_d:.4f}', q='Q1')
P.note(7, 300, 'The force rises towards the weight 0.020 N as the cone approaches terminal velocity, so the area is less than W × 1.000 m = 0.020 J.', 'why')
workbook(os.path.join(X, 'DHS_Q1h_drag_dataset.xlsx'), 'DHS Q1(h) – Drag force against distance (practice dataset)', 'W = 0.020 N, d = 11.0 cm. Find the area under the F–s graph from 0 to 1.000 m.',
         ['s / m', 'F / N'], [list(r) for r in dsF], proc=[('strip area / J', '=IF(A{r1}="","",(B{r}+B{r1})/2*(A{r1}-A{r}))')],
         chart=dict(x=1, y=2, title='F against s', xt='s / m', yt='F / N'),
         results=[('energy dissipated (0 to 1.000 m)', '=SUMIFS(C{first}:C{last},A{first}:A{last},"<0.9999")', 'J')])

# ======================= Q2 resistor network =======================
E, R, rs = 1.55, 33.0, 1.4      # rs = internal resistance of cell + ammeter
def I_of(n):
    return E / (R * (4 - n * n / (n + 1)) + rs)
rows2 = []
for n in range(5):
    I = I_of(n) * 1000 * (1 + rnd.gauss(0, 0.002))
    rows2.append((n, round(I, 2)))
xs2 = [n * n / (n + 1) for n, _ in rows2]
ys2 = [1000 / I for _, I in rows2]
mR, cR, r2R = linfit(xs2, ys2)
xint = -cR / mR
R_est = -mR * E
P.question('Q2', 'Five-resistor network', 12, [8, 9, 10, 11],
           'Moving the tapping X brings the fifth resistor in parallel with n of the chain. 1/I = −(R/E)·n²/(n+1) + 4R/E: plot 1/I against n²/(n+1), then R = −gradient × E.',
           sim='dhs-q2', xlsx=[('DHS_Q2_resistor_network.xlsx', 'Five (n, I) readings. Plot 1/I against n²/(n+1).')],
           skills=['circuit building', 'ammeter readings', 'linearisation', 'x-intercept', 'sketching a second line'])
P.ans(8, 'I 0 =', f'{rows2[0][1]:.2f}', q='Q2')
P.note(8, 590, 'With X at J both ends of the extra resistor are at J, so it carries no current: the circuit is just 4R in series.', 'why')
P.table(9, 140, 130, ['position', 'n', 'I / mA', 'n²/(n + 1)', '(1/I) / A⁻¹'],
        [['JKLMN'[n], n, f'{I:.2f}', f'{x:.3f}', f'{y:.2f}'] for (n, I), x, y in zip(rows2, xs2, ys2)], size=9.5, q='Q2')
P.text(9, 140, 290, 'Switch opened between readings so the cell does not run down.', size=8.4, q='Q2')
P.note(9, 130, 'Processed columns n²/(n+1) and 1/I with units; I to the same d.p. throughout.', 'mark')
P.note(9, 500, 'Compare with y = mx + c: y = 1/I, x = n²/(n + 1), gradient −R/E, y-intercept 4R/E.', 'why')
P.graph(10, 130, 128, 340, 250, q='Q2', xlabel='n²/(n + 1)', ylabel='(1/I) / A⁻¹', xr=[0, 5.5], yr=[0, 120], nx=6, ny=6,
        series=[dict(pts=list(zip(xs2, ys2)))], lines=[dict(m=mR, c=cR, x=[0, 5.5]), dict(m=-R / E, c=5 * R / E, x=[0, 5.5], dash='4,2', label='(e)', ldy=-6)],
        eq=eqn(mR, cR, 4, r2=r2R), eqpos=(360, 140))
P.text(10, 140, 400, f'From the trendline: gradient = {mR:.2f} A⁻¹,  y-intercept = {cR:.2f} A⁻¹\n'
       f'x-intercept: 0 = {mR:.2f}x + {cR:.2f}  ⇒  x = {cR:.2f}/{-mR:.2f}', size=9.0, q='Q2')
P.ans(10, 'gradient =', f'{mR:.1f} A⁻¹', q='Q2')
P.ans(10, 'x-intercept =', f'{xint:.2f}', q='Q2')
P.ans(10, 'E =', f'{E:.2f} V', q='Q2')
P.text(10, 140, 650, f'gradient = −R/E  ⇒  R = −gradient × E = {-mR:.2f} × {E:.2f}', size=9.5, q='Q2')
P.ans(10, 'R =', f'{R_est:.1f} Ω', q='Q2')
P.note(10, 400, 'Theory gives an x-intercept of exactly 4. A value slightly above 4 means extra resistance (cell + ammeter) adds to the 4R term.', 'why')
P.note(10, 560, 'Multimeter on the 2 V (or 20 V) d.c. range directly across the cell with the switch open.', 'tip')
P.text(11, 99, 172, 'Drawn as the dashed line (e) on the graph in (d)(i): same gradient −R/E, y-intercept 5R/E,\nso it is parallel to and above the original line.', size=8.4, q='Q2')
P.text(11, 99, 250, 'Maximum current when X is at N (n = 4): the extra R is in parallel with all four,\n'
       'R_total = 4R·R/(5R) = 0.8R = 0.8 × 0.1 = 0.08 Ω\n'
       f'I = E/R_total = {E:.2f}/0.08 (ignoring the internal resistance of the cell)', size=9.0, q='Q2')
P.ans(11, 'maximum current =', f'{E/0.08:.0f}', q='Q2')
P.note(11, 250, 'In practice the cell’s internal resistance (≈ 0.5–1 Ω) would limit the current to about 2 A. State the assumption you make.', 'warn')
workbook(os.path.join(X, 'DHS_Q2_resistor_network.xlsx'), 'DHS Q2 – Resistor network (sample data)', f'E = {E:.2f} V. Plot 1/I against n²/(n+1).',
         ['n', 'I / mA'], [list(r) for r in rows2], proc=[('n²/(n+1)', '=A{r}^2/(A{r}+1)'), ('(1/I) / A⁻¹', '=1000/B{r}')],
         chart=dict(x=3, y=4, title='1/I against n²/(n+1)', xt='n²/(n+1)', yt='(1/I) / A⁻¹'),
         results=[('gradient = −R/E', '=SLOPE(D{first}:D{last},C{first}:C{last})', 'A⁻¹'), ('y-intercept = 4R/E', '=INTERCEPT(D{first}:D{last},C{first}:C{last})', 'A⁻¹'),
                  ('x-intercept', '=-INTERCEPT(D{first}:D{last},C{first}:C{last})/SLOPE(D{first}:D{last},C{first}:C{last})', ''),
                  (f'R = −gradient × E (E = {E} V)', f'=-SLOPE(D{{first}}:D{{last}},C{{first}}:C{{last}})*{E}', 'Ω')])

# ======================= Q3 bifilar suspension =======================
Lr, wr, Mr = 0.500, 0.025, 0.0462
I0 = Mr * (Lr ** 2 + wr ** 2) / 12
def T_bif(l, d, I, M):
    return 2 * math.pi * math.sqrt(4 * I * l / (M * g * d * d))
ka = 16 * math.pi ** 2 * I0 / (Mr * g)
dA, lA = 0.400, 0.202
dC, lC = 0.300, 0.351
TA = T_bif(lA, dA, I0, Mr)
TC = T_bif(lC, dC, I0, Mr)
tA20 = [round(20 * TA * (1 + e), 2) for e in (0.002, -0.001)]
tC10 = [round(10 * TC * (1 + e), 2) for e in (-0.002, 0.001)]
TAm, TCm = sum(tA20) / 40, sum(tC10) / 20
kA = TAm ** 2 * dA ** 2 / lA
kC = TCm ** 2 * dC ** 2 / lC
dk = abs(kA - kC) / min(kA, kC) * 100
m = 0.0500
M = Mr + 2 * m
rows3 = []
for xc in (3.0, 6.0, 9.0, 12.0, 19.0, 22.0):   # masses kept clear of the string loops at ±15 cm
    x = xc / 100
    T = T_bif(lC, dC, I0 + 2 * m * x * x + 2 * 2.0e-6, M)
    t = [round(10 * T * (1 + rnd.gauss(0, 0.003)), 2) for _ in range(2)]
    Tm = hu(sum(t) / 20, 3)
    rows3.append((xc, t[0], t[1], Tm, Tm * Tm, x * x))
mC, cC, r2C = linfit([r[5] for r in rows3], [r[4] for r in rows3])
I0_p = cC * M * g * dC ** 2 / (4 * math.pi ** 2 * lC)
P.question('Q3', 'Bifilar suspension (playground ride model)', 24, [12, 13, 14, 15, 16, 17, 18, 19],
           'A half-metre rule hangs from two string loops a distance d apart and twists about a vertical axis. Test T² = kl/d² with two set-ups, '
           'then plan and carry out a study of how two masses at ±x change T: T² is linear in x², and the intercept C gives I₀.',
           sim='dhs-q3', xlsx=[('DHS_Q3_bifilar.xlsx', 'Six positions x with two timings each. Plot T² against x² and find C.')],
           skills=['measuring between strings', 'percentage uncertainty', 'timing oscillations', 'testing a relationship', 'planning', 'T² against x²'])
P.ans(12, 'd =', f'{dA*100:.1f} cm', q='Q3')
P.text(12, 126, 660, 'Δd ≈ 0.2 cm: judging the centre of each string loop against the rule scale\n(parallax, loop thickness). '
       f'% uncertainty = 0.2 / {dA*100:.1f} × 100%', size=8.8, q='Q3')
P.ans(12, 'percentage uncertainty in d', f'{0.2/(dA*100)*100:.1f}%', q='Q3')
P.note(12, 597, 'Read both strings at the same edge (e.g. left edge of each loop) so the loop thickness cancels.', 'tip')
P.ans(13, 'l =', f'{lA*100:.1f} cm', q='Q3')
P.text(13, 126, 215, 'Δl ≈ 0.2 cm: the rule is held near the strings, judging the faces by eye\n'
       f'% uncertainty = 0.2 / {lA*100:.1f} × 100%', size=8.8, q='Q3')
P.ans(13, 'percentage uncertainty in l', f'{0.2/(lA*100)*100:.0f}%', q='Q3')
P.text(13, 126, 395, f'20 oscillations: {tA20[0]:.2f} s, {tA20[1]:.2f} s\nT = ({tA20[0]:.2f} + {tA20[1]:.2f}) / 40', size=9.0, q='Q3')
P.ans(13, 'T =', f'{TAm:.3f} s', q='Q3')
P.ans(13, 'd =', f'{dC*100:.1f} cm', q='Q3')
P.fill(13, 404, 631, f'{lC*100:.1f} cm', q='Q3')
P.text(13, 126, 655, f'10 oscillations: {tC10[0]:.2f} s, {tC10[1]:.2f} s\nT = ({tC10[0]:.2f} + {tC10[1]:.2f}) / 20', size=9.0, q='Q3')
P.ans(13, 'T =', f'{TCm:.3f} s', nth=1, q='Q3')
P.note(13, 395, 'Small twist (about 10°) so the rule does not swing sideways; start timing at the centre of the swing.', 'tip')
P.text(14, 126, 170, f'k = T²d²/l\nfirst: {TAm:.3f}² × {dA:.3f}² / {lA:.3f}\nsecond: {TCm:.3f}² × {dC:.3f}² / {lC:.3f}', size=9.2, q='Q3')
P.ans(14, 'first value of k =', f'{kA:.3f} s² m', q='Q3')
P.ans(14, 'second value of k =', f'{kC:.3f} s² m', q='Q3')
P.write_lines(14, f'The two values of k differ by {dk:.1f}%. The uncertainty in k is at least 2 × {0.2/(dA*100)*100:.1f}% (d²) + {0.2/(lA*100)*100:.0f}% (l) ≈ '
              f'{2*0.2/(dA*100)*100 + 0.2/(lA*100)*100:.0f}%. Since {dk:.1f}% is less than this, the results support the suggested relationship.', after=432, size=9.0, q='Q3')
P.note(14, 432, 'Compare the % difference in k with the combined % uncertainty from (a)(ii) and (a)(iv) (d is squared, so double it).', 'mark')
P.text(15, 120, 300, 'Diagram (front view)', size=9.5, q='Q3')
place(P, 'dhs-q3e', [('lines', 16, 60, 530), ('box', 16, 126, 534, 410, 240, 13.5)], diagram=(15, 140, 330), notes=[(15, 330)], q='Q3')
P.table(17, 140, 95, ['x / cm', 't₁ / s', 't₂ / s', 'T / s', 'T² / s²', 'x² / m²'],
        [[f'{r[0]:.1f}', f'{r[1]:.2f}', f'{r[2]:.2f}', f'{r[3]:.3f}', f'{r[4]:.3f}', f'{r[5]:.4f}'] for r in rows3], size=9.5, q='Q3')
P.text(17, 140, 290, f't₁, t₂ = time for 10 oscillations. d = {dC*100:.1f} cm and l = {lC*100:.1f} cm throughout; m = {m*1000:.1f} g each.', size=8.6, q='Q3')
P.note(17, 95, 'Six x values over a wide range, repeat timings, T² and x² columns with units.', 'mark')
P.graph(18, 130, 186, 340, 205, q='Q3', xlabel='x² / m²', ylabel='T² / s²', xr=[0, 0.06], yr=[0, 3.0], nx=6, ny=6,
        series=[dict(pts=[(r[5], r[4]) for r in rows3])], lines=[dict(m=mC, c=cC, x=[0, 0.06])], eq=eqn(mC, cC, 4, r2=r2C), eqpos=(185, 205))
P.ans(18, 'C =', f'{cC:.3f}', q='Q3')
P.write_lines(18, f'T² increases linearly with x² (straight line with a positive intercept, R² = {r2C:.4f}). '
              f'At x\u00a0=\u00a00, T = √C = {math.sqrt(cC):.3f} s, which is smaller than T = {TCm:.3f} s in (c). '
              'With the masses at the centre the extra mass adds to the weight, and so to the restoring torque (∝ Mg), but adds almost nothing to the '
              'moment of inertia, so the rule turns back faster and the period is shorter.', after=410, size=8.9, q='Q3')
P.note(18, 175, 'T² = (16π²l/(Mgd²))(I₀ + 2mx²): straight line in x², gradient ∝ 2m, intercept ∝ I₀.', 'why')
P.ans(19, 'M =', f'{M*1000:.1f}', q='Q3')
P.text(19, 126, 380, f'I₀ = C M g d² / (4π² l)\n   = {cC:.3f} × {M:.4f} × 9.81 × {dC:.3f}² / (4π² × {lC:.3f})', size=9.5, q='Q3')
P.ans(19, 'I 0 =', sci(I0_p, 3), q='Q3')
P.note(19, 380, f'Check: a rule of mass {Mr*1000:.0f} g and length 0.50 m has ML²/12 ≈ {sci(I0, 2)} kg m². The printed expression gives 4× this; '
       'a full torque analysis gives 16π² instead of 4π². Use the expression as printed in the exam.', 'warn')
P.note(19, 700, 'The unit of I₀ is kg m² (the paper prints kg m⁻²).', 'warn')
workbook(os.path.join(X, 'DHS_Q3_bifilar.xlsx'), 'DHS Q3 – Bifilar suspension with two masses (sample data)',
         f'd = {dC*100:.1f} cm, l = {lC*100:.1f} cm, M = {M*1000:.1f} g. Times are for 10 oscillations.',
         ['x / cm', 't1 / s', 't2 / s'], [[r[0], r[1], r[2]] for r in rows3],
         proc=[('T / s', '=(B{r}+C{r})/20'), ('T² / s²', '=D{r}^2'), ('x² / m²', '=(A{r}/100)^2')],
         chart=dict(x=6, y=5, title='T² against x²', xt='x² / m²', yt='T² / s²'),
         results=[('gradient', '=SLOPE(E{first}:E{last},F{first}:F{last})', 's² m⁻²'), ('C = intercept', '=INTERCEPT(E{first}:E{last},F{first}:F{last})', 's²'),
                  ('I₀ = CMgd²/(4π²l)', f'=INTERCEPT(E{{first}}:E{{last}},F{{first}}:F{{last}})*{M}*9.81*{dC}^2/(4*PI()^2*{lC})', 'kg m²')])
P.build()
