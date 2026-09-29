import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/planner.js";

const inputs = () => ({
  primary: [
    { id: "p1", title: "UCAS personal statement", min: 150 },
    { id: "p2", title: "ESAT practice paper", min: 120 },
    { id: "p3", title: "Cornell supplemental essay", min: 90 },
  ],
  secondary: [
    { id: "s1", title: "Frankenstein reading", min: 30 },
    { id: "s2", title: "Reply to teachers", min: 20 },
    { id: "s3", title: "STEMulate follow-up", min: 30 },
  ],
  admin: P.parseAdmin("Pay ISC fee (5)\nBook cafe table"),
  fixed: P.parseFixed("14:00-15:00 Physics lesson @school"),
  locations: { morning: "cafe", afternoon: "school", evening: "home" },
});

const overlaps = (blocks) => {
  const b = [...blocks].sort((x, y) => x.start - y.start);
  for (let i = 1; i < b.length; i++) if (b[i].start < b[i - 1].end) return [b[i - 1], b[i]];
  return null;
};

test("plans a full day without overlaps, with all 6 tasks placed", () => {
  const { blocks, warnings } = P.generatePlan(inputs());
  assert.equal(overlaps(blocks), null);
  for (const id of ["p1", "p2", "p3", "s1", "s2", "s3"]) assert.ok(blocks.some((b) => b.taskId === id), `${id} placed`);
  assert.equal(warnings.length, 0);
  assert.ok(blocks.some((b) => b.type === "flex"), "has flex buffer");
  assert.ok(blocks.filter((b) => b.type === "travel").length >= 2);
  assert.ok(blocks.every((b) => b.start >= 300 && b.end <= 22 * 60 + 30 + 1));
});

test("task minutes are conserved and primaries get peak-energy slots", () => {
  const { blocks } = P.generatePlan(inputs());
  const sum = (id) => blocks.filter((b) => b.taskId === id).reduce((a, b) => a + b.end - b.start, 0);
  assert.equal(sum("p1"), 150);
  assert.equal(sum("p2"), 120);
  const p1 = blocks.filter((b) => b.taskId === "p1");
  assert.ok(p1.some((b) => b.start < 12 * 60), "top win lands in the morning peak");
});

test("fixed commitments are respected", () => {
  const { blocks } = P.generatePlan(inputs());
  const f = blocks.find((b) => b.type === "fixed");
  assert.equal(f.start, 14 * 60);
  assert.equal(overlaps(blocks), null);
});

test("overloaded day warns instead of overlapping", () => {
  const i = inputs();
  i.primary = i.primary.map((t) => ({ ...t, min: 300 }));
  const { blocks, warnings } = P.generatePlan(i);
  assert.equal(overlaps(blocks), null);
  assert.ok(warnings.length > 0);
});

test("replan keeps the past, does not duplicate routines/meals, and reschedules missed work", () => {
  const i = inputs();
  const plan = P.generatePlan(i);
  const first = plan.blocks.find((b) => b.taskId === "p1");
  first.done = true;
  const now = 13 * 60;
  const re = P.replan(i, P.DEFAULT_SETTINGS, plan.blocks, now);
  assert.equal(overlaps(re.blocks), null);
  assert.equal(re.blocks.filter((b) => b.title === "Lunch").length, 1);
  assert.equal(re.blocks.filter((b) => b.type === "routine" && b.title.startsWith("Sunrise")).length, 1);
  const oldIds = new Set(plan.blocks.map((b) => b.id));
  const fresh = re.blocks.filter((b) => !oldIds.has(b.id) && b.taskId);
  assert.ok(fresh.every((b) => b.start >= now), "new work only after now");
  // total scheduled for p2 = originally done chunks (none) + rescheduled remainder
  const p2 = re.blocks.filter((b) => b.taskId === "p2").reduce((a, b) => a + b.end - b.start, 0);
  assert.ok(p2 >= 120 - 0);
});

test("date + notion formatting", () => {
  assert.equal(P.weekStart("2026-09-29"), "2026-09-27");
  assert.equal(P.shortDate("2026-10-01"), "01 Oct");
  assert.equal(P.notionTime(5 * 60), "5");
  assert.equal(P.notionTime(12 * 60 + 30), "12.30");
  assert.equal(P.notionTime(13 * 60), "1");
  const lines = P.notionLines([{ type: "routine", start: 330, end: 375, title: "Weights", done: true }]);
  assert.deepEqual(lines[0], { text: "[5.30-6.15] Weights", checked: true });
  assert.equal(P.parseFixed("9:00-10:30 Class @school")[0].loc, "school");
});
