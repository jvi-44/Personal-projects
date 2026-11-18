# The Fairy Trove

A daily planner shaped like a planet: one red-pink hibiscus in a glass sphere, ringed with ivy, floating in pastel space. Each day runs on six tasks, three that win the day and three bonus ones. Each task is a grain of pollen drifting off the flower, on top of the daily routines.

You enter the day's tasks, where you'll work in the morning, afternoon and evening, any fixed commitments, and small admin. Claude then writes a timed, described plan for the whole day. That plan includes trips between places, batched admin, breaks and check-ins. Each week syncs one way into the ✮ Weekly Agenda ✮ on Vi's Starmap 2026 in Notion.

## What's here

| File | What it does |
| --- | --- |
| `index.html` | The page: layout, styles and markup. Published as the artifact. |
| `src/scene.js` | The 3D scene (three.js r128): the hibiscus, glass sphere, ivy ring, pollen orbs, nebula. |
| `src/planner.js` | The day planner: routines, travel, the 6-task queue, Claude prompt and plan clean-up, re-plans, "running late". |
| `src/notion.js` | Builds the ЩΣΣK week / day toggles and works out the smallest safe edit to the Notion page. |
| `src/app.js` | The dashboard: saving, rendering, weaving with Claude, check-ins, the weekly agenda, Notion sync. |
| `test/` | `node --test test/*.test.mjs`: planner and Notion-sync tests. |
| `tools/` | Dev only: a mock of the claude.ai runtime, a local server, end-to-end checks, seed data. |

## How the Notion sync works

- Each week becomes a toggle in the Weekly Agenda callout. Its header is `ЩΣΣK <label> (dd/mm - dd/mm)`, and the date range is how the week is found again. Inside are seven day toggles (`ƧЦПDΛY <code>[15 Nov]</code>` …), each holding timestamped to-dos (`\[7.05-8.35am\] ★ Task`).
- A sync fetches the page, then replaces only the day toggles that changed since the last sync. A new week goes in after the newest week, above the template button.
- It is one way. Any day the dashboard changes is rewritten in Notion. Days it hasn't touched are left as they are, and so is the rest of the page.

## Running it locally

```bash
cd fairy-trove
node --test test/*.test.mjs
node tools/serve.mjs 8123   # then open http://127.0.0.1:8123/index.html?mock=1&seed=example
```

`tools/e2e.mjs` drives the whole flow in headless Chromium against the mock (set `FT_PAGE_TEXT` to a saved `notion-fetch` result to sync against a real page's text).
