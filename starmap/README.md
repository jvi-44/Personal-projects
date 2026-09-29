# Vi's Starmap · Sun Garden 🌻

A generative daily planner: a 3D sun floating in space with a glass greenhouse on top. Every key task is a sunflower, and the flower blooms as you complete it. Your week sits on the side and syncs **one-way** into your Notion page **✮ Vi's Starmap 2026 ✮**, in the same toggle format you already use.

## Run it

```bash
cd starmap
npm start                         # http://localhost:5173  (preview mode, nothing written to Notion)
NOTION_TOKEN=secret_xxx npm start # live one-way sync to Notion
npm test                          # planner + Notion-sync tests
```

Requires Node 18+. There are no npm dependencies; Three.js is vendored in `vendor/`.

### Connecting Notion (one time)

1. Go to <https://www.notion.so/profile/integrations> and create an **internal integration**. Copy its secret.
2. Open **✮ Vi's Starmap 2026 ✮** in Notion, then **⋯ → Connections → add your integration**. This gives it access to the page and its children.
3. Start the server with `NOTION_TOKEN=…`. The header pill turns green when connected.

The page id defaults to your Starmap page; override with `NOTION_PAGE_ID`.

## How a day works

1. **Plan the day** tab: enter 3 *win the day* tasks + 3 secondary tasks (minutes, optional "done when…", optional preferred place), small admin (one per line, `(minutes)` optional), where you'll be in the morning, afternoon and evening, and fixed commitments (`14:00-15:30 Physics lesson @school`).
2. **Generate my day**. The planner lays down, in order:
   - your fixed commitments,
   - your evening wind-down (stacked back from sleep) and morning routine (from wake),
   - travel blocks whenever the place changes, plus lunch and dinner,
   - your six tasks, split into ≤90 min chunks with breaks, with the top win in your peak-energy window,
   - one batched *admin sweep* in a low-energy slot,
   - **flex buffers** in whatever is left ("room to adjust").
   Every block carries a short, task-type-aware guide (essay, paper, study, code, and so on). Click a block to expand it.
3. **Check in** during the day. Tick blocks off (flowers bloom, pollen bursts), set your energy, add something new that came up, or press **Re-plan rest of day**. Everything before *now* is kept; missed work is rescheduled into the time that remains (low energy shortens the secondaries and the focus chunks).
4. **Skip & reschedule** on any task block pushes that work into the remaining time.
5. Clicking a flower shows its slots and lets you mark the whole task bloomed.

Routines, meal times, travel time, wake/sleep, peak focus and a task backlog (for autocomplete) live in the **Routines** tab. The defaults come from your "After Prelims" week.

## Notion sync (dashboard → Notion, one-way)

- The week starting Sunday 27 Sep is linked to your existing **ЩΣΣK After Prelims** toggle. Each date is matched to its `ƧЦПDΛY [27 Sep]`-style day toggle.
- For each day, the app rewrites only the **to-do lines** and one `🌻 Win the day: …` bullet. Plain bullets and other notes you typed in a day are left alone. Lines look like `[5.30-6.15] Weights + bands…`, with checked state mirrored.
- **Auto-add week:** the current week is created if it doesn't exist, and from Friday onward the next week is created right after the latest one, with all seven day toggles, colours and headings. You can also press **＋ Add next week**. New toggles are named `ЩΣΣK of 04 Oct` by default; rename in the Routines tab.
- Changes sync ~2s after you edit (toggle *Auto-sync* off to sync manually). Days show a coloured dot: green synced, yellow pending, blue preview, red error.
- Without `NOTION_TOKEN` the **Preview** button shows exactly what would be written.

> Sync is overwrite-only for the to-do lines of days that have a plan here. Days without a plan in the dashboard are never touched.

## Files

| Path | What |
| --- | --- |
| `js/planner.js` | Scheduling engine, replanning, Notion line formatting (pure, unit-tested) |
| `js/scene.js` | Three.js sun, greenhouse and sunflowers |
| `js/app.js` | UI state, weekly agenda, check-ins, sync client |
| `notion.js` | Notion REST client (find/create week and day toggles, rewrite to-dos) |
| `server.js` | Static server and `/api/sync` proxy (Notion's API can't be called from a browser) |
| `data/notion-map.json` | Created at runtime: remembers which Notion block is which week |

State is stored in your browser's `localStorage` (`starmap.v1`).
