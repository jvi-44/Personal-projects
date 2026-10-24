/* Hand-drawn SVG diagrams. Colours come from page CSS classes (d-*), so they follow the theme. */
const DIAGRAMS = (() => {
  const T = (x, y, s, cls = "d-t", anchor = "middle") =>
    `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  const arrowDefs = (id) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="d-inkfill"/></marker></defs>`;
  const fig = (svg, w, h, label, caption) =>
    `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${svg}</svg><figcaption>${caption}</figcaption>`;

  // ---------------------------------------------------------------- typology
  function typology() {
    const W = 720, H = 250, panelW = 144, base = 150;
    const panels = [
      { name: "Continental shelf", sub: "e.g. Britain", draw: (x) => `
        <path d="M${x},${base - 40} L${x + 40},${base - 40} L${x + 40},${base - 8} L${x + 70},${base - 8} L${x + 70},${base - 30} L${x + 110},${base - 30} L${x + 110},${base - 8} L${x + 140},${base - 8} L${x + 140},${base + 60} L${x},${base + 60} Z" class="d-crust"/>
        <path d="M${x + 70},${base - 30} q20,-14 40,0" class="d-land"/>` },
      { name: "Continental fragment", sub: "Socotra · Falklands", draw: (x) => `
        <path d="M${x},${base + 30} L${x + 140},${base + 30} L${x + 140},${base + 60} L${x},${base + 60} Z" class="d-ocrust"/>
        <path d="M${x + 30},${base + 30} L${x + 40},${base - 25} q30,-30 60,0 L${x + 110},${base + 30} Z" class="d-crust"/>` },
      { name: "Hotspot volcano", sub: "Tristan · Pitcairn", draw: (x) => `
        <path d="M${x},${base + 30} L${x + 140},${base + 30} L${x + 140},${base + 60} L${x},${base + 60} Z" class="d-ocrust"/>
        <path d="M${x + 15},${base + 30} L${x + 62},${base - 50} L${x + 78},${base - 50} L${x + 125},${base + 30} Z" class="d-basalt"/>
        <path d="M${x + 70},${base + 60} L${x + 70},${base - 40}" class="d-magma"/>` },
      { name: "Atoll", sub: "Funafuti · Oeno · Ducie", draw: (x) => `
        <path d="M${x},${base + 30} L${x + 140},${base + 30} L${x + 140},${base + 60} L${x},${base + 60} Z" class="d-ocrust"/>
        <path d="M${x + 20},${base + 30} L${x + 55},${base + 4} L${x + 85},${base + 4} L${x + 120},${base + 30} Z" class="d-basalt"/>
        <path d="M${x + 38},${base + 18} L${x + 45},${base - 2} L${x + 55},${base - 2} L${x + 58},${base + 6} L${x + 82},${base + 6} L${x + 85},${base - 2} L${x + 95},${base - 2} L${x + 102},${base + 18} Z" class="d-reef"/>` },
      { name: "Raised atoll", sub: "Henderson", draw: (x) => `
        <path d="M${x},${base + 30} L${x + 140},${base + 30} L${x + 140},${base + 60} L${x},${base + 60} Z" class="d-ocrust"/>
        <path d="M${x + 20},${base + 30} L${x + 55},${base - 12} L${x + 85},${base - 12} L${x + 120},${base + 30} Z" class="d-basalt"/>
        <path d="M${x + 38},${base + 4} L${x + 44},${base - 30} L${x + 96},${base - 30} L${x + 102},${base + 4} Z" class="d-reef"/>
        <path d="M${x + 70},${base - 48} v12 M${x + 64},${base - 42} l6,-6 l6,6" class="d-arrow"/>` },
    ];
    let s = `<rect x="0" y="${base}" width="${W}" height="${H - base}" class="d-sea"/>`;
    s += `<line x1="0" y1="${base}" x2="${W}" y2="${base}" class="d-sealine"/>`;
    panels.forEach((p, i) => {
      const x = i * panelW + 2;
      s += p.draw(x);
      s += T(x + 70, 36, p.name, "d-t d-b");
      s += T(x + 70, 54, p.sub, "d-t d-m");
    });
    s += T(W - 6, base - 6, "sea level", "d-t d-s", "end");
    s += `<g transform="translate(8,${H - 18})">
      <rect width="12" height="10" class="d-crust"/>${T(18, 9, "continental crust", "d-t d-s", "start")}
      <rect x="130" width="12" height="10" class="d-ocrust"/>${T(148, 9, "oceanic crust", "d-t d-s", "start")}
      <rect x="240" width="12" height="10" class="d-basalt"/>${T(258, 9, "volcanic rock", "d-t d-s", "start")}
      <rect x="350" width="12" height="10" class="d-reef"/>${T(368, 9, "reef limestone", "d-t d-s", "start")}
      <line x1="470" y1="5" x2="482" y2="5" class="d-magma"/>${T(488, 9, "magma supply", "d-t d-s", "start")}</g>`;
    return fig(s, W, H, "Cross-sections of five island types", "Island types by the crust beneath them. Continental islands stand on thick, light crust; oceanic islands are volcanoes built up from oceanic crust, and some later carry reef caps that sink or are uplifted. Schematic, not to scale.");
  }

  // ---------------------------------------------------------------- hotspot conveyor
  function hotspot() {
    const W = 720, H = 300, sea = 120;
    let s = arrowDefs("ah1");
    s += `<rect x="0" y="${sea}" width="${W}" height="80" class="d-sea"/>`;
    s += `<rect x="0" y="200" width="${W}" height="40" class="d-ocrust"/>`;
    s += `<rect x="0" y="240" width="${W}" height="60" class="d-mantle"/>`;
    s += `<path d="M560,300 C548,270 572,255 560,200" class="d-plume"/>`;
    s += `<path d="M520,300 Q560,250 600,300 Z" class="d-plumefill"/>`;
    // islands from young (right) to old (left)
    const isl = [
      { x: 560, top: 70, w: 70, name: "active volcano", sub: "high, growing", reef: 0 },
      { x: 430, top: 98, w: 64, name: "eroding high island", sub: "fringing reef", reef: 1 },
      { x: 300, top: 116, w: 58, name: "atoll", sub: "reef cap at sea level", reef: 2 },
      { x: 160, top: 150, w: 54, name: "guyot", sub: "drowned, flat-topped", reef: 3 },
    ];
    isl.forEach((d) => {
      s += `<path d="M${d.x - d.w},200 L${d.x - 10},${d.top} L${d.x + 10},${d.top} L${d.x + d.w},200 Z" class="d-basalt"/>`;
      if (d.reef === 1) s += `<path d="M${d.x - 26},${sea + 2} l4,-6 l8,0 l2,6 Z M${d.x + 16},${sea + 2} l2,-6 l8,0 l4,6 Z" class="d-reef"/>`;
      if (d.reef === 2) s += `<path d="M${d.x - 22},${d.top + 2} L${d.x - 22},${sea - 2} L${d.x + 22},${sea - 2} L${d.x + 22},${d.top + 2} Z" class="d-reef"/>`;
      if (d.reef === 3) s += `<path d="M${d.x - 20},${d.top} L${d.x - 20},${d.top - 12} L${d.x + 20},${d.top - 12} L${d.x + 20},${d.top} Z" class="d-reef"/>`;
      s += T(d.x, 30, d.name, "d-t d-b");
      s += T(d.x, 46, d.sub, "d-t d-m");
    });
    s += `<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" class="d-sealine"/>`;
    s += `<line x1="660" y1="222" x2="60" y2="222" class="d-arrow" marker-end="url(#ah1)"/>`;
    s += T(360, 236, "plate motion carries volcanoes off the hotspot; they cool, subside and erode", "d-t d-s");
    s += T(560, 290, "mantle plume", "d-t d-s");
    s += T(70, 70, "← older", "d-t d-m", "start");
    s += T(690, 70, "younger", "d-t d-m", "end");
    return fig(s, W, H, "Hotspot island chain from active volcano to guyot", "The oceanic island conveyor. A volcano grows over a mantle plume, then the plate carries it away. As it cools and sinks, reefs grow on its flanks; if reef growth keeps pace it becomes an atoll, and if not, a drowned guyot. Schematic.");
  }

  // ---------------------------------------------------------------- Darwin
  function darwin() {
    const W = 720, H = 240, sea = 110;
    const stages = [
      { x: 120, peak: 34, name: "1 · Fringing reef", sub: "reef attached to shore" },
      { x: 360, peak: 74, name: "2 · Barrier reef", sub: "lagoon between reef and peak" },
      { x: 600, peak: 130, name: "3 · Atoll", sub: "peak gone below the sea" },
    ];
    let s = arrowDefs("ah2");
    s += `<rect x="0" y="${sea}" width="${W}" height="${H - sea}" class="d-sea"/>`;
    stages.forEach((st, i) => {
      const x = st.x, p = st.peak;
      s += `<path d="M${x - 100},${H} L${x - 12},${p} L${x + 12},${p} L${x + 100},${H} Z" class="d-basalt"/>`;
      const rw = 8 + i * 10;
      const inner = 30 + i * 18;
      s += `<path d="M${x - inner - rw},${H - 20} L${x - inner - rw},${sea - 3} L${x - inner},${sea - 3} L${x - inner},${H - 20} Z" class="d-reef"/>`;
      s += `<path d="M${x + inner},${H - 20} L${x + inner},${sea - 3} L${x + inner + rw},${sea - 3} L${x + inner + rw},${H - 20} Z" class="d-reef"/>`;
      if (i > 0) s += `<path d="M${x + 92},${sea + 30} v34" class="d-arrow" marker-end="url(#ah2)"/>`;
      s += T(x, 26, st.name, "d-t d-b");
      s += T(x, 42, st.sub, "d-t d-m");
    });
    s += `<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" class="d-sealine"/>`;
    s += T(W - 8, sea - 6, "sea level", "d-t d-s", "end");
    s += T(452, sea + 52, "subsidence", "d-t d-s", "start");
    return fig(s, W, H, "Darwin's subsidence sequence: fringing reef, barrier reef, atoll", "Darwin's theory (1842). As a volcanic island subsides, its fringing reef grows upward and becomes a barrier reef and finally an atoll. Confirmed when boreholes on Enewetak (1952) reached basalt beneath more than 1,200 m of reef limestone.");
  }

  // ---------------------------------------------------------------- GDM
  function gdm() {
    const W = 640, H = 260, x0 = 60, x1 = 610, y0 = 210, y1 = 40;
    let s = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" class="d-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" class="d-axis"/>`;
    const curve = (amp, skew) => {
      let d = "";
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const v = amp * Math.pow(t, skew) * Math.pow(1 - t, 1.6) / (Math.pow(skew / (skew + 1.6), skew) * Math.pow(1.6 / (skew + 1.6), 1.6));
        d += (i ? "L" : "M") + (x0 + t * (x1 - x0)).toFixed(1) + "," + (y0 - v * (y0 - y1)).toFixed(1);
      }
      return d;
    };
    s += `<path d="${curve(0.92, 0.9)}" class="d-curve1"/>`;
    s += `<path d="${curve(0.6, 1.3)}" class="d-curve2"/>`;
    s += `<path d="${curve(0.75, 0.7)}" class="d-curve3"/>`;
    s += T(150, 70, "area & elevation", "d-t d-s c1", "start");
    s += T(360, 92, "species richness", "d-t d-s c3", "start");
    s += T(392, 142, "single-island endemics", "d-t d-s c2", "start");
    s += T((x0 + x1) / 2, 236, "island age  (birth → growth → erosion and subsidence)", "d-t d-s");
    s += `<text x="22" y="${(y0 + y1) / 2}" class="d-t d-s" text-anchor="middle" transform="rotate(-90 22 ${(y0 + y1) / 2})">relative value</text>`;
    s += T(86, 228, "Surtsey", "d-t d-m", "start");
    s += T(250, 228, "Tristan", "d-t d-m", "start");
    s += T(500, 228, "Henderson / atolls", "d-t d-m", "start");
    return fig(s, W, H, "General Dynamic Model curves over island age", "The General Dynamic Model (Whittaker et al. 2008), schematic. Island area and relief rise then fall over a volcanic island's life; richness and endemism follow with a lag, peaking in mid-life. Course islands are placed by stage, not to scale.");
  }

  // ---------------------------------------------------------------- motu anatomy
  function motu() {
    const W = 720, H = 260, sea = 92;
    let s = `<rect x="0" y="${sea}" width="${W}" height="${H - sea}" class="d-sea"/>`;
    // reef framework / limestone
    s += `<path d="M0,${H} L0,190 L60,150 L120,100 L560,104 L600,118 L720,140 L720,${H} Z" class="d-reef"/>`;
    // island sediment body
    s += `<path d="M230,104 Q260,72 300,68 L470,70 Q520,74 545,104 Z" class="d-sand"/>`;
    // freshwater lens
    s += `<path d="M275,92 Q390,186 520,92 Z" class="d-lens"/>`;
    s += `<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" class="d-sealine"/>`;
    const lab = (x, y, t1, t2) => T(x, y, t1, "d-t d-b") + (t2 ? T(x, y + 15, t2, "d-t d-m") : "");
    s += lab(60, 30, "ocean reef slope", "drops to the abyss");
    s += lab(150, 64, "reef crest", "waves break");
    s += lab(222, 30, "reef flat", "");
    s += lab(300, 30, "storm ridge", "coarse rubble");
    s += lab(395, 30, "motu (islet)", "sand & gravel");
    s += lab(560, 30, "lagoon beach", "");
    s += lab(660, 64, "lagoon", "");
    s += T(398, 150, "freshwater lens", "d-t d-b");
    s += T(398, 166, "≈40 m depth for each 1 m of head", "d-t d-m");
    s += T(W - 6, sea - 4, "sea level", "d-t d-s", "end");
    s += `<path d="M150,72 v24 M222,46 v58 M300,46 v20 M560,46 v52" class="d-leader"/>`;
    return fig(s, W, H, "Cross-section of an atoll reef island with freshwater lens", "Anatomy of a reef island, ocean side to lagoon. The islet is a loose pile of reef-derived sediment on the reef flat. Fresh water floats as a lens on seawater (Ghyben–Herzberg relation), so the lens is thin on narrow islets. Vertical scale exaggerated.");
  }

  // ---------------------------------------------------------------- flexure
  function flexure() {
    const W = 720, H = 260, sea = 100;
    let s = arrowDefs("ah3");
    s += `<rect x="0" y="${sea}" width="${W}" height="${H - sea}" class="d-sea"/>`;
    // flexed plate: depressed under Pitcairn (x=170), bulge near Henderson (x=520)
    let top = "", bot = "";
    for (let i = 0; i <= 72; i++) {
      const x = i * 10;
      const r = Math.abs(x - 170) / 120;
      const w = 38 * Math.exp(-r) * Math.cos(r);  // flexural profile
      top += (i ? "L" : "M") + x + "," + (180 + w).toFixed(1);
      bot = "L" + x + "," + (225 + w).toFixed(1) + bot;
    }
    s += `<path d="${top}${bot.replace(/^L/, "L")} Z" class="d-ocrust"/>`;
    s += `<path d="M90,${190} L160,52 L180,52 L250,${190} Z" class="d-basalt"/>`;
    s += `<path d="M170,40 v40" class="d-arrow" marker-end="url(#ah3)"/>`;
    // Henderson raised atoll on the bulge
    s += `<path d="M470,180 L500,96 L560,96 L590,180 Z" class="d-basalt"/>`;
    s += `<path d="M495,104 L500,78 L560,78 L565,104 Z" class="d-reef"/>`;
    s += `<path d="M530,72 v-22" class="d-arrow" marker-end="url(#ah3)"/>`;
    s += `<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" class="d-sealine"/>`;
    s += T(170, 24, "Pitcairn: new volcanic load", "d-t d-b");
    s += T(530, 24, "Henderson: former atoll lifted ≈30 m", "d-t d-b");
    s += T(530, 40, "on the flexural bulge, ≈200 km away", "d-t d-m");
    s += T(170, 248, "plate bends down (moat)", "d-t d-s");
    s += T(400, 248, "plate bends up (bulge)", "d-t d-s");
    s += T(W - 6, sea - 4, "sea level", "d-t d-s", "end");
    return fig(s, W, H, "Lithospheric flexure: Pitcairn's load raises Henderson", "Why Henderson is a raised atoll. Pitcairn's growth (0.8–0.9 Ma) loaded the oceanic plate, which bent down beneath it and up at a bulge some distance away, lifting the old atoll of Henderson about 30 m. Schematic; vertical scale greatly exaggerated.");
  }

  // ---------------------------------------------------------------- Falklands rotation
  function falklands_rotation() {
    const W = 720, H = 280;
    let s = arrowDefs("ah4");
    s += `<rect width="${W}" height="${H}" class="d-sea"/>`;
    // left panel: Gondwana fit (schematic)
    s += `<path d="M40,40 L250,40 L270,150 L230,240 L40,240 Z" class="d-crust"/>`;
    s += T(110, 80, "southern Africa", "d-t d-b");
    s += T(110, 96, "Cape Fold Belt, Karoo", "d-t d-m");
    s += `<g transform="translate(272,150) rotate(180)"><path d="M-30,-18 L32,-22 L36,4 L8,20 L-34,12 Z" class="d-land"/><path d="M-30,-6 L34,-8" class="d-fold"/></g>`;
    s += T(276, 196, "Falklands block", "d-t d-b");
    s += T(276, 212, "(orientation before breakup)", "d-t d-m");
    s += T(150, 266, "Before breakup (Early Jurassic)", "d-t d-b");
    // arrow
    s += `<path d="M340,140 C380,90 440,90 470,140" class="d-arrow" marker-end="url(#ah4)"/>`;
    s += T(405, 82, "drift and ≈180° rotation", "d-t d-s");
    // right panel: today
    s += `<path d="M640,30 L700,30 L700,250 L660,250 Q600,180 640,30 Z" class="d-crust"/>`;
    s += T(668, 270, "S. America", "d-t d-m");
    s += `<path d="M470,150 L700,150 L700,200 L470,200 Z" class="d-shelf"/>`;
    s += T(540, 220, "Falkland Plateau", "d-t d-m");
    s += `<g transform="translate(560,168)"><path d="M-30,-18 L32,-22 L36,4 L8,20 L-34,12 Z" class="d-land"/><path d="M-30,-6 L34,-8" class="d-fold"/></g>`;
    s += T(560, 132, "Falklands today", "d-t d-b");
    s += T(150, 30, "", "d-t");
    s += `<g transform="translate(470,250)"><line x1="0" y1="0" x2="14" y2="0" class="d-fold"/>${T(20, 4, "trend of folded rock layers", "d-t d-s", "start")}</g>`;
    return fig(s, W, H, "Falklands microplate drifting and rotating from southern Africa", "The rotation hypothesis, schematic. The Falklands' rock sequence and fold trends match South Africa's Cape and Karoo rocks once the block is turned about 180°. Palaeomagnetism of Jurassic dykes supports a large rotation during Gondwana's breakup; exact timing and amount are debated.");
  }

  // ---------------------------------------------------------------- Surtseyan
  function surtseyan() {
    const W = 720, H = 270, sea = 140;
    let s = arrowDefs("ah5");
    const panel = (x, name, sub) => T(x, 24, name, "d-t d-b") + T(x, 40, sub, "d-t d-m");
    s += `<rect x="0" y="${sea}" width="${W}" height="${H - sea}" class="d-sea"/>`;
    s += `<rect x="0" y="240" width="${W}" height="30" class="d-seafloor"/>`;
    // panel 1 explosive
    s += `<path d="M40,240 L100,${sea - 12} L140,${sea - 12} L200,240 Z" class="d-tephra"/>`;
    s += `<path d="M120,240 L120,${sea - 10}" class="d-magma"/>`;
    s += `<path d="M120,${sea - 14} L100,60 M120,${sea - 14} L128,52 M120,${sea - 14} L146,64" class="d-jet"/>`;
    s += `<path d="M86,${sea + 20} q16,-14 26,0" class="d-arrow" marker-end="url(#ah5)"/>`;
    s += panel(120, "1 · Explosive", "seawater floods the vent");
    s += T(60, sea + 46, "water in", "d-t d-s", "start");
    // panel 2 effusive
    s += `<path d="M280,240 L340,${sea - 30} L390,${sea - 30} L450,240 Z" class="d-tephra"/>`;
    s += `<path d="M380,${sea - 26} L470,${sea - 6} L510,${sea + 4} L470,${sea + 4} L400,${sea - 8} Z" class="d-lava"/>`;
    s += `<path d="M365,240 L365,${sea - 28}" class="d-magma"/>`;
    s += panel(390, "2 · Effusive", "cone seals vent; lava armours island");
    // panel 3 lithified & eroding
    s += `<path d="M560,240 L600,${sea - 26} L640,${sea - 26} L680,240 Z" class="d-tuff"/>`;
    s += `<path d="M640,${sea - 22} L690,${sea - 6} L700,${sea + 4} L660,${sea + 4} Z" class="d-lava"/>`;
    s += `<path d="M560,${sea - 2} q-12,-8 -24,0" class="d-arrow" marker-end="url(#ah5)"/>`;
    s += panel(620, "3 · Lithified, eroding", "tephra → palagonite tuff");
    s += T(540, sea + 22, "waves", "d-t d-s", "end");
    s += `<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" class="d-sealine"/>`;
    s += T(W - 6, sea - 4, "sea level", "d-t d-s", "end");
    s += T(8, 258, "seafloor ≈130 m", "d-t d-s", "start");
    return fig(s, W, H, "Three stages of a Surtseyan island", "How Surtsey survived. Explosive magma–water interaction builds a loose tephra cone (1963–64). Once the cone excludes seawater, lava flows armour the island (1964–67). Hydrothermal alteration then cements the tephra into palagonite tuff, which resists the waves. Schematic.");
  }

  // ---------------------------------------------------------------- Surtsey timeline (real dates)
  function surtsey_timeline() {
    const W = 720, H = 200, x0 = 40, x1 = 690, t0 = 1963, t1 = 2015;
    const X = (y) => x0 + (y - t0) / (t1 - t0) * (x1 - x0);
    let s = `<line x1="${x0}" y1="120" x2="${x1}" y2="120" class="d-axis"/>`;
    for (let y = 1965; y <= 2015; y += 10) s += `<line x1="${X(y)}" y1="120" x2="${X(y)}" y2="126" class="d-axis"/>` + T(X(y), 142, y, "d-t d-s");
    const phases = [
      [1965, 1975, "sea-dispersed pioneers", "p1"],
      [1975, 1986, "stagnation", "p2"],
      [1986, 2008, "gull-driven second wave", "p3"],
      [2008, 2013, "net loss", "p4"],
    ];
    phases.forEach(([a, b, n, c], i) => {
      s += `<rect x="${X(a)}" y="92" width="${X(b) - X(a) - 2}" height="22" rx="2" class="d-${c}"/>`;
      s += T((X(a) + X(b)) / 2, 84 - (i % 2) * 16, n, "d-t d-s");
    });
    const ev = [[1963, "eruption begins"], [1965, "first plant (sea rocket)"], [1985, "gulls start breeding"], [1996, "first land bird breeds"], [2007, "peak: 64 species"], [2013, "59 present, 39 viable"]];
    ev.forEach(([y, t], i) => {
      s += `<circle cx="${X(y)}" cy="120" r="4" class="d-dot"/>`;
      s += `<line x1="${X(y)}" y1="126" x2="${X(y)}" y2="${154 + (i % 2) * 16}" class="d-leader"/>`;
      s += T(X(y), 166 + (i % 2) * 16, t, "d-t d-m", i === 0 ? "start" : i === ev.length - 1 ? "end" : "middle");
    });
    s += T(x0, 30, "Vascular plant colonisation of Surtsey, by phase", "d-t d-b", "start");
    return fig(s, W, H, "Timeline of Surtsey's plant colonisation phases 1963–2013", "Phases and milestones from Magnússon et al. (2014). The dates are from the paper; for the species curve itself see their Figure 3.");
  }

  // ---------------------------------------------------------------- Socotra rift
  function socotra_rift() {
    const W = 720, H = 260;
    let s = arrowDefs("ah6");
    s += `<rect width="${W}" height="${H}" class="d-sea"/>`;
    // left: before rifting (~35 Ma): continuous crust
    s += `<path d="M30,60 L320,60 L320,210 L30,210 Z" class="d-crust"/>`;
    s += `<path d="M120,120 L240,120 L240,150 L120,150 Z" class="d-land"/>`;
    s += T(175, 140, "future Socotra", "d-t d-s");
    s += T(175, 92, "Arabia", "d-t d-b");
    s += T(175, 190, "Africa (Somali plate)", "d-t d-b");
    s += `<path d="M30,112 L320,112" class="d-rift"/>`;
    s += T(175, 240, "Before rifting (before ≈30 Ma)", "d-t d-b");
    s += `<path d="M330,135 L390,135" class="d-arrow" marker-end="url(#ah6)"/>`;
    // right: today
    s += `<path d="M400,40 L700,40 L700,100 L400,100 Z" class="d-crust"/>`;
    s += T(550, 66, "Arabia (Dhofar margin)", "d-t d-b");
    s += `<path d="M400,100 L700,100 L700,150 L400,150 Z" class="d-ocrust"/>`;
    s += T(550, 130, "Gulf of Aden: new oceanic crust", "d-t d-s");
    s += `<path d="M400,150 L700,150 L700,210 L400,210 Z" class="d-crust"/>`;
    s += `<path d="M500,140 L620,140 L620,166 L500,166 Z" class="d-land"/>`;
    s += T(560, 157, "Socotra", "d-t d-b");
    s += T(560, 196, "Somali plate", "d-t d-m");
    s += `<path d="M548,40 v-18 M548,210 v18" class="d-arrow"/>`;
    s += T(550, 240, "Today: Socotra on the rift's southern margin", "d-t d-b");
    return fig(s, W, H, "Socotra rifted from Arabia by the opening of the Gulf of Aden", "Socotra's origin, schematic. Rifting from about 30 Ma stretched and broke the Arabian margin; new oceanic crust formed in the Gulf of Aden, leaving Socotra as a thinned continental block on the Somali plate, facing its counterpart in Dhofar.");
  }

  return { typology, hotspot, darwin, gdm, motu, flexure, falklands_rotation, surtseyan, surtsey_timeline, socotra_rift };
})();
