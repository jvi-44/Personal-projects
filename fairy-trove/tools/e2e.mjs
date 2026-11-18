// Dev only: drives the dashboard in headless Chromium against tools/mock-claude.js.
// FT_PAGE_TEXT=<saved notion-fetch text> OUT=<dir> node tools/e2e.mjs [scenario...]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { start } from './serve.mjs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const OUT = process.env.OUT || path.resolve('shots');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const server = await start();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined,
});
const results = [];
function check(name, ok, info) { results.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); }

async function open(query, { width = 1440, height = 900, scheme = 'light', time = '2026-11-18T10:05:00+08:00', scale = 1, mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: scheme, timezoneId: 'Asia/Singapore', isMobile: mobile, hasTouch: mobile, reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.clock.setFixedTime(new Date(time));
  await page.goto(base + query, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { page, ctx, errors };
}
const shot = (page, name, full) => page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!full });
const mock = (page, expr) => page.evaluate(expr);

async function fresh() {
  const { page, ctx, errors } = await open('?mock=1');
  await shot(page, '01-fresh');
  check('fresh: composer shown', await page.isVisible('#p1-title'));
  check('fresh: notion chip waits for the first plan', (await page.textContent('#sync-text')).includes('Starmap'));
  await page.fill('#p1-title', 'ESAT practice paper, timed');
  await page.selectOption('#p1-est', '120');
  await page.fill('#p2-title', 'Personal statement: final read');
  await page.fill('#p3-title', 'STEMulate partner emails');
  await page.fill('#s1-title', 'Chem flashcards');
  await page.fill('#s2-title', 'Watercolour sketch');
  await page.fill('#admin-new', 'Reply to Ms Tan'); await page.press('#admin-new', 'Enter');
  await page.fill('#admin-new', 'Pay ISC fee'); await page.press('#admin-new', 'Enter');
  await page.click('#admin-list li:nth-child(2) .go-toggle');
  await page.check('#where-am-cafe', { force: true });
  await page.check('#where-pm-school', { force: true });
  await page.click('text=+ Add a commitment');
  await page.fill('#fixed-0-title', 'Physics consult');
  await page.fill('#fixed-0-start', '14:00');
  await page.fill('#fixed-0-end', '15:00');
  await page.selectOption('#fixed-0-place', 'school');
  await page.waitForTimeout(900);
  const labels = await page.$$eval('.pollen-chip .pc-text', (els) => els.map((e) => e.textContent));
  check('typing names the pollen grains', labels.includes('ESAT practice paper, timed') && labels.includes('Watercolour sketch'), labels.join(' | '));
  await shot(page, '02-composed');
  await page.click('#weave-btn');
  await page.waitForSelector('#weaving:not([hidden])', { timeout: 3000 }).catch(() => {});
  await shot(page, '02b-weaving');
  await page.waitForSelector('#plan-view:not([hidden]) .blk', { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, '03-woven');
  const kinds = await page.$$eval('#timeline .blk', (els) => els.map((e) => e.className));
  check('woven plan has blocks', kinds.length > 8, kinds.length + ' blocks');
  const first = await page.$eval('#timeline .blk .blk-time b', (e) => e.textContent);
  check('a late first plan starts from now, not 5.30', first === '10.05' || first === '10.10', 'first block ' + first);
  check('claude was asked once', (await mock(page, () => window.__mock.sampleCalls)) === 1);
  check('the consult kept its time', (await page.$$eval('.blk.kind-fixed .blk-time', (e) => e.map((x) => x.textContent))).join() === '2–3pm');
  // Notion: first sync inserts week 47 after the newest week
  await page.waitForFunction(() => window.__mock.notionWrites.length >= 1, null, { timeout: 25000 }).catch(() => {});
  const writes = await mock(page, () => window.__mock.notionWrites);
  check('first sync wrote to Notion once', writes.length === 1, writes.length + ' writes');
  const pageText = await mock(page, () => window.__mock.notionPage);
  const wk = pageText.indexOf('ЩΣΣK 47 (15/11 - 21/11)');
  check('week 47 is on the page', wk > 0);
  check('week sits after "After Prelims"', wk > pageText.indexOf('ЩΣΣK After Prelims'));
  const wed = pageText.slice(pageText.indexOf('ЩΣDПΣƧDΛY <code>[18 Nov]</code>', wk), pageText.indexOf('ƬΉЦЯƧDΛY <code>[19 Nov]</code>', wk));
  console.log('\n--- Wednesday in Notion ---\n' + wed + '\n---');
  check('Wednesday lists the starred task with its time', /- \[ \] \\\[[0-9.]+(am|pm)?-[0-9.]+(am|pm)\\\] ★ ESAT practice paper, timed/.test(wed));
  check('the template button survived', pageText.includes('alt="button" />'));
  await shot(page, '04-synced');
  // tick the first win-the-day block, expect a one-day update
  await page.click('#timeline .blk.kind-primary .tick');
  await page.waitForTimeout(500);
  const chip = await page.getAttribute('.pollen-chip[data-slot="0"]', 'data-state');
  await page.waitForFunction(() => window.__mock.notionWrites.length >= 2, null, { timeout: 30000 }).catch(() => {});
  const w2 = await mock(page, () => window.__mock.notionWrites[1]);
  check('a tick sends a one-day update', w2 && w2.command === 'update_content' && w2.content_updates.length === 1, w2 ? w2.content_updates.length + ' updates' : 'no second write');
  check('pollen chip state follows the tick', chip === 'done' || chip === 'active' || chip === 'todo', chip);
  // check-in → re-weave the rest
  await page.click('.now-card .btn-leaf');
  await page.waitForSelector('#checkin-dlg[open]');
  await page.check('#ci-energy-2', { force: true });
  await page.fill('#ci-note', 'Tired after the paper');
  await shot(page, '05-checkin');
  await page.click('#checkin-foot .btn-weave');
  await page.waitForSelector('#plan-view:not([hidden]) .blk', { timeout: 15000 });
  await page.waitForTimeout(600);
  const prompt = await mock(page, () => window.__mock.lastPrompt);
  check('the re-weave prompt carries the check-in', prompt.includes('"energy_now": "2/5"') && prompt.includes('Tired after the paper'));
  check('the re-weave keeps the morning as history', prompt.includes('already_happened'));
  await shot(page, '06-rewoven');
  // running late
  await page.click('.late-bar button:has-text("+30 min")');
  await page.waitForTimeout(400);
  await shot(page, '07-late');
  // settings
  await page.click('#open-settings');
  await page.waitForSelector('#settings-dlg[open]');
  await shot(page, '08-settings');
  await page.click('#settings-dlg [data-close]');
  // plan Friday from the week rail
  await page.click('.wday:nth-child(6) .wday-head');
  await page.waitForTimeout(400);
  check('Friday opens its own composer', (await page.textContent('#plan-title')).includes('Friday'));
  await shot(page, '09-friday');
  check('no page errors (fresh)', !errors.length, errors.join(' | '));
  await ctx.close();
}

async function example() {
  for (const [name, opts] of [['10-example-light', {}], ['11-example-dark', { scheme: 'dark' }], ['12-example-1100', { width: 1100, height: 820 }]]) {
    const { page, ctx, errors } = await open('?mock=1&seed=example', opts);
    await page.waitForTimeout(800);
    await shot(page, name);
    if (name === '10-example-light') {
      check('example ribbon is shown', await page.isVisible('#example-ribbon'));
      check('example day is not synced', (await mock(page, () => window.__mock.notionWrites.length)) === 0);
      check('now card shows the current block', (await page.textContent('.now-card')).includes('Personal statement'));
    }
    check('no page errors (' + name + ')', !errors.length, errors.join(' | '));
    await ctx.close();
  }
}

async function mobile() {
  const { page, ctx, errors } = await open('?mock=1&seed=example', { width: 390, height: 844, scale: 2, mobile: true });
  await page.waitForTimeout(800);
  await shot(page, '13-mobile-a');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.plan-panel').offsetTop - 10));
  await page.waitForTimeout(400);
  await shot(page, '13-mobile-b');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.week-panel').offsetTop - 10));
  await page.waitForTimeout(400);
  await shot(page, '13-mobile-c');
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no sideways scroll on a phone', wide <= 0, 'overflow ' + wide + 'px');
  check('no page errors (mobile)', !errors.length, errors.join(' | '));
  await ctx.close();
}

async function offline() {
  const { page, ctx, errors } = await open('?mock=1&nosample=1&nonotion=1');
  await page.waitForTimeout(600);
  await page.fill('#p1-title', 'Finish the lab report');
  await page.click('#weave-btn');
  await page.waitForSelector('#plan-view:not([hidden]) .blk', { timeout: 5000 });
  check('without Claude the quick planner weaves', (await page.textContent('.plan-summary .src')).includes('Quick plan'));
  check('without Notion the chip says so', (await page.textContent('#sync-text')).includes('claude.ai'));
  check('no page errors (offline)', !errors.length, errors.join(' | '));
  await ctx.close();
}

async function approval() {
  const { page, ctx, errors } = await open('?mock=1&approval=1');
  await page.fill('#p1-title', 'Finish the lab report');
  await page.click('#quick-plan');
  await page.waitForFunction(() => document.querySelector('#sync-chip').getAttribute('data-state') === 'approval', null, { timeout: 25000 }).catch(() => {});
  check('approval needed is shown on the chip', (await page.getAttribute('#sync-chip', 'data-state')) === 'approval');
  await page.click('#sync-chip');
  await page.waitForFunction(() => window.__mock.notionWrites.length >= 1, null, { timeout: 10000 }).catch(() => {});
  check('tapping the chip syncs after approval', (await mock(page, () => window.__mock.notionWrites.length)) >= 1);
  check('no page errors (approval)', !errors.length, errors.join(' | '));
  await ctx.close();
}

const all = { fresh, example, mobile, offline, approval };
for (const k of Object.keys(all)) if (!only.length || only.includes(k)) { console.log('\n== ' + k); try { await all[k](); } catch (e) { check(k + ' ran to the end', false, e.message.split('\n').slice(0, 5).join(' / ')); } }
await browser.close(); server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
