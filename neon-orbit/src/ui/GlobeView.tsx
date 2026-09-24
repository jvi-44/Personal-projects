import { useEffect, useRef } from 'react';
import { engine } from '../globe/engine';
import { useStore } from '../state/store';

export function GlobeView({ credits }: { credits: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !credits.current) return;
    try {
      engine.mount(ref.current, credits.current);
    } catch (e) {
      useStore.getState().notify(`WebGL failed to start: ${e instanceof Error ? e.message : e}`, 'error');
    }
    const id = window.setTimeout(() => useStore.getState().set({ booted: true }), 400);
    return () => window.clearTimeout(id);
  }, [credits]);
  return <div className="globe" ref={ref} />;
}
