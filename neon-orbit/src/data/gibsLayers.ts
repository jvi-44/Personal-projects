/**
 * Keyless layers from NASA GIBS (Global Imagery Browse Services).
 * These work with no backend at all — handy for static hosting.
 * Identifiers & zoom limits follow the GIBS EPSG:3857 WMTS capabilities;
 * browse them at https://worldview.earthdata.nasa.gov
 */
export interface GibsLayer {
  id: string;
  name: string;
  short: string;
  layer: string;
  level: number;
  ext: 'jpg' | 'png';
  description: string;
  /** Fixed date for non-daily products. */
  static?: string;
  /** Days behind "today" that a daily mosaic is normally complete. */
  lagDays: number;
  category: 'imagery' | 'atmosphere' | 'land' | 'water' | 'human';
}

export const GIBS_LAYERS: GibsLayer[] = [
  {
    id: 'viirs_truecolor',
    name: 'Daily true colour · VIIRS NOAA-20',
    short: 'VIIRS RGB',
    layer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
    level: 9,
    ext: 'jpg',
    description: 'Whole-planet daily mosaic — clouds, smoke, dust storms and snow as they looked on the chosen day.',
    lagDays: 1,
    category: 'imagery',
  },
  {
    id: 'modis_truecolor',
    name: 'Daily true colour · MODIS Aqua',
    short: 'MODIS RGB',
    layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
    level: 9,
    ext: 'jpg',
    description: 'Afternoon-overpass mosaic from Aqua/MODIS (250 m).',
    lagDays: 1,
    category: 'imagery',
  },
  {
    id: 'aod',
    name: 'Aerosol optical depth · MODIS',
    short: 'AOD',
    layer: 'MODIS_Combined_Value_Added_AOD',
    level: 6,
    ext: 'png',
    description: 'Haze, smoke and dust loading (Terra + Aqua combined).',
    lagDays: 2,
    category: 'atmosphere',
  },
  {
    id: 'lst_day',
    name: 'Land surface temp. (day) · MODIS',
    short: 'LST',
    layer: 'MODIS_Terra_Land_Surface_Temp_Day',
    level: 7,
    ext: 'png',
    description: 'Daytime skin temperature of the land surface.',
    lagDays: 2,
    category: 'land',
  },
  {
    id: 'sst',
    name: 'Sea surface temperature · GHRSST MUR',
    short: 'SST',
    layer: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    level: 7,
    ext: 'png',
    description: 'Gap-free multi-sensor analysis of ocean temperature.',
    lagDays: 2,
    category: 'water',
  },
  {
    id: 'blackmarble',
    name: 'Black Marble night lights 2016',
    short: 'NIGHT',
    layer: 'VIIRS_Black_Marble',
    level: 8,
    ext: 'png',
    description: 'Cloud-free composite of Earth at night (VIIRS day/night band).',
    static: '2016-01-01',
    lagDays: 0,
    category: 'human',
  },
];

export const GIBS_BY_ID: Record<string, GibsLayer> = Object.fromEntries(GIBS_LAYERS.map((l) => [l.id, l]));

export function gibsDefaultDate(l: GibsLayer, now = new Date()): string {
  if (l.static) return l.static;
  return new Date(now.getTime() - l.lagDays * 86_400_000).toISOString().slice(0, 10);
}
