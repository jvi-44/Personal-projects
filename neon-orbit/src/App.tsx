import { lazy, Suspense, useEffect, useRef } from 'react';
import { eeStatus } from './data/eeApi';
import { useStore } from './state/store';
import { BottomBar } from './ui/BottomBar';
import { ConstellationPanel } from './ui/ConstellationPanel';
import { GlobeView } from './ui/GlobeView';
import { AboutModal, BootScreen, HoverTip, MapControls, Toast } from './ui/Overlays';
import { RightPanel } from './ui/RightPanel';
import { TopBar } from './ui/TopBar';

const Inspector = lazy(() => import('./inspector/Inspector'));

function MobileTabs() {
  const drawer = useStore((s) => s.drawer);
  const set = useStore((s) => s.set);
  const tabs: [typeof drawer, string][] = [
    ['sats', 'Sats'],
    ['target', 'Target'],
    ['data', 'Data'],
    ['view', 'View'],
  ];
  return (
    <nav className="mobile-tabs" aria-label="Panels">
      {tabs.map(([id, label]) => (
        <button key={id} aria-pressed={drawer === id} onClick={() => set({ drawer: drawer === id ? 'none' : id })}>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const credits = useRef<HTMLDivElement>(null);
  const inspectorOpen = useStore((s) => s.inspectorOpen);
  const drawer = useStore((s) => s.drawer);
  const set = useStore((s) => s.set);

  useEffect(() => {
    void eeStatus().then((s) => set({ eeStatus: s }));
  }, [set]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') set({ inspectorOpen: false, aboutOpen: false, probeMode: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [set]);

  return (
    <>
      <GlobeView credits={credits} />
      <TopBar />
      <aside className={`left ${drawer === 'sats' ? 'open' : ''}`} aria-label="Satellites">
        <ConstellationPanel />
      </aside>
      <RightPanel />
      <MapControls />
      <BottomBar credits={credits} />
      <MobileTabs />
      <HoverTip />
      <Toast />
      <AboutModal />
      {inspectorOpen && (
        <Suspense fallback={null}>
          <Inspector />
        </Suspense>
      )}
      <div className="crt" aria-hidden />
      <BootScreen />
    </>
  );
}
