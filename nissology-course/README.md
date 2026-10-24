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
python3 tools/build.py                    # site/index.html
cd site && python3 -m http.server         # then open http://localhost:8000
```

## Data sources and licences

- Terrain and bathymetry: AWS Terrain Tiles (Mapzen terrarium: SRTM, EU-DEM, ETOPO1, GMTED and others). Land comes from high-zoom tiles; the seafloor comes from lower-zoom global bathymetry. Funafuti's reef rim and lagoon are reconstructed from islet positions, with a schematic −25 m lagoon. Each model states its limitations.
- Coastlines: Natural Earth via `world-atlas`.
- Papers are reproduced under their Creative Commons licences, with the changes stated on each cover page. Annotations are teaching commentary and are not endorsed by the authors or publishers.
