import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/planner.js";

const base = () => ({
  primary: [{ id: "a", title: "Essay A", min: 60 }, { id: "b", title: "Paper B", min: 60 }, { id: "c", title: "Study C", min: 60, when: "evening" }],
  secondary: [{ id: "d", title: "Read D", min: 30 }],
  locations: { morning: "home", afternoon: "home", evening: "home" },
});
const noOverlap = (blocks) => { const b = [...blocks].sort((x, y) => x.start - y.start); for (let i = 1; i < b.length; i++) assert.ok(b[i].start >= b[i - 1].end, `${b[i - 1].title} overlaps ${b[i].title}`); };
const task = (blocks, id) => blocks.find((b) => b.taskId === id);

test("tasks follow priority order, and time-of-day preferences are honoured", () => {
  const { blocks } = P.generatePlan(base());
  const a = task(blocks, "a"), b = task(blocks, "b"), c = task(blocks, "c"), d = task(blocks, "d");
  assert.ok(a.start < b.start && b.start < d.start, "priority order");
  assert.ok(c.start >= P.hm("18:30"), "evening task lands in the evening");
  noOverlap(blocks);
});

test("moving an item swaps it with its neighbour", () => {
  const { blocks } = P.generatePlan(base());
  const a0 = task(blocks, "a").start;
  const moved = P.moveItem(blocks, task(blocks, "b").id, -1);
  assert.equal(task(moved, "b").start, a0);
  assert.ok(task(moved, "a").start > task(moved, "b").start);
  noOverlap(moved.filter((x) => x.type !== "flex"));
});

test("setting a time pushes later items forward but never fixed commitments", () => {
  const i = base(); i.fixed = P.parseFixed("14:00-15:00 Class");
  const { blocks } = P.generatePlan(i);
  const a = task(blocks, "a");
  const out = P.refillFlex(P.setItemTime(blocks, a.id, P.hm("13:30"), P.hm("14:30")));
  const fixed = out.find((x) => x.type === "fixed");
  assert.equal(fixed.start, P.hm("14:00"), "fixed stays");
  assert.equal(task(out, "a").start, P.hm("13:30"));
  noOverlap(out.filter((x) => x.type !== "fixed" && x.id !== task(out, "a").id));
});

test("woke up late: everything unfinished shifts forward", () => {
  const { blocks } = P.generatePlan(base());
  const first = [...blocks].sort((x, y) => x.start - y.start)[0];
  const out = P.shiftFrom(blocks, 0, 45);
  const nf = [...out].filter((x) => x.type !== "flex").sort((x, y) => x.start - y.start)[0];
  assert.equal(nf.start, first.start + 45);
  noOverlap(out.filter((x) => x.type !== "flex"));
});

test("fill mode adds a new task without moving the hand-edited ones", () => {
  const i = base();
  const { blocks } = P.generatePlan(i);
  const edited = P.setItemTime(blocks, task(blocks, "a").id, P.hm("16:00"), P.hm("17:00"));
  i.secondary.push({ id: "e", title: "Email F", min: 20 });
  const frozen = edited.filter((b) => b.type !== "flex");
  const sched = {}; frozen.forEach((b) => b.taskId && (sched[b.taskId] = (sched[b.taskId] || 0) + b.end - b.start));
  const out = P.generatePlan(i, P.DEFAULT_SETTINGS, { fill: true, frozen, doneMin: sched });
  assert.equal(task(out.blocks, "a").start, P.hm("16:00"));
  assert.ok(task(out.blocks, "e"), "new task placed");
  noOverlap(out.blocks);
});

test("re-planning mid-day moves missed task blocks instead of duplicating them", () => {
  const i = base();
  const { blocks } = P.generatePlan(i);
  const now = task(blocks, "b").end + 5; // a and b are in the past, unticked
  const re = P.replan(i, P.DEFAULT_SETTINGS, blocks, now);
  for (const id of ["a", "b", "d"]) assert.equal(re.blocks.filter((x) => x.taskId === id).length, 1, `${id} once`);
  assert.ok(task(re.blocks, "a").start >= now);
});

test("a task set for the evening gets the evening even when the day is busy", () => {
  const i = base();
  i.primary = [{ id: "a", title: "Essay A", min: 240 }, { id: "b", title: "Paper B", min: 240 }, { id: "c", title: "Study C", min: 90, when: "evening" }];
  const { blocks } = P.generatePlan(i);
  assert.ok(task(blocks, "c") && task(blocks, "c").start >= P.hm("18:30"));
});

test("moving a task late never pushes the night routine", () => {
  const { blocks } = P.generatePlan(base());
  const night = blocks.filter((b) => b.type === "routine" && b.start >= 18 * 60).map((b) => b.start);
  const out = P.setItemTime(blocks, task(blocks, "b").id, P.hm("20:45"), P.hm("21:45"));
  assert.deepEqual(out.filter((b) => b.type === "routine" && b.start >= 18 * 60).map((b) => b.start), night);
});

test("breaks never outlive the task they followed", () => {
  const i = base();
  const { blocks } = P.generatePlan(i);
  const now = task(blocks, "b").end + 5;
  const re = P.replan(i, P.DEFAULT_SETTINGS, blocks, now);
  const work = re.blocks.filter((b) => ["primary", "secondary", "admin"].includes(b.type));
  for (const br of re.blocks.filter((b) => b.type === "break")) assert.ok(work.some((w) => w.end === br.start), `orphan break at ${P.clock(br.start)}`);
});

test("times you set are kept exactly: later edits, wake-up shifts and re-plans flow around them", () => {
  const i = base();
  const { blocks } = P.generatePlan(i);
  let out = P.setItemTime(blocks, task(blocks, "b").id, P.hm("11:00"), P.hm("12:00"));
  assert.ok(task(out, "b").locked);
  out = P.shiftFrom(out, 0, 120); // woke up two hours late
  assert.equal(task(out, "b").start, P.hm("11:00"));
  assert.equal(task(out, "b").end, P.hm("12:00"));
  noOverlap(out.filter((x) => x.type !== "flex"));
  // moving a neighbour can't displace it
  const items = P.itemsOf(out), bi = items.findIndex((it) => it.blocks.some((x) => x.taskId === "b"));
  assert.equal(P.moveItem(out, items[bi - 1].key, 1), out);
  // re-planning mid-day keeps it where it was set, without duplicating the task
  const re = P.replan(i, P.DEFAULT_SETTINGS, out, P.hm("09:00"));
  const bs = re.blocks.filter((x) => x.taskId === "b");
  assert.equal(bs.length, 1);
  assert.equal(bs[0].start, P.hm("11:00"));
  // a fresh plan with the locked block frozen keeps it too, and doesn't double routines
  const fresh = P.generatePlan(i, P.DEFAULT_SETTINGS, { frozen: out.filter((x) => x.locked), doneMin: { b: 60 } });
  assert.equal(task(fresh.blocks, "b").start, P.hm("11:00"));
  assert.equal(fresh.blocks.filter((x) => x.taskId === "b").length, 1);
  noOverlap(fresh.blocks);
});
