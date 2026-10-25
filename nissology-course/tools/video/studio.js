/* Deterministic scene renderer for the course videos.
   The page loads a manifest (?m=path), preloads everything, then exposes window.renderAt(t) for frame capture. */
(() => {
  const qs = new URLSearchParams(location.search);
  const $ = (s, el = document) => el.querySelector(s);
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => (1 - Math.cos(Math.PI * clamp(x))) / 2;
  const fadeIn = (lt, at, len = 0.6) => ease((lt - at) / len);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let M, PH, LAND, current = -1, update = null, gl = null;
  const sceneEl = $("#scene");

  const photoURL = (id) => `/site/media/photos/${id}.jpg`;
  const credit = (id) => (PH[id] ? `<div class="credit">${esc(PH[id].credit)}</div>` : "");

  // ------------------------------------------------------------------ scene builders: (el, s) => update(localTime)
  const B = {
    title(el, s) {
      el.innerHTML = `${s.photo ? `<div class="title-bg" style="background-image:url(${photoURL(s.photo)})"></div><div class="title-shade"></div>${credit(s.photo)}` : ""}
        <div class="title-box"><div class="eyebrow">${esc(s.eyebrow || "")}</div><div class="h-display">${esc(s.title)}</div>
        ${s.sub ? `<div class="h-sub">${esc(s.sub)}</div>` : ""}<div class="rule"></div>${s.coords ? `<div class="coords">${esc(s.coords)}</div>` : ""}</div>`;
      const bg = $(".title-bg", el), box = $(".title-box", el), rule = $(".rule", el);
      return (lt) => {
        if (bg) bg.style.transform = `scale(${1.04 + 0.06 * lt / s.dur})`;
        box.style.opacity = fadeIn(lt, 0.1, 0.9);
        box.style.transform = `translateY(${(1 - fadeIn(lt, 0.1, 0.9)) * 18}px)`;
        rule.style.width = `${ease((lt - 0.5) / 1.2) * 100}%`;
      };
    },
    photo(el, s) {
      el.innerHTML = `<div class="ph-wrap"><div class="ph-img ${s.fit === "contain" ? "contain" : ""}" style="background-image:url(${photoURL(s.photo)})"></div>
        ${s.caption ? `<div class="ph-cap"><b>${esc(s.caption)}</b>${s.subcap ? `<span>${esc(s.subcap)}</span>` : ""}</div>` : ""}</div>${credit(s.photo)}`;
      const img = $(".ph-img", el), cap = $(".ph-cap", el);
      const [z0, z1] = s.zoom || [1.04, 1.16];
      const [x0, y0, x1, y1] = s.pan || [0, 0, -2, -1];
      return (lt) => {
        const p = lt / s.dur;
        img.style.transform = `scale(${z0 + (z1 - z0) * p}) translate(${x0 + (x1 - x0) * p}%, ${y0 + (y1 - y0) * p}%)`;
        if (cap) cap.style.opacity = fadeIn(lt, 0.2, 0.8);
      };
    },
    points(el, s) {
      const items = s.items.map((x, i) => `<li><i>${i + 1}</i><span>${x}</span></li>`).join("");
      el.innerHTML = `<div class="pad">${s.eyebrow ? `<div class="eyebrow">${esc(s.eyebrow)}</div>` : ""}<div class="h2">${esc(s.head)}</div>
        ${s.photo ? `<div class="split"><ul class="pts">${items}</ul><div class="side-photo" style="background-image:url(${photoURL(s.photo)})">${credit(s.photo)}</div></div>` : `<ul class="pts">${items}</ul>`}</div>`;
      const lis = [...el.querySelectorAll(".pts li")], h = $(".h2", el), sp = $(".side-photo", el);
      const at = s.at || s.items.map((_, i) => 0.6 + i * (s.dur - 1.6) / s.items.length);
      return (lt) => {
        h.style.opacity = fadeIn(lt, 0, 0.5);
        if (sp) { sp.style.opacity = fadeIn(lt, 0.3, 0.8); sp.style.transform = `scale(${1 + 0.04 * lt / s.dur})`; }
        lis.forEach((li, i) => { const f = fadeIn(lt, at[i], 0.5); li.style.opacity = f; li.style.transform = `translateX(${(1 - f) * 24}px)`; });
      };
    },
    diagram(el, s) {
      el.innerHTML = `<div class="fig">${s.head ? `<div class="h2">${esc(s.head)}</div>` : ""}${DIAGRAMS[s.d]()}</div>`;
      const svg = $("svg", el);
      svg.removeAttribute("aria-label");
      const kids = [...svg.children].filter((k) => k.tagName !== "defs");
      const n = kids.length, span = Math.max(1, s.dur * (s.reveal || 0.7) - 0.8);
      return (lt) => { kids.forEach((k, i) => { k.style.opacity = fadeIn(lt, 0.3 + (i / n) * span, 0.5); }); };
    },
    stat(el, s) {
      const many = s.stats;
      el.innerHTML = many
        ? `<div class="stat"><div class="eyebrow">${esc(s.eyebrow || "")}</div><div class="h2">${esc(s.head || "")}</div><div class="stats-row">${many.map((x) => `<div><div class="stat-val" data-v="${x.v}">${esc(x.v)}</div><div class="stat-lab">${esc(x.label)}</div></div>`).join("")}</div>${s.sub ? `<div class="stat-sub">${esc(s.sub)}</div>` : ""}</div>`
        : `<div class="stat"><div class="eyebrow">${esc(s.eyebrow || "")}</div><div class="stat-val" data-v="${esc(s.value)}">${esc(s.value)}</div><div class="stat-lab">${esc(s.label)}</div>${s.sub ? `<div class="stat-sub">${esc(s.sub)}</div>` : ""}</div>`;
      const vals = [...el.querySelectorAll(".stat-val")], labs = [...el.querySelectorAll(".stat-lab")], sub = $(".stat-sub", el);
      const parse = (v) => { const m = String(v).match(/^([^\d\-−]*)([\-−]?[\d,]*\.?\d+)(.*)$/); return m ? [m[1], parseFloat(m[2].replace(/,/g, "").replace("−", "-")), m[3], (m[2].split(".")[1] || "").length, m[2].includes(",")] : null; };
      return (lt) => {
        vals.forEach((v, i) => {
          const st = 0.2 + i * 0.7, p = parse(v.dataset.v);
          v.style.opacity = fadeIn(lt, st, 0.4);
          if (p) {
            const k = ease((lt - st) / 1.4), x = p[1] * k;
            let txt = x.toFixed(p[3]); if (p[4]) txt = Number(txt).toLocaleString("en-GB", { minimumFractionDigits: p[3], maximumFractionDigits: p[3] });
            v.textContent = p[0] + txt.replace("-", "−") + p[2];
          }
          if (labs[i]) labs[i].style.opacity = fadeIn(lt, st + 0.5, 0.6);
        });
        if (sub) sub.style.opacity = fadeIn(lt, 1.6, 0.8);
      };
    },
    quote(el, s) {
      el.innerHTML = `<div class="quote"><div class="qbar"></div><q>${esc(s.text)}</q><cite>${esc(s.cite)}</cite></div>`;
      const q = $("q", el), c = $("cite", el), bar = $(".qbar", el);
      return (lt) => { bar.style.transform = `scaleY(${ease(lt / 0.8)})`; q.style.opacity = fadeIn(lt, 0.2, 0.9); c.style.opacity = fadeIn(lt, 1.0, 0.8); };
    },
    timeline(el, s) {
      const W = 820, H = 360, x0 = 30, x1 = 790, y = 200;
      const [a, b] = s.range;
      const X = (v) => x0 + (v - a) / (b - a) * (x1 - x0);
      let g = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="tl-ax"/>`;
      s.events.forEach(([yr, lab], i) => {
        const up = i % 2 === 0, ty = up ? y - 60 - (i % 4 === 0 ? 0 : 0) : y + 70;
        const anchor = X(yr) < 120 ? "start" : X(yr) > 700 ? "end" : "middle";
        g += `<g class="ev"><circle cx="${X(yr)}" cy="${y}" r="7" class="g-dot" style="fill:var(--accent)"/><line x1="${X(yr)}" y1="${y}" x2="${X(yr)}" y2="${up ? y - 40 : y + 40}" class="d-leader"/>
          <text x="${X(yr)}" y="${up ? ty : ty - 18}" class="tl-y" text-anchor="${anchor}">${esc(s.fmt ? s.fmt(yr) : yr)}</text>
          ${String(lab).split("|").map((ln, j) => `<text x="${X(yr)}" y="${(up ? ty + 20 : ty) + j * 19}" class="tl-t" text-anchor="${anchor}">${esc(ln)}</text>`).join("")}</g>`;
      });
      el.innerHTML = `<div class="tl">${s.head ? `<div class="h2">${esc(s.head)}</div>` : ""}<svg viewBox="0 0 ${W} ${H}">${g}</svg></div>`;
      const evs = [...el.querySelectorAll(".ev")], ax = $(".tl-ax", el);
      const at = s.events.map((_, i) => 0.5 + i * (s.dur - 1.5) / s.events.length);
      return (lt) => { ax.style.opacity = fadeIn(lt, 0, 0.5); evs.forEach((e, i) => { e.style.opacity = fadeIn(lt, at[i], 0.5); }); };
    },
    compare(el, s) {
      el.innerHTML = `<div class="pad">${s.head ? `<div class="h2">${esc(s.head)}</div>` : ""}<div class="cmp">${s.cols.map(([h, lines]) => `<div><h3>${esc(h)}</h3>${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>`).join("")}</div></div>`;
      const cols = [...el.querySelectorAll(".cmp > div")];
      return (lt) => cols.forEach((c, i) => { const f = fadeIn(lt, 0.4 + i * (s.dur - 1.5) / cols.length, 0.6); c.style.opacity = f; c.style.transform = `translateY(${(1 - f) * 20}px)`; });
    },
    globe(el, s) {
      el.innerHTML = `<div class="globe"><svg viewBox="0 0 960 540"></svg><div class="g-lab">${esc(s.label)}${s.small ? `<small>${esc(s.small)}</small>` : ""}</div></div>`;
      const svg = $("svg", el), lab = $(".g-lab", el);
      const from = s.origin || [s.lon - 70, s.lat * 0.3];
      const grat = d3.geoGraticule10();
      return (lt) => {
        const p = ease(lt / (s.dur * 0.55)), z = ease((lt - s.dur * 0.45) / (s.dur * 0.45));
        const lon = from[0] + (s.lon - from[0]) * p, lat = from[1] + (s.lat - from[1]) * p;
        const scale = 230 * (1 + (s.zoom || 2.2) * z);
        const proj = d3.geoOrthographic().rotate([-lon, -lat]).translate([480, 285]).scale(scale).clipAngle(90);
        const path = d3.geoPath(proj);
        const [x, y] = proj([s.lon, s.lat]);
        const pulse = 8 + 6 * Math.abs(Math.sin(lt * 2.4));
        svg.innerHTML = `<path d="${path({ type: "Sphere" })}" class="g-sea"/><path d="${path(grat)}" class="g-grat"/><path d="${path(LAND)}" class="g-land"/>
          <circle cx="${x}" cy="${y}" r="${pulse + 6}" class="g-ring"/><circle cx="${x}" cy="${y}" r="6" class="g-dot"/>`;
        lab.style.left = `${x + 30}px`; lab.style.top = `${y - 30}px`; lab.style.opacity = fadeIn(lt, s.dur * 0.55, 0.8);
      };
    },
    map(el, s) {
      el.innerHTML = `<div class="globe"><svg viewBox="0 0 960 540"></svg></div>`;
      const svg = $("svg", el);
      const proj = d3.geoEqualEarth().rotate([-150, 0]).fitExtent([[30, 50], [930, 510]], { type: "Sphere" });
      const path = d3.geoPath(proj);
      const base = `<path d="${path({ type: "Sphere" })}" class="g-sea"/><path d="${path(d3.geoGraticule10())}" class="g-grat"/><path d="${path(LAND)}" class="g-land"/>`;
      const at = s.points.map((_, i) => 0.6 + i * (s.dur - 1.5) / s.points.length);
      return (lt) => {
        svg.innerHTML = base + s.points.map(([lon, lat, name], i) => {
          const [x, y] = proj([lon, lat]), f = fadeIn(lt, at[i], 0.5);
          return `<g opacity="${f}"><circle cx="${x}" cy="${y}" r="${6 + 10 * (1 - f)}" class="g-ring"/><circle cx="${x}" cy="${y}" r="5" class="g-dot"/><text x="${x + 12}" y="${y - 10}" class="map-lab">${esc(name)}</text></g>`;
        }).join("");
      };
    },
    chart(el, s) {
      el.innerHTML = `<div class="fig">${s.head ? `<div class="h2">${esc(s.head)}</div>` : ""}<svg viewBox="0 0 820 360"></svg></div>`;
      const svg = $("svg", el);
      return CHARTS[s.c](svg, s);
    },
    terrain(el, s) {
      el.innerHTML = `<div class="t-title">${esc(s.title || "")}</div><div class="t-hud"></div><div class="t-labels"></div>`;
      return makeTerrain(el, s);
    },
  };

  // ------------------------------------------------------------------ animated charts
  const CHARTS = {
    kench(svg, s) {
      const rows = [["Nanumea", 356.1, -1.32], ["Niutao", 235.2, 0.34], ["Nanumaga", 301.0, 4.71], ["Nui", 342.8, 7.61], ["Vaitupu", 522.9, 12.27], ["Nukufetau", 314.4, 19.40], ["Funafuti", 261.2, 10.06], ["Nukulaelae", 176.4, 10.00], ["Niulakita", 42.1, 0.05]];
      const x0 = 150, x1 = 760, X = (v) => x0 + (v + 1) / 8 * (x1 - x0);
      return (lt) => {
        let g = "";
        for (let v = 0; v <= 6; v += 2) g += `<line x1="${X(v)}" x2="${X(v)}" y1="10" y2="${rows.length * 36 + 6}" class="c-grid"/><text x="${X(v)}" y="${rows.length * 36 + 26}" class="c-tick" text-anchor="middle">${v}%</text>`;
        rows.forEach(([n, a, d], i) => {
          const pct = d / a * 100 * ease((lt - 0.4 - i * 0.25) / 0.9), y = 14 + i * 36;
          const xa = X(Math.min(0, pct)), xb = X(Math.max(0, pct));
          g += `<text x="${x0 - 12}" y="${y + 19}" class="c-val" text-anchor="end" ${n === "Funafuti" ? 'font-weight="700"' : ""}>${n}</text><rect x="${xa}" y="${y}" width="${Math.max(xb - xa, 0.5)}" height="26" rx="3" class="${d < 0 ? "c-neg" : "c-pos"}"/>
            <text x="${(d < 0 ? xa - 8 : xb + 8)}" y="${y + 19}" class="c-tick" text-anchor="${d < 0 ? "end" : "start"}">${pct > 0 ? "+" : ""}${pct.toFixed(2)}%</text>`;
        });
        svg.innerHTML = g + `<line x1="${X(0)}" x2="${X(0)}" y1="6" y2="${rows.length * 36 + 4}" class="c-axis"/>`;
      };
    },
    coralage(svg, s) {
      const pts = [["Pitcairn", 0.8, 24], ["Ducie", 8, 35], ["Henderson", 13, 53], ["Oeno", 16, 58]];
      const x0 = 70, x1 = 780, y0 = 310, y1 = 20, X = (a) => x0 + a / 18 * (x1 - x0), Y = (r) => y0 - r / 70 * (y0 - y1);
      return (lt) => {
        let g = "";
        for (let v = 0; v <= 70; v += 10) g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="c-grid"/><text x="${x0 - 8}" y="${Y(v) + 4}" class="c-tick" text-anchor="end">${v}</text>`;
        for (let a = 0; a <= 18; a += 3) g += `<text x="${X(a)}" y="${y0 + 22}" class="c-tick" text-anchor="middle">${a} Ma</text>`;
        pts.forEach(([n, a, r], i) => { const f = fadeIn(lt, 0.6 + i * 0.8, 0.5); g += `<g opacity="${f}"><circle cx="${X(a)}" cy="${Y(r)}" r="${8 + 8 * (1 - f)}" class="c-pt"/><text x="${X(a) + 14}" y="${Y(r) + 5}" class="c-val">${n}: ${r} species</text></g>`; });
        svg.innerHTML = g + `<text x="12" y="20" class="c-tick">coral species</text>`;
      };
    },
    mw(svg, s) {
      const P = 100, x0 = 60, x1 = 790, y0 = 320, y1 = 20;
      return (lt) => {
        const area = Math.pow(10, 1 + 2 * ease((lt - s.dur * 0.45) / (s.dur * 0.35)));
        const I0 = 6, E1 = 6 / Math.pow(area, 0.35);
        const I = (S) => I0 * Math.pow(1 - S / P, 1.6), E = (S) => E1 * Math.pow(S / P, 1.6);
        let lo = 0, hi = P; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; I(m) > E(m) ? lo = m : hi = m; }
        const Seq = lo, X = (S) => x0 + S / P * (x1 - x0), Y = (r) => y0 - Math.min(r, 7) / 7 * (y0 - y1);
        const line = (f, frac) => Array.from({ length: Math.max(2, Math.round(101 * frac)) }, (_, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(f(i)).toFixed(1)}`).join("");
        const d1 = ease((lt - 0.3) / 1.5), d2 = ease((lt - 1.8) / 1.5), dE = fadeIn(lt, 3.6, 0.6);
        svg.innerHTML = `<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" class="c-axis"/><line x1="${x0}" x2="${x0}" y1="${y0}" y2="${y1}" class="c-axis"/>
          <path d="${line(I, d1)}" stroke="var(--s1)" stroke-width="4" fill="none"/><path d="${line(E, d2)}" stroke="var(--s2)" stroke-width="4" fill="none"/>
          <text x="${X(5)}" y="${Y(I(5)) - 12}" class="c-val" fill="var(--s1)" opacity="${d1}" style="fill:var(--s1);font-weight:700">immigration</text>
          <text x="${X(55)}" y="${Y(E(55)) + 26}" class="c-val" text-anchor="middle" opacity="${d2}" style="fill:var(--s2);font-weight:700">extinction</text>
          <g opacity="${dE}"><line x1="${X(Seq)}" x2="${X(Seq)}" y1="${Y(I(Seq))}" y2="${y0}" stroke="var(--accent)" stroke-dasharray="4 4"/><circle cx="${X(Seq)}" cy="${Y(I(Seq))}" r="8" class="c-pt"/>
          <text x="${X(Seq) + 12}" y="${Y(I(Seq)) - 12}" class="c-val" style="font-weight:700">equilibrium ≈ ${Seq.toFixed(0)} species</text></g>
          <text x="${x1}" y="${y1 + 10}" class="c-val" text-anchor="end">island area: ${Math.round(area).toLocaleString()} km²</text>
          <text x="${(x0 + x1) / 2}" y="${y0 + 30}" class="c-tick" text-anchor="middle">number of species on the island</text>`;
      };
    },
  };

  // ------------------------------------------------------------------ terrain
  const DEM_CACHE = {};
  async function loadDEM(id) {
    if (DEM_CACHE[id]) return DEM_CACHE[id];
    const meta = M.dems[id];
    const img = new Image(); img.src = `/site/data/dem/${id}.png`; await img.decode();
    const c = document.createElement("canvas"); c.width = meta.w; c.height = meta.h;
    const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, meta.w, meta.h).data, h = new Float32Array(meta.w * meta.h);
    for (let i = 0; i < h.length; i++) h[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    return (DEM_CACHE[id] = { meta, h });
  }
  function colorize(h, meta, sea, col) {
    const mx = Math.max(meta.max, 50);
    for (let i = 0; i < h.length; i++) {
      const z = h[i]; let r, g, b;
      if (z > sea) {
        const t = Math.min(1, (z - sea) / mx);
        if (z <= 0) { r = 0.86; g = 0.80; b = 0.60; }
        else if (t < 0.25) { const u = t / 0.25; r = 0.56 + 0.22 * u; g = 0.66 + 0.06 * u; b = 0.42 + 0.04 * u; }
        else if (t < 0.7) { const u = (t - 0.25) / 0.45; r = 0.78 - 0.14 * u; g = 0.72 - 0.20 * u; b = 0.46 - 0.10 * u; }
        else { const u = (t - 0.7) / 0.3; r = 0.64 + 0.30 * u; g = 0.52 + 0.42 * u; b = 0.36 + 0.58 * u; }
      } else { const d = Math.min(1, Math.sqrt((sea - z) / 5000)); r = 0.62 - 0.55 * d; g = 0.84 - 0.62 * d; b = 0.90 - 0.48 * d; }
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
  }
  function makeTerrain(el, s) {
    const { meta, h } = DEM_CACHE[s.dem];
    const THREE = window.THREE;
    const canvas = $("#gl"); canvas.style.display = "block";
    if (!gl) {
      gl = { renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }) };
      gl.renderer.setPixelRatio(1); gl.renderer.setSize(960, 540, false);
    }
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#e6edec");
    const cam = new THREE.PerspectiveCamera(38, 960 / 540, 0.01, 5000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.65));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(-1, 1.2, -0.8); scene.add(sun);
    const wkm = meta.w * meta.mpp / 1000, hkm = meta.h * meta.mpp / 1000;
    const geo = new THREE.PlaneGeometry(wkm, hkm, meta.w - 1, meta.h - 1); geo.rotateX(-Math.PI / 2);
    const col = new Float32Array(meta.w * meta.h * 3); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); scene.add(mesh);
    const wg = new THREE.PlaneGeometry(wkm, hkm); wg.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ color: 0x2f7fb0, transparent: true, opacity: 0.38, depthWrite: false }));
    water.visible = s.water !== false; scene.add(water);
    const ex = s.exag || 3, k = ex / 1000;
    const pos = geo.attributes.position;
    for (let i = 0; i < h.length; i++) pos.setY(i, h[i] * k);
    pos.needsUpdate = true; geo.computeVertexNormals();
    const [sea0, sea1] = s.sea || [0, 0];
    let lastSea = null;
    const labelsEl = $(".t-labels", el), hud = $(".t-hud", el);
    labelsEl.innerHTML = (s.labels || []).map(([la, lo, t, sub]) => `<div class="t-lab"><b>${esc(t)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`).join("");
    const labs = [...labelsEl.children];
    const [bs, bn, bw, be] = meta.bbox, my = (la) => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360));
    const span = Math.max(wkm, hkm) * (s.zoom || 1);
    return (lt) => {
      const p = lt / s.dur;
      const sea = sea0 + (sea1 - sea0) * ease((lt - (s.seaAt || 1)) / (s.seaLen || s.dur * 0.6));
      if (sea !== lastSea) { colorize(h, meta, sea, col); geo.attributes.color.needsUpdate = true; water.position.y = sea * k; lastSea = sea; }
      const ang = (s.az0 ?? -20) + ((s.az1 ?? 25) - (s.az0 ?? -20)) * ease(p) ;
      const el0 = (s.el0 ?? 38), el1 = (s.el1 ?? 32), elv = (el0 + (el1 - el0) * ease(p)) * Math.PI / 180;
      const dist = span * ((s.d0 ?? 1.15) + ((s.d1 ?? 0.95) - (s.d0 ?? 1.15)) * ease(p));
      const a = ang * Math.PI / 180;
      cam.position.set(Math.sin(a) * Math.cos(elv) * dist, Math.sin(elv) * dist, Math.cos(a) * Math.cos(elv) * dist);
      cam.lookAt(0, 0, 0);
      gl.renderer.render(scene, cam);
      hud.textContent = s.hud === false ? "" : `vertical ×${ex}  ·  sea level ${sea >= 0 ? "+" : ""}${Math.round(sea)} m`;
      labs.forEach((lab, i) => {
        const [la, lo] = s.labels[i];
        const fx = (lo - bw) / (be - bw), fy = (my(bn) - my(la)) / (my(bn) - my(bs));
        const x = Math.min(meta.w - 1, Math.max(0, Math.round(fx * (meta.w - 1)))), y = Math.min(meta.h - 1, Math.max(0, Math.round(fy * (meta.h - 1))));
        const v = new THREE.Vector3((fx - 0.5) * wkm, Math.max(h[y * meta.w + x], sea) * k, (fy - 0.5) * hkm).project(cam);
        lab.style.transform = `translate(${((v.x + 1) / 2 * 960 + 6).toFixed(1)}px, ${((1 - v.y) / 2 * 540 - 12).toFixed(1)}px)`;
        lab.style.opacity = fadeIn(lt, 1 + i * 0.6, 0.5);
      });
    };
  }

  // ------------------------------------------------------------------ timeline driver
  function renderAt(t) {
    let i = M.scenes.findIndex((s) => t < s.start + s.dur);
    if (i < 0) i = M.scenes.length - 1;
    const s = M.scenes[i];
    if (i !== current) {
      current = i;
      $("#gl").style.display = "none";
      sceneEl.innerHTML = `<div class="sc"></div>`;
      update = B[s.type](sceneEl.firstChild, s);
      const dark = ["photo", "globe", "map"].includes(s.type) || (s.type === "title" && false);
      $("#bar").classList.toggle("on-dark", dark);
    }
    const lt = t - s.start;
    update(lt);
    // scene cross-fade in
    sceneEl.style.opacity = s.type === "terrain" ? 1 : Math.min(1, 0.25 + lt / 0.35);
    // caption
    const cue = (s.cues || []).find((c) => t >= c.start && t < c.end);
    $("#cap").innerHTML = cue ? `<span>${esc(cue.text)}</span>` : "";
    $("#prog i").style.width = `${(t / M.dur) * 100}%`;
  }

  async function boot() {
    M = await (await fetch(qs.get("m"))).json();
    PH = M.photos || {};
    $("#bar-title").textContent = M.bar || "";
    const topo = await (await fetch("/site/data/land-50m.json")).json();
    LAND = topojson.feature(topo, topo.objects.land);
    await Promise.all(["400 20px Newsreader", "italic 400 20px Newsreader", "500 20px Newsreader", "400 20px 'Source Serif 4'", "600 20px 'Source Serif 4'",
      "italic 400 20px 'Source Serif 4'", "400 20px 'IBM Plex Sans Condensed'", "600 20px 'IBM Plex Sans Condensed'", "400 20px 'IBM Plex Mono'", "500 20px 'IBM Plex Mono'"]
      .map((f) => document.fonts.load(f, "AaĀāŜ×≈–—“”′°")));
    await document.fonts.ready;
    await Promise.all(M.scenes.filter((s) => s.type === "terrain").map((s) => loadDEM(s.dem)));
    const ids = new Set(); M.scenes.forEach((s) => { if (s.photo) ids.add(s.photo); });
    await Promise.all([...ids].map((id) => { const im = new Image(); im.src = photoURL(id); return im.decode().catch(() => console.error("missing photo " + id)); }));
    window.renderAt = renderAt;
    window.VIDEO_DUR = M.dur;
    renderAt(0);
  }
  window.studioReady = boot();
})();
