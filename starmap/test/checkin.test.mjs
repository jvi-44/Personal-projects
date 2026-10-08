import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/planner.js";

// a stand-in for Claude: each test sets what it answers and reads the prompt it was sent
let answer = null, lastPrompt = "";
globalThis.window = { claude: { use: async (cap) => (cap === "sample" ? { json: async (prompt) => { lastPrompt = prompt; return typeof answer === "function" ? answer(prompt) : answer; } } : null) } };
const C = await import("../js/coach.js");

const tasks = {
  primary: [{ id: "p1", title: "ENGAA paper 4", min: 60 }, { id: "p2", title: "ENGAA paper 5", min: 60 }, { id: "p3", title: "ENGAA paper 3", min: 60 }],
  secondary: [{ id: "s1", title: "ENGAA paper 6", min: 60 }, { id: "s2", title: "Chem prac planning", min: 45 }, { id: "s3", title: "CMU essays", min: 45 }],
  locations: { morning: "school", afternoon: "school", evening: "home" },
};
const S = { ...P.DEFAULT_SETTINGS, wake: "05:00", sleep: "22:00" };
const base = () => P.generatePlan(tasks, S, { from: 14 * 60 + 30 }).blocks;
const work = (bs) => bs.filter((b) => ["primary", "secondary", "admin"].includes(b.type));
const ctx = (extra = {}) => ({ now: 14 * 60 + 30, wake: 300, sleep: 1320, ...extra });

test("times after midnight: parsing, day bounds and a clock that doesn't wrap", () => {
  assert.deepEqual(P.parseRange("11pm", "6am"), { start: 1380, end: 1800 });
  assert.deepEqual(P.parseRange("2", "4pm"), { start: 840, end: 960 });
  assert.equal(P.parseClock("9", 20 * 60), 21 * 60); // a bare 9 said at 8pm is 9pm
  assert.equal(P.parseClock("6:15", null, { morning: true }), 375);
  assert.equal(P.dayTime(60, 300), 1500); // 1am belongs to tonight
  assert.equal(P.clockX(1530), "25:30");
  assert.deepEqual(P.bounds({ wake: "05:00", sleep: "01:00" }), { wake: 300, sleep: 1500, window: null });
  assert.equal(P.bounds({ wake: "05:00", sleep: "22:00", window: { start: "23:00", end: "30:00" } }).sleep, 1800);
  assert.deepEqual(P.parseFixed("get home at 4pm").map((f) => [f.start, f.end, f.title]), [[960, 990, "Get home"]]);
  assert.deepEqual(P.parseFixed("Physics 2-3:30pm @school").map((f) => [f.start, f.end, f.loc]), [[840, 930, "school"]]);
});

test("a work window keeps tasks inside it, even overnight", () => {
  const plan = P.generatePlan(tasks, { ...S, window: { start: "23:00", end: "30:00" } }, { from: 14 * 60 + 30 });
  const w = work(plan.blocks);
  assert.equal(w.length, 6);
  assert.ok(w.every((b) => b.start >= 1380 && b.end <= 1800), "every task sits between 11pm and 6am");
  assert.equal([...w].sort((a, b) => a.start - b.start)[0].title, "ENGAA paper 4"); // priority order
  assert.deepEqual(plan.warnings, []);
});

test("check-in without AI: sleep 4–11pm, then all tasks 11pm–6am", () => {
  const r = C.checkinHeuristic("sleep 4pm-11pm, then do all tasks 11pm-6am", base(), 14 * 60 + 30, ctx());
  const sleep = r.blocks.find((b) => b.title === "Sleep");
  assert.deepEqual([sleep.start, sleep.end, sleep.locked], [960, 1380, true]);
  assert.deepEqual(r.day.window, { start: "23:00", end: "30:00" });
  assert.ok(work(r.blocks).every((b) => b.start >= 1380 && b.end <= 1800));
  assert.equal(P.clashes(r.blocks).length, 0);
  assert.match(r.reply, /added “Sleep” 4 pm–11 pm/);
});

test("check-in without AI: exact ranges, bedtimes and notes", () => {
  const r = C.checkinHeuristic("chem prac planning from 7:15pm to 8pm", base(), 600, ctx({ now: 600 }));
  const chem = r.blocks.find((b) => b.title === "Chem prac planning");
  assert.deepEqual([chem.start, chem.end, chem.locked], [1155, 1200, true]);
  const bed = C.checkinHeuristic("going to bed at 1am tonight", base(), 600, ctx({ now: 600 }));
  assert.equal(bed.day.sleep, "25:00");
  const note = C.checkinHeuristic("remember: school until 3:30 on weekdays", base(), 600, ctx({ now: 600 }));
  assert.deepEqual(note.remember, [{ text: "school until 3:30 on weekdays", scope: "ongoing" }]);
  assert.equal(note.blocks, null);
});

test("Claude's changes: locked times hold, 'tonight' times land after midnight, exact times lock", () => {
  const blocks = base();
  const p4 = blocks.find((b) => b.title === "ENGAA paper 4"), cmu = blocks.find((b) => b.title === "CMU essays");
  cmu.locked = true;
  const out = C.applyChanges(blocks, { changes: [{ id: p4.id, start: "01:00", end: "02:00", exact: true }, { id: cmu.id, start: "09:00", end: "09:45" }] }, { text: "move paper 4 to 1am", now: 14 * 60 + 30, wake: 300 });
  const p4b = out.find((b) => b.id === p4.id), cmub = out.find((b) => b.id === cmu.id);
  assert.deepEqual([p4b.start, p4b.end, p4b.locked], [1500, 1560, true]);
  assert.deepEqual([cmub.start, cmub.end], [cmu.start, cmu.end], "CMU essays wasn't mentioned, so its set time stays");
});

test("AI check-in: Vi's stated times win over a sloppy answer, and earlier check-ins reach the prompt", async () => {
  const blocks = base();
  const p6 = blocks.find((b) => b.title === "ENGAA paper 6");
  answer = { changes: [{ id: p6.id, start: "19:30", end: "20:30" }], reply: "Moved paper 6 to the evening.", tip: "You've got this.", remember: [{ text: "Sleeping 4–11pm today", scope: "today" }], forget: ["m-old"] };
  const history = [{ at: 1, clock: 13 * 60, text: "sleep 4pm-11pm", reply: "Added your sleep block." }];
  const memory = [{ id: "mabc", text: "School until 3:30 on weekdays", scope: "ongoing", from: "2026-10-07" }];
  const res = await C.checkin("do ENGAA paper 6 at 7pm", { ...ctx(), date: "2026-10-08", blocks, history, memory, recent: [{ date: "Wed 07 Oct", clock: 1260, text: "I'm doing ENGAA papers all week" }], tasks: [] });
  assert.equal(res.ai, true);
  const p6b = res.blocks.find((b) => b.id === p6.id);
  assert.deepEqual([p6b.start, p6b.locked], [19 * 60, true], "7pm exactly, not the 7:30 Claude picked");
  assert.match(res.reply, /Done: moved “ENGAA paper 6” to 7 pm, exactly as you said./);
  assert.deepEqual(res.remember, [{ text: "Sleeping 4–11pm today", scope: "today" }]);
  assert.deepEqual(res.forget, ["m-old"]);
  assert.match(lastPrompt, /13:00 Vi: "sleep 4pm-11pm" → you: "Added your sleep block."/);
  assert.match(lastPrompt, /\[mabc\] School until 3:30 on weekdays \(ongoing since 2026-10-07\)/);
  assert.match(lastPrompt, /I'm doing ENGAA papers all week/);
  assert.match(lastPrompt, /1:30am tonight = "25:30"/);
});

test("AI check-in: a work window and a bedtime from Claude become day rules", async () => {
  const blocks = base();
  answer = { changes: [], add: [{ title: "Sleep", start: "16:00", end: "23:00" }], day: { sleep: "06:00", window: { start: "23:00", end: "06:00" } }, reply: "Sleep 4–11pm, then your tasks overnight." };
  const res = await C.checkin("sleep 4pm to 11pm then everything 11pm to 6am", { ...ctx(), blocks, tasks: [] });
  assert.deepEqual(res.day, { sleep: "30:00", window: { start: "23:00", end: "30:00" } });
  const sleep = res.blocks.filter((b) => b.title === "Sleep");
  assert.equal(sleep.length, 1, "Claude's Sleep block isn't added twice");
  assert.ok(sleep[0].locked);
  assert.ok(work(res.blocks).every((b) => b.start >= 1380 && b.end <= 1800), "tasks Claude left behind still move into the window");
});

test("a window from an earlier check-in still holds when a later one moves a task", () => {
  const first = C.checkinHeuristic("sleep 4pm-11pm, then all tasks 11pm-6am", base(), 14 * 60 + 30, ctx());
  const win = { start: 1380, end: 1800 };
  const second = C.checkinHeuristic("move CMU essays to 2am", first.blocks, 14 * 60 + 40, ctx({ now: 14 * 60 + 40, window: win }));
  const cmu = second.blocks.find((b) => b.title === "CMU essays");
  assert.deepEqual([cmu.start, cmu.locked], [26 * 60, true]);
  assert.ok(work(second.blocks).every((b) => b.start >= win.start && b.end <= win.end), "nothing was pushed out of 11pm–6am");
  assert.equal(P.clashes(second.blocks).length, 0);
  assert.equal(second.blocks.find((b) => b.title === "Sleep").start, 960, "the earlier Sleep block is untouched");
});
