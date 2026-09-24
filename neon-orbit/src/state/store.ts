import { create } from 'zustand';
import { GROUPS } from '../sat/groups';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface GroupStatus {
  state: LoadState;
  count: number;
  error?: string;
  fetchedAt?: number;
  source?: string;
}

export type OverlaySource = 'gee' | 'gibs';

export interface Overlay {
  key: string;
  source: OverlaySource;
  layerId: string;
  opacity: number;
  /** GEE window (YYYY-MM-DD) or GIBS date in `end`. */
  start: string;
  end: string;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  /** The window the server actually used (may slide back for lagging products). */
  effStart?: string;
  effEnd?: string;
  shifted?: boolean;
  urlFormat?: string;
}

export type BaseMapId = 'neon' | 'satellite' | 'bluemarble' | 'offline' | 'ion' | 'google3d';

export type EEStatus = { configured: boolean; project?: string } | 'unavailable' | null;

export interface ProbeResult {
  lat: number;
  lon: number;
  rows: { overlayKey: string; layerId: string; state: 'loading' | 'ready' | 'error'; values?: Record<string, number | null>; error?: string; series?: { t: string; v: number | null }[] }[];
}

interface UIState {
  booted: boolean;
  enabledGroups: Record<string, boolean>;
  enabledSubs: Record<string, boolean>;
  groupStatus: Record<string, GroupStatus>;
  /** NORAD id of the selected object. */
  selected: number | null;
  hover: { norad: number; x: number; y: number } | null;
  follow: boolean;
  showOrbit: boolean;
  showModel: boolean;
  inspectorOpen: boolean;
  baseMap: BaseMapId;
  holoGrid: boolean;
  labels: boolean;
  lighting: boolean;
  overlays: Overlay[];
  probeMode: boolean;
  probe: ProbeResult | null;
  multiplier: number;
  paused: boolean;
  eeStatus: EEStatus;
  /** Mobile drawer. */
  drawer: 'none' | 'sats' | 'data' | 'target' | 'view';
  aboutOpen: boolean;
  toast: { id: number; text: string; tone: 'info' | 'warn' | 'error' } | null;
  set: (patch: Partial<UIState>) => void;
  notify: (text: string, tone?: 'info' | 'warn' | 'error') => void;
}

function initialBaseMap(): BaseMapId {
  try {
    const q = new URLSearchParams(location.search).get('base');
    if (q) return q as BaseMapId;
    return (localStorage.getItem('neon-orbit:base') as BaseMapId) || 'neon';
  } catch {
    return 'neon';
  }
}

export const useStore = create<UIState>((set) => ({
  booted: false,
  enabledGroups: Object.fromEntries(GROUPS.map((g) => [g.id, g.defaultOn])),
  enabledSubs: Object.fromEntries(GROUPS.flatMap((g) => g.subs ?? []).map((s) => [s.id, true])),
  groupStatus: Object.fromEntries(GROUPS.map((g) => [g.id, { state: 'idle', count: 0 }])),
  selected: null,
  hover: null,
  follow: false,
  showOrbit: true,
  showModel: true,
  inspectorOpen: false,
  baseMap: initialBaseMap(),
  holoGrid: true,
  labels: false,
  lighting: true,
  overlays: [],
  probeMode: false,
  probe: null,
  multiplier: 1,
  paused: false,
  eeStatus: null,
  drawer: 'none',
  aboutOpen: false,
  toast: null,
  set: (patch) => set(patch),
  notify: (text, tone = 'info') => set({ toast: { id: Date.now(), text, tone } }),
}));

export const getState = useStore.getState;
