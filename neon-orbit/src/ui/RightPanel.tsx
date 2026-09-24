import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { DataPanel } from './DataPanel';
import { TargetPanel } from './TargetPanel';
import { ViewPanel } from './ViewPanel';

type Tab = 'target' | 'data' | 'view';

export function RightPanel() {
  const drawer = useStore((s) => s.drawer);
  const selected = useStore((s) => s.selected);
  const [tab, setTab] = useState<Tab>('target');
  // Selecting a satellite brings the target tab forward; the mobile drawer can pick any tab.
  useEffect(() => {
    if (selected != null) setTab('target');
  }, [selected]);
  useEffect(() => {
    if (drawer === 'target' || drawer === 'data' || drawer === 'view') setTab(drawer);
  }, [drawer]);

  const open = drawer === 'target' || drawer === 'data' || drawer === 'view';
  return (
    <aside className={`right ${open ? 'open' : ''}`} aria-label="Details">
      <section className="panel">
        <div className="tabs" role="tablist">
          {(
            [
              ['target', '02 Target'],
              ['data', '03 Earth data'],
              ['view', '04 View'],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="panel-body scroll" style={{ flex: 1, minHeight: 0 }}>
          {tab === 'target' && <TargetPanel />}
          {tab === 'data' && <DataPanel />}
          {tab === 'view' && <ViewPanel />}
        </div>
      </section>
    </aside>
  );
}
