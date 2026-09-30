# Vi's Starmap · Sun Garden 🌻

A generative daily planner set on a living 3D sun. A brass-and-glass greenhouse sits on the sun's crown; each of the day's six tasks (three *win the day* + three *also*) is a sunflower that sprouts when you plant it and blooms as you finish it. Seeds for the week grow as seedlings around the rim, and routine steps are lanterns that light up as you tick them off.

Published as a pinned Claude artifact: <https://claude.ai/artifact/RJ7yPptKSamhJVvuVvH2Tb>

## Using it

- **Plant tasks:** type into the planter at the bottom (or tap an empty seed mound in the garden). Commas or new lines make several tasks; durations like `2h` or `45m` are understood. With Claude on, each task gets a realistic duration, a best place to do it, a finish line and a personal first-step tip.
- **Today / This week:** the planter's toggle decides whether tasks go straight into today's greenhouse or into the week's seed tray.
- **Places:** tap Morning / Afternoon / Evening in the day card to cycle through home, cafe, library, school and outdoors. Travel is added automatically when you change place.
- **Plan my week:** choose where you'll be each day and which seeds to plant. Claude matches work to places (timed papers in the library, essays at the cafe, admin at school or home), stays inside each day's free time, splits big tasks across days, and writes a theme, description and encouraging tip for every day. Without Claude, a built-in planner does the same matching.
- **Routines:** the Routines button turns the morning and night routines on or off. You can edit, reorder by retyping, add your own steps or pick from presets. Routines go in first; everything else grows around them.
- **Through the day:** tick schedule blocks or bloom a whole task, and the flower opens with a burst of pollen. *Check in* sets your energy and re-plans from now. *✨ Coach me* asks Claude for a fresh note based on your progress and reflection.
- **Notion:** *Copy for Notion* copies the week in your `[5.30-6.15] …` Starmap format. In local server mode with `NOTION_TOKEN` set, it also syncs one-way into the "ЩΣΣK …" week toggles.

Keyboard: `/` focuses the planter, `Esc` closes the focused flower, double-click the garden to reset the view.

## Develop

```bash
cd starmap
npm install
npm test          # planner, coach and Notion-sync tests
npm run build     # dist/app.js (local) + dist/starmap.html (single-file artifact)
npm start         # build + http://localhost:5173 ; add NOTION_TOKEN=… for live Notion sync
```

| Path | What |
| --- | --- |
| `js/planner.js` | Deterministic day scheduler: routines, travel, meals, energy-aware task placement, buffers, re-planning |
| `js/coach.js` | Places and their working conditions; seed parsing; AI prompts (via the artifact `sample` capability) with offline fallbacks |
| `js/scene.js` | Three.js scene: shader sun with corona and prominences, bloom, greenhouse, sunflowers, seedlings, lanterns |
| `js/app.js` | UI, state, persistence (localStorage + artifact `db`), dialogs |
| `notion.js`, `server.js` | Local server and one-way Notion sync (the Notion API can't be called from a browser) |
| `build.mjs` | esbuild bundle + single-file artifact page |

The planner always computes the timestamps, so the schedule never overlaps. Claude only chooses which tasks go on which day and writes the words around them.
