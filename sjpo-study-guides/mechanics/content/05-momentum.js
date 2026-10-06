GUIDE.chapters.push({
  n: 5,
  title: "Momentum and Collisions",
  blurb: "When forces are internal or brief, momentum is the quantity to track: impulse, collisions, restitution and the motion of the centre of mass.",
  outcomes: [
    "relate impulse to the area under a force–time graph and to the change in momentum",
    "apply conservation of linear momentum to collisions, explosions and throwing problems",
    "use the coefficient of restitution, and distinguish elastic from inelastic collisions",
    "combine momentum and energy conservation, including the common-velocity condition for maximum compression",
    "use the fact that the centre of mass of an isolated system moves at constant velocity"
  ],
  sections: [
    {
      id: "5.1",
      title: "Impulse and Momentum",
      notes: H`
<div class="def"><b>Linear momentum</b> $\vec p = m\vec v$. <b>Impulse</b> of a force $\vec J = \int\vec F\,dt$, which is the area under the $F$–$t$ graph.</div>
<div class="eq"><div class="eq-label">Impulse–momentum theorem</div>$$\vec J = \int \vec F\,dt = \Delta\vec p\qquad(\text{constant force: } J = F\,\Delta t)$$</div>
<p>For a non-uniform force given as a formula, integrate it. The integral hint SJPO provides is usually there to be used after a substitution such as $x = t/T$.</p>
[[EX]]
<p>When a force pushes a group of bodies together, the impulse goes into the momentum of the <i>whole group</i>. Each body then gets a share in proportion to its mass, since they share a common velocity.</p>
[[EX]]`,
      lecture: [
        { h: "Momentum and impulse", b: H`$$\vec p = m\vec v\qquad \vec J = \int\vec F\,dt = \Delta\vec p$$<ul><li>Impulse = area under the $F$–$t$ graph</li><li>Constant force: $J = F\Delta t$</li></ul>`, s: "Momentum is mass times velocity, a vector. The impulse of a force is the integral of force over time, the area under the force time graph. Newton's second law in its original form tells us impulse equals change in momentum. For a constant force, it's simply F times delta t." },
        { h: "Non-uniform forces", b: H`<ul><li>Integrate the given $F(t)$</li><li>Substitute, e.g. $x = t/T$, to match the hint</li><li>Sanity check units: $[J] = $ N s</li></ul>`, s: "If the force varies with time according to a formula, integrate it. Olympiad questions often give an integral as a hint. Make a substitution, like x equals t over T, so your integral matches the hint exactly. And always check that your answer has units of newton seconds." },
        { h: "Pushing a group", b: H`<ul><li>Impulse on the group = change in the group's total momentum</li><li>Common velocity → each body's share $\propto$ its mass</li></ul>`, s: "When a force pushes several bodies that move together, the impulse changes the total momentum of the group. Because they share one velocity, each body's momentum is proportional to its mass. Let's try the examples." }
      ],
      examples: [
        {
          ref: "2018 Q15", img: ["2018-Q15"], box: "m", ans: "D",
          intro: "SJPO 2018 question 15. A muscle force varies as F nought times t over T, times e to the minus t over T. With t nought over T equal to one, find the impulse from zero to t nought.",
          steps: [
            { t: H`$J = \displaystyle\int_0^{t_0}F_0\frac{t}{T}e^{-t/T}\,dt$. Let $x = t/T$, so $dt = T\,dx$ and the limits become $0 \to t_0/T = 1$.`, s: "The impulse is the integral of the force from zero to t nought. Substitute x equals t over T, so d t equals T d x, and the limits become zero to one." },
            { t: H`$J = F_0T\displaystyle\int_0^1 xe^{-x}dx = F_0T\left[1 - (1+1)e^{-1}\right] = F_0T\left(1 - \tfrac2e\right)$`, s: "Then J equals F nought T times the integral of x e to the minus x from zero to one. Using the hint with a equal to one, that's one minus two over e." },
            { t: H`Writing $T\!\left(1-\tfrac2e\right) = T\!\left(1-\tfrac1e\right) - t_0\!\left(\tfrac1e\right)$ (since $t_0 = T$) gives option D. <b>Answer D</b>`, s: "Since t nought equals T, we can split this as T times one minus one over e, minus t nought over e, which is exactly option D." }
          ],
          note: H`The official solution derives exactly the expression in option D but then prints "ANSWER: E". This looks like a typo: the impulse is determinate, and it equals option D.`
        },
        {
          ref: "2022 Q4–5", img: ["2022-S4", "2022-Q4", "2022-Q5"], box: "m", ans: "Q4 a, Q5 b",
          intro: "SJPO 2022 questions 4 and 5. Blocks A, 4 kilograms, and B, 20 kilograms, move together at 1 metre per second. A 36 newton force pushes A for 5 seconds. Find B's final momentum, and the net work done on A.",
          steps: [
            { t: H`Impulse on the system: $J = F\Delta t = 36\times5 = 180$ N s. Initial momentum $= 24\times1.0 = 24$ kg m s$^{-1}$.`, s: "The impulse delivered is 36 times 5, which is 180 newton seconds. The initial momentum of both blocks is 24 kilogram metres per second." },
            { t: H`Final: $24v = 24 + 180 \Rightarrow v = 8.5$ m s$^{-1}$. So $p_B = 20\times8.5 = 170$ kg m s$^{-1}$. <b>Q4 answer (a)</b>`, s: "So the final total momentum is 204, and the common velocity is 8.5 metres per second. Block B's momentum is 20 times 8.5, which is 170. Answer a." },
            { t: H`Q5: $W_\text{net,A} = \Delta K_A = \tfrac12(4.0)(8.5^2 - 1.0^2) = 142.5$ J. <b>Q5 answer (b)</b>`, s: "For question 5, use the work energy theorem on block A alone. Its kinetic energy changes from a half times 4 times 1 squared, to a half times 4 times 8.5 squared. The difference is 142.5 joules. Answer b." }
          ]
        }
      ]
    },
    {
      id: "5.2",
      title: "Conservation of Momentum and Collisions",
      notes: H`
<div class="eq"><div class="eq-label">Conservation of linear momentum</div>$$\text{If } \textstyle\sum\vec F_\text{ext} = 0:\qquad \sum m_i\vec u_i = \sum m_i\vec v_i$$</div>
<p>During a brief collision, external forces such as gravity and friction are usually negligible compared with the huge internal forces. So momentum is conserved <i>across</i> the collision, even if not before or after.</p>
<h4>Coefficient of restitution</h4>
$$e = \frac{\text{speed of separation}}{\text{speed of approach}} = \frac{v_2 - v_1}{u_1 - u_2}$$
<table class="tbl"><tr><th>Type</th><th>$e$</th><th>Kinetic energy</th></tr><tr><td>Perfectly elastic</td><td>1</td><td>conserved</td></tr><tr><td>Inelastic</td><td>$0<e<1$</td><td>some lost</td></tr><tr><td>Perfectly inelastic (stick together)</td><td>0</td><td>maximum loss consistent with momentum</td></tr></table>
[[EX]]
[[EX]]
<h4>Maximum compression: the common-velocity condition</h4>
<p>When two bodies interact through a spring, the spring is most compressed when the bodies have <b>zero relative velocity</b>, so they move with a common velocity $v = \dfrac{\sum m_iu_i}{\sum m_i}$. Then energy conservation gives the compression: $\tfrac12kx_\text{max}^2 = K_\text{initial} - K_\text{common}$.</p>
<div class="note"><b>SJPO tip.</b> For an elastic collision between <i>equal</i> masses with one initially at rest, the two final velocities are <b>perpendicular</b> (unless the collision is head-on). This follows from $\vec u = \vec v_1 + \vec v_2$ and $u^2 = v_1^2 + v_2^2$, which together give $\vec v_1\cdot\vec v_2 = 0$.</div>
[[EX]]`,
      lecture: [
        { h: "Momentum is conserved", b: H`$$\sum\vec F_\text{ext} = 0\ \Rightarrow\ \sum m\vec u = \sum m\vec v$$<ul><li>In collisions, external forces are negligible for the brief impact</li><li>Momentum is a vector: choose a positive direction</li></ul>`, s: "If no external force acts on a system, its total momentum is conserved. During a collision the internal forces are huge and brief, so external forces like gravity or friction hardly matter, and momentum is conserved across the impact. Remember momentum is a vector. Choose a positive direction and keep track of signs." },
        { h: "Coefficient of restitution", b: H`$$e = \frac{v_2 - v_1}{u_1 - u_2}$$<ul><li>$e=1$: elastic, KE conserved</li><li>$0<e<1$: inelastic</li><li>$e=0$: stick together</li></ul>`, s: "The coefficient of restitution is the speed of separation divided by the speed of approach. An elastic collision has e equal to one and conserves kinetic energy. Bodies that stick together have e equal to zero. For one dimensional collisions, the momentum equation plus the restitution equation give you two equations for the two unknown final velocities." },
        { h: "Spring collisions", b: H`<ul><li>Max compression ⇔ common velocity</li><li>$v = \dfrac{\sum mu}{\sum m}$</li><li>$\tfrac12kx^2 = K_i - K_\text{common}$</li></ul>`, s: "When two bodies interact through a spring, the spring is most compressed at the instant the bodies stop approaching each other, when they share a common velocity. Find that velocity from momentum conservation, and the lost kinetic energy is stored in the spring." },
        { h: "Equal-mass elastic collisions", b: H`$$\vec u = \vec v_1 + \vec v_2,\quad u^2 = v_1^2 + v_2^2\ \Rightarrow\ \vec v_1\cdot\vec v_2 = 0$$<p class="small">Final velocities are perpendicular: $\theta_1+\theta_2 = 90^\circ$.</p>`, s: "A beautiful result: in an elastic collision between equal masses with one at rest, if the collision is not head on, the two balls fly off at right angles. Momentum says u equals v one plus v two. Energy says u squared equals v one squared plus v two squared. That's Pythagoras, so the two final velocities must be perpendicular." }
      ],
      examples: [
        {
          ref: "2018 Q14", img: ["2018-Q14"], box: "m", ans: "E",
          intro: "SJPO 2018 question 14. Block A, 5 kilograms at 2 metres per second, collides with block B, 2 kilograms at minus 5 metres per second. The coefficient of restitution is 0.5. Find B's final velocity.",
          steps: [
            { t: H`Momentum (right +): $5(2) + 2(-5) = 0 = 5v_A + 2v_B$.`, s: "Take right as positive. The total momentum before is 5 times 2 plus 2 times minus 5, which is zero. So 5 v A plus 2 v B equals zero." },
            { t: H`Restitution: approach speed $= 2-(-5) = 7$, so $v_B - v_A = 0.5\times7 = 3.5$.`, s: "The speed of approach is 7 metres per second, so the speed of separation is half of that: v B minus v A equals 3.5." },
            { t: H`Solving: $v_A = -1.0$ m s$^{-1}$, $v_B = +2.5$ m s$^{-1}$. <b>Answer E</b>`, s: "Solving the two equations, v A is minus 1 and v B is plus 2.5 metres per second. Answer E." }
          ]
        },
        {
          ref: "2024 Q12", img: ["2024-Q12"], box: "s", ans: "C",
          intro: "SJPO 2024 question 12. Bobo, mass M 1, throws a snowball of mass m to Nana, mass M 2, who catches it. They move apart at v 1 and v 2. Find v 2 over v 1.",
          steps: [
            { t: H`Throw (Bobo + ball start at rest): $mv = M_1v_1$.`, s: "When Bobo throws the ball at speed v, momentum is conserved: m v equals M 1 v 1." },
            { t: H`Catch: $mv = (M_2+m)v_2$.`, s: "When Nana catches it, she and the ball move together: m v equals M 2 plus m, times v 2." },
            { t: H`$\dfrac{v_2}{v_1} = \dfrac{M_1}{M_2+m}$. <b>Answer C</b>`, s: "Dividing, v 2 over v 1 equals M 1 over M 2 plus m. Answer C." }
          ]
        },
        {
          ref: "2026 Q7", img: ["2026-Q7"], box: "m", ans: "(b)",
          intro: "SJPO 2026 question 7. A block of mass m moving at u hits a spring attached to an identical stationary block. Find the maximum compression.",
          steps: [
            { t: H`Maximum compression occurs at common velocity: $mu = 2mv \Rightarrow v = u/2$.`, s: "Maximum compression happens when both blocks move at the same velocity. Momentum gives m u equals two m v, so v is u over two." },
            { t: H`Energy: $\tfrac12mu^2 = \tfrac12(2m)\left(\tfrac u2\right)^2 + \tfrac12kx^2 \Rightarrow \tfrac12kx^2 = \tfrac14mu^2$`, s: "Energy conservation: the initial kinetic energy, a half m u squared, equals the kinetic energy at common velocity, a quarter m u squared, plus the spring energy. So the spring stores a quarter m u squared." },
            { t: H`$x = u\sqrt{\dfrac{m}{2k}} = \dfrac{u\sqrt2}{2}\sqrt{\dfrac mk}$. <b>Answer (b)</b>`, s: "So x equals u root of m over two k, which is u root two over two, times root m over k. Answer b." }
          ]
        }
      ]
    },
    {
      id: "5.3",
      title: "Centre of Mass Motion",
      notes: H`
<p>The centre of mass of a system moves as if all the mass were concentrated there and all the external forces acted there:</p>
<div class="eq"><div class="eq-label">Centre of mass</div>$$M\vec a_\text{cm} = \sum\vec F_\text{ext}\qquad\Rightarrow\qquad \text{if } \textstyle\sum\vec F_\text{ext} = 0 \text{ and the system starts at rest, the CM stays put: } \sum m_i\,\Delta x_i = 0$$</div>
<p>This is the fastest way to handle "person walks on a boat" problems. Write every displacement <b>relative to the ground</b>. Then relate them through the relative displacement given in the question.</p>
[[EX]]
[[EX]]`,
      lecture: [
        { h: "The centre of mass moves simply", b: H`$$M\vec a_\text{cm} = \sum\vec F_\text{ext}$$<ul><li>No external force: CM moves at constant velocity</li><li>Starting from rest: CM stays fixed, $\sum m\,\Delta x = 0$</li></ul>`, s: "However complicated the internal motion, the centre of mass of a system moves as if all the mass were there and all external forces acted there. With no external horizontal force, the centre of mass has constant velocity. If everything starts at rest, the centre of mass doesn't move at all, so the sum of mass times displacement is zero." },
        { h: "Boat problems", b: H`<ul><li>Write all displacements relative to the <b>ground</b></li><li>Link them with the given relative displacement</li><li>$m_1\Delta x_1 + m_2\Delta x_2 = 0$</li></ul>`, s: "For a person walking on a boat, or a block sliding on a wedge, write each displacement relative to the ground. The question usually gives a relative displacement, like eight metres along the boat. Use it to link the ground displacements, then apply sum of m delta x equals zero. Let's do two examples." }
      ],
      examples: [
        {
          ref: "2018 Q20", img: ["2018-Q20"], box: "m", ans: "B",
          intro: "SJPO 2018 question 20. A 10 kilogram dog stands on a 40 kilogram boat, 20 metres from shore. It walks 8 metres towards the shore. How far from shore is it now?",
          steps: [
            { t: H`Take towards shore as positive. Dog and boat ground displacements $\Delta x_d$, $\Delta x_b$, with $\Delta x_d - \Delta x_b = 8.0$ m.`, s: "Take the direction towards the shore as positive. The dog moves 8 metres relative to the boat, so its ground displacement minus the boat's is 8 metres." },
            { t: H`No horizontal external force, starting from rest: $10\,\Delta x_d + 40\,\Delta x_b = 0 \Rightarrow \Delta x_b = -\tfrac14\Delta x_d$.`, s: "There's no horizontal external force and everything starts at rest, so 10 delta x d plus 40 delta x b equals zero. The boat moves back a quarter as far as the dog moves forward." },
            { t: H`$\tfrac54\Delta x_d = 8.0 \Rightarrow \Delta x_d = 6.4$ m. Distance from shore $= 20 - 6.4 = 13.6$ m. <b>Answer B</b>`, s: "So five quarters of delta x d is 8, giving 6.4 metres towards the shore. The dog is now 20 minus 6.4, which is 13.6 metres from shore. Answer B." }
          ]
        },
        {
          ref: "2022 Q19", img: ["2022-S17", "2022-S19", "2022-Q19"], box: "m", ans: "b",
          intro: "SJPO 2022 question 19. Now the big block M can slide freely. When m 2 reaches the floor, how far has M moved, and which way?",
          steps: [
            { t: H`Horizontal external force is zero and the system starts at rest, so the horizontal CM position is fixed. As $m_1$ moves right, $M$ (with $m_2$ pressed against it) moves left by some $x$.`, s: "No horizontal external force acts, and everything starts at rest, so the horizontal centre of mass stays fixed. Block m 1 moves right towards the pulley, so M moves left by some distance x. Block m 2 is pressed against M, so it moves left with it." },
            { t: H`$m_1$ moves $h$ right <i>relative to M</i>, so relative to the ground it moves $h - x$.`, s: "Block m 1 moves a distance h to the right relative to M, which is the length of string that passes over the pulley. Relative to the ground, it moves h minus x." },
            { t: H`$m_1(h-x) = (M+m_2)x \Rightarrow x = \dfrac{m_1h}{M+m_1+m_2}$, leftward. <b>Answer (b)</b>`, s: "Set the mass-weighted displacements equal: m 1 times h minus x equals M plus m 2, times x. So x is m 1 h over the total mass, to the left. Answer b." }
          ]
        }
      ]
    }
  ]
});
