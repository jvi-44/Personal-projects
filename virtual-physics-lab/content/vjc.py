import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_08_26)
P = Paper('vjc', 'Victoria Junior College', 'VJC', '26 Aug 2026', os.path.join(PRIV, 'src', 'vjc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81


def T_double(xcm, l2=0.20):
    l1 = (xcm + 1.5) / 100
    s = l1 + l2
    w2 = g * (s - math.sqrt(s * s - 2 * l1 * l2)) / (l1 * l2)
    return 2 * math.pi / math.sqrt(w2)


_xs_fit = [5 + i for i in range(26)]
P0, Q0, _ = linfit(_xs_fit, [T_double(x) ** 4 for x in _xs_fit])   # straight-line version of the model, as the question assumes


def q1_rows(r, xs):
    rows = []
    for x in xs:
        xm = round(x + r.gauss(0, 0.15), 1)
        t = [round(10 * (P0 * xm + Q0) ** 0.25 * (1 + r.gauss(0, 0.003)), 2) for _ in range(2)]
        Tm = hu(sum(t) / 20, 3)
        rows.append((xm, t[0], t[1], Tm, Tm ** 4))
    return rows


rows1 = q1_rows(rnd, [10, 5, 15, 20, 25, 30])
rows1.sort()
m1, c1, r21 = linfit([r[0] for r in rows1], [r[4] for r in rows1])
r10 = [r for r in rows1 if abs(r[0] - 10) < 1][0]
P.question('Q1', 'Two masses on a string (double pendulum)', 8, [2, 3],
           'Two slotted masses hang on a string below a split cork. Changing the length x of the upper section changes the period of the swinging system; test T⁴ = Px + Q.',
           sim='vjc-q1', xlsx=[('VJC_Q1_double_pendulum.xlsx', 'x and two 10-oscillation timings for six lengths. Plot T⁴ against x.')],
           skills=['metre rule', 'timing oscillations', 'tabulation', 'trendline'])
P.ans(2, 'x =', f'{r10[0]:.1f} cm', q='Q1')
P.text(2, 140, 605, f'Time for 10 oscillations: {r10[1]:.2f} s, {r10[2]:.2f} s\nT = {(r10[1]+r10[2])/2:.3f}/10', size=9.5, q='Q1')
P.ans(2, 'T =', f'{r10[3]:.3f} s', q='Q1')
P.note(2, 520, 'x runs from the bottom of the split cork to the top of the upper string loop. Use a set square to line the rule up with the loop.', 'tip')
P.note(2, 600, 'Displace the bottom mass only a little: large swings make the motion irregular. Time 10 or more oscillations, twice.', 'mark')
P.table(3, 140, 120, ['x / cm', 't₁ / s', 't₂ / s', 'T / s', 'T⁴ / s⁴'], [[f'{r[0]:.1f}', f'{r[1]:.2f}', f'{r[2]:.2f}', f'{r[3]:.3f}', f'{r[4]:.3f}'] for r in rows1], size=9.5, q='Q1')
P.text(3, 140, 290, 't₁, t₂ = time for 10 oscillations', size=8.8, q='Q1')
P.graph(3, 140, 475, 300, 200, q='Q1', xlabel='x / cm', ylabel='T⁴ / s⁴', xr=[0, 32], yr=[0, max(r[4] for r in rows1) * 1.15],
        series=[dict(pts=[(r[0], r[4]) for r in rows1])], lines=[dict(m=m1, c=c1, x=[0, 32])], eq=eqn(m1, c1, 4, r2=r21), eqpos=(330, 590))
P.ans(3, 'P =', f'{m1:.4f} s⁴ cm⁻¹', q='Q1')
P.ans(3, 'Q =', f'{c1:.3f} s⁴', q='Q1')
P.note(3, 120, 'Six values of x across 5–30 cm, repeated timings, and a T⁴ column (the quantity you will plot), with units.', 'mark')
P.note(3, 480, 'Plot T⁴ (y) against x. P = gradient (s⁴ cm⁻¹), Q = y-intercept (s⁴).', 'why')
workbook(os.path.join(X, 'VJC_Q1_double_pendulum.xlsx'), 'VJC Q1 – System of masses (sample data)', 'Times are for 10 oscillations. Plot T⁴ against x.',
         ['x / cm', 't1 / s', 't2 / s'], [[r[0], r[1], r[2]] for r in rows1], proc=[('T / s', '=ROUND((B{r}+C{r})/20,3)'), ('T⁴ / s⁴', '=D{r}^4')],
         chart=dict(x=1, y=5, title='T⁴ against x', xt='x / cm', yt='T⁴ / s⁴'),
         results=[('P = gradient', '=SLOPE(E{first}:E{last},A{first}:A{last})', 's⁴ cm⁻¹'), ('Q = intercept', '=INTERCEPT(E{first}:E{last},A{first}:A{last})', 's⁴')])

# ======================= Q2 rubber band hysteresis =======================
L0, mhang = 8.6, 0.100
eL = 0.021
P.question('Q2', 'Energy in a stretched rubber band', 16, [4, 5, 6, 7, 8, 9],
           'Measure a band\'s unstretched length and its extension under the mass hanger, then use a loading–unloading dataset to find the energy lost in one cycle '
           '(the area of the hysteresis loop), and plan how E depends on cross-sectional area and maximum load.',
           sim='vjc-q2', xlsx=[('VJC_Q2c_hysteresis_dataset.xlsx', 'A practice version of datasetq2c: F and L while loading then unloading. Plot F against e and find the loop area.')],
           skills=['metre rule', 'units conversion', 'area between curves', 'planning (power law)'])
P.ans(4, 'L 0 =', f'{L0:.1f} cm', q='Q2')
P.text(4, 165, 400, 'Rule placed alongside the band lying straight and taut (not stretched);\nreading taken at eye level at both ends.', size=9, q='Q2')
P.note(4, 330, 'L₀ to 0.1 cm with a metre rule. Don\'t pull the band: taut but unstretched.', 'mark')
P.text(5, 165, 520, f'L = {L0 + eL*100:.1f} cm (measured from the rod to the bottom of the band\'s loop)\ne = L − L₀ = {L0+eL*100:.1f} − {L0:.1f} = {eL*100:.1f} cm', size=9.2, q='Q2')
P.ans(5, 'e =', f'{eL:.3f}', q='Q2')
P.text(5, 165, 700, f'F = mg = 0.100 × 9.81', size=9.5, q='Q2')
P.ans(5, 'F =', f'{mhang*g:.3f}', q='Q2')
P.note(5, 540, 'Record e in metres as asked. 0.021 m, not 2.1 cm.', 'warn')
P.note(5, 700, 'm must be in kg: 100 g = 0.100 kg.', 'warn')
# dataset loading / unloading
dsq = []
emax = 0.150
for i in range(0, 31):
    e = emax * i / 30
    F = 22 * e + 900 * e ** 3 - 1500 * e ** 4 if True else 0
    dsq.append(('loading', round(L0 / 100 + e, 4), round(F * (1 + rnd.gauss(0, 0.005)), 3)))
Fmax = dsq[-1][2]
dsq.append(('unloading', round(L0 / 100 + emax, 4), Fmax))   # turning point starts the unloading data
for i in range(29, -1, -1):
    e = emax * i / 30
    Fl = 22 * e + 900 * e ** 3 - 1500 * e ** 4
    frac = e / emax
    F = Fl * (0.55 + 0.45 * frac ** 3)
    dsq.append(('unloading', round(L0 / 100 + e, 4), round(F * (1 + rnd.gauss(0, 0.005)), 3)))
load = [(L - L0 / 100, F) for s, L, F in dsq if s == 'loading']
unload = [(L - L0 / 100, F) for s, L, F in dsq if s == 'unloading'][1:]
Wl = sum(0.5 * (load[i][1] + load[i + 1][1]) * (load[i + 1][0] - load[i][0]) for i in range(len(load) - 1))
ul = sorted(unload + [(emax, Fmax)])
Wu = sum(0.5 * (ul[i][1] + ul[i + 1][1]) * (ul[i + 1][0] - ul[i][0]) for i in range(len(ul) - 1))
Elost = Wl - Wu
P.graph(6, 130, 318, 300, 172, q='Q2', xlabel='e / m', ylabel='F / N', xr=[0, 0.16], yr=[0, Fmax * 1.15],
        curves=[dict(pts=load), dict(pts=ul)],
        notes=[(215, 360, 'loading (upper)', 8), (330, 440, 'unloading (lower)', 8), (330, 338, f'max F = {Fmax:.2f} N', 8), (345, 452, f'max e = {emax:.3f} m', 8)])
P.ans(6, 'energy lost', f'{Elost:.3f}', q='Q2')
P.write_lines(6, f'Energy lost = area enclosed by the loop = area under loading curve ({Wl:.3f} J) − area under unloading curve ({Wu:.3f} J), '
              'each found by the trapezium rule in the spreadsheet.', after=575, size=8.6, q='Q2')
P.note(6, 300, 'Label "loading" (upper curve) and "unloading" (lower curve), and mark max F and max e, as the question asks.', 'mark')
P.note(6, 530, 'Area of the loop = energy dissipated as heat in the band in one cycle.', 'why')
place(P, 'vjc-q2d', [('lines', 8, 40, 760), ('lines', 9, 40, 740)], diagram=(7, 150, 540, 0.7), notes=[(8, 80), (8, 400)], q='Q2')
P.note(7, 540, 'Diagram: the band clamped, the hanger with masses, the rule beside the band, and a safety tray.', 'mark')
P.note(9, 300, 'Rubber softens on its first stretch (the Mullins effect), so treat every band the same: all new, or all pre-stretched the same number of times.', 'tip')
workbook(os.path.join(X, 'VJC_Q2c_hysteresis_dataset.xlsx'), 'VJC Q2(c) – Loading and unloading data (practice dataset)',
         f'L₀ = {L0:.1f} cm. Compute e = L − L₀ and plot F against e. Energy lost = area under loading − area under unloading.',
         ['process', 'L / m', 'F / N'], [list(r) for r in dsq],
         proc=[('e / m', f'=B{{r}}-{L0/100}'), ('strip area / J', '=IF(A{r1}=A{r},0.5*(C{r}+C{r1})*(D{r1}-D{r}),"")')],
         chart=dict(x=4, y=3, title='F against e', xt='e / m', yt='F / N', trend=False),
         results=[('area under loading (Σ strips, loading rows)', '=SUMIF(A{first}:A{last},"loading",E{first}:E{last})', 'J'),
                  ('area under unloading (−Σ strips, unloading rows)', '=-SUMIF(A{first}:A{last},"unloading",E{first}:E{last})', 'J'),
                  ('energy lost = difference', '=SUMIF(A{first}:A{last},"loading",E{first}:E{last})+SUMIF(A{first}:A{last},"unloading",E{first}:E{last})', 'J')],
         answer_note='The unloading strips come out negative (e decreasing), so adding the two sums gives the loop area.')

# ======================= Q3 coils =======================
rho_cu = 1.72e-8
DY, dY, lenY = 4.00, 0.27, 7.50       # cm, mm (with enamel), cm of winding
NY = round(lenY * 10 / dY)
LY = NY * math.pi * (DY + dY / 10)
cond_Y = 0.25
XY = rho_cu * LY / 100 / (math.pi * (cond_Y / 2000) ** 2)
DZ, dZ = 3.00, 0.39
cond_Z = 0.37
LZ = 0.75 * LY
XZ = rho_cu * LZ / 100 / (math.pi * (cond_Z / 2000) ** 2)
E3, rint = 1.52, 0.45
def I_of(X_, R):
    return E3 / (rint + 0.1 + X_ * R / (X_ + R))
Rs = [15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0]
rowsY = [(R, round(I_of(XY, R) * (1 + rnd.gauss(0, 0.003)), 3)) for R in Rs]
rowsZ = [(R, round(I_of(XZ, R) * (1 + rnd.gauss(0, 0.003)), 3)) for R in Rs]
mY, cY, r2Y = linfit([R for R, I in rowsY], [I * R for R, I in rowsY])
mZ, cZ, r2Z = linfit([R for R, I in rowsZ], [I * R for R, I in rowsZ])
XYe, XZe = cY / mY, cZ / mZ
kY = XYe * (dY / 1000) ** 2 / (LY / 100)
kZ = XZe * (dZ / 1000) ** 2 / (LZ / 100)
pctL = (0.1 / lenY + 0.01 / dY + 0.01 / DY) * 100
P.question('Q3', 'Resistance of a coil of wire', 26, [10, 11, 12, 13, 14, 15, 16],
           'Estimate the length of wire wound on a tube from its diameter and the number of turns. A resistor R in parallel with the coil gives IR = GR + H, '
           'so the coil\'s resistance is X = H/G. Compare two coils with X = kL/d², and decide which coil gives the stronger field.',
           sim='vjc-q3', xlsx=[('VJC_Q3_coils.xlsx', 'I against R for coils Y and Z. Plot IR against R; X = intercept/gradient.')],
           skills=['vernier & micrometer', 'estimating a length', 'linearisation', 'evaluation', 'magnetic fields'])
P.ans(10, 'D Y =', f'{DY:.2f}', q='Q3')
P.text(10, 135, 410, 'vernier caliper across the tube, two perpendicular readings, zero error 0.00 cm', size=8.8, q='Q3')
P.ans(10, 'd Y =', f'{dY:.2f}', q='Q3')
P.text(10, 135, 490, 'micrometer, three readings 0.27, 0.27, 0.28 mm', size=8.8, q='Q3')
P.note(10, 380, 'Measure D, the tube diameter, with the vernier (Fig. 3.1), to 0.01 cm. The wire\'s centre-line diameter is then D + d.', 'mark')
P.note(10, 470, 'd(Y) to 0.01 mm. Counting many turns over a measured length is a good cross-check.', 'tip')
P.text(11, 165, 150, f'Length of winding along the tube = {lenY:.1f} cm\nnumber of turns N = {lenY:.1f} cm / {dY/10:.3f} cm = {NY}\n'
       f'length of one turn = π(D + d) = π × {DY + dY/10:.3f} cm = {math.pi*(DY+dY/10):.2f} cm\nL(Y) = N × π(D + d) = {NY} × {math.pi*(DY+dY/10):.2f}', size=9.2, q='Q3')
P.ans(11, 'L Y =', sci(LY, 3), q='Q3')
P.text(11, 165, 350, f'l = {lenY:.1f} ± 0.1 cm ({0.1/lenY*100:.1f}%); d = {dY:.2f} ± 0.01 mm ({0.01/dY*100:.1f}%);\nD = {DY:.2f} ± 0.01 cm ({0.01/DY*100:.2f}%)  ⇒  total ≈ {pctL:.0f}%', size=8.8, q='Q3')
P.ans(11, 'percentage uncertainty in L Y', f'{pctL:.0f}%', q='Q3')
P.note(11, 140, 'Two marks: correct method (N × circumference) and the working shown. Use the centre-line of the wire: π(D + d).', 'mark')
P.ans(12, 'R =', '15.0', q='Q3')
P.ans(12, 'I =', f'{rowsY[0][1]:.3f}', q='Q3')
P.table(12, 140, 470, ['R / Ω', 'I / A', 'IR / V'], [[f'{R:.1f}', f'{I:.3f}', f'{I*R:.3f}'] for R, I in rowsY], size=9.5, q='Q3')
P.note(12, 300, 'Keep the switch closed only while reading: the coil warms and its resistance rises.', 'tip')
P.note(12, 470, 'Seven values of R from 15 Ω down to 2 Ω, with an IR column.', 'mark')
P.graph(13, 140, 300, 300, 210, q='Q3', xlabel='R / Ω', ylabel='IR / V', xr=[0, 16], yr=[0, max(I * R for R, I in rowsY) * 1.15],
        series=[dict(pts=[(R, I * R) for R, I in rowsY])], lines=[dict(m=mY, c=cY, x=[0, 16])], eq=eqn(mY, cY, 4, r2=r2Y), eqpos=(330, 450))
P.text(13, 140, 560, f'G = gradient = {mY:.4f} A, H = y-intercept = {cY:.3f} V\nX(Y) = H/G = {cY:.3f} / {mY:.4f}', size=9.5, q='Q3')
P.ans(13, 'X Y =', f'{XYe:.2f} Ω', after=700, q='Q3')
P.note(13, 300, 'With the coil in parallel with R: I = E(X + R)/(XR), so IR = (E/X)R + E. G = E/X and H = E, hence X = H/G.', 'why')
P.ans(14, 'D Z =', f'{DZ:.2f}', q='Q3')
P.ans(14, 'd Z =', f'{dZ:.2f}', q='Q3')
P.text(14, 140, 280, f'L(Z) = ¾ × {sci(LY, 3)}', size=9.5, q='Q3')
P.ans(14, 'L Z =', sci(LZ, 3), after=295, q='Q3')
P.table(14, 125, 440, ['R / Ω', 'I / A', 'IR / V'], [[f'{R:.1f}', f'{I:.3f}', f'{I*R:.3f}'] for R, I in rowsZ[::1]], size=8.0, rh=14, q='Q3')
P.graph(14, 290, 440, 210, 150, q='Q3', xlabel='R / Ω', ylabel='IR / V', xr=[0, 16], yr=[0, max(I * R for R, I in rowsZ) * 1.15],
        series=[dict(pts=[(R, I * R) for R, I in rowsZ])], lines=[dict(m=mZ, c=cZ, x=[0, 16])], eq=eqn(mZ, cZ, 4), eqpos=(330, 448), size=7)
P.text(14, 125, 603, f'X(Z) = H/G = {cZ:.3f}/{mZ:.4f}', size=9.2, q='Q3')
P.ans(14, 'X Z =', f'{XZe:.2f}', q='Q3')
meterZ = XZ
P.ans(14, 'difference', f'graph value {XZe:.2f} Ω is smaller than the multimeter reading {meterZ:.2f} Ω', size=8.6, q='Q3')
P.ans(14, 'reason', 'IR = GR + H assumes the cell and ammeter have no resistance;', size=8.6, q='Q3')
P.write_lines(14, 'their resistance lowers I, so H/G underestimates the coil resistance.', after=745, size=8.6, q='Q3', x=140)
P.text(15, 140, 210, f'k = X d² / L\nY: k = {XYe:.2f} × ({sci(dY/1000, 2)})² / {LY/100:.1f} = {sci(kY, 3)} Ω m\nZ: k = {XZe:.2f} × ({sci(dZ/1000, 2)})² / {LZ/100:.1f} = {sci(kZ, 3)} Ω m', size=9.0, q='Q3')
P.ans(15, 'first value of k', f'{sci(kY, 3)} Ω m', q='Q3')
P.ans(15, 'second value of k', f'{sci(kZ, 3)} Ω m', q='Q3')
pdk = abs(kY - kZ) / min(kY, kZ) * 100
P.write_lines(15, f'The two values of k differ by about {pdk:.1f}%, which is {"more" if pdk > pctL else "less"} than the {pctL:.0f}% uncertainty in L(Y), so the results '
              f'{"do not support" if pdk > pctL else "support"} X = kL/d².', after=460, size=9, q='Q3')
BY = 1 / (dY / 10) * (E3 / XY)
BZ = 1 / (dZ / 10) * (E3 / XZ)
P.write_lines(16, f'n = 1/d (close-wound), I = V/X and X = kL/d², so B = CnI = CV d/(kL). Z has the larger d ({dZ} mm vs {dY} mm) and the shorter wire '
              f'(L(Z) = ¾L(Y)), so B is larger for Z: B(Z)/B(Y) = (d(Z)/d(Y))(L(Y)/L(Z)) ≈ {(dZ/dY)/(0.75):.1f}.', after=220, size=9.0, q='Q3')
place(P, 'vjc-q3h', [('box', 16, 118, 467, 390, 41, 13.5), ('lines', 16, 500, 610, 2)], diagram=(16, 160, 392, 0.6), notes=[(16, 400)], q='Q3')
P.note(15, 210, 'Convert d and L to metres, so k is in Ω m. Because A = πd²/4, k = 4ρ/π, so for copper expect k ≈ 2.2 × 10⁻⁸ Ω m.', 'warn')
P.note(16, 220, 'Use the formulas to compare: write B in terms of d and L before deciding.', 'mark')
workbook(os.path.join(X, 'VJC_Q3_coils.xlsx'), 'VJC Q3 – Coils Y and Z (sample data)', 'Plot IR against R for each coil. X = intercept/gradient.',
         ['R / Ω', 'I (coil Y) / A', 'I (coil Z) / A'], [[R, IY, IZ] for (R, IY), (_, IZ) in zip(rowsY, rowsZ)],
         proc=[('IR (Y) / V', '=A{r}*B{r}'), ('IR (Z) / V', '=A{r}*C{r}')],
         chart=dict(x=1, y=4, title='IR against R (coil Y)', xt='R / Ω', yt='IR / V'),
         results=[('X(Y) = H/G', '=INTERCEPT(D{first}:D{last},A{first}:A{last})/SLOPE(D{first}:D{last},A{first}:A{last})', 'Ω'),
                  ('X(Z) = H/G', '=INTERCEPT(E{first}:E{last},A{first}:A{last})/SLOPE(E{first}:E{last},A{first}:A{last})', 'Ω')])
P.meta['coil'] = dict(DY=DY, dY=dY, lenY=lenY, NY=NY, LY=LY, XY=XY, DZ=DZ, dZ=dZ, XZ=XZ)
P.build()
