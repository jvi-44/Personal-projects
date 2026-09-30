import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../js/coach.js";
import * as P from "../js/planner.js";

test("brain-dump text becomes seeds with durations, kinds and priorities", () => {
  const s = C.parseSeedsHeuristic("ESAT paper 3 2h, Cornell essay (90m); pay ISC fee\nread Frankenstein 30 min");
  assert.equal(s.length, 4);
  assert.deepEqual(s.map((x) => x.title), ["ESAT paper 3", "Cornell essay", "pay ISC fee", "read Frankenstein"]);
  assert.equal(s[0].min, 120); assert.equal(s[0].kind, "paper"); assert.equal(s[0].priority, "win");
  assert.equal(s[1].min, 90); assert.equal(s[1].kind, "essay");
  assert.equal(s[2].priority, "admin");
  assert.equal(s[3].min, 30);
  assert.ok(s.every((x) => x.tip && x.id));
});

test("heuristic week plan respects slots, budgets and places, and plans every day", () => {
  const settings = P.DEFAULT_SETTINGS;
  const dates = P.weekDates("2026-10-04").slice(1, 6);
  const locs = [["library", "library", "home"], ["cafe", "cafe", "home"], ["school", "school", "home"], ["home", "home", "home"], ["library", "cafe", "home"]];
  const days = dates.map((d, i) => {
    const l = { morning: locs[i][0], afternoon: locs[i][1], evening: locs[i][2] };
    return { date: d, locations: l, fixed: "", budget: P.generatePlan({ primary: [], secondary: [], locations: l }, settings).stats.flexMin };
  });
  const seeds = C.parseSeedsHeuristic("ESAT paper 4 2h, ESAT paper 5 2h, Cornell essay 3h, UIUC essay 90m, SAT maths 45m, pay ISC fee, email Ms Seah, gym 45m");
  const out = C.planWeekHeuristic({ days, seeds, settings });
  assert.equal(out.days.length, 5);
  for (const d of out.days) {
    assert.ok(d.primary.length <= 3 && d.secondary.length <= 3);
    assert.ok(d.theme && d.description && d.tip);
  }
  const all = out.days.flatMap((d) => [...d.primary, ...d.secondary]);
  // big essay is split into parts, never twice on one day
  const cornell = out.days.filter((d) => [...d.primary, ...d.secondary].some((t) => t.title.startsWith("Cornell")));
  assert.ok(cornell.length >= 2);
  // papers prefer the library days
  const paperDays = out.days.filter((d) => d.primary.some((t) => /ESAT/.test(t.title))).map((d) => d.date);
  assert.ok(paperDays.includes(dates[0]) || paperDays.includes(dates[4]));
  assert.ok(all.every((t) => t.tip));
  assert.ok(out.days.some((d) => d.admin.length));
});

test("check-in text moves the schedule without AI", () => {
  const plan = P.generatePlan({ primary: [{ id: "a", title: "ESAT paper 3", min: 60 }, { id: "b", title: "Cornell essay", min: 60 }], secondary: [{ id: "g", title: "Gym", min: 45 }], locations: { morning: "home", afternoon: "home", evening: "home" } });
  const first = [...plan.blocks].sort((x, y) => x.start - y.start)[0];
  const late = C.checkinHeuristic("woke up late, at 6:15", plan.blocks, P.hm("06:20"));
  assert.ok(late);
  assert.equal([...late.blocks].filter((b) => b.type !== "flex").sort((x, y) => x.start - y.start)[0].start, first.start + 75);
  const mv = C.checkinHeuristic("please move the cornell essay to 3pm and skip gym", plan.blocks, P.hm("09:00"));
  assert.equal(mv.blocks.find((b) => b.taskId === "b").start, P.hm("15:00"));
  assert.ok(!mv.blocks.some((b) => b.taskId === "g"));
  assert.match(mv.reply, /moved “Cornell essay” to 3 pm/);
  assert.equal(C.checkinHeuristic("feeling good", plan.blocks, 600), null);
});

test("reminders cover lunch, travel home and deep work", () => {
  const { blocks } = P.generatePlan({ primary: [{ id: "a", title: "UCAS PS", min: 90 }], secondary: [], locations: { morning: "cafe", afternoon: "cafe", evening: "home" } });
  const n = C.nudgesFor(blocks).map((x) => x.text).join(" | ");
  assert.match(n, /Lunch break/);
  assert.match(n, /Home from the cafe: plug in/);
  assert.match(n, /Deep work in 5 minutes/);
});

test("titles keep their words when durations and times of day are stripped", () => {
  const [a] = C.parseSeedsHeuristic("UCAS personal statement 2h morning");
  assert.equal(a.title, "UCAS personal statement");
  assert.equal(a.when, "morning");
  assert.equal(a.min, 120);
});
