import type { Glyph, ModelKind } from './types';

export type Query = { GROUP: string } | { NAME: string } | { CATNR: string };

export interface SubConstellation {
  id: string;
  label: string;
  glyph: Glyph;
}

export interface SatGroup {
  id: string;
  label: string;
  blurb: string;
  /** Categorical slot colour (validated palette — see README "Colour"). */
  color: string;
  glyph: Glyph;
  /** Each query may tag its results with a sub-constellation id. */
  queries: { q: Query; sub?: string }[];
  /** Keep only names matching this (applied after download). */
  match?: RegExp;
  defaultOn: boolean;
  model: ModelKind;
  subs?: SubConstellation[];
}

const NOT_DEBRIS = /\b(DEB|R\/B|AKM|PKM)\b/;

/**
 * Categorical slots, in fixed validated order (dark surface #120a22):
 * worst adjacent CVD ΔE 12.6, the first three also pass the all-pairs check.
 * Glyph shape is the secondary channel so identity never relies on colour alone.
 */
export const GROUPS: SatGroup[] = [
  {
    id: 'starlink',
    label: 'Starlink',
    blurb: 'SpaceX broadband mega-constellation in ~340–570 km shells.',
    color: '#ee1daf',
    glyph: 'dot',
    queries: [{ q: { GROUP: 'starlink' } }],
    defaultOn: true,
    model: 'starlink',
  },
  {
    id: 'stations',
    label: 'Space stations',
    blurb: 'ISS, Tiangong and the vehicles docked to or flying near them.',
    color: '#09af51',
    glyph: 'star',
    queries: [{ q: { GROUP: 'stations' } }],
    defaultOn: true,
    model: 'station',
  },
  {
    id: 'gnss',
    label: 'GNSS',
    blurb: 'Navigation constellations: GPS, GLONASS, Galileo and BeiDou.',
    color: '#9051fc',
    glyph: 'square',
    queries: [
      { q: { GROUP: 'gps-ops' }, sub: 'gps' },
      { q: { GROUP: 'glo-ops' }, sub: 'glonass' },
      { q: { GROUP: 'galileo' }, sub: 'galileo' },
      { q: { GROUP: 'beidou' }, sub: 'beidou' },
    ],
    defaultOn: true,
    model: 'gnss',
    subs: [
      { id: 'gps', label: 'GPS (USA)', glyph: 'square' },
      { id: 'glonass', label: 'GLONASS (Russia)', glyph: 'triangle' },
      { id: 'galileo', label: 'Galileo (EU)', glyph: 'diamond' },
      { id: 'beidou', label: 'BeiDou (China)', glyph: 'hex' },
    ],
  },
  {
    id: 'esa',
    label: 'ESA · Copernicus',
    blurb: 'Sentinels, Swarm, CryoSat, PROBA, EarthCARE, Biomass, SMOS and XMM-Newton.',
    color: '#e36b02',
    glyph: 'plus',
    queries: ['SENTINEL', 'SWARM', 'CRYOSAT', 'PROBA', 'EARTHCARE', 'BIOMASS', 'SMOS', 'XMM'].map((n) => ({ q: { NAME: n } })),
    match: /^(SENTINEL|SWARM|CRYOSAT|PROBA|EARTHCARE|BIOMASS|SMOS|XMM)/,
    defaultOn: false,
    model: 'eo',
  },
  {
    id: 'eo',
    label: 'Earth observation',
    blurb: 'CelesTrak "Earth resources": Landsat, Terra/Aqua, SPOT, Sentinels and more.',
    color: '#04a3be',
    glyph: 'ring',
    queries: [{ q: { GROUP: 'resource' } }],
    defaultOn: false,
    model: 'eo',
  },
  {
    id: 'singapore',
    label: 'Singapore',
    blurb: 'Satellites built or operated in Singapore — TeLEOS, VELOX, DS-EO, NeuSAR and friends.',
    color: '#e62845',
    glyph: 'cross',
    queries: ['TELEOS', 'VELOX', 'X-SAT', 'KENT RIDGE', 'GALASSIA', 'DS-EO', 'DS-SAR', 'NEUSAR', 'LUMELITE', 'SCOOB', 'NULION', 'ATHENOXAT'].map((n) => ({
      q: { NAME: n },
    })),
    match: /^(TELEOS|VELOX|X-SAT|KENT RIDGE|GALASSIA|DS-EO|DS-SAR|NEUSAR|LUMELITE|SCOOB|NULION|ATHENOXAT)/,
    defaultOn: false,
    model: 'cubesat',
  },
  {
    id: 'weather',
    label: 'Weather',
    blurb: 'NOAA, GOES, Meteosat, Himawari, MetOp, Fengyun and other met satellites.',
    color: '#4a78ea',
    glyph: 'triangle',
    queries: [{ q: { GROUP: 'weather' } }],
    defaultOn: false,
    model: 'eo',
  },
  {
    id: 'science',
    label: 'Science',
    blurb: 'Hubble, space telescopes and other science missions.',
    color: '#ac9008',
    glyph: 'square',
    queries: [{ q: { GROUP: 'science' } }],
    defaultOn: false,
    model: 'generic',
  },
];

export const GROUP_BY_ID: Record<string, SatGroup> = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

export function keepObject(group: SatGroup, name: string): boolean {
  if (NOT_DEBRIS.test(name)) return false;
  return group.match ? group.match.test(name) : true;
}

export interface FeaturedTarget {
  label: string;
  tag: string;
  group: string;
  norad?: number;
  name?: RegExp;
}

/** One-click targets. Resolved against the loaded groups (loading the group if needed). */
export const FEATURED: FeaturedTarget[] = [
  { label: 'ISS', tag: 'crewed station', group: 'stations', norad: 25544 },
  { label: 'Tiangong', tag: 'crewed station', group: 'stations', norad: 48274 },
  { label: 'Hubble', tag: 'space telescope', group: 'science', norad: 20580 },
  { label: 'Landsat 9', tag: 'earth imaging', group: 'eo', norad: 49260 },
  { label: 'Sentinel-2A', tag: 'copernicus', group: 'esa', norad: 40697 },
  { label: 'TeLEOS-2', tag: 'singapore SAR', group: 'singapore', name: /^TELEOS[- ]?2/ },
  { label: 'NOAA-20', tag: 'weather', group: 'weather', norad: 43013 },
];
