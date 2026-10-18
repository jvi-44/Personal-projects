import math, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from vpl import *
from plans import place

rnd = random.Random(2026_09_01)
P = Paper('tjc', 'Temasek Junior College', 'TJC', '1 Sep 2026', os.path.join(PRIV, 'src', 'tjc.pdf'))
X = os.path.join(APP, 'dl')
g = 9.81


def T_double(xcm, l2=0.20):
    l1 = (xcm + 1.5) / 100
    s = l1 + l2
    w2 = g * (s - math.sqrt(s * s - 2 * l1 * l2)) / (l1 * l2)
    return 2 * math.pi / math.sqrt(w2)


# ======================= Q1 double pendulum (as VJC Q1, x ≈ 15 cm) =======================
_xs_fit = [5 + i for i in range(31)]
P0, Q0, _ = linfit(_xs_fit, [T_double(x) ** 4 for x in _xs_fit])   # straight-line version of the model, as the question assumes
rows1 = []
for x in (15, 5, 10, 20, 25, 30, 35):
    xm = round(x + rnd.gauss(0, 0.15), 1)
    t = [round(10 * (P0 * xm + Q0) ** 0.25 * (1 + rnd.gauss(0, 0.003)), 2) for _ in range(2)]
    Tm = hu(sum(t) / 20, 3)
    rows1.append((xm, t[0], t[1], Tm, Tm ** 4))
first = rows1[0]
rows1.sort()
m1, c1, r21 = linfit([r[0] for r in rows1], [r[4] for r in rows1])
P.question('Q1', 'Two masses on a string (double pendulum)', 10, [2, 3],
           'Same set-up as VJC Q1 starting from x ≈ 15 cm: vary the upper string length x and test T⁴ = Px + Q.',
           sim='vjc-q1', xlsx=[('TJC_Q1_double_pendulum.xlsx', 'x and 10-oscillation timings for seven lengths; plot T⁴ against x.')],
           skills=['metre rule', 'timing oscillations', 'tabulation', 'trendline'])
P.ans(2, 'x =', f'{first[0]:.1f} cm', q='Q1')
P.text(2, 140, 600, f'10 oscillations: {first[1]:.2f} s, {first[2]:.2f} s\nT = {(first[1]+first[2])/2:.3f}/10', size=9.5, q='Q1')
P.ans(2, 'T =', f'{first[3]:.3f} s', q='Q1')
P.note(2, 480, 'Measure x from the bottom of the split cork to the top of the upper loop, with the rule held vertically against the string.', 'tip')
P.note(2, 600, 'Time at least 10 oscillations twice; small displacements only.', 'mark')
P.table(3, 140, 112, ['x / cm', 't₁ / s', 't₂ / s', 'T / s', 'T⁴ / s⁴'], [[f'{r[0]:.1f}', f'{r[1]:.2f}', f'{r[2]:.2f}', f'{r[3]:.3f}', f'{r[4]:.3f}'] for r in rows1], size=9.2, rh=16.5, q='Q1')
P.graph(3, 140, 476, 300, 150, q='Q1', xlabel='x / cm', ylabel='T⁴ / s⁴', xr=[0, 38], yr=[0, max(r[4] for r in rows1) * 1.15],
        series=[dict(pts=[(r[0], r[4]) for r in rows1])], lines=[dict(m=m1, c=c1, x=[0, 38])], eq=eqn(m1, c1, 4, r2=r21), eqpos=(330, 565))
P.ans(3, 'P =', f'{m1:.4f} s⁴ cm⁻¹', q='Q1')
P.ans(3, 'Q =', f'{c1:.3f} s⁴', q='Q1')
P.note(3, 112, '[4] here: at least 6 values across a wide range (5–35 cm), repeats, a T⁴ column, and consistent d.p.', 'mark')
P.note(3, 460, 'P = gradient (s⁴ cm⁻¹), Q = intercept (s⁴). Quote the trendline as the spreadsheet gives it.', 'mark')
workbook(os.path.join(X, 'TJC_Q1_double_pendulum.xlsx'), 'TJC Q1 – System of masses (sample data)', 'Times are for 10 oscillations.',
         ['x / cm', 't1 / s', 't2 / s'], [[r[0], r[1], r[2]] for r in rows1], proc=[('T / s', '=ROUND((B{r}+C{r})/20,3)'), ('T⁴ / s⁴', '=D{r}^4')],
         chart=dict(x=1, y=5, title='T⁴ against x', xt='x / cm', yt='T⁴ / s⁴'),
         results=[('P', '=SLOPE(E{first}:E{last},A{first}:A{last})', 's⁴ cm⁻¹'), ('Q', '=INTERCEPT(E{first}:E{last},A{first}:A{last})', 's⁴')])

# ======================= Q2 rubber bands + capacitor dataset =======================
L0, b2, kb = 6.1, 9.6, 46.0
Tb = kb * (b2 - L0) / 100
def alpha(m):
    return math.degrees(math.asin(m * g / (2 * Tb)))
a300, a200 = round(alpha(0.3) + rnd.gauss(0, 0.6)), round(alpha(0.2) + rnd.gauss(0, 0.6))
C1, C2 = math.sin(math.radians(a300)) / 0.3, math.sin(math.radians(a200)) / 0.2
k_est = g / (2 * (b2 - L0) / 100 * (C1 + C2) / 2)
P.question('Q2', 'Rubber bands and a capacitor-discharge dataset', 15, [4, 5, 6, 7],
           'As SAJC Q2: with b fixed, sin α = Cm and C = g/(2ek). Then analyse a datalogger record of a 2200 µF capacitor discharging from 6.0 V: '
           'τ from ln I against t, and the charge from the area under the I–t graph.',
           sim='sajc-q2', xlsx=[('TJC_Q2f_capacitor_dataset.xlsx', 'A practice version of capacitorDischarge.csv: I every 0.5 s. Plot ln I against t for τ; trapezium sum for Q.')],
           skills=['protractor', 'force resolution', 'ln-linearisation', 'area under I–t'])
P.ans(4, 'm =', '300 g', q='Q2')
P.note(4, 600, 'Check both bands hang symmetrically. α must be the same on both sides.', 'tip')
P.ans(5, '𝛼 =', f'{a300}°', q='Q2')
P.ans(5, 'b =', f'{b2:.1f} cm', q='Q2')
P.ans(5, 'm =', '200 g', after=300, q='Q2')
P.ans(5, '𝛼 =', f'{a200}°', after=400, q='Q2')
P.text(5, 160, 519, f'C = sin α/m:  C₁ = sin {a300}°/0.300 = {C1:.3f},  C₂ = sin {a200}°/0.200 = {C2:.3f}', size=9.2, q='Q2')
P.ans(5, 'first value of C', f'{C1:.2f} kg⁻¹', q='Q2')
P.ans(5, 'second value of C', f'{C2:.2f} kg⁻¹', q='Q2')
P.text(6, 120, 190, f'unstretched band l₀ = {L0:.1f} cm ⇒ e = b − l₀ = {b2-L0:.1f} cm = {(b2-L0)/100:.3f} m\n'
       f'k = g/(2eC) = 9.81/(2 × {(b2-L0)/100:.3f} × {(C1+C2)/2:.2f})   (mean C)', size=9.3, q='Q2')
P.ans(6, 'k =', f'{k_est:.0f} N m⁻¹', q='Q2')
P.text(6, 165, 388, 'It is hard to place the protractor accurately at the point where the band leaves the blade\n(the band is wide and curves there), so α is uncertain.', size=8.6, q='Q2')
P.text(6, 190, 466, 'Photograph the set-up square-on with a ruler in view and measure α on the photo\n(or measure the horizontal and vertical distances to the hook and use trigonometry).', size=8.4, q='Q2')
P.note(5, 470, 'Keep b fixed (same tension) when changing m. That is the whole point of the method.', 'why')
P.note(6, 180, 'Show the extra measurement of the unstretched length l₀ explicitly.', 'warn')
P.note(6, 380, 'The improvement must solve the error you named, so pair them.', 'mark')
# capacitor dataset
Cap, V0, Rr = 2200e-6, 6.0, 4700.0
tau = Rr * Cap
dsc = []
for i in range(0, 121):
    t = i * 0.5
    I = V0 / Rr * math.exp(-t / tau) * 1000
    dsc.append((t, round(I + rnd.gauss(0, 0.002), 4)))
fit = [(t, math.log(I)) for t, I in dsc if I > 0.03]
mc, cc, r2c = linfit([a for a, b in fit], [b for a, b in fit])
tau_fit = -1 / mc
Qd = sum(0.5 * (dsc[i][1] + dsc[i + 1][1]) * 0.5 for i in range(len(dsc) - 1)) / 1000
Q0 = Cap * V0
P.graph(7, 150, 240, 280, 100, q='Q2', xlabel='t / s', ylabel='ln(I / mA)', xr=[0, 40], yr=[-3.6, 0.6], series=[dict(pts=fit[::6], mark='dot')],
        lines=[dict(m=mc, c=cc)], eq=eqn(mc, cc, 4), eqpos=(330, 248), ny=3, nx=4, size=7)
P.ans(7, '𝜏 =', f'{tau_fit:.1f} s', q='Q2')
P.ans(7, 'Q =', f'{Qd*100:.3f} × 10⁻² C', q='Q2')
P.write_lines(7, 'Q = area under the I–t graph: in the spreadsheet, sum ½(Iₙ + Iₙ₊₁) × 0.5 s over all the readings (trapezium rule), converting mA to A.',
              after=455, before=550, size=9.0, q='Q2')
P.write_lines(7, f'Initial charge = CV₀ = 2200 × 10⁻⁶ × 6.0 = {Q0*100:.2f} × 10⁻² C. The area gives {Qd*100:.3f} × 10⁻² C, about {abs(Q0-Qd)/Q0*100:.1f}% less. '
              f'The data stop at 60 s ≈ {60/tau:.0f}τ, when about e⁻⁶ ≈ 0.3% of the charge is still on the capacitor, so Q is slightly less than (approximately equal to) the initial charge.',
              after=600, before=695, size=8.6, q='Q2')
P.note(7, 240, 'ln I = ln I₀ − t/τ. Use the region where I is well above the noise.', 'why')
P.note(7, 460, 'Units: mA × s = mC. Convert before comparing with CV₀.', 'warn')
P.note(7, 610, 'Two marks: the comparison with CV₀ (numbers) AND the reason (charge remaining after the last reading is negligible; trapezium/noise effects).', 'mark')
workbook(os.path.join(X, 'TJC_Q2f_capacitor_dataset.xlsx'), 'TJC Q2(f) – Capacitor discharge (practice dataset)', 'C = 2200 µF, V₀ = 6.0 V. Find τ and Q.',
         ['t / s', 'I / mA'], [list(r) for r in dsc],
         proc=[('ln(I / mA)', '=IF(B{r}>0.03,LN(B{r}),NA())'), ('strip charge / C', '=IF(A{r1}<>"",0.5*(B{r}+B{r1})/1000*(A{r1}-A{r}),"")')],
         chart=dict(x=1, y=3, title='ln I against t', xt='t / s', yt='ln(I / mA)'),
         results=[('τ = −1/gradient (t ≤ 38 s, I > 0.03 mA)', '=-1/SLOPE(C{first}:C{lastfit},A{first}:A{lastfit})'.replace('{lastfit}', str(5 + len(fit))), 's'), ('Q = Σ strips', '=SUM(D{first}:D{last})', 'C'), ('CV₀', Q0, 'C')])

# ======================= Q3 coils (as VJC Q3) =======================
rho_cu = 1.72e-8
DY, dY, lenY = 4.02, 0.27, 7.60
NY = round(lenY * 10 / dY)
LY = NY * math.pi * (DY + dY / 10)
XY = rho_cu * LY / 100 / (math.pi * (0.25 / 2000) ** 2)
DZ, dZ = 3.01, 0.39
LZ = 0.75 * LY
XZ = rho_cu * LZ / 100 / (math.pi * (0.37 / 2000) ** 2)
E3, rint = 1.54, 0.40
def I_of(Xc, R):
    return E3 / (rint + 0.1 + Xc * R / (Xc + R))
Rs = [15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0]
rowsY = [(R, round(I_of(XY, R) * (1 + rnd.gauss(0, 0.003)), 3)) for R in Rs]
rowsZ = [(R, round(I_of(XZ, R) * (1 + rnd.gauss(0, 0.003)), 3)) for R in Rs]
mY, cY, r2Y = linfit([R for R, I in rowsY], [I * R for R, I in rowsY])
mZ, cZ, r2Z = linfit([R for R, I in rowsZ], [I * R for R, I in rowsZ])
XYe, XZe = cY / mY, cZ / mZ
kY, kZ = XYe * (dY / 1000) ** 2 / (LY / 100), XZe * (dZ / 1000) ** 2 / (LZ / 100)
pctL = (0.1 / lenY + 0.01 / dY + 0.01 / DY) * 100
P.question('Q3', 'Resistance of a coil of wire', 25, [8, 9, 10, 11, 12, 13, 14],
           'Same apparatus as VJC Q3: estimate the wire length on each tube, find each coil\'s resistance from IR = GR + H (X = H/G), compare with X = kL/d², '
           'and reason about which coil gives the stronger field at its ends.',
           sim='vjc-q3', xlsx=[('TJC_Q3_coils.xlsx', 'I against R for coils Y and Z; plot IR against R.')],
           skills=['vernier & micrometer', 'estimating a length', 'linearisation', 'evaluation', 'magnetic fields'])
P.fill(8, 402, 661, f'{DY:.2f}', q='Q3')
P.fill(8, 402, 687, f'{dY:.2f}', q='Q3')
P.text(8, 160, 596, 'D: vernier across the tube, two perpendicular readings.\nd: micrometer, three readings, zero error 0.00 mm.', size=8.6, q='Q3')
P.text(9, 160, 150, f'winding length = {lenY:.1f} cm ⇒ N = {lenY:.1f}/{dY/10:.3f} = {NY} turns\nlength per turn = π(D + d) = π × {DY+dY/10:.3f} = {math.pi*(DY+dY/10):.2f} cm\nL(Y) = {NY} × {math.pi*(DY+dY/10):.2f} = {NY*math.pi*(DY+dY/10):.0f}', size=9.2, q='Q3')
P.fill(9, 420, 251, sci(LY, 3), q='Q3')
P.text(9, 160, 330, f'l = {lenY:.1f} ± 0.1 cm ({0.1/lenY*100:.1f}%); d = {dY:.2f} ± 0.01 mm ({0.01/dY*100:.1f}%); D = {DY:.2f} ± 0.01 cm ({0.01/DY*100:.2f}%)', size=8.8, q='Q3')
P.fill(9, 416, 391, f'{pctL:.0f}%', q='Q3')
P.fill(9, 420, 677, '15.0', q='Q3')
P.fill(9, 420, 703, f'{rowsY[0][1]:.3f}', q='Q3')
P.table(10, 150, 130, ['R / Ω', 'I / A', 'IR / V'], [[f'{R:.1f}', f'{I:.3f}', f'{I*R:.3f}'] for R, I in rowsY], size=9.2, rh=17.5, q='Q3')
P.graph(10, 150, 465, 290, 182, q='Q3', xlabel='R / Ω', ylabel='IR / V', xr=[0, 16], yr=[0, max(I * R for R, I in rowsY) * 1.15],
        series=[dict(pts=[(R, I * R) for R, I in rowsY])], lines=[dict(m=mY, c=cY, x=[0, 16])], eq=eqn(mY, cY, 4, r2=r2Y), eqpos=(330, 590))
P.text(10, 150, 650, f'X(Y) = H/G = {cY:.3f}/{mY:.4f}', size=9.2, q='Q3')
P.fill(10, 420, 663, f'{XYe:.2f}', q='Q3')
P.fill(11, 420, 329, f'{DZ:.2f}', q='Q3')
P.fill(11, 420, 355, f'{dZ:.2f}', q='Q3')
P.text(11, 160, 600, f'L(Z) = 3 × {sci(LY, 3)} / 4', size=9.5, q='Q3')
P.fill(11, 420, 654, sci(LZ, 3), q='Q3')
P.table(12, 160, 190, ['R / Ω', 'I / A', 'IR / V'], [[f'{R:.1f}', f'{I:.3f}', f'{I*R:.3f}'] for R, I in rowsZ], size=8.6, rh=15, q='Q3')
P.graph(12, 300, 185, 240, 170, q='Q3', xlabel='R / Ω', ylabel='IR / V', xr=[0, 16], yr=[0, max(I * R for R, I in rowsZ) * 1.15],
        series=[dict(pts=[(R, I * R) for R, I in rowsZ])], lines=[dict(m=mZ, c=cZ, x=[0, 16])], eq=eqn(mZ, cZ, 4, r2=r2Z), eqpos=(345, 193), size=7.5)
P.fill(12, 414, 513, f'{XZe:.2f}', q='Q3')
P.text(12, 195, 624, f'graph value {XZe:.2f} Ω is smaller than the multimeter reading {XZ:.2f} Ω', size=8.8, q='Q3')
P.text(12, 195, 657, 'IR = GR + H ignores the internal resistance of the cell and ammeter,', size=8.8, q='Q3')
P.text(12, 195, 690, 'which lowers I, so H/G underestimates X.', size=8.8, q='Q3')
P.text(13, 160, 200, f'k = X d²/L\nY: {XYe:.2f} × ({dY}×10⁻³)² / {LY/100:.2f} = {sci(kY,3)} Ω m\nZ: {XZe:.2f} × ({dZ}×10⁻³)² / {LZ/100:.2f} = {sci(kZ,3)} Ω m', size=9.2, q='Q3')
P.fill(13, 416, 405, sci(kY, 3) + ' Ω m', q='Q3')
P.fill(13, 416, 432, sci(kZ, 3) + ' Ω m', q='Q3')
pdk = abs(kY - kZ) / min(kY, kZ) * 100
P.write_lines(13, f'k(Y) = {sci(kY, 3)} Ω m and k(Z) = {sci(kZ, 3)} Ω m differ by about {pdk:.1f}%, which is {"more" if pdk > pctL else "less"} than the {pctL:.0f}% uncertainty in L(Y), '
              f'so the results {"do not support" if pdk > pctL else "support"} X = kL/d².', after=480, size=9.0, q='Q3')
P.write_lines(14, f'B = CnI with n = 1/d and I = V/X = Vd²/(kL), so B = CVd/(kL). Z has the larger d and shorter L (¾L(Y)), so Z has the greater B '
              f'(about {(dZ/dY)/0.75:.1f} times that of Y).', after=100, before=230, size=9.0, q='Q3')
place(P, 'tjc-q3i', [('lines', 14, 410, 680)], diagram=(14, 175, 285), notes=[(14, 290)], q='Q3')
P.note(9, 150, 'Show the method: N = winding length / d, then L = N × π(D + d).', 'mark')
P.note(10, 130, 'Seven R values with an IR column, consistent d.p.', 'mark')
P.note(10, 460, 'X = H/G = intercept/gradient (H = E, G = E/X if the cell had no internal resistance).', 'why')
P.note(13, 200, 'k = 4ρ/π (A = πd²/4), so for copper expect ≈ 2.2 × 10⁻⁸ Ω m. Convert d and L to metres.', 'tip')
workbook(os.path.join(X, 'TJC_Q3_coils.xlsx'), 'TJC Q3 – Coils Y and Z (sample data)', 'Plot IR against R; X = intercept/gradient.',
         ['R / Ω', 'I (Y) / A', 'I (Z) / A'], [[R, IY, IZ] for (R, IY), (_, IZ) in zip(rowsY, rowsZ)], proc=[('IR (Y) / V', '=A{r}*B{r}'), ('IR (Z) / V', '=A{r}*C{r}')],
         chart=dict(x=1, y=4, title='IR against R (coil Y)', xt='R / Ω', yt='IR / V'),
         results=[('X(Y)', '=INTERCEPT(D{first}:D{last},A{first}:A{last})/SLOPE(D{first}:D{last},A{first}:A{last})', 'Ω'),
                  ('X(Z)', '=INTERCEPT(E{first}:E{last},A{first}:A{last})/SLOPE(E{first}:E{last},A{first}:A{last})', 'Ω')])
P.build()
