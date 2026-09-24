import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fixtureFor } from '../fixtures/omm';
import { png } from './png';

const SHOTS = process.env.SHOT_DIR || 'test-results/screens';
mkdirSync(SHOTS, { recursive: true });

// A magma-ish blob pattern standing in for Earth Engine NO₂ tiles.
const RAMP = [
  [0, 0, 4],
  [79, 18, 123],
  [181, 54, 122],
  [251, 135, 97],
  [252, 253, 191],
];
const tile = (z: number, x: number, y: number) =>
  png(256, 256, (px, py) => {
    const gx = (x * 256 + px) / (256 * 2 ** z);
    const gy = (y * 256 + py) / (256 * 2 ** z);
    const v = Math.max(0, Math.sin(gx * 40) * Math.cos(gy * 30) + Math.sin(gx * 13 + gy * 7) * 0.6) / 1.6;
    const c = RAMP[Math.min(4, Math.floor(v * 5))];
    return [c[0], c[1], c[2], v < 0.08 ? 0 : 220];
  });

async function mockNetwork(page: Page, opts: { ee?: boolean } = {}) {
  await page.route('**/api/celestrak**', (route) => {
    const q = Object.fromEntries(new URL(route.request().url()).searchParams);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtureFor(q)) });
  });
  await page.route('**/api/ee/status*', (route) => route.fulfill({ json: opts.ee ? { configured: true, project: 'demo-project' } : { configured: false } }));
  await page.route('**/api/ee/tiles**', (route) => {
    const u = new URL(route.request().url());
    return route.fulfill({ json: { urlFormat: 'https://mock-ee.test/tiles/{z}/{x}/{y}', start: u.searchParams.get('start'), end: u.searchParams.get('end'), shifted: false } });
  });
  await page.route('https://mock-ee.test/**', (route) => {
    const [z, x, y] = new URL(route.request().url()).pathname.split('/').slice(-3).map(Number);
    return route.fulfill({ contentType: 'image/png', body: tile(z, x, y) });
  });
  await page.route('**/api/ee/point**', (route) => route.fulfill({ json: { values: { v: 87.4 }, start: '2026-08-01', end: '2026-09-01' } }));
  await page.route('**/api/ee/series**', (route) =>
    route.fulfill({
      json: { units: 'µmol/m²', points: Array.from({ length: 12 }, (_, i) => ({ t: new Date(Date.UTC(2025, 9 + i, 1)).toISOString().slice(0, 10), v: i === 4 ? null : 60 + 30 * Math.sin(i / 2) + i * 2 })) },
    }),
  );
  // Remote base-map tiles are unreachable offline; fail them fast.
  await page.route(/cartocdn|arcgisonline|gibs\.earthdata|n2yo|celestrak\.org/, (route) => route.abort());
}

async function boot(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?base=neon');
  await page.waitForFunction(() => (window as any).neonOrbit?.sats?.length > 1000, null, { timeout: 60_000 });
  await page.waitForFunction(() => (window as any).neonOrbit?.positions != null);
  await page.waitForSelector('.boot.done', { state: 'attached' });
  return errors;
}

test('dashboard loads constellations, tracks a target and inspects it', async ({ page }) => {
  await mockNetwork(page);
  const errors = await boot(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/01-overview.png` });

  // Counts rendered for default groups.
  await expect(page.locator('.group-row', { hasText: 'Starlink' }).locator('.count')).toHaveText(/\d/);
  const visible = await page.evaluate(() => (window as any).neonOrbit.visibleCount());
  expect(visible).toBeGreaterThan(1000);

  // Enable ESA + Singapore (name queries) and check they load.
  await page.getByRole('switch', { name: 'Show ESA · Copernicus' }).click();
  await page.getByRole('switch', { name: 'Show Singapore' }).click();
  await expect(page.locator('.group-row', { hasText: 'Singapore' }).locator('.count')).toHaveText('2');
  await expect(page.locator('.group-row', { hasText: 'ESA' }).locator('.count')).toHaveText('4');

  // Quick target → ISS, follow cam.
  await page.locator('.featured button', { hasText: 'ISS' }).click();
  await expect(page.locator('.target-name')).toHaveText('ISS (ZARYA)');
  const alt = await page.locator('.kv .value').nth(2).innerText();
  expect(Number(alt.replace(/[^\d.]/g, ''))).toBeGreaterThan(350);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${SHOTS}/02-iss-follow.png` });

  // 3D inspector.
  await page.getByRole('button', { name: /Inspect 3D/ }).click();
  await expect(page.locator('.insp')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/03-inspector-holo.png` });
  await page.locator('.insp-parts button', { hasText: 'Canadarm2' }).click();
  await expect(page.locator('.insp-callout')).toContainText('Canadian Space Agency');
  await page.getByRole('button', { name: 'Hologram' }).click();
  await page.getByRole('slider', { name: 'Exploded view' }).fill('0.6');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/04-inspector-solid.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('.insp')).toHaveCount(0);

  await expect(page.locator('.cesium-widget-errorPanel')).toHaveCount(0);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('starlink / gnss / hubble models render in the inspector', async ({ page }) => {
  await mockNetwork(page);
  await boot(page);
  for (const [norad, name] of [
    [44000, 'starlink'],
    [38000, 'gnss'],
  ] as const) {
    await page.evaluate((n) => (window as any).neonOrbit.select(n), norad);
    await page.getByRole('button', { name: /Inspect 3D/ }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SHOTS}/05-inspector-${name}.png` });
    await page.keyboard.press('Escape');
  }
  await page.locator('.featured button', { hasText: 'Hubble' }).click();
  await expect(page.locator('.target-name')).toHaveText('HST');
  await page.getByRole('button', { name: /Inspect 3D/ }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SHOTS}/05-inspector-hubble.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/05-hubble-globe.png` });
  await expect(page.locator('.toast.warn, .toast.error')).toHaveCount(0);
});

test('earth engine layer, legend and probe', async ({ page }) => {
  await mockNetwork(page, { ee: true });
  await boot(page);
  await page.getByRole('tab', { name: /Earth data/ }).click();
  await page.locator('.layer-item', { hasText: 'Nitrogen dioxide' }).click();
  await expect(page.locator('.overlay-card')).toContainText('Nitrogen dioxide');
  await expect(page.locator('.overlay-card .led.ok')).toBeVisible();
  await page.locator('.layer-item', { hasText: 'Daily true colour · VIIRS' }).click();
  await expect(page.locator('.overlay-card')).toHaveCount(2);
  await page.getByRole('button', { name: /Probe mode/ }).click();
  await page.waitForTimeout(2500);
  await page.mouse.click(720, 450);
  await expect(page.locator('text=87.4')).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/06-earth-engine.png` });
});

test('mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockNetwork(page);
  await boot(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/07-mobile.png` });
  await page.getByRole('button', { name: 'Sats' }).click();
  await page.screenshot({ path: `${SHOTS}/08-mobile-sats.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
