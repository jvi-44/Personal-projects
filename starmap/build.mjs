// Builds the dashboard:
//   dist/app.js        – bundle used by index.html (local server mode)
//   dist/starmap.html  – single self-contained page published as the Claude artifact
import fs from "node:fs";
import { build } from "esbuild";

fs.mkdirSync("dist", { recursive: true });
const js = (await build({ entryPoints: ["js/app.js"], bundle: true, minify: true, format: "iife", write: false, legalComments: "none", target: "es2020" })).outputFiles[0].text;
fs.writeFileSync("dist/app.js", js);

const html = fs.readFileSync("index.html", "utf8");
const body = html.match(/<!--APP-->([\s\S]*?)<!--\/APP-->/)[1];
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const css = fs.readFileSync("css/style.css", "utf8");
const page = `<title>Vi's Starmap</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>
${css}
</style>
${body.trim()}
<script>window.ARTIFACT = true;</script>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script>
`;
fs.writeFileSync("dist/starmap.html", page);
console.log(`dist/app.js ${(js.length / 1024).toFixed(0)} KB · dist/starmap.html ${(page.length / 1024).toFixed(0)} KB`);
