GUIDE.chapters.push({
  n: 8,
  title: "Rotational Dynamics",
  blurb: "Rigid bodies that spin as well as move: moment of inertia, torque, rolling without slipping, and angular momentum.",
  outcomes: [
    "use moments of inertia of standard bodies and reason about $I$ by symmetry",
    "apply $\\tau = I\\alpha$ together with $F = ma$, including pulleys with mass",
    "apply the rolling condition $v = R\\omega$ and split kinetic energy into translational and rotational parts",
    "identify which forces do work on a rolling body",
    "relate angular impulse to change in angular momentum, and find the direction of $\\vec\\omega$ and $\\vec L$"
  ],
  sections: [
    {
      id: "8.1",
      title: "Moment of Inertia and Torque",
      notes: H`
<p>Rotational quantities mirror linear ones:</p>
<table class="tbl"><tr><th>Linear</th><th>Rotational</th></tr>
<tr><td>$x,\ v,\ a$</td><td>$\theta,\ \omega,\ \alpha$ &nbsp;(with $v = r\omega$, $a_t = r\alpha$)</td></tr>
<tr><td>mass $m$</td><td>moment of inertia $I = \sum m_ir_i^2$</td></tr>
<tr><td>$F = ma$</td><td>$\tau = I\alpha$</td></tr>
<tr><td>$K = \tfrac12mv^2$</td><td>$K = \tfrac12I\omega^2$</td></tr>
<tr><td>$p = mv$</td><td>$L = I\omega$</td></tr></table>
<div class="eq"><div class="eq-label">Standard moments of inertia (about the axis through the CM)</div>$$\text{solid sphere } \tfrac25MR^2\qquad\text{solid disc / cylinder } \tfrac12MR^2\qquad\text{ring / hoop } MR^2\qquad\text{rod (centre) } \tfrac1{12}ML^2$$</div>
<p><b>Symmetry argument.</b> $I$ depends only on how far each mass element is from the axis. Cut a sphere into 8 identical octants: each octant has its mass at the same distances from an axis through the centre as the whole sphere does. So an octant of mass $m$ has $I = \tfrac25ma^2$ about the same axis.</p>
[[EX]]
<h4>Pulleys with mass</h4>
<p>If the pulley has moment of inertia $I$, the tensions on either side are <b>different</b>: $(T_2 - T_1)R = I\alpha = I\dfrac{a}{R}$. For a uniform disc pulley this gives $T_2 - T_1 = \tfrac12m_\text{p}a$. The pulley behaves like an extra mass $\tfrac12m_\text{p}$ that has to be accelerated.</p>
[[EX]]`,
      lecture: [
        { h: "Rotation mirrors translation", b: H`<table class="tbl"><tr><th>Linear</th><th>Rotational</th></tr><tr><td>$m$</td><td>$I = \sum mr^2$</td></tr><tr><td>$F = ma$</td><td>$\tau = I\alpha$</td></tr><tr><td>$\tfrac12mv^2$</td><td>$\tfrac12I\omega^2$</td></tr><tr><td>$p = mv$</td><td>$L = I\omega$</td></tr></table>`, s: "Rotational dynamics is a mirror of linear dynamics. Moment of inertia plays the role of mass, torque plays the role of force, and angular acceleration replaces acceleration. So torque equals I alpha, rotational kinetic energy is a half I omega squared, and angular momentum is I omega." },
        { h: "Standard moments of inertia", b: H`<ul><li>Solid sphere: $\tfrac25MR^2$</li><li>Solid disc / cylinder: $\tfrac12MR^2$</li><li>Ring: $MR^2$</li><li>Rod about centre: $\tfrac1{12}ML^2$</li></ul>`, s: "Know these standard results. A solid sphere is two fifths M R squared, a solid disc or cylinder is a half M R squared, a ring is M R squared, and a rod about its centre is one twelfth M L squared." },
        { h: "Symmetry tricks", b: H`<ul><li>$I$ depends only on distances from the axis</li><li>A piece of a body with the same distance distribution has the same $I/m$</li><li>Octant of a sphere about an edge: $\tfrac25ma^2$</li></ul>`, s: "Moment of inertia only cares about how far the mass is from the axis. So if you cut a body into identical pieces that each have the same spread of distances from the axis, each piece has the same I per unit mass as the whole. An eighth of a sphere, about one of its straight edges, therefore has two fifths m a squared." },
        { h: "Pulleys with mass", b: H`$$(T_2 - T_1)R = I\frac{a}{R}$$<ul><li>Uniform disc: $T_2 - T_1 = \tfrac12m_p a$</li><li>Pulley adds $\tfrac12m_p$ to the mass in the denominator</li></ul>`, s: "If a pulley has mass, the tensions on the two sides differ, because a net torque is needed to spin the pulley up. For a uniform disc pulley, the tension difference is a half m p times a. In the system method, the pulley simply adds an extra half m p to the total mass being accelerated." }
      ],
      examples: [
        {
          ref: "2018 Q9", img: ["2018-Q9"], box: "s", ans: "B",
          intro: "SJPO 2018 question 9. A solid sphere has I equal to two fifths M a squared. What is the moment of inertia of an octant of mass m about one of its straight edges?",
          steps: [
            { t: H`The straight edge lies along an axis through the sphere's centre. The 8 octants are identical and each has the same distribution of distances from this axis.`, s: "The straight edge of the octant lies along a diameter of the original sphere. Cutting the sphere into eight identical octants keeps each one's distances from that axis the same." },
            { t: H`So $I_\text{octant} = \tfrac18 I_\text{sphere} = \tfrac18\cdot\tfrac25(8m)a^2 = \tfrac25ma^2$. <b>Answer B</b>`, s: "So each octant contributes one eighth of the sphere's moment of inertia. With the sphere's mass equal to 8 m, that's two fifths m a squared. Answer B." }
          ]
        },
        {
          ref: "2022 Q21", img: ["2022-S17", "2022-Q21"], box: "m", ans: "b",
          intro: "SJPO 2022 question 21. The same set up, with M fixed, but now the pulley is a uniform disc of mass m 3 and radius R. Find the acceleration.",
          steps: [
            { t: H`$m_2$: $m_2g - T_2 = m_2a$. &nbsp; $m_1$: $T_1 = m_1a$.`, s: "For the hanging block, m 2 g minus T 2 equals m 2 a. For the block on top, T 1 equals m 1 a." },
            { t: H`Pulley: $(T_2 - T_1)R = \tfrac12m_3R^2\cdot\dfrac aR \Rightarrow T_2 - T_1 = \tfrac12m_3a$.`, s: "For the pulley, the net torque T 2 minus T 1, times R, equals a half m 3 R squared times a over R. So T 2 minus T 1 equals a half m 3 a." },
            { t: H`Add all three: $m_2g = \left(m_1 + m_2 + \tfrac{m_3}{2}\right)a \Rightarrow a = \dfrac{m_2}{m_1+m_2+\frac{m_3}2}g$. <b>Answer (b)</b>`, s: "Adding the three equations, the tensions cancel: m 2 g equals m 1 plus m 2 plus half m 3, times a. Answer b." }
          ]
        }
      ]
    },
    {
      id: "8.2",
      title: "Rolling Without Slipping",
      notes: H`
<div class="eq"><div class="eq-label">Rolling without slipping</div>$$v_\text{cm} = R\omega\qquad a_\text{cm} = R\alpha\qquad K = \tfrac12Mv^2 + \tfrac12I\omega^2$$</div>
<ul><li>The contact point is instantaneously at rest. The top of the wheel moves at $2v$.</li>
<li><b>Static friction</b> at the contact point does <b>no work</b> on a body rolling without slipping, because the contact point does not move. Yet it is the force that provides the torque to change $\omega$.</li>
<li>For $I = kMR^2$: $K_\text{rot}/K_\text{trans} = k$. For a solid sphere ($k = \tfrac25$), rotation holds $\tfrac27$ of the total KE.</li></ul>
<p><b>Work by a force applied at a point on the body:</b> $W = F\times$(distance moved by the <i>point of application</i>). A string unwinding from the top of a rolling cylinder moves its end $2x$ while the centre moves $x$.</p>
[[EX]]
[[EX]]`,
      lecture: [
        { h: "Rolling condition", b: H`$$v = R\omega\qquad a = R\alpha$$$$K = \tfrac12Mv^2 + \tfrac12I\omega^2$$<ul><li>Contact point at rest; top moves at $2v$</li></ul>`, s: "Rolling without slipping links rotation and translation: v equals R omega, and a equals R alpha. The contact point is momentarily at rest, while the top of the wheel moves at twice the centre's speed. The total kinetic energy is translational plus rotational." },
        { h: "Friction in rolling", b: H`<ul><li>Static friction provides the torque</li><li>But does <b>no work</b>: the contact point doesn't move</li><li>Energy split: $K_\text{rot}/K_\text{trans} = k$ for $I = kMR^2$</li></ul>`, s: "Static friction at the contact point is what makes the wheel spin up, but it does no work, because the contact point doesn't slide. For a body with I equal to k M R squared, the ratio of rotational to translational energy is k. For a solid sphere, two fifths, so rotation holds two sevenths of the total." },
        { h: "Work done by an applied force", b: H`$$W = F\times(\text{distance moved by the point of application})$$<p class="small">String pulled from the top of a rolling cylinder: end moves $2x$.</p>`, s: "The work done by a force is the force times how far its point of application moves. A string pulled from the top of a rolling cylinder moves twice as far as the centre, so the work is twice what you might first expect. Let's see these in the examples." }
      ],
      examples: [
        {
          ref: "2018 Q4", img: ["2018-Q4"], box: "s", ans: "A",
          intro: "SJPO 2018 question 4. A sphere rolls without slipping down a rough incline. Which force directly does the work that increases its rotational kinetic energy?",
          steps: [
            { t: H`About the centre of mass, weight and the normal force pass through the CM, so they exert no torque. Only <b>static friction</b> at the contact point exerts a torque about the CM.`, s: "About the centre, the weight and the normal force both pass through the centre of mass, so they produce no torque. Only static friction at the contact point produces a torque that spins the sphere up." },
            { t: H`So rotational KE is gained through friction's torque. Overall, friction does zero net work: it takes translational KE and converts it to rotational. <b>Answer A</b>`, s: "So the rotational kinetic energy comes directly through static friction's torque. Overall, friction does zero net work. It takes energy out of translation and puts it into rotation, while gravity supplies the total. The answer is A, static friction. It is not kinetic friction, since there is no slipping." }
          ]
        },
        {
          ref: "2026 Q17–18", img: ["2026-S17", "2026-Q17", "2026-Q18"], box: "l", ans: "Q17 (c), Q18 (e)",
          intro: "SJPO 2026 questions 17 and 18. A string wrapped round a solid cylinder is pulled from the top with tension T, and it rolls without slipping a distance x. Find the friction, and the work done by T.",
          steps: [
            { t: H`Take friction $f$ forward. Linear: $ma = T + f$. Rotation about the centre: $\tfrac12mr^2\alpha = Tr - fr$.`, s: "Let friction f point forward. Linear motion: m a equals T plus f. Rotation about the centre: a half m r squared alpha equals T r minus f r." },
            { t: H`Rolling: $a = r\alpha$, so $\tfrac12ma = T - f$. Combining with $ma = T + f$: $\tfrac12(T + f) = T - f \Rightarrow f = \tfrac13T$ (forward). <b>Q17 answer (c)</b>`, s: "Rolling means a equals r alpha, so a half m a equals T minus f. Substituting m a equals T plus f gives a half T plus f equals T minus f. So f equals a third of T, pointing forward. Answer c." },
            { t: H`Q18: the top of the cylinder moves at $2v$, so the string's end moves $2x$: $W_T = T(2x) = 2Tx$. (Equivalently $Tx + Tr\cdot\tfrac xr$.) <b>Q18 answer (e)</b>`, s: "For the work, the point where the string leaves the top moves at twice the centre's speed, so it covers 2 x. The work done by T is 2 T x. Equivalently, T x of translational work plus T r times x over r of rotational work. Answer e." }
          ]
        }
      ]
    },
    {
      id: "8.3",
      title: "Angular Momentum and Angular Impulse",
      notes: H`
<div class="eq"><div class="eq-label">Angular momentum</div>$$\vec L = \vec r\times\vec p\qquad L = I\omega\ \text{(rigid body about a fixed or CM axis)}\qquad \vec\tau = \frac{d\vec L}{dt}$$</div>
<ul><li>A brief impulse $J$ applied at perpendicular distance $d$ from the CM changes linear momentum by $J$ <b>and</b> angular momentum about the CM by $Jd$.</li>
<li>Velocity of a point on a rigid body $=$ velocity of the CM $+$ velocity due to rotation about the CM ($\omega r$, tangential).</li>
<li>Directions: $\vec\omega$ lies along the axis of rotation (right-hand rule). $\vec L = \sum\vec r\times\vec p$ need <b>not</b> be parallel to $\vec\omega$ when the body is not symmetric about the rotation axis, for example a tilted stick swinging round a vertical axis.</li></ul>
[[EX]]
[[EX]]`,
      lecture: [
        { h: "Angular momentum", b: H`$$\vec L = \vec r\times\vec p\qquad L = I\omega\qquad\vec\tau = \frac{d\vec L}{dt}$$`, s: "Angular momentum of a particle is r cross p. For a rigid body rotating about a symmetry axis, it's I omega. Torque is the rate of change of angular momentum, just as force is the rate of change of momentum." },
        { h: "Off-centre impulses", b: H`<ul><li>Linear: $\Delta p = J$</li><li>Angular (about CM): $\Delta L = Jd$</li><li>Point velocity = $v_\text{cm}$ + rotational $\omega r$</li></ul>`, s: "A brief impulse applied off centre does two jobs at once. It changes the linear momentum by J, and the angular momentum about the centre of mass by J times the perpendicular distance. The velocity of any point on the body is then the centre of mass velocity plus its rotational velocity." },
        { h: "Directions of ω and L", b: H`<ul><li>$\vec\omega$: along the rotation axis (right-hand rule)</li><li>$\vec L = \sum\vec r\times\vec p$: not always parallel to $\vec\omega$</li><li>Non-symmetric bodies: $\vec L$ tilts</li></ul>`, s: "Angular velocity always points along the axis of rotation, by the right hand rule. But angular momentum, being a sum of r cross p, need not point the same way. For a tilted stick swinging around a vertical axis, the angular momentum is perpendicular to the stick, not vertical. Let's work through the examples." }
      ],
      examples: [
        {
          ref: "2024 Q20", img: ["2024-Q20"], box: "m", ans: "D",
          intro: "SJPO 2024 question 20. A uniform disc on a frictionless table receives a brief tangential impulse at its leftmost point. Find the ratio of the speeds of the leftmost and rightmost points.",
          steps: [
            { t: H`Linear: $J = Mv$. Angular about the CM: $JR = \tfrac12MR^2\omega$.`, s: "The impulse gives linear momentum J equals M v. About the centre it gives angular momentum J R equals a half M R squared omega." },
            { t: H`Dividing: $R\omega = 2v$.`, s: "Dividing the two equations, R omega equals 2 v." },
            { t: H`The leftmost point moves with the impulse: $v + R\omega = 3v$. The rightmost point: $v - R\omega = -v$. Ratio $= 3$. <b>Answer D</b>`, s: "The leftmost point moves at v plus R omega, which is 3 v, in the direction of the impulse. The rightmost point moves at v minus R omega, which is minus v, the opposite way. The ratio of speeds is 3. Answer D." }
          ]
        },
        {
          ref: "2026 Q19", img: ["2026-Q19"], box: "s", ans: "(d)",
          intro: "SJPO 2026 question 19. A stick pivoted at its top swings rigidly round a vertical axis. Which directions are omega and L?",
          steps: [
            { t: H`$\vec\omega$ lies along the rotation axis, which is vertical: direction II.`, s: "Angular velocity points along the axis of rotation, which is vertical, so direction II." },
            { t: H`At the instant shown, each point has $\vec r$ along the stick (downwards from the pivot) and $\vec p$ into the page. So $\vec r\times\vec p$ is perpendicular to the stick, in the plane of the page: direction III.`, s: "For angular momentum, every point on the stick has its position vector along the stick, downwards from the pivot, and its momentum into the page. The cross product is perpendicular to the stick, within the page. That's direction III." },
            { t: H`$\vec\omega$ along II, $\vec L$ along III. <b>Answer (d)</b>`, s: "So omega is along II and L is along III. Answer d." }
          ]
        }
      ]
    }
  ]
});
