// Tutorial questions: no working space in the guide; solutions in the Solutions PDF.
GUIDE.tutorials.push(
  {
    ch: 1, ref: "2024 Q10", img: ["2024-Q10"], ans: "B",
    steps: [
      { t: H`Use axes along ($\parallel$) and perpendicular ($\perp$) to the slope: $g_\perp = g\cos\theta$, $g_\parallel = g\sin\theta$ down the slope.` },
      { t: H`$\perp$ motion: each elastic bounce reverses $v_\perp$ with the same magnitude, so every hop has the same flight time $2v_\perp/g_\perp$ and the same maximum height from the ramp. I is false, III is true.` },
      { t: H`$\parallel$ motion: $v_\parallel$ keeps increasing (it is never reversed), so each hop covers a longer distance along the slope. II is true. The angle to the ramp, $\tan^{-1}(v_\perp/v_\parallel)$, therefore decreases. IV is false.` },
      { t: H`II and III only. <b>Answer B</b>` }
    ]
  },
  {
    ch: 1, ref: "2026 Q8", img: ["2026-Q8"], ans: "(d)",
    steps: [
      { t: H`In the steady state, the droplet reaches the same speed $v$ just before every collision and leaves each collision at $v/2$.` },
      { t: H`Free fall through $h$ between leaves: $v^2 = \left(\tfrac v2\right)^2 + 2gh \Rightarrow \tfrac34v^2 = 2gh$.` },
      { t: H`$v = \sqrt{\tfrac83gh}$. <b>Answer (d)</b>` }
    ]
  },
  {
    ch: 1, ref: "2018 Q11", img: ["2018-Q11"], ans: "B",
    steps: [
      { t: H`Relative to the trailer, the car's front must travel: trailer length $+$ car length (to clear) $+$ one more car length $= 15.0 + 3.5 + 3.5 = 22.0$ m.` },
      { t: H`Relative velocity starts at $0$ (both at 10 m s$^{-1}$) and rises linearly to $35 - 10 = 25$ m s$^{-1}$ at time $T$. Relative displacement is the area between the graphs: $\tfrac12(25)T$.` },
      { t: H`$\tfrac12(25)T = 22.0 \Rightarrow T = 1.76$ s. <b>Answer B</b>` }
    ]
  },
  {
    ch: 2, ref: "2026 Q12", img: ["2026-Q12"], ans: "(b)",
    steps: [
      { t: H`Block 2 hangs at a horizontal distance from the pulley, so the string to it makes an angle $\theta$ with the horizontal. The tension is the same throughout.` },
      { t: H`Horizontal equations: block 1, $ma_1 = T$; block 2, $ma_2 = T\cos\theta \le T$.` },
      { t: H`So $a_1 \ge a_2$ at every instant. Both start from rest and must cover the same horizontal distance $L$, so block 1 gets there first. <b>Answer (b)</b>` }
    ]
  },
  {
    ch: 3, ref: "2024 Q16", img: ["2024-Q16"], ans: "E",
    steps: [
      { t: H`The plank (massless) carries $4m$ at the back and $m$ at the front. Its CM is $\dfrac{m L}{5m} = \dfrac L5$ from the back mass.` },
      { t: H`While the plank is pushed out over the gap, it tips once its CM passes the near cliff edge. At the maximum gap, the front just reaches the far cliff when the CM is exactly at the edge.` },
      { t: H`Distance from the edge to the front $= L - \tfrac L5$, so $D_\text{max} = \tfrac45L$. <b>Answer E</b>` }
    ]
  },
  {
    ch: 4, ref: "2022 Q14–16", img: ["2022-S14", "2022-Q14", "2022-Q15", "2022-Q16"], ans: "Q14 e (key: a), Q15 b, Q16 c",
    steps: [
      { t: H`Energy: $\tfrac12mu^2 + mgh = \mu_kmg\,D \Rightarrow D = \dfrac{u^2/2 + gh}{\mu_k g}$ (frictionless except the rough section).` },
      { t: H`Q14: halving $h$ halves only the $gh$ term. The new distance is $D' = \dfrac{u^2/2 + gh/2}{\mu_k g}$, and $D'/D$ depends on $h$, which is not given. Strictly, the change <b>cannot be determined (e)</b>. The official key gives (a) "halved", which holds only if the initial KE is negligible ($u^2 \ll 2gh$).` },
      { t: H`Q15: $m$ cancels, so $D$ is <b>unchanged</b>. <b>(b)</b>` },
      { t: H`Q16: heat $= \tfrac12mu^2 + mgh \propto m$, so doubling $m$ <b>doubles</b> it. <b>(c)</b>` }
    ],
    note: H`Q14: the official key says (a). That assumes the 2 m s$^{-1}$ initial speed contributes negligible energy. Taken literally, $D$ is not exactly halved, and since $h$ is not given the factor cannot be found, which is (e). Either could have been the setters' intent. What matters is that you can explain the difference.`
  },
  {
    ch: 4, ref: "2024 Q14", img: ["2024-Q14"], ans: "E",
    steps: [
      { t: H`Just before the top masses collide, both strings are vertical. The bottom mass then has no horizontal velocity, by symmetry. Its velocity relative to each top mass must be perpendicular to the (vertical) string, so its vertical velocity is also zero. It is momentarily at rest.` },
      { t: H`The bottom mass has fallen $\ell$: $mg\ell = 2\cdot\tfrac12mv^2 \Rightarrow v = \sqrt{g\ell}$ for each top mass.` },
      { t: H`Relative velocity $= 2v = 2\sqrt{g\ell} = \sqrt{4g\ell}$. <b>Answer E</b>` }
    ]
  },
  {
    ch: 5, ref: "2026 Q16", img: ["2026-Q16"], ans: "(a)",
    steps: [
      { t: H`Equal masses, elastic, one at rest: $\vec u = \vec v_1 + \vec v_2$ and $u^2 = v_1^2 + v_2^2$.` },
      { t: H`Squaring the first and subtracting the second: $2\vec v_1\cdot\vec v_2 = 0$, so the final velocities are perpendicular: $\theta_1 + \theta_2 = 90^\circ$.` },
      { t: H`$\theta_2 = 90^\circ - 75^\circ = 15^\circ$. <b>Answer (a)</b>` }
    ]
  },
  {
    ch: 6, ref: "2024 Q17", img: ["2024-Q17"], ans: "D",
    steps: [
      { t: H`When the ant leaves the surface, there is no horizontal force on it. It moves in a straight line along the <b>tangent</b> with speed $v = \omega\cdot\tfrac35R$.` },
      { t: H`Distance along the tangent from its position to the rim: $\sqrt{R^2 - \left(\tfrac35R\right)^2} = \tfrac45R$.` },
      { t: H`$t = \dfrac{\frac45R}{\frac35\omega R} = \dfrac{4}{3\omega}$. <b>Answer D</b>` }
    ]
  },
  {
    ch: 6, ref: "2026 Q20", img: ["2026-Q20"], ans: "(e)",
    steps: [
      { t: H`Static friction supplies both the tangential force $mR\alpha$ and the centripetal force $mR\omega^2 = mR\alpha^2t^2$, which are perpendicular.` },
      { t: H`$f = mR\sqrt{\alpha^2 + \alpha^4t^4}$. It slips when $f = \mu_smg$.` },
      { t: H`$\alpha^2 + \alpha^4t^4 = \dfrac{\mu_s^2g^2}{R^2} \Rightarrow t = \left(\dfrac{\mu_s^2g^2}{R^2\alpha^4} - \dfrac1{\alpha^2}\right)^{1/4}$. <b>Answer (e)</b>` }
    ]
  },
  {
    ch: 7, ref: "2024 Q22", img: ["2024-Q22"], ans: "B",
    steps: [
      { t: H`I: Kepler's third law uses the semi-major axis: $T^2 = \dfrac{4\pi^2a^3}{GM}$. Equal $a = d/2$ gives equal periods. <b>True.</b>` },
      { t: H`II: orbital energy depends only on $a$: $E = -\dfrac{GMm}{2a}$. <b>True.</b>` },
      { t: H`III: for a given energy, the circular orbit has the <i>largest</i> angular momentum. The ellipse has less. <b>False.</b>` },
      { t: H`IV: by energy conservation, the satellite is fastest nearest the planet (point 1) and slowest farthest away (point 3): $v_1 > v_2 > v_3$. <b>False.</b> &nbsp; I and II only. <b>Answer B</b>` }
    ]
  },
  {
    ch: 7, ref: "2026 Q22", img: ["2026-Q22"], ans: "(c)",
    steps: [
      { t: H`Treat the straight-line fall as the limit of a very thin ellipse with the Earth at one focus. Its semi-major axis is $a = r/2$.` },
      { t: H`By Kepler's third law, its period equals that of a circular orbit of radius $r/2$: $T = 2\pi\sqrt{\dfrac{(r/2)^3}{GM}} = \pi\sqrt{\dfrac{r^3}{2GM}}$.` },
      { t: H`The fall from apoapsis to the Earth is half an orbit: $t = \dfrac T2 = \dfrac{\pi}{2\sqrt2}\sqrt{\dfrac{r^3}{GM}}$. <b>Answer (c)</b>` }
    ]
  },
  {
    ch: 8, ref: "2024 Q21", img: ["2024-Q21"], ans: "D",
    steps: [
      { t: H`Rolling without slipping: $K_\text{rot} = \tfrac12\cdot\tfrac25MR^2\omega^2 = \tfrac25K_\text{trans}$, so rotation holds $\tfrac27$ of the total $Mgh$.` },
      { t: H`Once airborne, no torque acts, so the sphere keeps spinning. Only its translational KE ($\tfrac57Mgh$) converts back into height.` },
      { t: H`It rises to $\tfrac57h$, falling short by $d = \tfrac27h$. Chris is right. <b>Answer D</b>` }
    ]
  },
  {
    ch: 9, ref: "2026 Q21", img: ["2026-Q21"], ans: "(c)",
    steps: [
      { t: H`Bernoulli from the tank surface (large tank, $v\approx0$) to the outlet, $l$ below: $P_0 + \rho gl = P_0 + \tfrac12\rho v^2 \Rightarrow \tfrac12\rho v^2 = \rho gl$.` },
      { t: H`Uniform tube, so the speed at the top is also $v$. Bernoulli from the surface to the top, $h$ above: $P_0 = p_\text{top} + \tfrac12\rho v^2 + \rho gh$.` },
      { t: H`Pressure cannot fall below zero: $p_\text{top} = P_0 - \rho g(l + h) \ge 0 \Rightarrow h \le \dfrac{P_0}{\rho g} - l$. <b>Answer (c)</b>` }
    ]
  },
  {
    ch: 9, ref: "2026 Q5", img: ["2026-Q5"], ans: "(c)",
    steps: [
      { t: H`As the bubble rises by $h$, an equal volume $V$ of fluid moves down by $h$ to fill the space it left.` },
      { t: H`$\Delta U = \rho_bVgh - \rho_fVgh = (\rho_b - \rho_f)Vgh$, which is negative when $\rho_b < \rho_f$, so rising is energetically favourable. <b>Answer (c)</b>` }
    ]
  }
);
