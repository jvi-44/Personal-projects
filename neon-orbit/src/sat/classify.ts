import { GROUP_BY_ID } from './groups';
import type { ModelKind, OMM } from './types';

/** Pick the procedural 3D model family for an object. */
export function classify(omm: OMM, groups: string[]): ModelKind {
  const name = omm.OBJECT_NAME.toUpperCase();
  const id = Number(omm.NORAD_CAT_ID);
  if (id === 25544 || /^ISS\b/.test(name)) return 'iss';
  if (/^CSS\b|TIANHE|TIANGONG/.test(name)) return 'station';
  if (id === 20580 || /^HST\b/.test(name)) return 'hubble';
  if (name.startsWith('STARLINK')) return 'starlink';
  if (groups.includes('gnss')) return 'gnss';
  const geo = Math.abs(omm.MEAN_MOTION - 1.0027) < 0.05 && omm.ECCENTRICITY < 0.05;
  if (geo) return 'geo';
  if (groups.includes('singapore')) return /TELEOS|DS-EO|DS-SAR|NEUSAR|X-SAT/.test(name) ? 'eo' : 'cubesat';
  if (/CUBESAT|\bCUBE\b|LEMUR|FLOCK|DOVE|SPACEBEE/.test(name)) return 'cubesat';
  if (groups.includes('stations')) return /SOYUZ|PROGRESS|DRAGON|CYGNUS|SHENZHOU|TIANZHOU|STARLINER|HTV/.test(name) ? 'generic' : 'cubesat';
  const first = GROUP_BY_ID[groups[0]];
  return first?.model ?? 'generic';
}
