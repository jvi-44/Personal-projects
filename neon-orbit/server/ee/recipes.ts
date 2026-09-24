/* eslint-disable @typescript-eslint/no-explicit-any */
import { EE_LAYER_BY_ID, WORLDCOVER_CLASSES, type EELayerMeta } from '../../shared/eeLayers.js';

type EE = any;
type Img = any;
type Col = any;

/**
 * Every scalar recipe outputs a single band called `v` in the units declared in
 * shared/eeLayers.ts; every RGB recipe outputs bands R, G, B in reflectance (0–1).
 */
export interface Recipe {
  /** Raw collection, band-selected but unfiltered by date. */
  raw?: (ee: EE) => Col;
  /** Mask / scale / rename a date-filtered raw collection. */
  prep?: (ee: EE, col: Col) => Col;
  reducer?: 'mean' | 'median' | 'sum';
  /** Static layers skip the collection pipeline. */
  image?: (ee: EE) => Img;
  /** Optional custom visualisation (e.g. categorical land cover). */
  visualize?: (ee: EE, img: Img, meta: EELayerMeta) => { image: Img; vis: Record<string, unknown> };
}

function landsatPrep(bands: string[]) {
  return (_ee: EE, col: Col) =>
    col.map((img: Img) => {
      const qa = img.select('QA_PIXEL');
      // Bits 0–4: fill, dilated cloud, cirrus, cloud, cloud shadow → keep only clear pixels.
      const clear = qa.bitwiseAnd(31).eq(0);
      return img.select(bands).multiply(0.0000275).add(-0.2).updateMask(clear).rename(['R', 'G', 'B']);
    });
}

const landsatRaw = (ee: EE) =>
  ee
    .ImageCollection('LANDSAT/LC09/C02/T1_L2')
    .merge(ee.ImageCollection('LANDSAT/LC08/C02/T1_L2'))
    .filter(ee.Filter.lt('CLOUD_COVER', 70));

function s5p(asset: string, band: string, factor: number): Recipe {
  return {
    raw: (ee) => ee.ImageCollection(asset).select(band),
    prep: (_ee, col) => col.map((img: Img) => img.multiply(factor).rename('v')),
    reducer: 'mean',
  };
}

export const RECIPES: Record<string, Recipe> = {
  landsat_true: { raw: landsatRaw, prep: landsatPrep(['SR_B4', 'SR_B3', 'SR_B2']), reducer: 'median' },
  landsat_false: { raw: landsatRaw, prep: landsatPrep(['SR_B5', 'SR_B4', 'SR_B3']), reducer: 'median' },

  s2_true: {
    raw: (ee) => ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60)),
    prep: (ee, col) =>
      col
        .linkCollection(ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED'), ['cs_cdf'])
        .map((img: Img) =>
          img
            .updateMask(img.select('cs_cdf').gte(0.6))
            .select(['B4', 'B3', 'B2'])
            .multiply(0.0001)
            .rename(['R', 'G', 'B']),
        ),
    reducer: 'median',
  },

  no2: s5p('COPERNICUS/S5P/OFFL/L3_NO2', 'tropospheric_NO2_column_number_density', 1e6),
  aerosol: s5p('COPERNICUS/S5P/OFFL/L3_AER_AI', 'absorbing_aerosol_index', 1),
  co: s5p('COPERNICUS/S5P/OFFL/L3_CO', 'CO_column_number_density', 1e3),
  so2: s5p('COPERNICUS/S5P/OFFL/L3_SO2', 'SO2_column_number_density', 1e6),
  ch4: s5p('COPERNICUS/S5P/OFFL/L3_CH4', 'CH4_column_volume_mixing_ratio_dry_air', 1),

  ndvi: {
    raw: (ee) => ee.ImageCollection('MODIS/061/MOD13A2').select('NDVI'),
    prep: (_ee, col) => col.map((img: Img) => img.multiply(0.0001).rename('v')),
    reducer: 'mean',
  },
  lst: {
    raw: (ee) => ee.ImageCollection('MODIS/061/MOD11A2').select('LST_Day_1km'),
    prep: (_ee, col) => col.map((img: Img) => img.multiply(0.02).subtract(273.15).rename('v')),
    reducer: 'mean',
  },
  precip: {
    raw: (ee) => ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY').select('precipitation'),
    prep: (_ee, col) => col.map((img: Img) => img.rename('v')),
    reducer: 'sum',
  },
  nightlights: {
    raw: (ee) => ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG').select('avg_rad'),
    prep: (_ee, col) => col.map((img: Img) => img.rename('v')),
    reducer: 'mean',
  },

  landcover: {
    image: (ee) => ee.ImageCollection('ESA/WorldCover/v200').first().select('Map').rename('v'),
    visualize: (_ee, img) => ({
      image: img.remap(
        WORLDCOVER_CLASSES.map((c) => c[0]),
        WORLDCOVER_CLASSES.map((_, i) => i),
      ),
      vis: { min: 0, max: WORLDCOVER_CLASSES.length - 1, palette: WORLDCOVER_CLASSES.map((c) => c[2]) },
    }),
  },
  elevation: { image: (ee) => ee.Image('NOAA/NGDC/ETOPO1').select('bedrock').rename('v') },
  water: { image: (ee) => ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').rename('v') },
};

export function reduceCollection(col: Col, reducer: Recipe['reducer']): Img {
  if (reducer === 'median') return col.median();
  if (reducer === 'sum') return col.sum();
  return col.mean();
}

/** Composite for [start, end); falls back to a masked empty image when the window has no data. */
export function composite(ee: EE, id: string, start: string, end: string): Img {
  const r = RECIPES[id];
  if (r.image) return r.image(ee);
  const col = r.prep!(ee, r.raw!(ee).filterDate(start, end));
  const meta = EE_LAYER_BY_ID[id];
  const empty = meta.scalar
    ? ee.Image.constant(0).rename('v').updateMask(0)
    : ee.Image.constant([0, 0, 0]).rename(['R', 'G', 'B']).updateMask(0);
  return ee.Image(ee.Algorithms.If(col.size().gt(0), reduceCollection(col, r.reducer), empty));
}

/** Image + visualisation parameters ready for getMapId / getThumbURL. */
export function visualised(ee: EE, id: string, img: Img): { image: Img; vis: Record<string, unknown> } {
  const meta = EE_LAYER_BY_ID[id];
  const r = RECIPES[id];
  if (r.visualize) return r.visualize(ee, img, meta);
  if (meta.scalar) return { image: img, vis: { bands: ['v'], min: meta.vis.min, max: meta.vis.max, palette: meta.vis.palette } };
  return { image: img, vis: { bands: ['R', 'G', 'B'], min: meta.vis.min, max: meta.vis.max, gamma: meta.vis.gamma ?? 1 } };
}
