import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *

rnd = random.Random(2026_08_18 + 7)
P = Paper('sajc', "St. Andrew's Junior College", 'SAJC', '18 Aug 2026', os.path.join(PRIV, 'src', 'sajc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81

# ======================= Q1 two wires (same apparatus as NYJC Q3) =======================
rho, dF, dG, E3, r3 = 4.9e-7, 0.274, 0.457, 1.52, 0.25
AF, AG = math.pi * (dF / 2000) ** 2, math.pi * (dG / 2000) ** 2
def I_of(xcm):
    x = xcm / 100
    return E3 / (rho * x / AF + rho * (1 - x) / AG + r3)
rows1 = [(x, round(I_of(x) * (1 + rnd.gauss(0, 0.003)), 3)) for x in (10.0, 20.0, 35.0, 50.0, 65.0, 80.0, 90.0)]
m1, c1, r21 = linfit([x / 100 for x, I in rows1], [1 / I for x, I in rows1])
dG_est = dF * math.sqrt(1 + m1 / c1)
P.question('Q1', 'Two wires joined by a sliding lead', 12, [2, 3, 4],
           'Same circuit idea as NYJC Q3: 1/I = Px + Q. Measure d_F, plot 1/I against x, then use P/Q = (d_G²/d_F² − 1)/L to work out d_G.',
           sim='nyjc-q3', xlsx=[('SAJC_Q1_two_wires.xlsx', 'Seven (x, I) pairs. Plot 1/I against x, find P and Q, then d_G.')],
           skills=['micrometer', 'tabulation', 'linearisation', 'rearranging a formula'])
P.text(2, 130, 170, 'zero error = 0.00 mm; readings at three points: 0.27, 0.28, 0.27 mm', size=9, q='Q1')
P.ans(2, 'd F =', f'{dF:.2f} mm', q='Q1')
P.ans(2, 'x =', '50.0 cm', q='Q1')
P.ans(2, 'I =', f'{dict(rows1)[50.0]:.3f} A', q='Q1')
P.note(2, 140, 'Two marks for the micrometer: a sensible value (≈ 0.2–0.5 mm) to 0.01 mm, and evidence of repeats or a zero-error check.', 'mark')
P.note(2, 560, 'Position C at exactly 50.0 cm on both rules. Read the clip edge against the scale at eye level.', 'tip')
P.table(3, 160, 110, ['x / cm', 'I / A', '(1/I) / A⁻¹'], [[f'{x:.1f}', f'{I:.3f}', f'{1/I:.3f}'] for x, I in rows1], size=9.5, q='Q1')
P.graph(3, 140, 455, 300, 190, q='Q1', xlabel='x / m', ylabel='(1/I) / A⁻¹', xr=[0, 1.0], yr=[2.5, 5.5],
        series=[dict(pts=[(x / 100, 1 / I) for x, I in rows1])], lines=[dict(m=m1, c=c1)], eq=eqn(m1, c1, 4, r2=r21), eqpos=(160, 465))
P.ans(3, 'P =', f'{m1:.2f} A⁻¹ m⁻¹', q='Q1')
P.ans(3, 'Q =', f'{c1:.2f} A⁻¹', q='Q1')
P.text(4, 130, 230, f'd_G² / d_F² = 1 + LP/Q = 1 + 1.000 × {m1:.3f}/{c1:.3f} = {1+m1/c1:.3f}\nd_G = {dF:.2f} × √{1+m1/c1:.3f}', size=9.8, q='Q1')
P.ans(4, 'd G =', f'{dG_est:.2f} mm', q='Q1')
P.note(3, 100, 'Seven values from 10 cm to 90 cm, with 1/I calculated in the table: that is the evidence for the [3].', 'mark')
P.note(3, 460, 'Units: P in A⁻¹ m⁻¹ (x in m) and Q in A⁻¹.', 'warn')
P.note(4, 220, 'Show the rearrangement before substituting values. Give d_G to the same precision as d_F.', 'mark')
workbook(os.path.join(X, 'SAJC_Q1_two_wires.xlsx'), 'SAJC Q1 – Two wires (sample data)', f'd_F = {dF:.2f} mm. Plot 1/I against x (m).',
         ['x / cm', 'I / A'], [list(r) for r in rows1], proc=[('x / m', '=A{r}/100'), ('1/I / A⁻¹', '=1/B{r}')],
         chart=dict(x=3, y=4, title='1/I against x', xt='x / m', yt='1/I / A⁻¹'),
         results=[('P', '=SLOPE(D{first}:D{last},C{first}:C{last})', 'A⁻¹ m⁻¹'), ('Q', '=INTERCEPT(D{first}:D{last},C{first}:C{last})', 'A⁻¹'),
                  ('d_G = d_F√(1 + LP/Q)', f'={dF}*SQRT(1+SLOPE(D{{first}}:D{{last}},C{{first}}:C{{last}})/INTERCEPT(D{{first}}:D{{last}},C{{first}}:C{{last}}))', 'mm')])

# ======================= Q2 rubber bands =======================
L0, b2, kb = 6.0, 9.4, 47.7
T_band = kb * (b2 - L0) / 100
def alpha(m):
    return math.degrees(math.asin(m * g / (2 * T_band)))
a300 = round(alpha(0.300) + rnd.gauss(0, 0.6))
a200 = round(alpha(0.200) + rnd.gauss(0, 0.6))
C1, C2 = math.sin(math.radians(a300)) / 0.300, math.sin(math.radians(a200)) / 0.200
Cm = (C1 + C2) / 2
k_est = g / (2 * (b2 - L0) / 100 * Cm)
P.question('Q2', 'Two stretched rubber bands', 14, [5, 6, 7, 8],
           'A mass hangs from two rubber bands on a hacksaw blade. Keeping the band length b fixed keeps the tension fixed, so sin α = Cm with C = g/(2ek). '
           'Then analyse a non-Hookean force–extension dataset: work done from area, hysteresis, and B from ln(F/A + 1) against x.',
           sim='sajc-q2', xlsx=[('SAJC_Q2f_force_extension_dataset.xlsx', 'A practice version of the engineer\'s loading data. Area under F–x (trapezium) for the work done; plot ln(F/A + 1) against x for B.')],
           skills=['protractor', 'metre rule along a slant', 'force resolution', 'area under a graph', 'linearising an exponential'])
P.ans(5, 'm =', '300 g', q='Q2')
P.text(5, 140, 590, 'protractor centred where the band leaves the blade; rule laid along the band from the blade to the hook', size=8.6, q='Q2')
P.ans(5, 'α =', f'{a300}°', q='Q2')
P.ans(5, 'b =', f'{b2:.1f} cm', q='Q2')
P.note(5, 560, 'α is between ONE band and the blade. Read it at the top where the band leaves the blade.', 'tip')
P.note(5, 680, 'Measure b along the band (top of band on the blade to the hook), to 0.1 cm.', 'mark')
P.ans(6, 'm =', '200 g', q='Q2')
P.ans(6, 'α =', f'{a200}°', q='Q2')
P.text(6, 140, 350, f'C = sin α / m\nC₁ = sin {a300}° / 0.300 = {C1:.3f}\nC₂ = sin {a200}° / 0.200 = {C2:.3f}', size=9.6, q='Q2')
P.ans(6, 'first value of C', f'{C1:.2f} kg⁻¹', q='Q2')
P.ans(6, 'second value of C', f'{C2:.2f} kg⁻¹', q='Q2')
P.text(6, 140, 600, f'unstretched length of one band l₀ = {L0:.1f} cm ⇒ e = b − l₀ = {b2-L0:.1f} cm\n'
       f'k = g/(2eC) = 9.81 / (2 × 0.0{(b2-L0)*10:.0f} × {Cm:.2f})  (mean C)', size=9.3, q='Q2')
P.ans(6, 'k =', f'{k_est:.0f} N m⁻¹', q='Q2')
P.note(6, 170, 'Keeping b the same keeps the extension, and so the tension T, the same. Then 2T sin α = mg gives sin α ∝ m.', 'why')
P.note(6, 340, 'Write C with its unit (kg⁻¹ if m is in kg) to 2–3 s.f.', 'mark')
P.note(6, 600, 'You need an extra measurement: the unstretched length of a band, to find e. Show it in your working.', 'warn')
P.write_lines(7, 'The bands are not straight lines of zero width: they flatten and twist at the blade and the hook, so it is hard to '
              'decide where to place the protractor to measure α (and where b starts and ends).', after=90, before=190, size=9.2, q='Q2')
# dataset (f)
A_, B_ = 2.0, 85.0
dsf = []
for i in range(0, 31):
    x = i * 0.001
    F = A_ * (math.exp(B_ * x) - 1) * (1 + rnd.gauss(0, 0.004))
    dsf.append((round(x, 3), round(F, 3)))
W = sum(0.5 * (dsf[i][1] + dsf[i + 1][1]) * 0.001 for i in range(len(dsf) - 1))
lin = [(x, math.log(F / A_ + 1)) for x, F in dsf if x > 0]
mf, cf, r2f = linfit([a for a, b in lin], [b for a, b in lin])
P.ans(7, 'work done', f'{W:.3f} ', q='Q2')
P.write_lines(7, 'Work done = area under the force–extension graph, found with the trapezium rule in the spreadsheet: Σ ½(Fₙ + Fₙ₊₁)Δx.',
              after=420, before=470, size=9.2, q='Q2')
P.write_lines(8, 'The area of the loop is the energy dissipated (converted to internal energy/heat in the material) in one loading–unloading cycle '
              '(hysteresis): less work is recovered on unloading than was done on loading.', after=100, before=180, size=9.0, q='Q2')
P.graph(8, 140, 395, 300, 200, q='Q2', xlabel='x / m', ylabel='ln(F/A + 1)', xr=[0, 0.032], yr=[0, 2.8],
        series=[dict(pts=lin[::2])], lines=[dict(m=mf, c=cf)], eq=eqn(mf, cf, 4, r2=r2f), eqpos=(160, 405))
P.text(8, 140, 610, 'F/A + 1 = e^(Bx) ⇒ ln(F/A + 1) = Bx, so the gradient = B', size=9.3, q='Q2')
P.ans(8, 'B =', f'{mf:.1f} m⁻¹', q='Q2')
P.note(7, 90, 'Make the error specific to this set-up (band shape at blade/hook, or b changing while you adjust the tops).')
P.note(7, 380, 'Non-Hookean means the graph is a curve. The area under it is still the work done; 0.5 × F × x does not apply.', 'warn')
P.note(8, 100, 'One mark: the loop area = energy lost as heat per cycle.', 'mark')
P.note(8, 400, 'Linearise: ln(F/A + 1) = Bx, a straight line through the origin with gradient B.', 'why')
workbook(os.path.join(X, 'SAJC_Q2f_force_extension_dataset.xlsx'), 'SAJC Q2(f) – Force–extension loading data (practice dataset)',
         'A = 2.0 N. Work done = area under F–x. Plot ln(F/A + 1) against x for B.',
         ['x / m', 'F / N'], [list(r) for r in dsf],
         proc=[('ln(F/2 + 1)', '=LN(B{r}/2+1)'), ('strip area / J', '=IF(A{r1}<>"",0.5*(B{r}+B{r1})*(A{r1}-A{r}),"")')],
         chart=dict(x=1, y=3, title='ln(F/A + 1) against x', xt='x / m', yt='ln(F/A + 1)'),
         results=[('work done = Σ strips', '=SUM(D{first}:D{last})', 'J'), ('B = gradient', '=SLOPE(C{first}:C{last},A{first}:A{last})', 'm⁻¹')])

# ======================= Q3 coupled pendulums =======================
def t_of(x, taut=False):
    return (9.0 + 0.8 * x) * (1.55 if taut else 1.0)
x0 = 15.0
t0 = round(t_of(x0) + rnd.gauss(0, 0.4), 1)
xs3 = [5.0, 10.0, 15.0, 20.0, 25.0]
rows3 = [(x, round(t_of(x) + rnd.gauss(0, 0.4), 1)) for x in xs3]
rows3 = [(x, t0 if x == x0 else t) for x, t in rows3]
pct3 = 1.0 / t0 * 100
ttaut = round(t_of(x0, True) + rnd.gauss(0, 0.6), 1)
k1, k2 = 31 * 4.0, 12 * 8.0
pdk = abs(k1 - k2) / min(k1, k2) * 100
tab2 = [(80, 38), (100, 31), (120, 27), (140, 22), (160, 17)]
mt, ct, r2t = linfit([m - 40 for m, t in tab2], [t for m, t in tab2])
P.question('Q3', 'Coupled pendulums', 24, [9, 10, 11, 12, 13, 14, 15, 16],
           'Two pendulums hang from a common string. Energy passes from A to B and back; time how long A takes to stop and see how it depends on '
           'separation, tension, length difference and mass, then plan a test of independence from release angle.',
           sim='sajc-q3', xlsx=[('SAJC_Q3_coupled.xlsx', 'Sample t against x readings plus Table 3.2. Plot t against (m₂ − m₁) and extrapolate to equal masses.')],
           skills=['judging an event', 'percentage uncertainty', 'trends', 'extrapolation', 'planning'])
P.ans(10, 'x =', f'{x0:.1f}', q='Q3')
P.text(10, 180, 330, f'Times from release to A first stopping: {t0-0.7:.1f} s, {t0+0.8:.1f} s, {t0-0.1:.1f} s → mean', size=9, q='Q3')
P.ans(10, 't =', f'{t0:.1f}', q='Q3')
P.text(10, 180, 430, f'Judging when A has fully stopped: Δt ≈ 1 s (half the spread of repeats)\n% uncertainty = 1/{t0:.1f} × 100%', size=9, q='Q3')
P.ans(10, 'percentage uncertainty in t', f'{pct3:.0f}%', q='Q3')
P.write_lines(10, 'Better: the same judgement uncertainty (≈ 1 s) is spread over a time twice as long, halving the % uncertainty. '
              'But it could be worse: the amplitudes have decayed by then, so B "stopping" is harder to see.', after=610, size=8.8, q='Q3')
P.note(10, 180, 'Keep both pendulums exactly 45 cm (top knot to bob centre); unequal lengths stop the energy transfer from being complete.', 'tip')
P.note(10, 380, 'A never stops instantly. Its amplitude dwindles, so the uncertainty is a judgement of about ±1 s, not 0.01 s.', 'why')
P.note(10, 620, '"Discuss": give both sides (smaller % uncertainty vs harder-to-see stop because of damping), then conclude.', 'mark')
P.table(11, 130, 115, ['x / cm', 't₁ / s', 't₂ / s', 't / s'], [[f'{x:.1f}', f'{t-0.4:.1f}', f'{t+0.4:.1f}', f'{t:.1f}'] for x, t in rows3], size=9.2, q='Q3')
P.write_lines(11, 't increases as x increases (the pendulums are coupled more weakly when they are further apart).', after=330, before=380, size=9.2, q='Q3')
P.write_lines(11, f'x = {x0:.0f} cm: t is long enough ({t0:.0f} s) for a small % uncertainty, but short enough that damping has not made '
              'A\'s stopping point hard to see.', after=470, before=540, size=9.0, q='Q3')
P.note(11, 110, 'Tabulate all values, including the one from (a)(i), with repeats. The range should be 5–25 cm.', 'mark')
P.ans(12, 't =', f'{ttaut:.1f}', q='Q3')
P.write_lines(12, f'Increasing the tension increases t (from {t0:.0f} s to {ttaut:.0f} s): a tauter string transfers energy between the pendulums more slowly.',
              after=210, before=290, size=9.2, q='Q3')
P.text(13, 130, 200, f'k = t√y? No: k = t × y\nfirst: k = 31 × 4.0 = {k1:.0f} s cm\nsecond: k = 12 × 8.0 = {k2:.0f} s cm'.replace('k = t√y? No: k = t × y', 'k = t × y'), size=9.6, q='Q3')
P.ans(13, 'first value of k', f'{k1:.0f} s cm  (1.2 × 10² s cm)', size=9.5, q='Q3')
P.ans(13, 'second value of k', f'{k2:.0f} s cm  (96 s cm)', size=9.5, q='Q3')
P.write_lines(13, 't is given to 2 s.f. (31, 12) and y to 2 s.f. (4.0, 8.0), so k should be given to 2 s.f.', after=400, before=480, size=9.2, q='Q3')
P.write_lines(13, f'% difference = ({k1:.0f} − {k2:.0f})/{k2:.0f} = {pdk:.0f}%, much larger than the {pct3:.0f}% uncertainty in t (about '
              f'{2*pct3:.0f}% allowing for both readings), so the results do not support t = k/y.', after=600, size=9.0, q='Q3')
P.note(13, 190, 'k = t × y from t = k/y; units s cm.', 'mark')
P.note(13, 600, 'Refer to YOUR % uncertainty from (a)(ii) when you decide.', 'mark')
for i, (m2, t) in enumerate(tab2):
    s = str(m2 - 40)
    P.text(14, [233, 290, 346, 403, 460][i] - tw(s, 9.5) / 2, 440, s, size=9.5, q='Q3')
P.graph(15, 140, 140, 300, 220, q='Q3', xlabel='(m₂ − m₁) / g', ylabel='t / s', xr=[0, 130], yr=[0, 55],
        series=[dict(pts=[(m - 40, t) for m, t in tab2])], lines=[dict(m=mt, c=ct, x=[0, 130], dash=None)], eq=eqn(mt, ct, 4, r2=r2t), eqpos=(300, 150))
P.text(15, 140, 380, f'Equal masses ⇒ (m₂ − m₁) = 0 ⇒ t = y-intercept = {ct:.1f} s (extrapolation)', size=9.4, q='Q3')
P.ans(15, 't =', f'{ct:.0f}', q='Q3')
P.note(14, 430, 'Complete the table: 40, 60, 80, 100, 120 g (m₁ = 40 g).', 'mark')
P.note(15, 150, 'The t-intercept answer is an extrapolation: say so, and keep the trendline running to x = 0.', 'tip')
plan3 = ('Keep x, the tension (stand positions), pendulum lengths (45 cm) and bob masses constant. '
         'Measure the release angle θ with a protractor fixed at the top of pendulum A (or pull A out by a horizontal distance d and use sin θ = d/L). '
         'Release A from rest (no push) at θ = 5°, 10°, 15°, 20°, 25° and 30°. For each, time from release until A first stops; repeat three times and average. '
         'Use a video recording with a timer to judge more precisely when A stops. '
         'Plot t against θ: if t is independent of θ, the points lie on a horizontal line within the error bars (the gradient of the trendline is close to zero and '
         'the spread of t is within its uncertainty of about ±1 s).')
P.write_lines(16, plan3, after=320, size=9.2, q='Q3')
P.note(16, 330, 'Two bullet points to cover: the measurements (how θ and t are found, repeats) and how the results show independence (horizontal line / constant t).', 'mark')
workbook(os.path.join(X, 'SAJC_Q3_coupled.xlsx'), 'SAJC Q3 – Coupled pendulums (Table 3.2)', 'm₁ = 40 g. Plot t against (m₂ − m₁) and find t at (m₂ − m₁) = 0.',
         ['m2 / g', 't / s'], [list(r) for r in tab2], proc=[('(m2 − m1) / g', '=A{r}-40')],
         chart=dict(x=3, y=2, title='t against (m₂ − m₁)', xt='(m₂ − m₁) / g', yt='t / s'),
         results=[('gradient', '=SLOPE(B{first}:B{last},C{first}:C{last})', 's g⁻¹'), ('t at equal masses = intercept', '=INTERCEPT(B{first}:B{last},C{first}:C{last})', 's')])
P.build()
