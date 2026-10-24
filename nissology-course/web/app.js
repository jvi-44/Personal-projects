/* Nissology course app. Data globals (COURSE, UNITS, READINGS, KINDS, DEMS) are injected by tools/build.py. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const R = Object.fromEntries(READINGS.map((r) => [r.id, r]));
  const U = Object.fromEntries(UNITS.map((u) => [u.id, u]));
  const view = $("#view");
  let cleanup = [];
  let annotations = null;

  // ------------------------------------------------------------ per-viewer progress (convenience only)
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("nissology-read") || "[]"); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem("nissology-read", JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    has(id) { return this.get().includes(id); },
    toggle(id) { const v = new Set(this.get()); v.has(id) ? v.delete(id) : v.add(id); this.set([...v]); },
  };

  // ------------------------------------------------------------ routing
  function route() {
    cleanup.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
    cleanup = [];
    const h = (location.hash || "#home").slice(1);
    if (h.startsWith("read-") && R[h.slice(5)]) renderReader(R[h.slice(5)]);
    else if (U[h]) renderUnit(U[h]);
    else renderHome();
    $$(".nav a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + (U[h] ? h : h.startsWith("read-") && R[h.slice(5)] ? R[h.slice(5)].unit : "home")));
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);

  // ------------------------------------------------------------ navigation rail
  function renderNav() {
    $("#nav").innerHTML = `<a href="#home" class="navhome"><span class="nav-num">◎</span><span>Course home</span></a>` +
      UNITS.map((u) => `<a href="#${u.id}"><span class="nav-num">${u.num}</span><span>${esc(u.short)}</span></a>`).join("");
  }

  // ------------------------------------------------------------ helpers
  function dms(lat, lon) {
    const f = (v, p, n) => { const a = Math.abs(v); const d = Math.floor(a); const m = Math.round((a - d) * 60); return `${d}°${String(m).padStart(2, "0")}′${v >= 0 ? p : n}`; };
    return `${f(lat, "N", "S")} ${f(lon, "E", "W")}`;
  }
  function readingCard(r) {
    const done = store.has(r.id);
    return `<article class="rcard ${r.hosted ? "hosted" : "companion"}">
      <div class="rcard-top"><span class="chip ${r.hosted ? "chip-a" : "chip-b"}">${r.hosted ? "Annotated PDF" : "Companion guide"}</span>
      <span class="mono small">${r.minutes || 60} min</span>${done ? `<span class="chip chip-done">Read</span>` : ""}</div>
      <h4><a href="#read-${r.id}">${esc(r.title)}</a></h4>
      <p class="small muted">${esc(r.authors)} (${r.year}). <em>${esc(r.journal)}</em></p>
      <p class="small">${esc(r.why)}</p>
      <a class="btn" href="#read-${r.id}">${r.hosted ? "Open the paper and notes" : "Open the guide"}</a>
    </article>`;
  }
  function legendHTML() {
    return Object.entries(KINDS).map(([k, v]) => `<div class="lg"><span class="sw k-${k}"></span><b>${esc(v.label)}</b><span class="small muted">${esc(LEGEND_TEXT[k])}</span></div>`).join("");
  }
  const LEGEND_TEXT = {
    claim: "the authors' main assertions",
    evidence: "data, results and numbers",
    method: "how it was measured or modelled",
    concept: "terms and ideas to learn",
    caution: "limitations, inconsistencies, alternative readings",
    link: "connections to other units and papers",
  };
  function linkify(root) {
    $$("a[data-reading]", root).forEach((a) => { a.href = "#read-" + a.dataset.reading; a.classList.add("rlink"); });
    $$("[data-legend]", root).forEach((el) => { el.innerHTML = legendHTML(); });
    $$("figure[data-diagram]", root).forEach((f) => { const fn = DIAGRAMS[f.dataset.diagram]; if (fn) f.innerHTML = fn(); f.classList.add("diagram"); });
    $$("figure[data-chart]", root).forEach((f) => { const fn = CHARTS[f.dataset.chart]; if (fn) fn(f); f.classList.add("chart"); });
  }

  // ------------------------------------------------------------ home
  function renderHome() {
    document.title = "Nissology";
    const read = store.get();
    const total = READINGS.length;
    view.innerHTML = `
    <header class="hero">
      <p class="eyebrow">A guided course in island studies</p>
      <h1 class="display">Nissology<span class="display-sub">Islands of the Modern World</span></h1>
      <p class="lede">${esc(COURSE.blurb)}</p>
      <p class="mono small">${esc(COURSE.hours)} · ${READINGS.filter((r) => r.hosted).length} annotated papers · ${READINGS.filter((r) => !r.hosted).length} companion guides · ${read.length}/${total} readings marked read</p>
    </header>
    <section class="chartmap">
      <figure class="worldmap" id="worldmap" aria-label="World map of the six case-study islands"><div class="map-placeholder">Loading map…</div></figure>
    </section>
    <section class="syllabus">
      <h2>Syllabus</h2>
      <ol class="units">${UNITS.map((u) => {
        const rs = u.readings || [];
        const done = rs.filter((id) => read.includes(id)).length;
        return `<li><a href="#${u.id}" class="unit-row">
          <span class="unit-num">${u.num}</span>
          <span class="unit-main"><span class="unit-kicker">${esc(u.kicker)}</span><span class="unit-title">${esc(u.title)}</span><span class="unit-sum">${esc(u.summary)}</span></span>
          <span class="unit-meta mono small">${u.coords ? esc(u.coords) + "<br>" : ""}${rs.length ? `${done}/${rs.length} read` : ""}</span>
        </a></li>`;
      }).join("")}</ol>
    </section>
    <section class="two-col">
      <div><h2>Learning outcomes</h2><ol class="outcomes">${COURSE.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ol></div>
      <div><h2>How to use this course</h2><dl class="how">${COURSE.how.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
      <h3>Annotation colours</h3><div class="legend-grid">${legendHTML()}</div></div>
    </section>
    <section><h2>All readings</h2><div class="rgrid">${READINGS.map(readingCard).join("")}</div></section>
    <footer class="foot small muted"><p>Terrain: AWS Terrain Tiles (Mapzen terrarium; SRTM, EU-DEM, ETOPO1 and other public sources). Coastlines: Natural Earth via world-atlas. Papers are reproduced under their Creative Commons licences with annotations added; companion-guide papers are linked, not reproduced.</p></footer>`;
    drawWorldMap($("#worldmap"));
  }

  // ------------------------------------------------------------ maps (d3)
  let landPromise = null;
  const land = () => (landPromise ||= fetch("data/land-50m.json").then((r) => r.json()).then((t) => topojson.feature(t, t.objects.land)));
  const ISLAND_POS = { funafuti: [179.15, -8.52], pitcairn: [-130.1, -25.07], falklands: [-59.3, -51.75], tristan: [-12.29, -37.11], surtsey: [-20.6, 63.3], socotra: [53.85, 12.5] };

  function drawWorldMap(el) {
    land().then((geo) => {
      const W = 960, H = 470;
      const proj = d3.geoEqualEarth().rotate([-150, 0]).fitExtent([[10, 10], [W - 10, H - 10]], { type: "Sphere" });
      const path = d3.geoPath(proj);
      const grat = d3.geoGraticule10();
      const pts = UNITS.filter((u) => ISLAND_POS[u.id]).map((u) => { const [x, y] = proj(ISLAND_POS[u.id]); return { u, x, y }; });
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="World map with the six course islands numbered by unit">
        <path d="${path({ type: "Sphere" })}" class="m-sea"/>
        <path d="${path(grat)}" class="m-grat"/>
        <path d="${path(geo)}" class="m-land"/>
        ${pts.map(({ u, x, y }) => `<a href="#${u.id}" class="m-pt"><circle cx="${x}" cy="${y}" r="14" class="m-hit"/><circle cx="${x}" cy="${y}" r="5.5" class="m-dot"/><circle cx="${x}" cy="${y}" r="10" class="m-ring"/>
          <text x="${x + 14}" y="${y - 10}" class="m-lab">${u.num} · ${esc(u.short)}</text></a>`).join("")}
      </svg><figcaption>The six case-study islands, numbered by unit. Equal Earth projection centred on the Pacific. Select an island to open its unit.</figcaption>`;
    }).catch(() => { el.innerHTML = `<figcaption>The world map could not load. The syllabus below links to every unit.</figcaption>`; });
  }

  function drawLocator(el, id) {
    const c = ISLAND_POS[id]; if (!c) return;
    land().then((geo) => {
      const S = 220;
      const proj = d3.geoOrthographic().rotate([-c[0], -c[1] * 0.85]).fitExtent([[4, 4], [S - 4, S - 4]], { type: "Sphere" });
      const path = d3.geoPath(proj);
      const [x, y] = proj(c);
      el.innerHTML = `<svg viewBox="0 0 ${S} ${S}" role="img" aria-label="Globe locating the island">
        <path d="${path({ type: "Sphere" })}" class="m-sea"/><path d="${path(d3.geoGraticule10())}" class="m-grat"/>
        <path d="${path(geo)}" class="m-land"/>
        <circle cx="${x}" cy="${y}" r="9" class="m-ring"/><circle cx="${x}" cy="${y}" r="4" class="m-dot"/></svg>`;
    }).catch(() => { el.textContent = ""; });
  }

  // ------------------------------------------------------------ unit page
  function renderUnit(u) {
    document.title = `${u.short} · Nissology`;
    const idx = UNITS.indexOf(u);
    const prev = UNITS[idx - 1], next = UNITS[idx + 1];
    view.innerHTML = `
    <header class="unit-head">
      <p class="eyebrow">Unit ${u.num} · ${esc(u.kicker)}</p>
      <h1 class="display">${esc(u.title)}</h1>
      ${u.coords ? `<p class="mono coords">${esc(u.coords)}${u.island_type ? ` · <span class="chip chip-a">${esc(u.island_type)}</span>` : ""}</p>` : ""}
      <p class="lede">${esc(u.summary)}</p>
    </header>
    ${u.facts ? `<section class="factfile"><div class="locator" id="locator"></div><dl class="facts">${u.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></section>` : ""}
    <section class="objectives"><h2>By the end of this unit you can</h2><ul>${u.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></section>
    ${u.model ? `<section class="model-sec"><h2>3D terrain and bathymetry</h2><div class="viewer" id="viewer"></div></section>` : ""}
    ${u.sections.map(([h, body], i) => `<section class="prose" id="s${i}"><h2>${esc(h)}</h2>${body}</section>`).join("")}
    ${u.readings.length ? `<section><h2>Readings</h2><p class="muted">Work through these in order. Each opens in the reader with its guide.</p><div class="rgrid">${u.readings.map((id) => readingCard(R[id])).join("")}</div></section>` : ""}
    ${u.seminar ? `<section class="seminar"><h2>Seminar questions</h2><ol>${u.seminar.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></section>` : ""}
    ${u.assignment ? `<section class="assign"><h2>Assignment: ${esc(u.assignment[0])}</h2><p>${esc(u.assignment[1])}</p></section>` : ""}
    <nav class="pager">${prev ? `<a href="#${prev.id}">← Unit ${prev.num}: ${esc(prev.short)}</a>` : `<span></span>`}${next ? `<a href="#${next.id}">Unit ${next.num}: ${esc(next.short)} →</a>` : ""}</nav>`;
    linkify(view);
    if (u.facts) drawLocator($("#locator"), u.id);
    if (u.model) {
      const v = new TerrainViewer($("#viewer"), u.model);
      cleanup.push(() => v.dispose());
    }
  }

  // ------------------------------------------------------------ charts
  const CHARTS = {
    mw(fig) {
      fig.innerHTML = `<div class="mw-controls">
          <div><label for="mw-area">Island area <output id="mw-area-o"></output></label><input id="mw-area" type="range" min="0" max="4" step="0.05" value="2"></div>
          <div><label for="mw-dist">Distance from mainland <output id="mw-dist-o"></output></label><input id="mw-dist" type="range" min="10" max="4000" step="10" value="500"></div>
        </div><svg viewBox="0 0 640 300" role="img" aria-label="MacArthur–Wilson immigration and extinction curves"></svg>
        <figcaption>MacArthur–Wilson equilibrium, a teaching model with illustrative parameters. Move the sliders. Larger islands lower the extinction curve; nearer islands raise the immigration curve. The equilibrium Ŝ is where they cross. Mainland pool P = 100 species.</figcaption>`;
      const svg = $("svg", fig), A = $("#mw-area", fig), D = $("#mw-dist", fig);
      const x0 = 56, x1 = 610, y0 = 250, y1 = 24, P = 100;
      const draw = () => {
        const area = Math.pow(10, +A.value), dist = +D.value;
        const I0 = 8 * Math.exp(-dist / 1500); // immigration rate with empty island
        const E1 = 6 / Math.pow(area, 0.35);   // extinction rate when all P present
        const I = (S) => I0 * Math.pow(1 - S / P, 1.6);
        const E = (S) => E1 * Math.pow(S / P, 1.6);
        let lo = 0, hi = P; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; (I(m) > E(m)) ? lo = m : hi = m; }
        const Seq = (lo + hi) / 2, rate = I(Seq);
        const ymax = 8;
        const X = (S) => x0 + S / P * (x1 - x0), Y = (r) => y0 - Math.min(r, ymax) / ymax * (y0 - y1);
        const line = (f) => Array.from({ length: 101 }, (_, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(f(i)).toFixed(1)}`).join("");
        let g = "";
        for (let r = 0; r <= ymax; r += 2) g += `<line x1="${x0}" x2="${x1}" y1="${Y(r)}" y2="${Y(r)}" class="c-grid"/><text x="${x0 - 8}" y="${Y(r) + 4}" class="c-tick" text-anchor="end">${r}</text>`;
        for (let s = 0; s <= P; s += 25) g += `<text x="${X(s)}" y="${y0 + 18}" class="c-tick" text-anchor="middle">${s}</text>`;
        svg.innerHTML = g + `<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" class="c-axis"/>
          <path d="${line(I)}" class="c-s1"/><path d="${line(E)}" class="c-s2"/>
          <line x1="${X(Seq)}" x2="${X(Seq)}" y1="${Y(rate)}" y2="${y0}" class="c-drop"/>
          <circle cx="${X(Seq)}" cy="${Y(rate)}" r="5" class="c-pt"/>
          <text x="${X(Seq) + 8}" y="${Y(rate) - 8}" class="c-lab">Ŝ ≈ ${Seq.toFixed(0)} species</text>
          <text x="${X(4)}" y="${Y(I(4)) - 8}" class="c-lab c-l1">immigration</text>
          <text x="${X(96)}" y="${Y(E(96)) - 8}" class="c-lab c-l2" text-anchor="end">extinction</text>
          <text x="${(x0 + x1) / 2}" y="${y0 + 38}" class="c-tick" text-anchor="middle">number of species on the island, S</text>
          <text x="16" y="${(y0 + y1) / 2}" class="c-tick" text-anchor="middle" transform="rotate(-90 16 ${(y0 + y1) / 2})">rate (species per unit time)</text>`;
        $("#mw-area-o", fig).textContent = `${area < 10 ? area.toFixed(1) : Math.round(area).toLocaleString()} km²`;
        $("#mw-dist-o", fig).textContent = `${dist.toLocaleString()} km`;
      };
      A.addEventListener("input", draw); D.addEventListener("input", draw); draw();
    },
    kench(fig) {
      // Kench et al. 2018, Table 1: atoll land area (ha) and change 1971–2014 (ha)
      const rows = [["Nanumea", 356.1, -1.32], ["Niutao", 235.2, 0.34], ["Nanumaga", 301.0, 4.71], ["Nui", 342.8, 7.61], ["Vaitupu", 522.9, 12.27], ["Nukufetau", 314.4, 19.40], ["Funafuti", 261.2, 10.06], ["Nukulaelae", 176.4, 10.00], ["Niulakita", 42.1, 0.05]];
      const W = 640, H = 330, x0 = 110, x1 = 600, y0 = 30, bh = 22, gap = 8;
      const vmin = -1, vmax = 7;
      const X = (v) => x0 + (v - vmin) / (vmax - vmin) * (x1 - x0);
      let s = "";
      for (let v = 0; v <= 6; v += 2) s += `<line x1="${X(v)}" x2="${X(v)}" y1="${y0 - 6}" y2="${y0 + rows.length * (bh + gap)}" class="c-grid"/><text x="${X(v)}" y="${y0 + rows.length * (bh + gap) + 16}" class="c-tick" text-anchor="middle">${v}%</text>`;
      rows.forEach(([n, a, d], i) => {
        const pct = d / a * 100, y = y0 + i * (bh + gap);
        const xa = X(Math.min(0, pct)), xb = X(Math.max(0, pct));
        s += `<g class="c-bar" tabindex="0"><title>${n}: ${d > 0 ? "+" : ""}${d} ha of ${a} ha (${pct > 0 ? "+" : ""}${pct.toFixed(2)}%)</title>
          <text x="${x0 - 10}" y="${y + bh / 2 + 4}" class="c-tick${n === "Funafuti" ? " c-em" : ""}" text-anchor="end">${n}</text>
          <rect x="${xa}" y="${y}" width="${Math.max(xb - xa, 1.5)}" height="${bh}" rx="3" class="${pct < 0 ? "c-neg" : "c-posbar"}${n === "Funafuti" ? " c-hi" : ""}"/>
          <text x="${pct < 0 ? xa - 6 : xb + 6}" y="${y + bh / 2 + 4}" class="c-val" text-anchor="${pct < 0 ? "end" : "start"}">${pct > 0 ? "+" : ""}${pct.toFixed(2)}%</text></g>`;
      });
      s += `<line x1="${X(0)}" x2="${X(0)}" y1="${y0 - 8}" y2="${y0 + rows.length * (bh + gap) - gap}" class="c-axis"/>`;
      const sum = rows.reduce((t, r) => t + r[2], 0), area = rows.reduce((t, r) => t + r[1], 0);
      fig.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of percentage land-area change by Tuvaluan atoll, 1971 to 2014">${s}</svg>
        <figcaption>Land-area change by atoll, 1971–2014, computed as change (ha) ÷ area (ha) from Kench et al. (2018), Table 1. Funafuti highlighted. The rows sum to ${sum >= 0 ? "+" : ""}${sum.toFixed(2)} ha of ${area.toFixed(1)} ha (${(sum / area * 100).toFixed(2)}%), against the paper's headline of +73.5 ha (2.9%).</figcaption>
        <details class="tbl"><summary>Table view</summary><div class="table-wrap"><table><thead><tr><th>Atoll</th><th>Area (ha)</th><th>Change (ha)</th><th>Change (%)</th></tr></thead><tbody>${rows.map(([n, a, d]) => `<tr><td>${n}</td><td class="num">${a}</td><td class="num">${d}</td><td class="num">${(d / a * 100).toFixed(2)}</td></tr>`).join("")}</tbody></table></div></details>`;
    },
    coralage(fig) {
      // Friedlander et al. 2014, p. 4: coral species richness vs island age
      const pts = [["Pitcairn", 0.8, 24], ["Ducie", 8, 35], ["Henderson", 13, 53], ["Oeno", 16, 58]];
      const W = 560, H = 280, x0 = 60, x1 = 530, y0 = 230, y1 = 24;
      const X = (a) => x0 + a / 18 * (x1 - x0), Y = (s) => y0 - s / 70 * (y0 - y1);
      let s = "";
      for (let v = 0; v <= 70; v += 10) s += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="c-grid"/><text x="${x0 - 8}" y="${Y(v) + 4}" class="c-tick" text-anchor="end">${v}</text>`;
      for (let a = 0; a <= 18; a += 3) s += `<text x="${X(a)}" y="${y0 + 18}" class="c-tick" text-anchor="middle">${a}</text>`;
      s += `<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" class="c-axis"/>`;
      pts.forEach(([n, a, r]) => { s += `<g class="c-bar" tabindex="0"><title>${n}: about ${a} Ma, ${r} coral species</title><circle cx="${X(a)}" cy="${Y(r)}" r="6" class="c-pt"/><text x="${X(a) + 10}" y="${Y(r) + 4}" class="c-val">${n}</text></g>`; });
      s += `<text x="${(x0 + x1) / 2}" y="${y0 + 40}" class="c-tick" text-anchor="middle">approximate island age (million years)</text>
            <text x="16" y="${(y0 + y1) / 2}" class="c-tick" text-anchor="middle" transform="rotate(-90 16 ${(y0 + y1) / 2})">coral species</text>`;
      fig.innerHTML = `<svg viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="Scatter of coral species richness against island age for four Pitcairn islands">${s}</svg>
        <figcaption>Coral species richness against island age, Pitcairn Islands (Friedlander et al. 2014, p. 4): Pearson r = 0.98 from just four points. Island age, isolation and island type all vary together here, so the correlation cannot separate their effects.</figcaption>`;
    },
  };

  // ------------------------------------------------------------ 3D terrain viewer
  class TerrainViewer {
    constructor(el, model) {
      this.el = el; this.model = model; this.which = model.dem;
      this.exag = model.exaggeration || 3; this.sea = 0; this.showWater = true;
      this.profileAxis = "ew"; this.profilePos = 0.5;
      el.innerHTML = `
        <div class="v-stage"><canvas class="v-canvas" aria-label="Interactive 3D terrain model"></canvas><div class="v-labels"></div>
          <div class="v-status">Loading terrain…</div></div>
        <div class="v-panel">
          ${model.alt ? `<div class="seg" role="group" aria-label="Choose island"><button type="button" data-dem="${model.dem}" class="on">${esc(DEMS[model.dem].name)}</button><button type="button" data-dem="${model.alt}">${esc(DEMS[model.alt].name)}</button></div>` : ""}
          <div class="v-row"><label for="v-exag">Vertical exaggeration <output id="v-exag-o"></output></label><input id="v-exag" type="range" min="1" max="20" step="0.5" value="${this.exag}"></div>
          <div class="v-row"><label for="v-sea">Sea level <output id="v-sea-o"></output></label><input id="v-sea" type="range" min="-200" max="10" step="1" value="0"></div>
          <div class="v-row v-checks"><label><input id="v-water" type="checkbox" checked> Show sea surface</label><label><input id="v-lab" type="checkbox" checked> Labels</label><button type="button" class="btn-s" id="v-reset">Reset view</button></div>
          <div class="v-row"><label for="v-prof">Cross-section <select id="v-axis" aria-label="Cross-section direction"><option value="ew">west–east</option><option value="ns">north–south</option></select></label><input id="v-prof" type="range" min="0.02" max="0.98" step="0.005" value="0.5"></div>
          <div class="v-stats mono small" id="v-stats"></div>
        </div>
        <figure class="v-profile"><svg viewBox="0 0 900 190" role="img" aria-label="Elevation profile along the cross-section line"></svg><figcaption class="small muted" id="v-pcap"></figcaption></figure>
        <p class="small muted v-note">${esc(model.note)} Drag to rotate, scroll or pinch to zoom, right-drag or two-finger drag to pan.</p>`;
      this.canvas = $(".v-canvas", el); this.labelsEl = $(".v-labels", el); this.status = $(".v-status", el);
      if (!window.THREE) { this.status.textContent = "The 3D library could not load. The profile and statistics below still work once the terrain loads."; }
      this.bind();
      this.load(this.which);
    }
    bind() {
      const el = this.el;
      $("#v-exag", el).addEventListener("input", (e) => { this.exag = +e.target.value; this.rebuildHeights(); });
      $("#v-sea", el).addEventListener("input", (e) => { this.sea = +e.target.value; this.recolor(); this.placeWater(); this.drawProfile(); this.render(); this.updateOutputs(); });
      $("#v-water", el).addEventListener("change", (e) => { this.showWater = e.target.checked; if (this.water) this.water.visible = this.showWater; this.render(); });
      $("#v-lab", el).addEventListener("change", (e) => { this.labelsEl.hidden = !e.target.checked; });
      $("#v-reset", el).addEventListener("click", () => this.resetCamera());
      $("#v-axis", el).addEventListener("change", (e) => { this.profileAxis = e.target.value; this.updateProfileLine(); this.drawProfile(); this.render(); });
      $("#v-prof", el).addEventListener("input", (e) => { this.profilePos = +e.target.value; this.updateProfileLine(); this.drawProfile(); this.render(); });
      $$(".seg button", el).forEach((b) => b.addEventListener("click", () => {
        $$(".seg button", el).forEach((x) => x.classList.toggle("on", x === b)); this.load(b.dataset.dem);
      }));
      this.onResize = () => this.resize();
      window.addEventListener("resize", this.onResize);
    }
    async load(id) {
      this.which = id; this.status.hidden = false; this.status.textContent = "Loading terrain…";
      const meta = DEMS[id];
      const img = new Image();
      img.src = `data/dem/${id}.png`;
      try { await img.decode(); } catch (e) { this.status.textContent = "Terrain data could not load."; return; }
      const c = document.createElement("canvas"); c.width = meta.w; c.height = meta.h;
      const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, meta.w, meta.h).data;
      const hts = new Float32Array(meta.w * meta.h);
      for (let i = 0; i < hts.length; i++) hts[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
      this.meta = meta; this.h = hts;
      this.labels = (id === this.model.dem ? this.model.labels : this.model.alt_labels) || [];
      this.wkm = meta.w * meta.mpp / 1000; this.hkm = meta.h * meta.mpp / 1000;
      this.buildScene();
      this.status.hidden = true;
      this.updateOutputs(); this.drawProfile();
    }
    buildScene() {
      if (!window.THREE) return;
      const THREE = window.THREE, m = this.meta;
      if (!this.renderer) {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--paper-2").trim() || "#e9efee");
        this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 5000);
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI * 0.495;
        this.controls.addEventListener("change", () => this.render());
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.65));
        const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(-1, 1.2, -0.8); this.scene.add(sun);
        this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.canvas.parentElement);
      }
      if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
      if (this.water) { this.scene.remove(this.water); this.water.geometry.dispose(); this.water.material.dispose(); }
      if (this.pline) { this.scene.remove(this.pline); this.pline.geometry.dispose(); }
      const geo = new THREE.PlaneGeometry(this.wkm, this.hkm, m.w - 1, m.h - 1);
      geo.rotateX(-Math.PI / 2);
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(m.w * m.h * 3), 3));
      this.mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
      this.scene.add(this.mesh);
      const wg = new THREE.PlaneGeometry(this.wkm, this.hkm); wg.rotateX(-Math.PI / 2);
      this.water = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: 0x2f7fb0, transparent: true, opacity: 0.38, depthWrite: false }));
      this.water.visible = this.showWater; this.scene.add(this.water);
      const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
      this.pline = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xd81b7a }));
      this.scene.add(this.pline);
      this.rebuildHeights(true);
      this.resetCamera();
    }
    vScale() { return this.exag / 1000; } // metres → km × exaggeration
    rebuildHeights(skipRender) {
      $("#v-exag-o", this.el).textContent = `${this.exag}×`;
      if (!this.mesh) { this.drawProfile(); return; }
      const pos = this.mesh.geometry.attributes.position, k = this.vScale();
      for (let i = 0; i < this.h.length; i++) pos.setY(i, this.h[i] * k);
      pos.needsUpdate = true; this.mesh.geometry.computeVertexNormals();
      this.recolor(); this.placeWater(); this.updateProfileLine();
      if (!skipRender) this.render();
    }
    recolor() {
      if (!this.mesh) return;
      const col = this.mesh.geometry.attributes.color, sea = this.sea, mx = Math.max(this.meta.max, 50);
      for (let i = 0; i < this.h.length; i++) {
        const z = this.h[i]; let r, g, b;
        if (z > sea) {
          const t = Math.min(1, (z - sea) / mx);
          if (z <= 0) { r = 0.86; g = 0.80; b = 0.60; } // exposed seabed at lowstand
          else if (t < 0.25) { const u = t / 0.25; r = 0.56 + 0.22 * u; g = 0.66 + 0.06 * u; b = 0.42 + 0.04 * u; }
          else if (t < 0.7) { const u = (t - 0.25) / 0.45; r = 0.78 - 0.14 * u; g = 0.72 - 0.20 * u; b = 0.46 - 0.10 * u; }
          else { const u = (t - 0.7) / 0.3; r = 0.64 + 0.30 * u; g = 0.52 + 0.42 * u; b = 0.36 + 0.58 * u; }
        } else {
          const d = Math.min(1, Math.sqrt((sea - z) / 5000));
          r = 0.62 - 0.55 * d; g = 0.84 - 0.62 * d; b = 0.90 - 0.48 * d;
        }
        col.setXYZ(i, r, g, b);
      }
      col.needsUpdate = true;
    }
    placeWater() { if (this.water) this.water.position.y = this.sea * this.vScale(); }
    resetCamera() {
      if (!this.camera) return;
      const span = Math.max(this.wkm, this.hkm) * (this.model.zoom || 1);
      this.camera.position.set(-span * 0.05, span * 0.62, span * 0.82);
      this.controls.target.set(0, 0, 0);
      this.controls.update(); this.render();
    }
    resize() {
      if (!this.renderer) return;
      const r = this.canvas.parentElement.getBoundingClientRect();
      this.renderer.setSize(r.width, r.height, false);
      this.camera.aspect = r.width / Math.max(r.height, 1); this.camera.updateProjectionMatrix();
      this.render();
    }
    lonlatToXZ(lat, lon) {
      const [s, n, w, e] = this.meta.bbox;
      const my = (la) => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360));
      const fx = (lon - w) / (e - w), fy = (my(n) - my(lat)) / (my(n) - my(s));
      return [fx, fy];
    }
    heightAt(fx, fy) {
      const m = this.meta, x = Math.min(m.w - 1, Math.max(0, Math.round(fx * (m.w - 1)))), y = Math.min(m.h - 1, Math.max(0, Math.round(fy * (m.h - 1))));
      return this.h[y * m.w + x];
    }
    render() {
      if (!this.renderer || this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.placeLabels();
      });
    }
    placeLabels() {
      const THREE = window.THREE, r = this.canvas.getBoundingClientRect();
      if (!this._labelEls || this._labelFor !== this.which) {
        this.labelsEl.innerHTML = this.labels.map(([la, lo, t, sub]) => `<div class="v-lab"><b>${esc(t)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`).join("");
        this._labelEls = $$(".v-lab", this.labelsEl); this._labelFor = this.which;
      }
      this.labels.forEach(([la, lo], i) => {
        const [fx, fy] = this.lonlatToXZ(la, lo);
        const hgt = Math.max(this.heightAt(fx, fy), this.sea);
        const v = new THREE.Vector3((fx - 0.5) * this.wkm, hgt * this.vScale(), (fy - 0.5) * this.hkm).project(this.camera);
        const el = this._labelEls[i];
        const vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        el.style.display = vis ? "" : "none";
        el._x = (v.x + 1) / 2 * r.width; el._y = (1 - v.y) / 2 * r.height; el._vis = vis;
      });
      // nudge overlapping labels downwards so none sit on top of another
      const placed = [];
      this._labelEls.filter((e) => e._vis).sort((a, b) => a._y - b._y).forEach((e) => {
        const w = e.offsetWidth, h = e.offsetHeight;
        let y = e._y;
        for (const p of placed) if (e._x < p.x + p.w && e._x + w > p.x && y < p.y + p.h && y + h > p.y) y = p.y + p.h + 2;
        placed.push({ x: e._x, y, w, h });
        e.style.transform = `translate(${e._x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
    }
    profileSamples() {
      const m = this.meta, out = [];
      if (this.profileAxis === "ew") { const y = Math.round(this.profilePos * (m.h - 1)); for (let x = 0; x < m.w; x++) out.push(this.h[y * m.w + x]); }
      else { const x = Math.round(this.profilePos * (m.w - 1)); for (let y = 0; y < m.h; y++) out.push(this.h[y * m.w + x]); }
      return out;
    }
    updateProfileLine() {
      if (!this.pline) return;
      const pts = this.profileSamples(), n = pts.length, pos = this.pline.geometry.attributes.position, k = this.vScale();
      for (let i = 0; i < 600; i++) {
        const j = Math.min(n - 1, Math.round(i / 599 * (n - 1))), f = j / (n - 1);
        const x = this.profileAxis === "ew" ? (f - 0.5) * this.wkm : (this.profilePos - 0.5) * this.wkm;
        const z = this.profileAxis === "ew" ? (this.profilePos - 0.5) * this.hkm : (f - 0.5) * this.hkm;
        pos.setXYZ(i, x, Math.max(pts[j], this.sea) * k + 0.004 * Math.max(this.wkm, this.hkm), z);
      }
      pos.needsUpdate = true;
    }
    drawProfile() {
      if (!this.h) return;
      const pts = this.profileSamples(), m = this.meta, n = pts.length;
      const lenKm = n * m.mpp / 1000;
      const W = 900, H = 190, x0 = 64, x1 = 886, y0 = 158, y1 = 14;
      let lo = Math.min(...pts, this.sea), hi = Math.max(...pts, this.sea, 1);
      const pad = (hi - lo) * 0.06 || 10; lo -= pad; hi += pad;
      const X = (i) => x0 + i / (n - 1) * (x1 - x0), Y = (v) => y0 - (v - lo) / (hi - lo) * (y0 - y1);
      const d = pts.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
      const step = niceStep((hi - lo) / 4);
      let g = "";
      for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="c-grid"/><text x="${x0 - 6}" y="${Y(v) + 4}" class="c-tick" text-anchor="end">${(Math.round(v) || 0).toLocaleString()}</text>`;
      const kstep = niceStep(lenKm / 5);
      for (let k = 0; k <= lenKm; k += kstep) g += `<text x="${x0 + k / lenKm * (x1 - x0)}" y="${y0 + 16}" class="c-tick" text-anchor="middle">${k} km</text>`;
      // steepest slope along the profile (true scale)
      let smax = 0; for (let i = 1; i < n; i++) smax = Math.max(smax, Math.abs(pts[i] - pts[i - 1]) / m.mpp);
      $("svg", $(".v-profile", this.el)).innerHTML = g +
        `<path d="${d}L${X(n - 1)},${y0}L${X(0)},${y0}Z" class="p-fill"/><path d="${d}" class="p-line"/>
         <line x1="${x0}" x2="${x1}" y1="${Y(this.sea)}" y2="${Y(this.sea)}" class="p-sea"/><text x="${x1}" y="${Y(this.sea) - 4}" class="c-tick" text-anchor="end">sea level ${this.sea} m</text>`;
      const [s, nn, w, e] = m.bbox;
      const where = this.profileAxis === "ew" ? `latitude ≈ ${(nn - this.profilePos * (nn - s)).toFixed(3)}°` : `longitude ≈ ${(w + this.profilePos * (e - w)).toFixed(3)}°`;
      $("#v-pcap", this.el).textContent = `Profile ${this.profileAxis === "ew" ? "west → east" : "north → south"} at ${where}, true vertical scale in metres. Range ${Math.round(Math.min(...pts)).toLocaleString()} to ${Math.round(Math.max(...pts)).toLocaleString()} m; steepest step ≈ ${(Math.atan(smax) * 180 / Math.PI).toFixed(0)}° at ${Math.round(m.mpp)} m sampling.`;
    }
    updateOutputs() {
      $("#v-sea-o", this.el).textContent = `${this.sea > 0 ? "+" : ""}${this.sea} m`;
      $("#v-exag-o", this.el).textContent = `${this.exag}×`;
      if (!this.meta) return;
      const m = this.meta, cell = (m.mpp / 1000) ** 2;
      let landN = 0; for (const z of this.h) if (z > this.sea) landN++;
      $("#v-stats", this.el).innerHTML = `<span>${esc(m.name)}</span><span>area shown ${this.wkm.toFixed(0)} × ${this.hkm.toFixed(0)} km</span><span>cell ${Math.round(m.mpp)} m</span><span>highest ${m.max.toLocaleString()} m</span><span>deepest ${m.min.toLocaleString()} m</span><span>land above sea level (model cells): ${(landN * cell).toFixed(landN * cell < 10 ? 2 : 0)} km²</span>`;
    }
    dispose() {
      window.removeEventListener("resize", this.onResize);
      if (this.ro) this.ro.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.renderer) { this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.renderer.dispose(); }
    }
  }
  function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(Math.max(x, 1e-9)))); const f = x / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }

  // ------------------------------------------------------------ reader
  function renderReader(r) {
    document.title = `${r.authors.split(",")[0].split(" ").pop()} ${r.year} · Nissology`;
    const u = U[r.unit];
    const done = store.has(r.id);
    view.innerHTML = `
    <header class="reader-head">
      <p class="eyebrow"><a href="#${u.id}">Unit ${u.num} · ${esc(u.short)}</a> · ${r.hosted ? "Annotated study edition" : "Companion guide"}</p>
      <h1 class="rtitle">${esc(r.title)}</h1>
      <p class="muted">${esc(r.authors)} (${r.year}). <em>${esc(r.journal)}</em>. <a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">doi:${esc(r.doi)}</a></p>
      <p class="small mono">Licence: ${esc(r.license)} · about ${r.minutes || 60} min</p>
      <div class="rbtns"><button type="button" class="btn" id="mark">${done ? "Marked as read ✓" : "Mark as read"}</button>
        ${r.hosted ? `<a class="btn btn-ghost" href="pdfs/${r.id}-annotated.pdf" target="_blank" rel="noopener">Open the annotated PDF in a new tab</a>` : `<a class="btn btn-ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Read at the publisher</a>${r.free_url ? `<a class="btn btn-ghost" href="${esc(r.free_url)}" target="_blank" rel="noopener">Free copy</a>` : ""}`}</div>
    </header>
    <div class="reader ${r.hosted ? "" : "reader-guide-only"}">
      <aside class="guide">
        <h2>Why we read it</h2><p>${esc(r.why)}</p>
        <h2>Before you start</h2><ul>${r.before.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        <h2>Reading route</h2><ol class="route">${r.route.map(([w, t]) => `<li><b>${esc(w)}</b> ${esc(t)}</li>`).join("")}</ol>
        ${r.summary ? `<h2>What the paper reports</h2><ul>${r.summary.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
        <h2>Key terms</h2><dl class="terms">${r.terms.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>
        <h2>Questions</h2><ol>${r.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
      </aside>
      ${r.hosted ? `<section class="paper"><div class="paper-bar"><div class="seg" role="group" aria-label="Zoom"><button type="button" id="zout" aria-label="Zoom out">−</button><button type="button" id="zin" aria-label="Zoom in">+</button></div><span class="small muted" id="pinfo">Loading paper…</span></div><div class="pages" id="pages"></div></section>
      <aside class="notes"><h2>Annotations</h2><p class="small muted">Select a note to jump to its highlight, or select a highlight on the page.</p><ol class="notelist" id="notelist"></ol></aside>` : ""}
    </div>`;
    $("#mark").addEventListener("click", (e) => { store.toggle(r.id); e.target.textContent = store.has(r.id) ? "Marked as read ✓" : "Mark as read"; });
    if (r.hosted) loadPaper(r);
  }

  async function loadPaper(r) {
    const info = $("#pinfo");
    try {
      if (!annotations) annotations = await (await fetch("data/annotations.json")).json();
    } catch (e) { info.textContent = "Annotations could not load."; return; }
    const A = annotations[r.id];
    const list = $("#notelist");
    list.innerHTML = A.notes.map((n, i) => `<li><button type="button" class="note k-b-${n.kind}" data-i="${i}"><span class="nk">${i + 1} · ${esc(KINDS[n.kind].label)} · p. ${n.orig_page + 1}</span><q>${esc(n.quote)}</q><span class="nt">${esc(n.note)}</span></button></li>`).join("");
    if (!window.pdfjsLib) { info.textContent = "The PDF viewer could not load here. Use 'Open the annotated PDF in a new tab' above."; return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdf.worker.min.js";
    let pdf;
    try { pdf = await pdfjsLib.getDocument({ url: A.file }).promise; }
    catch (e) { info.textContent = "The paper could not load. Use 'Open the annotated PDF in a new tab' above."; return; }
    let zoom = 1;
    const pagesEl = $("#pages");
    const byPage = {};
    A.notes.forEach((n, i) => (byPage[n.page] ||= []).push([n, i]));
    const first = await pdf.getPage(1);
    const vp0 = first.getViewport({ scale: 1 });
    const slots = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const d = document.createElement("div");
      d.className = "pg"; d.dataset.p = p; d.style.aspectRatio = `${vp0.width} / ${vp0.height}`;
      d.innerHTML = `<canvas></canvas><div class="hl-layer"></div><span class="pgno mono">${p}</span>`;
      (byPage[p - 1] || []).forEach(([n, i]) => n.rects.forEach((rc, j) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = `hl k-${n.kind}`; b.dataset.i = i;
        b.style.left = rc[0] * 100 + "%"; b.style.top = rc[1] * 100 + "%"; b.style.width = (rc[2] - rc[0]) * 100 + "%"; b.style.height = (rc[3] - rc[1]) * 100 + "%";
        b.setAttribute("aria-label", `Annotation ${i + 1}: ${KINDS[n.kind].label}`);
        if (j === 0) b.innerHTML = `<span class="hl-n">${i + 1}</span>`;
        $(".hl-layer", d).appendChild(b);
      }));
      pagesEl.appendChild(d); slots.push(d);
    }
    info.textContent = `${pdf.numPages} pages: a study cover page, the article with ${A.notes.length} highlights, and the reading guide at the end`;
    const rendered = new Map();
    const renderPage = async (d) => {
      const p = +d.dataset.p, key = `${p}@${zoom}`;
      if (rendered.get(p) === key) return; rendered.set(p, key);
      const page = await pdf.getPage(p);
      const w = d.clientWidth || 600;
      const vp = page.getViewport({ scale: (w / page.getViewport({ scale: 1 }).width) * Math.min(window.devicePixelRatio || 1, 2) });
      const c = $("canvas", d); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp, annotationMode: pdfjsLib.AnnotationMode.DISABLE }).promise;
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && renderPage(e.target)), { root: null, rootMargin: "600px 0px" });
    slots.forEach((d) => io.observe(d));
    cleanup.push(() => { io.disconnect(); pdf.destroy(); });
    const select = (i, scrollPage) => {
      $$(".note", list).forEach((b) => b.classList.toggle("sel", +b.dataset.i === i));
      $$(".hl", pagesEl).forEach((b) => b.classList.toggle("sel", +b.dataset.i === i));
      const n = A.notes[i];
      if (scrollPage) {
        const hl = $(`.hl[data-i="${i}"]`, pagesEl);
        (hl || slots[n.page]).scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const nb = $(`.note[data-i="${i}"]`, list);
        nb.scrollIntoView({ behavior: "smooth", block: "nearest" });
        showPop(i);
      }
    };
    let pop;
    const showPop = (i) => {
      const n = A.notes[i], hl = $(`.hl[data-i="${i}"]`, pagesEl); if (!hl) return;
      pop?.remove();
      pop = document.createElement("div"); pop.className = `hlpop k-b-${n.kind}`;
      pop.innerHTML = `<b>${i + 1} · ${esc(KINDS[n.kind].label)}</b><p>${esc(n.note)}</p><button type="button" class="btn-s">Close</button>`;
      hl.closest(".pg").appendChild(pop);
      pop.style.top = `calc(${hl.style.top} + ${hl.style.height} + 6px)`;
      $("button", pop).addEventListener("click", () => pop.remove());
    };
    list.addEventListener("click", (e) => { const b = e.target.closest(".note"); if (b) { select(+b.dataset.i, true); showPop(+b.dataset.i); } });
    pagesEl.addEventListener("click", (e) => { const b = e.target.closest(".hl"); if (b) select(+b.dataset.i, false); });
    const setZoom = (z) => { zoom = Math.max(0.6, Math.min(1.8, z)); pagesEl.style.setProperty("--zoom", zoom); slots.forEach((d) => { if (d.getBoundingClientRect().bottom > -800 && d.getBoundingClientRect().top < innerHeight + 800) renderPage(d); }); };
    $("#zin").addEventListener("click", () => setZoom(zoom + 0.2));
    $("#zout").addEventListener("click", () => setZoom(zoom - 0.2));
  }

  // ------------------------------------------------------------ boot
  renderNav();
  route();
})();
