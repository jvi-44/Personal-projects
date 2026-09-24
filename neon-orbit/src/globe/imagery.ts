import * as Cesium from 'cesium';
import type { BaseMapId } from '../state/store';

export const ION_TOKEN = (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined)?.trim() || '';
export const GOOGLE_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';

export interface BaseMapDef {
  id: BaseMapId;
  label: string;
  note: string;
  /** Needs a key that isn't set → shown disabled. */
  locked?: string;
}

export const BASEMAPS: BaseMapDef[] = [
  { id: 'neon', label: 'Neon night', note: 'Tinted Natural Earth + CARTO dark streets when zoomed in' },
  { id: 'satellite', label: 'Satellite', note: 'Esri World Imagery (high-res)' },
  { id: 'bluemarble', label: 'Blue Marble', note: 'NASA GIBS relief & bathymetry' },
  { id: 'offline', label: 'Offline', note: 'Natural Earth II bundled with Cesium — no network' },
  { id: 'ion', label: 'Bing + terrain', note: 'Cesium ion aerial imagery + world terrain', locked: ION_TOKEN ? undefined : 'VITE_CESIUM_ION_TOKEN' },
  { id: 'google3d', label: 'Photoreal 3D', note: 'Google Photorealistic 3D Tiles', locked: GOOGLE_KEY ? undefined : 'VITE_GOOGLE_MAPS_API_KEY' },
];

const naturalEarth = () => Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'));

const carto = (style: string) =>
  new Cesium.UrlTemplateImageryProvider({
    url: `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}.png`,
    subdomains: 'abcd',
    maximumLevel: 18,
    credit: new Cesium.Credit('© OpenStreetMap contributors © CARTO'),
  });

/**
 * NASA GIBS tiles via WMTS key-value requests (works for both daily and static
 * layers; static layers simply ignore TIME).
 */
export function gibsProvider(layer: string, date: string | null, level: number, ext: 'jpg' | 'png') {
  const q = new URLSearchParams({
    SERVICE: 'WMTS',
    REQUEST: 'GetTile',
    VERSION: '1.0.0',
    LAYER: layer,
    STYLE: 'default',
    TILEMATRIXSET: `GoogleMapsCompatible_Level${level}`,
    FORMAT: ext === 'jpg' ? 'image/jpeg' : 'image/png',
  });
  if (date) q.set('TIME', date);
  return new Cesium.UrlTemplateImageryProvider({
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?${q}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`,
    maximumLevel: level,
    credit: new Cesium.Credit('NASA EOSDIS GIBS'),
  });
}

export interface BaseMapHandles {
  layers: Cesium.ImageryLayer[];
  tileset?: Cesium.Cesium3DTileset;
  terrain?: boolean;
}

/** Build the layers for a base style. Callers remove the returned handles on switch. */
export async function applyBaseMap(viewer: Cesium.Viewer, id: BaseMapId): Promise<BaseMapHandles> {
  const L = viewer.imageryLayers;
  const out: BaseMapHandles = { layers: [] };
  const add = (layer: Cesium.ImageryLayer, index = 0) => {
    L.add(layer, index + out.layers.length);
    out.layers.push(layer);
    return layer;
  };
  viewer.scene.globe.show = true;

  switch (id) {
    case 'neon': {
      // Low zoom: Natural Earth pushed into a deep violet palette.
      const ne = add(await Cesium.ImageryLayer.fromProviderAsync(naturalEarth(), {}));
      ne.saturation = 0.55;
      ne.brightness = 0.55;
      ne.contrast = 1.35;
      ne.hue = 0.62;
      ne.gamma = 1.1;
      // Zoomed in: CARTO dark streets fade in so detail keeps up.
      const streets = add(new Cesium.ImageryLayer(carto('dark_nolabels'), { minimumTerrainLevel: 7 }));
      streets.brightness = 1.4;
      break;
    }
    case 'satellite': {
      add(
        new Cesium.ImageryLayer(
          new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19,
            credit: new Cesium.Credit('Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community'),
          }),
        ),
      );
      break;
    }
    case 'bluemarble':
      add(new Cesium.ImageryLayer(gibsProvider('BlueMarble_ShadedRelief_Bathymetry', null, 8, 'jpg')));
      break;
    case 'offline':
      add(await Cesium.ImageryLayer.fromProviderAsync(naturalEarth(), {}));
      break;
    case 'ion': {
      Cesium.Ion.defaultAccessToken = ION_TOKEN;
      add(await Cesium.ImageryLayer.fromProviderAsync(Cesium.createWorldImageryAsync({ style: Cesium.IonWorldImageryStyle.AERIAL }), {}));
      viewer.scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
      out.terrain = true;
      break;
    }
    case 'google3d': {
      Cesium.GoogleMaps.defaultApiKey = GOOGLE_KEY;
      // Keep a globe underneath for far zoom levels, then hide it once tiles cover the view.
      add(await Cesium.ImageryLayer.fromProviderAsync(naturalEarth(), {}));
      const tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: GOOGLE_KEY, onlyUsingWithGoogleGeocoder: true });
      viewer.scene.primitives.add(tileset);
      out.tileset = tileset;
      break;
    }
  }
  return out;
}

export function removeBaseMap(viewer: Cesium.Viewer, h: BaseMapHandles | null) {
  if (!h) return;
  for (const l of h.layers) viewer.imageryLayers.remove(l, true);
  if (h.tileset) viewer.scene.primitives.remove(h.tileset);
  if (h.terrain) viewer.scene.setTerrain(new Cesium.Terrain(Promise.resolve(new Cesium.EllipsoidTerrainProvider())));
}

/** Night-side city lights (only visible when day/night lighting is on). */
export function cityLightsLayer(): Cesium.ImageryLayer {
  const layer = new Cesium.ImageryLayer(gibsProvider('VIIRS_Black_Marble', '2016-01-01', 8, 'png'));
  layer.dayAlpha = 0;
  layer.nightAlpha = 0.9;
  return layer;
}

/** Holographic lat/lon grid + violet wash. */
export function holoGridLayer(): Cesium.ImageryLayer {
  const layer = new Cesium.ImageryLayer(
    new Cesium.GridImageryProvider({
      cells: 4,
      color: Cesium.Color.fromCssColorString('#ff4fd8').withAlpha(0.22),
      glowColor: Cesium.Color.fromCssColorString('#b026ff').withAlpha(0.08),
      glowWidth: 4,
      backgroundColor: Cesium.Color.fromCssColorString('#2a0a55').withAlpha(0.12),
    }),
  );
  return layer;
}

export function labelsLayer(): Cesium.ImageryLayer {
  return new Cesium.ImageryLayer(carto('dark_only_labels'));
}
