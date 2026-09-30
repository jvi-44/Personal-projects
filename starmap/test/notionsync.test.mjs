import test from "node:test";
import assert from "node:assert/strict";
import * as N from "../js/notionsync.js";

// Synthetic page with the same shape as the Starmap agenda: archive toggle, then the live week.
const page = [
  "<callout>",
  "\t\t\t<details>",
  "\t\t\t<summary>ΛЯᄃΉIVΣƧ</summary>",
  "\t\t\t\t<details>",
  "\t\t\t\t<summary><span color=\"yellow_bg\">ЩΣΣK Old Week </span></summary>",
  "\t\t\t\t\t- [ ] old",
  "\t\t\t\t</details>",
  "\t\t\t</details>",
  "\t\t\t<details>",
  "\t\t\t<summary><span color=\"yellow_bg\">ЩΣΣK After Prelims </span></summary>",
  "\t\t\t\t<details color=\"yellow_bg\">",
  "\t\t\t\t<summary>ƧЦПDΛY `[27 Sep]`</summary>",
  "\t\t\t\t\t- [x] \\[7.30-10\\] UCAS Personal statement",
  "\t\t\t\t</details>",
  "\t\t\t</details>",
  "\t\t\t<unknown alt=\"button\"/>",
  "</callout>",
].join("\n");
const dates = ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"];

test("finds live and archived weeks", () => {
  const w = N.weekBlocks(page);
  assert.deepEqual(w.map((x) => [x.title, x.archived]), [["щσσk old week", true], ["щσσk after prelims", false]]);
  assert.deepEqual(N.readWeek(page, "ЩΣΣK After Prelims")["27 Sep"], [{ text: "[7.30-10] UCAS Personal statement", checked: true }]);
});

test("day lines keep tasks, admin and fixed plans with times, and drop routines", () => {
  const lines = N.dayLines([
    { type: "routine", start: 300, end: 330, title: "Run" },
    { type: "primary", start: 450, end: 540, title: "Essay [draft]", done: true, chunk: "1/2" },
    { type: "admin", start: 780, end: 800, title: "Admin sweep (2)", items: ["Pay fee", "Email"] },
    { type: "fixed", start: 840, end: 900, title: "Class" },
    { type: "meal", start: 750, end: 780, title: "Lunch" },
  ]);
  assert.deepEqual(lines.map((l) => l.text), ["\\[7.30-9\\] ★ Essay \\[draft\\] (1/2)", "\\[1-1.20\\] Pay fee", "\\[1-1.20\\] Email", "\\[2-3\\] Class"]);
  assert.equal(lines[0].checked, true);
});

test("replacing a week edits exactly its toggle; a new week goes after the current one", () => {
  const r = N.planEdit(page, { title: "ЩΣΣK After Prelims", dates, linesByDate: { "2026-09-28": [{ text: "\\[9-10\\] ★ ESAT", checked: false }] } });
  assert.equal(r.kind, "replace");
  assert.equal(page.split(r.old_str).length, 2);
  const after = page.replace(r.old_str, r.new_str);
  assert.deepEqual(N.readWeek(after, "ЩΣΣK After Prelims")["28 Sep"], [{ text: "[9-10] ★ ESAT", checked: false }]);
  assert.equal(N.planEdit(after, { title: "ЩΣΣK After Prelims", dates, linesByDate: { "2026-09-28": [{ text: "\\[9-10\\] ★ ESAT", checked: false }] } }).kind, "same");
  const next = dates.map((d) => d.replace("2026-09-2", "2026-10-0").replace("2026-09-30", "2026-10-07"));
  const ins = N.planEdit(after, { title: "ЩΣΣK Momentum", dates: next, linesByDate: {}, anchorTitle: "ЩΣΣK After Prelims" });
  assert.equal(ins.kind, "insert");
  const after2 = after.replace(ins.old_str, ins.new_str);
  assert.deepEqual(N.weekBlocks(after2).filter((w) => !w.archived).map((w) => w.title), ["щσσk after prelims", "щσσk momentum"]);
  assert.ok(after2.indexOf("ЩΣΣK Momentum") < after2.indexOf("<unknown"), "inserted before the button");
});

test("days not planned in the dashboard keep their Notion lines; renames find the old title", () => {
  const r = N.planEdit(page, { title: "ЩΣΣK Fresh", matchTitle: "ЩΣΣK After Prelims", dates, linesByDate: { "2026-09-28": [{ text: "\\[9-10\\] ★ ESAT", checked: false }] } });
  assert.equal(r.kind, "replace");
  const after = page.replace(r.old_str, r.new_str);
  const wk = N.readWeek(after, "ЩΣΣK Fresh");
  assert.deepEqual(wk["27 Sep"], [{ text: "[7.30-10] UCAS Personal statement", checked: true }], "Sunday kept verbatim");
  assert.deepEqual(wk["28 Sep"], [{ text: "[9-10] ★ ESAT", checked: false }]);
  assert.equal(N.readWeek(after, "ЩΣΣK After Prelims"), null);
});
