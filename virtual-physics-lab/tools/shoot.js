// usage: node tools/shoot.js <hash> [<hash>...]  -> screenshots in private/shots, prints console errors
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const hashes = process.argv.slice(2);
  for (const h of hashes) {
    for (const [w, tag] of [[1280, 'd'], [400, 'm']]) {
      if (tag === 'm' && !process.env.MOBILE) continue;
      const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: process.env.DARK ? 'dark' : 'light' });
      const errs = [];
      p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
      p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
      await p.goto('http://localhost:8765/index.html#' + h);
      await p.waitForTimeout(+process.env.WAIT || 1800);
      if (process.env.ACT) await eval(process.env.ACT);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (process.env.ELEM) await (await p.$(process.env.ELEM)).screenshot({ path: `private/shots/${h || 'home'}-${tag}.png` });
      else await p.screenshot({ path: `private/shots/${h || 'home'}-${tag}.png`, fullPage: !!process.env.FULL });
      console.log(h, tag, 'scrollWidth', sw, errs.length ? errs.join(' | ') : 'no errors');
      await p.close();
    }
  }
  await b.close();
})();
