/**
 * Earth Engine layer catalogue — shared by the browser (names, legends, date
 * limits) and the server (which owns the actual EE recipes in server/ee/recipes.ts).
 *
 * Only ids listed here can be requested from /api/ee/*, so visitors can't run
 * arbitrary computations on your Earth Engine quota.
 */

export type EECategory = 'imagery' | 'atmosphere' | 'land' | 'water' | 'human';

export interface EELayerMeta {
  id: string;
  name: string;
  /** Tiny label for chips / legends. */
  short: string;
  category: EECategory;
  /** Primary Earth Engine asset id (used for catalog links). */
  dataset: string;
  description: string;
  /** Single-band layer with a colour ramp (probe + time-series work). RGB composites are false. */
  scalar: boolean;
  units?: string;
  /** Visualisation range in the *output* units (after scaling in the recipe). */
  vis: { min: number; max: number; palette?: string[]; gamma?: number };
  /** static = one image, no date controls. */
  temporal: 'range' | 'static';
  defaultWindowDays: number;
  maxWindowDays: number;
  /** Typical publication lag, used to pick a sensible default end date. */
  latencyDays: number;
  /** Nominal pixel size used for point probes (metres). */
  probeScale: number;
  /** Decimal places when displaying probe values. */
  decimals: number;
  citation: string;
}

/* Perceptually-uniform ramps (sampled matplotlib colormaps). */
export const RAMPS = {
  magma: ['000004', '1c1044', '4f127b', '812581', 'b5367a', 'e55064', 'fb8761', 'fec287', 'fcfdbf'],
  inferno: ['000004', '1f0c48', '550f6d', '88226a', 'ba3655', 'e35933', 'f98e09', 'f9cb35', 'fcffa4'],
  plasma: ['0d0887', '4c02a1', '7e03a8', 'a92395', 'cc4778', 'e56b5d', 'f89540', 'fdc527', 'f0f921'],
  viridis: ['440154', '472d7b', '3b528b', '2c728e', '21918c', '28ae80', '5ec962', 'addc30', 'fde725'],
  /* Single-hue neon ramp for night lights: black → violet → magenta → white. */
  neon: ['05010a', '1f0638', '3f0b6e', '6d10a3', '9d1bc4', 'cc2fcf', 'ee52d6', 'f79be6', 'fde6f8'],
  /* Blue single-hue ramp for water / rain. */
  water: ['060a1f', '0b1f4d', '103a7a', '1a5aa6', '2d7fcf', '52a3e8', '85c4f2', 'bfe1fa', 'eef7ff'],
  /* Terrain: deep ocean → shelf → lowland → highland → snow. Semantic multi-hue (with legend). */
  terrain: ['0b0f3a', '1b3a8a', '3f7fc4', '9fd3e6', '2f6b3a', '8a9a4a', 'c9b27a', 'e8dcc8', 'ffffff'],
} as const;

const cite = {
  landsat: 'Landsat Collection 2 courtesy of the U.S. Geological Survey',
  s2: 'Contains modified Copernicus Sentinel data, processed by ESA',
  s5p: 'Contains modified Copernicus Sentinel-5P data (ESA / EU Copernicus)',
  modis: 'NASA LP DAAC MODIS Collection 6.1',
};

export const EE_LAYERS: EELayerMeta[] = [
  {
    id: 'landsat_true',
    name: 'Landsat 8/9 · True colour',
    short: 'LANDSAT RGB',
    category: 'imagery',
    dataset: 'LANDSAT/LC09/C02/T1_L2',
    description:
      'Cloud-masked median composite of Landsat 8 and 9 surface reflectance (30 m). Bands SR_B4/B3/B2.',
    scalar: false,
    vis: { min: 0, max: 0.3, gamma: 1.3 },
    temporal: 'range',
    defaultWindowDays: 90,
    maxWindowDays: 366,
    latencyDays: 3,
    probeScale: 30,
    decimals: 3,
    citation: cite.landsat,
  },
  {
    id: 'landsat_false',
    name: 'Landsat 8/9 · False colour (vegetation)',
    short: 'LANDSAT NIR',
    category: 'imagery',
    dataset: 'LANDSAT/LC08/C02/T1_L2',
    description: 'NIR / Red / Green composite. Healthy vegetation glows red, cities appear cyan-grey.',
    scalar: false,
    vis: { min: 0, max: 0.4, gamma: 1.2 },
    temporal: 'range',
    defaultWindowDays: 90,
    maxWindowDays: 366,
    latencyDays: 3,
    probeScale: 30,
    decimals: 3,
    citation: cite.landsat,
  },
  {
    id: 's2_true',
    name: 'Sentinel-2 · True colour',
    short: 'S2 RGB',
    category: 'imagery',
    dataset: 'COPERNICUS/S2_SR_HARMONIZED',
    description: '10 m Sentinel-2 surface reflectance, masked with Google Cloud Score+ (cs_cdf ≥ 0.6).',
    scalar: false,
    vis: { min: 0, max: 0.3, gamma: 1.2 },
    temporal: 'range',
    defaultWindowDays: 60,
    maxWindowDays: 180,
    latencyDays: 3,
    probeScale: 10,
    decimals: 3,
    citation: cite.s2,
  },
  {
    id: 'no2',
    name: 'Nitrogen dioxide (NO₂) · Sentinel-5P',
    short: 'NO₂',
    category: 'atmosphere',
    dataset: 'COPERNICUS/S5P/OFFL/L3_NO2',
    description:
      'Tropospheric NO₂ column from TROPOMI. Traffic, power plants and industry light up; a proxy for combustion pollution.',
    scalar: true,
    units: 'µmol/m²',
    vis: { min: 0, max: 200, palette: [...RAMPS.magma] },
    temporal: 'range',
    defaultWindowDays: 30,
    maxWindowDays: 366,
    latencyDays: 7,
    probeScale: 1113,
    decimals: 1,
    citation: cite.s5p,
  },
  {
    id: 'aerosol',
    name: 'Absorbing aerosol index · Sentinel-5P',
    short: 'AER AI',
    category: 'atmosphere',
    dataset: 'COPERNICUS/S5P/OFFL/L3_AER_AI',
    description: 'UV aerosol index: smoke, desert dust and volcanic ash. Positive values = absorbing aerosols.',
    scalar: true,
    units: 'index',
    vis: { min: -1, max: 2, palette: [...RAMPS.inferno] },
    temporal: 'range',
    defaultWindowDays: 14,
    maxWindowDays: 366,
    latencyDays: 7,
    probeScale: 1113,
    decimals: 2,
    citation: cite.s5p,
  },
  {
    id: 'co',
    name: 'Carbon monoxide (CO) · Sentinel-5P',
    short: 'CO',
    category: 'atmosphere',
    dataset: 'COPERNICUS/S5P/OFFL/L3_CO',
    description: 'Total CO column. Tracks wildfire smoke plumes and incomplete combustion.',
    scalar: true,
    units: 'mmol/m²',
    vis: { min: 20, max: 50, palette: [...RAMPS.plasma] },
    temporal: 'range',
    defaultWindowDays: 30,
    maxWindowDays: 366,
    latencyDays: 7,
    probeScale: 1113,
    decimals: 1,
    citation: cite.s5p,
  },
  {
    id: 'so2',
    name: 'Sulphur dioxide (SO₂) · Sentinel-5P',
    short: 'SO₂',
    category: 'atmosphere',
    dataset: 'COPERNICUS/S5P/OFFL/L3_SO2',
    description: 'Total SO₂ column — volcanic degassing, coal power and smelters.',
    scalar: true,
    units: 'µmol/m²',
    vis: { min: 0, max: 500, palette: [...RAMPS.inferno] },
    temporal: 'range',
    defaultWindowDays: 30,
    maxWindowDays: 366,
    latencyDays: 7,
    probeScale: 1113,
    decimals: 0,
    citation: cite.s5p,
  },
  {
    id: 'ch4',
    name: 'Methane (CH₄) · Sentinel-5P',
    short: 'CH₄',
    category: 'atmosphere',
    dataset: 'COPERNICUS/S5P/OFFL/L3_CH4',
    description: 'Column-averaged dry-air methane mixing ratio.',
    scalar: true,
    units: 'ppb',
    vis: { min: 1800, max: 1980, palette: [...RAMPS.magma] },
    temporal: 'range',
    defaultWindowDays: 60,
    maxWindowDays: 366,
    latencyDays: 10,
    probeScale: 1113,
    decimals: 0,
    citation: cite.s5p,
  },
  {
    id: 'ndvi',
    name: 'Vegetation index (NDVI) · MODIS',
    short: 'NDVI',
    category: 'land',
    dataset: 'MODIS/061/MOD13A2',
    description: '16-day 1 km Normalised Difference Vegetation Index. 0 = bare, 0.8+ = dense canopy.',
    scalar: true,
    units: 'NDVI',
    vis: { min: 0, max: 0.9, palette: [...RAMPS.viridis] },
    temporal: 'range',
    defaultWindowDays: 32,
    maxWindowDays: 366,
    latencyDays: 20,
    probeScale: 1000,
    decimals: 2,
    citation: cite.modis,
  },
  {
    id: 'lst',
    name: 'Land surface temperature (day) · MODIS',
    short: 'LST',
    category: 'land',
    dataset: 'MODIS/061/MOD11A2',
    description: '8-day daytime land surface temperature at 1 km — urban heat islands and deserts.',
    scalar: true,
    units: '°C',
    vis: { min: -10, max: 50, palette: [...RAMPS.inferno] },
    temporal: 'range',
    defaultWindowDays: 16,
    maxWindowDays: 366,
    latencyDays: 12,
    probeScale: 1000,
    decimals: 1,
    citation: cite.modis,
  },
  {
    id: 'landcover',
    name: 'Land cover 2021 · ESA WorldCover',
    short: 'WORLDCOVER',
    category: 'land',
    dataset: 'ESA/WorldCover/v200',
    description: '10 m global land-cover map with 11 classes (ESA WorldCover v200, 2021).',
    scalar: false,
    vis: { min: 10, max: 100 },
    temporal: 'static',
    defaultWindowDays: 0,
    maxWindowDays: 0,
    latencyDays: 0,
    probeScale: 10,
    decimals: 0,
    citation: '© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021)',
  },
  {
    id: 'elevation',
    name: 'Elevation & bathymetry · ETOPO1',
    short: 'ETOPO1',
    category: 'land',
    dataset: 'NOAA/NGDC/ETOPO1',
    description: 'Global relief model of land topography and ocean bathymetry (1 arc-minute).',
    scalar: true,
    units: 'm',
    vis: { min: -7000, max: 5000, palette: [...RAMPS.terrain] },
    temporal: 'static',
    defaultWindowDays: 0,
    maxWindowDays: 0,
    latencyDays: 0,
    probeScale: 1852,
    decimals: 0,
    citation: 'NOAA National Geophysical Data Center, ETOPO1',
  },
  {
    id: 'precip',
    name: 'Rainfall total · CHIRPS',
    short: 'RAIN',
    category: 'water',
    dataset: 'UCSB-CHG/CHIRPS/DAILY',
    description: 'Accumulated precipitation over the window (land only, 50°S–50°N).',
    scalar: true,
    units: 'mm',
    vis: { min: 0, max: 400, palette: [...RAMPS.water] },
    temporal: 'range',
    defaultWindowDays: 30,
    maxWindowDays: 366,
    latencyDays: 45,
    probeScale: 5566,
    decimals: 0,
    citation: 'Funk et al. (2015) CHIRPS, Climate Hazards Center UCSB',
  },
  {
    id: 'water',
    name: 'Surface water occurrence · JRC',
    short: 'WATER',
    category: 'water',
    dataset: 'JRC/GSW1_4/GlobalSurfaceWater',
    description: 'How often each 30 m pixel was water between 1984 and 2021 (%).',
    scalar: true,
    units: '%',
    vis: { min: 0, max: 100, palette: [...RAMPS.water] },
    temporal: 'static',
    defaultWindowDays: 0,
    maxWindowDays: 0,
    latencyDays: 0,
    probeScale: 30,
    decimals: 0,
    citation: 'EC JRC / Google — Pekel et al. (2016), Nature',
  },
  {
    id: 'nightlights',
    name: 'Night lights · VIIRS DNB',
    short: 'NIGHT',
    category: 'human',
    dataset: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG',
    description: 'Monthly average night-time radiance (stray-light corrected). Cities, gas flares, fishing fleets.',
    scalar: true,
    units: 'nW/cm²/sr',
    vis: { min: 0, max: 40, palette: [...RAMPS.neon] },
    temporal: 'range',
    defaultWindowDays: 90,
    maxWindowDays: 366,
    latencyDays: 60,
    probeScale: 463,
    decimals: 1,
    citation: 'Earth Observation Group, Payne Institute / Colorado School of Mines — VIIRS DNB',
  },
];

export const EE_LAYER_BY_ID: Record<string, EELayerMeta> = Object.fromEntries(EE_LAYERS.map((l) => [l.id, l]));

/** ESA WorldCover v200 class legend (value → [label, hex]) — matches the dataset's own palette. */
export const WORLDCOVER_CLASSES: [number, string, string][] = [
  [10, 'Tree cover', '006400'],
  [20, 'Shrubland', 'ffbb22'],
  [30, 'Grassland', 'ffff4c'],
  [40, 'Cropland', 'f096ff'],
  [50, 'Built-up', 'fa0000'],
  [60, 'Bare / sparse', 'b4b4b4'],
  [70, 'Snow & ice', 'f0f0f0'],
  [80, 'Water', '0064c8'],
  [90, 'Herbaceous wetland', '0096a0'],
  [95, 'Mangroves', '00cf75'],
  [100, 'Moss & lichen', 'fae6a0'],
];

export function eeCatalogUrl(dataset: string): string {
  return `https://developers.google.com/earth-engine/datasets/catalog/${dataset.replace(/\//g, '_')}`;
}

const DAY = 86_400_000;

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Default [start, end) window for a layer, ending `latencyDays` before now. */
export function defaultWindow(meta: EELayerMeta, now = new Date()): { start: string; end: string } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - meta.latencyDays * DAY);
  const start = new Date(end.getTime() - meta.defaultWindowDays * DAY);
  return { start: isoDate(start), end: isoDate(end) };
}

export interface ValidatedWindow {
  start: string;
  end: string;
}

/**
 * Validate a user-supplied date window against a layer's limits.
 * Returns an error string, or the normalised window.
 */
export function validateWindow(meta: EELayerMeta, start?: string | null, end?: string | null): ValidatedWindow | string {
  if (meta.temporal === 'static') return { start: '', end: '' };
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!start || !end || !re.test(start) || !re.test(end)) return 'start and end must be YYYY-MM-DD';
  const s = Date.parse(`${start}T00:00:00Z`);
  const e = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 'invalid date';
  if (e <= s) return 'end must be after start';
  if (s < Date.UTC(1984, 0, 1)) return 'start is before the archive begins';
  if (e > Date.now() + 2 * DAY) return 'end is in the future';
  if ((e - s) / DAY > meta.maxWindowDays) return `window too long (max ${meta.maxWindowDays} days for this layer)`;
  return { start, end };
}
