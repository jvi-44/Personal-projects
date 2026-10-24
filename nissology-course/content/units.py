"""Course units. Section bodies are small HTML fragments rendered by web/app.js.

Conventions inside bodies:
  <figure data-diagram="name">   is replaced by the SVG diagram of that name (web/diagrams.js)
  <figure data-chart="name">     is replaced by an interactive chart (web/app.js)
  <a data-reading="id">          opens the reader for that reading
"""

COURSE = dict(
    title="Nissology",
    subtitle="Islands of the Modern World",
    blurb=("A guided, research-led course in island studies. Six deep case studies, from a Pacific atoll to a rifted fragment "
           "of Arabia, ask how islands form, what lives on them, and who gets to tell their story. Most of your time goes "
           "into peer-reviewed research papers, read with annotated study editions and guided reading routes."),
    hours="About 40–50 study hours: 7 units of 5–7 hours each, plus a capstone.",
    outcomes=[
        "Classify any island by geological origin and explain the processes that built it and will eventually destroy it.",
        "Read a research paper in physical geography or island ecology critically: identify its claim, method, evidence, uncertainty and scope.",
        "Use terrain and bathymetry models to measure and interpret island landforms and the edifices beneath them.",
        "Apply island biogeography theory (MacArthur–Wilson, the General Dynamic Model, the island rule) to real data.",
        "Connect physical change to history, governance and culture, and evaluate whose knowledge counts in island research.",
    ],
    how=[
        ("Work through the units in order.", "Unit 0 builds the vocabulary and theory that every case study uses."),
        ("Read the papers with the reader open.", "Each annotated paper has colour-coded highlights. Click one to read the note and see how it connects to the course."),
        ("Use the 3D models as instruments.", "Change the vertical exaggeration, lower or raise the sea, and draw a profile to measure slopes and depths."),
        ("Write as you go.", "Each unit ends with seminar questions and a short assignment. The capstone draws them together."),
    ],
)

UNITS = [
# =====================================================================
dict(
    id="foundations", num=0, short="Foundations", title="What is an island, and how do we study one?",
    kicker="Theory and method",
    summary="The vocabulary of nissology, the physical life cycle of islands, and the theory of island biogeography. These are the tools for every case study that follows.",
    objectives=[
        "Define nissology and explain the debate over studying islands 'on their own terms'.",
        "Distinguish continental, continental-fragment, volcanic, coral and raised-coral islands by origin.",
        "Explain hotspot island chains, lithospheric subsidence and Darwin's theory of atoll formation.",
        "Predict species richness using MacArthur–Wilson equilibrium theory, and say where the General Dynamic Model improves on it.",
    ],
    sections=[
        ("Nissology: the study of islands", """
<p>The word <em>nissology</em> (from Greek <em>nisos</em>, island) was proposed by the anthropologist Grant McCall in 1994 to name 'the study of islands on their own terms'. It grew out of a Pacific critique: development agencies and mainland scholars tended to describe islands by what they lack (size, resources, connection). The Tongan writer Epeli Hau'ofa answered in the same year with 'Our Sea of Islands', which recast Oceania as a connected world of voyaging rather than scattered specks in an empty ocean.</p>
<p>Island studies has since become an institutional field, with the International Small Island Studies Association (1992), <em>Island Studies Journal</em> (2006) and <em>Shima</em> (2007). It is interdisciplinary by necessity. This course weights physical geography and ecology most heavily, then history and culture, but the two foundation readings are about method and ethics, because they shape how you should read everything else.</p>
<p>Two ideas recur through the course:</p>
<ul>
<li><strong>Islandness</strong>: boundedness and isolation do not <em>determine</em> what happens on islands, but they 'contour and condition' it (Baldacchino). Every time a paper attributes something to 'isolation', ask what the mechanism is.</li>
<li><strong>Whose terms?</strong> Most research on small islands is produced by outsiders. That does not make it wrong, but it shapes which questions get asked.</li>
</ul>
<p>Readings: <a data-reading="baldacchino2008">Baldacchino (2008)</a> and <a data-reading="grydehoj2017">Grydehøj (2017)</a>.</p>
"""),
        ("A physical typology of islands", """
<p>Geographers classify islands first by the crust they stand on and the process that raised them above sea level. The classification predicts much else: the rocks, soils, relief, age, and even the kind of biota an island can hold.</p>
<figure data-diagram="typology"></figure>
<div class="table-wrap"><table>
<thead><tr><th>Type</th><th>Crust and origin</th><th>Typical traits</th><th>Course example</th></tr></thead>
<tbody>
<tr><td>Continental shelf ('land-bridge') island</td><td>Continental crust on a shelf; joined to the mainland at glacial lowstands</td><td>Mainland-like biota; old rocks</td><td>Britain (context only)</td></tr>
<tr><td>Continental fragment (microcontinent)</td><td>Piece of continental crust rifted away from a larger landmass</td><td>Ancient rocks; relict lineages; long isolation</td><td><a href="#socotra">Socotra</a>, <a href="#falklands">Falklands</a></td></tr>
<tr><td>Oceanic volcanic island: hotspot</td><td>Basaltic volcano built on ocean crust over a mantle plume</td><td>Young, high, steep; built from the abyss; never connected to land</td><td><a href="#tristan">Tristan da Cunha</a>, <a href="#pitcairn">Pitcairn</a></td></tr>
<tr><td>Oceanic volcanic island: ridge or rift</td><td>Volcano on or near a spreading ridge</td><td>Very young; frequent eruptions</td><td><a href="#surtsey">Surtsey</a></td></tr>
<tr><td>Atoll and reef islands</td><td>Carbonate reef on a subsided volcano; islets (motu) of reef sediment</td><td>Low (a few metres); ring-shaped; mobile shorelines</td><td><a href="#funafuti">Funafuti</a>, Oeno, Ducie</td></tr>
<tr><td>Raised (uplifted) atoll</td><td>Former atoll lifted by tectonics or flexure</td><td>Limestone plateau and cliffs; karst</td><td><a href="#pitcairn">Henderson</a></td></tr>
</tbody></table></div>
<p>Two cautions. First, many islands are composite: Socotra's limestone plateaux sit on Precambrian granite, and Tristan's 'shield or composite volcano' label is disputed (Geissler et al. 2020). Second, sea level matters. During the Last Glacial Maximum (about 21,000 years ago) the sea stood about 120–130 m lower, joining shelf islands to continents and turning atolls into limestone hills.</p>
"""),
        ("The life cycle of an oceanic island", """
<p>J. Tuzo Wilson's hotspot hypothesis (1963) explains why oceanic islands form chains that age in one direction. A plume of hot mantle stays roughly fixed while the plate moves over it. Each volcano grows over the plume, is carried away, cools, and sinks.</p>
<figure data-diagram="hotspot"></figure>
<p>Why do old volcanoes sink? The oceanic plate thickens and becomes denser as it cools (thermal subsidence), and the weight of the volcano itself bends the plate down (flexure). Flexure also raises a <em>bulge</em> some distance away. That is how Pitcairn's growth lifted Henderson Island about 30 m out of the sea (Unit 2).</p>
<p>In 1842 Charles Darwin argued that coral reefs record this subsidence. Corals grow only in the sunlit upper few tens of metres. If a volcanic island slowly sinks, a fringing reef keeps growing upward and becomes a barrier reef around a shrinking peak, and eventually an atoll ring with no peak at all.</p>
<figure data-diagram="darwin"></figure>
<p>Darwin's theory waited more than a century for proof. The Royal Society drilled Funafuti in 1896–98 and passed through about 340 m of reef limestone without reaching volcanic rock, which was suggestive but not conclusive. In 1952 boreholes on Enewetak in the Marshall Islands finally hit basalt beneath more than 1,200 m of reef limestone. Carried far enough, the cycle ends with a <em>guyot</em>: a flat-topped seamount, drowned when reef growth could no longer keep up.</p>
"""),
        ("Island biogeography: MacArthur–Wilson and beyond", """
<p>Robert MacArthur and E. O. Wilson's equilibrium theory (1963, 1967) treats an island's species number as a balance between two rates. <strong>Immigration</strong> falls as an island fills up (fewer of the mainland's species are left to arrive) and is lower for distant islands. <strong>Extinction</strong> rises as more species compete for space, and is higher on small islands with smaller populations. Where the curves cross is the equilibrium richness, Ŝ.</p>
<figure data-chart="mw"></figure>
<p>The theory predicts the empirical species–area relationship, <span class="mono">S = cA<sup>z</sup></span>. On islands, <span class="mono">z</span> is typically about 0.2–0.35, so a tenfold increase in area roughly doubles the species count.</p>
<p>The General Dynamic Model (Whittaker, Triantis &amp; Ladle 2008) adds geological time. A volcanic island is born, grows in area and relief (more habitats, more speciation), then erodes and subsides. Predicted richness and endemism rise and then fall over the island's life. Surtsey (Unit 5), still shrinking only decades after its birth, is the GDM's fastest-moving test case.</p>
<figure data-diagram="gdm"></figure>
<p>A third idea, the <strong>island rule</strong> (Foster 1964; Van Valen 1973), says island populations of small animals tend to evolve larger and those of large animals smaller. Unit 6 reads a direct test of it.</p>
<p>All three theories are idealisations. Real islands receive <em>subsidies</em> such as seabird guano (Surtsey), carry species introduced by people (Henderson's rats), and some, like the Falklands, were once linked to land. Treat the theories as null models to compare cases against.</p>
"""),
        ("How to read a research paper in this course", """
<p>About two-thirds of your study time is spent reading peer-reviewed papers. Use the same five questions for each:</p>
<ol>
<li><strong>Claim.</strong> What is the paper's single most important assertion? Can you state it in one sentence?</li>
<li><strong>Method.</strong> What was measured, where, when, and with what instrument or model? What is the sample?</li>
<li><strong>Evidence.</strong> Which figure or table carries the claim? Does the arithmetic hold?</li>
<li><strong>Uncertainty.</strong> What error bars, detection limits or alternative explanations are given, and which are missing?</li>
<li><strong>Scope.</strong> To which islands, periods and conditions does the result apply? Where do the authors move from finding to recommendation?</li>
</ol>
<p>The annotated study editions use a colour code that maps onto these questions:</p>
<div class="legend-grid" data-legend></div>
<p>Hosted papers are openly licensed and appear in full with annotations. A few essential papers are not openly licensed, so the course gives a companion guide and links to the publisher or a free author copy. Both kinds open in the reader.</p>
"""),
    ],
    readings=["baldacchino2008", "grydehoj2017"],
    assignment=("Island typology brief (600 words)",
        "Choose any island not covered in this course. Classify it with the typology table, sketch its origin, and predict its species richness relative to a similar-sized island of a different type. Justify each step with a mechanism, not just a label."),
    seminar=[
        "Is 'island' a natural category or a cultural one? Use the fractal argument in Baldacchino (2008, p. 47).",
        "Why does equilibrium theory struggle with very young or very old islands? Use the GDM curve.",
        "Darwin reasoned about subsidence without seeing below the reefs. What made his inference strong, and what made it vulnerable?",
    ],
),
# =====================================================================
dict(
    id="funafuti", num=1, short="Funafuti", title="Funafuti Atoll, Tuvalu",
    kicker="Atolls and reef islands", island_type="Atoll (reef islands on a subsided volcano)",
    coords="8°31′S 179°12′E",
    facts=[("Sovereignty", "Tuvalu (independent since 1978); capital atoll"),
           ("Islands", "29 reef islands (motu) on the atoll rim"),
           ("Land area", "≈2.6 km² (261 ha, Kench et al. 2018)"),
           ("Lagoon", "Te Namo, ≈18 × 14 km; tens of metres deep"),
           ("Elevation", "Mostly below 3 m above mean sea level"),
           ("People", "About half of Tuvalu's ≈10,600 people live on Fogafale")],
    summary="A ring of low sand-and-rubble islets on a drowned volcano, home to a nation's capital. The physical question is whether reef islands drown, erode, or keep pace with a rising sea. The human question is who decides what happens next.",
    objectives=[
        "Explain atoll formation from Darwin to the Funafuti and Enewetak boreholes.",
        "Describe the anatomy of a reef island and its freshwater lens.",
        "Evaluate Kench et al. (2018)'s evidence that Tuvalu's islands have grown, and check its arithmetic.",
        "Connect geomorphic change to Tuvaluan adaptation, migration and statehood policy.",
    ],
    model=dict(dem="funafuti", exaggeration=6, note="Terrain: the reef rim and lagoon are reconstructed from islet positions in the elevation data, with a reef flat at −0.6 m and a uniform lagoon floor at −25 m for display. Real lagoon depths vary. Islet heights are capped at 5 m. Ocean depths come from global bathymetry and are coarse.",
        labels=[(-8.52, 179.197, "Fogafale", "Capital islet; airstrip built in 1943"),
                (-8.53, 179.12, "Te Namo lagoon", ""),
                (-8.55, 179.045, "Western rim", "Funafuti Conservation Area; Tepuka, Fualifeke"),
                (-8.64, 179.11, "Southern islets", ""),
                (-8.33, 179.30, "Ocean floor", "≈ −4,500 m")]),
    sections=[
        ("Formation: a reef on a sinking volcano", """
<p>Funafuti is a classic Darwinian atoll: a ring of living reef about 20 km across, enclosing a lagoon, on top of an extinct volcano that has subsided far below sea level. Turn off the sea surface in the 3D model and the shape appears: a steep-sided cone rising over 4 km from the ocean floor, with a flat carbonate cap.</p>
<p>Funafuti has a special place in the history of science. To test Darwin's theory, the Royal Society's Coral Reef Committee sent three expeditions (1896–98). By the third expedition (1898) the borehole had reached about 1,114 ft (340 m), through nothing but reef limestone and dolomite. That was consistent with subsidence but not proof, since no basalt was reached. The full test came at Enewetak in 1952.</p>
<p>The islands themselves are much younger than the reef. Reef islands (motu) are deposits of sand, gravel and rubble made by reef organisms (corals, coralline algae, molluscs and large benthic foraminifera) and heaped up by waves on the reef flat. Most formed within the last few thousand years, after the sea fell slightly from a mid-Holocene highstand and exposed reef flats as building platforms.</p>
<figure data-diagram="motu"></figure>
"""),
        ("Landforms of the atoll rim", """
<ul>
<li><strong>Ocean reef slope and crest.</strong> The reef front plunges steeply into deep water. The crest, often cemented by coralline algae, breaks the waves.</li>
<li><strong>Reef flat.</strong> A shallow platform, a few hundred metres wide, exposed at low spring tides. This is where waves move sediment.</li>
<li><strong>Storm ridges and rubble ramparts.</strong> Cyclone Bebe (1972) threw up a rubble bank along Funafuti's eastern reef. Kench et al. (2018) show that this material was later reworked into island shorelines.</li>
<li><strong>Motu and hoa.</strong> Islets separated by shallow channels (hoa) through which the ocean exchanges with the lagoon.</li>
<li><strong>Beachrock and conglomerate.</strong> Cemented beach deposits that record former shorelines and serve as fixed ground-control points in remote sensing.</li>
<li><strong>Lagoon.</strong> Te Namo has patch reefs, sandy floors and deep passages through the rim.</li>
</ul>
<p>Fresh water on an atoll is held in a <strong>freshwater lens</strong> floating on denser seawater inside the porous limestone. By the Ghyben–Herzberg relation, the lens extends about 40 m below sea level for every 1 m that the water table stands above it. On a narrow islet this makes fresh water thin and fragile. Overwash, drought and over-pumping can salinise it, and on Fogafale, pits dug for wartime airfield fill and for growing pulaka (giant swamp taro) expose the lens directly.</p>
"""),
        ("Data exercise: does the table add up?", """
<p>Table 1 of <a data-reading="kench2018">Kench et al. (2018)</a> reports land-area change for each of Tuvalu's nine atolls and reef platforms between 1971 and 2014. The chart below plots the table's figures as percentage change, computed from the hectare columns.</p>
<figure data-chart="kench"></figure>
<ol>
<li>Sum the hectare changes. Do they equal the headline +73.5 ha? (By our arithmetic the nine rows sum to about +63.1 ha.)</li>
<li>The text gives island-level totals: +80.7 ha gained and −7.24 ha lost, a net of +73.46 ha. Suggest two reasons why the atoll and island totals might differ, and say how you would check them with Supplementary Data 1.</li>
<li>Nanumea's % column shows −0.004 while −1.32/356.1 is −0.37%. Which is more likely to be a typo, and does it matter for the paper's argument?</li>
</ol>
<p>This exercise is not about catching the authors out. Checking arithmetic is a normal part of reading a paper closely, and small inconsistencies are common in published tables. What matters is whether they change the conclusion. Here they do not: under every reading, most islands grew.</p>
"""),
        ("Ecology", """
<p>Atoll ecosystems are built on a paradox: some of the most productive ecosystems on Earth (coral reefs) sit beside some of the poorest terrestrial ones (thin, alkaline, nutrient-poor carbonate soils). Terrestrial life is dominated by a small, widely dispersed strand flora and by coconut palms and breadfruit introduced by voyagers.</p>
<ul>
<li><strong>The reef as sediment factory.</strong> Island persistence depends on reef organisms continuing to produce carbonate. Bleaching, acidification and pollution therefore threaten islands, not only fish.</li>
<li><strong>Seabirds and turtles.</strong> The uninhabited western islets, inside the Funafuti Conservation Area (established 1996), support seabird roosts and nesting and green turtle nesting.</li>
<li><strong>Human ecology.</strong> Pulaka pits, coconut groves and lagoon fisheries make up a cultivated landscape. Salinisation of pulaka pits is one of the first visible effects of sea-level rise.</li>
</ul>
"""),
        ("History", """
<p>Tuvalu was settled by Polynesian voyagers, with strong links to Samoa and Tonga, at least 2,000 years ago. Tuvaluan is a Polynesian language; Nui speaks a language related to Gilbertese. In 1819 the American captain Arent de Peyster named Funafuti 'Ellice's Island', and the archipelago became the Ellice Islands. The 1860s brought Peruvian slave raiders ('blackbirders'), who took people from Funafuti and Nukulaelae, and Samoan pastors of the London Missionary Society, who made Christianity central to island life.</p>
<p>Britain declared a protectorate in 1892, and the islands became part of the Gilbert and Ellice Islands Colony in 1916. In 1942–43 United States forces built an airfield across Fogafale, filling and excavating land on a scale still visible. After a 1974 referendum the Ellice Islands separated from the Gilberts (now Kiribati), and Tuvalu became independent on 1 October 1978.</p>
"""),
        ("People, culture and politics", """
<p>Each island community is governed through its <em>falekaupule</em>, the traditional assembly of elders, alongside a national parliament. Land is held by kin groups, which makes moving within the country socially complicated even where land is physically available, a point Kench et al. raise when they suggest internal migration as an adaptation pathway. The <em>fatele</em>, a dance-song form performed at community celebrations, is central to Tuvaluan cultural life.</p>
<p>Tuvalu has become a global symbol of climate vulnerability, a framing Baldacchino calls the 'victimhood' dilemma and Farbotko the 'eco-colonial gaze'. Tuvaluans have also worked the framing to their advantage on the diplomatic stage. Recent steps include land reclamation on Fogafale under the Tuvalu Coastal Adaptation Project, a 2023 constitutional amendment affirming that Tuvalu's statehood continues regardless of physical change, and the Falepili Union treaty with Australia (signed 2023), which opens a migration pathway. Each responds to a physical prediction. Kench et al. ask whether that prediction should be loss.</p>
"""),
    ],
    readings=["kench2018", "masselink2020"],
    assignment=("Policy brief (800 words)",
        "Write a brief for Tuvalu's government on whether to prioritise seawalls, reclamation, internal migration or international migration. Base the physical claims on Kench et al. (2018) and Masselink et al. (2020), and state clearly where you move from evidence to judgement."),
    seminar=[
        "If islands can grow while the sea rises, why are Tuvaluans still worried? List the non-land factors of habitability.",
        "Kench et al. use the vegetation edge as the shoreline. What would happen to their results if people cleared vegetation along a shore?",
        "Is the 'sinking islands' story harmful to Tuvaluans, useful to them, or both?",
    ],
),
# =====================================================================
dict(
    id="pitcairn", num=2, short="Pitcairn", title="The Pitcairn Islands",
    kicker="Hotspot island, raised atoll and two low atolls", island_type="Volcanic high island (Pitcairn); raised atoll (Henderson); atolls (Oeno, Ducie)",
    coords="25°04′S 130°06′W",
    facts=[("Sovereignty", "UK Overseas Territory"),
           ("Islands", "Pitcairn, Henderson, Oeno, Ducie: 43 km² of land in total"),
           ("Pitcairn", "≈4.5 km²; summit ≈340 m; the only inhabited island"),
           ("Henderson", "≈43 km²; plateau ≈30–33 m; World Heritage Site (1988)"),
           ("People", "About 40, almost all descended from the Bounty settlers"),
           ("Sea", "Marine reserve ≈834,000 km², one of the world's largest")],
    summary="Four islands at different stages of the oceanic life cycle: a young volcano, an uplifted atoll, and two low atolls. Pitcairn's history is famous; Henderson's ecology and its plastic-covered beaches are less well known.",
    objectives=[
        "Explain how volcanic loading at Pitcairn raised Henderson through lithospheric flexure.",
        "Compare reef ecosystems across island types using Friedlander et al. (2014).",
        "Evaluate a conservation failure (the 2011 rat eradication) with genetic evidence.",
        "Trace Pitcairn's history from Polynesian occupation through the Bounty to the present.",
    ],
    model=dict(dem="pitcairn", alt="henderson", exaggeration=2, zoom=0.55, note="Terrain: land from satellite elevation data; Pitcairn's coastal cliffs are approximate. Ocean depths come from coarse global bathymetry, so the submarine slopes are smoother than reality. Henderson's plateau is capped at 34 m to remove spurious spikes in the source data.",
        labels=[(-25.066, -130.101, "Adamstown", "Settlement on a terrace above Bounty Bay"),
                (-25.0685, -130.113, "Highest ridge", "≈340 m"),
                (-25.064, -130.093, "Bounty Bay", "Where the mutineers burned HMS Bounty, 1790")],
        alt_labels=[(-24.33, -128.33, "North Beach", "Plastic survey site (Lavers & Bond 2017)"),
                    (-24.37, -128.29, "East Beach", ""),
                    (-24.37, -128.325, "Plateau", "Former lagoon floor, ≈30 m")]),
    sections=[
        ("Formation: one hotspot, four islands", """
<p>The Pitcairn Islands are the emergent tops of a volcanic chain that rose from the seafloor between about 16 and 0.9 million years ago. Friedlander et al. (2014) give approximate ages of Oeno 16 Ma, Henderson 13 Ma, Ducie 8 Ma and Pitcairn 0.8 Ma. Pitcairn is the youngest; the hotspot's current activity lies at submarine volcanoes to its east-southeast. The islands do not line up in a simple age sequence, because Pitcairn sits on a separate, more southerly volcanic ridge from the other three.</p>
<p>The four islands show four stages of the life cycle in one archipelago:</p>
<ul>
<li><strong>Pitcairn</strong>: a young, eroding volcanic high island with almost no reef.</li>
<li><strong>Henderson</strong>: a former atoll lifted about 30 m.</li>
<li><strong>Oeno</strong> and <strong>Ducie</strong>: low atolls. Ducie is the world's most southerly atoll.</li>
</ul>
<p>Henderson's uplift is the most instructive part. When Pitcairn grew (0.8–0.9 Ma), its weight bent the oceanic plate down beneath it and pushed up a flexural bulge about 200 km away, where Henderson lay. The old lagoon became a raised plateau, and the old reef rim became a ring of limestone cliffs, notched by former sea levels.</p>
<figure data-diagram="flexure"></figure>
"""),
        ("Landforms", """
<p><strong>Pitcairn</strong> is a volcano dissected by steep valleys. Adamstown sits on a terrace about 120 m above Bounty Bay, reached by a road called the Hill of Difficulty. There is no natural harbour and no fringing reef to speak of. Landings are made by longboat through the surf, which has shaped island life as much as any law.</p>
<p><strong>Henderson</strong> is limestone throughout: a karst plateau of jagged, honeycombed rock (makatea) under dense forest, edged by cliffs and caves. Beaches occur only on the north and east coasts. There is no permanent surface water, which helps explain why Polynesian settlement there was marginal and short-lived.</p>
<p><strong>Oeno</strong> and <strong>Ducie</strong> are low reef rings with lagoons and a few sandy islets, much like Funafuti but uninhabited.</p>
"""),
        ("Ecology: endemics, rats and plastic", """
<p>Henderson is one of the least-disturbed raised atolls in the world. It has four endemic land birds: the flightless Henderson crake, the Henderson fruit dove, the Henderson lorikeet and the Henderson reed warbler. It is also the only breeding site of the Henderson petrel. Its threats arrived by sea:</p>
<ul>
<li><strong>Pacific rats</strong> (<em>Rattus exulans</em>), brought by Polynesian voyagers about 800 years ago, eat petrel chicks. The 2011 eradication killed all but an estimated 60–80 animals, and the population recovered. Read <a data-reading="amos2016">Amos et al. (2016)</a>.</li>
<li><strong>Plastic</strong> carried by the South Pacific Gyre has given Henderson's beaches one of the highest debris densities ever measured. Read the companion guide to <a data-reading="lavers2017">Lavers &amp; Bond (2017)</a>.</li>
</ul>
<p>Offshore, the reefs show how island type shapes marine ecology. Ducie has 56% coral cover and fish biomass dominated by top predators. Pitcairn, the only high and inhabited island, has reefs dominated by algae and herbivorous fish, linked to runoff and fishing. Read <a data-reading="friedlander2014">Friedlander et al. (2014)</a>.</p>
<figure data-chart="coralage"></figure>
"""),
        ("History", """
<p>Polynesians lived on Pitcairn and Henderson for several centuries before Europeans arrived. They left house sites, burials, petroglyphs and stone tools. Pitcairn's fine-grained basalt and volcanic glass were exchanged with Mangareva (Gambier Islands) and Henderson, forming a small inter-island network (Weisler 1994). When exchange with Mangareva collapsed, probably in the 15th–16th centuries, these marginal islands were abandoned. Europeans found them empty.</p>
<p>Philip Carteret sighted Pitcairn in 1767 from HMS <em>Swallow</em> and named it after the midshipman who first saw it. He recorded its longitude wrongly, which made it an ideal hiding place. After the mutiny on HMS <em>Bounty</em> in April 1789, Fletcher Christian took eight other mutineers, six Polynesian men and about a dozen Polynesian women (and a baby) to Pitcairn, where they burned the ship in January 1790. Within a few years most of the men had been killed in violence over land and women. The American sealer <em>Topaz</em> found the community in 1808, by which time John Adams was the only surviving mutineer.</p>
<p>The community outgrew the island. In 1856 all 193 people moved to Norfolk Island, and some families returned in 1859 and 1864. Pitcairn became a British colony and has remained a UK territory. In 2004 a series of trials for historic sexual offences led to the conviction of several island men. The case divided the community and raised questions about law, jurisdiction and governance that the island still lives with.</p>
"""),
        ("People and culture", """
<p>Pitcairners speak English and <strong>Pitkern</strong>, a creole of 18th-century English and Tahitian. Most belong to the Seventh-day Adventist church, which the whole community adopted in the 1880s. The economy is small: honey, handicrafts, postage stamps, the '.pn' internet domain, and visits by cruise ships when the sea allows a landing.</p>
<p>Population decline is the island's main concern. With about 40 residents, many of them older, running the longboats, the council and the school is hard. Immigration has been invited but has rarely lasted. Pitcairn is a sharp example of Baldacchino's 'autonomy without sovereignty' and of McCall's point that islands are places people leave as well as places they stay.</p>
"""),
    ],
    readings=["friedlander2014", "amos2016", "lavers2017"],
    assignment=("Comparative profile (900 words)",
        "Compare Pitcairn and Henderson as physical and human places: origin, landforms, ecology, human history and current threats. End with a paragraph on why one is inhabited and the other is not."),
    seminar=[
        "Friedlander et al. call the Pitcairn Islands 'one of the least impacted' places in the Pacific, yet Henderson holds 37.7 million pieces of plastic and Polynesian rats. What does 'pristine' mean?",
        "Was the 2011 eradication a failure? Use the genetic estimate of 60–80 survivors to argue both ways.",
        "How did Pitcairn's physical geography (no harbour, steep relief, isolation) shape the Bounty community's history?",
    ],
),
# =====================================================================
dict(
    id="falklands", num=3, short="Falklands", title="The Falkland Islands",
    kicker="A rifted continental fragment in the cold South Atlantic", island_type="Continental fragment (microplate on the Falkland Plateau)",
    coords="51°42′S 59°00′W",
    facts=[("Sovereignty", "UK Overseas Territory; claimed by Argentina as the Islas Malvinas"),
           ("Islands", "East and West Falkland plus about 776 smaller islands"),
           ("Land area", "≈12,000 km²"),
           ("Highest point", "Mount Usborne, 705 m"),
           ("People", "≈3,600 (about 2,500 in Stanley)"),
           ("Climate", "Cool, windy, oceanic; ≈600 mm rain a year; no native trees")],
    summary="Old continental rocks that once lay against southern Africa, covered in peat and crossed by rivers of boulders. The Falklands have no native trees and had one native land mammal, now extinct. New evidence suggests people reached them centuries before Europeans.",
    objectives=[
        "Explain the Falklands' continental origin and the microplate-rotation hypothesis.",
        "Describe stone runs and peatlands, and evaluate their dating evidence.",
        "Assess multi-proxy evidence for a pre-European human presence (Hamley et al. 2021).",
        "Relate the islands' physical setting to their contested political history.",
    ],
    model=dict(dem="falklands", exaggeration=12, note="Terrain at about 540 m resolution, so peaks appear lower than their true heights (Mount Usborne shows as about 500 m). Use the sea-level slider: at −125 m, roughly the Last Glacial Maximum, much of the shallow plateau around the islands becomes land.",
        labels=[(-51.695, -58.84, "Mount Usborne", "705 m, highest point"),
                (-51.57, -60.07, "Mount Adam", "West Falkland"),
                (-51.69, -57.86, "Stanley", "Capital"),
                (-51.75, -59.33, "Falkland Sound", ""),
                (-52.0, -59.1, "Lafonia", "Low ground on younger rocks"),
                (-51.72, -61.29, "New Island", "Bone piles and charcoal record (Hamley et al. 2021)")]),
    sections=[
        ("Formation: a piece of Africa?", """
<p>Unlike every other island in this course, the Falklands are built of continental crust, and old crust at that. The oldest rocks, the Cape Meredith Complex in the far south of West Falkland, are about a billion years old. Above them lie thick Silurian–Devonian quartzites and sandstones (the hard rock of the stone runs and the mountain ridges), then Carboniferous–Permian sediments including a glacial tillite.</p>
<p>That sequence closely matches the Cape Supergroup and the Karoo Basin of South Africa, including the Dwyka tillite left by the late Palaeozoic ice age. The widely supported explanation is that the Falklands block lay off south-eastern Africa within Gondwana, broke away during the Jurassic breakup, and rotated by roughly 180° as it moved to its present position on the Falkland Plateau. Palaeomagnetic data from Jurassic dykes and the fold structures support the rotation. Details of timing and amount remain debated.</p>
<figure data-diagram="falklands_rotation"></figure>
<p>The same breakup that freed the Falklands block also opened the South Atlantic, which the Tristan plume began to feed about 132 million years ago (Unit 4).</p>
"""),
        ("Landforms: stone runs, peat and drowned valleys", """
<p><strong>Stone runs</strong> are the Falklands' signature landform: streams and sheets of angular quartzite boulders, up to several kilometres long, filling valley floors and spreading over hillsides, with little fine sediment at the surface. Darwin described them in 1833–34 and puzzled over their origin. Most researchers now treat them as relict periglacial features. Frost-shattered quartzite moved downslope over frozen ground during cold stages, and finer material was later washed out from between the boulders.</p>
<p>Dating has pushed their age back. Cosmogenic-nuclide exposure ages suggest the largest runs are composite landforms built over several cold stages, perhaps over 700,000 years (<a data-reading="wilson2008">Wilson et al. 2008</a>). Luminescence dating of sediment beneath two runs suggests movement continued until about 16,000 years ago.</p>
<p>The higher mountains (Mount Usborne, Mount Adam) carry small glacial cirques, but the islands were never covered by an ice sheet. <strong>Peat</strong> blankets much of the land, up to several metres deep. It is fuel, an archive of past environments (Hamley's charcoal records come from it), and a store of carbon. Coastal <strong>tussac grass</strong> grows on peat pedestals up to 3.5 m high. The coast is deeply indented with sounds and creeks, valleys drowned by the post-glacial rise in sea level.</p>
"""),
        ("Ecology", """
<p>The Falklands lie where the cold, nutrient-rich Falkland Current meets the South American shelf. The sea is extraordinarily productive, while the land, with its wind, peat and lack of trees, is not.</p>
<ul>
<li><strong>Seabirds.</strong> The islands hold most of the world's black-browed albatrosses (commonly estimated at about 70%), large colonies of gentoo, southern rockhopper and Magellanic penguins, and king penguins at Volunteer Point.</li>
<li><strong>Endemics.</strong> The flightless Falkland steamer duck and Cobb's wren are endemic, and the striated caracara ('Johnny rook') has its stronghold here.</li>
<li><strong>The warrah</strong> (<em>Dusicyon australis</em>), the only native land mammal, a fox-like canid, was hunted to extinction by 1876. Its origin is the subject of two of this unit's readings.</li>
<li><strong>Human impact.</strong> Since the 19th century, sheep grazing has destroyed most of the original tussac and degraded large areas of grassland. Rats and cats have removed ground-nesting birds from many islands, and restoration focuses on outer islands that are free of them.</li>
</ul>
"""),
        ("History: before and after 1690", """
<p>The standard history begins with disputed 16th-century sightings and the first recorded landing, by John Strong in 1690, who named Falkland Sound after Viscount Falkland. <a data-reading="hamley2021">Hamley et al. (2021)</a> argue that people were there earlier: bone piles and charcoal on New Island point to visits by seafaring Indigenous people from Tierra del Fuego around 1275–1420 CE. The warrah's origin is tied to this question. <a data-reading="austin2013">Austin et al. (2013)</a> showed it split from a mainland relative only about 16,000 years ago, during the last glaciation.</p>
<p>The colonial history is famously tangled. France founded Port Louis in 1764, and Britain founded Port Egmont in 1765–66. Spain bought out the French in 1767, and Britain withdrew in 1774 while keeping its claim. After Spain left in 1811, the United Provinces of the Río de la Plata (later Argentina) asserted sovereignty and backed a settlement under Luis Vernet. Britain re-established control in 1833, the root of the present dispute. In 1982 Argentina invaded, and the 74-day war that followed cost about 900 lives, including three islanders. A 2013 referendum returned 99.8% in favour of remaining a British territory.</p>
"""),
        ("People and culture", """
<p>Falkland Islanders are a small, mostly British-descended community of about 3,600 people, joined by people from St Helena, Chile and elsewhere. Life divides between Stanley and 'Camp' (from Spanish <em>campo</em>), the countryside of sheep farms and settlements linked by rough tracks and small aircraft. Falklands English borrows from Spanish and from sailors' speech, and peat-cutting, horse culture and the annual sports meetings are long-standing traditions.</p>
<p>Since a fisheries zone was declared in 1986, licences for squid fishing have transformed a wool economy into one of the richest per-capita territories in the region. Offshore oil is a possibility. The Falklands are a strong example of Baldacchino's 'culture of loyalty' and 'autonomy without sovereignty', and of how a contested history shapes which island stories get told.</p>
"""),
    ],
    readings=["hamley2021", "austin2013", "wilson2008"],
    assignment=("Evidence review (900 words)",
        "Did people reach the Falklands before Europeans? Weigh Hamley et al. (2021) against the alternative explanations, using Austin et al. (2013) for the warrah's timeline. Conclude with what single new piece of evidence would most change your view."),
    seminar=[
        "Why do the Falklands have no native trees? Consider climate, wind, isolation and history.",
        "Use the sea-level slider at −125 m. How much shorter would a crossing from South America have been? Is that enough to explain the warrah?",
        "Would evidence of Indigenous visits around 1300 CE change the moral or legal arguments in the sovereignty dispute?",
    ],
),
# =====================================================================
dict(
    id="tristan", num=4, short="Tristan", title="Tristan da Cunha",
    kicker="The most remote inhabited island", island_type="Oceanic hotspot volcano (Walvis Ridge – Tristan plume)",
    coords="37°06′S 12°17′W",
    facts=[("Sovereignty", "Part of the UK Overseas Territory of St Helena, Ascension and Tristan da Cunha"),
           ("Land area", "≈98 km²"),
           ("Highest point", "Queen Mary's Peak, ≈2,060 m"),
           ("People", "≈240, in Edinburgh of the Seven Seas"),
           ("Isolation", "≈2,400 km from St Helena, the nearest inhabited place; ≈2,800 km from Cape Town"),
           ("Group", "Tristan, Inaccessible and Nightingale; Gough lies ≈400 km SSE")],
    summary="A young volcano rising about 5.5 km from the ocean floor, with one settlement squeezed onto its only coastal plain. In 1961 an eruption next to that settlement sent the entire population to England for two years.",
    objectives=[
        "Place Tristan in the Walvis Ridge hotspot track and the opening of the South Atlantic.",
        "Interpret seafloor mapping evidence for the hotspot's newest volcanoes (Geissler et al. 2020).",
        "Explain why remote volcanic islands evolve flightless birds and why introduced mice are so destructive.",
        "Describe the 1961 eruption and evacuation and what it reveals about a small island community.",
    ],
    model=dict(dem="tristan", exaggeration=1.5, note="Terrain from satellite elevation data plus global bathymetry. The deep submarine flanks are smoothed, and Geissler et al. (2020) map them at 30 m resolution with many more cones. Peak height in the model is about 2,016 m against a surveyed ≈2,060 m.",
        labels=[(-37.111, -12.289, "Queen Mary's Peak", "≈2,060 m; summit crater"),
                (-37.067, -12.311, "Edinburgh of the Seven Seas", "The only settlement"),
                (-37.062, -12.298, "1961 vent", "Lava dome beside the settlement"),
                (-37.085, -12.215, "Sandy Point", "East coast")]),
    sections=[
        ("Formation: the tail of a 130-million-year hotspot track", """
<p>Tristan da Cunha is the youngest island above the Tristan mantle plume. About 132 million years ago, as Africa and South America began to separate, the plume's first eruptions produced the vast Etendeka (Namibia) and Paraná (Brazil) flood basalts. As the South Atlantic widened, the plume built the Walvis Ridge on the African plate and the Rio Grande Rise on the South American side. Tristan, lying about 450 km east of the Mid-Atlantic Ridge, is the current end of that track.</p>
<figure data-diagram="hotspot"></figure>
<p>The island is geologically very young, with known volcanic activity going back about 1.3 million years. It is a single large cone with parasitic vents on its flanks and coastal plain. Below sea level the edifice is far larger. Its 2,000 m depth contour is a near-circle about 20 km across, and the flanks reach 3,600 m depth within 25 km of the coast. <a data-reading="geissler2020">Geissler et al. (2020)</a> mapped 430 young volcanic cones and two new seamounts around the islands. One of them, Isolde Seamount, was the likely source of a 2004 submarine eruption that washed pumice onto Tristan's beaches.</p>
"""),
        ("Landforms", """
<ul>
<li><strong>The Peak.</strong> Queen Mary's Peak holds a small summit crater lake and is snow-capped in winter.</li>
<li><strong>The Base.</strong> A dissected plateau at roughly 600–900 m below the central cone, crossed by deep gulches.</li>
<li><strong>Sea cliffs.</strong> Cliffs of several hundred metres ring most of the island, cut by wave erosion into layered lavas and pyroclastics.</li>
<li><strong>Coastal plains.</strong> Narrow lowland strips built of lava flows and debris fans. The settlement plain on the north-west is the only one large enough for a village and potato patches, and in 1961 a new vent opened at its eastern edge.</li>
<li><strong>Flank collapse.</strong> Lobate deposits on the north-west seafloor record past sector collapse.</li>
</ul>
<p>In the 3D model, use exaggeration 1× (true scale) to see how steep the island really is, then lower the sea to reveal the submarine cone.</p>
"""),
        ("Ecology", """
<p>No land mammal ever reached Tristan naturally. The islands' land birds evolved without mammalian predators, and several lost the power of flight:</p>
<ul>
<li>The <strong>Inaccessible Island rail</strong>, the world's smallest living flightless bird, survives because Inaccessible has no introduced rats or mice.</li>
<li>The <strong>Nesospiza buntings</strong> of Inaccessible and Nightingale, small- and large-billed forms that specialise on different seeds, are a textbook example of island speciation (Ryan et al. 2007).</li>
<li>The <strong>Tristan albatross</strong> breeds almost only on Gough, where introduced house mice eat live chicks. Read <a data-reading="caravaggi2019">Caravaggi et al. (2019)</a>.</li>
</ul>
<p>The sea is the islands' wealth: rockhopper penguins, fur seals, and the Tristan rock lobster that funds the island economy. In 2020 Tristan declared a Marine Protection Zone of about 687,000 km², closing about 90% of its waters to fishing. Gough and Inaccessible are a World Heritage Site.</p>
"""),
        ("History", """
<p>The Portuguese navigator Tristão da Cunha sighted the island in 1506. The following year the same commander helped seize the fort on Socotra (Unit 6), so one man's name links two of this course's islands. The first settler was the American Jonathan Lambert in 1810. Britain garrisoned Tristan in 1816, officially to stop the island being used to rescue Napoleon from St Helena. When the garrison left in 1817, Corporal William Glass and his family chose to stay, and the community began.</p>
<p>Shipwrecked sailors and later arrivals added families. Five women came from St Helena in 1827, and two Italian sailors from the wreck of the <em>Italia</em> (1892) gave the island the names Repetto and Lavarello. Today seven surnames are shared by almost the whole population. In 1885 fifteen men drowned when a lifeboat was lost trying to reach a passing ship, a disaster that shaped the community for generations.</p>
<p>On 10 October 1961, after weeks of earthquakes, a vent opened beside the settlement and built a lava dome. The whole population was evacuated, first to Nightingale and then to England, where they lived near Southampton. Despite the offer of permanent resettlement, most voted to return and went home in 1963. Sociologists and journalists treated the return as a parable about modernity; the islanders' own accounts stress their land, their boats and their independence.</p>
"""),
        ("People and culture", """
<p>Tristan is run by an Administrator and an elected Island Council. Land is held communally, and no outsider may buy it. Families farm potatoes in 'the Patches' and keep cattle and sheep under strict quotas. The rock lobster fishery and its factory, stamps and coins are the main sources of income.</p>
<p>A tiny founding population has made Tristan a classic genetic isolate. Researchers have studied an unusually high prevalence of asthma, and genealogies going back to 1816 have been matched against Y-chromosome lineages (Soodyall et al. 2003). That raises Baldacchino's question in its sharpest form: what does a community gain or give up by becoming a research site?</p>
"""),
    ],
    readings=["geissler2020", "caravaggi2019"],
    assignment=("Hazard and habitability note (800 words)",
        "Using Geissler et al. (2020) and the 3D model, assess the volcanic, landslide and tsunami hazards facing Edinburgh of the Seven Seas. Then discuss why, in 1963, the community chose to return."),
    seminar=[
        "What makes the Tristan albatross more vulnerable to mice than a mainland seabird would be?",
        "Tristan and Surtsey are both basaltic islands. Compare their tectonic settings and life expectancies.",
        "Is the 1961–63 evacuation and return a story about islands in general, or about this island in particular?",
    ],
),
# =====================================================================
dict(
    id="surtsey", num=5, short="Surtsey", title="Surtsey, Iceland",
    kicker="An island born in 1963", island_type="Oceanic volcanic island on a propagating rift (Vestmannaeyjar system)",
    coords="63°18′N 20°36′W",
    facts=[("Sovereignty", "Iceland"),
           ("Formed", "14 November 1963 – 5 June 1967"),
           ("Area", "2.7 km² (1967) → 1.3 km² (2012)"),
           ("Height", "Reported as 150–173 m; see the note on sources"),
           ("Status", "Nature reserve since 1965; World Heritage Site 2008; scientists only"),
           ("Neighbour", "Heimaey (13.4 km²), inhabited; Eldfell eruption 1973")],
    summary="A new island, watched from its first eruption and first plant. Surtsey shows how an oceanic island is built, hardens into rock, is colonised, and begins to erode. It compresses the island life cycle into a single human lifetime.",
    objectives=[
        "Explain Surtseyan (phreatomagmatic) eruptions and how a tephra island becomes durable rock.",
        "Describe the four phases of plant colonisation and the role of seabirds as nutrient subsidies.",
        "Use Surtsey to test island biogeography theory and the General Dynamic Model.",
        "Contrast protected Surtsey with inhabited Heimaey and its 1973 eruption.",
    ],
    model=dict(dem="surtsey", exaggeration=4, note="Terrain from European elevation data and global bathymetry; the seafloor around the Vestmannaeyjar is about 100–200 m deep. Surtsey is the small round island in the south-west.",
        labels=[(63.303, -20.604, "Surtsey", "Born 1963"),
                (63.437, -20.27, "Heimaey", "Inhabited; Eldfell 1973"),
                (63.433, -20.245, "Eldfell", "1973 cone"),
                (63.468, -20.175, "Elliðaey", "Puffin colony; comparison plots")]),
    sections=[
        ("Formation: fire and water", """
<p>On 14 November 1963 the crew of the fishing boat <em>Ísleifur II</em> saw dark columns rising from the sea about 32 km off Iceland's south coast. An eruption that began on the seafloor about 130 m down broke the surface within days. It was named Surtsey after Surtr, the fire giant of Norse myth.</p>
<p>The early eruption was explosive because seawater flooded the vent. Magma meeting water fragments into glassy ash and lapilli (tephra), thrown out in jets and in columns up to 9 km high. Geologists now call this a <strong>Surtseyan eruption</strong>. In April 1964 the growing tephra cone sealed the vent from the sea, and the eruption became effusive: lava flows built a hard cap over the southern half of the island. Without that armour, Surtsey would probably have been washed away, as its ephemeral satellite islands Syrtlingur and Jólnir were in 1965–66.</p>
<figure data-diagram="surtseyan"></figure>
<p>A second process saved the tephra cones. Heat from the cooling intrusions drove hydrothermal circulation, which altered the glassy tephra (palagonitisation) and cemented it into tuff within years to decades. <a data-reading="jackson2019">Jackson et al. (2019)</a> drilled into this system in 2017 and found it still above 100 °C, with a diatreme cutting down into the old seafloor.</p>
<p>Tectonically, Surtsey sits at the offshore, southward-propagating tip of Iceland's Eastern Rift Zone, not over an intraplate hotspot like Tristan. Iceland itself, however, owes its unusual volcanic output to a mantle plume beneath the Mid-Atlantic Ridge.</p>
"""),
        ("Landforms and erosion", """
<p>Surtsey has two tuff cones (Surtur in the east and Surtungur in the west), a lava shield and lava delta in the south, and a low spit of eroded sediment on the sheltered north side. North Atlantic storms have cut high cliffs into the lava and tuff on the south-west. The island lost half its area between 1967 and 2012.</p>
<p>Erosion will eventually strip the loose deposits and the lava apron, leaving the hard palagonite cores as small, steep stacks, like the older Vestmannaeyjar islets of Geirfuglasker or Súlnasker. Surtsey shows in decades what the General Dynamic Model describes over millions of years.</p>
"""),
        ("Ecology: colonisation from zero", """
<p>No island has a better colonisation record. The first vascular plant, sea rocket, was found in 1965. By 2013, 69 species had been recorded, 59 were present and 39 had viable populations (<a data-reading="magnusson2014">Magnússon et al. 2014</a>).</p>
<figure data-diagram="surtsey_timeline"></figure>
<ul>
<li><strong>Sea dispersal</strong> brought the shore pioneers in the first decade.</li>
<li><strong>Stagnation</strong> (1975–85): barren tephra and lava could not support most arrivals.</li>
<li><strong>Gulls</strong> began breeding around 1985. Their droppings added about 47 kg of nitrogen per hectare per year, roughly 40 times the background input, and their guts carried seeds. A second wave of colonisation followed, and the gull colony became a dense grassland.</li>
<li><strong>Saturation and loss</strong> (2008 onward): competitive grasses took over and erosion removed habitat, so species richness began to fall.</li>
</ul>
<p>Surtsey supports MacArthur–Wilson in outline, with immigration slowing as the pool is used up, but shows that nutrient subsidies can matter more than distance. Seabirds effectively move the equilibrium. Snow buntings became the first breeding land birds in 1996. Underground, microbes colonise the hot basaltic tuff.</p>
"""),
        ("History and the neighbouring islands", """
<p>Surtsey was declared a nature reserve in 1965, before it had finished forming, and has been closed to everyone except permitted scientists ever since. The Surtsey Research Society (1965) coordinates the work. Access rules are strict: no seeds, soil or organisms may be carried ashore, and Jackson et al. describe how a 2017 drilling camp was run with zero impact.</p>
<p>The Vestmannaeyjar have a long human history. Heimaey, the only inhabited island, has been settled and grazed since the 9th century. In 1627 North African corsairs raided it and carried off over 200 people, an event remembered as the 'Turkish Abduction'. On 23 January 1973 a fissure opened on Heimaey's edge and built Eldfell. Nearly all of the town's roughly 5,300 residents were evacuated overnight by the fishing fleet, and crews pumped seawater onto the advancing lava to protect the harbour.</p>
"""),
        ("People and culture", """
<p>Surtsey has no people, but it holds a particular place in Icelandic culture: a national laboratory, a symbol of the country as a still-forming land, and a World Heritage Site (2008). Next door, Heimaey's culture is tied to the sea and the seabird cliffs. Children rescue young puffins that are drawn to the town's lights, and the Þjóðhátíð festival in Herjólfsdalur has been held since 1874.</p>
<p>Grydehøj's locus/focus distinction fits neatly here. Surtsey is almost pure locus, a place for research. Heimaey is focus, an island community with its own story and stakes.</p>
"""),
    ],
    readings=["magnusson2014", "jackson2019"],
    assignment=("Island life-cycle essay (900 words)",
        "Using Surtsey and at least one other course island, explain how an oceanic island's physical life cycle shapes its ecological history. Engage directly with the General Dynamic Model."),
    seminar=[
        "Was the decision to ban visitors scientifically necessary, or did it create an artificial island?",
        "Magnússon et al. forecast a 'lush, species-poor grassland'. How does that fit equilibrium theory?",
        "Why do the two papers give different heights for Surtsey? What does that teach you about citing numbers?",
    ],
),
# =====================================================================
dict(
    id="socotra", num=6, short="Socotra", title="Socotra, Yemen",
    kicker="An ancient fragment of Arabia", island_type="Continental fragment rifted from Arabia (Gulf of Aden)",
    coords="12°30′N 53°50′E",
    facts=[("Sovereignty", "Yemen (Socotra Governorate); since 2020 controlled by the UAE-backed Southern Transitional Council"),
           ("Archipelago", "Socotra 3,625 km²; Abd al Kuri 133 km²; Samha 40 km²; Darsa 5.4 km²"),
           ("Highest point", "Haggeher (Hajhir) mountains, ≈1,500 m"),
           ("People", "Roughly 50,000–60,000; Soqotri and Arabic speakers"),
           ("Endemism", "About a third of plant species found nowhere else"),
           ("Status", "UNESCO World Heritage Site (2008)")],
    summary="A slab of ancient continent left in the Arabian Sea when the Gulf of Aden opened. Dragon's blood trees comb the monsoon mists, geckos have evolved into giants and dwarfs, and an unwritten Semitic language carries a long oral literature.",
    objectives=[
        "Explain Socotra's origin as a rifted continental fragment and its rock types.",
        "Relate monsoon climate and fog to the island's flora, especially Dracaena cinnabari.",
        "Evaluate a test of the island rule (Garcia-Porta et al. 2016).",
        "Trace Socotra's role in Indian Ocean trade and its current political situation.",
    ],
    model=dict(dem="socotra", exaggeration=6, note="Terrain at about 290 m resolution from satellite elevation data and global bathymetry. Mountain heights are slightly underestimated (model peak about 1,440 m).",
        labels=[(12.58, 54.03, "Haggeher mountains", "Granite core, ≈1,500 m"),
                (12.65, 54.02, "Hadibo", "Main town"),
                (12.50, 53.95, "Limestone plateaux", "Dragon's blood woodland (≈ location)"),
                (12.68, 53.49, "Qalansiyah", "Detwah lagoon nearby"),
                (12.58, 54.33, "Hoq Cave", "Ancient inscriptions (≈ location)")]),
    sections=[
        ("Formation: rifted from Arabia", """
<p>Socotra is a piece of the Arabian continental margin. Its basement of Precambrian granites and metamorphic rocks, with granites dated to about 840–780 million years ago, crops out in the Haggeher mountains. Over it lie Cretaceous and Paleogene limestones that form the island's high plateaux.</p>
<p>Around 30 million years ago, rifting began to tear Arabia from Africa along what became the Gulf of Aden. Socotra was left on the southern side of the rift, attached to the Somali plate, as a stretched, faulted block of continental crust facing its counterpart in Dhofar (Oman). Seismic studies show the crust thinning from about 28 km beneath central Socotra to about 16 km towards the ocean–continent transition.</p>
<figure data-diagram="socotra_rift"></figure>
<p>Because Socotra is continental, its biota mixes ancient relict lineages (such as the dragon's blood tree) with later overwater colonists (such as the geckos, which arrived at least three times).</p>
"""),
        ("Landforms and climate", """
<ul>
<li><strong>Haggeher mountains</strong>: jagged granite peaks rising to about 1,500 m above the north coast, often in cloud.</li>
<li><strong>Limestone plateaux</strong>: Diksam, Firmihin, Homhil and others at roughly 300–900 m, with karst, sinkholes and caves. Hoq Cave on the north coast holds inscriptions left by sailors in Indian, South Arabian, Ethiopian, Greek and other scripts, mostly from the 1st to 6th centuries CE.</li>
<li><strong>Coastal plains and dunes</strong>: the broad Noged plain in the south, and wind-blown sand dunes banked against the plateau edges.</li>
<li><strong>Detwah lagoon</strong> near Qalansiyah in the west, a protected wetland.</li>
</ul>
<p>The climate is hot and arid, but the monsoon controls everything. From June to September the south-west monsoon brings gale-force winds that cut the island off by sea. Mist and cloud on the uplands provide 'horizontal precipitation', which the umbrella-shaped dragon's blood trees comb from the air. The north-east monsoon brings lighter rain in winter.</p>
"""),
        ("Ecology: the 'Galápagos of the Indian Ocean'", """
<p>About a third of Socotra's roughly 825 vascular plant species are endemic, along with about 90% of its reptiles and most of its land snails. Among the best-known plants:</p>
<ul>
<li><strong>Dragon's blood tree</strong> (<em>Dracaena cinnabari</em>), umbrella-crowned and source of a red resin traded since antiquity. Its populations are over-mature, with too few young trees. Read <a data-reading="madera2020">Maděra et al. (2020)</a>.</li>
<li><strong>Frankincense trees</strong> (<em>Boswellia</em>), several endemic species.</li>
<li>The <strong>cucumber tree</strong> (<em>Dendrosicyos socotranus</em>) and the <strong>desert rose</strong> (<em>Adenium obesum</em> subsp. <em>socotranum</em>), swollen-trunked succulents.</li>
</ul>
<p>Socotra's <em>Hemidactylus</em> geckos include the largest and smallest species of their group. <a data-reading="garciaporta2016">Garcia-Porta et al. (2016)</a> test whether that reflects an 'island effect'. The main threats to the island's biodiversity are overgrazing by goats, which prevents tree regeneration, climate change (two cyclones in 2015, Chapala and Megh, felled many trees), road building, and the effects of war and new investment.</p>
"""),
        ("History", """
<p>Socotra was a waypoint in Indian Ocean trade. The <em>Periplus of the Erythraean Sea</em> (1st century CE) describes it as 'Dioscorida', settled by Arab, Indian and Greek traders who dealt in tortoiseshell, aloes and 'Indian cinnabar' (dragon's blood). Medieval sources, including Marco Polo, mention a Christian community. In 1507 a Portuguese fleet under Tristão da Cunha and Afonso de Albuquerque captured the fort at Suq, but abandoned it a few years later.</p>
<p>The island was later ruled by the Mahra sultans of Qishn and Socotra, came under a British protectorate in 1886, joined South Yemen in 1967, and joined unified Yemen in 1990. An airport opened in 1999. Since Yemen's civil war began, the United Arab Emirates has built influence on the island, and in 2020 the UAE-backed Southern Transitional Council took control. Development and military projects have since raised serious concerns for both biodiversity and local self-determination.</p>
"""),
        ("People and culture", """
<p>Most islanders speak <strong>Soqotri</strong>, one of the Modern South Arabian languages, a Semitic group distinct from Arabic. It has traditionally been unwritten, with a rich oral literature of poetry, proverbs and plant knowledge. Researchers working with Soqotri speakers, notably Miranda Morris, have documented this ethnobotany and are developing a written form.</p>
<p>Traditional life combines pastoralism in the mountains and plateaux, fishing on the coasts, and date gardens in the wadis. Resource use has long been regulated. Maděra et al. describe 19th-century accounts of land divided into lots and leased to Bedouin groups for resin harvesting. Today Socotra faces the sharpest form of Baldacchino's question: rapid change is being decided by actors far from the island, while the people with the deepest knowledge of its ecosystems have the least formal power.</p>
"""),
    ],
    readings=["garciaporta2016", "madera2020"],
    assignment=("Conservation dilemma (900 words)",
        "Design a conservation plan for the dragon's blood tree that is scientifically sound (using Maděra et al. 2020) and socially just to Soqotri herders. Show how you would test whether it works."),
    seminar=[
        "Socotra and the Falklands are both continental fragments. Why is one so rich in endemics and the other so poor?",
        "Garcia-Porta et al. find an 'island effect' for body size but not for head shape. What does that imply for the idea of an 'island syndrome'?",
        "Who should decide Socotra's development: Yemen, the UAE, UNESCO or the Soqotri? What would 'on their own terms' mean here?",
    ],
),
# =====================================================================
dict(
    id="synthesis", num=7, short="Synthesis", title="Synthesis: comparing islands",
    kicker="Capstone",
    summary="Bring the six cases together. Compare them on physical and human dimensions, test the course's theories against them, and write a nissological profile of an island of your own choosing.",
    objectives=[
        "Compare islands systematically across physical, ecological and human dimensions.",
        "Evaluate the explanatory power of island biogeography theory across very different islands.",
        "Produce an original, research-based island profile.",
    ],
    sections=[
        ("The six islands side by side", """
<div class="table-wrap"><table class="compare">
<thead><tr><th>Island</th><th>Type</th><th>Age of land</th><th>Area</th><th>Highest</th><th>People</th><th>Key threat in the readings</th></tr></thead>
<tbody>
<tr><td><a href="#funafuti">Funafuti</a></td><td>Atoll</td><td>Islets: last few thousand years</td><td>2.6 km²</td><td>≈4–5 m</td><td>≈5,500 on Fogafale</td><td>Sea-level rise; sediment supply</td></tr>
<tr><td><a href="#pitcairn">Pitcairn / Henderson</a></td><td>Hotspot volcano / raised atoll</td><td>0.8 Ma / 13 Ma</td><td>4.5 / 43 km²</td><td>≈340 / 33 m</td><td>≈40 / 0</td><td>Rats; marine plastic; depopulation</td></tr>
<tr><td><a href="#falklands">Falklands</a></td><td>Continental fragment</td><td>Rocks to ≈1 Ga</td><td>≈12,000 km²</td><td>705 m</td><td>≈3,600</td><td>Grazing; invasive predators</td></tr>
<tr><td><a href="#tristan">Tristan da Cunha</a></td><td>Hotspot volcano</td><td>&lt; 1.3 Ma</td><td>98 km²</td><td>≈2,060 m</td><td>≈240</td><td>Volcanic hazard; mice (Gough)</td></tr>
<tr><td><a href="#surtsey">Surtsey</a></td><td>Rift volcano</td><td>1963–67</td><td>1.3 km²</td><td>≈150 m</td><td>0</td><td>Marine erosion</td></tr>
<tr><td><a href="#socotra">Socotra</a></td><td>Continental fragment</td><td>Rocks to ≈0.8 Ga; isolated ≈30 Ma</td><td>3,625 km²</td><td>≈1,500 m</td><td>≈50–60k</td><td>Overgrazing; conflict; development</td></tr>
</tbody></table></div>
<p>Look down the columns. Area spans four orders of magnitude, age eight. Inhabited islands are not necessarily the largest or most fertile; access (a landing, a harbour, a lagoon) and history explain more.</p>
"""),
        ("Testing the theories", """
<ul>
<li><strong>Equilibrium theory</strong> fits Surtsey's colonisation curve in outline, but seabird nutrient subsidies moved the equilibrium. Henderson's rats show that people redraw the extinction curve.</li>
<li><strong>The General Dynamic Model</strong> describes Surtsey's shrinking and the Pitcairn chain's stages (young high island, raised atoll, low atolls). It does not apply to continental fragments like Socotra and the Falklands, whose biotas reflect continental inheritance and long isolation.</li>
<li><strong>The island rule</strong> holds for gecko body size on Socotra but not for head shape. 'Island effects' are trait-specific.</li>
<li><strong>Darwin's subsidence theory</strong> explains Funafuti, Oeno and Ducie. Henderson shows the reverse, local uplift through flexure.</li>
<li><strong>Nissology's ethical claim</strong> applies to every case. In each, the most-cited knowledge was produced by visiting scientists. Where were islanders authors, collaborators, or decision-makers?</li>
</ul>
"""),
        ("Capstone: write a nissological profile", """
<p>Choose an island not studied in this course; a lesser-known one is best. Write a profile of 3,000–4,000 words that includes:</p>
<ol>
<li><strong>Physical geography</strong>: origin, rock types, landforms and present processes, with at least one map or terrain figure you have made or adapted (attributed).</li>
<li><strong>Ecology</strong>: biogeographic character, key species, and how theory explains them.</li>
<li><strong>History</strong>: human arrival(s), colonial and political history.</li>
<li><strong>Culture and governance</strong>: language, livelihoods, land tenure, and who decides.</li>
<li><strong>A critical review of at least four peer-reviewed papers</strong> about the island, using the five-question method from Unit 0.</li>
<li><strong>Reflexive statement</strong>: whose terms does your own profile use?</li>
</ol>
<div class="table-wrap"><table>
<thead><tr><th>Criterion</th><th>Weight</th><th>Excellent work…</th></tr></thead>
<tbody>
<tr><td>Physical explanation</td><td>25%</td><td>explains processes and mechanisms, with correct terms and quantities</td></tr>
<tr><td>Use of research literature</td><td>25%</td><td>evaluates claims, methods and uncertainty instead of only reporting findings</td></tr>
<tr><td>Integration</td><td>20%</td><td>links physical, ecological and human dimensions causally</td></tr>
<tr><td>Critical and ethical reflection</td><td>15%</td><td>engages seriously with 'on whose terms'</td></tr>
<tr><td>Communication</td><td>15%</td><td>clear structure, accurate citation, well-made figures</td></tr>
</tbody></table></div>
<p>Suggestions: Kiritimati (Kiribati), Aldabra (Seychelles), Nauru, St Kilda, South Georgia, Rapa Iti, Bouvet Island, Annobón, Lord Howe Island, Jan Mayen, or an island in the Indonesian or Philippine archipelagos, which Grydehøj notes are under-studied.</p>
"""),
        ("Further reading", """
<ul class="refs">
<li>Darwin, C. (1842). <em>The Structure and Distribution of Coral Reefs</em>. Smith, Elder &amp; Co. (free at Darwin Online).</li>
<li>Hau'ofa, E. (1994). Our sea of islands. <em>The Contemporary Pacific</em> 6(1): 147–161.</li>
<li>MacArthur, R. H. &amp; Wilson, E. O. (1967). <em>The Theory of Island Biogeography</em>. Princeton University Press.</li>
<li>McCall, G. (1994). Nissology: a proposal for consideration. <em>Journal of the Pacific Society</em> 17: 1–14.</li>
<li>Royal Society (1904). <em>The Atoll of Funafuti: Borings into a Coral Reef and the Results</em>. London.</li>
<li>Weisler, M. I. (1994). The settlement of marginal Polynesia: new evidence from Henderson Island. <em>Journal of Field Archaeology</em> 21: 83–102.</li>
<li>Whittaker, R. J., Triantis, K. A. &amp; Ladle, R. J. (2008). A general dynamic theory of oceanic island biogeography. <em>Journal of Biogeography</em> 35: 977–994.</li>
<li>Van Damme, K. &amp; Banfield, L. (2011). Past and present human impacts on the biodiversity of Socotra Island (Yemen). <em>Zoology in the Middle East</em>. doi:10.1080/09397140.2011.10648899</li>
<li>Comment by Clark, Newton &amp; Wakefield on Hamley et al. (2021), and the authors' reply, <em>Science Advances</em> 8 (2022), eabo6765.</li>
</ul>
"""),
    ],
    readings=[],
),
]
