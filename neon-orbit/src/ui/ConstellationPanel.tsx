import { useMemo, useState } from 'react';
import { SITE } from '../config/site';
import { engine } from '../globe/engine';
import { FEATURED, GROUP_BY_ID, GROUPS, type FeaturedTarget } from '../sat/groups';
import { useStore } from '../state/store';
import { Glyph } from './Glyph';
import { fmt, useEngineVersion, useTicker } from './hooks';

async function goToFeatured(f: FeaturedTarget) {
  const st = useStore.getState();
  if (!st.enabledGroups[f.group]) st.set({ enabledGroups: { ...st.enabledGroups, [f.group]: true } });
  await engine.ensureGroup(f.group);
  const sat = f.norad ? engine.byNorad.get(f.norad) : engine.sats.find((s) => f.name?.test(s.name));
  if (!sat) {
    st.notify(`${f.label} isn't in the current CelesTrak data for "${GROUP_BY_ID[f.group].label}".`, 'warn');
    return;
  }
  engine.select(sat.norad, { follow: true });
  st.set({ drawer: 'target' });
}

export function ConstellationPanel() {
  const enabled = useStore((s) => s.enabledGroups);
  const subs = useStore((s) => s.enabledSubs);
  const status = useStore((s) => s.groupStatus);
  const set = useStore((s) => s.set);
  const [q, setQ] = useState('');
  const version = useEngineVersion();
  const results = useMemo(() => engine.search(q), [q, version]);
  const max = Math.max(1, ...GROUPS.map((g) => status[g.id].count));

  return (
    <section className="panel" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }} aria-label="Constellations">
      <div className="panel-head">
        <span className="idx">01</span> Constellations
      </div>
      <div className="panel-body scroll" style={{ flex: 1, minHeight: 0 }}>
        <input className="input" placeholder="Search name / NORAD id…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search satellites" />
        {q && (
          <div className="results scroll">
            {results.length === 0 && <div className="hint" style={{ padding: 8 }}>No match among loaded objects. Enable more groups to widen the search.</div>}
            {results.map((s) => {
              const g = engine.displayGroup(s);
              return (
                <button
                  key={s.norad}
                  onClick={() => {
                    engine.select(s.norad, { follow: true });
                    set({ drawer: 'target' });
                    setQ('');
                  }}
                >
                  <Glyph glyph={g.glyph} color={g.color} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span className="hint">#{s.norad}</span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          {GROUPS.map((g) => {
            const st = status[g.id];
            const on = enabled[g.id];
            return (
              <div key={g.id}>
                <div className="group-row" title={g.blurb}>
                  <Glyph glyph={g.glyph} color={g.color} size={13} />
                  <div>
                    <div className="name">{g.label}</div>
                    <div className="bar" aria-hidden>
                      <i style={{ width: `${(st.count / max) * 100}%`, background: g.color, opacity: on ? 1 : 0.35 }} />
                    </div>
                  </div>
                  <div className="count">
                    {st.state === 'loading' && <span className="led busy" title="loading" />}
                    {st.state === 'error' && <span className="led bad" title={st.error} />}
                    {st.state !== 'loading' && st.count > 0 && fmt.int(st.count)}
                    {st.state === 'idle' && <span className="hint">—</span>}
                  </div>
                  <button className="switch" role="switch" aria-checked={on} aria-label={`Show ${g.label}`} onClick={() => set({ enabledGroups: { ...enabled, [g.id]: !on } })} />
                </div>
                {g.subs && on && (
                  <div className="sub-row">
                    {g.subs.map((s) => (
                      <button key={s.id} aria-pressed={subs[s.id] !== false} onClick={() => set({ enabledSubs: { ...subs, [s.id]: subs[s.id] === false } })}>
                        <Glyph glyph={s.glyph} color={g.color} size={10} /> {s.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="label" style={{ margin: '14px 0 6px' }}>
          Quick targets
        </div>
        <div className="featured">
          {FEATURED.map((f) => (
            <button key={f.label} onClick={() => void goToFeatured(f)}>
              <b>{f.label}</b>
              <small>{f.tag}</small>
            </button>
          ))}
        </div>
        <Overhead />
        <DataAge />
      </div>
    </section>
  );
}

function Overhead() {
  useTicker(2000);
  const rows = engine.overhead(10);
  const set = useStore((s) => s.set);
  return (
    <div style={{ marginTop: 14 }}>
      <div className="label" style={{ marginBottom: 6 }}>
        Above {SITE.observer.label} now · ≥10° elevation
      </div>
      <div className="row" style={{ alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-retro)', fontSize: 34, lineHeight: 1 }}>{rows.length}</span>
        <span className="hint">visible objects in the sky over {SITE.observer.label}</span>
      </div>
      {rows.slice(0, 5).map((r) => {
        const g = engine.displayGroup(r.sat);
        return (
          <button
            key={r.sat.norad}
            className="layer-item"
            style={{ gridTemplateColumns: '14px 1fr auto', alignItems: 'center', padding: '5px 0' }}
            onClick={() => {
              engine.select(r.sat.norad, { follow: true });
              set({ drawer: 'target' });
            }}
          >
            <Glyph glyph={g.glyph} color={g.color} size={10} />
            <span className="ln" style={{ fontSize: 12 }}>
              {r.sat.name}
            </span>
            <span className="hint">
              el {r.elevation.toFixed(0)}° · az {r.azimuth.toFixed(0)}°
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DataAge() {
  const status = useStore((s) => s.groupStatus);
  const times = Object.values(status)
    .map((s) => s.fetchedAt)
    .filter((t): t is number => !!t);
  if (!times.length) return null;
  const oldest = Math.min(...times);
  return (
    <p className="hint" style={{ marginTop: 14 }}>
      Orbital elements: CelesTrak GP data, fetched {fmt.age(Date.now() - oldest)} ago (refreshed every 2 h). Positions are propagated with SGP4 in your browser.
    </p>
  );
}
