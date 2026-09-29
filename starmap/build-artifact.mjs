// Bundles the dashboard into ONE html file suitable for publishing as a Claude artifact.
//   node build-artifact.mjs <out.html>      (needs `esbuild` resolvable, e.g. npm i -D esbuild)
import fs from "node:fs";
import { build } from "esbuild";

const out = process.argv[2] || "starmap-artifact.html";
const js = (await build({
  entryPoints: ["js/app.js"], bundle: true, minify: true, format: "iife", write: false,
  define: { ARTIFACT: "true" }, legalComments: "none",
})).outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = fs.readFileSync("css/style.css", "utf8");
const body = fs.readFileSync("index.html", "utf8").match(/<body[^>]*>([\s\S]*?)<script type="module"[^>]*><\/script>\s*<\/body>/)[1];

const page = `<title>Vi's Starmap</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
html, body { height: 100%; }
${css}
</style>
${body}
<script>document.body.dataset.view = "garden";</script>
<script>${js}</script>
`;
fs.writeFileSync(out, page);
console.log(`${out}: ${(page.length / 1024).toFixed(0)} KB`);
