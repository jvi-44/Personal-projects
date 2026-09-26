# Frankenstein, scene by scene

Twelve isometric dollhouse dioramas from Mary Shelley's *Frankenstein; or, The Modern Prometheus*, printed as one simulated risograph sheet. The whole thing is `index.html`: one canvas, one chapter-card overlay and one script. It uses no images, fonts or libraries and makes no network requests beyond loading itself. Every room, person, wave and ink dot is drawn in code with Canvas 2D.

**Size:** `index.html` is **77683 bytes**.

## Controls
The sheet prints in, then the camera tours the book in order. Any input pauses the tour, and it resumes after about 9 s of idle.
Drag to pan (with inertia) · scroll or pinch to zoom at the cursor · double-click a scene to fly to it · arrow keys pan · `+`/`-` zoom · `0` fits the sheet · `C` toggles the chapter card.

## Scenes and quotes
Each quote is copied verbatim from the Project Gutenberg text (ebook #84) and was checked against it. Shelley's chapters have no titles, so each card pairs the chapter number with a short heading (the first card uses the letter's real heading).

| # | Chapter | Card heading | Scene | Quote |
|---|---|---|---|---|
| 1 | Letter IV | To Mrs. Saville, England | Walton's ship fast in the Arctic ice; Victor hauled in on his ice-fragment | "We perceived a low carriage, fixed on a sledge and drawn by dogs, pass on towards the north, at the distance of half a mile; a being which had the shape of a man, but apparently of gigantic stature, sat in the sledge and guided the dogs." |
| 2 | II | The Blasted Oak | Young Victor at the door at Belrive as lightning takes the oak | "As I stood at the door, on a sudden I beheld a stream of fire issue from an old and beautiful oak which stood about twenty yards from our house; and so soon as the dazzling light vanished, the oak had disappeared, and nothing remained but a blasted stump." |
| 3 | III | Ingolstadt | Waldman's lecture hall, the apparatus, the students | "So much has been done, exclaimed the soul of Frankenstein—more, far more, will I achieve; treading in the steps already marked, I will pioneer a new way, explore unknown powers, and unfold to the world the deepest mysteries of creation." |
| 4 | IV | The Workshop of Filthy Creation | The garret: jars, bones, the body under the sheet | "In a solitary chamber, or rather cell, at the top of the house, and separated from all the other apartments by a gallery and staircase, I kept my workshop of filthy creation." |
| 5 | V | A Dreary Night of November | The Creature wakes on the table; Victor recoils | "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet." |
| 6 | VII | The Storm | Lightning over the lake; the figure climbing Salève | "A flash of lightning illuminated the object, and discovered its shape plainly to me; its gigantic stature, and the deformity of its aspect more hideous than belongs to humanity, instantly informed me that it was the wretch, the filthy dæmon, to whom I had given life." |
| 7 | X | The Mer de Glace | The Creature crosses the glacier to plead with Victor | "I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous." |
| 8 | XII | The Cottagers | The De Laceys at home; the Creature at the pool | "I had admired the perfect forms of my cottagers—their grace, beauty, and delicate complexions; but how was I terrified when I viewed myself in a transparent pool!" |
| 9 | XV | De Lacey | At the blind man's knees as Felix, Safie and Agatha return | "I am an unfortunate and deserted creature, I look around and I have no relation or friend upon earth." |
| 10 | XX | The Orkneys | Victor tears apart the companion; the Creature at the casement | "I trembled and my heart failed within me, when, on looking up, I saw by the light of the moon the dæmon at the casement." |
| 11 | XXIII | Evian | The bridal chamber; the Creature at the window | "The murderous mark of the fiend's grasp was on her neck, and the breath had ceased to issue from her lips." |
| 12 | XXIV | The Ice Raft | Victor's coffin in Walton's cabin; the Creature drifts off on the ice | "He was soon borne away by the waves and lost in darkness and distance." |

**The Creature is in every scene**, the way the Claude spark is in every one of Kevin Ngo's rooms. Sometimes he is a character; sometimes he is hidden: on the far sledge, as a pale shape on the Jura, as the anatomical plate in the lecture hall, under the sheet, as a shadow on the wall, on a distant peak, reflected in the pool, and at the casement.

## The four inks
| Ink | RGB | Screen angle | Used for |
|---|---|---|---|
| Glacier Blue | 28, 74, 160 | 15° | ice, night, the lake |
| Galvanic Red | 228, 62, 46 | 75° | brick, fire, blood, warmth |
| Candle Yellow | 251, 193, 28 | 0° | candlelight, lightning, skin |
| Lamp Black | 40, 34, 36 | 45° | linework, shadow |

Greens, browns, greys and purples come only from overprinting these inks.

## How the print simulation works
1. **Separations.** Each scene is drawn once into four greyscale density layers, one per ink. A fill writes its density into the inks it uses and erases (`destination-out`) the others, so objects knock out whatever is behind them.
2. **Screening.** Each layer is converted per pixel into an AM halftone at its own screen angle. Dot area equals density, dot centres get small seeded jitter, and densities near 100 % become solids. A noise field then removes ink (dropout specks and uneven coverage), shifted differently for each plate.
3. **Press.** The screened plates are multiplied onto generated cream paper (grain and fibres), each with its own slight misregistration offset.
4. **Boil.** Every edge is subdivided and displaced by seeded value noise, and strokes are tapered polygons. Each scene is baked with three wobble seeds, and the sheet cycles them at 3 Hz. All randomness is seeded, so every load draws the same.
5. **Light is ink.** Candle pools, the moon, lightning flashes and the lecture lamp are stepped rings of flat halftone density, never gradients.
6. **Live layer.** People, flames, sparks, lightning, the falling oak and the drifting ice raft are drawn each frame on top of the cached tiles. Their fills are knocked out to paper, then overprinted with multiply using rotated dot-screen patterns at the same pitch and angles as the baked plates, so they look printed on the same press. They follow the same boil cycle.
7. **People.** All figures share one skeleton (pelvis, spine, neck, head, two 3-joint arms and legs) driven by keyframed clips: walk, carry, sit, read, climb, lie, rise, recoil, point, preach, pray, work, hammer, haul, lurk, guitar and more. Tapered, bulging limb volumes follow the joints and are dressed in coats with skirts that follow the thighs, dresses, hats and boots. At close zoom the faces show brows, noses, ears, mouths and hair; the Creature has stitches and De Lacey's eyes are closed.
8. **Sheet.** A 4×3 block with crop marks, cut marks, four-ink registration targets that show the misregistration, and two colour bars that are screened like everything else.

## Performance
Scenes are baked once, as 36 plates spread over the first frames (the print-in). After that, each frame blits the cached tiles and redraws only what moves in the visible tiles. Detail steps down when figures are small on screen. Tiles are 1152 px on desktop and 720 px on touch devices, and device pixel ratio is capped at 2.

Built by Claude, in the same format as Kevin Ngo's *A Small Light*. All code is original.
