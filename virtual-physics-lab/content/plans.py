"""Planning-question answer keys for all ten papers, in the numbered-step style used by school mark schemes.
Each entry is used twice: content/<school>.py lays it onto the annotated paper (Paper.flow), and
tools/plans_pdf.py compiles every planning question with its answer key into one PDF."""

PLANS = {}


def plan(key, **kw):
    PLANS[key] = dict(key=key, **kw)


# ---------------------------------------------------------------- HCI
plan('hci-q2c', school='hci', part='2(c)', marks=6, qpages=[8, 9],
     title='Energy stored in a capacitor vs work done by the cell',
     diagram=dict(w=400, h=262, els=[
         ('cell', 40, 20, 'h', 'cell, e.m.f. E'), ('wire', [(0, 20), (25, 20)]), ('wire', [(55, 20), (250, 20), (250, 60)]),
         ('wire', [(0, 20), (0, 160), (40, 160)]), ('S', 55, 160, 'h', 'switch'), ('wire', [(70, 160), (95, 160)]),
         ('R', 110, 160, 'h', 'R (known)'), ('wire', [(125, 160), (150, 160)]), ('A', 165, 160, 'h', ''),
         ('text', 165, 185, 'current sensor', 8, 'middle'), ('wire', [(180, 160), (250, 160), (250, 130)]),
         ('C', 250, 95, 'v', 'C'), ('wire', [(250, 60), (250, 80)]), ('wire', [(250, 110), (250, 130)]),
         ('wire', [(250, 60), (320, 60), (320, 80)]), ('V', 320, 95, 'v', ''), ('wire', [(320, 110), (320, 130), (250, 130)]),
         ('text', 335, 98, 'voltage sensor', 8), ('rect', 300, 200, 80, 34), ('text', 340, 221, 'datalogger', 8.5, 'middle'),
         ('dash', [(165, 168), (165, 215), (300, 215)]), ('dash', [(330, 112), (330, 200)]),
         ('text', 0, 250, 'Electrolytic capacitor: correct polarity. High-resistance voltmeter across the cell measures E.', 8)]),
     text='''
## Procedure
1) Set up the circuit as shown in the diagram (the charging circuit of Figure 2.1 with a current sensor in series with C and a voltage sensor across C, both connected to a datalogger).
2) Fully discharge the capacitor by connecting a resistor across it until the voltage sensor reads zero.
3) With the switch open, measure the e.m.f. E of the cell using a high-resistance digital voltmeter connected directly across the cell.
4) Set the datalogger to record the current I and the p.d. V across C every 0.1 s, for a duration of at least 5RC (until I falls to zero).
5) Close the switch and start the datalogger at the same time.
6) Record the final (maximum) p.d. V across the fully charged capacitor.
## How the work done by the cell is determined
7) Plot a graph of I against t. The charge Q that flows = area under the I–t graph (trapezium rule in a spreadsheet).
8) Work done by the cell W = EQ.
## Energy stored and the difference
9) Energy stored U = ½CV², using the known capacitance C and the final p.d. V.
10) Difference = W − U. Repeat steps 2 to 9 three times and calculate the average difference.
## Precautions (accuracy)
11) Take preliminary readings to choose a suitable sampling rate and recording time so that the whole charging curve is captured.
12) Ensure the capacitor is fully discharged before every run so that it starts with zero charge.
13) Check E before and after each run so that it is constant (use a fresh cell of low internal resistance).
## Precautions (safety)
14) Connect the electrolytic capacitor with the correct polarity and do not exceed its voltage rating.
15) Discharge the capacitor through a resistor before handling it.
''',
     notes=[('mark', 'Mark points: workable circuit diagram, procedure, W = EQ with Q from the area under the I–t graph, U = ½CV², and two relevant precautions.'),
            ('why', 'Theory: W = QE = CE² and U = ½CE², so half the work done by the cell is dissipated in the resistor whatever R is.')])

plan('hci-q3g', school='hci', part='3(g)', marks=4, qpages=[17],
     title='Period T and the number n of loops in the rubber band',
     text='''
## Procedure
1) Set up the apparatus as shown in Figure 3.2, using the same wire and bobs, with θ kept at the same value (check with the protractor).
2) Loop the rubber band over the rod n = 1 time.
3) Twist the wire through a small angle about the vertical axis and release it.
4) Measure the time t for 10 oscillations using a stopwatch. Repeat and calculate the average t. T = t / 10.
5) Repeat steps 2 to 4 for n = 2, 3, 4 and 5 loops.
## Control of variables
6) Keep the same rubber band, the same wire (same C and θ), the same bobs (same mass) and the same initial angle of twist.
## How to show inverse proportionality
7) Plot a graph of T against 1/n.
8) If T is inversely proportional to n, the graph will be a straight line passing through the origin.
9) Alternatively, calculate nT for each n: nT should be constant within the experimental uncertainty.
## Why there may not be enough results
10) n can only take small whole-number values (about 1 to 5) before the loops overlap or the band becomes too tight.
11) So there are only about 4 to 5 readings over a narrow range, which is not enough (fewer than 6 to 8 points) to establish the relationship reliably.
''',
     notes=[('mark', 'Cover all four bullet points. Each one usually earns a mark.'),
            ('warn', 'The last bullet is about the few, discrete values of n, not about reaction time or measurement uncertainty.')])

# ---------------------------------------------------------------- EJC
plan('ejc-q3e', school='ejc', part='3(e)', marks=8, qpages=[16, 17, 18],
     title='Period of the vertically oscillating rod: T² = A + B(r − q)²',
     text='''
## Variables
Independent variable: (r − q). Dependent variable: period T.
Controlled variables: masses R and Q, (r + q), the mass on the hanger, the amplitude.
## Procedure
1) Set up the apparatus as shown in Fig. 3.4, with R and Q of equal mass.
2) Place R and Q on the rod and measure r and q from the pivot to the centre of each mass using a metre rule.
3) Check that the rod is horizontal in equilibrium using a spirit level.
4) Displace the mass hanger downwards by a small distance (about 1 cm) and release it, so that the rod oscillates vertically.
5) Measure the time t for 20 oscillations using a stopwatch. Repeat and calculate the average t. T = t / 20.
6) Repeat steps 2 to 5 for 8 different values of (r − q). Move R away from the pivot and Q towards the pivot by the same distance each time.
## Control of variables
7) Keep (r + q) constant so that the total moment of R and Q about the pivot is unchanged. The equilibrium position and the tension in the string then stay the same.
8) Keep the same masses R and Q, the same mass on the hanger, the same string and pulley position, and the same amplitude.
## Analysis
9) Plot a graph of T² against (r − q)².
10) If the relationship T² = A + B(r − q)² is valid, the graph will be a straight line (not necessarily through the origin).
11) A = y-intercept and B = gradient.
## Extra detail to improve accuracy
12) Take preliminary readings to choose a wide range of (r − q) and a suitable number of oscillations, so that the percentage uncertainty in T is small.
13) Place a fiducial marker at the equilibrium position of the end of the rod to count the oscillations.
14) Use small amplitudes so that the string stays taut and the rod does not hit the stand.
15) Alternatively, record the motion with a motion sensor and datalogger (or a video) to find T more precisely.
16) Safety: place a sand tray / cushion below the mass hanger in case the string breaks.
''',
     notes=[('mark', 'Marks: procedure, measurements (r, q, T), control of variables, analysis (T² against (r − q)², A = intercept, B = gradient), extra accuracy detail.'),
            ('why', 'Keeping (r + q) constant is the key control: I = I_rod + m(r² + q²) = const + ½m(r − q)² when (r + q) is fixed.')])

# ---------------------------------------------------------------- NJC
plan('njc-q2c', school='njc', part='2(c)', marks=5, qpages=[8, 9],
     title='Cooling constant k and the surface area S of the water: k = αS + β',
     diagram=dict(w=320, h=265, els=[
         ('rect', 30, 120, 90, 110), ('rect', 32, 160, 86, 68, '#dbe8ff'), ('line', 75, 40, 75, 200), ('rect', 72, 196, 6, 10),
         ('text', 120, 60, 'temperature sensor', 8.5), ('line', 76, 60, 118, 60), ('rect', 200, 40, 90, 40), ('text', 245, 64, 'datalogger', 8.5, 'middle'),
         ('dash', [(75, 40), (75, 30), (245, 30), (245, 40)]), ('text', 130, 180, 'hot water, mass m (constant)', 8.5),
         ('arrow', 30, 245, 120, 245, True), ('text', 75, 258, '2r (vernier)', 8.5, 'middle'), ('rect', 0, 230, 160, 8),
         ('text', 170, 236, 'heat-proof mat', 8.5)]),
     text='''
## Procedure
1) Set up the apparatus as shown in the diagram.
2) Measure the internal diameter D of the container using the inside jaws of a vernier caliper, at two perpendicular positions. r = D / 2.
3) Place the empty container on a top-pan balance and zero (tare) the balance. Pour in hot water until the balance reads 200.0 g.
4) Measure the depth h of the water with a metre rule. Calculate S = 2πr² + 2πrh.
5) Start the datalogger when θ = 80 °C and record θ every 30 s for 20 minutes.
6) Repeat steps 2 to 5 for 8 containers of different internal radius r.
## How the mass of water is kept constant
7) Use the same mass of water (200.0 g, measured with the top-pan balance) in every container.
## Other control of variables
8) Keep the same initial temperature (80 °C), the same room temperature (no fans or draughts), the same container material and wall thickness, and the same sensor position.
## Analysis
9) For each container, plot a graph of ln(θ − 30) against t. k = −gradient.
10) Plot a graph of k against S.
11) If the relationship k = αS + β is valid, the graph will be a straight line, with α = gradient and β = y-intercept.
## Precautions
12) Take preliminary readings to choose a suitable range of r and recording time, so that the change in temperature is large and the percentage uncertainty is small.
13) Stir the water gently before readings so the temperature is uniform. Keep the sensor away from the walls.
14) Safety: wear heat-resistant gloves when pouring hot water and stand the container on a heat-proof mat.
''',
     notes=[('mark', 'Diagram: container, sensor in the water (not touching the walls), datalogger, how r is measured.'),
            ('tip', 'Keep the mass constant with a balance, not a measuring cylinder (hot water expands).')])

plan('njc-q3i', school='njc', part='3(i)', marks=6, qpages=[18, 19],
     title='Measuring g with a fluid pressure sensor: p = p₀ + ρgh',
     diagram=dict(w=320, h=230, els=[
         ('rect', 40, 20, 70, 200), ('rect', 42, 50, 66, 168, '#dbe8ff'), ('line', 75, 0, 75, 160), ('rect', 69, 160, 12, 8),
         ('text', 90, 168, 'wireless pressure sensor', 8.5), ('arrow', 125, 50, 125, 164, True), ('text', 130, 110, 'depth h (metre rule)', 8.5),
         ('text', 115, 40, 'liquid of density ρ (hydrometer)', 8.5), ('rect', 220, 10, 90, 40), ('text', 265, 34, 'datalogger', 8.5, 'middle'),
         ('line', 20, 0, 120, 0), ('text', 20, -6, 'clamp on retort stand', 8.5)]),
     text='''
## Variables
Independent variable: depth h below the liquid surface, measured with a metre rule.
Dependent variable: pressure p, measured with the wireless fluid pressure sensor and datalogger.
## Procedure
1) Set up the apparatus as shown in the diagram: a tall container of liquid, with the pressure sensor attached to a rod clamped to a retort stand and a metre rule clamped vertically beside it.
2) Measure the density ρ of the liquid using the hydrometer.
3) Lower the sensor to a depth h below the liquid surface. Measure h from the surface to the sensor diaphragm with the metre rule, with the eye level with the surface.
4) Wait for the reading to become steady and record the pressure p from the datalogger.
5) Repeat steps 3 and 4 for 8 different depths h (e.g. 5 cm to 40 cm).
## Equation and analysis
6) p = p₀ + ρgh, where p₀ is the atmospheric pressure.
7) Plot a graph of p against h. The graph will be a straight line with gradient = ρg and y-intercept = p₀.
8) g = gradient / ρ.
## Precautions
9) Take preliminary readings to choose the largest possible range of h (a deep container), so that the change in p is large and the percentage uncertainty is small.
10) Keep the temperature of the liquid constant, since the density depends on temperature.
11) Remove any air bubbles from the sensor before taking readings.
12) Check the y-intercept against the atmospheric pressure read from the barometer.
13) Safety: wipe up any spills to avoid slipping, and keep the datalogger and electrical connections away from the liquid.
''',
     notes=[('warn', 'Use only apparatus from the list. The pressure-sensor method needs the hydrometer, metre rule, sensor and containers.'),
            ('mark', 'State the equation clearly: p = p₀ + ρgh, so the gradient of p against h is ρg.')])

# ---------------------------------------------------------------- NYJC
plan('nyjc-q1f', school='nyjc', part='1(f)', marks=6, qpages=[6],
     title='T-shaped pendulum: b = ph³ + qw³',
     text='''
## Additional equipment
1) A set of T-shaped pendulums made of the same material and thickness: some with the same w and different h, and some with the same h and different w. Also a metre rule.
## Procedure
2) Set up the apparatus as shown in Fig. 1.1 and Fig. 1.2, with no slotted masses attached (so that T² = b).
3) Measure h and w of the pendulum using the metre rule.
4) Displace the pendulum by a small angle and release it. Measure the time t for 20 oscillations using a stopwatch. Repeat and calculate the average t. T = t / 20 and b = T².
5) Experiment 1: repeat steps 3 and 4 for 8 pendulums with different h but the same w.
6) Experiment 2: repeat steps 3 and 4 for 8 pendulums with different w but the same h.
## Control of variables
7) Keep w constant in Experiment 1 and h constant in Experiment 2.
8) Use pendulums of the same material and thickness, with the pivot at the top central hole, and the same small amplitude.
## Analysis
9) Experiment 1: plot a graph of b against h³. If the relationship is valid, the graph will be a straight line with gradient = p (y-intercept = qw³).
10) Experiment 2: plot a graph of b against w³. If the relationship is valid, the graph will be a straight line with gradient = q (y-intercept = ph³).
11) Take preliminary readings to choose a wide range of h and w, so that the change in b is large.
''',
     notes=[('mark', 'Marks: equipment, procedure, control of variables (one variable at a time), b against h³ (gradient p) and b against w³ (gradient q).'),
            ('why', 'From the earlier parts, T² = ax² + b with a ∝ M. With no masses attached (M = 0), T² = b.')])

# ---------------------------------------------------------------- SAJC
plan('sajc-q3g', school='sajc', part='3(g)', marks=5, qpages=[16],
     title='Coupled pendulums: is t independent of the release angle?',
     text='''
## Measurements
1) Set up pendulums A and B as shown in Figure 3.2, with x equal to the value used in 3(d).
2) Fix a protractor at the point of suspension of A. Pull A towards you until the string makes an angle θ₀ with the vertical, measured with the protractor.
3) Release A from rest and start the stopwatch at the same time. Stop the stopwatch when A stops swinging for the first time. Record t.
4) Repeat step 3 two more times and calculate the average t.
5) Repeat steps 2 to 4 for 8 different release angles θ₀ (e.g. 5° to 40°).
6) Keep x, the tension in the common string (stand positions), the lengths of the pendulums and the masses of the bobs constant.
7) Take preliminary readings to choose a suitable range of θ₀ over which A stops clearly.
8) Video-record the motion with a timer in view to judge more precisely when A stops.
## How to show validity
9) Plot a graph of t against θ₀.
10) If t is independent of θ₀, the graph will be a horizontal straight line (gradient zero).
11) The relationship is valid if the gradient of the best-fit line is close to zero, i.e. all values of t agree within their uncertainty.
''',
     notes=[('mark', 'Two bullets: the measurements (θ₀ with a protractor, t with a stopwatch, repeats, 8 values) and how the results show independence (horizontal line).')])

# ---------------------------------------------------------------- ASRJC
plan('asrjc-q2c', school='asrjc', part='2(c)', marks=4, qpages=[9],
     title='Timing a pendulum with a magnet, a coil and a voltage sensor',
     diagram=dict(w=380, h=225, els=[
         ('rect', 120, 0, 10, 170, '#f3e6c4'), ('circle', 125, 10, 2), ('text', 135, 12, 'pivot (nail)', 8.5), ('text', 135, 90, 'wooden strip', 8.5),
         ('rect', 118, 170, 14, 22, '#fca5a5'), ('text', 112, 186, 'bar magnet at end B', 8.5, 'end'),
         ('rect', 96, 205, 58, 8), ('text', 92, 213, 'flat coil (fixed)', 8.5, 'end'),
         ('rect', 200, 196, 80, 26), ('text', 240, 213, 'voltage sensor', 8.5, 'middle'), ('dash', [(154, 209), (200, 209)]),
         ('rect', 300, 196, 70, 26), ('text', 335, 213, 'datalogger', 8.5, 'middle'), ('line', 280, 209, 300, 209),
         ('arrow', 95, 150, 155, 150, True), ('text', 90, 153, 'small swing', 8, 'end')]),
     text='''
## Procedure
1) Set up the apparatus as shown in the diagram, with the coil fixed directly below the lowest position of the magnet.
2) Connect the coil to the voltage sensor and datalogger. Set a high sampling rate (e.g. 500 Hz) and a recording time of at least 10 oscillations.
3) Displace end B by a small angle, release it and start recording.
4) Each time the magnet passes over the coil, an e.m.f. pulse is induced. There are two pulses per oscillation.
5) Read the time from the 1st pulse to the 21st pulse (10 oscillations) from the V–t graph. T = time / 10.
## Precautions
6) Take preliminary readings to adjust the coil distance and the sampling rate, so that each pulse is large and sharp.
7) Place the coil as close as possible to the magnet's path without touching it. Fix the coil with tape.
8) Time from the same point of each pulse (the zero crossing, when the magnet is directly above the coil).
9) Use small amplitudes, and keep other magnetic materials away from the coil. Repeat and take the average T.
''',
     notes=[('why', 'The changing flux linkage as the magnet passes induces an e.m.f. (Faraday’s law). Two passes per oscillation.')])

plan('asrjc-q3f', school='asrjc', part='3(f)', marks=6, qpages=[15],
     title='Minimum diameter of a container that is stable at θ = 30°',
     text='''
## Variables
Independent variable: diameter d of the container. Dependent variable: toppling angle θ.
## Procedure
1) Set up the apparatus as shown in Figure 3.3, with the container in front of the angle scale and the plastic ruler attached.
2) Measure the diameter d of the container using a vernier caliper at two perpendicular positions, and take the average.
3) Fill the container with soya sauce (or a liquid of the same density) to the same height h, measured with a ruler.
4) Gently push the top of the container as in Figure 3.4 until it falls over. Record the angle θ at which it falls.
5) Repeat step 4 two more times and calculate the average θ.
6) Repeat steps 2 to 5 for 8 containers of different diameter d.
## Control of variables
7) Keep the same container height, wall material and thickness, cap, liquid, fill height, and push point.
## Table of measurements
8) Columns: d / cm | θ₁ / ° | θ₂ / ° | θ₃ / ° | average θ / ° | tan θ
## Finding the minimum diameter
9) Plot a graph of θ against d (or tan θ against d, which is a straight line through the origin).
10) Draw the best-fit line and read off the value of d at θ = 30°. This is the minimum diameter: a container with a smaller d falls over at less than 30°.
## Precautions
11) Take preliminary readings to choose a range of d that gives θ both above and below 30°.
12) Push slowly and gently. View the scale at eye level (or video-record it) to avoid parallax error.
13) Place a stop strip at the base so the container pivots about its edge and does not slide.
''',
     notes=[('mark', 'Five bullets: procedure, control of variables, table with units, d at θ = 30° from the graph (interpolation), precautions.'),
            ('why', 'tan θ = (d/2) / (height of the centre of mass), so tan θ ∝ d for a fixed fill height.')])

# ---------------------------------------------------------------- VJC
plan('vjc-q2d', school='vjc', part='2(d)', marks=10, qpages=[7, 8, 9],
     title='Energy lost in a loading cycle: E = kA^α F^β',
     diagram=dict(w=360, h=340, els=[
         ('line', 20, 10, 20, 300), ('rect', 0, 300, 60, 8), ('line', 20, 30, 120, 30), ('rect', 112, 24, 12, 12),
         ('line', 120, 36, 120, 120), ('line', 124, 36, 124, 120), ('text', 132, 80, 'rubber band (diameter d, micrometer)', 8.5),
         ('line', 122, 120, 122, 140), ('rect', 108, 140, 28, 6), ('rect', 108, 147, 28, 6), ('rect', 108, 154, 28, 6), ('text', 142, 150, 'mass hanger + slotted masses (F = mg)', 8.5),
         ('rect', 170, 20, 6, 220, '#f3e6c4'), ('text', 182, 30, 'metre rule (L)', 8.5), ('line', 136, 120, 170, 120), ('text', 140, 115, 'set square', 8),
         ('rect', 80, 270, 90, 20), ('text', 125, 284, 'sand tray', 8.5, 'middle'), ('text', 0, 330, 'stand clamped to bench; goggles worn', 8.5)]),
     text='''
## Equipment
1) Retort stand, boss and clamp; mass hanger and slotted masses; metre rule and set square; micrometer screw gauge; sand tray; safety goggles.
## Procedure
2) Set up the apparatus as shown in the diagram.
3) Measure the diameter d of the rubber band at several points with the micrometer screw gauge, without squashing it. A = πd² / 4.
4) Hang the band from the clamp and record its unstretched length L₀ with the metre rule.
5) Apply the load by adding slotted masses one at a time up to the maximum load F (F = mg). Record the length L after each mass is added.
6) Remove the masses one at a time, recording L again after each one. Extension e = L − L₀.
7) Plot a graph of load against e for loading and unloading. E = area enclosed by the loop (trapezium rule in a spreadsheet).
8) Experiment 1: keep the maximum load F constant and repeat steps 3 to 7 for 8 bands of different A.
9) Experiment 2: keep A constant (same band thickness) and repeat steps 4 to 7 for 8 different maximum loads F.
## Control of variables
10) Use bands of the same material and unstretched length, the same loading steps and the same waiting time (e.g. 30 s) before each reading, at the same room temperature.
## Analysis
11) lg E = lg k + α lg A + β lg F.
12) Plot a graph of lg E against lg A (F constant). If the relationship is valid, the graph will be a straight line with gradient = α.
13) Plot a graph of lg E against lg F (A constant). If the relationship is valid, the graph will be a straight line with gradient = β.
## Precautions
14) Take preliminary readings to choose a range of loads that gives a large loop, without exceeding the breaking point of the band.
15) Read L at eye level with a set square to avoid parallax error. Repeat each cycle and average E.
16) Safety: wear goggles in case the band snaps; place a sand tray below the masses.
''',
     notes=[('mark', 'Ten marks: equipment, how the load is applied, how A, F and E are measured, control of variables, two log graphs, safety and accuracy.'),
            ('why', 'Taking logs turns E = kA^α F^β into straight lines; the gradients are the powers.')])

plan('vjc-q3h', school='vjc', part='3(h)(ii)', marks=3, qpages=[16],
     title='Checking which coil gives the greater B using a compass',
     diagram=dict(w=360, h=120, els=[
         ('rect', 30, 20, 100, 36), ('text', 80, 42, 'coil Y (or Z)', 8.5, 'middle'), ('line', 130, 38, 200, 38), ('circle', 222, 38, 16),
         ('line', 222, 38, 232, 28), ('text', 222, 68, 'compass on the axis', 8.5, 'middle'), ('arrow', 300, 70, 300, 10), ('text', 305, 40, 'N (Earth)', 8.5),
         ('wire', [(40, 56), (40, 90), (60, 90)]), ('rect', 60, 82, 50, 16), ('text', 85, 93, 'supply', 8, 'middle'), ('wire', [(110, 90), (120, 90), (120, 56)]),
         ('arrow', 140, 110, 200, 110, True), ('text', 170, 120, 'fixed distance', 8, 'middle')]),
     text='''
1) Set up the apparatus as shown in the diagram: coil axis pointing east–west (perpendicular to the Earth's field), compass on the axis at a fixed distance from one end.
2) Connect the voltage supply directly across coil Y and record the deflection θ(Y) of the compass needle.
3) Repeat with coil Z, with the compass at the same distance and the same supply voltage. Record θ(Z).
4) tan θ = B / B(Earth), so the larger deflection shows the larger B. The conclusion is confirmed if θ(Z) > θ(Y).
5) Keep magnetic materials away from the compass and tap it gently before reading.
''',
     notes=[('mark', 'Diagram + method: coil perpendicular to the Earth’s field, same distance and same supply for both coils, compare the deflections (tan θ = B/B(Earth)).')])

# ---------------------------------------------------------------- TJC
plan('tjc-q3i', school='tjc', part='3(i)(ii)', marks=4, qpages=[14],
     title='Checking which coil gives the greater B using a compass',
     diagram=dict(w=360, h=120, els=[
         ('rect', 30, 20, 100, 36), ('text', 80, 42, 'coil Y (or Z)', 8.5, 'middle'), ('line', 130, 38, 200, 38), ('circle', 222, 38, 16),
         ('line', 222, 38, 232, 28), ('text', 222, 68, 'compass on the axis', 8.5, 'middle'), ('arrow', 300, 70, 300, 10), ('text', 305, 40, 'N (Earth)', 8.5),
         ('wire', [(40, 56), (40, 90), (60, 90)]), ('rect', 60, 82, 50, 16), ('text', 85, 93, 'supply', 8, 'middle'), ('wire', [(110, 90), (120, 90), (120, 56)]),
         ('arrow', 140, 110, 200, 110, True), ('text', 170, 120, 'fixed distance', 8, 'middle')]),
     text='''
1) Set up the apparatus as shown in the diagram, with the axis of the coil pointing east–west, perpendicular to the Earth's magnetic field.
2) Place the compass on the axis of the coil at a fixed distance from one end. With no current, the needle points north.
3) Connect the voltage supply directly across coil Y and record the angle of deflection θ(Y) of the compass needle.
4) Replace coil Y with coil Z. Keep the compass at the same distance from the end and use the same supply voltage. Record θ(Z).
5) tan θ = B / B(Earth), so the coil that gives the larger deflection produces the larger B. The conclusion is confirmed if θ(Z) > θ(Y).
6) Keep other magnetic materials and current-carrying wires away from the compass. Tap the compass gently before reading.
''',
     notes=[('mark', '[4]: labelled diagram, coil orientation relative to the Earth’s field, the same distance and supply for both coils, comparing the deflections.')])

# ---------------------------------------------------------------- ACJC
plan('acjc-q3e', school='acjc', part='3(e)', marks=7, qpages=[15, 16],
     title='Hopper flow rate: f = kA^x d^y',
     diagram=dict(w=360, h=245, els=[
         ('line', 10, 0, 10, 230), ('rect', -20, 230, 70, 8), ('line', 10, 40, 80, 40), ('rect', 78, 34, 10, 12),
         ('line', 60, 50, 140, 50), ('line', 60, 50, 92, 130), ('line', 140, 50, 108, 130), ('line', 92, 130, 92, 160), ('line', 108, 130, 108, 160),
         ('arrow', 92, 168, 108, 168, True), ('text', 112, 172, 'stem diameter d (vernier)', 8.5), ('text', 145, 70, 'funnel/hopper with dry sieved sand (grain size A)', 8.5),
         ('rect', 70, 200, 60, 25), ('rect', 60, 225, 80, 8), ('text', 150, 225, 'container on top-pan balance', 8.5), ('text', 150, 200, 'stopwatch', 8.5)]),
     text='''
## Equipment
1) Funnels of the same material and cone angle but different stem diameters; sand sieved into different grain sizes; retort stand and clamp; top-pan balance; stopwatch; vernier caliper; travelling microscope.
## Procedure
2) Set up the apparatus as shown in the diagram.
3) Measure the internal diameter d of the stem using the inside jaws of a vernier caliper, at two perpendicular positions, and take the average.
4) Measure the grain size A: measure the diameters of 20 grains with a travelling microscope and take the average (or use the mean of the two sieve mesh sizes).
5) Measure 200 g of sand with the top-pan balance. Pour it into the funnel with the stem blocked by a finger.
6) Remove the finger and start the stopwatch at the same time. Stop it when the last grains leave the funnel. f = m / t.
7) Repeat steps 5 and 6 and calculate the average f.
8) Experiment 1: keep d constant and repeat for 8 different grain sizes A.
9) Experiment 2: keep A constant and repeat for 8 funnels of different stem diameter d.
## Control of variables
10) Keep the same mass of sand, the same type (density) of sand, dry sand, and the same funnel material and cone angle.
## Analysis
11) lg f = lg k + x lg A + y lg d.
12) Plot a graph of lg f against lg A (d constant). If the relationship is valid, the graph will be a straight line with gradient = x.
13) Plot a graph of lg f against lg d (A constant). If the relationship is valid, the graph will be a straight line with gradient = y.
14) k = f / (A^x d^y), calculated using one set of readings (or from a y-intercept).
## Precautions
15) Take preliminary readings to choose a mass of sand large enough that t is long, so the percentage uncertainty in t is small.
16) Dry the sand in an oven so that it does not clump. Tap the funnel gently if the sand stops flowing, and discard that trial.
17) Collect the sand in a container on the balance, so the mass can be checked. Wear a dust mask and goggles.
''',
     notes=[('mark', 'Seven marks: equipment, how A and d are measured, how f is found, two experiments varying one variable each, log graphs for x and y, k, controls, precautions.')])

# ---------------------------------------------------------------- DHS
plan('dhs-q1g', school='dhs', part='1(g)', marks=3, qpages=[6],
     title='Terminal velocity v and the weight W of a loaded cone',
     text='''
## Procedure
1) Set up the apparatus as shown in Fig. 1.3, but release the cone from a greater height (e.g. 2.0 m, using a tall stand) so that the loaded cone reaches terminal velocity.
2) Measure the mass m of the cone with n paperclips using a top-pan balance. W = mg.
3) Clamp two light gates, connected to a timer, a distance s = 1.000 m apart in the lower part of the fall. Measure s with a metre rule.
4) Release the cone from rest above the upper light gate and record the time t between the gates. v = s / t.
5) Check that terminal velocity is reached: the times for the upper half and lower half of s should be equal.
6) Repeat steps 4 and 5 two more times and calculate the average v.
7) Vary W by adding one paperclip at a time and repeat steps 2 to 6 for 8 different values of W.
## Analysis
8) Assume v = kWⁿ. Plot a graph of lg v against lg W. If the relationship is valid, the graph will be a straight line with gradient = n.
## Precautions
9) Take preliminary readings to find the drop height needed for terminal velocity and a suitable separation of the light gates.
10) Keep the same cone (diameter d constant). Tape the paperclips inside the tip so they do not move, and release with the axis vertical. Keep the room free of draughts.
11) Alternatively, video-record the fall beside a metre rule and use frame-by-frame analysis to find v.
12) Safety: use a stable stand or a ladder held by a partner, and keep clear of the falling cone.
''',
     notes=[('mark', 'Key idea: the loaded cone falls faster, so it needs a longer drop to reach terminal velocity and electronic timing (light gates or video) instead of a stopwatch.')])

plan('dhs-q3e', school='dhs', part='3(e)(i)', marks=5, qpages=[15, 16],
     title='Bifilar suspension: period and the position x of two masses',
     diagram=dict(w=400, h=285, els=[
         ('line', 0, 0, 0, 230), ('line', 360, 0, 360, 230), ('line', -20, 232, 380, 232), ('rect', -15, 226, 30, 6), ('rect', 345, 226, 30, 6),
         ('rect', 20, 20, 320, 6), ('line', 0, 23, 20, 23), ('line', 340, 23, 360, 23),
         ('line', 107, 26, 107, 140), ('line', 113, 26, 113, 140), ('line', 247, 26, 247, 140), ('line', 253, 26, 253, 140),
         ('rect', 60, 140, 240, 6), ('rect', 122, 128, 16, 12, '#c9d7f2'), ('rect', 222, 128, 16, 12, '#c9d7f2'),
         ('arrow', 110, 10, 250, 10, True), ('text', 180, 6, 'd (fixed, value from (c))', 8, 'middle'),
         ('arrow', 272, 26, 272, 140, True), ('text', 276, 85, 'l (larger loops, fixed)', 8),
         ('dash', [(180, 120), (180, 180)]), ('arrow', 180, 165, 230, 165, True), ('text', 205, 177, 'x', 9, 'middle'),
         ('arrow', 130, 165, 180, 165, True), ('text', 155, 177, 'x', 9, 'middle'),
         ('text', 130, 122, 'm', 8, 'middle'), ('text', 230, 122, 'm', 8, 'middle'),
         ('text', -20, 252, 'Masses m taped on the bottom rule at equal distances x either side of its centre.', 8),
         ('text', -20, 265, 'x measured with a metre rule from the centre mark to the centre of each mass.', 8),
         ('text', -20, 278, 'Stopwatch; fiducial marker on the bench below one end of the rule.', 8)]),
     text='''
## Procedure
1) Set up the apparatus as shown in Fig. 3.1, using the larger loops of string with d equal to the value used in (c).
2) Mark the centre of the bottom rule. Tape the two masses on the rule at the same distance x either side of the centre.
3) Measure x from the centre of the rule to the centre of each mass using a metre rule.
4) Move one end of the bottom rule towards you and the other end away by a small angle, and release it.
5) Measure the time t for 10 oscillations using a stopwatch. Repeat and calculate the average t. T = t / 10.
6) Repeat steps 2 to 5 for 8 different values of x (e.g. 3 cm to 22 cm), keeping the masses clear of the string loops.
## Control of variables
7) Keep d, l, the two masses and the size of the initial twist constant.
8) Keep the string loops vertical and the same distance from the centre. Check that l is unchanged after moving the masses.
## Additional details
9) Take preliminary readings to choose a suitable range of x and number of oscillations.
10) Place the masses symmetrically so that the rule stays horizontal. Use a fiducial marker below one end of the rule to count the oscillations.
11) Calculate T² and x², and plot a graph of T² against x² (part (iv)).
''',
     notes=[('mark', 'Five marks: labelled diagram, x defined and measured, how T is found, what is kept constant (d, l, m), and accuracy details.')])

ORDER = ['hci-q2c', 'hci-q3g', 'ejc-q3e', 'njc-q2c', 'njc-q3i', 'nyjc-q1f', 'sajc-q3g', 'asrjc-q2c', 'asrjc-q3f',
         'vjc-q2d', 'vjc-q3h', 'tjc-q3i', 'acjc-q3e', 'dhs-q1g', 'dhs-q3e']


def place(P, key, areas, diagram=None, notes=(), size=8.4, q=None):
    """Lay plan `key` onto paper P: diagram=(page, x, y[, scale]); notes=[(page, y), ...] for the plan's margin notes."""
    pl = PLANS[key]
    if diagram and pl.get('diagram'):
        P.diagram(diagram[0], diagram[1], diagram[2], pl['diagram']['els'], q=q, scale=diagram[3] if len(diagram) > 3 else 1)
    spare = P.flow(areas, pl['text'], size=size, q=q)
    for (pg, y), (kind, text) in zip(notes, pl.get('notes', [])):
        P.note(pg, y, text, kind)
    return spare
