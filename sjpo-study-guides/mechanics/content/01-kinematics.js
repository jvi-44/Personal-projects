GUIDE.chapters.push({
  n: 1,
  title: "Kinematics",
  blurb: "Describing motion without asking what causes it: vectors, graphs, the equations of uniform acceleration, relative velocity and projectiles.",
  outcomes: [
    "add, subtract and resolve vectors, and use the dot and cross products of unit vectors",
    "state how uncertainties in measurements decide whether two readings can be the same quantity",
    "interpret displacement–time and velocity–time graphs using gradients and areas",
    "derive and apply the equations of motion for constant acceleration, including reaction-time problems",
    "solve relative-velocity problems by changing reference frame",
    "analyse projectile motion by treating horizontal and vertical motion independently"
  ],
  sections: [
    {
      id: "1.1",
      title: "Vectors and Measurement",
      notes: H`
<p>A <b>scalar</b> has magnitude only (mass, energy, speed). A <b>vector</b> has magnitude and direction (displacement, velocity, force). In Cartesian form we write $\vec{A} = A_x\hat{\imath} + A_y\hat{\jmath} + A_z\hat{k}$ with magnitude $|\vec A| = \sqrt{A_x^2+A_y^2+A_z^2}$.</p>
<p>A <b>unit vector</b> $\hat{A} = \vec{A}/|\vec{A}|$ has magnitude exactly 1. Note that $\hat\imath+\hat\jmath$ is <i>not</i> a unit vector: its magnitude is $\sqrt2$.</p>
<h4>Dot and cross products</h4>
<div class="eq"><div class="eq-label">Key results</div>
$$\vec A\cdot\vec B = AB\cos\theta \quad(\text{a scalar}),\qquad |\vec A\times\vec B| = AB\sin\theta\quad(\text{a vector, right-hand rule})$$
$$\hat\imath\cdot\hat\imath = 1,\quad \hat\imath\cdot\hat\jmath = 0,\qquad \hat\imath\times\hat\jmath=\hat k,\quad \hat\jmath\times\hat k=\hat\imath,\quad \hat k\times\hat\imath=\hat\jmath,\quad \hat\imath\times\hat\imath = \vec 0$$
</div>
<p>Reversing the order of a cross product flips its sign: $\hat\jmath\times\hat\imath = -\hat k$. Cross products appear throughout mechanics: torque $\vec\tau = \vec r\times\vec F$ and angular momentum $\vec L = \vec r\times\vec p$ (Chapter 8).</p>
[[EX]]
<h4>Uncertainty</h4>
<p>A reading $x \pm \Delta x$ means the true value lies somewhere in $[x-\Delta x,\ x+\Delta x]$. Two readings <i>could</i> describe the same object if their ranges overlap. For quantities combined by multiplication or division, fractional uncertainties add: if $Q = A^aB^b$ then $\dfrac{\Delta Q}{Q} = |a|\dfrac{\Delta A}{A} + |b|\dfrac{\Delta B}{B}$.</p>
[[EX]]`,
      lecture: [
        { h: "Scalars, vectors and unit vectors", b: H`<ul><li>Scalar: magnitude only. Vector: magnitude <i>and</i> direction.</li><li>$\vec A = A_x\hat\imath + A_y\hat\jmath + A_z\hat k$, $\;|\vec A| = \sqrt{A_x^2+A_y^2+A_z^2}$</li><li>Unit vector: $\hat A = \vec A/|\vec A|$, magnitude exactly 1</li></ul>`, s: "Welcome to mechanics. We start with the language of the whole topic: vectors. A scalar has only a size, like mass or energy. A vector has a size and a direction, like displacement, velocity or force. In component form we write a vector as a sum of multiples of the unit vectors i hat, j hat and k hat, and its magnitude comes from Pythagoras. A unit vector is any vector of magnitude exactly one. So be careful: i hat plus j hat is not a unit vector, because its length is root two." },
        { h: "Dot product", b: H`$$\vec A\cdot\vec B = AB\cos\theta$$<ul><li>Result is a <b>scalar</b></li><li>$\hat\imath\cdot\hat\imath = 1$, $\hat\imath\cdot\hat\jmath = 0$</li><li>Zero when the vectors are perpendicular</li></ul>`, s: "The dot product of two vectors gives a scalar, equal to the product of their magnitudes times the cosine of the angle between them. For unit vectors, i dot i is one, and i dot j is zero because they are perpendicular. In mechanics, work done is a dot product of force and displacement, which is why only the component of force along the motion does work." },
        { h: "Cross product", b: H`$$|\vec A\times\vec B| = AB\sin\theta$$<ul><li>Result is a <b>vector</b> perpendicular to both (right-hand rule)</li><li>$\hat\imath\times\hat\jmath = \hat k,\ \hat\jmath\times\hat k = \hat\imath,\ \hat k\times\hat\imath = \hat\jmath$</li><li>$\hat\imath\times\hat\imath = \vec 0$; order matters: $\hat\jmath\times\hat\imath = -\hat k$</li></ul>`, s: "The cross product gives a vector perpendicular to both of the originals, with magnitude A B sine theta, and direction given by the right-hand rule. Remember the cycle: i cross j is k, j cross k is i, and k cross i is j. Any vector crossed with itself is the zero vector, and swapping the order flips the sign. We will meet cross products again for torque and angular momentum." },
        { h: "Uncertainty and overlapping ranges", b: H`<ul><li>$x\pm\Delta x$: true value lies in $[x-\Delta x,\,x+\Delta x]$</li><li>Two readings may be the same quantity if their ranges <b>overlap</b></li><li>Products and quotients: fractional uncertainties add</li></ul>$$\frac{\Delta Q}{Q} = |a|\frac{\Delta A}{A}+|b|\frac{\Delta B}{B}\quad\text{for }Q=A^aB^b$$`, s: "Finally, a word on measurement. A reading written as x plus or minus delta x tells us the true value lies anywhere in that interval. If two readings have overlapping intervals, they could be measurements of the same thing. When quantities are multiplied or divided, the fractional uncertainties add, each weighted by the power it is raised to. That's it for vectors and measurement. Now try the examples in your notes before watching the worked solutions." }
      ],
      examples: [
        {
          ref: "2026 Q1", img: ["2026-Q1"], box: "s", ans: "(e)",
          intro: "Example one, from SJPO 2026 question 1. We are asked which of five expressions built from i, j and k hat is a unit vector.",
          steps: [
            { t: H`(a) $|\hat\imath+\hat\jmath| = \sqrt{1^2+1^2} = \sqrt2 \neq 1$. Not a unit vector.`, s: "Option a: i plus j has magnitude root two, so it is not a unit vector." },
            { t: H`(b) $\hat\imath\cdot\hat\imath = 1$ is a <b>scalar</b>, not a vector.`, s: "Option b is a dot product, which gives the scalar one. A scalar is not a vector at all." },
            { t: H`(c) $\hat\imath\times\hat\imath = \vec 0$. (d) $(\hat\imath\times\hat\jmath)\times\hat k = \hat k\times\hat k = \vec 0$.`, s: "Options c and d both reduce to a vector crossed with itself, which is the zero vector." },
            { t: H`(e) $(\hat\imath\times\hat\jmath)\times\hat\imath = \hat k\times\hat\imath = \hat\jmath$, which has magnitude 1. <b>Answer (e)</b>`, s: "Option e: i cross j is k, and k cross i is j. j hat is a unit vector, so the answer is e." }
          ]
        },
        {
          ref: "2018 Q50", img: ["2018-Q50"], box: "s", ans: "E",
          intro: "Example two, SJPO 2018 question 50. A gold bar measured 0.998 kilograms, with an uncertainty of five grams. Which of three bars, measured the next day, could be the original?",
          steps: [
            { t: H`Original bar: true mass in $[0.993,\ 1.003]$ kg.`, s: "The first reading tells us the true mass lies between 0.993 and 1.003 kilograms." },
            { t: H`Bar a: $[0.986,\ 0.996]$; bar b: $[0.997,\ 1.007]$; bar c: $[1.000,\ 1.010]$ kg.`, s: "Each new reading has the same plus or minus five grams. Bar a could be 0.986 to 0.996, bar b 0.997 to 1.007, and bar c 1.000 to 1.010 kilograms." },
            { t: H`Every range overlaps $[0.993,\ 1.003]$, so any of them could be the original bar. <b>Answer E</b>`, s: "Every one of these ranges overlaps the original range, so we cannot rule any of them out. The answer is E, any of them." }
          ]
        }
      ]
    },
    {
      id: "1.2",
      title: "Motion in a Straight Line",
      notes: H`
<p>For motion along a line we use <b>displacement</b> $s$, <b>velocity</b> $v = \dfrac{ds}{dt}$ and <b>acceleration</b> $a = \dfrac{dv}{dt}$. Speed is the magnitude of velocity; distance is the total path length.</p>
<h4>Reading motion graphs</h4>
<table class="tbl"><tr><th>Graph</th><th>Gradient gives</th><th>Area under graph gives</th></tr>
<tr><td>$s$–$t$</td><td>velocity $v$</td><td>(not used)</td></tr>
<tr><td>$v$–$t$</td><td>acceleration $a$</td><td>displacement $s$</td></tr>
<tr><td>$a$–$t$</td><td>(rate of change of $a$)</td><td>change in velocity $\Delta v$</td></tr></table>
<p>On an $s$–$t$ graph, constant positive acceleration from rest shows up as a curve that gets steeper (concave up). Constant velocity is a straight line.</p>
[[EX]]
<h4>Equations of uniformly accelerated motion</h4>
<p>If $a$ is <b>constant</b>, with initial velocity $u$ and final velocity $v$ after time $t$:</p>
<div class="eq"><div class="eq-label">Equations of motion (constant $a$ only)</div>
$$v = u + at \qquad s = ut + \tfrac12at^2 \qquad s = \tfrac12(u+v)t \qquad v^2 = u^2 + 2as$$
</div>
<p>Before using them, check your units match. Convert km h$^{-1}$ to m s$^{-1}$ by dividing by 3.6, or keep everything in km and hours.</p>
[[EX]]
[[EX]]
<div class="note"><b>SJPO tip.</b> A "midpoint" question is asking about half the <i>distance</i>, not half the <i>time</i>. At half the time the speed is the arithmetic mean $\tfrac12(u+v)$. At half the distance, use $v^2=u^2+2as$ twice, which gives the root-mean-square $\sqrt{\tfrac12(u^2+v^2)}$.</div>
[[EX]]
<h4>Reaction time and stopping distance</h4>
<p>During the reaction time $t_r$ a driver keeps moving at constant speed. Only then does braking begin:</p>
$$s_\text{stop} = u\,t_r + \frac{u^2}{2|a|}$$
<p>Questions about whether a driver should brake or carry on usually compare $s_\text{stop}$ with the distance to the line. They also compare the distance covered at constant speed with the time available.</p>
[[EX]]`,
      lecture: [
        { h: "Describing 1-D motion", b: H`<ul><li>Displacement $s$ (vector) vs distance (scalar)</li><li>Velocity $v = ds/dt$, acceleration $a = dv/dt$</li></ul><table class="tbl"><tr><th>Graph</th><th>Gradient</th><th>Area</th></tr><tr><td>$s$–$t$</td><td>$v$</td><td>–</td></tr><tr><td>$v$–$t$</td><td>$a$</td><td>$s$</td></tr><tr><td>$a$–$t$</td><td>–</td><td>$\Delta v$</td></tr></table>`, s: "In one dimension we describe motion with displacement, velocity and acceleration. Velocity is the rate of change of displacement, and acceleration is the rate of change of velocity. The single most useful skill here is reading graphs. The gradient of a displacement time graph is velocity. The gradient of a velocity time graph is acceleration, and the area under it is displacement. The area under an acceleration time graph is the change in velocity." },
        { h: "Shapes to recognise", b: H`<ul><li>Constant velocity → straight line on $s$–$t$</li><li>Speeding up from rest → curve getting steeper on $s$–$t$</li><li>Constant acceleration → straight line on $v$–$t$</li></ul>`, s: "Learn to recognise shapes. Constant velocity is a straight sloping line on a displacement time graph. Speeding up from rest makes the displacement time curve bend upwards, getting steeper. Constant acceleration is a straight line on the velocity time graph." },
        { h: "The equations of motion", b: H`$$v = u + at\qquad s = ut+\tfrac12at^2$$$$s=\tfrac12(u+v)t\qquad v^2=u^2+2as$$<p class="small">Valid only when $a$ is constant. Check your units first.</p>`, s: "When acceleration is constant we have four equations of motion: v equals u plus a t, s equals u t plus a half a t squared, s equals the average velocity times t, and v squared equals u squared plus two a s. Each one leaves out one of the variables, so pick the equation that leaves out the quantity you neither know nor need. And always check units: if speeds are in kilometres per hour, either convert to metres per second by dividing by 3.6, or work consistently in kilometres and hours." },
        { h: "Midpoint in distance vs time", b: H`<ul><li>Half the <b>time</b>: $v = \tfrac12(u+v)$</li><li>Half the <b>distance</b>: $v_m^2 - u^2 = v^2 - v_m^2$</li></ul>$$v_m = \sqrt{\tfrac12(u^2+v^2)}$$`, s: "A classic Olympiad trap: the velocity at the midpoint of the path. At half the time, the velocity is the simple average of u and v. But at half the distance, apply v squared equals u squared plus two a s to each half. The two halves have equal two a s, so the midpoint velocity squared is the average of u squared and v squared. It is the root mean square, not the mean." },
        { h: "Reaction time and stopping", b: H`$$s_\text{stop} = u\,t_r + \frac{u^2}{2|a|}$$<ul><li>Reaction time: constant speed, no braking yet</li><li>Compare stopping distance with distance available</li><li>Compare distance at constant speed with time available</li></ul>`, s: "Finally, stopping problems. During the reaction time, the car keeps moving at its original speed. Only then does braking begin. So the stopping distance is u times the reaction time, plus u squared over two times the deceleration. In yellow light problems you compare this with the distance to the junction, and you compare how far the car gets at constant speed within the yellow light time. Pause here and try the examples." }
      ],
      examples: [
        {
          ref: "2018 Q10", img: ["2018-Q10"], box: "s", ans: "E",
          intro: "SJPO 2018 question 10. An object starts from rest, accelerates, then moves at constant velocity. Which position time graph fits?",
          steps: [
            { t: H`Gradient of an $s$–$t$ graph = velocity. Starting from rest means the gradient is zero at $t=0$.`, s: "The gradient of a position time graph is the velocity. Starting from rest means the graph starts flat." },
            { t: H`Positive acceleration: the gradient increases, so the curve bends upward. Then constant velocity: a straight line with constant positive gradient.`, s: "During the positive acceleration the gradient increases, so the curve bends upward. After that the velocity is constant, so the graph becomes a straight line." },
            { t: H`Only graph E is flat at the start, curves upward, then becomes straight. <b>Answer E</b>`, s: "Only graph E starts flat, curves upward, and then straightens out. The answer is E." }
          ]
        },
        {
          ref: "2018 Q13", img: ["2018-Q13"], box: "s", ans: "A",
          intro: "SJPO 2018 question 13. A car at 70 kilometres per hour accelerates at 6000 kilometres per hour squared. How long until it reaches 120 kilometres per hour?",
          steps: [
            { t: H`Keep units in km and h: $v = u + at \Rightarrow 120 = 70 + 6000\,t$`, s: "The units are all in kilometres and hours, so stay in those units. Use v equals u plus a t: 120 equals 70 plus 6000 t." },
            { t: H`$t = \dfrac{50}{6000}\ \text{h} = \dfrac{1}{120}\ \text{h} = 30\ \text{s}$. <b>Answer A</b>`, s: "So t is 50 over 6000 hours, which is one hundred and twentieth of an hour, or 30 seconds. The answer is A." }
          ]
        },
        {
          ref: "2018 Q16–17", img: ["2018-S16", "2018-Q16", "2018-Q17"], box: "m", ans: "Q16 E, Q17 C",
          intro: "SJPO 2018 questions 16 and 17. A velocity time graph rises from zero to 6 metres per second at 30 seconds, then falls back to zero at 48 seconds. Find the acceleration between 30 and 48 seconds, and the total displacement.",
          steps: [
            { t: H`Q16: $a = \dfrac{\Delta v}{\Delta t} = \dfrac{0-6}{48-30} = -0.33\ \text{m s}^{-2}$. <b>Answer E</b>`, s: "Acceleration is the gradient. From 30 to 48 seconds the velocity drops from 6 to 0, so a is minus 6 over 18, which is minus 0.33 metres per second squared. Answer E." },
            { t: H`Q17: displacement = area under the graph $= \tfrac12(48)(6) = 144\ \text{m}$. <b>Answer C</b>`, s: "Displacement is the area under the graph, which is a triangle of base 48 and height 6. Half of 48 times 6 is 144 metres. Answer C." }
          ]
        },
        {
          ref: "2024 Q3", img: ["2024-Q3"], box: "m", ans: "E",
          intro: "SJPO 2024 question 3. A particle with constant acceleration goes from velocity u to velocity v. What is its velocity at the midpoint of its path?",
          steps: [
            { t: H`Let the total length be $2s$ and the midpoint velocity $v_m$. Apply $v^2=u^2+2as$ to each half:`, s: "Call the total path length 2 s, and the midpoint velocity v m. Apply v squared equals u squared plus two a s to each half of the path." },
            { t: H`$$v_m^2 - u^2 = 2as \qquad v^2 - v_m^2 = 2as$$`, s: "For the first half, v m squared minus u squared equals two a s. For the second half, v squared minus v m squared equals the same two a s." },
            { t: H`Equating: $2v_m^2 = u^2+v^2 \Rightarrow v_m = \sqrt{\tfrac12(u^2+v^2)}$. <b>Answer E</b>`, s: "Set them equal: two v m squared equals u squared plus v squared. So v m is the square root of half of u squared plus v squared. The answer is E. Option B, the simple average, would be the velocity at half the time, not half the distance." }
          ]
        },
        {
          ref: "2022 Q1–3", img: ["2022-S1", "2022-Q1", "2022-Q2", "2022-Q3"], box: "l", ans: "Q1 a, Q2 d, Q3 d",
          intro: "SJPO 2022 questions 1 to 3. A driver moving at 14 metres per second sees the light turn yellow. Reaction time is 1 second and the maximum deceleration is 3 metres per second squared. Can he either stop before the junction, or clear it at the speed limit, before the light turns red?",
          steps: [
            { t: H`Stopping distance: $s_\text{stop} = (14)(1) + \dfrac{14^2}{2(3)} = 14 + 32.7 = 46.7\ \text{m}$.`, s: "First, the stopping distance. During the one second reaction time he travels 14 metres. Braking then takes 14 squared over two times three, which is 32.7 metres. In total, 46.7 metres." },
            { t: H`Driving on at 14 m s$^{-1}$ for the yellow time $T$ covers $14T$.`, s: "If instead he keeps driving at 14 metres per second, in a yellow time T he covers 14 T metres." },
            { t: H`Q1 (50 m, 3 s): $14\times3 = 42 < 50$, so he cannot clear it. But $46.7 < 50$, so he can stop. <b>Answer (a)</b>`, s: "Question 1: 50 metres and 3 seconds. Driving on he covers only 42 metres, not enough. But he can stop in 46.7 metres, which is less than 50. So only braking works. Answer a." },
            { t: H`Q2 (40 m, 2 s): $14\times2 = 28 < 40$ and $46.7 > 40$. Neither works. <b>Answer (d)</b>`, s: "Question 2: 40 metres and 2 seconds. Driving on covers only 28 metres, and he needs 46.7 metres to stop. Neither works, so answer d." },
            { t: H`Q3: there must be no distance $d$ at which both options fail. Braking works for $d \ge 46.7$ m and driving on works for $d \le 14T$. For no gap we need $14T \ge 46.7$, so $T \ge 3.33\ \text{s}$. <b>Answer (d)</b>`, s: "Question 3 asks for the minimum yellow time so that, wherever the driver is, one option always works. Braking works if he is at least 46.7 metres away. Driving on works if he is within 14 T metres. To leave no gap between these, 14 T must be at least 46.7, so T is at least 3.33 seconds. Answer d." }
          ],
          note: H`The published answer key gives 5.67 s, the total time taken to stop. That is not what Q3 asks. The minimum yellow time is set by the gap between the two strategies, which gives 3.33 s.`
        }
      ]
    },
    {
      id: "1.3",
      title: "Relative Motion",
      notes: H`
<p>Velocity is always measured relative to some observer. If $\vec v_{AG}$ is the velocity of A relative to the ground and $\vec v_{BG}$ that of B, then the velocity of A <b>as seen by B</b> is</p>
<div class="eq"><div class="eq-label">Relative velocity</div>$$\vec v_{AB} = \vec v_{AG} - \vec v_{BG}\qquad\text{equivalently}\qquad \vec v_{AG} = \vec v_{AB} + \vec v_{BG}$$</div>
<p>Strategy: decide on a ground frame first and work out everyone's ground velocity, then subtract. A stationary object (a tree) seen to move at speed $v$ tells you the observer's own ground speed is $v$.</p>
[[EX]]
<p>For two bodies moving at the <i>same</i> speed in the same direction, their separation stays constant. The separation changes only when their velocity components differ. To find a maximum or minimum separation, look for the moment when the relative velocity has no component along the line joining them.</p>
[[EX]]`,
      lecture: [
        { h: "Velocity depends on the observer", b: H`$$\vec v_{AB} = \vec v_{AG} - \vec v_{BG}$$<ul><li>$\vec v_{AB}$: velocity of A as seen by B</li><li>Find every ground velocity first, then subtract</li></ul>`, s: "Every velocity is measured relative to an observer. The velocity of A as seen by B is A's ground velocity minus B's ground velocity. The reliable method is to pick the ground frame, find each object's velocity in it, and then subtract. If you see a stationary tree moving past at speed v, that tells you your own ground speed is v." },
        { h: "Separation of two movers", b: H`<ul><li>Same velocity → separation constant</li><li>Separation is extreme when relative velocity ⟂ line joining them, or when it changes sign</li></ul>`, s: "When two bodies move with the same velocity, their separation does not change. Separation only grows or shrinks when the velocities differ. So the maximum or minimum separation happens at the moment the separation stops increasing, or when the relative velocity has no component along the line joining them. Try the examples now." }
      ],
      examples: [
        {
          ref: "2024 Q2", img: ["2024-Q2"], box: "s", ans: "B",
          intro: "SJPO 2024 question 2. Chris on a northbound train sees a southbound train approaching at speed u, and a tree moving away at speed v. How fast does a passenger on the southbound train see the tree moving?",
          steps: [
            { t: H`The tree is stationary, so the northbound train's ground speed is $v$ (north).`, s: "The tree is fixed to the ground. Chris sees it moving at v, so Chris's train moves north at v relative to the ground." },
            { t: H`Relative speed of the trains is $u$: $\;v_S + v = u \Rightarrow v_S = u - v$ (south).`, s: "The two trains approach each other at relative speed u. The southbound train's ground speed plus v equals u, so the southbound train moves at u minus v." },
            { t: H`A passenger on the southbound train sees the tree move at $u - v$. <b>Answer B</b>`, s: "A passenger on the southbound train therefore sees the tree moving at u minus v. The answer is B." }
          ]
        },
        {
          ref: "2026 Q3", img: ["2026-Q3"], box: "m", ans: "(c)",
          intro: "SJPO 2026 question 3. Two runners start at the same corner of an a by b rectangle and run, at equal speeds, around opposite sides towards the far corner. What is their maximum separation?",
          steps: [
            { t: H`Phase 1: runner $a$ goes down the short side, runner $b$ goes along the long side. They move perpendicular to each other, so their separation grows.`, s: "First, one runner runs down the short side a while the other runs along the long side b. Moving at right angles, their separation keeps growing." },
            { t: H`Phase 2: after time $a/v$ both runners move horizontally at the same speed, so their separation stays constant.`, s: "Once runner a turns the corner, both run horizontally at the same speed. Their separation stays fixed." },
            { t: H`Phase 3: runner $b$ turns downward and they close in. Maximum separation is at the start of phase 2: horizontal gap $a$ and vertical gap $a$.`, s: "Finally runner b turns down and they close in. So the maximum occurs during the middle phase. At that point runner b is a distance a ahead horizontally, and a distance a above." },
            { t: H`$d_\text{max} = \sqrt{a^2+a^2} = a\sqrt2$. <b>Answer (c)</b>`, s: "The separation is root of a squared plus a squared, which is a root two. Answer c." }
          ]
        }
      ]
    },
    {
      id: "1.4",
      title: "Projectile Motion",
      notes: H`
<p>Near Earth's surface, with air resistance neglected, a projectile has constant acceleration $\vec g$ downward. Horizontal and vertical motions are <b>independent</b>:</p>
<div class="eq"><div class="eq-label">Projectile launched at speed $u$, angle $\theta$ above horizontal</div>
$$x = (u\cos\theta)\,t\qquad y = (u\sin\theta)\,t - \tfrac12gt^2\qquad v_x = u\cos\theta\ (\text{constant}),\quad v_y = u\sin\theta - gt$$
$$\text{Range on level ground } R = \frac{u^2\sin2\theta}{g}\qquad \text{Max height } H = \frac{u^2\sin^2\theta}{2g}$$
</div>
<ul><li>Speed is <i>minimum</i> at the top of the flight, where $v_y = 0$.</li><li>Because $K = \tfrac12m(v_x^2+v_y^2)$, $\dfrac{dK}{dt} = -mg\,v_y$. So $K$ has zero gradient exactly when the motion is horizontal.</li></ul>
[[EX]]
<h4>The free-fall frame</h4>
<p>In a frame falling freely with acceleration $\vec g$, gravity disappears and every projectile moves in a <b>straight line at constant velocity</b>. This makes "aiming" problems simple. An arrow aimed straight at a target travels along the line of sight in the falling frame, so in the ground frame it ends up a distance $\tfrac12gt^2$ below the target.</p>
[[EX]]
[[EX]]
<h4>Bouncing projectiles</h4>
<p>In an elastic bounce off a smooth surface, the velocity component along the surface is unchanged and the normal component is reversed. If a projectile hits a surface <i>perpendicularly</i>, it retraces its path exactly.</p>
[[EX]]`,
      lecture: [
        { h: "Two independent motions", b: H`<ul><li>Horizontal: $a_x = 0$, so $v_x = u\cos\theta$ is constant</li><li>Vertical: $a_y = -g$</li></ul>$$x = u\cos\theta\,t\qquad y = u\sin\theta\,t - \tfrac12gt^2$$`, s: "A projectile is just two independent motions glued together by time. Horizontally there is no force, so the horizontal velocity is constant. Vertically the acceleration is g downwards, so all the equations of motion apply. Time is the link between the two." },
        { h: "Useful results", b: H`$$R = \frac{u^2\sin2\theta}{g}\qquad H = \frac{u^2\sin^2\theta}{2g}$$<ul><li>Minimum speed at the top ($v_y=0$)</li><li>$dK/dt = -mg\,v_y$: zero exactly when moving horizontally</li></ul>`, s: "On level ground the range is u squared sine two theta over g, and the maximum height is u squared sine squared theta over two g. The speed is smallest at the top, where the vertical velocity is zero. A neat result: the rate of change of kinetic energy is minus m g times the vertical velocity. So a kinetic energy time graph has zero slope exactly when the projectile is moving horizontally." },
        { h: "The free-fall frame trick", b: H`<ul><li>In a frame falling with acceleration $g$, gravity vanishes</li><li>Every projectile moves in a straight line at constant velocity</li><li>Drop below the line of sight: $d = \tfrac12gt^2$</li></ul>`, s: "Here is a powerful Olympiad trick. Jump into a frame that is falling freely with acceleration g. In that frame gravity disappears, and every projectile travels in a straight line at constant speed. So if you aim directly at a target, in the falling frame you travel straight along the line of sight. Back in the ground frame you simply end up one half g t squared below it." },
        { h: "Bounces", b: H`<ul><li>Elastic, smooth surface: tangential component unchanged, normal component reversed</li><li>Hit a surface perpendicularly → retrace the path</li><li>On an incline: resolve $g$ along and perpendicular to the slope</li></ul>`, s: "For elastic bounces on smooth surfaces, keep the velocity component along the surface, and reverse the component perpendicular to it. If a projectile strikes a surface at right angles, it retraces its path exactly, which is the key to periodic bouncing problems. On an incline, resolve g along and perpendicular to the slope and treat each direction separately. Now try the examples." }
      ],
      examples: [
        {
          ref: "2022 Q6–7", img: ["2022-S6", "2022-Q6", "2022-Q7"], box: "m", ans: "Q6 c; Q7 $\\sqrt{2h/g}$",
          intro: "SJPO 2022 questions 6 and 7. A ball is launched from a cliff in one of five directions. Its kinetic energy time graph has zero gradient at t equals zero. Which direction was it launched in, and how long does it take to land?",
          steps: [
            { t: H`$K = \tfrac12m(v_x^2+v_y^2)$ with $v_x$ constant and $\dfrac{dv_y}{dt} = -g$. So $\dfrac{dK}{dt} = m v_y\dfrac{dv_y}{dt} = -mg\,v_y$.`, s: "The horizontal velocity is constant, so the kinetic energy only changes through v y. Differentiating gives d K by d t equals minus m g v y." },
            { t: H`$\dfrac{dK}{dt} = 0$ at $t=0$ means $v_y(0) = 0$: the launch is horizontal, direction 3. <b>Q6 answer (c)</b>`, s: "Zero gradient at t equals zero means the initial vertical velocity is zero. The launch is horizontal, direction 3. Answer c." },
            { t: H`Q7: horizontal launch, so vertically it is pure free fall: $h = \tfrac12gt^2 \Rightarrow t = \sqrt{2h/g}$.`, s: "For question 7, a horizontal launch means the vertical motion is a free fall from rest. h equals a half g t squared, so t is root of two h over g." },
            { t: H`Option (c) is printed as $\sqrt{2gh}$, which has units of speed, not time. The intended answer is (c), $\sqrt{2h/g}$, which is independent of $v_0$. <b>Q7: $t=\sqrt{2h/g}$</b>`, s: "Option c is printed as root two g h, which has units of speed, not time. It is almost certainly a typo for root two h over g. The key point is that the time does not depend on the launch speed." }
          ],
          note: H`Q7 has a misprint: none of the printed options is dimensionally correct. The answer key also identifies (c) as the intended option.`
        },
        {
          ref: "2024 Q11", img: ["2024-Q11"], box: "m", ans: "B",
          intro: "SJPO 2024 question 11. Paul aims an arrow directly at a target a distance s away, firing at speed u. By how much does the arrow miss?",
          steps: [
            { t: H`In the free-fall frame the arrow moves in a straight line at speed $u$ along the line of sight, reaching the target's line after $t = s/u$.`, s: "Use the free fall frame. There the arrow flies straight along the line of sight at constant speed u, covering distance s in time s over u." },
            { t: H`In the ground frame everything has also fallen $\tfrac12gt^2$: $\;d = \tfrac12g\left(\dfrac{s}{u}\right)^2 = \dfrac{gs^2}{2u^2}$. <b>Answer B</b>`, s: "Back in the ground frame, the arrow has dropped a half g t squared below the line of sight. That is g s squared over two u squared. Answer B." }
          ]
        },
        {
          ref: "2018 Q18", img: ["2018-Q18"], box: "l", ans: "C",
          intro: "SJPO 2018 question 18. A block slides down a smooth 30 degree roof, passing A at 2 metres per second. After dropping 5 metres it leaves the roof at B, then falls 10 metres to the ground. How far from the wall does it land?",
          steps: [
            { t: H`Energy from A to B: $\tfrac12mu^2 = \tfrac12m(2.0)^2 + mg(5) \Rightarrow u = \sqrt{4 + 98} = 10.1\ \text{m s}^{-1}$`, s: "The roof is smooth, so use conservation of energy from A to B. The block drops 5 metres, so u squared equals 4 plus 2 times 9.8 times 5, which is 102. So u is 10.1 metres per second." },
            { t: H`At B the velocity is $10.1$ m s$^{-1}$ at $30^\circ$ below horizontal: $u_x = 8.75$, $u_y = 5.05$ m s$^{-1}$ (down).`, s: "It leaves B at 10.1 metres per second, directed 30 degrees below horizontal. That gives a horizontal component of 8.75 and a downward component of 5.05 metres per second." },
            { t: H`Vertically (down +): $10 = 5.05t + 4.9t^2 \Rightarrow t = 1.00\ \text{s}$`, s: "Vertically, taking down as positive, 10 equals 5.05 t plus 4.9 t squared. Solving the quadratic gives t equals 1.00 second." },
            { t: H`$d = u_x t = 8.75 \times 1.00 = 8.78\ \text{m}$. <b>Answer C</b>`, s: "Horizontally, d equals 8.75 times 1.00, which is 8.78 metres. Answer C." }
          ]
        },
        {
          ref: "2026 Q13", img: ["2026-Q13"], box: "m", ans: "(e)",
          intro: "SJPO 2026 question 13. A particle is projected horizontally at speed u inside an inverted cone of half angle theta, and bounces back and forth between the walls forever. What is the period?",
          steps: [
            { t: H`To bounce back and forth indefinitely, the particle must retrace its path. So it must hit each wall <b>perpendicularly</b>.`, s: "For the motion to repeat forever symmetrically, the particle must retrace its own path. That only happens if it hits the wall at right angles." },
            { t: H`The wall makes angle $\theta$ with the vertical, so its normal makes angle $\theta$ below the horizontal. We need $\dfrac{v_y}{v_x} = \tan\theta \Rightarrow gt = u\tan\theta$.`, s: "The wall is at angle theta to the vertical, so its normal points theta below the horizontal. The velocity must point along that normal, so v y over v x equals tan theta. With v x equal to u, that means g t equals u tan theta." },
            { t: H`$t = \dfrac{u}{g}\tan\theta$. One period is: out to wall A, back to the start, out to wall B, back again, which is 4 such flights.`, s: "So each flight from the centre to a wall takes u over g tan theta. A full period goes to one wall, back, to the other wall, and back, which is four flights." },
            { t: H`$T = \dfrac{4u}{g}\tan\theta$. <b>Answer (e)</b>`, s: "The period is four u over g tan theta. Answer e." }
          ]
        }
      ]
    }
  ]
});
