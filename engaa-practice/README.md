# ENGAA Section 1 Practice

A timed practice app for the ENGAA Section 1 past papers (2016, 2017, 2019–2023). It has clickable answer options, a live timer (85 s per question), question flagging, a dashboard of marks, mistake review and worked solutions.

- `index.html` is the app. `paper-YYYY.json` holds each paper's question images, answer key and explanations.
- `tools/` rebuilds the data from the PDFs: run `keys.py`, then `extract.py`, then `build.py` from a folder that contains `pdfs/` and `explanations/` (named `expl/` in the scripts).
- Questions that are crossed out in the papers are found automatically and left out.
