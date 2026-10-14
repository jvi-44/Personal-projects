const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const dir = __dirname;
let html = fs.readFileSync(path.join(dir, 'page.html'), 'utf8');
html = html.replace('/*KIT*/', () => fs.readFileSync(path.join(dir, 'kit.js'), 'utf8'))
  .replace('/*GRAPHS*/', () => fs.readFileSync(path.join(dir, 'graphs_from_app.js'), 'utf8'))
  .replace('/*DIA*/', () => fs.readFileSync(path.join(dir, 'diagrams.js'), 'utf8'));
fs.writeFileSync(path.join(dir, 'built.html'), html);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.join(dir, 'built.html'));
  await p.waitForSelector('body[data-ready="1"]', { timeout: 10000 });
  const out = process.argv[2] || path.join(dir, '..', 'dist', 'Chem-Diagrams-to-Draw.pdf');
  await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font:7px DejaVu Sans, sans-serif;color:#777;padding:0 14mm;display:flex;justify-content:space-between"><span>Diagrams to Draw · H2 Chemistry planning</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    margin: { top: '13mm', bottom: '15mm', left: '14mm', right: '14mm' } });
  console.log('pdf', out, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors');
  await b.close();
})();
