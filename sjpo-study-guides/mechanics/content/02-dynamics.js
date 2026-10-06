GUIDE.chapters.push({
  n: 2,
  title: "Newton's Laws and Dynamics",
  blurb: "Forces cause accelerations. Free-body diagrams, friction, connected bodies, and the fictitious forces that appear in accelerating frames.",
  outcomes: [
    "state Newton's three laws and identify Newton's third-law pairs correctly",
    "draw free-body diagrams showing only real forces acting on a chosen body",
    "apply $F_\\text{net} = ma$ to single bodies and to systems treated as one object",
    "use the static and kinetic friction models $f_s \\le \\mu_s N$ and $f_k = \\mu_k N$",
    "solve connected-particle problems involving strings, pulleys and stacked blocks",
    "analyse motion in an accelerating frame using a fictitious force $-m\\vec a_\\text{frame}$"
  ],
  sections: [
    {
      id: "2.1",
      title: "Newton's Laws and Free-Body Diagrams",
      notes: H`
<div class="def"><b>Newton's first law.</b> A body stays at rest or moves with constant velocity unless a resultant force acts on it.<br>
<b>Newton's second law.</b> The resultant force equals the rate of change of momentum: $\vec F_\text{net} = \dfrac{d\vec p}{dt}$, which becomes $\vec F_\text{net} = m\vec a$ for constant mass.<br>
<b>Newton's third law.</b> If A exerts a force on B, then B exerts a force on A that is equal in magnitude, opposite in direction and <i>of the same type</i>.</div>
<p>A third-law pair always acts on <b>two different bodies</b>, so the two forces never appear on the same free-body diagram. The weight of a book and the normal force on it are <i>not</i> a third-law pair. The partner of the book's weight is the book's gravitational pull on the Earth.</p>
<h4>Free-body diagrams (FBDs)</h4>
<ul><li>Isolate one body and draw only the <b>real</b> forces acting on it: weight, normal contact, tension, friction, drag, spring force and so on.</li>
<li>"Centripetal force" is not a new kind of force. It is the <i>name</i> for the resultant force that points towards the centre. Never add it as an extra arrow.</li>
<li>Choose axes along the acceleration if you know its direction.</li></ul>
[[EX]]
<h4>The system method</h4>
<p>Bodies that move together with the same acceleration can be treated as one object of mass $M_\text{total}$. Internal forces cancel. Find $a$ from the external forces, then isolate one body to find an internal force.</p>
<div class="eq"><div class="eq-label">System method</div>$$a = \frac{\sum F_\text{external}}{\sum m}\qquad\text{then for one part:}\quad F_\text{on part} = m_\text{part}\,a$$</div>
[[EX]]
<h4>Terminal velocity</h4>
<p>A body falling through a fluid with drag $F_\text{drag}(v)$ speeds up until the drag balances its weight (minus buoyancy). At terminal velocity $a = 0$. For linear drag $F = cv$, this gives $v_T = mg/c$.</p>
[[EX]]`,
      lecture: [
        { h: "Newton's three laws", b: H`<ul><li><b>N1</b>: no resultant force → constant velocity</li><li><b>N2</b>: $\vec F_\text{net} = d\vec p/dt = m\vec a$</li><li><b>N3</b>: equal, opposite, same type, on <b>different</b> bodies</li></ul>`, s: "Newton's first law says a body keeps a constant velocity unless a resultant force acts. The second law says the resultant force equals the rate of change of momentum, which for constant mass is m times a. The third law says forces come in pairs that are equal, opposite, of the same type, and act on two different bodies. That last point is the one students lose marks on." },
        { h: "Third-law pairs: a common trap", b: H`<ul><li>Weight of a book &amp; normal force on the book: <b>not</b> a pair (same body, different types)</li><li>Partner of the book's weight: book pulls Earth up</li><li>Partner of the normal force: book pushes the table down</li></ul>`, s: "Weight and normal reaction on a book resting on a table are equal and opposite, but they are not a third-law pair. They act on the same body and are different types of force. The partner of the book's weight is the book's gravitational pull on the Earth. The partner of the normal force is the book pushing down on the table." },
        { h: "Free-body diagrams", b: H`<ul><li>Isolate one body; draw only <b>real</b> forces</li><li>Centripetal force = a name for the net inward force. Never add it as an extra arrow</li><li>Axes along the acceleration</li></ul>`, s: "A free body diagram shows one isolated body and only the real forces acting on it: weight, normal force, tension, friction, drag and so on. Centripetal force is not a separate force. It is simply the name for whatever resultant force points towards the centre. If you draw it as an extra arrow you have double counted. Choose your axes along the direction of acceleration whenever you can." },
        { h: "The system method", b: H`$$a = \frac{\sum F_\text{ext}}{\sum m}$$<ul><li>Internal forces cancel inside the system</li><li>Then isolate one body to find an internal force</li><li>Terminal velocity: $a=0$, e.g. $cv_T = mg$</li></ul>`, s: "When several bodies move together, treat them as one system. Internal forces cancel, so the acceleration is the total external force divided by the total mass. Then, to find a force between two parts, isolate one part and apply F equals m a to it alone. And for a falling object with drag, terminal velocity is reached when the acceleration is zero, so drag equals weight." }
      ],
      examples: [
        {
          ref: "2024 Q7", img: ["2024-Q7"], box: "s", ans: "C",
          intro: "SJPO 2024 question 7. Alice and Bob draw free body diagrams for a conical pendulum. Alice adds a centripetal force arrow. Whose diagram is correct?",
          steps: [
            { t: H`In the ground frame the only forces on the bob are the tension $T$ and the weight $W$.`, s: "In the ground frame, only two real forces act on the bob: the tension and the weight." },
            { t: H`Their resultant points horizontally towards the centre. This resultant <i>is</i> the centripetal force, so drawing it again double counts. The bob accelerates, so it is <i>not</i> in equilibrium.`, s: "Their vector sum points horizontally inward. That resultant is the centripetal force, so Alice's extra arrow double counts it. The bob is accelerating, so it is not in equilibrium either." },
            { t: H`$T$ and $W$ are not a third-law pair: they are different types of force acting on the same body. <b>Answer C</b>`, s: "Tension and weight are not an action reaction pair, because they are different types of force on the same body. So Bob is right because tension and weight are the only forces. The answer is C." }
          ]
        },
        {
          ref: "2024 Q4", img: ["2024-Q4"], box: "s", ans: "C",
          intro: "SJPO 2024 question 4. n identical blocks in a row on frictionless ground are pushed by a force F. What is the force between the two rightmost blocks?",
          steps: [
            { t: H`System: $a = \dfrac{F}{nm}$.`, s: "Treat all n blocks as one system of mass n m. The acceleration is F over n m." },
            { t: H`Isolate the rightmost block. The only horizontal force on it is the push from its neighbour: $N = m a = \dfrac{F}{n}$. <b>Answer C</b>`, s: "Now isolate the rightmost block. The only horizontal force on it is the push from its neighbour, which must equal m times a, which is F over n. Answer C." }
          ]
        },
        {
          ref: "2018 Q2", img: ["2018-Q2"], box: "s", ans: "B",
          intro: "SJPO 2018 question 2. A raindrop of diameter 0.1 millimetres experiences linear drag c v, with c equal to 1.55 times ten to the minus six. Find its terminal speed.",
          steps: [
            { t: H`At terminal speed: $cv_T = mg$, with $m = \rho\cdot\tfrac43\pi r^3 = 1000\cdot\tfrac43\pi(5\times10^{-5})^3 = 5.24\times10^{-10}$ kg.`, s: "At terminal speed the drag balances the weight. The mass is density times the volume of a sphere of radius 5 times ten to the minus five metres, which is 5.24 times ten to the minus ten kilograms." },
            { t: H`$v_T = \dfrac{mg}{c} = \dfrac{(5.24\times10^{-10})(9.80)}{1.55\times10^{-6}} = 3.3\times10^{-3}$ m s$^{-1}$ $= 3.3$ mm s$^{-1}$. <b>Answer B</b>`, s: "So v T equals m g over c, which works out to 3.3 millimetres per second. Answer B." }
          ]
        }
      ]
    },
    {
      id: "2.2",
      title: "Friction",
      notes: H`
<p>Friction acts along the contact surface and opposes <b>relative motion</b>, or the tendency towards it, between the two surfaces.</p>
<div class="eq"><div class="eq-label">Friction model</div>
$$\text{static: } f_s \le \mu_s N\ (\text{adjusts to whatever is needed}) \qquad \text{kinetic: } f_k = \mu_k N\ (\text{constant}),\quad \mu_k < \mu_s$$</div>
<ul><li>Static friction is only as large as it needs to be. Do not write $f = \mu_s N$ unless the surfaces are about to slip.</li>
<li>On an incline of angle $\theta$, a block is on the point of slipping when $\tan\theta = \mu_s$. Once moving, $a = g(\sin\theta - \mu_k\cos\theta)$.</li>
<li>A useful identity: if $\tan\theta = \mu$, then $\sin\theta = \dfrac{\mu}{\sqrt{1+\mu^2}}$ and $\cos\theta = \dfrac{1}{\sqrt{1+\mu^2}}$.</li></ul>
[[EX]]
<h4>Stacked blocks: do they move together?</h4>
<ol><li><b>Assume</b> they move together and find the common acceleration from the system.</li>
<li>Isolate the block that is <i>not</i> directly pushed or pulled. Find the friction it needs.</li>
<li>Check: is the friction needed $\le \mu_s N$? If yes, the assumption holds. If not, they slip, so use $\mu_k N$ on each block separately.</li></ol>
[[EX]]`,
      lecture: [
        { h: "Static vs kinetic friction", b: H`$$f_s \le \mu_s N\qquad f_k = \mu_k N$$<ul><li>Static friction is only as big as needed</li><li>$\mu_k < \mu_s$: harder to start sliding than to keep sliding</li></ul>`, s: "Friction opposes relative motion between surfaces. Static friction adjusts itself to whatever value is needed to prevent slipping, up to a maximum of mu s times N. Only when slipping is about to happen does it reach that maximum. Once sliding, kinetic friction is constant at mu k times N, and mu k is smaller than mu s." },
        { h: "Friction on an incline", b: H`<ul><li>On the point of slipping: $\tan\theta = \mu_s$</li><li>Sliding: $a = g(\sin\theta - \mu_k\cos\theta)$</li></ul>$$\tan\theta=\mu \Rightarrow \sin\theta = \frac{\mu}{\sqrt{1+\mu^2}},\ \cos\theta = \frac{1}{\sqrt{1+\mu^2}}$$`, s: "On an incline, a block is just about to slip when tan theta equals mu s. Once it slides, its acceleration is g times sine theta minus mu k cos theta. When tan theta equals mu, draw a right triangle with sides mu and one: the hypotenuse is root of one plus mu squared, which gives sine and cosine directly." },
        { h: "Do stacked blocks move together?", b: H`<ol><li>Assume they move together, find $a$</li><li>Isolate the block that is not pulled directly: friction needed $= m a$</li><li>Check: needed $\le \mu_s N$? Yes → together. No → slipping, use $\mu_k N$</li></ol>`, s: "For stacked blocks, use the assume and check method. First assume they move together and find the common acceleration. Next, isolate the block that is not pulled directly. Friction is the only horizontal force on it, so friction needed equals its mass times a. Finally check whether that is within mu s N. If it is, they move together. If not, they slip, and you redo the problem with kinetic friction on each block." }
      ],
      examples: [
        {
          ref: "2026 Q6", img: ["2026-Q6"], box: "m", ans: "(e)",
          intro: "SJPO 2026 question 6. A block released from rest slides down a ramp with acceleration a. Given mu s and mu k, what is the smallest possible value of a?",
          steps: [
            { t: H`$N = mg\cos\theta$; once sliding, $a = g(\sin\theta - \mu_k\cos\theta)$, which increases with $\theta$.`, s: "Once the block slides, its acceleration is g times sine theta minus mu k cos theta. This increases with the angle, so the smallest acceleration comes from the smallest angle at which it slides at all." },
            { t: H`It just starts to slide when $mg\sin\theta = \mu_s mg\cos\theta$, i.e. $\tan\theta = \mu_s$.`, s: "It just starts to slide when the component of weight down the slope equals the maximum static friction, which means tan theta equals mu s." },
            { t: H`Then $\sin\theta = \dfrac{\mu_s}{\sqrt{1+\mu_s^2}}$, $\cos\theta = \dfrac{1}{\sqrt{1+\mu_s^2}}$, so $a_\text{min} = \dfrac{\mu_s - \mu_k}{\sqrt{1+\mu_s^2}}\,g$. <b>Answer (e)</b>`, s: "Using the triangle with sides mu s and one, sine theta is mu s over root of one plus mu s squared, and cos theta is one over the same root. So the minimum acceleration is mu s minus mu k, over root of one plus mu s squared, times g. Answer e." }
          ]
        },
        {
          ref: "2022 Q12–13", img: ["2022-Q12", "2022-Q13"], box: "l", ans: "Q12 c, Q13 e",
          intro: "SJPO 2022 questions 12 and 13. A force F pulls a block m 2 sitting on a slab m 1, which rests on a frictionless floor. When do they move as one piece, and what is the block's acceleration for the given numbers?",
          steps: [
            { t: H`Assume they move together: $a = \dfrac{F}{M}$ with $M = m_1+m_2$.`, s: "Assume they move together. The common acceleration is F over the total mass M." },
            { t: H`The slab is driven only by friction from the block: $f = m_1 a = \dfrac{m_1F}{M}$.`, s: "The slab is not pulled directly. The only horizontal force on it is friction from the block, so friction equals m 1 times a, which is m 1 F over M." },
            { t: H`No slipping requires $f \le \mu_s m_2 g$, so $\mu_s \ge \dfrac{m_1}{m_2}\dfrac{F}{Mg}$. <b>Q12 answer (c)</b>`, s: "For no slipping, this must not exceed mu s m 2 g. Rearranging, mu s must be at least m 1 over m 2 times F over M g. Answer c." },
            { t: H`Q13: $\dfrac{m_1}{m_2}\dfrac{F}{Mg} = \dfrac{50}{20}\cdot\dfrac{140}{70\times10} = 0.50 \le 0.55$, so they stick. Then $a = \dfrac{140}{70} = 2.0$ m s$^{-2}$. <b>Q13 answer (e)</b>`, s: "For question 13, check the condition: 50 over 20 times 140 over 700 is 0.5, which is less than 0.55. So they move together, and the acceleration is simply 140 over 70, which is 2 metres per second squared. Answer e. The value of mu k is a distractor." }
          ]
        }
      ]
    },
    {
      id: "2.3",
      title: "Connected Bodies and Pulleys",
      notes: H`
<p>For an <b>inextensible, light string</b> over a <b>light, frictionless pulley</b>:</p>
<ul><li>the tension is the same all along the string;</li><li>connected bodies have accelerations of equal magnitude (along the string).</li></ul>
<p>Treat the string-connected bodies as one system moving "along the string". The driving force is whatever gravity component acts along the string direction, minus any resistances along it:</p>
<div class="eq"><div class="eq-label">Block on smooth table, hanging block $m_2$</div>$$a = \frac{m_2 g}{m_1+m_2}\qquad T = m_1 a = \frac{m_1m_2}{m_1+m_2}g$$</div>
<p>After finding $a$, use the equations of motion. For example, a block falling a height $h$ from rest takes $t = \sqrt{2h/a}$.</p>
[[EX]]
<h4>Chains and ropes with mass</h4>
<p>A uniform chain partly hanging over an edge is a "connected system" too. Its total mass $m$ accelerates, while only the hanging part's weight drives it. If a fraction $f$ hangs over a smooth edge, the initial acceleration is $a = fg$. With friction on the part lying on the table, the chain can only start moving if the hanging weight exceeds $\mu_s \times$ (normal force on the part on the table).</p>
[[EX]]`,
      lecture: [
        { h: "Strings and pulleys", b: H`<ul><li>Light, inextensible string: same tension throughout</li><li>Connected bodies: same magnitude of acceleration</li><li>Treat as one system moving "along the string"</li></ul>`, s: "For a light inextensible string over a light frictionless pulley, the tension is the same everywhere along the string, and the connected bodies share the same size of acceleration. That lets us treat everything as one system moving along the string." },
        { h: "Classic table–pulley result", b: H`$$a = \frac{m_2 g}{m_1+m_2}\qquad T = \frac{m_1m_2}{m_1+m_2}g$$<p class="small">Driving force: weight of the hanging block. Mass being accelerated: both blocks.</p>`, s: "The classic case: a block m 1 on a smooth table, connected over a pulley to a hanging block m 2. The only force driving the system along the string is the weight of the hanging block, m 2 g. The mass being accelerated is both blocks. So a equals m 2 g over m 1 plus m 2. The tension then follows from m 1 a." },
        { h: "Chains with mass", b: H`<ul><li>Whole chain accelerates; only the hanging part drives it</li><li>Fraction $f$ hanging over a smooth edge: $a = fg$</li><li>With friction on the table: moves only if $f\,mg > \mu_s(1-f)mg$</li></ul>`, s: "A chain hanging over an edge works the same way. The whole chain is accelerated, but only the hanging part's weight drives it. If a fraction f hangs over a smooth edge, the initial acceleration is f g. With friction, the chain only starts moving if the hanging weight beats the maximum static friction on the part lying on the table. Now let's try the examples." }
      ],
      examples: [
        {
          ref: "2022 Q17–18", img: ["2022-S17", "2022-S17b", "2022-Q17", "2022-Q18"], box: "m", ans: "Q17 b, Q18 b",
          intro: "SJPO 2022 questions 17 and 18. Block m 1 on top of a fixed block M is connected over a light pulley to block m 2, hanging at height h above the floor. Find the acceleration, and the time for m 2 to reach the floor.",
          steps: [
            { t: H`Driving force along the string is $m_2 g$, and the total mass moved is $m_1+m_2$:  $a = \dfrac{m_2}{m_1+m_2}g$. <b>Q17 answer (b)</b>`, s: "Along the string, the only driving force is the weight of the hanging block, m 2 g, and the mass accelerated is m 1 plus m 2. So a equals m 2 over m 1 plus m 2, times g. Answer b." },
            { t: H`From rest, $h = \tfrac12at^2 \Rightarrow t = \sqrt{\dfrac{2h}{a}} = \sqrt{\dfrac{2h(m_1+m_2)}{m_2 g}}$. <b>Q18 answer (b)</b>`, s: "Starting from rest, h equals a half a t squared, so t is root of two h over a. Substituting gives root of two h times m 1 plus m 2, over m 2 g. Answer b." }
          ]
        },
        {
          ref: "2024 Q5–6", img: ["2024-S5", "2024-Q5", "2024-Q6"], box: "m", ans: "Q5 A, Q6 B",
          intro: "SJPO 2024 questions 5 and 6. A uniform chain of length L has a quarter of its length hanging off a table. Find the initial acceleration on a frictionless table, and the largest coefficient of static friction for which it still slides.",
          steps: [
            { t: H`Q5: driving force = weight of the hanging quarter $= \tfrac14mg$, and the mass accelerated is $m$: $a = \dfrac{g}{4}$. <b>Answer A</b>`, s: "With no friction, the only driving force is the weight of the hanging quarter, which is a quarter of m g. The whole chain of mass m accelerates. So a is g over 4. Answer A." },
            { t: H`Q6: the part on the table has normal force $\tfrac34mg$. To slide we need $\tfrac14mg > \mu_s\cdot\tfrac34mg$.`, s: "With friction, the three quarters on the table presses down with normal force three quarters m g. To start sliding, the hanging weight must exceed the maximum static friction, mu s times three quarters m g." },
            { t: H`$\mu_s < \tfrac13$, so the maximum is $\mu_s = \tfrac13$. <b>Answer B</b>`, s: "That gives mu s less than one third. Answer B." }
          ]
        }
      ]
    },
    {
      id: "2.4",
      title: "Accelerating Frames and Fictitious Forces",
      notes: H`
<p>Newton's laws hold in <b>inertial</b> frames. In a frame accelerating at $\vec a_0$, such as a train, bus or lift, we can still use $\vec F = m\vec a_\text{rel}$ if we add a <b>fictitious force</b> on every body:</p>
<div class="eq"><div class="eq-label">Fictitious (pseudo) force</div>$$\vec F_\text{fict} = -m\vec a_0 \qquad\Longrightarrow\qquad \vec g_\text{eff} = \vec g - \vec a_0$$</div>
<p>In the accelerating frame everything behaves as if gravity were $\vec g_\text{eff}$, of magnitude $\sqrt{g^2+a_0^2}$ for horizontal $\vec a_0$, tilted <b>backwards</b>, away from the acceleration.</p>
<ul><li>A plumb line hangs along $\vec g_\text{eff}$, at angle $\tan^{-1}(a_0/g)$ to the vertical.</li>
<li>A liquid surface settles <b>perpendicular</b> to $\vec g_\text{eff}$, so it is tilted at $\tan\theta = a_0/g$, with the liquid piled up at the back.</li></ul>
[[EX]]
[[EX]]
<div class="note"><b>Which frame?</b> Ground frame: draw only real forces, and the net force equals $m\vec a$. Accelerating frame: real forces plus $-m\vec a_0$, and the body may be at rest. Either works, but never mix them. The 2024 Q7 trap (Section 2.1) is exactly this: an outward centrifugal force exists only in the rotating frame.</div>
[[EX]]`,
      lecture: [
        { h: "Fictitious forces", b: H`$$\vec F_\text{fict} = -m\vec a_0\qquad \vec g_\text{eff} = \vec g - \vec a_0$$<ul><li>Only in a frame accelerating at $\vec a_0$</li><li>Lets you treat moving things as if in equilibrium</li></ul>`, s: "Newton's laws only hold in inertial frames. But we can still work inside an accelerating frame, such as a train or a bus, if we add a fictitious force of minus m times the frame's acceleration to every object. Equivalently, everything behaves as if gravity were the effective gravity: g minus a nought." },
        { h: "Effective gravity", b: H`<ul><li>$|g_\text{eff}| = \sqrt{g^2+a_0^2}$ for horizontal $a_0$</li><li>Points backwards, at $\tan^{-1}(a_0/g)$ to the vertical</li><li>Plumb line hangs along $g_\text{eff}$</li><li>Liquid surface ⟂ $g_\text{eff}$, piled up at the back</li></ul>`, s: "For a horizontal acceleration, effective gravity has magnitude root of g squared plus a nought squared, and it tilts backwards, opposite to the acceleration. A plumb line hangs along effective gravity. A liquid surface settles perpendicular to it, so the surface tilts at angle theta with tan theta equal to a nought over g, and the liquid piles up at the back of the container." },
        { h: "Don't mix frames", b: H`<ul><li><b>Ground frame</b>: real forces only, net force $= m\vec a$</li><li><b>Accelerating frame</b>: real forces $+(-m\vec a_0)$, body may be at rest</li><li>Centrifugal force exists only in the rotating frame</li></ul>`, s: "Pick one frame and stick with it. In the ground frame, use only real forces and set the resultant equal to m a. In the accelerating frame, add the fictitious force and the body may then be in equilibrium. Never mix the two. Now let's see this in the examples." }
      ],
      examples: [
        {
          ref: "2018 Q3", img: ["2018-Q3"], box: "s", ans: "B",
          intro: "SJPO 2018 question 3. A plumb bob of mass m hangs steadily in a train accelerating forward at 0.5 g. Find the tension.",
          steps: [
            { t: H`Vertically: $T\cos\theta = mg$. Horizontally: $T\sin\theta = m(0.5g)$.`, s: "Vertically, the tension's vertical component balances the weight. Horizontally, its horizontal component provides the acceleration of half g." },
            { t: H`Square and add: $T = mg\sqrt{1^2+0.5^2} = 1.12\,mg$. (In the train frame: $T = m g_\text{eff}$.) <b>Answer B</b>`, s: "Square and add the two equations. T equals m g times root of one plus a quarter, which is 1.12 m g. In the train frame, this is simply m times the effective gravity. Answer B." }
          ]
        },
        {
          ref: "2024 Q8", img: ["2024-Q8"], box: "s", ans: "C",
          intro: "SJPO 2024 question 8. In a bus, the surface of a glass of water tilts up towards the right at 35 degrees. What is the bus's acceleration?",
          steps: [
            { t: H`The surface is perpendicular to $\vec g_\text{eff} = \vec g - \vec a_0$. The water piles up on the right, so $\vec g_\text{eff}$ tilts to the right and $\vec a_0$ points <b>left</b>.`, s: "The water surface lies perpendicular to the effective gravity. The water piles up on the right side, so effective gravity tilts to the right, which means the bus accelerates to the left." },
            { t: H`$\tan\theta = \dfrac{a_0}{g} \Rightarrow a_0 = 9.8\tan35^\circ = 6.9$ m s$^{-2}$ to the left. <b>Answer C</b>`, s: "The tilt angle satisfies tan theta equals a nought over g. So a nought is 9.8 times tan 35 degrees, which is 6.9 metres per second squared, to the left. Answer C." }
          ]
        },
        {
          ref: "2022 Q20", img: ["2022-S17", "2022-S19", "2022-Q20"], box: "m", ans: "d",
          intro: "SJPO 2022 question 20. The same block and pulley set up, but now the big block M is free to move. What constant force on M keeps m 1 and m 2 at rest relative to M?",
          steps: [
            { t: H`Everything moves together, so $a = \dfrac{F}{M+m_1+m_2}$ to the right.`, s: "If nothing moves relative to M, the whole system accelerates together, with a equal to F over the total mass." },
            { t: H`In M's frame, a fictitious force $m_1a$ acts on $m_1$ to the <b>left</b>, away from the pulley. For $m_1$ to stay at rest: $T = m_1 a$. For $m_2$ vertically: $T = m_2g$.`, s: "Go into M's frame. The fictitious force on m 1 is m 1 a to the left, pulling it away from the pulley, and it balances the tension. For the hanging block, the tension balances its weight m 2 g. The fictitious force on m 2 just presses it against the side of M." },
            { t: H`$m_1a = m_2g \Rightarrow a = \dfrac{m_2}{m_1}g$, so $F = \dfrac{(M+m_1+m_2)\,m_2}{m_1}g$. <b>Answer (d)</b>`, s: "So m 1 a equals m 2 g, giving a equals m 2 over m 1 times g. Multiplying by the total mass gives F. Answer d." }
          ]
        }
      ]
    }
  ]
});
