# SJPO Physics Study Guides

Study guides for the Singapore Junior Physics Olympiad, built from past-year papers. Every example and tutorial question is cropped straight from the original SJPO papers (2018, 2022, 2024, 2026) and titled with its source, for example `SJPO 2024 Q11`.

| Topic | Status |
|---|---|
| Mechanics | Done: `mechanics/` |
| Waves & Optics | Planned |
| Electricity & Magnetism | Planned |
| Thermodynamics | Planned |

## Mechanics layout

- `content/*.js` is the single source for the guide: notes, examples, worked solutions and narration scripts.
- `crops/` holds the question images, cut from the original papers by `tools/crop.py`.
- `pdf/` holds the built study guide (notes, examples with working boxes, tutorials) and the solutions booklet.
- `platform/index.src.html` is the e-learning site: narrated slide videos, watch checkboxes, XP and PDF links.

## Rebuild

```sh
cd mechanics/tools && npm install
python3 -I crop.py <folder with q2018.pdf … q2026.pdf> ../crops   # only if crops change
node build.js                    # PDFs + platform/data.js
python3 -I pages.py ..           # PDF page numbers for deep links
node platform.js                 # platform/dist (publishable site)
```
