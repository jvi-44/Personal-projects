import { eciToEcf, eciToGeodetic, gstime, jday, propagate, shadowFraction, sunPos, type SatRec } from 'satellite.js';
import type { OMM } from './types';

export const MU = 398600.4418; // km³/s²
export const R_EARTH = 6378.137; // km

export type Regime = 'LEO' | 'MEO' | 'GEO' | 'HEO';

export interface OrbitSummary {
  periodMin: number;
  semiMajorKm: number;
  apogeeKm: number;
  perigeeKm: number;
  inclination: number;
  eccentricity: number;
  regime: Regime;
  epoch: Date;
}

export function summarize(omm: OMM): OrbitSummary {
  const n = (omm.MEAN_MOTION * 2 * Math.PI) / 86400; // rad/s
  const a = Math.cbrt(MU / (n * n));
  const e = omm.ECCENTRICITY;
  const apogeeKm = a * (1 + e) - R_EARTH;
  const perigeeKm = a * (1 - e) - R_EARTH;
  return {
    periodMin: 1440 / omm.MEAN_MOTION,
    semiMajorKm: a,
    apogeeKm,
    perigeeKm,
    inclination: omm.INCLINATION,
    eccentricity: e,
    regime: regimeOf(omm.MEAN_MOTION, e, apogeeKm),
    epoch: parseEpoch(omm.EPOCH),
  };
}

export function regimeOf(meanMotion: number, e: number, apogeeKm: number): Regime {
  if (e > 0.25) return 'HEO';
  if (apogeeKm < 2000) return 'LEO';
  if (Math.abs(meanMotion - 1.0027) < 0.03 && e < 0.02) return 'GEO';
  return 'MEO';
}

/** CelesTrak epochs are UTC without a zone suffix. */
export function parseEpoch(s: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}

export interface StateVector {
  /** ECEF metres (Cesium fixed frame). */
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  altKm: number;
  speedKms: number;
  /** 0 = full shadow, 1 = full sun. */
  sunlit: number;
  /** ECI position/velocity (km, km/s) — used for orientation. */
  eci: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
}

const DEG = 180 / Math.PI;

export function stateAt(rec: SatRec, date: Date, withSun = false): StateVector | null {
  const pv = propagate(rec, date);
  if (!pv || !pv.position || !pv.velocity) return null;
  const gmst = gstime(date);
  const ecf = eciToEcf(pv.position, gmst);
  const geo = eciToGeodetic(pv.position, gmst);
  const v = pv.velocity;
  let sunlit = 1;
  if (withSun) {
    const sun = sunPos(jday(date));
    sunlit = shadowFraction(sun.rsun, pv.position);
  }
  return {
    x: ecf.x * 1000,
    y: ecf.y * 1000,
    z: ecf.z * 1000,
    lat: geo.latitude * DEG,
    lon: ((((geo.longitude * DEG + 180) % 360) + 360) % 360) - 180,
    altKm: geo.height,
    speedKms: Math.hypot(v.x, v.y, v.z),
    sunlit,
    eci: pv.position,
    vel: v,
  };
}

/**
 * One full revolution as a closed ring: sampled in the inertial frame and rotated
 * with the *current* Earth angle, so it draws as the familiar orbit ellipse.
 * Returns flat ECEF metres [x,y,z,...].
 */
export function orbitRing(rec: SatRec, date: Date, periodMin: number, samples = 180): number[] {
  const gmst = gstime(date);
  const out: number[] = [];
  const span = Math.min(periodMin, 1600) * 60_000;
  for (let i = 0; i <= samples; i++) {
    const t = new Date(date.getTime() + (i / samples) * span - span / 2);
    const pv = propagate(rec, t);
    if (!pv || !pv.position) continue;
    const ecf = eciToEcf(pv.position, gmst);
    out.push(ecf.x * 1000, ecf.y * 1000, ecf.z * 1000);
  }
  return out;
}

/** Ground track (lat/lon degrees) for the next `minutes`. */
export function groundTrack(rec: SatRec, date: Date, minutes: number, samples = 240): { lat: number; lon: number }[] {
  const pts: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = new Date(date.getTime() + (i / samples) * minutes * 60_000);
    const s = stateAt(rec, t);
    if (s) pts.push({ lat: s.lat, lon: s.lon });
  }
  return pts;
}

/** Altitude profile over one revolution, for the sparkline. */
export function altitudeProfile(rec: SatRec, date: Date, periodMin: number, samples = 96): { t: number; alt: number }[] {
  const out: { t: number; alt: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = date.getTime() + (i / samples) * periodMin * 60_000;
    const s = stateAt(rec, new Date(t));
    if (s) out.push({ t, alt: s.altKm });
  }
  return out;
}

/** Radius (km, along the ground) of the area that can see the satellite above 0° elevation. */
export function footprintRadiusKm(altKm: number): number {
  return R_EARTH * Math.acos(R_EARTH / (R_EARTH + Math.max(altKm, 0)));
}
