import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_08_18)
P = Paper('ejc', 'Eunoia Junior College', 'EJC', '18 Aug 2026', os.path.join(PRIV, 'src', 'ejc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81
XL = 'application'

# ======================= Q1 parametric (spring-string) pendulum =======================
ks = 25.4
def Tspring(m): return 2 * math.pi * math.sqrt(m / ks)
res = {}
for m in (0.300, 0.400):
    T = Tspring(m)
    t20 = [round(20 * T * (1 + rnd.gauss(0, 0.003)), 2) for _ in range(2)]
    Tm = hu(sum(t20) / 40, 3)
    l = g * Tm ** 2 / math.pi ** 2
    d = round(l * 100 + rnd.gauss(0, 0.3), 1)
    t = round(76.0 * m * (1 + rnd.gauss(0, 0.015)), 1)
    res[m] = dict(t20=t20, T=Tm, l=l, d=d, t=t)
a, b = res[0.300], res[0.400]
k1, k2 = a['t'] ** 2 / 0.300 ** 2, b['t'] ** 2 / 0.400 ** 2
pct_t = 1.0 / a['t'] * 100
pdk = abs(k1 - k2) / min(k1, k2) * 100

P.question('Q1', 'Parametric oscillations of a spring–string pendulum', 14, [2, 3, 4, 5, 6],
           'Find the vertical period T of a mass on a spring, tie a string so d ≈ gT²/π² (pendulum period = 2T), '
           'then time the energy exchange between swinging and bouncing. Test t² = km² with two masses.',
           sim='ejc-q1', xlsx=[('EJC_Q1_parametric.xlsx', 'Sample readings for m = 300 g and 400 g with the k = t²/m² comparison.')],
           skills=['timing many oscillations', 'percentage uncertainty', 'two-point test of a relationship'])
P.ans(2, 'm', '300 g  (0.300 kg)', q='Q1')
P.text(2, 222, 595, f'Time for 20 oscillations: {a["t20"][0]:.2f} s, {a["t20"][1]:.2f} s\nmean = {sum(a["t20"])/2:.2f} s   T = mean/20', size=9.5, q='Q1')
P.ans(2, 'T', f'{a["T"]:.3f} s', q='Q1')
P.note(2, 480, 'Even a "record m" line deserves a unit (and it is the value written on the masses: 300 g).', 'mark')
P.note(2, 580, 'T ≈ 0.7 s is short, so time 20 oscillations (≥ 10 s total) twice. Start the count at "zero" as the mass passes the equilibrium point.', 'mark')
P.note(2, 660, f'Give T to the precision of t/20, e.g. {a["T"]:.3f} s. Do not round it to 0.7 s.', 'warn')

P.text(3, 185, 160, f'l = gT²/π² = 9.81 × ({a["T"]:.3f})² / π²\n   = {a["l"]:.4f} m', size=10, q='Q1')
P.ans(3, 'l', f'{a["l"]:.3f} m  ({100*a["l"]:.1f} cm)', q='Q1')
P.text(3, 222, 650, f'measured with a metre rule from the top of the string\nto the centre of the slotted masses', size=9, q='Q1')
P.ans(3, 'd', f'{a["d"]:.1f} cm', q='Q1')
P.note(3, 120, 'Why this l: a pendulum of length l = gT²/π² has period 2π√(l/g) = 2T, exactly twice the bounce period. That 2:1 tuning is what makes the parametric energy exchange happen.', 'why')
P.note(3, 230, 'Keep l to 3 s.f. (same as T). You need it in cm to tie the knot.')
P.note(3, 640, 'Locate the centre of the masses with a set square against the rule. d is to the centre, not the bottom.', 'tip')

P.text(4, 141, 208, f'Released, timed from one "still coils" moment to the next:\nt = {a["t"]:.1f} s', size=9.2, q='Q1')
P.ans(4, 't', f'{a["t"]:.1f} s', q='Q1')
P.text(4, 141, 336, f'Judging the instant the coils look stationary: Δt ≈ 1 s\n% uncertainty = 1/{a["t"]:.1f} × 100%', size=9.2, q='Q1')
P.ans(4, 'percentage uncertainty', f'{pct_t:.0f}%', q='Q1')
P.text(4, 141, 480, f'20 oscillations: {b["t20"][0]:.2f} s, {b["t20"][1]:.2f} s\nmean = {sum(b["t20"])/2:.3f} s, T = mean/20\nl = 9.81 × ({b["T"]:.3f})²/π²', size=9.2, q='Q1')
P.ans(4, 'm', '400 g', q='Q1')
P.ans(4, 'T', f'{b["T"]:.3f} s', q='Q1')
P.ans(4, 'l', f'{b["l"]:.3f} m', q='Q1')
P.note(4, 150, 'The interval is long (≈ 20–30 s) and the moment is a judgement, so the uncertainty is reaction/judgement, not stopwatch precision (0.01 s).', 'why')
P.note(4, 330, 'Realistic Δt here is about 1 s. Quoting ±0.01 s or ±0.2 s (reaction time only) understates it.', 'warn')

P.ans(5, 'd', f'{b["d"]:.1f} cm', q='Q1')
P.ans(5, 't', f'{b["t"]:.1f} s', q='Q1')
P.text(5, 141, 430, f'k = t²/m²\nk₁ = ({a["t"]:.1f})² / (0.300)² = {k1:.0f}\nk₂ = ({b["t"]:.1f})² / (0.400)² = {k2:.0f}', size=10, q='Q1')
P.ans(5, 'first value of k', f'{sci(k1, 2)} s² kg⁻²', q='Q1')
P.ans(5, 'second value of k', f'{sci(k2, 2)} s² kg⁻²', q='Q1')
P.note(5, 420, 'Give k to 2 s.f. (t is only good to about 4%). Include the unit s² kg⁻².', 'mark')

support = pdk <= 2 * pct_t
P.write_lines(6, f'Percentage difference between the k values = |{k1:.0f} − {k2:.0f}| / {min(k1,k2):.0f} × 100% = {pdk:.1f}%. '
       f'Since k ∝ t², the uncertainty in k is about 2 × {pct_t:.1f}% ≈ {2*pct_t:.0f}%. '
       f'{pdk:.1f}% is {"less" if support else "more"} than {2*pct_t:.0f}%, so the results {"support" if support else "do not support"} t² = km².',
       after=100, size=9.2, q='Q1')
P.note(6, 110, 'Always compare like with like: % difference in k against the % uncertainty in k (doubled, because t is squared).', 'mark')
P.note(6, 250, 'Two data points can only "support" a relationship; they cannot prove it.')

workbook(os.path.join(X, 'EJC_Q1_parametric.xlsx'), 'EJC Q1 – Spring–string parametric oscillator (sample data)',
         'Times for 20 vertical oscillations, the tuned length l and the energy-exchange interval t.',
         ['m / kg', 't20 (1) / s', 't20 (2) / s', 'd / cm', 't / s'],
         [[0.300, *a['t20'], a['d'], a['t']], [0.400, *b['t20'], b['d'], b['t']]],
         proc=[('T / s', '=ROUND((B{r}+C{r})/40,3)'), ('l / m', '=9.81*F{r}^2/PI()^2'), ('k = t²/m² / s² kg⁻²', '=E{r}^2/A{r}^2')],
         results=[('% difference in k', '=ABS(H6-H7)/MIN(H6:H7)*100', '%'), ('2 × % uncertainty in t (Δt = 1 s)', f'=2*1/E6*100', '%')])

# ======================= Q2 thermistor =======================
B, R25 = 3950, 10000
def R_of(Tc): return R25 * math.exp(B * (1 / (Tc + 273.15) - 1 / 298.15))
Troom, Thot = 26.0, 64.5
emf = 1.50
Rr, Rh = R_of(Troom), R_of(Thot)
Ir, Ih = 1.48 / Rr * 1000, 1.47 / Rh * 1000
P.question('Q2', 'NTC thermistor: resistance and self-heating', 12, [8, 9, 10, 11],
           'Measure the thermistor\'s resistance at room temperature and in hot water, then analyse a dataset in which the '
           'thermistor heats itself as the current rises: R against I, power, and the energy dissipated (area under P–t).',
           sim='ejc-q2', xlsx=[('EJC_Q2_thermistor_dataset.xlsx', 'A practice version of Q2dataset: t, V and I every 30 s as the e.m.f. is raised. Compute R and P, plot R against I and integrate P over time.')],
           skills=['meter readings', 'R = V/I', 'P = VI', 'area under P–t'])
P.ans(8, 'T', f'{Troom:.1f} °C', q='Q2')
P.ans(8, 'I', f'{Ir:.3f} mA', q='Q2')
P.ans(8, 'V', '1.48 V', q='Q2')
P.text(8, 141, 478, f'R = V/I = 1.48 / ({round(Ir, 3)*10:.2f} × 10⁻⁴ A)' if Ir < 1 else f'R = V/I = 1.48 / ({round(Ir, 3):.3f} × 10⁻³ A)', size=9.5, q='Q2')
P.ans(8, 'R', f'{1.48 / (round(Ir, 3) / 1000) / 1000:.2f} kΩ', q='Q2')
P.note(8, 110, 'Thermometer reading to 0.5 °C or 1 °C (whatever the scale allows), with the bulb in air away from your hand.')
P.note(8, 390, 'Record meter readings with all the digits shown and the unit (mA, V).', 'mark')
P.note(8, 520, 'Keep the switch closed only briefly: the current heats the thermistor and lowers R.', 'tip')
P.ans(9, 'T water', f'{Thot:.1f} °C', q='Q2')
P.ans(9, 'V', '1.47 V', q='Q2')
P.ans(9, 'I', f'{Ih:.3f} mA', q='Q2')
P.text(9, 141, 336, f'R = 1.47 / ({round(Ih, 3)*10:.2f} × 10⁻⁴ A)' if Ih < 1 else f'R = 1.47 / ({round(Ih, 3):.3f} × 10⁻³ A)', size=9.5, q='Q2')
P.ans(9, 'R', f'{1.47 / (round(Ih, 3) / 1000) / 1000:.2f} kΩ', q='Q2')
P.note(9, 190, 'Stir and wait for the thermometer and thermistor readings to steady before recording. The water is cooling the whole time.')
P.note(9, 380, 'Check the trend: an NTC thermistor\'s R must be much smaller in hot water than at room temperature.', 'why')

# dataset (b): self-heating thermistor exposed to air
Rb25, Bb, delta = 220.0, 3500, 0.012      # ohm, K, W/K
rows2 = []
Tamb = 26.0
for i in range(0, 12):
    t = 30 * i
    V = round(0.4 * (i + 1), 2)
    Tth = Tamb
    for _ in range(600):
        R = Rb25 * math.exp(Bb * (1 / (Tth + 273.15) - 1 / 298.15))
        Tth += 0.2 * (Tamb + V * V / R / delta - Tth)
    I = V / R * 1000 * (1 + rnd.gauss(0, 0.004))
    rows2.append((t, V, round(I, 1)))
Rs = [(V / (I / 1000), I) for t, V, I in rows2]
p90 = [V * I / 1000 for t, V, I in rows2 if t == 90][0]
Pw = [V * I / 1000 for t, V, I in rows2]
E = sum(0.5 * (Pw[i] + Pw[i + 1]) * 30 for i in range(len(Pw) - 1))
P.graph(10, 160, 100, 300, 170, q='Q2', xlabel='I / mA', ylabel='R / Ω', xr=[0, max(r[2] for r in rows2) * 1.08], yr=[0, max(r[0] for r in Rs) * 1.12],
        series=[dict(pts=[(I, R) for R, I in Rs], join=False)], curves=[dict(pts=[(I, R) for R, I in Rs])])
P.write_lines(10, 'R decreases as I increases: almost constant (≈ 210 Ω) below about 8 mA, then falling roughly linearly to about 113 Ω at 42 mA.', after=300, before=362, size=9.2, q='Q2')
P.text(10, 160, 396, f'At t = 90 s: V = {rows2[3][1]:.2f} V, I = {rows2[3][2]:.1f} mA\np = VI = {rows2[3][1]:.2f} × {rows2[3][2]/1000:.4f}', size=9.2, q='Q2')
P.ans(10, 'p', f'{p90:.3f} W', q='Q2')
P.ans(10, 'energy dissipated', f'{E:.0f} J', q='Q2')
P.write_lines(10, 'Add a column P = VI. Energy = area under the P–t graph from the first to the last reading, found in the spreadsheet with the trapezium rule: Σ ½(Pₙ + Pₙ₊₁)Δt, Δt = 30 s.', after=540, before=650, size=9.2, q='Q2')
P.note(10, 90, 'Sketch: label axes R / Ω and I / mA and show the shape (a decreasing curve). It does not need to be a straight line.', 'mark')
P.note(10, 300, '"Describe the variation": give the direction and how the rate changes. "R decreases" alone is usually only half the answer.')
P.note(10, 470, 'Energy is not P × total time: P changes, so you need the area under the P–t graph.', 'warn')
P.write_lines(11,  'With no heat lost to the surroundings, the thermistor gets hotter for the same current, so R falls further. '
       'The current then increases, heating it more (positive feedback), possibly to thermal runaway and damage.', after=100, before=230, size=9.2, q='Q2')
P.note(11, 110, 'Two marks: link insulation → higher temperature → lower R → larger current/more heating.', 'mark')

workbook(os.path.join(X, 'EJC_Q2_thermistor_dataset.xlsx'), 'EJC Q2(b) – Self-heating thermistor (practice dataset)',
         'Readings 30 s after each e.m.f. increment. Compute R and P; plot R against I; estimate the energy dissipated.',
         ['t / s', 'V / V', 'I / mA'], [list(r) for r in rows2],
         proc=[('R / Ω', '=B{r}/(C{r}/1000)'), ('P / W', '=B{r}*C{r}/1000'), ('strip energy / J', '=IF(A{r1}<>"",0.5*(E{r}+B{r1}*C{r1}/1000)*(A{r1}-A{r}),"")')],
         chart=dict(x=3, y=4, title='R against I', xt='I / mA', yt='R / Ω', trend=False),
         results=[('P at t = 90 s', '=E9', 'W'), ('total energy = Σ strips', '=SUM(F{first}:F{last})', 'J')],
         answer_note='Energy uses the trapezium rule on the P–t data (Δt = 30 s).')

# ======================= Q3 rod equilibrium =======================
W = 0.0981
S3, th3, Tension, Rrod = 80.0, 50, 1.4715, 0.0905 * g
F = 2.94
A_true = Tension * S3 / 100 * math.sin(math.radians(th3)) - Rrod * S3 / 200
rows3 = []
for q in (26.0, 35.0, 45.0, 55.0, 65.0, 75.0):
    tq = 7 * W * q / 100
    tp = A_true - tq
    p = round(tp / (5 * W) * 100 + rnd.gauss(0, 0.35), 1)
    rows3.append((q, p, 5 * W * p / 100, 7 * W * q / 100))
mB, cA, r23 = linfit([r[2] for r in rows3], [r[3] for r in rows3])
R_est = F * math.sin(math.radians(th3)) - 2 * cA / (S3 / 100)
P.question('Q3', 'Equilibrium of a rod on a pivot and pulley', 24, [12, 13, 14, 15, 16, 17, 18],
           'A rod hinged at its right eye is held horizontal by a string over a pulley. Moving mass Q changes where P must sit; '
           'plot τQ against τP (gradient B ≈ −1, intercept A) and find the rod\'s weight R = F sin θ − 2A/S; plan an oscillation experiment.',
           sim='ejc-q3', xlsx=[('EJC_Q3_rod_moments.xlsx', 'Six (q, p) balance positions. Compute τP and τQ, plot τQ against τP, and find A, B and R.')],
           skills=['metre rule', 'protractor', 'moments', 'linear trendline', 'planning'])
P.text(12, 300, 245, 'Metre rule along the rod: centre of left eye at 10.0 cm,\ncentre of right eye at 90.0 cm', size=9, q='Q3')
P.ans(12, 'S =', f'{S3:.1f} cm', q='Q3')
P.note(12, 250, 'Measure between the centres of the eyes (that is where the forces act).', 'tip')
r0 = rows3[0]
P.text(13, 222, 575, 'Rod checked parallel to the bench (equal heights from bench\nat both ends, measured with a rule).', size=9, q='Q3')
P.ans(13, 'q =', f'{r0[0]:.1f} cm', q='Q3')
P.ans(13, 'p =', f'{r0[1]:.1f} cm', q='Q3')
P.ans(13, '=', f'{th3}°', after=690, q='Q3')
P.note(13, 560, 'Check "parallel to the bench" by measuring the height of the rod above the bench near each end. The two readings should match to about 0.1 cm.', 'mark')
P.note(13, 690, 'θ: put the protractor centre where the string meets the left eye; read to the nearest degree.')
P.text(14, 222, 185, f'τP = 5 × 0.0981 × {r0[1]/100:.3f}\nτQ = 7 × 0.0981 × {r0[0]/100:.3f}', size=9.2, q='Q3')
P.ans(14, 'P =', f'{r0[2]:.3f} N m', q='Q3')
P.ans(14, 'Q =', f'{r0[3]:.3f} N m', q='Q3')
P.table(14, 160, 400, ['q / cm', 'p / cm', 'τP / N m', 'τQ / N m'],
        [[f'{r[0]:.1f}', f'{r[1]:.1f}', f'{r[2]:.4f}', f'{r[3]:.4f}'] for r in rows3], size=9.5, q='Q3')
P.text(14, 160, 560, 'q spread evenly from 26 cm to 75 cm; p readjusted each time\nuntil the rod is parallel to the bench.', size=9, q='Q3')
P.note(14, 230, 'Moments in N m, so convert p and q to metres first.', 'warn')
P.note(14, 400, 'The [6] marks reward: six sets, the full range of q (25–75 cm), correct headings and units, raw lengths to 0.1 cm, and τ to consistent s.f.', 'mark')
P.graph(15, 160, 196, 320, 215, q='Q3', xlabel='τP / N m', ylabel='τQ / N m', xr=[0, 0.4], yr=[0, 0.6],
        series=[dict(pts=[(r[2], r[3]) for r in rows3])], lines=[dict(m=mB, c=cA)], eq=eqn(mB, cA, 4, r2=r23), eqpos=(330, 330))
P.ans(15, 'A =', f'{cA:.3f} N m', q='Q3')
P.ans(15, 'B =', f'{mB:.2f}', q='Q3')
P.text(15, 228, 615, f'R = F sin θ − 2A/S = 2.94 sin {th3}° − 2({cA:.3f})/{S3/100:.3f}', size=9.5, q='Q3')
P.ans(15, 'R =', f'{R_est:.2f} N', q='Q3')
P.note(15, 190, 'Plot τQ (y) against τP (x). The intercept is A and the gradient is B (expect B ≈ −1, since the moments of P and Q share a fixed total).', 'why')
P.note(15, 420, 'A has the unit N m. B has no unit.', 'mark')
P.note(15, 700, 'Sense-check: R ≈ 0.9 N means a rod of mass ≈ 90 g, which is plausible for a metre-long wooden rod.', 'tip')
place(P, 'ejc-q3e', [('lines', 17, 40, 760), ('lines', 18, 40, 345)], notes=[(17, 80), (17, 330)], q='Q3')

workbook(os.path.join(X, 'EJC_Q3_rod_moments.xlsx'), 'EJC Q3 – Rod in equilibrium (sample data)',
         f'S = {S3:.1f} cm, θ = {th3}°, W = 0.0981 N, F = 2.94 N. Compute τP = 5Wp and τQ = 7Wq, then plot τQ against τP.',
         ['q / cm', 'p / cm'], [[r[0], r[1]] for r in rows3],
         proc=[('τP / N m', '=5*0.0981*B{r}/100'), ('τQ / N m', '=7*0.0981*A{r}/100')],
         chart=dict(x=3, y=4, title='τQ against τP', xt='τP / N m', yt='τQ / N m'),
         results=[('B = gradient', '=SLOPE(D{first}:D{last},C{first}:C{last})', ''),
                  ('A = intercept', '=INTERCEPT(D{first}:D{last},C{first}:C{last})', 'N m'),
                  ('R = F sinθ − 2A/S', f'=2.94*SIN(RADIANS({th3}))-2*INTERCEPT(D{{first}}:D{{last}},C{{first}}:C{{last}})/{S3/100}', 'N')])
P.build()
