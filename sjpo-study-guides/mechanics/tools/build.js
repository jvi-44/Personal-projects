// Builds the printable study guide + solutions PDFs, and the platform data file.
//   node build.js            -> pdf/*.pdf and platform/data.js
//   node build.js --html     -> only write the intermediate HTML (no Chromium)
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const katex = require("katex");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

// ---------- load content ----------
const ctx = { console };
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, "content")).filter((f) => f.endsWith(".js")).sort()) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "content", f), "utf8"), ctx, { filename: f });
}
vm.runInContext("this.__G = GUIDE", ctx);
const G = ctx.__G;

// ---------- helpers ----------
function tex(html) {
  if (!html) return "";
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => katex.renderToString(m, { displayMode: true, throwOnError: true }));
  return html.replace(/\$([^$]+?)\$/g, (_, m) => katex.renderToString(m, { displayMode: false, throwOnError: true }));
}
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const CROPS = path.join(ROOT, "crops");
const DPI = 200;
function img(id, scale = 1) {
  const f = path.join(CROPS, id + ".png");
  const { w } = pngSize(f);
  const yearScale = { "2026": 0.84, "2022": 0.9, "2024": 0.92, "2018": 1 }[id.slice(0, 4)] || 1;
  const inches = Math.min((w / DPI) * scale * yearScale, 6.9);
  return `<img class="q" src="file://${f}" style="width:${inches.toFixed(2)}in" alt="SJPO ${id}">`;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const BOX = { s: "5.2cm", m: "8cm", l: "11.5cm" };

// Number everything once so PDFs and platform agree.
let tutN = 0;
for (const ch of G.chapters) {
  let n = 0;
  for (const sec of ch.sections) for (const ex of sec.examples) ex.num = `${ch.n}.${++n}`;
}
for (const t of G.tutorials) t.num = `T${++tutN}`;
const chapterOf = (n) => G.chapters.find((c) => c.n === n);

// ---------- shared print CSS ----------
const fontsCss = fs.readFileSync(path.join(__dirname, "fonts", "fonts.css"), "utf8").replace(/url\((f\d+\.woff2)\)/g, (_, f) => `url(file://${path.join(__dirname, "fonts", f)})`);
const katexCss = fs.readFileSync(require.resolve("katex/dist/katex.min.css"), "utf8").replace(/url\(fonts\//g, `url(file://${path.dirname(require.resolve("katex/dist/katex.min.css"))}/fonts/`);
const CSS = `
${fontsCss}
${katexCss}
@page { size: A4; margin: 18mm 17mm 20mm 17mm; }
:root { --ink:#1d2433; --muted:#5b6475; --rule:#c9cfdb; --accent:#1f5f8b; --accent2:#c2410c; --tint:#eef3f8; --tint2:#fdf2ea; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Source Serif 4', Georgia, serif; font-size: 10.6pt; line-height: 1.5; color: var(--ink); margin: 0; }
h1,h2,h3,h4,.sans { font-family: 'Archivo', 'Helvetica Neue', Arial, sans-serif; }
h4 { font-size: 11pt; margin: 14pt 0 4pt; color: var(--accent); }
p { margin: 0 0 7pt; } ul { margin: 0 0 8pt; padding-left: 18pt; } li { margin-bottom: 2pt; }
.katex { font-size: 1.04em; } .katex-display { margin: 6pt 0; }
.page-break { break-before: page; }
/* cover */
.cover { height: 255mm; display: flex; flex-direction: column; }
.cover .series { font: 700 10pt 'Archivo', sans-serif; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); }
.cover h1 { font-size: 58pt; line-height: 1; margin: 18mm 0 6mm; font-weight: 800; letter-spacing: -.02em; }
.cover .sub { font-size: 13pt; color: var(--muted); max-width: 140mm; }
.cover .kind { display:inline-block; margin-top: 10mm; padding: 4pt 10pt; border: 1.4pt solid var(--ink); font: 700 10pt 'Archivo', sans-serif; letter-spacing:.12em; text-transform: uppercase; }
.cover .fill { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm 12mm; font-family: 'Archivo', sans-serif; font-size: 10pt; }
.cover .fill div { border-bottom: .8pt solid var(--ink); padding-bottom: 2pt; }
.cover .papers { margin-top: 10mm; font-size: 9pt; color: var(--muted); }
.cover .stripe { height: 6mm; background: repeating-linear-gradient(90deg, var(--accent) 0 18mm, var(--accent2) 18mm 24mm, var(--ink) 24mm 26mm); margin-top: 8mm; }
/* contents */
.toc h2 { font-size: 18pt; margin: 0 0 6mm; }
.toc table { width: 100%; border-collapse: collapse; }
.toc td { padding: 3pt 0; border-bottom: .5pt dotted var(--rule); vertical-align: top; }
.toc td.n { width: 14mm; font-family: 'Archivo', sans-serif; font-weight: 700; color: var(--accent); }
.toc tr.ch td { padding-top: 9pt; font-weight: 700; border-bottom: .8pt solid var(--ink); font-family: 'Archivo', sans-serif; }
.howto { margin-top: 8mm; background: var(--tint); padding: 8pt 11pt; font-size: 9.6pt; }
/* chapter opener */
.chap-head { border-top: 3pt solid var(--ink); padding-top: 5pt; display: flex; align-items: baseline; gap: 10pt; }
.chap-head .num { font: 800 40pt/1 'Archivo', sans-serif; color: var(--accent); }
.chap-head h2 { font-size: 24pt; margin: 0; letter-spacing: -.01em; }
.chap-blurb { color: var(--muted); font-style: italic; margin: 4pt 0 10pt; }
.lo { border: 1pt solid var(--ink); padding: 8pt 12pt 4pt; margin: 6pt 0 10pt; display: grid; grid-template-columns: 38mm 1fr; gap: 8pt; }
.lo .lbl { font: 700 9pt 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.lo ol { margin: 0; padding-left: 16pt; list-style: lower-alpha; } .lo li { margin-bottom: 1pt; }
.content-list { columns: 2; font-family: 'Archivo', sans-serif; font-size: 9.5pt; margin-bottom: 8pt; }
/* sections */
h3.sec { font-size: 14pt; margin: 16pt 0 6pt; padding-bottom: 2pt; border-bottom: .8pt solid var(--rule); break-after: avoid; }
h3.sec .n { color: var(--accent); margin-right: 6pt; }
.eq { border: 1.2pt solid var(--accent); background: var(--tint); padding: 4pt 10pt 2pt; margin: 8pt 0; break-inside: avoid; }
.eq-label { font: 700 8.5pt 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); }
.def { border-left: 3pt solid var(--ink); padding: 2pt 0 2pt 9pt; margin: 8pt 0; }
.note { background: var(--tint2); border-left: 3pt solid var(--accent2); padding: 6pt 10pt; margin: 8pt 0; font-size: 10pt; break-inside: avoid; }
.tbl { border-collapse: collapse; margin: 6pt 0 10pt; font-size: 10pt; }
.tbl th, .tbl td { border: .6pt solid var(--rule); padding: 3pt 8pt; text-align: left; }
.tbl th { background: var(--tint); font-family: 'Archivo', sans-serif; font-size: 9pt; }
.small { font-size: 9pt; color: var(--muted); }
/* examples */
.ex { margin: 12pt 0 14pt; break-inside: avoid; }
.ex-head { display: flex; align-items: baseline; gap: 8pt; border-bottom: 1pt solid var(--ink); padding-bottom: 2pt; margin-bottom: 6pt; }
.ex-head .tag { font: 800 10.5pt 'Archivo', sans-serif; text-transform: uppercase; letter-spacing: .06em; }
.ex-head .ref { font: 700 9pt 'Archivo', sans-serif; color: #fff; background: var(--accent); padding: 1pt 6pt; border-radius: 2pt; }
.ex-head .more { margin-left: auto; font-size: 8.5pt; color: var(--muted); font-family: 'Archivo', sans-serif; }
img.q { display: block; max-width: 100%; margin: 2pt 0 4pt; }
.work { border: .9pt solid var(--ink); position: relative; margin-top: 6pt;
  background-image: radial-gradient(circle, #b7bfcc .55pt, transparent .7pt); background-size: 5mm 5mm; background-position: 2.5mm 2.5mm; }
.work .wl { position: absolute; top: 3pt; left: 6pt; font: 700 7.5pt 'Archivo', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); background: #fff; padding: 0 3pt; }
.work .ans { position: absolute; bottom: 5pt; right: 8pt; font: 700 9pt 'Archivo', sans-serif; background: #fff; padding: 2pt 4pt; }
.work .ans span { display: inline-block; width: 30mm; border-bottom: .8pt solid var(--ink); }
.tut { margin: 10pt 0 14pt; break-inside: avoid; }
/* solutions */
.sol { margin: 10pt 0 16pt; }
.sol .ex-head, .sec-mini { break-after: avoid; } .sol .qimg { break-inside: avoid; } .steps li { break-inside: avoid; }
.sol .qimg { opacity: .9; border-left: 2pt solid var(--rule); padding-left: 8pt; margin-bottom: 6pt; }
.steps { counter-reset: st; margin: 0; padding: 0; list-style: none; }
.steps li { counter-increment: st; position: relative; padding-left: 20pt; margin-bottom: 4pt; }
.steps li::before { content: counter(st); position: absolute; left: 0; top: 1pt; width: 13pt; height: 13pt; border-radius: 50%; background: var(--ink); color: #fff; font: 700 7.5pt/13pt 'Archivo', sans-serif; text-align: center; }
.answer { display: inline-block; margin-top: 4pt; border: 1.2pt solid var(--accent); color: var(--accent); font: 800 9.5pt 'Archivo', sans-serif; padding: 2pt 8pt; }
.keynote { margin-top: 6pt; font-size: 9.4pt; background: var(--tint2); padding: 5pt 9pt; border-left: 3pt solid var(--accent2); }
.keynote b { font-family: 'Archivo', sans-serif; }
.sec-mini { font: 700 10pt 'Archivo', sans-serif; color: var(--accent); margin: 14pt 0 2pt; text-transform: uppercase; letter-spacing: .08em; }
`;

function cover(kind, extra) {
  return `<section class="cover">
<div class="series">${esc(G.series)}</div>
<h1>${esc(G.title)}</h1>
<div class="sub">${esc(G.subtitle)}</div>
<div><span class="kind">${kind}</span></div>
<div class="fill"><div>Name</div><div>Class</div><div>Start date</div><div>Target finish</div></div>
<div class="papers">Questions are reproduced from: ${G.papers.join(" · ")}. Each question title gives its source paper and question number. Questions are cropped directly from the original papers, so their numbering and option labels match the originals.</div>
<div class="stripe"></div></section>${extra || ""}`;
}

function toc(withTut) {
  let rows = "";
  for (const ch of G.chapters) {
    rows += `<tr class="ch"><td class="n">${ch.n}</td><td>${esc(ch.title)}</td><td style="text-align:right">${ch.sections.reduce((a, s) => a + s.examples.length, 0)} examples</td></tr>`;
    for (const s of ch.sections) rows += `<tr><td class="n">${s.id}</td><td>${esc(s.title)}</td><td></td></tr>`;
  }
  if (withTut) rows += `<tr class="ch"><td class="n">T</td><td>Tutorial Questions</td><td style="text-align:right">${G.tutorials.length} questions</td></tr>`;
  return `<section class="toc page-break"><h2>Contents</h2><table>${rows}</table>
<div class="howto"><b class="sans">How to use this guide.</b> Read each section, then attempt its examples in the dotted working boxes <i>before</i> watching the worked-solution video on the e-learning platform. Each subsection has a narrated lecture and a narrated walkthrough of its examples. The tutorial questions at the end have no working space: do them on foolscap paper as timed practice, and check them against the separate Solutions booklet.</div></section>`;
}

// ---------- study guide ----------
function exampleBlock(ex) {
  const imgs = ex.img.map((i) => img(i)).join("");
  return `<div class="ex"><div class="ex-head"><span class="tag">Example ${ex.num}</span><span class="ref">SJPO ${esc(ex.ref)}</span></div>
${imgs}<div class="work" style="height:${BOX[ex.box]}"><span class="wl">Working</span><span class="ans">Answer <span></span></span></div></div>`;
}

function guideHtml() {
  let body = cover("Lecture notes · Examples · Tutorial", toc(true));
  for (const ch of G.chapters) {
    body += `<section class="page-break"><div class="chap-head"><span class="num">${ch.n}</span><h2>${esc(ch.title)}</h2></div>
<p class="chap-blurb">${esc(ch.blurb)}</p>
<div class="content-list">${ch.sections.map((s) => `<div>${s.id}&nbsp;&nbsp;${esc(s.title)}</div>`).join("")}</div>
<div class="lo"><div class="lbl">Learning outcomes</div><div>Candidates should be able to:<ol>${ch.outcomes.map((o) => `<li>${tex(o)}</li>`).join("")}</ol></div></div>`;
    for (const sec of ch.sections) {
      body += `<h3 class="sec"><span class="n">${sec.id}</span>${esc(sec.title)}</h3>`;
      const parts = sec.notes.split("[[EX]]");
      let k = 0;
      parts.forEach((p, i) => {
        body += tex(p);
        if (i < parts.length - 1 && k < sec.examples.length) body += exampleBlock(sec.examples[k++]);
      });
      while (k < sec.examples.length) body += exampleBlock(sec.examples[k++]);
    }
    body += `</section>`;
  }
  body += `<section class="page-break"><div class="chap-head"><span class="num">T</span><h2>Tutorial Questions</h2></div>
<p class="chap-blurb">${G.tutorials.length} past-year SJPO questions covering the whole topic, roughly in chapter order. Attempt them under timed conditions (about 2.5 minutes each, as in the real paper). Full worked solutions are in the Solutions booklet.</p>`;
  for (const t of G.tutorials) {
    const ch = chapterOf(t.ch);
    body += `<div class="tut"><div class="ex-head"><span class="tag">Question ${t.num}</span><span class="ref">SJPO ${esc(t.ref)}</span><span class="more">Ch ${ch.n} · ${esc(ch.title)}</span></div>${t.img.map((i) => img(i)).join("")}</div>`;
  }
  body += `</section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>SJPO Mechanics Study Guide</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

// ---------- solutions ----------
function solBlock(label, item) {
  const steps = item.steps.map((s) => `<li>${tex(s.t)}</li>`).join("");
  return `<div class="sol"><div class="ex-head"><span class="tag">${label}</span><span class="ref">SJPO ${esc(item.ref)}</span></div>
<div class="qimg">${item.img.map((i) => img(i, 0.72)).join("")}</div>
<ol class="steps">${steps}</ol><span class="answer">Answer: ${tex(item.ans)}</span>
${item.note ? `<div class="keynote"><b>About the answer key.</b> ${tex(item.note)}</div>` : ""}</div>`;
}
function solutionsHtml() {
  let body = cover("Worked solutions", "");
  for (const ch of G.chapters) {
    body += `<section class="page-break"><div class="chap-head"><span class="num">${ch.n}</span><h2>${esc(ch.title)}</h2></div><p class="chap-blurb">Worked solutions to the examples in Chapter ${ch.n}.</p>`;
    for (const sec of ch.sections) {
      body += `<div class="sec-mini">${sec.id} ${esc(sec.title)}</div>`;
      for (const ex of sec.examples) body += solBlock(`Example ${ex.num}`, ex);
    }
    body += `</section>`;
  }
  body += `<section class="page-break"><div class="chap-head"><span class="num">T</span><h2>Tutorial Solutions</h2></div><p class="chap-blurb">Worked solutions to the ${G.tutorials.length} tutorial questions.</p>`;
  for (const t of G.tutorials) body += solBlock(`Question ${t.num}`, t);
  body += `</section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>SJPO Mechanics Solutions</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

// ---------- platform data (math pre-rendered) ----------
function platformData() {
  const slide = (sl) => ({ h: sl.h, b: tex(sl.b), s: sl.s });
  const item = (x, extra) => ({ num: x.num, ref: x.ref, img: x.img, ans: tex(x.ans), intro: x.intro, note: tex(x.note || ""), steps: x.steps.map((s) => ({ t: tex(s.t), s: s.s || "" })), ...extra });
  return {
    title: G.title, series: G.series, subtitle: G.subtitle, papers: G.papers,
    chapters: G.chapters.map((ch) => ({
      n: ch.n, title: ch.title, blurb: ch.blurb, outcomes: ch.outcomes.map(tex),
      sections: ch.sections.map((s) => ({ id: s.id, title: s.title, lecture: s.lecture.map(slide), examples: s.examples.map((e) => item(e)) }))
    })),
    tutorials: G.tutorials.map((t) => item(t, { ch: t.ch }))
  };
}

// ---------- run ----------
(async () => {
  const guide = guideHtml(), sols = solutionsHtml();
  fs.writeFileSync(path.join(OUT, "guide.html"), guide);
  fs.writeFileSync(path.join(OUT, "solutions.html"), sols);
  fs.writeFileSync(path.join(ROOT, "platform", "data.js"), "window.COURSE = " + JSON.stringify(platformData()) + ";\n");
  const nEx = G.chapters.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.examples.length, 0), 0);
  console.log(`chapters ${G.chapters.length}, examples ${nEx}, tutorials ${G.tutorials.length}`);
  if (process.argv.includes("--html")) return;
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const page = await browser.newPage();
  const foot = (label) => `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5pt;color:#5b6475;padding:0 17mm;display:flex;justify-content:space-between"><span>SJPO Mechanics · ${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  for (const [name, label, file] of [["guide.html", "Lecture Notes", "SJPO-Mechanics-Study-Guide.pdf"], ["solutions.html", "Worked Solutions", "SJPO-Mechanics-Solutions.pdf"]]) {
    await page.goto("file://" + path.join(OUT, name), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(ROOT, "pdf", file), format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: foot(label), margin: { top: "18mm", bottom: "20mm", left: "17mm", right: "17mm" } });
    console.log("wrote", file);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
