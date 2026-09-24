import * as Cesium from 'cesium';
import { json2satrec, type SatRec } from 'satellite.js';
import { SITE } from '../config/site';
import { classify } from '../sat/classify';
import { fetchQuery } from '../sat/celestrak';
import { GROUP_BY_ID, GROUPS, keepObject, type SatGroup } from '../sat/groups';
import { footprintRadiusKm, groundTrack, orbitRing, R_EARTH, stateAt, summarize, type Regime, type StateVector } from '../sat/orbit';
import type { Glyph, OMM, Sat } from '../sat/types';
import { getState, useStore, type BaseMapId, type Overlay } from '../state/store';
import { glyphUrl, reticleUrl } from './glyphs';
import { applyBaseMap, cityLightsLayer, gibsProvider, holoGridLayer, labelsLayer, removeBaseMap, type BaseMapHandles } from './imagery';
import { GIBS_BY_ID } from '../data/gibsLayers';

type Listener = () => void;

export interface Telemetry {
  sat: Sat;
  state: StateVector | null;
  summary: ReturnType<typeof summarize>;
  footprintKm: number;
}

export interface OverheadRow {
  sat: Sat;
  elevation: number;
  azimuth: number;
  rangeKm: number;
}

const scratch = new Cesium.Cartesian3();

/**
 * Imperative core: owns the Cesium viewer, the satellite catalogue, the SGP4
 * worker and all globe primitives. React components talk to it through the
 * store and the small subscription API below.
 */
class Engine {
  viewer: Cesium.Viewer | null = null;
  sats: Sat[] = [];
  byNorad = new Map<number, Sat>();
  private groupData = new Map<string, { omm: OMM; sub?: string }[]>();
  private groupLoads = new Map<string, Promise<void>>();

  private worker: Worker | null = null;
  private seq = 0;
  private pending = false;
  private lastTick = 0;
  private forceTick = false;
  positions: Float64Array | null = null;
  positionsTime = 0;

  private billboards: Cesium.BillboardCollection | null = null;
  private bb: Cesium.Billboard[] = [];
  private visible: boolean[] = [];

  private selRec: SatRec | null = null;
  private selSat: Sat | null = null;
  private selCache = { t: Number.NaN, s: null as StateVector | null };
  private selEntities: Cesium.Entity[] = [];
  private target: Cesium.Entity | null = null;
  private orbitTimer = 0;
  private modelUrl: string | null = null;

  private base: BaseMapHandles | null = null;
  private baseToken = 0;
  private grid: Cesium.ImageryLayer | null = null;
  private lights: Cesium.ImageryLayer | null = null;
  private labels: Cesium.ImageryLayer | null = null;
  private overlayLayers = new Map<string, { layer: Cesium.ImageryLayer; sig: string }>();
  private probeEntity: Cesium.Entity | null = null;

  private listeners = new Set<Listener>();
  fps = 0;
  private frames = 0;
  private fpsT = performance.now();

  // ────────────────────────────────── setup ──────────────────────────────────

  mount(container: HTMLElement, creditContainer: HTMLElement) {
    if (this.viewer) return;
    const viewer = new Cesium.Viewer(container, {
      baseLayer: false,
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer,
      shouldAnimate: true,
      msaaSamples: 4,
      showRenderLoopErrors: false,
    });
    this.viewer = viewer;
    const { scene } = viewer;
    const globe = scene.globe;

    scene.backgroundColor = Cesium.Color.fromCssColorString('#05010a');
    globe.baseColor = Cesium.Color.fromCssColorString('#12062a');
    globe.showGroundAtmosphere = true;
    globe.atmosphereHueShift = 0.18;
    globe.atmosphereSaturationShift = 0.1;
    globe.atmosphereBrightnessShift = -0.05;
    globe.dynamicAtmosphereLighting = true;
    globe.dynamicAtmosphereLightingFromSun = true;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.hueShift = 0.2;
      scene.skyAtmosphere.saturationShift = 0.15;
      scene.skyAtmosphere.brightnessShift = 0.05;
    }
    if (scene.sun) scene.sun.glowFactor = 1.4;
    scene.fog.enabled = true;
    const bloom = scene.postProcessStages.bloom;
    bloom.enabled = true;
    bloom.uniforms.glowOnly = false;
    bloom.uniforms.contrast = 119;
    bloom.uniforms.brightness = -0.35;
    bloom.uniforms.delta = 0.9;
    bloom.uniforms.sigma = 2.6;
    bloom.uniforms.stepSize = 1.2;

    const ctl = scene.screenSpaceCameraController;
    ctl.minimumZoomDistance = 30;
    ctl.maximumZoomDistance = 250_000_000;

    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    viewer.clock.multiplier = 1;
    viewer.clock.currentTime = Cesium.JulianDate.now();

    // Default double-click tracks entities; we use it to open the inspector instead.
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    this.billboards = scene.primitives.add(new Cesium.BillboardCollection({ scene }));
    this.addGuides();
    this.setupInput();
    this.flyHome(0);

    this.worker = new Worker(new URL('../sat/propagator.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => this.onWorker(e.data);

    // Never leave the globe frozen: report the error and restart the render loop.
    scene.renderError.addEventListener((_s, err) => {
      console.error('Cesium render error', err);
      getState().notify(`Globe render hiccup: ${err instanceof Error ? err.message : err}`, 'warn');
      window.setTimeout(() => {
        if (this.viewer) this.viewer.useDefaultRenderLoop = true;
      }, 250);
    });
    scene.preRender.addEventListener(() => this.maybeTick());
    scene.postRender.addEventListener(() => {
      this.frames++;
      const now = performance.now();
      if (now - this.fpsT > 1000) {
        this.fps = Math.round((this.frames * 1000) / (now - this.fpsT));
        this.frames = 0;
        this.fpsT = now;
      }
    });

    // Reflect store → globe.
    const s = getState();
    this.setBaseMap(s.baseMap);
    this.setGrid(s.holoGrid);
    this.setLighting(s.lighting);
    this.setLabels(s.labels);
    useStore.subscribe((st, prev) => {
      if (st.baseMap !== prev.baseMap) this.setBaseMap(st.baseMap);
      if (st.holoGrid !== prev.holoGrid) this.setGrid(st.holoGrid);
      if (st.lighting !== prev.lighting) this.setLighting(st.lighting);
      if (st.labels !== prev.labels) this.setLabels(st.labels);
      if (st.enabledGroups !== prev.enabledGroups || st.enabledSubs !== prev.enabledSubs) this.onGroupsChanged(prev.enabledGroups);
      if (st.overlays !== prev.overlays) this.syncOverlays(st.overlays);
      if (st.follow !== prev.follow) this.applyFollow();
      if (st.showOrbit !== prev.showOrbit || st.showModel !== prev.showModel) this.refreshSelectionVisuals();
      if (st.paused !== prev.paused || st.multiplier !== prev.multiplier) this.applyClock();
      // The inspector covers the globe — stop drawing it to free the GPU.
      if (st.inspectorOpen !== prev.inspectorOpen) viewer.useDefaultRenderLoop = !st.inspectorOpen;
    });

    for (const g of GROUPS) if (s.enabledGroups[g.id]) void this.ensureGroup(g.id);
  }

  /** Faint GEO belt ring — geostationary satellites sit on it. */
  private addGuides() {
    const v = this.viewer!;
    const r = 42_164_000;
    const pts: Cesium.Cartesian3[] = [];
    for (let i = 0; i <= 360; i += 2) pts.push(new Cesium.Cartesian3(r * Math.cos((i * Math.PI) / 180), r * Math.sin((i * Math.PI) / 180), 0));
    v.entities.add({
      id: 'guide-geo',
      polyline: {
        positions: pts,
        width: 1,
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#b026ff').withAlpha(0.35), dashLength: 24 }),
      },
    });
  }

  // ──────────────────────────────── imagery ─────────────────────────────────

  private async setBaseMap(id: BaseMapId) {
    const v = this.viewer!;
    const token = ++this.baseToken;
    try {
      localStorage.setItem('neon-orbit:base', id);
    } catch {
      /* private mode */
    }
    removeBaseMap(v, this.base);
    this.base = null;
    try {
      const h = await applyBaseMap(v, id);
      if (token !== this.baseToken) return removeBaseMap(v, h);
      this.base = h;
    } catch (e) {
      getState().notify(`Base map failed: ${e instanceof Error ? e.message : e}. Falling back to offline map.`, 'error');
      if (id !== 'offline') getState().set({ baseMap: 'offline' });
    }
    this.restackTopLayers();
  }

  private setGrid(on: boolean) {
    const L = this.viewer!.imageryLayers;
    if (on && !this.grid) {
      this.grid = holoGridLayer();
      L.add(this.grid);
    }
    if (this.grid) this.grid.show = on;
    this.restackTopLayers();
  }

  private setLabels(on: boolean) {
    const L = this.viewer!.imageryLayers;
    if (on && !this.labels) {
      this.labels = labelsLayer();
      L.add(this.labels);
    }
    if (this.labels) this.labels.show = on;
    this.restackTopLayers();
  }

  private setLighting(on: boolean) {
    const v = this.viewer!;
    v.scene.globe.enableLighting = on;
    if (!this.lights) {
      this.lights = cityLightsLayer();
      v.imageryLayers.add(this.lights);
    }
    this.lights.show = on;
    this.restackTopLayers();
  }

  /** Keep city lights → data overlays → grid → labels in a sensible order above the base. */
  private restackTopLayers() {
    const L = this.viewer!.imageryLayers;
    if (this.lights && L.contains(this.lights)) L.raiseToTop(this.lights);
    for (const { layer } of this.overlayLayers.values()) if (L.contains(layer)) L.raiseToTop(layer);
    if (this.grid && L.contains(this.grid)) L.raiseToTop(this.grid);
    if (this.labels && L.contains(this.labels)) L.raiseToTop(this.labels);
  }

  private syncOverlays(overlays: Overlay[]) {
    const L = this.viewer!.imageryLayers;
    const wanted = new Set<string>();
    for (const o of overlays) {
      let url = '';
      let level = 18;
      let ext: 'png' | 'jpg' = 'png';
      if (o.source === 'gee' && o.status === 'ready' && o.urlFormat) url = o.urlFormat;
      if (o.source === 'gibs') {
        const g = GIBS_BY_ID[o.layerId];
        if (g) {
          url = `gibs:${g.layer}:${g.static ?? o.end}`;
          level = g.level;
          ext = g.ext;
        }
      }
      if (!url) continue;
      wanted.add(o.key);
      const sig = url;
      const cur = this.overlayLayers.get(o.key);
      if (cur && cur.sig !== sig) {
        L.remove(cur.layer, true);
        this.overlayLayers.delete(o.key);
      }
      let entry = this.overlayLayers.get(o.key);
      if (!entry) {
        const provider =
          o.source === 'gibs'
            ? gibsProvider(GIBS_BY_ID[o.layerId].layer, GIBS_BY_ID[o.layerId].static ?? o.end, level, ext)
            : new Cesium.UrlTemplateImageryProvider({ url, maximumLevel: 20, credit: new Cesium.Credit('Google Earth Engine') });
        let errors = 0;
        provider.errorEvent.addEventListener(() => {
          if (++errors === 12) getState().notify(`Tiles for ${o.layerId} keep failing — the source may be unreachable.`, 'warn');
        });
        const layer = new Cesium.ImageryLayer(provider);
        L.add(layer);
        entry = { layer, sig };
        this.overlayLayers.set(o.key, entry);
      }
      entry.layer.alpha = o.opacity;
    }
    for (const [key, { layer }] of this.overlayLayers) {
      if (!wanted.has(key)) {
        L.remove(layer, true);
        this.overlayLayers.delete(key);
      }
    }
    this.restackTopLayers();
  }

  // ─────────────────────────────── catalogue ────────────────────────────────

  ensureGroup(id: string): Promise<void> {
    const existing = this.groupLoads.get(id);
    if (existing) return existing;
    const group = GROUP_BY_ID[id];
    const setStatus = (patch: Partial<ReturnType<typeof getState>['groupStatus'][string]>) =>
      getState().set({ groupStatus: { ...getState().groupStatus, [id]: { ...getState().groupStatus[id], ...patch } } });
    setStatus({ state: 'loading', error: undefined });
    const p = (async () => {
      const results = await Promise.allSettled(group.queries.map((q) => fetchQuery(q.q)));
      const rows: { omm: OMM; sub?: string }[] = [];
      const seen = new Set<number>();
      let fetchedAt = Infinity;
      let source = '';
      results.forEach((r, i) => {
        if (r.status !== 'fulfilled') return;
        fetchedAt = Math.min(fetchedAt, r.value.fetchedAt);
        source = r.value.source;
        for (const omm of r.value.records) {
          const n = Number(omm.NORAD_CAT_ID);
          if (seen.has(n) || !keepObject(group, omm.OBJECT_NAME)) continue;
          seen.add(n);
          rows.push({ omm, sub: group.queries[i].sub });
        }
      });
      const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (failed.length === results.length) {
        this.groupLoads.delete(id);
        const msg = failed[0].reason instanceof Error ? failed[0].reason.message : String(failed[0].reason);
        setStatus({ state: 'error', error: msg });
        getState().notify(`${group.label}: couldn't reach CelesTrak (${msg})`, 'error');
        return;
      }
      this.groupData.set(id, rows);
      setStatus({ state: 'ready', count: rows.length, fetchedAt, source, error: failed.length ? `${failed.length} sub-queries failed` : undefined });
      this.rebuild();
    })();
    this.groupLoads.set(id, p);
    return p;
  }

  private rebuild() {
    const merged = new Map<number, Sat>();
    for (const g of GROUPS) {
      const rows = this.groupData.get(g.id);
      if (!rows) continue;
      for (const { omm, sub } of rows) {
        const n = Number(omm.NORAD_CAT_ID);
        const cur = merged.get(n);
        if (cur) {
          cur.groups.push(g.id);
          continue;
        }
        merged.set(n, { idx: 0, norad: n, name: omm.OBJECT_NAME, intlDes: omm.OBJECT_ID, groups: [g.id], sub, kind: 'generic', omm });
      }
    }
    this.sats = [...merged.values()];
    this.sats.forEach((s, i) => {
      s.idx = i;
      s.kind = classify(s.omm, s.groups);
    });
    this.byNorad = new Map(this.sats.map((s) => [s.norad, s]));
    this.positions = null;

    const bc = this.billboards!;
    bc.removeAll();
    this.bb = this.sats.map((s) =>
      bc.add({
        position: Cesium.Cartesian3.ZERO,
        image: glyphUrl('dot', '#ffffff'),
        scale: 0.5,
        show: false,
        id: { norad: s.norad },
        scaleByDistance: new Cesium.NearFarScalar(4e5, 1.3, 6e7, 0.4),
      }),
    );
    this.visible = this.sats.map(() => false);
    this.applyStyles();
    this.worker!.postMessage({ type: 'load', omms: this.sats.map((s) => s.omm) });
    this.forceTick = true;
    if (this.selSat) {
      const again = this.byNorad.get(this.selSat.norad);
      if (again) this.selSat = again;
    }
    this.emit();
  }

  /** Colour/glyph/visibility per object from the enabled groups. */
  private applyStyles() {
    const { enabledGroups, enabledSubs } = getState();
    this.sats.forEach((s, i) => {
      const g = s.groups.map((id) => GROUP_BY_ID[id]).find((gr) => enabledGroups[gr.id]);
      const subOk = !s.sub || enabledSubs[s.sub] !== false || !g || g.id !== 'gnss';
      const vis = !!g && subOk;
      this.visible[i] = vis;
      const b = this.bb[i];
      if (!g) {
        b.show = false;
        return;
      }
      const glyph: Glyph = (s.sub && g.subs?.find((x) => x.id === s.sub)?.glyph) || g.glyph;
      b.image = glyphUrl(glyph, g.color);
      b.scale = g.id === 'starlink' ? 0.45 : 0.62;
      b.show = vis && !!this.positions && Number.isFinite(this.positions[i * 3]);
    });
  }

  private onGroupsChanged(prev: Record<string, boolean>) {
    const { enabledGroups } = getState();
    for (const g of GROUPS) if (enabledGroups[g.id] && !prev[g.id]) void this.ensureGroup(g.id);
    this.applyStyles();
    this.emit();
  }

  displayGroup(s: Sat): SatGroup {
    const { enabledGroups } = getState();
    return GROUP_BY_ID[s.groups.find((g) => enabledGroups[g]) ?? s.groups[0]];
  }

  isVisible(s: Sat) {
    return !!this.visible[s.idx];
  }

  // ─────────────────────────────── propagation ──────────────────────────────

  now(): Date {
    return Cesium.JulianDate.toDate(this.viewer!.clock.currentTime);
  }

  private maybeTick() {
    if (!this.worker || this.pending || !this.sats.length) return;
    const t = performance.now();
    const animating = this.viewer!.clock.shouldAnimate;
    if (!this.forceTick && (!animating || t - this.lastTick < 100)) return;
    this.pending = true;
    this.forceTick = false;
    this.lastTick = t;
    this.worker.postMessage({ type: 'tick', time: this.now().getTime(), seq: ++this.seq });
  }

  private onWorker(m: { type: string; buf?: Float64Array; time?: number; n?: number }) {
    if (m.type === 'loaded') {
      this.forceTick = true;
      return;
    }
    if (m.type !== 'positions' || !m.buf) return;
    this.pending = false;
    if (m.buf.length !== this.sats.length * 3) {
      this.forceTick = true;
      return;
    }
    const first = !this.positions;
    this.positions = m.buf;
    this.positionsTime = m.time!;
    const buf = m.buf;
    for (let i = 0; i < this.bb.length; i++) {
      const x = buf[i * 3];
      const b = this.bb[i];
      if (!Number.isFinite(x)) {
        b.show = false;
        continue;
      }
      if (!this.visible[i]) continue;
      scratch.x = x;
      scratch.y = buf[i * 3 + 1];
      scratch.z = buf[i * 3 + 2];
      b.position = scratch;
      b.show = true;
    }
    if (first) this.emit();
  }

  // ──────────────────────────────── selection ───────────────────────────────

  /** Main-thread state for the selected object (cached per frame time). */
  selectedState(time?: Cesium.JulianDate): StateVector | null {
    if (!this.selRec) return null;
    const date = time ? Cesium.JulianDate.toDate(time) : this.now();
    const t = date.getTime();
    if (t === this.selCache.t) return this.selCache.s;
    const s = stateAt(this.selRec, date, true);
    this.selCache = { t, s };
    return s;
  }

  telemetry(): Telemetry | null {
    if (!this.selSat) return null;
    const state = this.selectedState();
    return { sat: this.selSat, state, summary: summarize(this.selSat.omm), footprintKm: state ? footprintRadiusKm(state.altKm) : 0 };
  }

  get selectedSat() {
    return this.selSat;
  }

  get selectedRec() {
    return this.selRec;
  }

  select(norad: number | null, opts: { follow?: boolean } = {}) {
    this.clearSelection();
    const sat = norad == null ? undefined : this.byNorad.get(norad);
    if (!sat) {
      getState().set({ selected: null, follow: false });
      this.emit();
      return;
    }
    this.selSat = sat;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.selRec = json2satrec(sat.omm as any);
    } catch {
      this.selRec = null;
    }
    this.selCache.t = Number.NaN;
    const follow = opts.follow ?? getState().follow;
    getState().set({ selected: sat.norad, follow });
    this.buildSelectionVisuals();
    this.applyFollow();
    this.emit();
  }

  private clearSelection() {
    const v = this.viewer;
    if (!v) return;
    v.trackedEntity = undefined;
    for (const e of this.selEntities) v.entities.remove(e);
    this.selEntities = [];
    this.target = null;
    window.clearInterval(this.orbitTimer);
    this.selSat = null;
    this.selRec = null;
    if (this.modelUrl) URL.revokeObjectURL(this.modelUrl);
    this.modelUrl = null;
  }

  private refreshSelectionVisuals() {
    if (!this.selSat) return;
    const follow = getState().follow;
    for (const e of this.selEntities) this.viewer!.entities.remove(e);
    this.selEntities = [];
    window.clearInterval(this.orbitTimer);
    this.buildSelectionVisuals();
    if (follow) this.applyFollow();
  }

  private buildSelectionVisuals() {
    const v = this.viewer!;
    const sat = this.selSat!;
    const color = Cesium.Color.fromCssColorString(this.displayGroup(sat).color);
    const { showOrbit, showModel } = getState();
    const posProp = new Cesium.CallbackPositionProperty((time) => {
      const s = this.selectedState(time);
      return s ? new Cesium.Cartesian3(s.x, s.y, s.z) : undefined;
    }, false);
    const orientation = new Cesium.CallbackProperty((time) => {
      const s = this.selectedState(time);
      if (!s || !time) return undefined;
      const later = this.selRec ? stateAt(this.selRec, new Date(Cesium.JulianDate.toDate(time).getTime() + 1000)) : null;
      if (!later) return undefined;
      const pos = new Cesium.Cartesian3(s.x, s.y, s.z);
      const vel = new Cesium.Cartesian3(later.x - s.x, later.y - s.y, later.z - s.z);
      const m = Cesium.Transforms.rotationMatrixFromPositionVelocity(pos, vel);
      return Cesium.Quaternion.fromRotationMatrix(m);
    }, false);

    const summary = summarize(sat.omm);
    const range = Math.max(summary.perigeeKm, 300) * 1000;
    this.target = v.entities.add({
      id: 'sel-target',
      position: posProp,
      orientation: orientation as unknown as Cesium.Property,
      billboard: {
        image: reticleUrl(color.toCssColorString()),
        scale: 0.55,
        disableDepthTestDistance: 0,
      },
      label: {
        text: sat.name,
        font: '600 13px "Share Tech Mono", monospace',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('#05010a'),
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -34),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#120a22').withAlpha(0.75),
        backgroundPadding: new Cesium.Cartesian2(8, 5),
      },
      viewFrom: new Cesium.Cartesian3(-range * 0.9, -range * 0.9, range * 0.7),
    });
    this.selEntities.push(this.target);

    if (showModel) void this.attachModel(sat);

    // Nadir line + ground footprint.
    this.selEntities.push(
      v.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty((time) => {
            const s = this.selectedState(time);
            if (!s) return undefined;
            return [new Cesium.Cartesian3(s.x, s.y, s.z), Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 0)];
          }, false),
          width: 1.5,
          arcType: Cesium.ArcType.NONE,
          material: new Cesium.PolylineDashMaterialProperty({ color: color.withAlpha(0.8), dashLength: 12 }),
        },
      }),
      v.entities.add({
        position: new Cesium.CallbackPositionProperty((time) => {
          const s = this.selectedState(time);
          return s ? Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 0) : undefined;
        }, false),
        ellipse: {
          semiMajorAxis: new Cesium.CallbackProperty((time) => footprintRadiusKm(this.selectedState(time)?.altKm ?? 0) * 1000 + 1, false),
          semiMinorAxis: new Cesium.CallbackProperty((time) => footprintRadiusKm(this.selectedState(time)?.altKm ?? 0) * 1000, false),
          material: color.withAlpha(0.1),
          outline: true,
          outlineColor: color.withAlpha(0.6),
          height: 0,
        },
      }),
    );

    if (showOrbit && this.selRec) {
      const rec = this.selRec;
      const ringPts = () => Cesium.Cartesian3.unpackArray(orbitRing(rec, this.now(), summary.periodMin));
      // Ground track: one revolution ahead (capped at a day for GEO).
      const trackPts = () => groundTrack(rec, this.now(), Math.min(summary.periodMin, 24 * 60)).map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 2000));
      const ring0 = ringPts();
      const track0 = trackPts();
      // Polylines need ≥ 2 points; a decayed / broken element set yields none.
      if (ring0.length >= 2 && track0.length >= 2) {
        const ring = v.entities.add({
          polyline: {
            positions: ring0,
            width: 3,
            arcType: Cesium.ArcType.NONE,
            material: new Cesium.PolylineGlowMaterialProperty({ color: color.withAlpha(0.9), glowPower: 0.25, taperPower: 1 }),
          },
        });
        const track = v.entities.add({
          polyline: {
            positions: track0,
            width: 1.5,
            arcType: Cesium.ArcType.GEODESIC,
            material: new Cesium.PolylineDashMaterialProperty({ color: color.withAlpha(0.55), dashLength: 18 }),
          },
        });
        this.selEntities.push(ring, track);
        this.orbitTimer = window.setInterval(() => {
          if (this.selRec !== rec) return;
          const r = ringPts();
          const t = trackPts();
          if (r.length >= 2) ring.polyline!.positions = new Cesium.ConstantProperty(r);
          if (t.length >= 2) track.polyline!.positions = new Cesium.ConstantProperty(t);
        }, 4000);
      }
    }
  }

  private async attachModel(sat: Sat) {
    try {
      const { buildGlbUrl } = await import('../inspector/export');
      const url = await buildGlbUrl(sat.kind, this.displayGroup(sat).color);
      if (this.selSat !== sat || !this.target) return URL.revokeObjectURL(url);
      this.modelUrl = url;
      this.target.model = new Cesium.ModelGraphics({
        uri: url,
        minimumPixelSize: 84,
        maximumScale: 40_000,
        silhouetteColor: Cesium.Color.fromCssColorString(this.displayGroup(sat).color),
        silhouetteSize: 1.5,
        lightColor: new Cesium.Color(2.2, 2.0, 2.4, 1),
      });
    } catch (e) {
      console.warn('model build failed', e);
    }
  }

  private applyFollow() {
    const v = this.viewer;
    if (!v) return;
    const { follow } = getState();
    if (follow && this.target) {
      v.trackedEntity = this.target;
    } else if (v.trackedEntity) {
      v.trackedEntity = undefined;
    }
  }

  // ─────────────────────────────── camera / time ────────────────────────────

  flyHome(duration = 2) {
    const { lon, lat, heightM } = SITE.home;
    const v = this.viewer!;
    v.trackedEntity = undefined;
    getState().set({ follow: false });
    v.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, heightM), duration });
  }

  zoomBy(factor: number) {
    const cam = this.viewer!.camera;
    const h = this.viewer!.trackedEntity ? Cesium.Cartesian3.magnitude(cam.position) : cam.positionCartographic.height;
    if (factor > 1) cam.zoomOut(h * (factor - 1));
    else cam.zoomIn(h * (1 - factor));
  }

  goLive() {
    const v = this.viewer!;
    v.clock.currentTime = Cesium.JulianDate.now();
    getState().set({ multiplier: 1, paused: false });
    this.applyClock();
    this.forceTick = true;
  }

  private applyClock() {
    const v = this.viewer!;
    const { multiplier, paused } = getState();
    v.clock.multiplier = multiplier;
    v.clock.shouldAnimate = !paused;
    this.forceTick = true;
  }

  /** Seconds between simulation time and wall-clock time. */
  offsetSeconds(): number {
    return (this.now().getTime() - Date.now()) / 1000;
  }

  // ───────────────────────────────── input ──────────────────────────────────

  private setupInput() {
    const v = this.viewer!;
    const handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas);
    let lastPick = 0;
    handler.setInputAction((m: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const now = performance.now();
      if (now - lastPick < 60) return;
      lastPick = now;
      const sat = this.pickSat(m.endPosition);
      const cur = getState().hover;
      if (sat) getState().set({ hover: { norad: sat.norad, x: m.endPosition.x, y: m.endPosition.y } });
      else if (cur) getState().set({ hover: null });
      v.scene.canvas.style.cursor = sat ? 'pointer' : getState().probeMode ? 'crosshair' : '';
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((c: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const sat = this.pickSat(c.position);
      if (sat) {
        this.select(sat.norad);
        getState().set({ drawer: 'target' });
        return;
      }
      if (getState().probeMode) {
        const ll = this.pickLatLon(c.position);
        if (ll) window.dispatchEvent(new CustomEvent('neon:probe', { detail: ll }));
        return;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((c: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const sat = this.pickSat(c.position);
      if (sat) {
        this.select(sat.norad);
        getState().set({ inspectorOpen: true });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  private pickSat(pos: Cesium.Cartesian2): Sat | null {
    const picked = this.viewer!.scene.pick(pos, 6, 6);
    const id = picked?.id;
    if (id && typeof id === 'object' && 'norad' in id) return this.byNorad.get((id as { norad: number }).norad) ?? null;
    if (picked?.id === this.target && this.selSat) return this.selSat;
    return null;
  }

  pickLatLon(pos: Cesium.Cartesian2): { lat: number; lon: number } | null {
    const v = this.viewer!;
    const cart = v.camera.pickEllipsoid(pos, v.scene.globe.ellipsoid);
    if (!cart) return null;
    const c = Cesium.Cartographic.fromCartesian(cart);
    return { lat: Cesium.Math.toDegrees(c.latitude), lon: Cesium.Math.toDegrees(c.longitude) };
  }

  setProbeMarker(ll: { lat: number; lon: number } | null) {
    const v = this.viewer!;
    if (this.probeEntity) v.entities.remove(this.probeEntity);
    this.probeEntity = null;
    if (!ll) return;
    this.probeEntity = v.entities.add({
      position: Cesium.Cartesian3.fromDegrees(ll.lon, ll.lat),
      point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#39ff88'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      ellipse: { semiMajorAxis: 60_000, semiMinorAxis: 60_000, material: Cesium.Color.fromCssColorString('#39ff88').withAlpha(0.15), outline: true, outlineColor: Cesium.Color.fromCssColorString('#39ff88'), height: 0 },
    });
  }

  /** Current camera view as a lon/lat box (null when looking past the limb). */
  viewRectangle(): { west: number; south: number; east: number; north: number } | null {
    const r = this.viewer!.camera.computeViewRectangle();
    if (!r) return null;
    const d = Cesium.Math.toDegrees;
    return { west: d(r.west), south: d(r.south), east: d(r.east), north: d(r.north) };
  }

  screenshot(): string {
    const v = this.viewer!;
    v.render();
    return v.scene.canvas.toDataURL('image/png');
  }

  // ─────────────────────────────── analytics ────────────────────────────────

  regimeCounts(): Record<Regime, number> {
    const out: Record<Regime, number> = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 };
    for (const s of this.sats) if (this.visible[s.idx]) out[summarize(s.omm).regime]++;
    return out;
  }

  visibleCount(): number {
    let n = 0;
    for (let i = 0; i < this.visible.length; i++) if (this.visible[i]) n++;
    return n;
  }

  /** Visible objects above the observer's horizon (≥ minEl degrees), from the latest positions. */
  overhead(minEl = 10): OverheadRow[] {
    const buf = this.positions;
    if (!buf) return [];
    const { lat, lon } = SITE.observer;
    const o = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(o, new Cesium.Cartesian3());
    const east = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, up, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const north = Cesium.Cartesian3.cross(up, east, new Cesium.Cartesian3());
    const rows: OverheadRow[] = [];
    for (const s of this.sats) {
      if (!this.visible[s.idx]) continue;
      const i = s.idx * 3;
      const dx = buf[i] - o.x;
      const dy = buf[i + 1] - o.y;
      const dz = buf[i + 2] - o.z;
      if (!Number.isFinite(dx)) continue;
      const r = Math.hypot(dx, dy, dz);
      const u = (dx * up.x + dy * up.y + dz * up.z) / r;
      const el = (Math.asin(u) * 180) / Math.PI;
      if (el < minEl) continue;
      const e = dx * east.x + dy * east.y + dz * east.z;
      const n = dx * north.x + dy * north.y + dz * north.z;
      rows.push({ sat: s, elevation: el, azimuth: ((Math.atan2(e, n) * 180) / Math.PI + 360) % 360, rangeKm: r / 1000 });
    }
    return rows.sort((a, b) => b.elevation - a.elevation);
  }

  search(q: string, limit = 12): Sat[] {
    const t = q.trim().toUpperCase();
    if (!t) return [];
    const out: Sat[] = [];
    for (const s of this.sats) {
      if (s.name.includes(t) || String(s.norad) === t || s.intlDes === t) out.push(s);
      if (out.length >= limit) break;
    }
    return out;
  }

  /** Earth radius helper for UI. */
  readonly earthRadiusKm = R_EARTH;

  // ─────────────────────────────── subscription ─────────────────────────────

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }
}

export const engine = new Engine();
// Handy for debugging in the console (and used by the e2e tests).
(window as unknown as { neonOrbit: Engine }).neonOrbit = engine;
