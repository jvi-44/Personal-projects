import { useMemo } from 'react';
import { engine } from '../globe/engine';
import { profileFor } from '../sat/facts';
import { altitudeProfile } from '../sat/orbit';
import { useStore } from '../state/store';
import { LineChart } from './charts';
import { Glyph } from './Glyph';
import { fmt, useTicker } from './hooks';

export function TargetPanel() {
  useTicker(250);
  const follow = useStore((s) => s.follow);
  const set = useStore((s) => s.set);
  const t = engine.telemetry();
  const sat = t?.sat;
  const rec = engine.selectedRec;
  // Altitude over the next revolution — recomputed when the target changes or every ~minute.
  const minuteKey = Math.floor(Date.now() / 60_000);
  const profile = useMemo(
    () => (rec && t ? altitudeProfile(rec, engine.now(), t.summary.periodMin) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rec, sat?.norad, minuteKey],
  );

  if (!t || !sat) {
    return (
      <div className="empty">
        <div className="big">NO TARGET</div>
        <div>Click any satellite on the globe, search for one, or pick a quick target.</div>
        <div className="hint">Double-click a satellite to open its 3D inspector.</div>
      </div>
    );
  }
  const g = engine.displayGroup(sat);
  const s = t.state;
  const sum = t.summary;
  const prof = profileFor(sat);
  const epochAge = Date.now() - sum.epoch.getTime();

  return (
    <div>
      <div className="row" style={{ gap: 6, marginBottom: 6 }}>
        <Glyph glyph={g.glyph} color={g.color} size={12} />
        <span className="chip">{g.label}</span>
        <span className="chip">{sum.regime}</span>
        {s && <span className="chip">{s.sunlit > 0.5 ? '☀ sunlit' : '☾ eclipse'}</span>}
      </div>
      <div className="target-name">{sat.name}</div>
      <div className="hint">
        NORAD {sat.norad} · COSPAR {sat.intlDes}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn pink" onClick={() => set({ inspectorOpen: true })}>
          ◈ Inspect 3D
        </button>
        <button className={`btn ${follow ? 'on' : ''}`} onClick={() => set({ follow: !follow })} aria-pressed={follow}>
          {follow ? '◉ Following' : '○ Follow'}
        </button>
        <button className="btn ghost" onClick={() => engine.select(null)}>
          ✕ Clear
        </button>
      </div>

      {s ? (
        <div className="kv">
          <div>
            <div className="label">Latitude</div>
            <div className="value">{fmt.lat(s.lat)}</div>
          </div>
          <div>
            <div className="label">Longitude</div>
            <div className="value">{fmt.lon(s.lon)}</div>
          </div>
          <div>
            <div className="label">Altitude</div>
            <div className="value">
              {fmt.num(s.altKm, 1)}
              <small>km</small>
            </div>
          </div>
          <div>
            <div className="label">Speed</div>
            <div className="value">
              {fmt.num(s.speedKms, 2)}
              <small>km/s</small>
            </div>
          </div>
          <div>
            <div className="label">Period</div>
            <div className="value">{fmt.dur(sum.periodMin)}</div>
          </div>
          <div>
            <div className="label">Inclination</div>
            <div className="value">{fmt.num(sum.inclination, 2)}°</div>
          </div>
          <div>
            <div className="label">Perigee / apogee</div>
            <div className="value">
              {fmt.int(sum.perigeeKm)} / {fmt.int(sum.apogeeKm)}
              <small>km</small>
            </div>
          </div>
          <div>
            <div className="label">Footprint radius</div>
            <div className="value">
              {fmt.int(t.footprintKm)}
              <small>km</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="banner" style={{ marginTop: 12 }}>
          <b>Propagation failed.</b> These elements may be stale or the object may have re-entered.
        </div>
      )}

      {profile.length > 2 && (
        <>
          <div className="label" style={{ marginBottom: 4 }}>
            Altitude over the next orbit (km)
          </div>
          <LineChart
            points={profile.map((p) => ({ x: p.t, y: p.alt }))}
            color={g.color}
            marker={engine.now().getTime()}
            formatX={(x) => `${fmt.utc(new Date(x)).slice(0, 5)} UTC`}
            formatY={(y) => fmt.int(y)}
            ariaLabel={`Altitude of ${sat.name} over the next orbit`}
          />
        </>
      )}

      <div className="sep" />
      {prof ? (
        <>
          {prof.operator && (
            <div style={{ marginBottom: 6 }}>
              <span className="label">Operator</span>
              <div>{prof.operator}</div>
            </div>
          )}
          {prof.launched && (
            <div style={{ marginBottom: 6 }}>
              <span className="label">Launched</span>
              <div>{prof.launched}</div>
            </div>
          )}
          <div>
            <span className="label">Mission</span>
            <div>{prof.mission}</div>
          </div>
          {prof.notes && (
            <ul className="notes">
              {prof.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="hint">{g.blurb}</div>
      )}
      <p className="hint" style={{ marginTop: 12 }}>
        Element set epoch {sum.epoch.toISOString().slice(0, 16).replace('T', ' ')} UTC ({fmt.age(Math.abs(epochAge))} {epochAge >= 0 ? 'old' : 'ahead'}). SGP4 error typically grows by
        ~1–3 km per day away from the epoch.
      </p>
      <div className="row">
        <a className="btn ghost" href={`https://celestrak.org/NORAD/elements/gp.php?CATNR=${sat.norad}&FORMAT=TLE`} target="_blank" rel="noreferrer">
          Raw TLE ↗
        </a>
        <a className="btn ghost" href={`https://www.n2yo.com/satellite/?s=${sat.norad}`} target="_blank" rel="noreferrer">
          N2YO ↗
        </a>
        <a className="btn ghost" href={`https://www.heavens-above.com/orbit.aspx?satid=${sat.norad}`} target="_blank" rel="noreferrer">
          Heavens-Above ↗
        </a>
      </div>
    </div>
  );
}
