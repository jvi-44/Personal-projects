GUIDE.chapters.push({
  n: 6,
  title: "Circular Motion",
  blurb: "Moving in a circle means accelerating towards the centre. Find which real forces supply that acceleration, whether the circle is flat, banked or vertical.",
  outcomes: [
    "use angular displacement, angular velocity and the relation $v = r\\omega$",
    "state that uniform circular motion requires a centripetal acceleration $v^2/r = r\\omega^2$ supplied by real forces",
    "analyse horizontal circles including turntables, banked surfaces and cones",
    "combine energy conservation with the radial equation for vertical circles",
    "include tangential acceleration in non-uniform circular motion"
  ],
  sections: [
    {
      id: "6.1",
      title: "Uniform Circular Motion in a Horizontal Plane",
      notes: H`
<p>For motion on a circle of radius $r$: angular velocity $\omega = \dfrac{d\theta}{dt} = \dfrac{2\pi}{T}$ and speed $v = r\omega$.</p>
<div class="eq"><div class="eq-label">Centripetal acceleration</div>$$a_c = \frac{v^2}{r} = r\omega^2\quad\text{towards the centre}\qquad F_\text{net, radial} = \frac{mv^2}{r}$$</div>
<ul><li>Identify which real forces (friction, tension, normal force, gravity) have a component towards the centre. That component <b>is</b> the centripetal force.</li>
<li><b>Turntables / flat bends:</b> static friction supplies $mv^2/r$. Slipping begins when $mv^2/r = \mu_s mg$, i.e. $a_c = \mu_s g$.</li>
<li><b>Cones and banked tracks (smooth):</b> the vertical component of $N$ balances $mg$, and the horizontal component provides $mv^2/r$.</li></ul>
[[EX]]
[[EX]]
<div class="note"><b>Racing line.</b> A larger radius allows a larger speed for the same friction: $v_\text{max} = \sqrt{\mu g r}$. On a bend of finite width, the best path is the <b>largest circle that fits</b> inside the road.</div>
[[EX]]`,
      lecture: [
        { h: "Describing circular motion", b: H`$$\omega = \frac{2\pi}{T}\qquad v = r\omega$$$$a_c = \frac{v^2}{r} = r\omega^2$$`, s: "In circular motion, angular velocity omega is two pi over the period, and the speed is r omega. Even at constant speed, the direction keeps changing, so there is an acceleration towards the centre of size v squared over r, or r omega squared." },
        { h: "Who supplies the centripetal force?", b: H`<ul><li>Not a new force: the net inward component of real forces</li><li>Turntable / flat bend: static friction, slips when $a_c = \mu_s g$</li><li>Smooth cone or bank: $N\cos(\cdot) = mg$, $N\sin(\cdot) = mv^2/r$</li></ul>`, s: "The key question is always: which real force points towards the centre? On a turntable or a flat road it's static friction, so slipping starts when the required acceleration reaches mu s g. On a smooth cone or banked track, the normal force is tilted. Its vertical component holds the body up, and its horizontal component provides the centripetal force." },
        { h: "Bigger radius, bigger speed", b: H`$$v_\text{max} = \sqrt{\mu g r}$$<p class="small">On a bend of finite width, take the largest circle that fits inside the road.</p>`, s: "With friction as the only centripetal force, the maximum speed is root of mu g r. A larger radius allows a faster speed, which is why racing drivers cut corners: they follow the largest circle that fits inside the road. Let's try the examples." }
      ],
      examples: [
        {
          ref: "2018 Q7", img: ["2018-Q7"], box: "s", ans: "E",
          intro: "SJPO 2018 question 7. A bug halfway out on a rotating turntable is just about to slip. The coefficient of static friction is a quarter. What is its acceleration?",
          steps: [
            { t: H`About to slip: static friction is at its maximum and supplies the centripetal force: $ma_c = \mu_sN = \mu_smg$.`, s: "On the point of slipping, static friction is at its maximum, mu s m g, and it supplies the whole centripetal force." },
            { t: H`$a_c = \mu_sg = \dfrac g4$. The radius doesn't matter. <b>Answer E</b>`, s: "So the acceleration is mu s g, which is g over 4. The position on the turntable is irrelevant. Answer E." }
          ]
        },
        {
          ref: "2024 Q1", img: ["2024-Q1"], box: "s", ans: "D",
          intro: "SJPO 2024 question 1. A particle circles horizontally inside a smooth inverted cone of half angle theta. Find the normal force.",
          steps: [
            { t: H`The wall makes angle $\theta$ with the vertical, so $N$ (perpendicular to the wall) makes angle $\theta$ with the <b>horizontal</b>.`, s: "The cone's wall is at angle theta to the vertical, so the normal force, perpendicular to the wall, is at angle theta above the horizontal." },
            { t: H`No vertical acceleration: $N\sin\theta = mg \Rightarrow N = \dfrac{mg}{\sin\theta}$. (The horizontal part $N\cos\theta$ supplies $mv^2/r$.) <b>Answer D</b>`, s: "There is no vertical acceleration, so the vertical component N sine theta balances m g. N equals m g over sine theta. The horizontal component provides the centripetal force. Answer D." }
          ]
        },
        {
          ref: "2024 Q18", img: ["2024-Q18"], box: "m", ans: "D",
          intro: "SJPO 2024 question 18. A car negotiates a sharp 90 degree bend in a road of width L. What is its maximum speed?",
          steps: [
            { t: H`Use the largest arc that fits: tangent to both <b>outer</b> edges and just touching the <b>inner</b> corner. Put the outer corner at the origin, so the arc's centre is at $(R,R)$ and the inner corner at $(L,L)$.`, s: "To go as fast as possible, the car follows the largest circular arc that fits. That arc touches both outer edges of the road and just grazes the inner corner. Put the outer corner at the origin. The arc's centre is then at R, R, and the inner corner is at L, L." },
            { t: H`Inner corner on the arc: $\sqrt2(R-L) = R \Rightarrow R = \dfrac{\sqrt2}{\sqrt2-1}L = (2+\sqrt2)L$.`, s: "The inner corner lies on the arc, so its distance from the centre, root two times R minus L, equals R. Solving gives R equals two plus root two, times L." },
            { t: H`$\dfrac{mv^2}{R} = \mu mg \Rightarrow v = \sqrt{(2+\sqrt2)\mu gL}$. <b>Answer D</b>`, s: "Friction supplies the centripetal force, so v squared equals mu g R, giving v equals root of two plus root two, times mu g L. Answer D." }
          ]
        }
      ]
    },
    {
      id: "6.2",
      title: "Vertical and Non-Uniform Circular Motion",
      notes: H`
<p>In a vertical circle the speed changes, so use <b>two</b> equations:</p>
<ol><li><b>Energy conservation</b> gives $v$ at any position.</li>
<li><b>The radial equation</b>: (net force towards the centre) $= \dfrac{mv^2}{r}$ gives the tension or normal force.</li></ol>
<div class="eq"><div class="eq-label">Pendulum at angle $\theta$ from the vertical</div>$$T - mg\cos\theta = \frac{mv^2}{L}$$</div>
<p>Tension is greatest at the lowest point, where the speed is greatest and gravity points straight away from the centre.</p>
<p><b>Sudden change of radius</b> (a string catching on a peg): the speed is unchanged at that instant, but $mv^2/r$ jumps because $r$ changed.</p>
[[EX]]
[[EX]]
<h4>Non-uniform circular motion</h4>
<p>If the speed changes, the acceleration has two perpendicular parts: tangential $a_t = r\alpha$ and centripetal $a_c = r\omega^2$, so $a = \sqrt{a_t^2 + a_c^2}$. For a turntable spun up from rest with constant $\alpha$, $\omega = \alpha t$.</p>`,
      lecture: [
        { h: "Two equations for vertical circles", b: H`<ol><li>Energy conservation → speed</li><li>Radial equation → tension / normal force</li></ol>$$T - mg\cos\theta = \frac{mv^2}{L}$$`, s: "In a vertical circle the speed changes as the body rises and falls, so we need two equations. Energy conservation gives the speed at any point. Then the radial equation gives the tension. Net force towards the centre equals m v squared over r. For a pendulum at angle theta from the vertical, that's T minus m g cos theta equals m v squared over L." },
        { h: "Peg problems", b: H`<ul><li>When the string catches a peg: speed unchanged instantaneously</li><li>Radius drops → $mv^2/r$ jumps → tension jumps</li></ul>`, s: "When a pendulum string catches on a peg, the speed cannot change instantly, because the tension is perpendicular to the motion. But the radius suddenly shrinks, so the required centripetal force, and therefore the tension, jumps up." },
        { h: "Changing speed", b: H`$$a_t = r\alpha\qquad a_c = r\omega^2\qquad a = \sqrt{a_t^2 + a_c^2}$$<p class="small">Spin-up from rest: $\omega = \alpha t$.</p>`, s: "If the angular speed is changing, there are two perpendicular parts to the acceleration. The tangential part is r alpha, and the centripetal part is r omega squared. The total acceleration combines them by Pythagoras. Let's do the examples." }
      ],
      examples: [
        {
          ref: "2022 Q10–11", img: ["2022-Q10", "2022-Q11"], box: "m", ans: "Q10 a, Q11 e",
          intro: "SJPO 2022 questions 10 and 11. A pendulum is released from the horizontal. Find the tension at angle theta from the vertical, and the tension the string must withstand.",
          steps: [
            { t: H`Energy: the bob has fallen $L\cos\theta$, so $\tfrac12mv^2 = mgL\cos\theta \Rightarrow \dfrac{mv^2}{L} = 2mg\cos\theta$.`, s: "Released from the horizontal, at angle theta from the vertical the bob has dropped L cos theta. So m v squared over L equals two m g cos theta." },
            { t: H`Radial: $T - mg\cos\theta = 2mg\cos\theta \Rightarrow T = 3mg\cos\theta$. <b>Q10 answer (a)</b>`, s: "The radial equation: T minus m g cos theta equals two m g cos theta. So T equals three m g cos theta. Answer a." },
            { t: H`Maximum at $\theta = 0$ (lowest point): $T_\text{max} = 3mg$. <b>Q11 answer (e)</b>`, s: "This is largest at the bottom, where theta is zero, giving three m g. Answer e." }
          ]
        },
        {
          ref: "2026 Q14", img: ["2026-Q14"], box: "s", ans: "(e)",
          intro: "SJPO 2026 question 14. At the lowest point the tension is 3 m g, and then the string catches a peg a quarter of the length above the bob. Find the new tension.",
          steps: [
            { t: H`Before: $T - mg = \dfrac{mv^2}{L} = 2mg$.`, s: "Just before, the radial equation gives m v squared over L equals 3 m g minus m g, which is 2 m g." },
            { t: H`After: same $v$, radius $L/4$, so $\dfrac{mv^2}{L/4} = 4(2mg) = 8mg$.`, s: "Just after, the speed is the same but the radius is a quarter, so the centripetal force needed is four times bigger: 8 m g." },
            { t: H`$T' = mg + 8mg = 9mg$. <b>Answer (e)</b>`, s: "So the new tension is m g plus 8 m g, which is 9 m g. Answer e." }
          ]
        }
      ]
    }
  ]
});
