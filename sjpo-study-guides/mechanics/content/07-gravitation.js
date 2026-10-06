GUIDE.chapters.push({
  n: 7,
  title: "Gravitation",
  blurb: "Newton's law of gravitation, circular orbits, and the energy bookkeeping that explains why a satellite speeds up as drag pulls it down.",
  outcomes: [
    "apply Newton's law of gravitation $F = GMm/r^2$ and the relation $g = GM/R^2$",
    "derive orbital speed and period for circular orbits, including geostationary orbits and Kepler's third law",
    "use gravitational potential energy $U = -GMm/r$ for large changes in separation",
    "show that for a circular orbit $E = -K = \\tfrac12U$, and explain how drag changes the orbit",
    "locate the point between two bodies where their gravitational fields cancel"
  ],
  sections: [
    {
      id: "7.1",
      title: "Gravitational Force and Circular Orbits",
      notes: H`
<div class="eq"><div class="eq-label">Newton's law of gravitation</div>$$F = \frac{GMm}{r^2}\qquad g = \frac{GM}{r^2}\ \text{(field strength)}\qquad g_\text{surface} = \frac{GM}{R^2}\ \Rightarrow\ GM = gR^2$$</div>
<p>The swap $GM = gR^2$ is very useful when $G$ or $M$ is not given.</p>
<h4>Circular orbits</h4>
<p>Gravity supplies the centripetal force:</p>
$$\frac{GMm}{r^2} = \frac{mv^2}{r} = mr\omega^2\quad\Rightarrow\quad v = \sqrt{\frac{GM}{r}},\qquad T^2 = \frac{4\pi^2}{GM}r^3$$
<p>The second result is <b>Kepler's third law</b>. It also holds for ellipses if $r$ is replaced by the semi-major axis $a$. A <b>geostationary</b> orbit has $T = 24$ h, lies above the equator, and moves in the same direction as Earth's rotation.</p>
[[EX]]
<h4>Energy of a circular orbit</h4>
$$K = \frac{GMm}{2r},\qquad U = -\frac{GMm}{r},\qquad E = K + U = -\frac{GMm}{2r} = -K$$
<p>Because $E = -K$, when drag <i>removes</i> energy, $E$ becomes more negative, $r$ decreases and $K$ <b>increases</b>. The satellite spirals inward and speeds up. This is the "satellite drag paradox".</p>
[[EX]]`,
      lecture: [
        { h: "Newton's law of gravitation", b: H`$$F = \frac{GMm}{r^2}\qquad g = \frac{GM}{r^2}$$$$GM = gR^2$$`, s: "Every pair of masses attracts with a force G M m over r squared, where r is the distance between their centres. The gravitational field strength is G M over r squared. At a planet's surface this is g, so G M equals g R squared. That substitution is useful whenever G or M isn't given." },
        { h: "Circular orbits", b: H`$$\frac{GMm}{r^2} = \frac{mv^2}{r}\ \Rightarrow\ v = \sqrt{\frac{GM}{r}}$$$$T^2 = \frac{4\pi^2}{GM}r^3$$`, s: "For a circular orbit, gravity provides the centripetal force. That gives orbital speed root of G M over r, so higher orbits are slower. Using v equals two pi r over T gives Kepler's third law: T squared is proportional to r cubed. For an ellipse, replace r by the semi major axis." },
        { h: "Geostationary orbits", b: H`<ul><li>$T = 24$ h</li><li>Above the equator, same sense as Earth's spin</li><li>$r = \left(\dfrac{GMT^2}{4\pi^2}\right)^{1/3} \approx 6.6\,R_E$</li></ul>`, s: "A geostationary satellite has a period of 24 hours, orbits above the equator, and moves in the same direction as Earth rotates, so it hovers over one spot. Its orbital radius comes from Kepler's third law, and is about 6.6 Earth radii from the centre." },
        { h: "Orbital energy", b: H`$$K = \frac{GMm}{2r}\quad U = -\frac{GMm}{r}\quad E = -\frac{GMm}{2r} = -K$$<p class="small">Drag removes energy → $r$ decreases → $K$ increases.</p>`, s: "For a circular orbit, kinetic energy is G M m over two r, potential energy is minus G M m over r, and total energy is minus G M m over two r, which is exactly minus the kinetic energy. So when drag takes energy away, the total energy becomes more negative, the radius shrinks, and the kinetic energy increases. Drag makes a satellite speed up. Let's see it in the examples." }
      ],
      examples: [
        {
          ref: "2018 Q8", img: ["2018-Q8"], box: "m", ans: "D",
          intro: "SJPO 2018 question 8. Roughly how many Earth radii above the surface is a geosynchronous orbit?",
          steps: [
            { t: H`$\dfrac{GMm}{r^2} = mr\omega^2$ with $\omega = \dfrac{2\pi}{24\times3600} = 7.27\times10^{-5}$ rad s$^{-1}$.`, s: "Gravity supplies the centripetal force. The angular velocity is two pi over one day, which is 7.27 times ten to the minus five radians per second." },
            { t: H`$r = \left(\dfrac{GM_E}{\omega^2}\right)^{1/3} = \left(\dfrac{(6.67\times10^{-11})(5.92\times10^{24})}{(7.27\times10^{-5})^2}\right)^{1/3} = 4.21\times10^7$ m`, s: "So r is the cube root of G M over omega squared, which is 4.21 times ten to the seven metres." },
            { t: H`Height $= \dfrac{r - R_E}{R_E} = \dfrac{4.21\times10^7 - 6.37\times10^6}{6.37\times10^6} = 5.6 \approx 6$ Earth radii. <b>Answer D</b>`, s: "The height above the surface is r minus R E, which is 5.6 Earth radii, closest to 6. Answer D. Note that the question asks for height above the surface, not distance from the centre." }
          ]
        },
        {
          ref: "2026 Q24", img: ["2026-Q24"], box: "s", ans: "(b)",
          intro: "SJPO 2026 question 24. A satellite's engine shuts down, and resistive forces act. How do its orbital radius and speed change?",
          steps: [
            { t: H`$E = K + U = \dfrac{GMm}{2r} - \dfrac{GMm}{r} = -\dfrac{GMm}{2r} = -K$.`, s: "The total energy is G M m over two r minus G M m over r, which is minus G M m over two r. That's exactly minus the kinetic energy." },
            { t: H`Resistive forces decrease $E$ (more negative), so $r$ decreases and $K = -E$ increases.`, s: "Resistive forces reduce the total energy, making it more negative. So the radius decreases, and since K equals minus E, the kinetic energy increases." },
            { t: H`Radius decreases and speed increases. <b>Answer (b)</b>`, s: "The radius decreases and the speed increases. Answer b." }
          ]
        }
      ]
    },
    {
      id: "7.2",
      title: "Gravitational Potential Energy",
      notes: H`
<p>For large changes in separation, $mg\Delta h$ is not accurate. Use</p>
<div class="eq"><div class="eq-label">Gravitational potential energy (zero at infinity)</div>$$U = -\frac{GMm}{r}\qquad \Delta U = GMm\left(\frac{1}{r_1} - \frac{1}{r_2}\right)\ \text{when moving from } r_1 \text{ to } r_2$$</div>
<ul><li>Two bodies released from rest move towards each other. Conserve both momentum (equal masses have equal speeds) and energy.</li>
<li>Two spheres "collide" when their centres are $R_1 + R_2$ apart, not when $r = 0$.</li></ul>
[[EX]]
<h4>Null point between two masses</h4>
<p>Between masses $M_1$ and $M_2$ a distance $d$ apart, the fields cancel at distance $x$ from $M_1$ where</p>
$$\frac{GM_1}{x^2} = \frac{GM_2}{(d-x)^2}\quad\Rightarrow\quad x = \frac{d}{1+\sqrt{M_2/M_1}}$$
<p>A mass released just beyond this point falls towards the farther body instead.</p>
[[EX]]`,
      lecture: [
        { h: "Potential energy far from the surface", b: H`$$U = -\frac{GMm}{r}$$$$\Delta U = GMm\left(\frac1{r_1} - \frac1{r_2}\right)$$<p class="small">Zero at infinity; always negative.</p>`, s: "When separations change a lot, m g h no longer works. Instead, gravitational potential energy is minus G M m over r, taking zero at infinity. It's always negative, and it gets more negative as bodies get closer." },
        { h: "Two bodies falling together", b: H`<ul><li>Momentum: equal masses → equal speeds</li><li>Energy: $\Delta K_\text{total} = -\Delta U$</li><li>Contact when centres are $R_1+R_2$ apart</li></ul>`, s: "When two bodies released from rest fall towards each other, use momentum and energy together. Momentum is zero throughout, so equal masses have equal speeds. Energy says the total kinetic energy gained equals the potential energy lost. And spheres touch when their centres are the sum of their radii apart, not at zero." },
        { h: "Null point", b: H`$$\frac{GM_1}{x^2} = \frac{GM_2}{(d-x)^2}$$$$x = \frac{d}{1+\sqrt{M_2/M_1}}$$`, s: "Between two masses, there's a point where their gravitational fields cancel. Setting the two field strengths equal and square rooting gives x equals d over one plus root of M 2 over M 1, measured from M 1. Past that point, an object is pulled towards the other body. Let's try the examples." }
      ],
      examples: [
        {
          ref: "2024 Q23", img: ["2024-Q23"], box: "m", ans: "B",
          intro: "SJPO 2024 question 23. Two identical Earths, each of radius R, start at rest 8 R apart and fall together. Find each one's speed at impact.",
          steps: [
            { t: H`Momentum is zero throughout, so both have equal speed $v$. They touch when the centres are $2R$ apart.`, s: "Total momentum is zero, so the two Earths always have equal speeds. They collide when their centres are two R apart." },
            { t: H`Energy: $-\dfrac{GM^2}{8R} = -\dfrac{GM^2}{2R} + 2\cdot\tfrac12Mv^2 \Rightarrow Mv^2 = \dfrac{3GM^2}{8R}$`, s: "Energy conservation: the initial potential energy, minus G M squared over 8 R, equals the final potential energy, minus G M squared over 2 R, plus the kinetic energy of both Earths. That gives M v squared equals three G M squared over 8 R." },
            { t: H`With $GM = gR^2$: $v = \sqrt{\dfrac{3GM}{8R}} = \sqrt{\dfrac38gR}$. <b>Answer B</b>`, s: "Using G M equals g R squared, v is root of three eighths g R. Answer B." }
          ]
        },
        {
          ref: "2026 Q23", img: ["2026-Q23"], box: "m", ans: "(c)",
          intro: "SJPO 2026 question 23. A mass is held above Earth with the Sun overhead. What is the minimum height for it to rise towards the Sun when released?",
          steps: [
            { t: H`The mass rises towards the Sun once the Sun's pull exceeds Earth's. Threshold at distance $r$ from Earth's centre: $\dfrac{GM_E}{r^2} = \dfrac{GM_S}{(d_{SE} - r)^2}$.`, s: "The mass moves towards the Sun once the Sun's pull beats Earth's. The threshold is where the two fields are equal, at distance r from Earth's centre." },
            { t: H`$r = \dfrac{d_{SE}}{1+\sqrt{M_S/M_E}} = \dfrac{1.50\times10^8}{1+\sqrt{3.33\times10^5}} = \dfrac{1.50\times10^8}{578} = 2.59\times10^5$ km`, s: "So r equals the Sun Earth distance divided by one plus root of the mass ratio. The mass ratio is 3.33 times ten to the five, whose root is about 577, so r is 2.59 times ten to the five kilometres." },
            { t: H`$h = r - R_E = 2.59\times10^5 - 6.37\times10^3 = 2.53\times10^5$ km. <b>Answer (c)</b>`, s: "The height above the surface is r minus Earth's radius, 2.53 times ten to the five kilometres. Answer c. Notice how close the null point is to Earth compared with the Sun, because the field falls off as one over r squared." }
          ]
        }
      ]
    }
  ]
});
