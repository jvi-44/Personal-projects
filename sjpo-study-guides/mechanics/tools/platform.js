// Assembles platform/dist: a single index.html (data, page index and KaTeX CSS inlined)
// plus the question crops, KaTeX fonts and the two PDFs as supporting files.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "platform", "dist");
fs.rmSync(DIST, { recursive: true, force: true });
for (const d of ["crops", "pdf", "katex/fonts"]) fs.mkdirSync(path.join(DIST, d), { recursive: true });

const katexDir = path.dirname(require.resolve("katex/dist/katex.min.css"));
// Keep only the woff2 sources so the browser never asks for files we don't ship.
const katexCss = fs.readFileSync(path.join(katexDir, "katex.min.css"), "utf8")
  .replace(/src:url\((fonts\/[^)]+\.woff2)\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*/g, 'src:url(katex/$1) format("woff2")');
for (const f of fs.readdirSync(path.join(katexDir, "fonts")).filter((f) => f.endsWith(".woff2"))) {
  fs.copyFileSync(path.join(katexDir, "fonts", f), path.join(DIST, "katex/fonts", f));
}
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const data = read("platform/data.js") + "\n" + read("platform/pages.js");
const html = read("platform/index.src.html")
  .replace("/*KATEX_CSS*/", () => katexCss)
  .replace("/*DATA_JS*/", () => data.replace(/<\/script/gi, "<\\/script"));
fs.writeFileSync(path.join(DIST, "index.html"), html);

const used = new Set();
const course = JSON.parse(read("platform/data.js").replace(/^window\.COURSE = /, "").replace(/;\s*$/, ""));
course.chapters.forEach((c) => c.sections.forEach((s) => s.examples.forEach((e) => e.img.forEach((i) => used.add(i)))));
course.tutorials.forEach((t) => t.img.forEach((i) => used.add(i)));
for (const i of used) fs.copyFileSync(path.join(ROOT, "crops", i + ".png"), path.join(DIST, "crops", i + ".png"));
for (const f of fs.readdirSync(path.join(ROOT, "pdf"))) fs.copyFileSync(path.join(ROOT, "pdf", f), path.join(DIST, "pdf", f));
console.log(`dist: index.html ${(html.length / 1e6).toFixed(2)} MB, ${used.size} crops`);
