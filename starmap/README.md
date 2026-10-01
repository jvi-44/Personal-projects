# Vi's Starmap · Sun Garden 🌻

A generative daily planner set on a living 3D sun. A brass-and-glass greenhouse sits on the sun's crown; each of the day's six tasks (three *win the day* + three *also*) is a sunflower that sprouts when you plant it and blooms as you finish it. Seeds for the week grow as seedlings around the rim, and routine steps are lanterns that light up as you tick them off.

Published as a pinned Claude artifact: <https://claude.ai/artifact/RJ7yPptKSamhJVvuVvH2Tb>

## Using it

**Days**
- **Plant tasks** in the planter at the bottom (or tap an empty seed mound). Commas or new lines make several tasks; `2h`, `45m`, `morning`/`afternoon`/`evening` are understood. With Claude on, each task gets a realistic length, a best time of day, a finish line and a first-step tip.
- **Prioritise** with ▲▼ (or drag) inside *Win the day* and *Also*. The schedule runs tasks in that order; tasks with a best time of day (set in a task's editor) claim that part of the day first.
- **✨ Plan my day**: pick places, energy, fixed plans and a note for Claude. The day is rebuilt in priority order around your routines, then Claude adds a theme, tips and 5–8 reminders tied to the schedule.
- **Edit the schedule**: drag items or use ▲▼ to swap them; open an item to set its start/end. Later items move forward; fixed plans and the night routine stay put. *Add to schedule* inserts your own event. Once edited, the schedule is kept as you left it (new tasks slot into free time) until you choose *Re-plan by priority*.
- **Check in** in plain words: “woke up late, start from 8:30”, “move ESAT paper to 3pm and push the rest”, “skip gym”, “add dentist at 4 for 45 min”. Claude rewrites the schedule; without Claude, a built-in parser handles those phrasings.
- **Reminders** live inside the block they belong to (open a block to see them) and pop up at their time while the page is open.
- **Your times are binding**: any time you set (editing an item, adding an event, or "move X to 3pm" in a check-in) locks that item 🔒. Re-plans, wake-up shifts, new tasks and reorders flow around it and never move it. Use *Unlock time* to release it.

**Weeks**
- **Saturday is reset day**: the week card shows a banner and *Plan my week* defaults to next week. Choose a **theme word**, where you'll be each day, and the seeds to plant. The week grows as a draft in the garden.
- **Confirm → Notion** shows exactly what will be written, then creates `ЩΣΣK <theme>` on your Starmap page right after the current week, with a toggle per day and a checkbox per task with its final times (routines, meals, travel and buffers are left out).
- After confirming, edits sync automatically (about 15 s after you stop changing things). Days you haven't planned here keep whatever Notion already has. The current week, *After Prelims*, is linked: press *Sync to Notion* once to take it over.
- The **Notion card** (bottom right) previews the week in Notion's style, *Check Notion* reads back what's really there, and *Open in Notion ↗* opens the page in a new tab (Notion pages can't be embedded inside an artifact).

**Rituals**
- Tick morning and night routine steps in the schedule, or tap a day in the **Rituals** tracker to tick the whole routine. Streaks count days with at least 80% done. Each step is a lantern on the greenhouse rim.
- **Routines** (top bar) turns each routine on or off, edits, reorders and adds steps, and sets wake/sleep, meals, travel time and usual places.

Keyboard: `/` focuses the planter, `Esc` closes the focused flower, `Ctrl/⌘+Enter` sends a check-in.

## Develop

```bash
cd starmap
npm install
npm test          # planner, schedule editing, coach, check-in and Notion-sync tests
npm run build     # dist/app.js (local) + dist/starmap.html (single-file artifact)
npm start         # build + http://localhost:5173 ; add NOTION_TOKEN=… for live Notion sync
```

| Path | What |
| --- | --- |
| `js/planner.js` | Deterministic day scheduler: routines, travel, meals, energy-aware task placement, buffers, re-planning |
| `js/coach.js` | Places and their working conditions; seed parsing; AI prompts (via the artifact `sample` capability) with offline fallbacks |
| `js/scene.js` | Three.js scene: shader sun with corona and prominences, bloom, greenhouse, sunflowers, seedlings, lanterns |
| `js/notionsync.js` | Builds your Notion week markup, finds a week's toggle on the page, replaces it or inserts a new week (via the artifact `mcp` Notion connector) |
| `js/app.js` | UI, state, persistence (localStorage + artifact `db`), habits, reminders, dialogs |
| `notion.js`, `server.js` | Local server and one-way Notion sync (the Notion API can't be called from a browser) |
| `build.mjs` | esbuild bundle + single-file artifact page |

The planner always computes the timestamps, so the schedule never overlaps. Claude only chooses which tasks go on which day and writes the words around them.
