# ESAT & ENGAA Practice

A single-page practice app:

- **ESAT mocks**: five timed mocks, each with three sections of 27 questions and 40 minutes. Mathematics 1 and Physics come from NSAA Section 1 (2016–2023, maths and physics parts only); Mathematics 2 comes from TMUA Paper 1 (2016–2023).
- **ENGAA past papers** (2016–2023): 85 s per question, with crossed-out questions removed.
- **Speed practice**: untimed and endless. By default it uses the NSAA/TMUA questions that aren't in any mock.

Every mode has pause and resume, live per-question timers, flagging, a review list colour-coded right/wrong with time per question, and worked solutions.

- `index.html` is the app, with all question images, keys and explanations embedded. `tools/app.js` is its script.
- `explanations/` holds the ENGAA solutions; `explanations/esat/` holds the NSAA (`N*.txt`, written from the answer keys) and TMUA (`T*.txt`, condensed from the official worked answers) solutions.
- `tools/` rebuilds the ENGAA data, and `tools/esat/` the NSAA/TMUA data and the mock allocation (`build_esat.py`, with a fixed seed).
