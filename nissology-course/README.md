# Nissology: Islands of the Modern World

A guided, research-led online course in island studies. Seven units: foundations, six case studies and a capstone. Each case study has an interactive 3D terrain-and-bathymetry model, formation diagrams, and peer-reviewed readings with annotated study editions.

| Unit | Island | Type |
|---|---|---|
| 0 | Foundations | nissology, island typology, hotspots and Darwin's atolls, island biogeography |
| 1 | Funafuti, Tuvalu | atoll |
| 2 | Pitcairn Islands (Pitcairn and Henderson) | hotspot volcano and raised atoll |
| 3 | Falkland Islands | continental fragment |
| 4 | Tristan da Cunha | hotspot volcano |
| 5 | Surtsey, Iceland | new rift-zone volcanic island (1963) |
| 6 | Socotra, Yemen | continental fragment |
| 7 | Synthesis | comparison and capstone |

## Videos, photos and quizzes

- **40 narrated videos** (`site/media/video/*.mp4`, with WebVTT captions and posters): one per section plus a course trailer. Scripts are in `content/videos.py`. Each scene is animated in `tools/video/studio.html` (diagram build-ups, slow pans across photos, 3D terrain flyovers, globe zooms, timelines, animated statistics), rendered frame by frame with Playwright, narrated offline with Piper TTS (`en_US-lessac-high`) and encoded with ffmpeg.
- **Photographs** (`site/media/photos/`): expedition, survey, archive, satellite and traveller photographs from Wikimedia Commons (Creative Commons or public domain) and the NASA Image and Video Library. Every photo carries an in-video credit, and the course's Credits page lists its author, licence and source page. Sources are in `content/photos_src.py`; `tools/photos_fetch.py` writes the metadata to `content/photos.py`.
- **Quizzes** (`content/quizzes.py`): a 2-question check after each video, an 8-question end-of-unit quiz (multiple choice, multi-select, numeric and ordering questions, all with feedback), and model tasks that use the 3D terrain viewer.

## Readings

- **Annotated study editions** (`site/pdfs/*-annotated.pdf`): 11 openly licensed papers (CC BY / CC BY-NC). Each keeps the original article unaltered and adds a cover page with licence and attribution, colour-coded highlights with margin notes, and a reading guide at the end.
- **Companion guides**: 5 papers that are not openly licensed are not reproduced. The course gives a guide and links to the publisher or a free author copy.

Highlight colours: yellow = argument, green = evidence, blue = method, purple = concept, red = read critically, orange = course link.

## Layout

```
content/   readings.py (papers, annotations, guides) and units.py (course text)
web/       app.js, diagrams.js, styles.css, index.template.html
tools/     dem.py (heightmaps), annotate.py (annotated PDFs), build.py (assembles site/)
sources/   original open-access PDFs used to build the study editions
site/      the built course: open site/index.html through any static web server
```

## Rebuild

```bash
pip install pymupdf numpy pillow scipy matplotlib
python3 tools/dem.py tools/islands.json   # terrain + bathymetry heightmaps → site/data/dem
python3 tools/annotate.py                 # annotated PDFs + site/data/annotations.json
python3 tools/photos_fetch.py             # photographs + credits → site/media/photos, content/photos.py
python3 tools/video/make.py --jobs 3       # narration + rendering → site/media/video (needs piper-tts, a Piper voice
                                          #   in tools/video/voices/, node + playwright, ffmpeg)
python3 tools/build.py                    # site/index.html
cd site && python3 -m http.server         # then open http://localhost:8000
```

## Data sources and licences

- Terrain and bathymetry: AWS Terrain Tiles (Mapzen terrarium: SRTM, EU-DEM, ETOPO1, GMTED and others). Land comes from high-zoom tiles; the seafloor comes from lower-zoom global bathymetry. Funafuti's reef rim and lagoon are reconstructed from islet positions, with a schematic −25 m lagoon. Each model states its limitations.
- Coastlines: Natural Earth via `world-atlas`.
- Papers are reproduced under their Creative Commons licences, with the changes stated on each cover page. Annotations are teaching commentary and are not endorsed by the authors or publishers.
