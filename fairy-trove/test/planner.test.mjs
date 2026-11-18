// Run: node --test test/   (from fairy-trove/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../src/planner.js');

const cfg = P.defaultConfig();
function sampleDay() {
  const day = P.emptyDay('2026-11-18', '2026-11-15', cfg);
  day.tasks = [
    { id: 't1', title: 'ESAT practice paper', tier: 'primary', est: 120 },
    { id: 't2', title: 'UK personal statement redraft', tier: 'primary', est: 90 },
    { id: 't3', title: 'STEMulate partner emails', tier: 'primary', est: 60 },
    { id: 't4', title: 'Chem flashcards', tier: 'secondary', est: 45 },
    { id: 't5', title: 'Watercolour practice', tier: 'secondary', est: 45 },
    { id: 't6', title: 'Book next astro meeting', tier: 'secondary', est: 30 },
  ];
  day.admin = [{ id: 'a1', title: 'Reply Ms Tan' }, { id: 'a2', title: 'Pay ISC fee', go: true }, { id: 'a3', title: 'Print forms' }];
  day.places = { am: 'cafe', pm: 'school', eve: 'home' };
  return day;
}
const m = P.toMin;
function assertSane(blocks, label) {
  const sorted = blocks.slice().sort((a, b) => m(a.start) - m(b.start));
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(m(sorted[i].start) >= m(sorted[i - 1].end), `${label}: ${sorted[i - 1].start}-${sorted[i - 1].end} ${sorted[i - 1].title} overlaps ${sorted[i].start} ${sorted[i].title}`);
  }
  for (const b of blocks) {
    assert.ok(P.minsOf(b) >= 5, `${label}: block too short ${b.start}-${b.end} ${b.title}`);
    assert.ok(P.KINDS[b.kind], `${label}: unknown kind ${b.kind}`);
  }
  // she is never somewhere she has not travelled to
  let here = 'home';
  for (const b of sorted) {
    if (b.kind === 'travel') { here = b.place; continue; }
    if (b.kind === 'fixed') { here = b.place; continue; }
    assert.equal(b.place, here, `${label}: ${b.start} ${b.title} is at ${b.place} but she is at ${here}`);
  }
}
const show = (blocks) => blocks.map((b) => `${b.start}-${b.end} ${b.kind.padEnd(9)} ${(b.place || '').padEnd(7)} ${b.done ? '✓ ' : '  '}${b.title}`).join('\n');

test('a full day: every task placed, trips where the place changes, no overlaps', () => {
  const day = sampleDay();
  const plan = P.localPlan(day, cfg);
  if (process.env.SHOW) console.log(show(plan.blocks));
  assertSane(plan.blocks, 'full day');
  const refs = new Set(plan.blocks.map((b) => b.ref));
  for (const t of day.tasks) assert.ok(refs.has(t.id), `task ${t.title} placed`);
  const trips = plan.blocks.filter((b) => b.kind === 'travel').map((b) => b.place);
  assert.deepEqual(trips, ['cafe', 'school', 'home']);
  const lunch = plan.blocks.find((b) => b.title === 'Lunch');
  assert.equal(lunch.place, 'cafe', 'lunch happens before the trip to school');
  const firstPrimary = plan.blocks.find((b) => b.kind === 'primary');
  assert.ok(m(firstPrimary.start) < m('09:00'), 'win-the-day work starts in the morning');
  assert.ok(plan.blocks.find((b) => b.kind === 'travel').refs.includes('a2'), 'on-the-go admin rides along on a trip');
  const sprinkle = plan.blocks.find((b) => b.kind === 'admin');
  assert.deepEqual(sprinkle.refs.sort(), ['a1', 'a3']);
  const t1 = plan.blocks.filter((b) => b.ref === 't1');
  assert.equal(t1.reduce((a, b) => a + P.minsOf(b), 0), 120);
  assert.ok(t1[0].title.endsWith('(1/2)'));
  assert.equal(plan.overflow.length, 0);
  for (const b of plan.blocks) if (b.kind === 'primary' || b.kind === 'secondary') assert.ok(b.detail.length > 20, 'work blocks are described');
});

test('a fixed commitment somewhere else gets a trip there and back', () => {
  const day = sampleDay();
  day.places = { am: 'cafe', pm: 'cafe', eve: 'home' };
  day.fixed = [{ id: 'f1', title: 'Physics consult', start: '14:00', end: '15:00', place: 'school' }];
  const plan = P.localPlan(day, cfg);
  if (process.env.SHOW) console.log(show(plan.blocks));
  assertSane(plan.blocks, 'fixed elsewhere');
  const consult = plan.blocks.find((b) => b.kind === 'fixed');
  assert.equal(consult.start, '14:00'); assert.equal(consult.end, '15:00'); assert.equal(consult.place, 'school');
  const before = plan.blocks.filter((b) => b.kind === 'travel' && m(b.end) <= m('14:00')).pop();
  assert.equal(before.place, 'school'); assert.equal(before.end, '14:00');
  const after = plan.blocks.find((b) => b.kind === 'travel' && m(b.start) >= m('15:00'));
  assert.equal(after.place, 'cafe');
});

test('a fixed commitment with no place happens wherever she is', () => {
  const day = sampleDay();
  day.fixed = [{ id: 'f1', title: 'Zoom call', start: '10:00', end: '10:30' }];
  const plan = P.localPlan(day, cfg);
  assertSane(plan.blocks, 'fixed here');
  assert.equal(plan.blocks.find((b) => b.kind === 'fixed').place, 'cafe');
});

test('re-planning at 1.10pm mid-trip: the trip finishes, the rest of the day follows, history stays', () => {
  const day = sampleDay();
  day.plan = P.localPlan(day, cfg);
  const trip = day.plan.blocks.find((b) => b.kind === 'travel' && b.place === 'school');
  // tick everything that ended before noon, leave the rest
  day.plan.blocks.forEach((b) => { if (m(b.end) <= m('12:00')) b.done = true; });
  for (const t of day.tasks) if (day.plan.blocks.filter((b) => b.ref === t.id).every((b) => b.done)) t.done = true;
  const now = m(trip.start) + 5;
  const re = P.localPlan(day, cfg, { from: now, energy: 2 });
  if (process.env.SHOW) console.log(show(re.blocks));
  assertSane(re.blocks, 'replan');
  const kept = re.blocks.find((b) => b.kind === 'travel' && b.place === 'school');
  assert.equal(kept.start, trip.start, 'the trip in progress is kept as it was');
  const next = re.blocks.filter((b) => m(b.start) >= m(trip.end) && !b.done)[0];
  assert.equal(next.place, 'school');
  assert.equal(re.blocks.filter((b) => b.title === 'Lunch').length, 1, 'lunch is not doubled');
  assert.equal(re.blocks.filter((b) => b.ref === 'r_rise').length, 1);
  for (const t of day.tasks.filter((t) => !t.done)) assert.ok(re.blocks.some((b) => b.ref === t.id && !b.done), `${t.title} still scheduled`);
  for (const t of day.tasks.filter((t) => t.done)) assert.ok(!re.blocks.some((b) => b.ref === t.id && !b.done && m(b.start) >= now), `${t.title} not rescheduled`);
  const sessions = re.blocks.filter((b) => (b.kind === 'primary' || b.kind === 'secondary') && m(b.start) >= now).map(P.minsOf);
  assert.ok(Math.max(...sessions) <= 60, 'low energy keeps sessions short: ' + sessions.join(','));
});

test('re-planning keeps a block ticked early in its slot', () => {
  const day = sampleDay();
  day.plan = P.localPlan(day, cfg);
  const read = day.plan.blocks.find((b) => b.ref === 'r_read');
  read.done = true;
  const re = P.localPlan(day, cfg, { from: m('15:05') });
  assertSane(re.blocks, 'ticked early');
  assert.equal(re.blocks.filter((b) => b.ref === 'r_read').length, 1);
  assert.ok(re.blocks.find((b) => b.ref === 'r_read').done);
});

test('the task in progress carries on first after a re-plan', () => {
  const day = sampleDay();
  day.plan = P.localPlan(day, cfg);
  const sec = day.plan.blocks.find((b) => b.ref === 't5');
  day.plan.blocks.forEach((b) => { if (m(b.end) <= m(sec.start)) b.done = true; });
  for (const t of day.tasks) if (day.plan.blocks.filter((b) => b.ref === t.id).every((b) => b.done)) t.done = true;
  const re = P.localPlan(day, cfg, { from: m(sec.start) + 15 });
  assertSane(re.blocks, 'in progress');
  const firstNew = re.blocks.filter((b) => (b.kind === 'primary' || b.kind === 'secondary') && m(b.start) >= m(sec.start) + 15)[0];
  assert.equal(firstNew.ref, 't5');
});

test('a Claude-written plan is cleaned up: overlaps, a moved commitment, a forgotten task', () => {
  const day = sampleDay();
  day.fixed = [{ id: 'f1', title: 'Physics consult', start: '14:00', end: '15:00', place: 'school' }];
  const ctx = P.promptContext(day, cfg);
  assert.ok(ctx.prompt.includes('"p1"') && ctx.prompt.includes('Physics consult'));
  const raw = {
    summary: 'A café morning for the big two, school after lunch.',
    blocks: [
      { start: '05:30', end: '05:55', title: 'Wake up', kind: 'routine', ref: 'r1', place: 'home', detail: 'Water first.' },
      { start: '05:55', end: '06:25', title: 'Exercise', kind: 'routine', ref: 'r2', place: 'home' },
      { start: '06:25', end: '06:45', title: 'Breakfast', kind: 'meal', ref: 'r3', place: 'home' },
      { start: '06:45', end: '07:05', title: 'Travel to Café', kind: 'travel', refs: ['a2'], place: 'cafe' },
      { start: '07:05', end: '08:40', title: 'ESAT practice paper (1/2)', kind: 'primary', ref: 'p1', place: 'cafe', detail: 'Timed, paper copy, no notes.' },
      { start: '08:30', end: '09:30', title: 'ESAT practice paper (2/2)', kind: 'primary', ref: 'p1', place: 'cafe' },
      { start: '09:40', end: '11:10', title: 'UK personal statement redraft', kind: 'primary', ref: 'p2', place: 'cafe' },
      { start: '11:15', end: '11:35', title: 'Admin', kind: 'admin', refs: ['a1', 'a3', 'a9'], place: 'cafe' },
      { start: '12:30', end: '13:10', title: 'Lunch', kind: 'meal', ref: 'r4', place: 'cafe' },
      { start: '13:10', end: '13:45', title: 'Travel to School', kind: 'travel', place: 'school' },
      { start: '13:45', end: '14:30', title: 'Physics consult', kind: 'fixed', ref: 'f1', place: 'school' },
      { start: '15:00', end: '15:45', title: 'Chem flashcards', kind: 'secondary', ref: 's1', place: 'school' },
      { start: '25:00', end: '26:00', title: 'Bad time', kind: 'primary' },
      { start: 'soon', end: 'later', title: 'Bad format', kind: 'primary' },
      { start: '16:00', end: '16:45', title: 'Watercolour practice', kind: 'secondary', ref: 's2', place: 'school' },
      { start: '17:00', end: '17:30', title: 'Book next astro meeting', kind: 'secondary', ref: 's3', place: 'library' },
      { start: '18:20', end: '19:00', title: 'Head home', kind: 'travel', place: 'home' },
      { start: '19:00', end: '19:40', title: 'Dinner', kind: 'meal', ref: 'r5', place: 'home' },
      { start: '21:20', end: '21:40', title: 'Read 10 pages', kind: 'routine', ref: 'r6', place: 'home' },
      { start: '21:40', end: '22:00', title: 'Wind down', kind: 'routine', ref: 'r7', place: 'home' },
    ],
  };
  const plan = P.normalizePlan(raw, day, cfg, ctx);
  if (process.env.SHOW) console.log(show(plan.blocks));
  assert.ok(plan);
  assertSane(plan.blocks, 'claude');
  const consult = plan.blocks.find((b) => b.kind === 'fixed');
  assert.deepEqual([consult.start, consult.end, consult.place], ['14:00', '15:00', 'school'], 'commitment restored to its real time');
  assert.ok(plan.blocks.some((b) => b.ref === 't3'), 'the forgotten STEMulate task was added back');
  assert.equal(plan.blocks.find((b) => b.kind === 'admin').refs.length, 2, 'unknown admin id dropped');
  assert.ok(!plan.blocks.some((b) => b.title === 'Bad time' || b.title === 'Bad format'));
  assert.equal(plan.blocks.find((b) => b.ref === 't6').place, 'school', 'a block cannot teleport to the library');
  assert.equal(plan.source, 'claude');
  assert.equal(plan.summary, raw.summary);
});

test('nonsense from Claude is rejected', () => {
  const day = sampleDay();
  const ctx = P.promptContext(day, cfg);
  assert.equal(P.normalizePlan(null, day, cfg, ctx), null);
  assert.equal(P.normalizePlan({ blocks: [] }, day, cfg, ctx), null);
  assert.equal(P.normalizePlan({ blocks: [{ start: 'x' }, { nope: 1 }] }, day, cfg, ctx), null);
});

test('running late: unfinished blocks slide, the commitment stays put, buffers go first', () => {
  const day = sampleDay();
  day.fixed = [{ id: 'f1', title: 'Physics consult', start: '14:00', end: '15:00', place: 'school' }];
  const plan = P.localPlan(day, cfg);
  const shifted = P.shiftPlan(plan, m('09:00'), 30, m('22:30'));
  assertSane(shifted.blocks, 'shifted');
  const before = plan.blocks.find((b) => m(b.start) >= m('09:00') && b.kind === 'primary');
  const after = shifted.blocks.find((b) => b.id === before.id);
  assert.equal(m(after.start), m(before.start) + 30);
  assert.equal(shifted.blocks.find((b) => b.kind === 'fixed').start, '14:00');
  const early = plan.blocks.find((b) => m(b.end) <= m('09:00'));
  assert.equal(shifted.blocks.find((b) => b.id === early.id).start, early.start, 'the morning that already happened stays');
});

test('stats and the current block', () => {
  const day = sampleDay();
  day.tasks[0].done = true; day.tasks[1].done = true; day.tasks[3].done = true;
  const st = P.stats(day);
  assert.equal(st.primaryDone, 2); assert.equal(st.secondaryDone, 1); assert.equal(st.won, false);
  day.tasks[2].done = true;
  assert.equal(P.stats(day).won, true);
  day.plan = P.localPlan(day, cfg);
  const cur = P.currentBlock(day.plan, m('05:40'));
  assert.equal(cur.ref, 'r_rise');
});
