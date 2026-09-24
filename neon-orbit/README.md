# NEON//ORBIT

A personal "mission control" website: a live 3D Earth with real-time satellite tracking, plus quick access to open Earth-observation data through **Google Earth Engine** and **NASA GIBS**. Styled as a purple / pink / acid-green retro-cyberpunk HUD.

## Features

- **Live 3D globe** (CesiumJS): zoom, pan, tilt, day/night terminator, city lights on the night side, holographic grid, neon atmosphere.
- **Real-time satellites.** Orbital elements come from [CelesTrak](https://celestrak.org) and are propagated with SGP4 (satellite.js) in a Web Worker about 10× per second. Groups:
  - Starlink
  - Space stations (ISS, Tiangong)
  - GNSS (GPS / GLONASS / Galileo / BeiDou, each toggleable)
  - ESA · Copernicus
  - Earth observation
  - **Singapore** (TeLEOS, VELOX, DS-EO, NeuSAR …)
  - Weather
  - Science (Hubble)
- **Click a satellite** to lock on. You get telemetry (lat/lon/alt/speed, sunlit/eclipse), its orbit ring, ground track, coverage footprint and an altitude-over-orbit chart. A **3D model of the satellite flies on the globe** with it.
- **3D inspector** (double-click, or *Inspect 3D*). This is a three.js viewer with procedural models of the ISS, Tiangong, Starlink, GNSS, Earth-observation, Hubble, GEO comsat and CubeSat classes. It includes a hologram shader, an exploded view, and numbered hotspots that explain each feature (solar arrays, phased arrays, atomic clocks, Canadarm2 …).
- **Earth data layers.**
  - **Earth Engine:** Landsat 8/9, Sentinel-2, Sentinel-5P pollution (NO₂, CO, SO₂, CH₄, aerosol index), NDVI, land-surface temperature, ESA WorldCover, ETOPO1 relief, CHIRPS rainfall, JRC surface water, VIIRS night lights. Each layer has date pickers, opacity and a legend.
  - **NASA GIBS (no key needed):** daily true colour, aerosols, land-surface temperature, sea-surface temperature, Black Marble.
  - **Probe mode:** click the ground to read values plus a 12-month trend chart.
  - **PNG of view:** downloads an Earth Engine snapshot of what's on screen.
- **Above Singapore now**: satellites currently over the observer (configurable in `src/config/site.ts`).
- Time controls (live, pause, 1×–1800×), mobile layout, and reduced-motion support.

## Quick start

```bash
cd neon-orbit
npm install
cp .env.example .env      # optional: add keys (see below)
npm run dev               # http://localhost:5173
```

Satellites work with **no keys at all**. Personalise the title, links and home location in `src/config/site.ts`.

## API keys

| Key | Where it lives | Unlocks |
|---|---|---|
| `EE_PROJECT_ID` + `EE_SERVICE_ACCOUNT_JSON` | **server only** | All Earth Engine layers, probe, PNG export |
| `VITE_CESIUM_ION_TOKEN` | browser (restrict by referrer) | Bing aerial imagery + 3D world terrain |
| `VITE_GOOGLE_MAPS_API_KEY` | browser (restrict by referrer) | Google Photorealistic 3D Tiles |

### Earth Engine setup

1. Create or choose a Google Cloud project and [register it for Earth Engine](https://code.earthengine.google.com/register). Noncommercial use (a personal site) is free.
2. Enable the **Earth Engine API** on the project.
3. IAM → Service accounts → create one. Grant it **Earth Engine Resource Viewer** and **Service Usage Consumer**, then create a JSON key.
4. Put the project id in `EE_PROJECT_ID` and the whole key JSON (raw or base64) in `EE_SERVICE_ACCOUNT_JSON`, or point `EE_SERVICE_ACCOUNT_FILE` at the file. **Never commit it.**

The browser never sees the key. It calls `/api/ee/*`, which only accepts layer ids from `shared/eeLayers.ts` and validated date ranges. That's rate-limited per IP, so visitors can't run arbitrary jobs on your quota. If a product has no data in the chosen window yet (publishing lag), the server slides the window back to the latest available data and tells the UI.

## Deploy

- **Vercel (recommended):** import the repo, set **Root Directory** = `neon-orbit`, and add the env vars. `api/*.ts` become serverless functions. The CelesTrak proxy is CDN-cached for 2 h, per CelesTrak's usage policy.
- **Any Node host:** run `npm run build && npm start`. This serves `dist/` plus `/api` on `$PORT`.
- **Static only (e.g. GitHub Pages):** set `BASE_PATH=/repo/` and run `npm run build`. Satellites fall back to CelesTrak directly and GIBS still works. Earth Engine needs the backend.

## Tests

```bash
npm test        # unit: orbit maths, classification, API validation
npm run e2e     # Playwright: full UI with mocked CelesTrak / Earth Engine
```

## How it fits together

```
shared/eeLayers.ts   layer catalogue (names, legends, date limits) — used by both sides
server/              CelesTrak cache proxy + Earth Engine recipes/handlers (Node)
api/                 thin Vercel entry points → server/http.ts
src/globe/engine.ts  Cesium viewer, SGP4 worker, billboards, selection, overlays
src/sat/             groups, CelesTrak client (IndexedDB 2 h cache), orbit maths, facts
src/inspector/       procedural three.js models, GLB export, 3D inspector
src/ui/              React HUD panels
```

Colour: the eight satellite-group colours are a validated categorical palette on the dark surface (worst adjacent colour-blind ΔE 12.6). Each group also has its own marker shape, so identity never depends on colour alone.

## Credits

CelesTrak GP data · satellite.js · CesiumJS · three.js · Google Earth Engine and its dataset providers (USGS, ESA/Copernicus, NASA, NOAA, JRC, CHC/UCSB, EOG) · NASA EOSDIS GIBS · Natural Earth · © OpenStreetMap contributors © CARTO · Esri World Imagery.
