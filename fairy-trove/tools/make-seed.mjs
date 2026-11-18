// Builds the starting data: Vi's config (routines from the Starmap habit tracker, the places named in the request)
// and one clearly-marked example day, woven the way Claude would and cleaned by the planner.
// node tools/make-seed.mjs [YYYY-MM-DD]   → tools/seed/*.json and tools/example-seed.js (for the mock)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../src/planner.js');
const N = require('../src/notion.js');

const here = path.dirname(new URL(import.meta.url).pathname);
const date = process.argv[2] || '2026-11-18';
const week = N.addDays(date, -N.parseISO(date).getDay());

const config = P.defaultConfig();
config.name = 'Vi';
config.wake = '05:30'; config.sleep = '22:00';                       // ☀️ Wake up @5.30am · 😴 Sleep @10pm
config.places = [
  { id: 'home', name: 'Home', travel: 0, mode: '' },
  { id: 'cafe', name: 'Café', travel: 20, mode: 'MRT' },
  { id: 'school', name: 'School', travel: 35, mode: 'MRT' },
];
config.routines = [
  { id: 'r_rise', name: 'Wake up, water, get ready', anchor: 'wake', offset: 0, min: 25, kind: 'routine', on: true },
  { id: 'r_move', name: 'Exercise', anchor: 'wake', offset: 25, min: 30, kind: 'routine', on: true },        // 💪 Exercise
  { id: 'r_breakfast', name: 'Breakfast', anchor: 'wake', offset: 55, min: 20, kind: 'meal', on: true },
  { id: 'r_lunch', name: 'Lunch', anchor: 'time', time: '12:30', min: 40, kind: 'meal', on: true },
  { id: 'r_dinner', name: 'Dinner', anchor: 'time', time: '19:00', min: 40, kind: 'meal', on: true },
  { id: 'r_read', name: 'Read 10 pages', anchor: 'sleep', offset: 40, min: 20, kind: 'routine', on: true },   // 📖 Read 10pgs
  { id: 'r_wind', name: 'Screens off, wind down', anchor: 'sleep', offset: 20, min: 20, kind: 'routine', on: true }, // 📱 Screentime <3h
];
config.notion = { auto: true, page: 'https://www.notion.so/16872bf06f3180cebf9dd82a1a6c063c', marker: '', armed: false };

const day = P.emptyDay(date, week, config);
day.example = true;
day.tasks = [
  { id: 'ex_t1', title: 'ESAT practice paper, timed', tier: 'primary', est: 120, done: false },
  { id: 'ex_t2', title: 'Personal statement: final read-through', tier: 'primary', est: 60, done: false },
  { id: 'ex_t3', title: 'STEMulate Academy partner emails', tier: 'primary', est: 60, done: false },
  { id: 'ex_t4', title: 'Chem flashcards: organic mechanisms', tier: 'secondary', est: 45, done: false },
  { id: 'ex_t5', title: 'Watercolour: 20-minute sky study', tier: 'secondary', est: 30, done: false },
  { id: 'ex_t6', title: 'Plan the next astro session', tier: 'secondary', est: 30, done: false },
];
day.admin = [
  { id: 'ex_a1', title: 'Reply to Ms Tan', done: false, go: false },
  { id: 'ex_a2', title: 'Pay the ISC fee', done: false, go: true },
  { id: 'ex_a3', title: 'Print consent forms', done: false, go: false },
];
day.fixed = [{ id: 'ex_f1', title: 'Physics consult', start: '14:00', end: '15:00', place: 'school' }];
day.places = { am: 'cafe', pm: 'school', eve: 'home' };
day.note = 'Example day: these are sample tasks.';

const ctx = P.promptContext(day, config);
const sid = (type, id) => Object.keys(ctx.ids).find((k) => ctx.ids[k].type === type && ctx.ids[k].id === id);
const r = (id) => Object.keys(ctx.ids).find((k) => ctx.ids[k].id === id);
const raw = {
  summary: 'A café morning for the two hardest things while your head is fresh, school after lunch for the consult and lighter work, then home for dinner and a quiet evening. The ESAT paper gets the first and best two hours.',
  blocks: [
    { start: '05:30', end: '05:55', kind: 'routine', ref: r('r_rise'), title: 'Wake up, water, get ready', place: 'home', detail: 'A glass of water before your phone, curtains open.' },
    { start: '05:55', end: '06:25', kind: 'routine', ref: r('r_move'), title: 'Exercise', place: 'home', detail: 'Twenty minutes of the circuit and a short stretch. It is what makes the 7am focus block work.' },
    { start: '06:25', end: '06:45', kind: 'meal', ref: r('r_breakfast'), title: 'Breakfast', place: 'home', detail: 'Something with protein; the paper is long.' },
    { start: '06:45', end: '07:05', kind: 'travel', title: 'Travel to Café (MRT)', place: 'cafe', refs: [sid('admin', 'ex_a2')], detail: 'Pay the ISC fee on the train so it is off your mind before you sit down.' },
    { start: '07:05', end: '08:35', kind: 'primary', ref: sid('primary', 'ex_t1'), title: 'ESAT practice paper, timed', place: 'cafe', detail: 'Section 1 under exam conditions: phone in your bag, one timer, no notes. Do not mark anything yet.' },
    { start: '08:35', end: '08:45', kind: 'break', title: 'Break', place: 'cafe', detail: 'Stand up, refill your water, look at something far away.' },
    { start: '08:45', end: '09:15', kind: 'primary', ref: sid('primary', 'ex_t1'), title: 'ESAT practice paper, timed', place: 'cafe', detail: 'Mark it against the scheme and write down the three question types that cost you the most time.' },
    { start: '09:25', end: '10:25', kind: 'primary', ref: sid('primary', 'ex_t2'), title: 'Personal statement: final read-through', place: 'cafe', detail: 'Read it aloud once, start to finish. Cut any sentence that does not show what you did or what you learned; check the character count last.' },
    { start: '10:25', end: '10:40', kind: 'break', title: 'Longer break', place: 'cafe', detail: 'A short walk round the block. No scrolling.' },
    { start: '10:40', end: '11:00', kind: 'admin', title: 'Admin sprinkle', place: 'cafe', refs: [sid('admin', 'ex_a1'), sid('admin', 'ex_a3')], detail: 'Reply to Ms Tan, then queue the consent forms to print at school.' },
    { start: '11:00', end: '12:00', kind: 'primary', ref: sid('primary', 'ex_t3'), title: 'STEMulate Academy partner emails', place: 'cafe', detail: 'Write one template, then personalise the first line for each partner. Send them, do not schedule them.' },
    { start: '12:00', end: '12:30', kind: 'buffer', title: 'Buffer', place: 'cafe', detail: 'Slack in case the paper ran long. If it did not, close the laptop early.' },
    { start: '12:30', end: '13:10', kind: 'meal', ref: r('r_lunch'), title: 'Lunch', place: 'cafe', detail: 'Eat before you pack up; the afternoon is long.' },
    { start: '13:10', end: '13:45', kind: 'travel', title: 'Travel to School (MRT)', place: 'school', detail: 'Reread the two ESAT questions you could not crack, for the consult.' },
    { start: '13:45', end: '13:50', kind: 'checkin', ref: 'check_midday', title: 'Midday check-in', place: 'school', detail: 'Tick off the morning and see whether the afternoon still fits.' },
    { start: '14:00', end: '15:00', kind: 'fixed', ref: sid('fixed', 'ex_f1'), title: 'Physics consult', place: 'school', detail: 'Bring the two ESAT questions from this morning.' },
    { start: '15:00', end: '15:45', kind: 'secondary', ref: sid('secondary', 'ex_t4'), title: 'Chem flashcards: organic mechanisms', place: 'school', detail: 'Curly arrows from memory first, then check. Flag the three you got wrong for tomorrow.' },
    { start: '15:45', end: '15:55', kind: 'break', title: 'Break', place: 'school' },
    { start: '15:55', end: '16:25', kind: 'secondary', ref: sid('secondary', 'ex_t6'), title: 'Plan the next astro session', place: 'school', detail: 'Pick the target, book the slot and post it in the club chat before you leave.' },
    { start: '16:25', end: '17:25', kind: 'buffer', title: 'Catch-up slot', place: 'school', detail: 'Anything that ran over goes here. If nothing did, head home early.' },
    { start: '17:25', end: '18:00', kind: 'travel', title: 'Head home (MRT)', place: 'home', detail: 'Music, or rest your eyes.' },
    { start: '19:00', end: '19:40', kind: 'meal', ref: r('r_dinner'), title: 'Dinner', place: 'home', detail: 'Phone stays in your room.' },
    { start: '19:45', end: '20:15', kind: 'secondary', ref: sid('secondary', 'ex_t5'), title: 'Watercolour: 20-minute sky study', place: 'home', detail: 'Set a 20-minute timer for one wet-on-wet sky and no fixing. Date it and photograph it for the art log.' },
    { start: '20:45', end: '20:55', kind: 'checkin', ref: 'check_evening', title: 'Evening wrap-up', place: 'home', detail: 'Tick the day off, move anything unfinished to tomorrow, pack your bag.' },
    { start: '21:20', end: '21:40', kind: 'routine', ref: r('r_read'), title: 'Read 10 pages', place: 'home', detail: 'Paper book, bed light only.' },
    { start: '21:40', end: '22:00', kind: 'routine', ref: r('r_wind'), title: 'Screens off, wind down', place: 'home', detail: 'Lights out at ten.' },
  ],
};
const plan = P.normalizePlan(raw, day, config, ctx);
if (!plan) throw new Error('example plan did not normalise');
plan.source = 'example';
plan.at = Date.parse(date + 'T05:00:00+08:00');
plan.note = '';
day.plan = plan;
day.updatedAt = Date.parse(date + 'T05:00:00+08:00');
day.tasks = day.tasks.filter((t) => t.title);

const missing = day.tasks.filter((t) => !plan.blocks.some((b) => b.ref === t.id));
if (missing.length) throw new Error('example plan lost tasks: ' + missing.map((t) => t.title));
fs.mkdirSync(path.join(here, 'seed'), { recursive: true });
fs.writeFileSync(path.join(here, 'seed', 'config.json'), JSON.stringify(config, null, 1));
fs.writeFileSync(path.join(here, 'seed', 'example-day.json'), JSON.stringify(day, null, 1));
fs.writeFileSync(path.join(here, 'example-seed.js'),
  '/* Dev only: generated by make-seed.mjs. Puts the starting config and example day into the mock store. */\n' +
  'window.__exampleSeed = function (store) {\n  var base = "data/users/u_testviewer000000000000";\n' +
  '  store[base + "/config"] = ' + JSON.stringify(config) + ';\n' +
  '  store[base + "/trove/days/' + date + '"] = ' + JSON.stringify(day) + ';\n};\n');
console.log(plan.blocks.map((b) => `${b.start}-${b.end} ${b.kind.padEnd(9)} ${(b.place || '').padEnd(6)} ${b.title}`).join('\n'));
console.log('\nblocks:', plan.blocks.length, 'overflow:', JSON.stringify(plan.overflow), 'bytes:', JSON.stringify(day).length);
