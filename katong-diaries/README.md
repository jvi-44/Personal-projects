# Katong Diaries

A walkable 3D model of Joo Chiat, Katong and everything within 5 km of the Katong Square Starbucks
(the one in the old Joo Chiat Police Station), with a bucket list and visit journal built in.

- **3,598 places** inside the 5 km radius: cafés, restaurants, hawker centres, Pilates and fitness studios,
  shops, malls, things to do, heritage sites, parks and MRT stations. **219 are hand-picked** from 2026 guides
  and come with a short write-up, an insider tip, hours and sources.
- **22,026 buildings** and every street, drawn from OpenStreetMap. Shophouses get pastel fronts, five-foot ways
  and tiled double-pitch roofs; flats, houses, towers, flyovers and MRT viaducts each get their own treatment.
- **Three ways to look around**: a bird's-eye map, a third-person stroll with your avatar, and first-person
  street view at eye level.
- **Seven outfits** for the avatar, with skin and hair options.
- **Store directories for 16 malls**, including i12 Katong, Parkway Parade, Roxy Square, Katong V, PLQ and KINEX.
- **Eleven date ideas** (solo and with friends) that draw their route on the map.
- **Bucket list and journal**: save places, mark them visited, log the date, a rating, who you went with and a reflection.

## Run it

Any static file server works:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000/katong-diaries/` (or `index.html` in this folder). An internet connection is
needed once for the 3D library and fonts.

`app.html` is the same page in the form Claude publishes as an Artifact; `index.html` is generated from it by
`tools/make_index.py`.

## Where the data comes from

| What | Source |
| --- | --- |
| Streets, buildings, coastline, parks, most place pins | [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL), BBBike Singapore extract, 14 Nov 2026 |
| Hand-picked places and write-ups | The Ranting Panda, The Ordinary Patrons, Eatbook, TheSmartLocal, Honeycombers, Her World, Women's Weekly, City Nomads, Little Day Out, Lemon8, ClassPass (each card links its sources) |
| Mall directories | Official Parkway Parade and PLQ directories, SingMalls, guides and OpenStreetMap (Nov 2026) |
| Addresses to coordinates | OpenStreetMap addresses, then OneMap |

## What it is not

- It does not use Google Street View imagery. Google's terms do not allow copying that imagery into a model,
  and it needs a paid key. Facades are illustrated from each building's real footprint, height and type. Every
  card has a **Real Street View** link that opens Google Street View at that exact spot.
- Building heights are from OpenStreetMap where tagged and estimated elsewhere.
- Shops open and close. Check before you go.

## Rebuild the data

```bash
pip install osmium shapely beautifulsoup4 lxml
curl -o Singapore.osm.pbf https://download.bbbike.org/osm/bbbike/Singapore/Singapore.osm.pbf
python3 tools/extract.py Singapore.osm.pbf raw.json            # everything within 5.5 km
python3 tools/build_world.py raw.json out/                      # -> out/world.js, out/geo_index.json
python3 tools/osm_pois.py raw.json out/pois_osm.json            # categorise OpenStreetMap places
python3 tools/build_places.py raw.json out/geo_index.json out/pois_osm.json \
    tools/malls_singmalls.json tools/malls_official.json tools data/places.js out/onemap_cache.json
python3 tools/make_index.py
```

Hand-picked places live in `tools/curated_food.json` and `tools/curated_life.json`; date ideas in `tools/dates.json`.
