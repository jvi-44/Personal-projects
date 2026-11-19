// Run: node --test fairy-trove/test
// Optional: FT_PAGE_TEXT=/path/to/saved-notion-fetch.txt to run the same checks against a real page export.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const N = require('../src/notion.js');

const FIXTURE = `<page url="https://app.notion.com/p/x">
<content>
<columns>
<column ratio="37.5">
<callout color="purple_bg">
<b><span color="yellow_bg"><u>✮ 山乇乇Ҝㄥㄚ 卂Ꮆ乇几ᗪ卂 ✮</u></span></b>

<toggle>
ΛЯᄃΉIVΣƧ

<toggle>
2026

<toggle>
<span color="yellow_bg">ЩΣΣK Term 3 Week 7 </span>

<toggle color="yellow_bg">
ƧЦПDΛY <code>[15 Nov]</code>

- [ ]
</toggle>

<toggle color="gray_bg">
ƧΛƬЦЯDΛY <code>[22 Aug]</code>

- [ ] Sample A
</toggle>
</toggle>
</toggle>
</toggle>

<toggle>
<span color="yellow_bg">ЩΣΣK After Prelims </span>

<toggle color="yellow_bg">
ƧЦПDΛY <code>[27 Sep]</code>

- [ ] \\[7.30-10\\] Sample B
</toggle>

<toggle color="gray_bg">
ƧΛƬЦЯDΛY <code>[03 Oct]</code>

- [ ] Sample C
</toggle>
</toggle>

<unknown url="https://app.notion.com/p/x#button1" alt="button" />
</callout>
</column>
<column ratio="62.5">
<callout icon="/icons/train-metro_green.svg">
<toggle heading="h3">
On-the-go Tasks

- [ ] Sample D
</toggle>
</callout>
</column>
</columns>
</content>
</page>`;

const WEEK = '2026-11-15';
const dates = N.weekDates(WEEK);
const emptyBlocks = () => Object.fromEntries(dates.map((d) => [d, N.buildDayBlock(d, null)]));

// What Notion does with an update, as seen live: each search-and-replace in turn (a replace-all changes every
// match), then it re-reads the whole page. The re-read loses empty to-dos written as "- [ ] " (modelled at its
// worst: all of them) and keeps the tag form, which reads back as "- [ ] ".
function apply(text, plan) {
  let out = text;
  for (const u of plan.updates) {
    const n = N._count(out, u.old_str);
    if (u.replace_all_matches) { assert.ok(n >= 1, 'a replace-all must match something'); out = out.split(u.old_str).join(u.new_str); }
    else { assert.equal(n, 1, 'old_str must match exactly once'); out = out.replace(u.old_str, () => u.new_str); }
  }
  return out.replace(/^[ \t]*- \[ \] ?\n/gm, '').split(N.EMPTY_TODO).join('- [ ] ');
}
const own = (plan) => plan.updates.filter((u) => !u.replace_all_matches);
const guards = (plan) => plan.updates.filter((u) => u.replace_all_matches);

function runSuite(name, page) {
  test(`${name}: inserts a new week after the last week, before the button`, () => {
    const plan = N.planSync({ text: page, weekStart: WEEK, label: '', blocks: emptyBlocks(), pushed: {} });
    assert.equal(plan.mode, 'insert');
    const after = apply(page, plan);
    const iWeek = after.indexOf('ЩΣΣK 47 (15/11 - 21/11)');
    const iPrev = after.indexOf('ЩΣΣK After Prelims');
    const iButton = after.indexOf('alt="button" />', iPrev);
    assert.ok(iPrev > 0 && iWeek > iPrev && iWeek < iButton, 'week sits between the previous week and the button');
    const v = N.verify(page, after, WEEK);
    assert.deepEqual(v, { weekFound: true, lostBlocks: 0, lost: {}, damaged: false });
    // every other character of the page is untouched (an empty checkbox may come back with Notion's trailing space)
    const added = N.buildWeekBlock(WEEK, '', emptyBlocks()).split(N.EMPTY_TODO).join('- [ ] ');
    assert.equal(after.replace('\n\n' + added, ''), page.replace(/^([ \t]*)- \[ \]$/gm, '$1- [ ] '));
  });

  test(`${name}: second sync with nothing changed is a no-op`, () => {
    const blocks = emptyBlocks();
    const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks, pushed: {} });
    const after = apply(page, p1);
    const p2 = N.planSync({ text: after, weekStart: WEEK, label: '', blocks, pushed: p1.hashes });
    assert.equal(p2.mode, 'noop');
  });

  test(`${name}: a changed day replaces only that day`, () => {
    const blocks = emptyBlocks();
    const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks, pushed: {} });
    const after = apply(page, p1);
    const day = {
      tasks: [
        { id: 'a', title: 'Finish UCAS essay [draft 2]', tier: 'primary', done: true },
        { id: 'b', title: 'ESAT paper 4', tier: 'secondary', done: false },
      ],
      admin: [{ id: 'x', title: 'Email Ms Tan', done: false }, { id: 'y', title: 'Pay *ISC* fee', done: true }],
      plan: {
        blocks: [
          { start: '05:30', end: '06:15', title: 'Morning routine', kind: 'routine', done: true },
          { start: '07:30', end: '09:00', title: 'Finish UCAS essay [draft 2]', kind: 'primary', ref: 'a' },
          { start: '09:00', end: '09:15', title: 'Break', kind: 'break' },
          { start: '13:00', end: '13:20', title: 'Admin sprinkle', kind: 'admin', refs: ['x', 'y'] },
          { start: '11:30', end: '13:00', title: 'ESAT paper 4', kind: 'secondary', ref: 'b' },
        ],
      },
      checkins: [{ at: new Date(2026, 10, 16, 13, 5).getTime(), energy: 3, note: 'steady' }],
    };
    blocks['2026-11-16'] = N.buildDayBlock('2026-11-16', day);
    const p2 = N.planSync({ text: after, weekStart: WEEK, label: '', blocks, pushed: p1.hashes });
    assert.equal(p2.mode, 'update');
    assert.equal(own(p2).length, 1);
    assert.deepEqual(p2.changed, ['2026-11-16']);
    const after2 = apply(after, p2);
    // a real page has tasks of its own, so look at the day as it now reads on the page
    const monday = blocks['2026-11-16'].split(N.EMPTY_TODO).join('- [ ] ');
    assert.ok(after2.includes(monday), 'the day is on the page as written');
    assert.ok(monday.includes('- [x] \\[7.30-9am\\] ★ Finish UCAS essay \\[draft 2\\]'));
    assert.ok(monday.includes('- [ ] \\[11.30am-1pm\\] ESAT paper 4'), 'bonus tasks carry their time, no star');
    assert.ok(!monday.includes('Break') && !monday.includes('Morning routine'), 'routines and breaks stay out of Notion');
    assert.ok(monday.includes('Admin:\n\n- [ ] Email Ms Tan\n- [x] Pay \\*ISC\\* fee'));
    assert.ok(monday.indexOf('Finish UCAS essay') < monday.indexOf('ESAT paper 4'), 'tasks are in time order');
    assert.ok(monday.includes('✿ 1.05pm check-in · energy 3/5 — steady'));
    const p3 = N.planSync({ text: after2, weekStart: WEEK, label: '', blocks, pushed: p2.hashes });
    assert.equal(p3.mode, 'noop');
  });

  test(`${name}: renaming the week touches only the header line`, () => {
    const blocks = emptyBlocks();
    const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks, pushed: {} });
    const after = apply(page, p1);
    const p2 = N.planSync({ text: after, weekStart: WEEK, label: 'Post A-levels', blocks, pushed: p1.hashes });
    assert.equal(p2.mode, 'update');
    assert.equal(own(p2).length, 1);
    assert.ok(own(p2)[0].new_str.includes('ЩΣΣK Post A-levels (15/11 - 21/11)'));
  });

  test(`${name}: edits made by hand in other days survive a sync`, () => {
    const blocks = emptyBlocks();
    const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks, pushed: {} });
    let after = apply(page, p1);
    after = after.replace('ƬЦΣƧDΛY <code>[17 Nov]</code>\n\n- [ ] ', 'ƬЦΣƧDΛY <code>[17 Nov]</code>\n\n- [ ] typed in Notion by hand');
    blocks['2026-11-18'] = N.buildDayBlock('2026-11-18', { tasks: [{ id: 'q', title: 'Wed task', tier: 'primary' }] });
    const p2 = N.planSync({ text: after, weekStart: WEEK, label: '', blocks, pushed: p1.hashes });
    const after2 = apply(after, p2);
    assert.ok(after2.includes('typed in Notion by hand'));
    assert.ok(after2.includes('- [ ] ★ Wed task'));
  });
}

runSuite('fixture', FIXTURE);
if (process.env.FT_PAGE_TEXT) runSuite('real page export', fs.readFileSync(process.env.FT_PAGE_TEXT, 'utf8'));

test('a day block that is not unique on the page falls back to one whole-week replacement', () => {
  // Give the archive an empty "ƧЦПDΛY [15 Nov]" block identical to the one we generate.
  const page = FIXTURE.replace('ƧЦПDΛY <code>[15 Nov]</code>\n\n- [ ]\n', 'ƧЦПDΛY <code>[15 Nov]</code>\n\n- [ ] \n');
  assert.notEqual(page, FIXTURE);
  const blocks = emptyBlocks();
  const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks, pushed: {} });
  const after = apply(page, p1);
  const sundayOnPage = blocks['2026-11-15'].replace(N.EMPTY_TODO, '- [ ] ');
  assert.equal(N._count(after, sundayOnPage), 2, 'two identical Sunday blocks exist before the edit');
  blocks['2026-11-15'] = N.buildDayBlock('2026-11-15', { tasks: [{ id: 's', title: 'Sunday reset', tier: 'secondary' }] });
  const p2 = N.planSync({ text: after, weekStart: WEEK, label: '', blocks, pushed: p1.hashes });
  assert.equal(p2.mode, 'update');
  assert.equal(own(p2).length, 1);
  const after2 = apply(after, p2);
  assert.ok(after2.includes('- [ ] Sunday reset'));
  assert.equal(N._count(after2, 'ƧЦПDΛY <code>[15 Nov]</code>\n\n- [ ] \n</toggle>'), 1, 'the archived look-alike is untouched');
});

test('every write ends by protecting the empty checkboxes on the rest of the page', () => {
  const page = FIXTURE.replace('- [ ] Sample D', '- [ ] Sample D\n- [ ] \n- [ ] \n  - [ ] ');
  const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks: emptyBlocks(), pushed: {} });
  assert.equal(p1.mode, 'insert');
  assert.deepEqual(guards(p1).map((u) => u.old_str), ['- [ ] \n', '- [ ]\n'], 'one replace-all for each way an empty to-do is written');
  assert.deepEqual(p1.updates.slice(own(p1).length), guards(p1), 'after the week itself');
  assert.ok(guards(p1).every((u) => u.new_str === N.EMPTY_TODO + '\n'));
  const after = apply(page, p1);
  assert.deepEqual(N.verify(page, after, WEEK), { weekFound: true, lostBlocks: 0, lost: {}, damaged: false });
  assert.equal(N.census(after).emptyTodos, N.census(page).emptyTodos + 7, 'the seven empty days were added and nothing was lost');
  // a one-day change is protected the same way
  const blocks = emptyBlocks();
  blocks['2026-11-17'] = N.buildDayBlock('2026-11-17', { tasks: [{ id: 't', title: 'Tuesday task', tier: 'primary' }] });
  const p2 = N.planSync({ text: after, weekStart: WEEK, label: '', blocks, pushed: p1.hashes });
  assert.equal(own(p2).length, 1);
  assert.equal(guards(p2).length, 1);
  assert.equal(N.verify(after, apply(after, p2), WEEK).damaged, false);
});

test('a write that costs the rest of the page its checkboxes or buttons is caught', () => {
  const page = FIXTURE.replace('- [ ] Sample D', '- [ ] Sample D\n- [ ] \n- [ ] \n  - [ ] ');
  const p1 = N.planSync({ text: page, weekStart: WEEK, label: '', blocks: emptyBlocks(), pushed: {} });
  const unguarded = apply(page, { updates: own(p1) });
  const v = N.verify(page, unguarded, WEEK);
  assert.equal(v.weekFound, true);
  assert.equal(v.damaged, true);
  assert.equal(v.lost.emptyTodos, 4, 'the three added here and the archive’s own');
  const noButton = apply(page, p1).replace('<unknown url="https://app.notion.com/p/x#button1" alt="button" />\n', '');
  assert.deepEqual(N.verify(page, noButton, WEEK), { weekFound: true, lostBlocks: 1, lost: { buttons: 1 }, damaged: true });
});

test('a page with "- [ ] " somewhere that isn’t a checkbox is not written to', () => {
  const page = FIXTURE.replace('On-the-go Tasks\n', 'On-the-go Tasks\n\n```\n- [ ] \n```\n');
  const plan = N.planSync({ text: page, weekStart: WEEK, label: '', blocks: emptyBlocks(), pushed: {} });
  assert.equal(plan.mode, 'blocked');
  assert.equal(plan.reason, 'unsafe_guard');
  assert.deepEqual(plan.updates, []);
});

test('a page without the agenda callout gets the week appended', () => {
  const plan = N.planSync({ text: '<page>\n<content>\nHello\n</content>\n</page>', weekStart: WEEK, label: '', blocks: emptyBlocks(), pushed: {} });
  assert.equal(plan.mode, 'append');
  assert.ok(plan.content.startsWith('<toggle>\n<span color="yellow_bg">ЩΣΣK 47 (15/11 - 21/11) </span>'));
});

test('a task with several sessions lists them underneath, each with its time', () => {
  const lines = N.dayLines({
    tasks: [{ id: 'p', title: 'UC PIQs 1–3', tier: 'primary' }, { id: 's', title: 'Physics MCQ', tier: 'secondary' }],
    fixed: [{ id: 'f', title: 'Essay mentor', start: '17:00', end: '18:00' }],
    plan: { blocks: [
      { start: '07:30', end: '08:30', title: 'UC PIQ 1', kind: 'primary', ref: 'p', done: true },
      { start: '10:00', end: '11:00', title: 'UC PIQ 2', kind: 'primary', ref: 'p' },
      { start: '13:30', end: '14:15', title: 'Physics MCQ', kind: 'secondary', ref: 's' },
      { start: '17:00', end: '18:00', title: 'Essay mentor', kind: 'fixed', ref: 'f' },
      { start: '18:00', end: '19:30', title: 'Run', kind: 'routine' },
    ] },
  });
  assert.deepEqual(lines, [
    '- [ ] ★ UC PIQs 1–3',
    '  - [x] \\[7.30-8.30am\\] UC PIQ 1',
    '  - [ ] \\[10-11am\\] UC PIQ 2',
    '- [ ] \\[1.30-2.15pm\\] Physics MCQ',
    '- [ ] \\[5-6pm\\] Essay mentor',
  ]);
});

test('formatting helpers', () => {
  assert.equal(N.fmtRange('07:30', '09:00'), '7.30-9am');
  assert.equal(N.fmtRange('11:30', '13:00'), '11.30am-1pm');
  assert.equal(N.fmtRange('13:15', '13:50'), '1.15-1.50pm');
  assert.equal(N.fmtRange('12:00', '13:00'), '12-1pm');
  assert.equal(N.dayCode('2026-11-16'), '[16 Nov]');
  assert.equal(N.weekKey('2026-11-15'), '(15/11 - 21/11)');
  assert.equal(N.defaultWeekLabel('2026-11-15'), '47');
  assert.equal(N.defaultWeekLabel('2026-12-27'), '53');
  assert.equal(N.esc('A*STAR <b> [x] #1'), 'A\\*STAR \\<b\\> \\[x\\] #1');
  assert.equal(N.buildDayBlock('2026-11-20', null), '<toggle color="purple_bg">\nFЯIDΛY <code>[20 Nov]</code>\n\n<todo checked="false"></todo>\n</toggle>');
});
