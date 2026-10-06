GUIDE.chapters.push({
  n: 4,
  title: "Work, Energy and Power",
  blurb: "Energy methods skip the details of the motion: track where the energy goes, and the speed, height or compression falls out.",
  outcomes: [
    "calculate work done by constant forces, and by a spring as the area under a force–extension graph",
    "apply the work–energy theorem $W_\\text{net} = \\Delta K$",
    "use gravitational and elastic potential energy, and conservation of mechanical energy",
    "account for work done by friction and other resistive forces as energy dissipated",
    "relate power to force and velocity, $P = Fv$"
  ],
  sections: [
    {
      id: "4.1",
      title: "Work and the Work–Energy Theorem",
      notes: H`
<div class="def"><b>Work done</b> by a constant force $\vec F$ over a displacement $\vec s$: $\;W = \vec F\cdot\vec s = Fs\cos\theta$. For a variable force, $W = \int F\,dx$, which is the area under the $F$–$x$ graph.</div>
<div class="eq"><div class="eq-label">Work–energy theorem</div>$$W_\text{net} = \Delta K = \tfrac12mv^2 - \tfrac12mu^2$$</div>
<h4>Springs</h4>
<p>A Hookean spring exerts $F = -kx$, where $x$ is the extension from natural length. Its elastic potential energy is $U = \tfrac12kx^2$. The work done <b>by the spring</b> as the extension changes from $x_1$ to $x_2$ is</p>
$$W_\text{spring} = -\Delta U = \tfrac12k\left(x_1^2 - x_2^2\right)$$
<p>Positive work by the spring means its stored energy decreased. Only $x^2$ matters, so a compression of 3 cm stores the same energy as an extension of 3 cm.</p>
[[EX]]
<h4>Gravitational potential energy</h4>
<p>Near the surface, $\Delta U = mg\,\Delta h$. For an extended body, $h$ is the height of its <b>centre of mass</b>, so lifting a uniform rod hinged at one end raises its CM by $\tfrac12 l\,\Delta(\sin\theta)$.</p>
<p>The work you must do to change a configuration <i>slowly</i>, without giving it kinetic energy, equals the increase in potential energy.</p>
[[EX]]
<h4>Power</h4>
$$P = \frac{dW}{dt} = Fv\qquad\text{efficiency} = \frac{\text{useful power out}}{\text{power in}}$$`,
      lecture: [
        { h: "Work done", b: H`$$W = \vec F\cdot\vec s = Fs\cos\theta$$<ul><li>Only the component along the motion does work</li><li>Variable force: area under $F$–$x$ graph</li></ul>`, s: "Work done by a constant force is the dot product of force and displacement: F s cos theta. Only the component of force along the motion does work. A force perpendicular to the motion, like the normal force on a level road, does no work at all. For a variable force, work is the area under the force displacement graph." },
        { h: "Work–energy theorem", b: H`$$W_\text{net} = \Delta K = \tfrac12mv^2 - \tfrac12mu^2$$<p class="small">The net work by <b>all</b> forces equals the change in kinetic energy.</p>`, s: "The work energy theorem says the total work done by all forces on a body equals its change in kinetic energy. It's often the fastest way to find a speed, or the net work done on a body, without worrying about time." },
        { h: "Springs", b: H`$$F = -kx\qquad U = \tfrac12kx^2$$$$W_\text{by spring} = \tfrac12k(x_1^2 - x_2^2)$$`, s: "A spring obeying Hooke's law stores elastic potential energy one half k x squared, where x is the extension or compression. The work done by the spring equals the decrease in that stored energy. Notice that only x squared matters, so compressions and extensions of the same size store the same energy." },
        { h: "Gravity, slow processes and power", b: H`<ul><li>$\Delta U = mg\,\Delta h_\text{cm}$: use the <b>centre of mass</b> height</li><li>Slow change: work done = increase in PE</li><li>$P = Fv$</li></ul>`, s: "For gravitational potential energy near the surface, use the change in height of the centre of mass. When a configuration is changed slowly, no kinetic energy is produced, so the work you do simply equals the increase in potential energy. And power is the rate of doing work, which for a force moving at velocity v is F times v." }
      ],
      examples: [
        {
          ref: "2022 Q8", img: ["2022-S8", "2022-Q8"], box: "m", ans: "a",
          intro: "SJPO 2022 question 8. A 10 newton force holds a block on a spring at 5 centimetres extension. How much work does the spring do as the block moves from plus 5 to minus 3 centimetres?",
          steps: [
            { t: H`$k = \dfrac{F}{x} = \dfrac{10}{0.050} = 200$ N m$^{-1}$. The spring constant can be found, so (e) is wrong.`, s: "First find k. A force of 10 newtons holds 5 centimetres of extension, so k is 200 newtons per metre. So option e is a trap." },
            { t: H`$W_\text{spring} = \tfrac12k(x_1^2 - x_2^2) = \tfrac12(200)(0.050^2 - 0.030^2) = +0.16$ J. <b>Answer (a)</b>`, s: "The work done by the spring is a half k times the initial extension squared minus the final compression squared. That's 100 times 0.0025 minus 0.0009, which is plus 0.16 joules. It's positive because the spring's stored energy decreased. Answer a." }
          ]
        },
        {
          ref: "2024 Q13", img: ["2024-Q13"], box: "m", ans: "A",
          intro: "SJPO 2024 question 13. An umbrella has 6 uniform rods of mass 0.05 kilograms and length 1 metre. They go from 80 degrees below horizontal when closed to 20 degrees when open. How much work opens it?",
          steps: [
            { t: H`Each rod hangs from the top at angle $\alpha$ below horizontal, so its CM is $\tfrac{l}{2}\sin\alpha$ below the hub.`, s: "Each rod hangs down from the central hub. A rod at angle alpha below the horizontal has its centre of mass l over 2 sine alpha below the hub." },
            { t: H`Opening raises each CM by $\tfrac{l}{2}(\sin80^\circ - \sin20^\circ) = 0.5(0.985 - 0.342) = 0.321$ m.`, s: "Opening the umbrella raises each centre of mass by a half times sine 80 minus sine 20, which is 0.321 metres." },
            { t: H`$W = 6\,mg\,\Delta h = 6(0.05)(9.8)(0.321) = 0.95$ J. <b>Answer A</b>`, s: "The work needed is the total gain in potential energy: 6 times 0.05 times 9.8 times 0.321, which is 0.95 joules. Answer A." }
          ]
        }
      ]
    },
    {
      id: "4.2",
      title: "Conservation of Energy and Dissipation",
      notes: H`
<p>If only <b>conservative</b> forces (gravity, springs) do work, mechanical energy is conserved:</p>
<div class="eq"><div class="eq-label">Energy conservation</div>$$K_i + U_i = K_f + U_f \qquad\text{in general:}\qquad K_i + U_i + W_\text{non-cons} = K_f + U_f$$</div>
<p>Work by friction and drag ($W_\text{non-cons} < 0$) is dissipated as thermal energy. For kinetic friction on a level surface, energy dissipated $= \mu_k mg\,d$.</p>
<h4>Turning points</h4>
<p>At the lowest point of a bungee jump, or the maximum compression of a spring, the body is momentarily at rest, so $K = 0$ there. Measure gravitational PE from that lowest point to make the algebra short.</p>
[[EX]]
<h4>Where did the energy go?</h4>
<p>When a mass is added gently to a spring and released, it oscillates and eventually settles, usually lower. The resistive forces dissipate exactly the difference between the initial and final <b>total potential energy</b> (gravitational plus elastic), because the body starts and ends at rest.</p>
[[EX]]`,
      lecture: [
        { h: "Conservation of mechanical energy", b: H`$$K_i + U_i = K_f + U_f$$<ul><li>Only conservative forces doing work: gravity, springs</li><li>Normal forces on fixed surfaces do no work</li></ul>`, s: "When only conservative forces, like gravity and springs, do work, the total mechanical energy, kinetic plus potential, stays constant. Normal forces from fixed surfaces don't do work because they act perpendicular to the motion, so a smooth track conserves energy too." },
        { h: "Including friction and drag", b: H`$$K_i + U_i + W_\text{nc} = K_f + U_f$$<ul><li>$W_\text{nc} < 0$ for friction: energy becomes heat</li><li>Level surface: heat $= \mu_k mg\,d$</li></ul>`, s: "With friction or drag, add the work done by these non conservative forces. That work is negative, and the lost mechanical energy becomes thermal energy. On a level surface, the heat produced by kinetic friction is mu k m g times the sliding distance." },
        { h: "Turning points and settling", b: H`<ul><li>Lowest point / max compression: $K = 0$</li><li>Choose PE zero at the lowest point</li><li>Starts and ends at rest: energy dissipated = drop in total PE</li></ul>`, s: "At turning points like the lowest point of a bungee jump, the body is momentarily at rest, so kinetic energy is zero there. If a system starts and ends at rest, all the potential energy lost, gravitational plus elastic, must have been dissipated by the resistive forces. Let's see both ideas in action." }
      ],
      examples: [
        {
          ref: "2018 Q19", img: ["2018-Q19"], box: "m", ans: "C",
          intro: "SJPO 2018 question 19. Two 60 kilogram students jump together off a 43 metre bridge on a bungee cord of stiffness 330 newtons per metre, just reaching the water. Find the cord's unstretched length.",
          steps: [
            { t: H`At the water they are momentarily at rest, so all the GPE lost is stored in the cord: $mgh = \tfrac12kx^2$ with $m = 120$ kg, $h = 43$ m.`, s: "At the water they are momentarily at rest. So all the gravitational potential energy they lose over 43 metres is stored in the stretched cord. The mass is 120 kilograms." },
            { t: H`$x = \sqrt{\dfrac{2(120)(9.80)(43)}{330}} = 17.5$ m.`, s: "So the extension x is root of two times 120 times 9.8 times 43, over 330, which is 17.5 metres." },
            { t: H`Unstretched length $= 43 - 17.5 = 25.5$ m. <b>Answer C</b>`, s: "The unstretched length is 43 minus 17.5, which is 25.5 metres. Answer C. Option B is the extension, a common slip." }
          ]
        },
        {
          ref: "2024 Q15", img: ["2024-Q15"], box: "l", ans: "E",
          intro: "SJPO 2024 question 15. A mass m hangs at rest on a spring. Extra mass is added so the total is M, then released. It oscillates and settles. How much work do the resistive forces do?",
          steps: [
            { t: H`Initial and final rest positions: $kx_0 = mg$ and $kx_f = Mg$. The mass is at rest at both, so $W_\text{res} = \Delta U_\text{total}$.`, s: "Before release the spring extension satisfies k x nought equals m g. At the final rest position, k x f equals M g. The system is at rest at both moments, so the resistive work equals the change in total potential energy." },
            { t: H`$\Delta U = \tfrac12kx_f^2 - \tfrac12kx_0^2 - Mg(x_f - x_0)$`, s: "The change in elastic energy is a half k x f squared minus a half k x nought squared. The mass M drops by x f minus x nought, losing M g times that in gravitational energy." },
            { t: H`Substituting $x = \dfrac{\text{weight}}{k}$: $\;\Delta U = \dfrac{g^2}{2k}\left[(M^2-m^2) - 2M(M-m)\right] = -\dfrac{(M-m)^2g^2}{2k}$. <b>Answer E</b>`, s: "Substitute the extensions and factorise. You get g squared over two k, times M squared minus m squared minus two M times M minus m. That simplifies to minus M minus m all squared, g squared over two k. Answer E. The negative sign makes sense, since resistive forces remove energy." }
          ]
        }
      ]
    }
  ]
});
