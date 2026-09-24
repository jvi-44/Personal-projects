import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultWindow, EE_LAYER_BY_ID, EE_LAYERS, validateWindow } from '../../shared/eeLayers';
import { parseQuery } from '../../server/celestrak';
import { dispatch } from '../../server/http';
import { RECIPES } from '../../server/ee/recipes';

delete process.env.EE_SERVICE_ACCOUNT_JSON;
delete process.env.EE_SERVICE_ACCOUNT_FILE;
delete process.env.EE_PROJECT_ID;

test('every catalogued Earth Engine layer has a recipe', () => {
  for (const l of EE_LAYERS) {
    const r = RECIPES[l.id];
    assert.ok(r, `recipe for ${l.id}`);
    if (l.temporal === 'static') assert.ok(r.image, `${l.id} static needs image()`);
    else assert.ok(r.raw && r.prep && r.reducer, `${l.id} needs raw/prep/reducer`);
    if (l.scalar) assert.ok(l.vis.palette?.length, `${l.id} scalar needs a palette`);
  }
});

test('date windows are validated', () => {
  const no2 = EE_LAYER_BY_ID.no2;
  assert.deepEqual(validateWindow(no2, '2025-01-01', '2025-02-01'), { start: '2025-01-01', end: '2025-02-01' });
  assert.match(validateWindow(no2, '2025-02-01', '2025-01-01') as string, /after/);
  assert.match(validateWindow(no2, '2020-01-01', '2025-01-01') as string, /too long/);
  assert.match(validateWindow(no2, 'yesterday', '2025-01-01') as string, /YYYY-MM-DD/);
  assert.match(validateWindow(no2, '2025-01-01', '2999-01-01') as string, /future/);
  const w = defaultWindow(no2, new Date('2026-09-24T12:00:00Z'));
  assert.deepEqual(w, { start: '2026-08-18', end: '2026-09-17' });
  assert.deepEqual(validateWindow(EE_LAYER_BY_ID.elevation, null, null), { start: '', end: '' });
});

test('CelesTrak proxy only accepts one whitelisted query', () => {
  assert.deepEqual(parseQuery(new URLSearchParams('GROUP=starlink')), { key: 'GROUP', value: 'starlink' });
  assert.deepEqual(parseQuery(new URLSearchParams('NAME=KENT RIDGE')), { key: 'NAME', value: 'KENT RIDGE' });
  assert.equal(typeof parseQuery(new URLSearchParams('GROUP=starlink&CATNR=1')), 'string');
  assert.equal(typeof parseQuery(new URLSearchParams('GROUP=../../etc')), 'string');
  assert.equal(typeof parseQuery(new URLSearchParams('FORMAT=tle')), 'string');
});

test('API returns clear errors without credentials', async () => {
  const status = await dispatch('ee/status', new URLSearchParams());
  assert.equal(status.status, 200);
  assert.deepEqual(status.body, { configured: false });

  const bad = await dispatch('ee/tiles', new URLSearchParams('layer=nope'));
  assert.equal(bad.status, 400);

  const badDate = await dispatch('ee/tiles', new URLSearchParams('layer=no2&start=2025-02-01&end=2025-01-01'));
  assert.equal(badDate.status, 400);

  const nocreds = await dispatch('ee/tiles', new URLSearchParams('layer=no2&start=2025-01-01&end=2025-02-01'));
  assert.equal(nocreds.status, 503);
  assert.equal((nocreds.body as { code: string }).code, 'EE_NOT_CONFIGURED');

  const missing = await dispatch('nope', new URLSearchParams());
  assert.equal(missing.status, 404);
});
