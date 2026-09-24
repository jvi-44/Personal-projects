/// <reference lib="webworker" />
import { eciToEcf, gstime, json2satrec, propagate, type SatRec } from 'satellite.js';
import type { OMM } from './types';

/**
 * Bulk SGP4 propagation off the main thread.
 *  in:  {type:'load', omms} | {type:'tick', time, seq}
 *  out: {type:'positions', seq, time, buf: Float64Array [x,y,z]*n in ECEF metres (NaN = failed)}
 */
let recs: (SatRec | null)[] = [];

self.onmessage = (e: MessageEvent) => {
  const m = e.data;
  if (m.type === 'load') {
    recs = (m.omms as OMM[]).map((o) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return json2satrec(o as any);
      } catch {
        return null;
      }
    });
    self.postMessage({ type: 'loaded', n: recs.length });
    return;
  }
  if (m.type === 'tick') {
    const date = new Date(m.time as number);
    const gmst = gstime(date);
    const buf = new Float64Array(recs.length * 3);
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const pv = r ? propagate(r, date) : null;
      if (!pv || !pv.position || !Number.isFinite(pv.position.x)) {
        buf[i * 3] = buf[i * 3 + 1] = buf[i * 3 + 2] = Number.NaN;
        continue;
      }
      const ecf = eciToEcf(pv.position, gmst);
      buf[i * 3] = ecf.x * 1000;
      buf[i * 3 + 1] = ecf.y * 1000;
      buf[i * 3 + 2] = ecf.z * 1000;
    }
    (self as unknown as Worker).postMessage({ type: 'positions', seq: m.seq, time: m.time, buf }, [buf.buffer]);
  }
};
