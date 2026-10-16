# Panel Room SG

An interview trainer for Singapore undergraduate scholarships, focused on current affairs and built for an ECE/CS candidate. Every briefing, generated question and piece of feedback comes from Claude.

**Live (pinned artifact):** https://claude.ai/artifact/ShN42UTBmSavg3QMGJ8pVU

## What's inside

- **Briefing** (the home tab): 12 Singapore current-affairs themes with facts checked up to **16 Oct 2026**. Topics include US tariffs, the Iran war and Hormuz energy shock, Budget 2026, the Economic Strategy Review, NDR 2026, TFR 0.87, Long Island, the haze, RTS Link, the Online Safety Commission, MAS and GIC results, RIE2030 and the July 2026 Cabinet reshuffle. Each theme lists the tensions panels probe and an engineer's angle. Buttons:
  - **Deep brief**: what happened, why it matters, both sides, engineer's angle, how each board would ask, and a 30-second answer.
  - **Drill me** / **Today's panel question**: answer on camera and get scored.
  - **Analyse a news article**: paste any article to get the implications for each of your boards and the questions it could trigger.
  - **Scan the latest news** (local version only): uses Claude's web search to pull the past week's Singapore news.
- **One tab per board**: PSC (Engineering), DSTA, GIC, EDB, MAS, A*STAR, SG Digital (IMDA), Smart Nation, PUB and LTA. Each has a dossier covering history, mandate, what's happening now, how selection runs (marked *official* or *reported*), what the panel probes, your ECE/CS angle, terms to use and sources. Each also has a question bank, **Generate fresh questions**, **Ask about this board**, and a **5-question mock panel** that ends with an overall decision.
- **Practice studio**: camera, live speech-to-text, a timer, words per minute and a filler-word count. **Get feedback** returns six scores (substance, structure, Singapore insight, board fit, engineer's lens, delivery), presence notes from your video frames, gaps, facts you should have used, a stronger opening, a model answer in your own voice, and three follow-up questions you can answer straight away.
- **Me & progress**: your profile, which Claude uses to write model answers in your voice (missing details become `[placeholders]` instead of invented facts). Also shows average scores and a full practice log.
- **Playbook**: how each board selects, answer frameworks, Singapore's hard constraints, and how to present yourself as an engineer.

## Two ways to run it

| | Pinned artifact on claude.ai | Local version (`npm start`) |
|---|---|---|
| Claude | Your claude.ai account (asks permission on first use) | Claude API with your `ANTHROPIC_API_KEY` (Claude Opus 5.5) |
| Live webcam | Blocked by claude.ai. Record a clip and upload it instead; Claude still checks frames for presence | Yes, live camera with recording and playback |
| Live speech-to-text | Usually blocked. Type, or use your keyboard's dictation | Yes, in Chrome or Edge |
| Web news scan | No | Yes (Claude web search) |
| Saved progress | Your claude.ai account, private to you | This browser |

### Run locally

```bash
cd scholarship-interview-trainer
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
# open http://localhost:3000 in Chrome
```

Options: `PORT=3001`, `CLAUDE_MODEL=claude-opus-5-5`, `WEB_SEARCH=off`. The server listens on localhost only, so your key never reaches the browser. Recordings never leave your device. Only a few still frames go to Claude, and only when you ask for feedback.

## Updating the briefing

All content lives in `index.html`, in `THEMES` (current affairs), `ORGS` (board dossiers) and `PLAYBOOK`. Update `DIGEST_DATE` when you refresh facts. Claude treats the digest as ground truth and is told not to invent newer facts.

## Sources

Official pages (PSC, MAS, EDB, GIC, MOF, MINDEF, URA, EMA, MDDI, SingStat, PMO) plus news and candidate accounts. They are linked in the app under each theme and board. Formats marked *reported* come from candidate accounts and third-party guides and can change between cycles, so confirm bond terms and dates on each board's site before applying.
