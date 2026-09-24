import { BASEMAPS } from '../globe/imagery';
import { useStore } from '../state/store';

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line-soft)', flexWrap: 'nowrap' }}>
      <div>
        <div>{label}</div>
        <div className="hint">{hint}</div>
      </div>
      <button className="switch" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} />
    </div>
  );
}

export function ViewPanel() {
  const s = useStore();
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>
        Base map
      </div>
      <div className="featured">
        {BASEMAPS.map((b) => (
          <button
            key={b.id}
            disabled={!!b.locked}
            aria-pressed={s.baseMap === b.id}
            onClick={() => s.set({ baseMap: b.id })}
            style={s.baseMap === b.id ? { borderColor: 'var(--green)', background: 'rgba(57,255,136,0.12)' } : b.locked ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            title={b.locked ? `Set ${b.locked} to enable` : b.note}
          >
            <b>{b.label}</b>
            <small>{b.locked ? 'needs key' : b.note.split(' ')[0]}</small>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Toggle label="Day / night + city lights" hint="Sun-lit hemisphere; VIIRS Black Marble on the night side" value={s.lighting} onChange={(v) => s.set({ lighting: v })} />
        <Toggle label="Holo grid" hint="Neon graticule overlay" value={s.holoGrid} onChange={(v) => s.set({ holoGrid: v })} />
        <Toggle label="Place labels" hint="CARTO dark labels" value={s.labels} onChange={(v) => s.set({ labels: v })} />
        <Toggle label="Orbit + ground track" hint="For the selected satellite" value={s.showOrbit} onChange={(v) => s.set({ showOrbit: v })} />
        <Toggle label="3D model on globe" hint="Procedural model flying with the target" value={s.showModel} onChange={(v) => s.set({ showModel: v })} />
      </div>
    </div>
  );
}
