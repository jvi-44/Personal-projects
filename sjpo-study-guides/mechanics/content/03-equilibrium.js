GUIDE.chapters.push({
  n: 3,
  title: "Forces in Equilibrium",
  blurb: "Statics: when nothing accelerates and nothing turns. Resolving forces, moments, centre of mass, and the moment a support goes slack or a body tips.",
  outcomes: [
    "state the two conditions for equilibrium of a rigid body",
    "resolve forces and solve for unknowns using components or a closed vector triangle",
    "calculate moments and apply the principle of moments about a well-chosen pivot",
    "locate the centre of mass of composite bodies",
    "find the condition for a support to go slack or a body to tip about an edge"
  ],
  sections: [
    {
      id: "3.1",
      title: "Equilibrium of Concurrent Forces",
      notes: H`
<p>A body is in <b>translational equilibrium</b> when the resultant force on it is zero:</p>
<div class="eq"><div class="eq-label">Translational equilibrium</div>$$\sum F_x = 0,\qquad \sum F_y = 0\qquad(\text{three coplanar forces: they form a closed triangle})$$</div>
<ul><li>Resolve every force along two perpendicular axes. Choose axes that line up with as many forces as possible.</li>
<li>A <b>normal force</b> is perpendicular to the contact surface. On a curved surface $y = f(x)$, the surface makes angle $\phi$ with the horizontal where $\tan\phi = \dfrac{dy}{dx}$. The normal force makes the same angle $\phi$ with the vertical.</li>
<li>Smooth spheres in contact push on each other along the <b>line joining their centres</b>.</li></ul>
[[EX]]
[[EX]]
[[EX]]`,
      lecture: [
        { h: "Translational equilibrium", b: H`$$\sum F_x = 0\qquad \sum F_y = 0$$<ul><li>Resolve along two perpendicular axes</li><li>Three forces in equilibrium → closed triangle</li></ul>`, s: "Statics begins with translational equilibrium: the resultant force is zero, so the components along any two perpendicular axes each add to zero. Choose axes that line up with as many forces as possible to keep the algebra short. If exactly three forces act, they form a closed triangle, and you can sometimes use the sine rule directly." },
        { h: "Normal forces on curves and spheres", b: H`<ul><li>Normal ⟂ surface; on $y=f(x)$: $\tan\phi = dy/dx$</li><li>Normal makes angle $\phi$ with the vertical</li><li>Smooth spheres: contact force along the line of centres</li></ul>`, s: "Normal forces are always perpendicular to the surface. For a curved surface given by y equals f of x, the slope d y by d x gives the tangent angle phi, and the normal is tilted by the same angle from the vertical. When two smooth spheres touch, they push on each other along the line joining their centres. Let's apply these ideas." }
      ],
      examples: [
        {
          ref: "2018 Q12", img: ["2018-Q12"], box: "m", ans: "A",
          intro: "SJPO 2018 question 12. A peg is pulled by rope A with 600 newtons at 60 degrees to the horizontal, and by rope B at angle theta to the vertical. The resultant must be 1600 newtons vertically. Find the tension in rope B.",
          steps: [
            { t: H`Horizontal components cancel: $T\sin\theta = 600\cos60^\circ = 300$ N.`, s: "For the resultant to be vertical, the horizontal components must cancel. So T sine theta equals 600 cos 60, which is 300 newtons." },
            { t: H`Vertical components sum to 1600 N: $T\cos\theta = 1600 - 600\sin60^\circ = 1080$ N.`, s: "The vertical components add up to 1600, so T cos theta equals 1600 minus 600 sine 60, which is 1080 newtons." },
            { t: H`$T = \sqrt{300^2 + 1080^2} = 1121$ N. <b>Answer A</b>`, s: "Square and add: T is root of 300 squared plus 1080 squared, which is 1121 newtons. Answer A." }
          ]
        },
        {
          ref: "2026 Q11", img: ["2026-Q11"], box: "m", ans: "(d)",
          intro: "SJPO 2026 question 11. Two smooth identical spheres of radius r are packed in a box of width two plus root two, times r. Find the force between the spheres.",
          steps: [
            { t: H`Centres are at $x = r$ and $x = (2+\sqrt2)r - r$, so their horizontal separation is $\sqrt2\,r$. The distance between centres is $2r$.`, s: "The lower sphere's centre is r from the left wall, and the upper sphere's centre is r from the right wall. So their horizontal separation is root two r, while the distance between centres is two r." },
            { t: H`Angle of the line of centres to the horizontal: $\cos\theta = \dfrac{\sqrt2 r}{2r} \Rightarrow \theta = 45^\circ$.`, s: "So the line of centres makes an angle theta with cos theta equal to root two over two. That is 45 degrees." },
            { t: H`Upper sphere: walls push horizontally only, so the vertical part of $N$ balances $mg$: $N\sin45^\circ = mg \Rightarrow N = \sqrt2\,mg$. <b>Answer (d)</b>`, s: "For the upper sphere, the wall pushes horizontally, so only the contact force from the lower sphere can hold it up. Its vertical component, N sine 45, equals m g. So N is root two m g. Answer d." }
          ]
        },
        {
          ref: "2018 Q6", img: ["2018-Q6"], box: "l", ans: "C",
          intro: "SJPO 2018 question 6. A 4 kilogram sphere rests on the smooth surface y equals 2.5 x squared at the point 0.4, 0.4. A cable at 60 degrees to the horizontal runs over a pulley to block B. Find the mass of B.",
          steps: [
            { t: H`Slope: $\dfrac{dy}{dx} = 5x = 2.0$ at $x = 0.4$, so $\tan\phi = 2$. The normal force makes angle $\phi$ with the vertical: $N_x = N\sin\phi$ (left), $N_y = N\cos\phi$.`, s: "First, the slope of the surface at x equals 0.4 is 5 x, which is 2. So the tangent angle phi has tan phi equal to 2, and the normal force is tilted by phi from the vertical, pointing up and to the left." },
            { t: H`Horizontal: $T\cos60^\circ = N\sin\phi$. Vertical: $T\sin60^\circ + N\cos\phi = m_Ag$.`, s: "Horizontally, the cable's component T cos 60 balances N sine phi. Vertically, T sine 60 plus N cos phi balances the weight." },
            { t: H`Eliminate $N$: $T\left(\sin60^\circ + \dfrac{\cos60^\circ}{\tan\phi}\right) = m_Ag \Rightarrow T(0.866 + 0.25) = 4g \Rightarrow T = 3.58g$.`, s: "Eliminating N, T times sine 60 plus cos 60 over tan phi equals 4 g. That bracket is 0.866 plus 0.25, so T equals 3.58 g." },
            { t: H`The pulley transmits $T = m_Bg$, so $m_B = 3.58$ kg. <b>Answer C</b>`, s: "The cable passes over the pulley to block B, so T equals m B g, and m B is 3.58 kilograms. Answer C." }
          ]
        }
      ]
    },
    {
      id: "3.2",
      title: "Moments and Centre of Mass",
      notes: H`
<div class="def"><b>Moment</b> (torque) of a force about a point $=$ force $\times$ perpendicular distance from the point to the line of action of the force: $\tau = Fd_\perp = Fr\sin\theta$.</div>
<div class="eq"><div class="eq-label">Conditions for equilibrium of a rigid body</div>$$\sum\vec F = 0\qquad\text{and}\qquad \sum\tau = 0\ \text{about } \textbf{any} \text{ point}$$</div>
<p><b>Choose the pivot wisely.</b> Take moments about the point where the unknown force you <i>don't</i> care about acts, because that force then has no moment.</p>
<h4>Centre of mass</h4>
<p>The weight of a body acts at its centre of mass (CM). For a collection of parts:</p>
$$x_\text{cm} = \frac{\sum m_ix_i}{\sum m_i}$$
<p>For a uniform rod, the CM is at its midpoint. Use symmetry wherever you can.</p>
[[EX]]
<h4>Going slack and tipping</h4>
<ul><li>A support (string, prop or edge) <b>goes slack</b> or loses contact when the force it must exert drops to zero. At that instant, the CM of the whole system lies directly above or below the remaining support.</li>
<li>A body on the point of <b>tipping</b> about an edge carries all its contact force at that edge. Take moments about the edge.</li>
<li>To find the minimum force needed to topple something, apply it so that it has the <b>largest possible moment arm</b>.</li></ul>
[[EX]]
[[EX]]`,
      lecture: [
        { h: "Moments", b: H`$$\tau = F\,d_\perp = Fr\sin\theta$$<ul><li>$d_\perp$: perpendicular distance from pivot to line of action</li><li>Rigid body in equilibrium: $\sum F = 0$ <b>and</b> $\sum\tau = 0$ about any point</li></ul>`, s: "The moment of a force about a point is the force times the perpendicular distance from the point to the force's line of action. A rigid body is in equilibrium only if both the resultant force and the resultant moment are zero. And if the moments balance about one point, they balance about every point." },
        { h: "Choosing the pivot", b: H`<ul><li>Take moments about where an unwanted unknown force acts</li><li>That force then has zero moment and drops out</li></ul>`, s: "That freedom is your best tool. Take moments about the point where an unknown force you don't care about acts. Its moment arm is zero, so it vanishes from the equation, often leaving just one unknown." },
        { h: "Centre of mass", b: H`$$x_\text{cm} = \frac{\sum m_i x_i}{\sum m_i}$$<ul><li>Weight acts at the CM</li><li>Uniform rod: midpoint; use symmetry</li></ul>`, s: "The weight of a body acts at its centre of mass. For several parts, the centre of mass is the mass-weighted average of their positions. For uniform shapes, use symmetry: a uniform rod's centre of mass is at its midpoint." },
        { h: "Slack and tipping", b: H`<ul><li>Support goes slack when its force reaches zero → CM directly over the other support</li><li>On the point of tipping: all contact force at the pivot edge</li><li>Minimum toppling force: maximise its moment arm</li></ul>`, s: "Many Olympiad statics questions ask when something just goes slack or just tips. At that instant the force from one support drops to zero, so the system's centre of mass lies directly over the remaining support. For tipping, all the contact force concentrates at the edge being pivoted about, so take moments there. To topple something with the least force, apply the force where it has the longest moment arm." }
      ],
      examples: [
        {
          ref: "2018 Q5", img: ["2018-Q5"], box: "s", ans: "C",
          intro: "SJPO 2018 question 5. A wire is bent into a three sided U shape with equal sides of length l. How high above the bottom is its centre of mass?",
          steps: [
            { t: H`Each segment has mass $m$. The two vertical sides have CM at height $l/2$, and the bottom has its CM at height $0$.`, s: "Give each side mass m. The two vertical sides each have their centre of mass at height l over two, and the bottom side's is at height zero." },
            { t: H`$y_\text{cm} = \dfrac{m(l/2) + m(l/2) + m(0)}{3m} = \dfrac{l}{3}$. <b>Answer C</b>`, s: "So the centre of mass is at m l over 2 plus m l over 2 plus zero, all over 3 m, which is l over 3. Answer C." }
          ]
        },
        {
          ref: "2026 Q9", img: ["2026-Q9"], box: "m", ans: "(a)",
          intro: "SJPO 2026 question 9. A uniform rod of mass M hangs from two strings a distance l apart. A small block m is slowly moved to the right. At what distance from the centre does a string go slack?",
          steps: [
            { t: H`The left string goes slack when its tension reaches zero. The system is then supported by the right string alone, so its CM must lie directly below that string, at $x = l/2$.`, s: "The left string goes slack when its tension drops to zero. Then the right string holds everything alone, so the centre of mass of rod plus block must lie directly below the right string, at distance l over two from the centre." },
            { t: H`Taking the rod's centre as origin: $\dfrac{M(0) + m x}{M+m} = \dfrac{l}{2}$`, s: "Taking the rod's centre as the origin, the centre of mass position is m x over M plus m. Set that equal to l over 2." },
            { t: H`$x = \dfrac{l}{2}\cdot\dfrac{M+m}{m}$. <b>Answer (a)</b>`, s: "So x equals l over 2 times M plus m, over m. Answer a." }
          ]
        },
        {
          ref: "2024 Q9", img: ["2024-Q9"], box: "m", ans: "D",
          intro: "SJPO 2024 question 9. A cube of mass M and side L is pushed horizontally against a step of height L over 3. What is the smallest horizontal force that rolls it up the step?",
          steps: [
            { t: H`As the box starts to rise, it pivots about the step's corner and loses contact with the ground. Take moments about that corner.`, s: "As the box begins to lift, it pivots about the corner of the step and leaves the ground. So take moments about that corner. The contact force there has no moment." },
            { t: H`For the minimum force, apply $F$ at the top of the box. Its arm about the corner is $L - \tfrac13L = \tfrac23L$. The weight's arm is the horizontal distance to the CM, $\tfrac12L$.`, s: "To use the least force, push at the top edge, where its moment arm about the corner is L minus L over 3, which is two thirds L. The weight acts at the centre, a horizontal distance L over 2 from the corner." },
            { t: H`$F\cdot\tfrac23L = Mg\cdot\tfrac12L \Rightarrow F = \tfrac34Mg$. <b>Answer D</b>`, s: "Balance the moments: F times two thirds L equals M g times half L. So F is three quarters M g. Answer D." }
          ]
        }
      ]
    }
  ]
});
