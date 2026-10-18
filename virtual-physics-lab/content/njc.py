import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_09_02)
P = Paper('njc', 'National Junior College', 'NJC', '2 Sep 2026', os.path.join(PRIV, 'src', 'njc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 RC zero-crossing time =======================
Cap, Pk, E = 2200e-6, 4.70, 3.98
r5 = [4.97, 5.02, 4.99]
combos = [('three 5 kΩ in parallel', 1 / (1 / r5[0] + 1 / r5[1] + 1 / r5[2])), ('two in parallel', 1 / (1 / r5[0] + 1 / r5[1])),
          ('one 5 kΩ', r5[0]), ('one + two in parallel', r5[2] + 1 / (1 / r5[0] + 1 / r5[1])), ('two in series', r5[0] + r5[1]),
          ('three in series', sum(r5))]
rows1 = []
for name, R in combos:
    t = (Pk + R) * 1e3 * Cap * math.log(2) * (1 + rnd.gauss(0, 0.012)) + rnd.gauss(0.15, 0.1)
    rows1.append((round(R, 2), round(t, 1), name))
m1, c1, r21 = linfit([r[0] for r in rows1], [r[1] for r in rows1])
first = [r for r in rows1 if r[2] == 'one 5 kΩ'][0]
P.question('Q1', 'Capacitor timing circuit', 11, [2, 3, 4],
           'Close S1 and time how long the voltmeter takes to pass zero: the capacitor charges through (P + R) until V_Y falls to half the supply, so '
           't = (P + R)C ln 2. A graph of t against R gives b/a = P.',
           sim='njc-q1', xlsx=[('NJC_Q1_timing.xlsx', 'Six (R, t) pairs from combinations of 5 kΩ resistors. Plot t against R; b/a gives the resistance of P.')],
           skills=['multimeter', 'timing an event', 'linear trendline', 'circuit reasoning'])
P.ans(2, 'R =', f'{first[0]:.2f}', q='Q1')
P.text(2, 140, 700, 'measured with the multimeter on the 20 kΩ range, resistor disconnected from the circuit', size=8.8, q='Q1')
P.note(2, 640, 'Measure R with the multimeter before connecting it (ohmmeter readings in a live circuit are wrong).', 'tip')
P.ans(3, 'V =', f'{E/2:.2f} V', q='Q1')
P.text(3, 140, 350, f'Stopwatch started as S1 closed (V jumps to about −{E/2:.1f} V)\nand stopped as V passed 0.00 V. Repeat: {first[1]-0.2:.1f} s, {first[1]+0.2:.1f} s', size=9, q='Q1')
P.ans(3, 't =', f'{first[1]:.1f} s', q='Q1')
P.table(3, 160, 490, ['combination', 'R / kΩ', 't₁ / s', 't₂ / s', 't / s'],
        [[r[2], f'{r[0]:.2f}', f'{r[1]-0.2:.1f}', f'{r[1]+0.2:.1f}', f'{r[1]:.1f}'] for r in rows1], size=8.8, q='Q1')
P.note(3, 120, 'With S2 closed the capacitor is shorted, so Y sits at X\'s potential and the voltmeter reads half the supply.', 'why')
P.note(3, 250, 'The moment of zero is when V_Y = E/2, i.e. after t = (P + R)C ln 2. That is why b/a works out to be P.', 'why')
P.note(3, 400, 'Repeat each timing (reaction time ≈ 0.2–0.3 s) and record t to 0.1 s.', 'mark')
P.note(3, 480, 'Use six well-spread values: parallel/series combinations give 1.7 kΩ to 15 kΩ.', 'mark')
P.graph(4, 140, 170, 300, 200, q='Q1', xlabel='R / kΩ', ylabel='t / s', xr=[0, 16], yr=[0, max(r[1] for r in rows1) * 1.15],
        series=[dict(pts=[(r[0], r[1]) for r in rows1])], lines=[dict(m=m1, c=c1, x=[0, 16])], eq=eqn(m1, c1, 4, r2=r21), eqpos=(200, 180))
P.text(4, 140, 420, f'b/a = {c1:.3f} / {m1:.4f}', size=9.5, q='Q1')
P.ans(4, '= ', f'{c1/m1:.2f} kΩ', after=440, q='Q1')
P.write_lines(4, 'S2 short-circuits (discharges) the capacitor so it starts uncharged for every run. S1 connects the capacitor '
              'to the circuit at a definite instant, so charging starts exactly when the stopwatch is started.', after=520, q='Q1')
P.note(4, 160, 'b/a = intercept ÷ gradient. Units: s ÷ (s kΩ⁻¹) = kΩ.', 'mark')
P.note(4, 440, 'Check: b/a should match the resistance of P measured with the multimeter.', 'tip')
workbook(os.path.join(X, 'NJC_Q1_timing.xlsx'), 'NJC Q1 – Capacitor timing circuit (sample data)',
         'R measured with a multimeter; t is the time for the voltmeter reading to pass zero.',
         ['R / kΩ', 't / s'], [[r[0], r[1]] for r in rows1],
         chart=dict(x=1, y=2, title='t against R', xt='R / kΩ', yt='t / s'),
         results=[('a = gradient', '=SLOPE(B{first}:B{last},A{first}:A{last})', 's kΩ⁻¹'), ('b = intercept', '=INTERCEPT(B{first}:B{last},A{first}:A{last})', 's'),
                  ('b/a', '=INTERCEPT(B{first}:B{last},A{first}:A{last})/SLOPE(B{first}:B{last},A{first}:A{last})', 'kΩ'),
                  ('C = a/ln2 (bonus)', '=SLOPE(B{first}:B{last},A{first}:A{last})/LN(2)/1000', 'F')])

# ======================= Q2 cooling =======================
room, tau = 28.0, 900.0
t_start = tau * math.log(55 / (80.6 - room))  # offset so that t=0 at 80.6
readings = []
for i in range(0, 10):   # 0 s to 180 s: 80 °C down to about 70.5 °C
    t = 20 * i
    th = room + (80.0 - room) * math.exp(-t / tau)
    readings.append((t, round(th * 2 + rnd.gauss(0, 0.15)) / 2))
t75 = tau * math.log((80 - room) / (75 - room))
slope75 = -(75 - room) / tau
P.question('Q2', 'Cooling of hot water', 14, [6, 7, 8, 9],
           'Plot the cooling curve from 80 °C to 70 °C and draw a tangent at 75 °C. Then linearise a datalogger dataset with '
           'ln(θ − 30) against t to find n and k, and plan an experiment linking k to the surface area of the water.',
           sim='njc-q2', xlsx=[('NJC_Q2a_cooling_readings.xlsx', 'Thermometer readings every 20 s from 80 °C to 70 °C.'),
                               ('NJC_Q2b_cooling_dataset.xlsx', 'A practice version of datasetQ2b: θ every 30 s for 30 minutes. Plot ln(θ − 30) against t to find n and k.')],
           skills=['tangent to a curve', 'exponential linearisation', 'planning'])
grid = dict(rect=(105.8, 407.5, 527.7, 547.9), xr=[0, 300], yr=[70, 80])
curve = [(t, room + (80 - room) * math.exp(-t / tau)) for t in range(0, 205, 5)]
tanA, tanB = (t75 - 110, 75 - slope75 * 110 * -1 * -1), None
x1, x2 = 0, 180
P.add(6, dict(t='grid', **grid, pts=readings, curve=curve,
              segs=[((x1, 75 + slope75 * (x1 - t75)), (x2, 75 + slope75 * (x2 - t75))),
                    ((x1, 75 + slope75 * (x1 - t75)), (x2, 75 + slope75 * (x1 - t75)), '2,2'),
                    ((x2, 75 + slope75 * (x1 - t75)), (x2, 75 + slope75 * (x2 - t75)), '2,2')],
              labels=[(t75 + 6, 75.6, 'tangent at 75 °C')]), q='Q2')
P.text(6, 140, 590, f'Tangent at θ = 75 °C (t ≈ {t75:.0f} s): from t = 0 s to t = 180 s, Δθ = {slope75*180:.1f} °C\ndθ/dt = {slope75*180:.1f} / 180', size=9.2, q='Q2')
P.table(6, 113, 280, ['t / s'] + [str(r[0]) for r in readings[:6]], [['θ / °C'] + [f'{r[1]:.1f}' for r in readings[:6]]], size=8.6, q='Q2')
P.table(6, 113, 330, ['t / s'] + [str(r[0]) for r in readings[6:]], [['θ / °C'] + [f'{r[1]:.1f}' for r in readings[6:]]], size=8.6, q='Q2')
P.ans(6, '= ', f'{slope75:.3f} °C s⁻¹', after=660, q='Q2')
P.note(6, 270, 'Start timing when the thermometer passes 80 °C and read every 20 s. Stir gently before each reading.', 'mark')
P.note(6, 420, 'Draw a smooth curve through the points (not dot-to-dot), then a tangent touching it at 75 °C. Use a large triangle.', 'mark')
P.note(6, 640, 'dθ/dt is negative (cooling). Give the sign and the unit °C s⁻¹.', 'warn')
P.write_lines(7, 'Drawing the tangent by eye is subjective: the curve is only gently curved and θ is read only to 0.5 °C, so the slope is uncertain.',
              after=90, before=130, size=9.2, q='Q2')
P.write_lines(7, 'm is room temperature: as t → ∞, e^(−kt) → 0 so θ → m. The water cools until it reaches the temperature of the surroundings.',
              after=355, before=395, size=9.2, q='Q2')
# dataset
ds = []
n_true, k_true = 58.0, 1.05e-3
for i in range(0, 61):
    t = 30 * i
    ds.append((t, round(30 + n_true * math.exp(-k_true * t) + rnd.gauss(0, 0.08), 2)))
mb, cb, r2b = linfit([t for t, th in ds], [math.log(th - 30) for t, th in ds])
P.graph(7, 150, 463, 300, 180, q='Q2', xlabel='t / s', ylabel='ln(θ / °C − 30)', xr=[0, 1800], yr=[2.0, 4.3],
        series=[dict(pts=[(t, math.log(th - 30)) for t, th in ds[::3]], mark='dot')], lines=[dict(m=mb, c=cb)], eq=eqn(mb, cb, 4, r2=r2b), eqpos=(300, 462))
P.ans(7, 'n =', f'e^{cb:.4f} = {math.exp(cb):.1f} °C', q='Q2')
P.ans(7, 'k =', f'{sci(-mb, 3)} s⁻¹', q='Q2')
P.note(7, 90, '"One problem" should be specific: tangent judgement, the thermometer reading changing while you read it, or uneven temperature in the beaker.')
P.note(7, 340, 'Two marks: what m is (room temperature) + the reason (θ → m as t → ∞).', 'mark')
P.note(7, 460, 'ln(θ − m) = ln n − kt, so plot ln(θ − 30) against t: gradient = −k and intercept = ln n.', 'why')
P.note(7, 650, 'n = e^(intercept), not the intercept itself. n has the unit °C; k has the unit s⁻¹.', 'warn')
place(P, 'njc-q2c', [('lines', 8, 640, 800), ('lines', 9, 40, 460)], diagram=(8, 150, 355), notes=[(8, 360), (8, 640)], q='Q2')
P.note(9, 300, 'S must include all faces in contact with air or container: top, base and curved side.', 'why')
workbook(os.path.join(X, 'NJC_Q2a_cooling_readings.xlsx'), 'NJC Q2(a) – Cooling from 80 °C (sample readings)',
         'Readings every 20 s. Practise drawing the curve and a tangent at 75 °C (or fit a quadratic trendline and differentiate).',
         ['t / s', 'θ / °C'], [list(r) for r in readings], chart=dict(x=1, y=2, title='θ against t', xt='t / s', yt='θ / °C', ttype='poly'),
         results=[('expected dθ/dt at 75 °C (model)', round(slope75, 4), '°C s⁻¹')],
         answer_note='The chart uses a polynomial trendline; its derivative at θ = 75 °C approximates the tangent gradient.')
workbook(os.path.join(X, 'NJC_Q2b_cooling_dataset.xlsx'), 'NJC Q2(b) – Datalogger cooling data (practice dataset)',
         'Take m = 30 °C. Plot ln(θ − 30) against t; gradient = −k, intercept = ln n.',
         ['t / s', 'θ / °C'], [list(r) for r in ds], proc=[('ln(θ − 30)', '=LN(B{r}-30)')],
         chart=dict(x=1, y=3, title='ln(θ − 30) against t', xt='t / s', yt='ln(θ − 30)'),
         results=[('gradient', '=SLOPE(C{first}:C{last},A{first}:A{last})', 's⁻¹'), ('k = −gradient', '=-SLOPE(C{first}:C{last},A{first}:A{last})', 's⁻¹'),
                  ('n = e^intercept', '=EXP(INTERCEPT(C{first}:C{last},A{first}:A{last}))', '°C')])

# ======================= Q3 conical pendulum =======================
D = 18.0
def cone(p):
    s = D / (2 * p)
    th = math.asin(s)
    T = 2 * math.pi * math.sqrt(p / 100 * math.cos(th) / g)
    return th, T
p1, p2 = 19.0, 13.1
th1, T1 = cone(p1); th2, T2 = cone(p2)
t20a = [round(20 * T1 * (1 + rnd.gauss(0, 0.006)), 2) for _ in range(2)]
t20b = [round(20 * T2 * (1 + rnd.gauss(0, 0.007)), 2) for _ in range(2)]
T1m, T2m = hu(sum(t20a) / 40, 4), hu(sum(t20b) / 40, 4)
e1 = T1m ** 2 / (p1 / 100 * math.cos(th1)); e2 = T2m ** 2 / (p2 / 100 * math.cos(th2))
pct_p, pct_D = 0.2 / p1 * 100, 0.5 / D * 100
pd3 = abs(e1 - e2) / min(e1, e2) * 100
P.question('Q3', 'Conical pendulum', 25, [11, 12, 13, 14, 15, 16, 17, 18, 19],
           'A bob is driven round a drawn circle of diameter D. With sin φ = D/2p, test T² = εp cos φ using two string lengths, find g = 4π²/ε, '
           'analyse a second data set (which turns out to be on the Moon), and plan a measurement of g with a pressure sensor.',
           sim='njc-q3', xlsx=[('NJC_Q3h_table.xlsx', 'Table 3.1 data. Compute T and cos φ, plot T² against cos φ and find ε (then g).')],
           skills=['percentage uncertainty', 'two-point test', 'significant figures', 'linearisation', 'planning'])
P.ans(11, 'D =', f'{D:.1f} cm', q='Q3')
P.text(11, 140, 178, 'Ruler across the centre: 2.0 cm to 20.0 cm, D = 20.0 − 2.0', size=9, q='Q3')
P.ans(11, 'p =', f'{p1:.1f} cm', q='Q3')
P.text(11, 140, 330, f'Δp ≈ 0.2 cm (knot has a width; judging the bob\'s centre)\n% uncertainty = 0.2/{p1:.1f} × 100%', size=9, q='Q3')
P.ans(11, 'percentage uncertainty', f'{pct_p:.0f}%', q='Q3')
P.note(11, 160, 'Measure across the circle through the centre cross, to 0.1 cm.', 'mark')
P.note(11, 300, 'Realistic uncertainties are bigger than the ruler precision: the knot and the bob centre are hard to locate exactly.', 'mark')
P.text(12, 140, 640, f'Time for 20 revolutions: {t20a[0]:.2f} s, {t20a[1]:.2f} s\nmean = {sum(t20a)/2:.3f} s, T = {sum(t20a)/2:.3f}/20', size=9.5, q='Q3')
P.ans(12, 'T =', f'{T1m:.4f} s', q='Q3')
P.note(12, 620, 'Time at least 20 revolutions (use more for the short string so t > 15 s), twice. Count from a reference point on the circle as the bob passes it.', 'mark')
P.note(12, 330, 'Keep the bob just above the circle for the whole timing. If it drifts inside or outside, φ changes.', 'tip')
P.text(13, 140, 150, 'The bob does not stay exactly over the drawn circle:\nits radius varies by ≈ 0.25 cm, so ΔD ≈ 0.5 cm\n% uncertainty = 0.5/18.0 × 100%', size=9, q='Q3')
P.ans(13, 'percentage uncertainty', f'{pct_D:.0f}%', q='Q3')
P.text(13, 140, 252, f'sin φ = 18.0 / (2 × {p1:.1f}) = {D/(2*p1):.3f}', size=9.5, q='Q3')
P.ans(13, '= ', f'{math.degrees(th1):.1f}°', after=280, q='Q3')
P.ans(13, 'p =', f'{p2:.1f} cm', q='Q3')
P.text(13, 140, 420, f'20 revolutions: {t20b[0]:.2f} s, {t20b[1]:.2f} s;  T = {sum(t20b)/2:.3f}/20', size=9.5, q='Q3')
P.ans(13, 'T =', f'{T2m:.4f} s', q='Q3')
P.text(13, 140, 508, f'sin φ = 18.0/(2 × {p2:.1f}) = {D/(2*p2):.3f}', size=9.5, q='Q3')
P.ans(13, '= ', f'{math.degrees(th2):.1f}°', after=530, q='Q3')
P.note(13, 150, 'The "experiment" uncertainty in D is how well the bob follows the circle, not the ruler\'s 0.1 cm.', 'why')
P.text(14, 140, 150, f'ε = T² / (p cos φ)\nε₁ = {T1m:.4f}² / (0.{int(p1*10):03d} × cos {math.degrees(th1):.1f}°) = {e1:.2f}\n'
       f'ε₂ = {T2m:.4f}² / (0.{int(p2*10):03d} × cos {math.degrees(th2):.1f}°) = {e2:.2f}', size=9.5, q='Q3')
P.ans(14, 'first value of ε', f'{e1:.2f} s² m⁻¹', q='Q3')
P.ans(14, 'second value of ε', f'{e2:.2f} s² m⁻¹', q='Q3')
P.write_lines(14, 'p and D were measured to 3 s.f. (e.g. 19.0 cm, 18.0 cm) and T to 3–4 s.f., so ε is given to 3 s.f. (the least number of s.f. in the raw data).',
              after=310, before=380, size=9.2, q='Q3')
sup3 = pd3 <= pct_p + pct_D + 2
P.write_lines(14, f'% difference in ε = {pd3:.1f}%. Taking the sum of the % uncertainties in p ({pct_p:.0f}%) and D ({pct_D:.0f}%) as an estimate of '
              f'the uncertainty in ε (≈ {pct_p+pct_D:.0f}%): {pd3:.1f}% {"<" if sup3 else ">"} {pct_p+pct_D:.0f}%, so the results '
              f'{"support" if sup3 else "do not support"} T² = εp cos φ.', after=520, size=9, q='Q3')
P.note(14, 140, 'ε has units s² m⁻¹ (T² in s², p in m).', 'mark')
P.note(14, 320, 'S.f. justification must name the raw data and their s.f. "Because of the calculator" earns nothing.', 'warn')
P.note(14, 520, 'Refer to BOTH named uncertainties, as the question asks.', 'mark')
gv = 4 * math.pi ** 2 / round((e1 + e2) / 2, 2)
P.text(15, 140, 160, f'g = 4π²/ε, using the mean ε = {(e1+e2)/2:.2f} s² m⁻¹', size=9.5, q='Q3')
P.ans(15, 'g =', f'{gv:.2f} m s⁻²', q='Q3')
tab = [(20, 42.52, 10.0), (20, 41.55, 20.0), (20, 39.83, 30.0), (20, 37.56, 40.0), (20, 34.39, 50.0), (20, 30.31, 60.0), (20, 25.11, 70.0), (20, 17.84, 80.0)]
Ts = [(hu(t / N, 3), math.cos(math.radians(th))) for N, t, th in tab]
mh, ch, r2h = linfit([c for T, c in Ts], [T * T for T, c in Ts])
eps_h = mh / 0.19
for cx, head, vals in ((315, 'T / s', [f'{T:.3f}' for T, c in Ts]), (369, 'cos φ', [f'{c:.3f}' for T, c in Ts]), (425, 'T² / s²', [f'{T*T:.3f}' for T, c in Ts])):
    P.text(16, cx - tw(head, 9, True) / 2, 112, head, size=9, q='Q3', bold=True)
    for i, v in enumerate(vals):
        P.text(16, cx - tw(v, 9) / 2, 136.5 + 23.75 * i, v, size=9, q='Q3')
P.graph(16, 140, 405, 300, 200, q='Q3', xlabel='cos φ', ylabel='T² / s²', xr=[0, 1.05], yr=[0, 5.0],
        series=[dict(pts=[(c, T * T) for T, c in Ts])], lines=[dict(m=mh, c=ch, x=[0, 1.05])], eq=eqn(mh, ch, 4, r2=r2h), eqpos=(300, 540))
P.text(16, 140, 615, f'gradient = εp ⇒ ε = {mh:.3f} / 0.19', size=9.5, q='Q3')
P.ans(16, 'ε =', f'{eps_h:.1f} s² m⁻¹', q='Q3')
P.write_lines(17, f'ε ≈ {eps_h:.0f} s² m⁻¹, so g = 4π²/ε ≈ {4*math.pi**2/eps_h:.2f} m s⁻², about 1/6 of Earth\'s value. '
              'The data were taken where the gravitational field strength is about 1.6 N kg⁻¹, e.g. on the Moon.', after=70, size=9.2, q='Q3')
P.note(16, 150, 'T = t/N first, then T² and cos φ. You only need the columns that you plot.', 'tip')
P.note(16, 400, 'T² = εp cos φ: plot T² against cos φ. The line should pass through the origin, with gradient εp.', 'why')
P.note(17, 80, 'Make the connection explicit: g = 4π²/ε, then compare with 9.81 m s⁻² and name the environment.', 'mark')
place(P, 'njc-q3i', [('lines', 18, 585, 800), ('lines', 19, 40, 700)], diagram=(18, 150, 352), notes=[(18, 350), (18, 600)], q='Q3')
workbook(os.path.join(X, 'NJC_Q3h_table.xlsx'), 'NJC Q3(h) – Table 3.1 (given data)',
         'p = 19 cm. Compute T = t/N and cos φ, plot T² against cos φ; gradient = εp.',
         ['N', 't / s', 'φ / °'], [list(r) for r in tab],
         proc=[('T / s', '=ROUND(B{r}/A{r},3)'), ('cos φ', '=COS(RADIANS(C{r}))'), ('T² / s²', '=D{r}^2')],
         chart=dict(x=5, y=6, title='T² against cos φ', xt='cos φ', yt='T² / s²'),
         results=[('gradient = εp', '=SLOPE(F{first}:F{last},E{first}:E{last})', 's²'), ('ε = gradient / 0.19', '=SLOPE(F{first}:F{last},E{first}:E{last})/0.19', 's² m⁻¹'),
                  ('g = 4π²/ε', '=4*PI()^2/(SLOPE(F{first}:F{last},E{first}:E{last})/0.19)', 'm s⁻²')])
P.build()
