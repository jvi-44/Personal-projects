GUIDE.chapters.push({
  n: 9,
  title: "Fluids",
  blurb: "Pressure, buoyancy and flow: Archimedes' principle for floating and sinking, continuity and Bernoulli's equation for moving fluids.",
  outcomes: [
    "use $p = p_0 + \\rho gh$ for pressure in a static fluid",
    "apply Archimedes' principle to floating and submerged bodies",
    "reason about changes of water level when floating ice melts",
    "apply the continuity equation $A_1v_1 = A_2v_2$",
    "apply Bernoulli's equation, including stagnation pressure and Pitot-tube arguments"
  ],
  sections: [
    {
      id: "9.1",
      title: "Pressure and Buoyancy",
      notes: H`
<div class="eq"><div class="eq-label">Hydrostatics</div>$$p = p_0 + \rho gh\qquad\text{Upthrust } U = \rho_\text{fluid}\,V_\text{submerged}\,g$$</div>
<p><b>Archimedes' principle.</b> The upthrust on a body equals the weight of fluid it displaces.</p>
<ul><li><b>Floating</b> body: upthrust $=$ weight, so $\dfrac{V_\text{sub}}{V} = \dfrac{\rho_\text{body}}{\rho_\text{fluid}}$.</li>
<li>Maximum load before sinking: when the whole volume is submerged, $W_\text{max} = \rho_\text{fluid}Vg$ (minus the body's own weight).</li>
<li><b>Specific gravity</b> $=$ density relative to pure water ($1000$ kg m$^{-3}$).</li></ul>
[[EX]]
<h4>Melting ice</h4>
<p>Floating ice displaces its own <b>mass</b> of the liquid it floats in. When it melts, it becomes the same mass of meltwater. Compare the volume of that meltwater with the volume originally displaced:</p>
<ul><li>Pure ice in pure water: same density, so the level is unchanged.</li>
<li>Pure ice in denser seawater: the meltwater (density 1.00) takes up <i>more</i> volume than the seawater displaced (1.03), so the level <b>rises</b>.</li></ul>
[[EX]]`,
      lecture: [
        { h: "Pressure in a fluid", b: H`$$p = p_0 + \rho gh$$<ul><li>Depends only on depth, not container shape</li><li>Acts equally in all directions</li></ul>`, s: "Pressure in a static fluid increases with depth: p equals the surface pressure plus rho g h. It depends only on depth, not on the shape of the container, and at any point it acts equally in all directions." },
        { h: "Archimedes' principle", b: H`$$U = \rho_\text{fluid}V_\text{sub}\,g$$<ul><li>Floating: $V_\text{sub}/V = \rho_\text{body}/\rho_\text{fluid}$</li><li>Max load: fully submerged</li></ul>`, s: "Archimedes' principle says the upthrust equals the weight of fluid displaced. A floating body sinks until it displaces its own weight of fluid, so the submerged fraction equals the ratio of densities. The most a floating body can carry is reached when it is just fully submerged." },
        { h: "Melting ice", b: H`<ul><li>Ice displaces its own <b>mass</b> of liquid</li><li>Melt → same mass of meltwater</li><li>Pure ice in seawater: meltwater is less dense than seawater → level rises</li></ul>`, s: "For melting ice questions, remember that floating ice displaces its own mass of liquid. When it melts it becomes the same mass of water. If it floats in pure water, the meltwater fills exactly the volume it displaced, so the level stays the same. In denser seawater, the fresh meltwater takes up more volume than the seawater it displaced, so the level rises. Let's try the examples." }
      ],
      examples: [
        {
          ref: "2022 Q24", img: ["2022-Q24"], box: "s", ans: "e",
          intro: "SJPO 2022 question 24. How much weight can a massless 200 cubic centimetre Styrofoam cup carry before it sinks?",
          steps: [
            { t: H`Maximum upthrust when fully submerged: $U = \rho Vg = (1000)(200\times10^{-6})(9.8) = 1.96$ N.`, s: "The maximum upthrust occurs when the cup is fully submerged: rho V g, which is 1000 times 200 times ten to the minus six times 9.8. That's 1.96 newtons." },
            { t: H`The cup is massless, so it can carry about $2$ N. <b>Answer (e)</b>`, s: "Since the cup itself is weightless, it can carry about 2 newtons before sinking. Answer e." }
          ]
        },
        {
          ref: "2022 Q25–26", img: ["2022-S25", "2022-Q25", "2022-Q26"], box: "m", ans: "Q25 d, Q26 a",
          intro: "SJPO 2022 questions 25 and 26. Pure ice of specific gravity 0.92 floats in seawater of specific gravity 1.03. What percentage is above water, and what happens to the level when it melts?",
          steps: [
            { t: H`Floating: $\dfrac{V_\text{sub}}{V} = \dfrac{0.92}{1.03} = 0.893$, so $10.7\% \approx 11\%$ is above the surface. <b>Q25 answer (d)</b>`, s: "The submerged fraction is 0.92 over 1.03, which is 0.893. So about 10.7 percent, roughly 11 percent, is above the surface. Answer d." },
            { t: H`Q26: the ice displaces seawater of volume $\dfrac{m}{1.03\rho_w}$. When melted it becomes pure water of volume $\dfrac{m}{1.00\rho_w}$, which is larger.`, s: "For question 26, the ice of mass m displaces seawater of volume m over 1.03 rho w. When it melts, it becomes pure water of volume m over 1.00 rho w, which is larger." },
            { t: H`The meltwater needs more room than the hole it left, so the level <b>rises</b>. <b>Q26 answer (a)</b>`, s: "The meltwater needs more room than the volume the ice displaced, so the level rises. Answer a." }
          ]
        }
      ]
    },
    {
      id: "9.2",
      title: "Fluid Flow: Continuity and Bernoulli",
      notes: H`
<p>For steady flow of an incompressible fluid:</p>
<div class="eq"><div class="eq-label">Continuity and Bernoulli</div>$$A_1v_1 = A_2v_2\qquad\qquad p + \tfrac12\rho v^2 + \rho gh = \text{constant along a streamline}$$</div>
<ul><li><b>Continuity:</b> where the flow is faster, the stream is narrower. Water speeding up as it falls from a tap gets thinner.</li>
<li><b>Stagnation point:</b> where moving fluid is brought to rest (the open end of a Pitot / L-shaped tube facing the flow), the pressure rises by $\tfrac12\rho v^2$. The water in the tube stands $h = \dfrac{v^2}{2g}$ above the free surface.</li>
<li><b>Large tank:</b> the speed of the free surface is negligible. Efflux speed from depth $l$ is $\sqrt{2gl}$ (Torricelli).</li>
<li>Pressure in a liquid can't drop below zero (the liquid would boil or break). That limit sets, for example, the maximum height of a siphon.</li></ul>
[[EX]]
[[EX]]`,
      lecture: [
        { h: "Continuity", b: H`$$A_1v_1 = A_2v_2$$<p class="small">Incompressible flow: faster means narrower.</p>`, s: "For an incompressible fluid in steady flow, the volume flow rate is constant: A one v one equals A two v two. Wherever the fluid moves faster, the stream must be narrower. That's why water falling from a tap gets thinner as it speeds up." },
        { h: "Bernoulli's equation", b: H`$$p + \tfrac12\rho v^2 + \rho gh = \text{const}$$<ul><li>Energy conservation per unit volume</li><li>Faster flow ⇒ lower pressure (same height)</li></ul>`, s: "Bernoulli's equation is energy conservation for a fluid, per unit volume. Pressure plus a half rho v squared plus rho g h is constant along a streamline. At the same height, faster flow means lower pressure." },
        { h: "Stagnation, Torricelli and limits", b: H`<ul><li>Fluid brought to rest: $\Delta p = \tfrac12\rho v^2$, so $h = v^2/2g$</li><li>Large tank: efflux $v = \sqrt{2gl}$</li><li>Liquid pressure ≥ 0 sets maximum heights</li></ul>`, s: "Three handy consequences. Where flowing fluid is brought to rest, its pressure rises by a half rho v squared, so water in a Pitot tube rises by v squared over two g. Liquid leaving a large tank from depth l comes out at root two g l. And since a liquid's pressure can't go below zero, that sets the limit on how high a siphon can lift. Let's try the examples." }
      ],
      examples: [
        {
          ref: "2022 Q22", img: ["2022-Q22"], box: "s", ans: "a",
          intro: "SJPO 2022 question 22. Water falls vertically from a tap. What happens to the diameter of the column?",
          steps: [
            { t: H`Falling water speeds up under gravity, so $v$ increases downward.`, s: "As the water falls, gravity speeds it up." },
            { t: H`Continuity: $Av = $ constant, so $A$ decreases and the diameter <b>decreases</b>. The Coriolis options are irrelevant at this scale. <b>Answer (a)</b>`, s: "By continuity, A times v is constant, so the cross sectional area must decrease. The column gets thinner. The hemisphere options are distractors. Answer a." }
          ]
        },
        {
          ref: "2024 Q24", img: ["2024-Q24"], box: "s", ans: "A",
          intro: "SJPO 2024 question 24. An L shaped pipe faces a river current. Water inside rises 0.50 metres above the river surface. Find the flow speed.",
          steps: [
            { t: H`At the mouth the water is brought to rest (stagnation): $p_\text{mouth} = p + \tfrac12\rho v^2$. This extra pressure supports a column of height $h$: $\tfrac12\rho v^2 = \rho gh$.`, s: "At the mouth of the pipe, the flowing water is brought to rest, so its pressure rises by a half rho v squared. That extra pressure holds up the column of height h, so a half rho v squared equals rho g h." },
            { t: H`$v = \sqrt{2gh} = \sqrt{2(9.8)(0.50)} = 3.1$ m s$^{-1}$. <b>Answer A</b>`, s: "So v is root of two g h, which is root of 9.8, about 3.1 metres per second. Answer A." }
          ]
        }
      ]
    }
  ]
});
