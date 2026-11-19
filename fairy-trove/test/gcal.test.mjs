// Run: node --test test/*.test.mjs   (from fairy-trove/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../src/planner.js');
const C = require('../src/gcal.js');

const cfg = Object.assign(P.defaultConfig(), { gcal: { auto: true, calendarId: 'primary', routines: true } });
cfg.places.push({ id: 'gbtb', name: 'Starbucks GBTB', travel: 40, mode: 'MRT' });
function day(blocks) {
  return { date: '2026-11-19', tasks: [], admin: [], fixed: [], plan: { blocks } };
}
const B = (start, end, title, kind, extra) => Object.assign({ id: 'b' + start, start, end, title, kind, place: 'gbtb' }, extra || {});
const sample = () => day([
  B('04:30', '06:30', 'Morning', 'routine', { ref: 'r_morning', place: 'home' }),
  B('06:50', '07:30', 'Travel to Starbucks GBTB', 'travel'),
  B('07:30', '08:30', 'UC PIQ 1', 'primary', { ref: 't_piq' }),
  B('08:30', '08:40', 'Break', 'break'),
  B('10:00', '11:00', 'UC PIQ 2', 'primary', { ref: 't_piq' }),
  B('13:45', '13:50', 'Midday check-in', 'checkin', { ref: 'check_midday' }),
  B('17:00', '18:00', 'Essay mentor', 'fixed', { ref: 'f_crimson', place: 'home' }),
  B('23:30', '00:30', 'Late study', 'secondary', { ref: 't_late', place: 'home' }),
]);

test('activities become events; breaks and check-ins stay in the Trove', () => {
  const w = C.wanted(sample(), cfg);
  const titles = Object.values(w).map((x) => x.ev.summary);
  assert.deepEqual(titles, ['Morning', 'Travel to Starbucks GBTB', 'UC PIQ 1', 'UC PIQ 2', 'Essay mentor', 'Late study']);
  assert.deepEqual(Object.keys(w), ['ref:r_morning#1', 'travel:gbtb#1', 'ref:t_piq#1', 'ref:t_piq#2', 'ref:f_crimson#1', 'ref:t_late#1']);
  const piq = w['ref:t_piq#1'].ev;
  assert.equal(piq.startTime, '2026-11-19T07:30:00');
  assert.equal(piq.location, 'Starbucks GBTB');
  assert.equal(piq.colorId, '7');
  assert.ok(piq.description.endsWith('From The Fairy Trove'));
  assert.equal(w['ref:t_late#1'].ev.endTime, '2026-11-20T00:30:00', 'a block past midnight ends the next day');
  const off = Object.assign({}, cfg, { gcal: { routines: false } });
  assert.ok(!Object.values(C.wanted(sample(), off)).some((x) => x.ev.summary === 'Morning'), 'routines can be left out');
});

test('events already in the calendar are linked, not copied', () => {
  const existing = [
    { id: 'morning_20261118T203000Z', summary: 'Morning', start: { dateTime: '2026-11-19T04:30:00+08:00' }, end: { dateTime: '2026-11-19T06:30:00+08:00' }, organizer: { self: true }, recurringEventId: 'morning' },
    { id: 'trip', summary: 'Travel to Starbucks', start: { dateTime: '2026-11-19T06:50:00+08:00' }, end: { dateTime: '2026-11-19T07:30:00+08:00' }, organizer: { self: true } },
    { id: 'crimson', summary: 'Essay mentor', start: { dateTime: '2026-11-19T17:00:00+08:00' }, end: { dateTime: '2026-11-19T18:00:00+08:00' }, organizer: { self: false } },
    { id: 'other', summary: 'Dentist', start: { dateTime: '2026-11-19T07:30:00+08:00' }, end: { dateTime: '2026-11-19T08:30:00+08:00' }, organizer: { self: true } },
  ];
  const st = { cal: 'primary', events: {} };
  const want = C.wanted(sample(), cfg);
  const linked = C.linkExisting(st, want, existing, '2026-11-19');
  assert.deepEqual(linked.sort(), ['ref:f_crimson#1', 'ref:r_morning#1', 'travel:gbtb#1']);
  assert.equal(st.events['ref:f_crimson#1'].ro, true, 'an invite is read-only');
  assert.ok(!Object.values(st.events).some((e) => e.id === 'other'), 'an unrelated event is left alone');
  const ops = C.planOps(st, want);
  const by = (op) => ops.filter((o) => o.op === op).map((o) => o.key);
  assert.deepEqual(by('create').sort(), ['ref:t_late#1', 'ref:t_piq#1', 'ref:t_piq#2']);
  assert.deepEqual(by('update'), [], 'a linked event at the right time keeps its own title');
  assert.deepEqual(by('delete'), []);
  assert.ok(!ops.some((o) => o.key === 'ref:r_morning#1'), 'the exact match needs no call');
});

test('a synced day needs no calls; a moved block is one update; a removed block is deleted only if the Trove made it', () => {
  const d = sample();
  const st = { cal: 'primary', events: {} };
  let want = C.wanted(d, cfg);
  C.linkExisting(st, want, [{ id: 'm', summary: 'Morning', start: { dateTime: '2026-11-19T04:30:00+08:00' }, end: { dateTime: '2026-11-19T06:30:00+08:00' }, organizer: { self: true } }], d.date);
  C.planOps(st, want).forEach((op) => { if (op.op === 'create') st.events[op.key] = { id: 'new_' + op.key, h: op.h }; else if (op.op === 'update' || op.op === 'mark') st.events[op.key].h = op.h; });
  assert.deepEqual(C.planOps(st, want), [], 'nothing left to do');
  d.plan.blocks.find((b) => b.title === 'UC PIQ 2').start = '10:30';
  d.plan.blocks.find((b) => b.title === 'UC PIQ 2').end = '11:30';
  want = C.wanted(d, cfg);
  let ops = C.planOps(st, want);
  assert.equal(ops.length, 1); assert.equal(ops[0].op, 'update'); assert.equal(ops[0].key, 'ref:t_piq#2');
  assert.equal(C.updateInput(ops[0], 'primary').startTime, '2026-11-19T10:30:00');
  assert.equal(C.updateInput(ops[0], 'primary').summary, 'UC PIQ 2', 'events the Trove made follow the title too');
  st.events[ops[0].key].h = ops[0].h;
  d.plan.blocks = d.plan.blocks.filter((b) => b.title !== 'UC PIQ 2' && b.title !== 'Morning');
  ops = C.planOps(st, C.wanted(d, cfg));
  assert.deepEqual(ops.map((o) => o.op + ' ' + o.key).sort(), ['delete ref:t_piq#2', 'unlink ref:r_morning#1']);
});

test('a re-plan that keeps the same tasks reuses the same events', () => {
  const a = C.keyed([B('07:00', '08:00', 'Essay (1/2)', 'primary', { ref: 't1' }), B('09:00', '10:00', 'Essay (2/2)', 'primary', { ref: 't1' }), B('08:00', '08:30', 'Travel to School (MRT)', 'travel')]).map((k) => k.key);
  const b = C.keyed([B('11:00', '12:30', 'Essay (1/2)', 'primary', { ref: 't1' }), B('13:00', '13:30', 'Essay (2/2)', 'primary', { ref: 't1' }), B('10:00', '10:30', 'Travel to Starbucks GBTB (MRT)', 'travel')]).map((k) => k.key);
  assert.deepEqual(a.sort(), b.sort());
});

test('a linked event that moves gets new times and nothing else', () => {
  const d = sample();
  const st = { cal: 'primary', events: {} };
  C.linkExisting(st, C.wanted(d, cfg), [{ id: 'm', summary: 'Morning', start: { dateTime: '2026-11-19T04:30:00+08:00' }, end: { dateTime: '2026-11-19T06:30:00+08:00' }, organizer: { self: true } }], d.date);
  d.plan.blocks.find((b) => b.title === 'Morning').title = 'Morning routine';
  assert.deepEqual(C.planOps(st, C.wanted(d, cfg)).filter((o) => o.key === 'ref:r_morning#1'), [], 'a new name alone changes nothing');
  d.plan.blocks.find((b) => b.ref === 'r_morning').start = '05:00';
  const op = C.planOps(st, C.wanted(d, cfg)).find((o) => o.key === 'ref:r_morning#1');
  assert.deepEqual(Object.keys(C.updateInput(op, 'primary')).sort(), ['calendarId', 'endTime', 'eventId', 'notificationLevel', 'startTime']);
});

test('an invite follows the plan without being edited', () => {
  const st = { cal: 'primary', events: { 'ref:f_crimson#1': { id: 'crimson', linked: true, ro: true, h: 'old' } } };
  const want = { 'ref:f_crimson#1': C.wanted(sample(), cfg)['ref:f_crimson#1'] };
  const ops = C.planOps(st, want);
  assert.deepEqual(ops.map((o) => o.op), ['mark']);
  delete want['ref:f_crimson#1'];
  assert.deepEqual(C.planOps(st, want).map((o) => o.op), ['unlink'], 'and is never deleted');
});

test('event ids are read from the shapes the connector may return', () => {
  assert.equal(C.eventIdOf({ id: 'abc123' }), 'abc123');
  assert.equal(C.eventIdOf({ event: { id: 'xyz789' } }), 'xyz789');
  assert.equal(C.eventIdOf('{"id":"from_json"}'), 'from_json');
  assert.equal(C.eventIdOf('Created event id: plain_text_id'), 'plain_text_id');
  assert.equal(C.eventIdOf(null), null);
});
