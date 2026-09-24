# Project STEMulate website (revamp)

A single-page, static site for Project STEMulate in green, butter-yellow and a
touch of purple, with sticker-style cards, die-cut STEMbots and a STEMbot
pattern hero. It covers:

- **About** and **What we do**: mission, founding, programmes
- **Meet the STEMbots**: Sophia, Timothy, Emily and Matthew
- **Lessons**: the STEM x Games module with a tab per lesson (Minecraft
  Masterminds, Mission Millionaire, Space Busters), every activity listed,
  and a tap-to-reveal quiz question
- **Curriculum map**: each topic with its science theme / maths strand and P4–P6 level
- **STEMulate Academy**: real screenshots of lessons, mini games, card albums,
  chats, leaderboards, certificates, gallery and Ask STEMbots
- **Impact** (Canossaville, CDAC, VIVA and testimonials) and **Get involved**

All lesson content and screenshots come from STEMulate Academy v3
(`jvi-44/vers3-tabs-stemulateacademy`).

## Run it

No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

To host on GitHub Pages, publish this folder (Settings → Pages).

## Point the Academy buttons at the live app

Every "Enter STEMulate Academy" button (including the one in the top bar) reads
one constant at the top of `script.js`:

```js
const ACADEMY_URL = "";   // e.g. "https://academy.your-domain.org"
```

While it's empty, the buttons scroll to the Academy section on this page.

## Files

- `index.html`: page content
- `styles.css`: design tokens and sticker styling (responsive, reduced-motion aware)
- `script.js`: Academy link, mobile menu, lesson tabs, quiz reveals, scroll-in animations
- `assets/`: logo, STEMbots, screenshots (`screens/`), card art (`cards/`), `pattern-tile.png`
