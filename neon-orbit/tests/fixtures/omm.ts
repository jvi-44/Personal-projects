/**
 * Synthetic-but-physical OMM records for offline tests (the sandbox can't reach
 * CelesTrak). Elements are plausible for each constellation; epochs are "now".
 */
import type { OMM } from '../../src/sat/types';

export function makeOmm(p: {
  name: string;
  norad: number;
  inc: number;
  mm: number;
  ecc?: number;
  raan?: number;
  argp?: number;
  ma?: number;
  epoch?: Date;
  intl?: string;
}): OMM {
  const epoch = (p.epoch ?? new Date()).toISOString().replace('Z', '');
  return {
    OBJECT_NAME: p.name,
    OBJECT_ID: p.intl ?? `2024-${String(p.norad % 200).padStart(3, '0')}A`,
    EPOCH: epoch,
    MEAN_MOTION: p.mm,
    ECCENTRICITY: p.ecc ?? 0.0001,
    INCLINATION: p.inc,
    RA_OF_ASC_NODE: p.raan ?? 0,
    ARG_OF_PERICENTER: p.argp ?? 0,
    MEAN_ANOMALY: p.ma ?? 0,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: 'U',
    NORAD_CAT_ID: p.norad,
    ELEMENT_SET_NO: 999,
    REV_AT_EPOCH: 1000,
    BSTAR: 0.0001,
    MEAN_MOTION_DOT: 0.00001,
    MEAN_MOTION_DDOT: 0,
  };
}

function shell(prefix: string, start: number, planes: number, perPlane: number, inc: number, mm: number): OMM[] {
  const out: OMM[] = [];
  let id = start;
  for (let p = 0; p < planes; p++)
    for (let s = 0; s < perPlane; s++)
      out.push(makeOmm({ name: `${prefix}-${id - start + 1000}`, norad: id++, inc, mm, raan: (360 / planes) * p, ma: (360 / perPlane) * s + p * 3 }));
  return out;
}

export function fixtureFor(query: Record<string, string>): OMM[] {
  const g = query.GROUP;
  const name = query.NAME;
  if (g === 'starlink')
    return [
      ...shell('STARLINK', 44000, 36, 22, 53.05, 15.06),
      ...shell('STARLINK', 46000, 18, 20, 70, 15.0),
      ...shell('STARLINK', 48000, 12, 20, 97.6, 15.1),
      ...shell('STARLINK', 52000, 28, 22, 43, 15.3),
    ];
  if (g === 'stations')
    return [
      makeOmm({ name: 'ISS (ZARYA)', norad: 25544, inc: 51.64, mm: 15.5, ecc: 0.0005, raan: 120, ma: 40, intl: '1998-067A' }),
      makeOmm({ name: 'CSS (TIANHE)', norad: 48274, inc: 41.47, mm: 15.6, raan: 200, ma: 10, intl: '2021-035A' }),
      makeOmm({ name: 'SOYUZ-MS 28', norad: 66001, inc: 51.64, mm: 15.5, raan: 120, ma: 40.02 }),
      makeOmm({ name: 'SHENZHOU-21', norad: 66002, inc: 41.47, mm: 15.6, raan: 200, ma: 10.02 }),
    ];
  if (g === 'gps-ops') return shell('GPS BIIF', 38000, 6, 5, 55, 2.0056);
  if (g === 'glo-ops') return shell('COSMOS 25', 39000, 3, 8, 64.8, 2.1256);
  if (g === 'galileo') return shell('GSAT0', 40000, 3, 9, 56, 1.7048);
  if (g === 'beidou') return [...shell('BEIDOU-3 M', 43000, 3, 8, 55, 1.8623), ...shell('BEIDOU-3 G', 43500, 1, 3, 1, 1.0027)];
  if (g === 'resource')
    return [
      makeOmm({ name: 'LANDSAT 9', norad: 49260, inc: 98.2, mm: 14.57, raan: 30, ma: 100, intl: '2021-088A' }),
      makeOmm({ name: 'LANDSAT 8', norad: 39084, inc: 98.2, mm: 14.57, raan: 30, ma: 280, intl: '2013-008A' }),
      makeOmm({ name: 'SENTINEL-2A', norad: 40697, inc: 98.57, mm: 14.31, raan: 40, ma: 50, intl: '2015-028A' }),
      makeOmm({ name: 'TERRA', norad: 25994, inc: 98.1, mm: 14.6, raan: 60, ma: 150 }),
    ];
  if (g === 'weather')
    return [
      makeOmm({ name: 'NOAA 20 (JPSS-1)', norad: 43013, inc: 98.7, mm: 14.19, raan: 80, ma: 200 }),
      makeOmm({ name: 'GOES 19', norad: 60133, inc: 0.05, mm: 1.0027, raan: 0, ma: 285 }),
      makeOmm({ name: 'HIMAWARI-9', norad: 41836, inc: 0.05, mm: 1.0027, raan: 0, ma: 140 }),
    ];
  if (g === 'science') return [makeOmm({ name: 'HST', norad: 20580, inc: 28.47, mm: 15.28, raan: 300, ma: 5, intl: '1990-037B' })];
  if (name === 'SENTINEL')
    return [
      makeOmm({ name: 'SENTINEL-2A', norad: 40697, inc: 98.57, mm: 14.31, raan: 40, ma: 50, intl: '2015-028A' }),
      makeOmm({ name: 'SENTINEL-1C', norad: 62261, inc: 98.18, mm: 14.59, raan: 90, ma: 10 }),
      makeOmm({ name: 'SENTINEL-6A', norad: 46984, inc: 66.04, mm: 12.81, raan: 10, ma: 70 }),
    ];
  if (name === 'SWARM') return [makeOmm({ name: 'SWARM A', norad: 39452, inc: 87.35, mm: 15.4, raan: 140, ma: 0 })];
  if (name === 'TELEOS') return [makeOmm({ name: 'TELEOS-2', norad: 56308, inc: 9.99, mm: 14.9, raan: 170, ma: 30, intl: '2023-057A' })];
  if (name === 'VELOX') return [makeOmm({ name: 'VELOX-AM', norad: 57320, inc: 5.0, mm: 15.0, raan: 250, ma: 200 })];
  return [];
}
