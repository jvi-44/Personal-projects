import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json2satrec } from 'satellite.js';
import { classify } from '../../src/sat/classify';
import { GROUP_BY_ID, keepObject } from '../../src/sat/groups';
import { footprintRadiusKm, orbitRing, parseEpoch, regimeOf, stateAt, summarize } from '../../src/sat/orbit';
import { fixtureFor, makeOmm } from '../fixtures/omm';

const iss = makeOmm({ name: 'ISS (ZARYA)', norad: 25544, inc: 51.64, mm: 15.5, ecc: 0.0005 });

test('orbit summary for an ISS-like orbit', () => {
  const s = summarize(iss);
  assert.ok(Math.abs(s.periodMin - 92.9) < 0.1, `period ${s.periodMin}`);
  assert.ok(s.perigeeKm > 380 && s.apogeeKm < 440, `${s.perigeeKm}/${s.apogeeKm}`);
  assert.equal(s.regime, 'LEO');
});

test('regime classification', () => {
  assert.equal(regimeOf(15.5, 0.0005, 420), 'LEO');
  assert.equal(regimeOf(2.0056, 0.01, 20_400), 'MEO');
  assert.equal(regimeOf(1.0027, 0.0002, 35_790), 'GEO');
  assert.equal(regimeOf(2.006, 0.72, 39_000), 'HEO');
});

test('CelesTrak epochs without a zone are UTC', () => {
  assert.equal(parseEpoch('2026-09-24T03:00:00.000000').toISOString(), '2026-09-24T03:00:00.000Z');
  assert.equal(parseEpoch('2026-09-24T03:00:00Z').toISOString(), '2026-09-24T03:00:00.000Z');
});

test('SGP4 state for the ISS is physically sane', () => {
  const rec = json2satrec(iss as never);
  const s = stateAt(rec, new Date(), true)!;
  assert.ok(s, 'propagated');
  assert.ok(s.altKm > 350 && s.altKm < 460, `alt ${s.altKm}`);
  assert.ok(s.speedKms > 7.5 && s.speedKms < 7.8, `speed ${s.speedKms}`);
  assert.ok(Math.abs(s.lat) <= 51.7, `lat ${s.lat}`);
  assert.ok(s.lon >= -180 && s.lon <= 180);
  assert.ok(s.sunlit >= 0 && s.sunlit <= 1);
  const r = Math.hypot(s.x, s.y, s.z) / 1000;
  assert.ok(r > 6700 && r < 6850, `radius ${r}`);
});

test('orbit ring closes on itself', () => {
  const rec = json2satrec(iss as never);
  const pts = orbitRing(rec, new Date(), summarize(iss).periodMin, 90);
  assert.equal(pts.length, 91 * 3);
  const gap = Math.hypot(pts[0] - pts.at(-3)!, pts[1] - pts.at(-2)!, pts[2] - pts.at(-1)!);
  assert.ok(gap < 60_000, `ring gap ${gap} m`);
});

test('footprint grows with altitude', () => {
  assert.ok(footprintRadiusKm(420) > 2000 && footprintRadiusKm(420) < 2400);
  assert.ok(footprintRadiusKm(35_786) > 9000);
});

test('model classification', () => {
  assert.equal(classify(iss, ['stations']), 'iss');
  assert.equal(classify(makeOmm({ name: 'CSS (TIANHE)', norad: 48274, inc: 41.5, mm: 15.6 }), ['stations']), 'station');
  assert.equal(classify(makeOmm({ name: 'HST', norad: 20580, inc: 28.5, mm: 15.3 }), ['science']), 'hubble');
  assert.equal(classify(makeOmm({ name: 'STARLINK-1234', norad: 50000, inc: 53, mm: 15.06 }), ['starlink']), 'starlink');
  assert.equal(classify(makeOmm({ name: 'GPS BIIF-3', norad: 40000, inc: 55, mm: 2.0056 }), ['gnss']), 'gnss');
  assert.equal(classify(makeOmm({ name: 'GOES 19', norad: 60133, inc: 0.05, mm: 1.0027 }), ['weather']), 'geo');
  assert.equal(classify(makeOmm({ name: 'VELOX-AM', norad: 57320, inc: 5, mm: 15 }), ['singapore']), 'cubesat');
  assert.equal(classify(makeOmm({ name: 'TELEOS-2', norad: 56308, inc: 10, mm: 14.9 }), ['singapore']), 'eo');
});

test('group filters drop debris and foreign name matches', () => {
  assert.equal(keepObject(GROUP_BY_ID.esa, 'SENTINEL-2A'), true);
  assert.equal(keepObject(GROUP_BY_ID.esa, 'SENTINEL-1A DEB'), false);
  assert.equal(keepObject(GROUP_BY_ID.singapore, 'TELEOS-2'), true);
  assert.equal(keepObject(GROUP_BY_ID.singapore, 'SUPER-X-SAT'), false);
  assert.equal(keepObject(GROUP_BY_ID.starlink, 'FALCON 9 R/B'), false);
});

test('every fixture record propagates', () => {
  for (const q of [{ GROUP: 'starlink' }, { GROUP: 'gps-ops' }, { GROUP: 'beidou' }, { GROUP: 'weather' }]) {
    for (const o of fixtureFor(q).slice(0, 50)) assert.ok(stateAt(json2satrec(o as never), new Date()), o.OBJECT_NAME);
  }
});
