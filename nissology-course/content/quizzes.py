"""Quizzes.

CHECKS[video_id]  – 2 quick questions shown under each section video.
UNIT_QUIZ[unit]   – end-of-unit quiz (8 questions; mixed types).
TASKS[unit]       – applied tasks using the 3D model or readings, with numeric self-checks.

Question forms:
  single:  dict(q, o=[...], a=index, e)
  multi:   dict(q, o=[...], a=[indices], e, kind="multi")
  numeric: dict(q, a=value, tol=±, unit="…", e, kind="num")
  order:   dict(q, o=[items in the correct order], e, kind="order")   (shown shuffled)
"""

def Q(q, o, a, e):
    return dict(kind="single", q=q, o=o, a=a, e=e)

def M(q, o, a, e):
    return dict(kind="multi", q=q, o=o, a=a, e=e)

def N(q, a, tol, unit, e):
    return dict(kind="num", q=q, a=a, tol=tol, unit=unit, e=e)

def O(q, o, e):
    return dict(kind="order", q=q, o=o, e=e)

CHECKS = {
# ------------------------------------------------------------- foundations
"foundations-0": [
    Q("What does McCall's phrase 'on their own terms' ask researchers to do?", ["Study only islands smaller than 1,000 km²", "Centre islands and islanders rather than mainland frames", "Avoid using maps", "Publish only in island languages"], 1, "Nissology re-centres the island: its own histories and perspectives, not the mainland's view of what islands lack."),
    Q("Which writer reframed Oceania as 'a sea of islands'?", ["Godfrey Baldacchino", "Charles Darwin", "Epeli Hau'ofa", "E. O. Wilson"], 2, "Hau'ofa (1994) answered the 'smallness' story with a picture of connection through voyaging and kinship."),
],
"foundations-1": [
    Q("Which island in this course is a continental fragment?", ["Tristan da Cunha", "Surtsey", "Socotra", "Funafuti"], 2, "Socotra is a piece of the Arabian margin isolated as the Gulf of Aden opened. The Falklands are the other example."),
    N("About how far below today's level did the sea stand at the Last Glacial Maximum? (metres)", 125, 15, "m", "Roughly 120–130 m lower, about 21,000 years ago, which is enough to join shelf islands to continents."),
],
"foundations-2": [
    O("Put Darwin's sequence in order, starting with a young volcanic island.", ["Fringing reef", "Barrier reef", "Atoll", "Guyot (drowned)"], "As the volcano subsides, the reef grows upward: fringing → barrier → atoll. If reef growth fails to keep up, the top drowns as a guyot."),
    Q("What finally confirmed Darwin's theory?", ["The Funafuti boring of 1896–98", "Boreholes on Enewetak in 1952 that reached basalt", "Satellite images of atolls", "Fossils on Henderson Island"], 1, "Funafuti reached about 340 m of reef rock but no basalt; Enewetak hit basalt beneath more than 1,200 m of limestone."),
],
"foundations-3": [
    Q("In MacArthur–Wilson theory, what happens to the equilibrium species number on a larger island (same distance)?", ["It falls, because immigration falls", "It rises, because extinction falls", "It stays the same", "It rises, because immigration rises"], 1, "Larger islands hold larger populations, which lowers the extinction curve and moves the crossing point to the right."),
    N("If z = 0.3, by roughly what factor does species number change when area increases tenfold? (S = cA^z)", 2.0, 0.15, "×", "10^0.3 ≈ 2.0, so a tenfold increase in area roughly doubles the species count."),
],
"foundations-4": [
    Q("Which annotation colour marks a limitation or inconsistency?", ["Yellow", "Green", "Blue", "Red"], 3, "Red means 'read critically': limits, inconsistencies and alternative readings."),
    M("Which belong to the five reading questions? (choose all that apply)", ["Claim", "Method", "Author's nationality", "Uncertainty", "Scope"], [0, 1, 3, 4], "Claim, method, evidence, uncertainty and scope. Where an author comes from is a 'whose terms' question, not one of the five."),
],
# ------------------------------------------------------------- funafuti
"funafuti-0": [
    Q("What are Funafuti's islets (motu) mainly made of?", ["Basalt lava", "Granite", "Loose reef-derived sand and gravel", "Volcanic ash"], 2, "Reef islands are heaps of carbonate sediment made by corals, algae, shells and foraminifera, piled up by waves."),
    Q("Roughly how old are most reef islands compared with the reef beneath them?", ["Much older", "About the same age", "Much younger: a few thousand years", "They formed in the 20th century"], 2, "The reef cap is very old, but most motu formed within the last few thousand years."),
],
"funafuti-1": [
    N("Ghyben–Herzberg: if the water table is 0.5 m above sea level, about how deep does the freshwater lens reach below sea level? (m)", 20, 2, "m", "About 40 × the head: 40 × 0.5 = 20 m."),
    Q("What did Cyclone Bebe (1972) do to Funafuti's eastern islands over the following decades?", ["Destroyed them permanently", "Supplied rubble that was reworked onto shores, so they grew", "Had no effect", "Turned them into lagoons"], 1, "Storms can build islands: the rubble bank was reworked onto shorelines (Kench et al. 2018)."),
],
"funafuti-2": [
    N("Kench et al. report a net land change for Tuvalu of how many hectares (1971–2014)?", 73.5, 0.6, "ha", "+73.5 ha (2.9%), the net of +80.7 ha gained and −7.24 ha lost."),
    Q("The Table 1 rows sum to about 63 ha, not 73.5 ha. What is the right response as a reader?", ["Reject the paper", "Ignore it", "Look for an explanation and check whether it changes the conclusion", "Assume the satellites were wrong"], 2, "Check the supplementary data and ask whether the discrepancy matters. Here, most islands grew under every reading."),
],
"funafuti-3": [
    Q("Why are threats to coral reefs also threats to atoll land?", ["Reefs hold up the sky", "Reefs produce the sediment that builds and replenishes islands", "Reefs cause storms", "They are not related"], 1, "The reef is a sediment factory. If it slows, islands lose their supply of sand and gravel."),
    Q("When was the Funafuti Conservation Area established?", ["1896", "1943", "1978", "1996"], 3, "1996, on the western rim islets, reefs and lagoon."),
],
"funafuti-4": [
    O("Order these events in Tuvalu's history.", ["Named 'Ellice's Island' (1819)", "British protectorate (1892)", "US airfield on Fogafale (1943)", "Independence (1978)"], "1819 → 1892 → 1943 → 1978."),
    Q("Which island group did the Ellice Islands separate from in the 1970s?", ["The Gilbert Islands (Kiribati)", "Samoa", "Fiji", "The Marshall Islands"], 0, "After a 1974 referendum they separated from the Gilberts, now Kiribati."),
],
"funafuti-5": [
    Q("What is a falekaupule?", ["A type of canoe", "A traditional island assembly of elders", "A freshwater pit", "A dance"], 1, "Each island community governs through its falekaupule alongside the national parliament."),
    M("Which are recent Tuvaluan responses to sea-level rise? (choose all)", ["Land reclamation on Fogafale", "A constitutional statement that statehood continues", "The Falepili Union treaty with Australia", "Evacuating the whole population in 2010"], [0, 1, 2], "There has been no national evacuation; the first three are all real policies."),
],
# ------------------------------------------------------------- pitcairn
"pitcairn-0": [
    Q("Why is Henderson Island raised about 30 m above sea level?", ["Volcanic eruption beneath it", "Glacial rebound", "Flexure from Pitcairn's weight pushed up a bulge", "Sea level fell 30 m"], 2, "Pitcairn's load bent the plate down beneath it and up into a bulge about 200 km away, where Henderson sits."),
    O("Order the Pitcairn islands from oldest to youngest.", ["Oeno (~16 Ma)", "Henderson (~13 Ma)", "Ducie (~8 Ma)", "Pitcairn (~0.8 Ma)"], "Ages from Friedlander et al. (2014)."),
],
"pitcairn-1": [
    Q("What is 'makatea'?", ["A Pitcairn longboat", "Jagged, honeycombed raised reef limestone", "A volcanic crater lake", "A type of fish"], 1, "Henderson's plateau is makatea: uplifted, karstified reef limestone."),
    Q("Why do people land on Pitcairn by longboat?", ["Tradition only", "There is no natural harbour", "Aircraft are banned", "The water is too shallow for ships"], 1, "With no harbour, people and cargo come ashore through the surf at Bounty Bay."),
],
"pitcairn-2": [
    N("Genetic analysis suggests about how many rats survived the 2011 eradication? (give a single estimate)", 70, 15, "rats", "About 60–80 survivors (Ne ≈ 50; Amos et al. 2016)."),
    Q("What carries plastic debris to Henderson's beaches?", ["Local residents", "The South Pacific Gyre", "Cyclones from Australia", "Fishing on Henderson"], 1, "Henderson sits in the South Pacific Gyre, which concentrates floating debris."),
],
"pitcairn-3": [
    Q("Why was Pitcairn a good hiding place for the Bounty mutineers?", ["It was charted with the wrong longitude", "It had a fortress", "It was invisible from the sea", "It belonged to Spain"], 0, "Carteret recorded its position wrongly in 1767."),
    Q("What evidence shows Polynesians lived on Pitcairn before 1790?", ["Written records", "House sites, carvings and stone tools", "Photographs", "None; it was always empty"], 1, "Archaeological remains, plus basalt and volcanic glass traded with Mangareva."),
],
"pitcairn-4": [
    Q("What is Pitkern?", ["A dance", "An English–Tahitian creole", "A church", "A fish"], 1, "Pitkern blends 18th-century English and Tahitian."),
    Q("What is the island's biggest current concern?", ["Overpopulation", "Population decline", "Volcanic eruption", "Traffic"], 1, "About 40 residents make it hard to crew longboats and run services."),
],
# ------------------------------------------------------------- falklands
"falklands-0": [
    Q("What kind of crust are the Falklands built on?", ["Oceanic", "Continental", "Coral", "Volcanic ash"], 1, "Unlike the volcanic islands in this course, the Falklands are continental: ancient rocks matching South Africa's."),
    Q("By about how much is the Falklands block thought to have rotated?", ["10°", "45°", "90°", "180°"], 3, "About 180° during Gondwana's breakup; the details are debated."),
],
"falklands-1": [
    Q("What are stone runs?", ["Lava flows", "Streams of quartzite boulders, relics of cold periods", "Glacial moraines", "Human-made walls"], 1, "Relict periglacial block streams formed over several cold stages."),
    Q("Why is the Falklands coast cut by long creeks and sounds?", ["Rivers carved them recently", "Valleys were drowned by the post-glacial rise in sea level", "Earthquakes", "Mining"], 1, "Valleys cut at low sea level were flooded as the sea rose."),
],
"falklands-2": [
    N("About what percentage of the world's black-browed albatrosses breed in the Falklands?", 70, 8, "%", "Commonly estimated at about 70%."),
    Q("What was the warrah?", ["A penguin", "A fox-like canid, the only native land mammal", "A sea lion", "A grass"], 1, "Dusicyon australis, hunted to extinction by 1876."),
],
"falklands-3": [
    M("Which lines of evidence did Hamley et al. (2021) use? (choose all)", ["A sudden rise in charcoal", "Mixed sea lion and penguin bone piles", "A quartzite projectile point", "Written Yaghan records"], [0, 1, 2], "There are no written Yaghan records; the evidence is charcoal, bones and the stone point."),
    N("In what year did Britain take control of the Falklands, the root of today's dispute?", 1833, 0, "", "1833."),
],
"falklands-4": [
    Q("What does 'Camp' mean in the Falklands?", ["A military base", "The countryside beyond Stanley", "A school", "A penguin colony"], 1, "From Spanish campo: the countryside of sheep farms."),
    Q("What transformed the Falklands economy after 1986?", ["Gold mining", "Tourism alone", "Squid fishing licences", "Whaling"], 2, "A fishing zone was declared in 1986; squid licences are the main income."),
],
# ------------------------------------------------------------- tristan
"tristan-0": [
    Q("Which ocean ridge did the Tristan plume build?", ["The Mid-Atlantic Ridge", "The Walvis Ridge", "The Hawaiian Ridge", "The Reykjanes Ridge"], 1, "The Walvis Ridge runs from Namibia's flood basalts to Tristan."),
    Q("What was the likely source of the 2004 pumice that washed ashore on Tristan?", ["Isolde Seamount", "Queen Mary's Peak", "Gough Island", "Iceland"], 0, "Geissler et al. (2020) link it to Isolde Seamount, south of the island."),
],
"tristan-1": [
    Q("Why is Edinburgh of the Seven Seas where it is?", ["It is the highest point", "It is on the only coastal plain large enough", "It has a harbour carved by glaciers", "It was chosen at random"], 1, "Sea cliffs ring most of the island; the north-west plain is the only large flat ground."),
    Q("What hazard do lobe-shaped deposits on the seafloor record?", ["Meteorite impacts", "Flank collapse (giant landslides)", "Coral growth", "Shipwrecks"], 1, "Past sector collapses, a potential tsunami hazard."),
],
"tristan-2": [
    Q("Why could the Inaccessible Island rail survive while flightless?", ["It lives underground", "No rats or mice have reached its island", "It is poisonous", "It migrates"], 1, "Without mammalian predators, flightlessness is not fatal."),
    N("About how many eggs and chicks do mice destroy on Gough Island each year? (millions)", 1.74, 0.2, "million", "About 1.74 million (Caravaggi et al. 2019)."),
],
"tristan-3": [
    N("In what year did the volcano erupt beside the settlement, forcing evacuation?", 1961, 0, "", "10 October 1961; most islanders returned in 1963."),
    Q("Where did the evacuated islanders live from 1961 to 1963?", ["Cape Town", "Near Southampton, England", "St Helena", "Nightingale Island"], 1, "After a short stop on Nightingale, they were taken to England and lived near Southampton."),
],
"tristan-4": [
    Q("Who may buy land on Tristan?", ["Anyone", "No outsiders: land is held in common", "Only the UK government", "Only fishing companies"], 1, "Land is communal and cannot be sold to outsiders."),
    Q("What is the island's main income?", ["Tourism", "Rock lobster fishing", "Oil", "Wool"], 1, "The Tristan rock lobster fishery, plus stamps and coins."),
],
# ------------------------------------------------------------- surtsey
"surtsey-0": [
    Q("Why was Surtsey's early eruption explosive?", ["The magma was granitic", "Seawater flooded the vent", "It was a meteorite", "Ice melted"], 1, "Magma meeting water shatters into ash: a Surtseyan eruption."),
    Q("What helped Surtsey resist erosion?", ["Coral growth", "Lava armour and ash cemented into palagonite tuff", "Seawalls", "Vegetation only"], 1, "Lava flows from 1964 and hydrothermal cementation of the tephra."),
],
"surtsey-1": [
    N("Surtsey's area was 2.7 km² in 1967. What was it in 2012? (km²)", 1.3, 0.1, "km²", "About 1.3 km²: half lost to erosion."),
    Q("What will probably be left of Surtsey in the far future?", ["Nothing", "Small steep stacks of hard tuff", "A coral atoll", "A larger island"], 1, "The palagonite tuff cores will outlast the loose deposits."),
],
"surtsey-2": [
    O("Order Surtsey's colonisation phases.", ["Sea-dispersed pioneers", "Stagnation", "Gull-driven second wave", "Net loss of species"], "1965–74, 1975–85, 1986–2007, 2008 onwards."),
    Q("How did gulls change Surtsey's ecosystem?", ["They ate all the plants", "They added nitrogen and carried seeds", "They brought rats", "No effect"], 1, "About 47 kg N per hectare per year, roughly 40 times background, plus seeds in their guts."),
],
"surtsey-3": [
    N("In what year did Eldfell erupt on Heimaey?", 1973, 0, "", "23 January 1973."),
    Q("How did people slow the Eldfell lava?", ["Bombing it", "Pumping seawater onto it", "Building concrete walls", "They did not try"], 1, "Seawater cooling helped save the harbour."),
],
"surtsey-4": [
    Q("In Grydehøj's terms, Surtsey is mainly…", ["Focus", "Locus", "Archipelago", "Aquapelago"], 1, "A place where research happens (locus), rather than an island community's own story (focus)."),
    Q("Who may visit Surtsey?", ["Anyone with a boat", "Tourists in summer", "Only permitted scientists", "Nobody at all"], 2, "It has been closed to all but permitted scientists since 1965."),
],
# ------------------------------------------------------------- socotra
"socotra-0": [
    N("About how many million years ago did rifting begin to separate Socotra from Arabia?", 30, 5, "Ma", "About 30 million years ago, as the Gulf of Aden opened."),
    Q("Which rock forms Socotra's high plateaux?", ["Basalt", "Limestone", "Coral sand", "Peat"], 1, "Limestones above a Precambrian granite basement."),
],
"socotra-1": [
    Q("What is 'horizontal precipitation'?", ["Sideways rain in storms", "Water captured from fog by leaves and branches", "River flooding", "Sea spray"], 1, "Dragon's blood trees comb water from monsoon mist."),
    Q("When does the south-west monsoon cut Socotra off by sea?", ["December–February", "March–May", "June–September", "All year"], 2, "Gale-force winds from June to September."),
],
"socotra-2": [
    Q("Why are dragon's blood tree populations described as over-mature?", ["Trees are too young", "Too few young trees because goats eat seedlings", "Trees grow too fast", "Disease"], 1, "Grazing prevents regeneration."),
    Q("What did the gecko study find?", ["Islands changed body size and head shape equally", "Body size evolved fast on the islands; head shape did not", "No island effect at all", "Geckos are not found on Socotra"], 1, "Island effects can be trait-specific (Garcia-Porta et al. 2016)."),
],
"socotra-3": [
    Q("Which navigator links Socotra and Tristan da Cunha?", ["Vasco da Gama", "Tristão da Cunha", "James Cook", "Marco Polo"], 1, "He sighted Tristan in 1506 and helped capture Socotra's fort in 1507."),
    O("Order Socotra's modern political history.", ["British protectorate (1886)", "South Yemen (1967)", "Unified Yemen (1990)", "UAE-backed council takes control (2020)"], "1886 → 1967 → 1990 → 2020."),
],
"socotra-4": [
    Q("What is Soqotri?", ["A dialect of Arabic", "A Modern South Arabian language", "A creole of English", "A script"], 1, "A Semitic language distinct from Arabic, traditionally unwritten."),
    Q("Which Baldacchino idea best fits Socotra today?", ["Islands are always independent", "Both external and internal understandings are needed", "Islanders should not be studied", "Large islands matter most"], 1, "Decisions are being made far away while local knowledge holds the least formal power."),
],
# ------------------------------------------------------------- synthesis
"synthesis-0": [
    Q("Which course island is largest?", ["Socotra", "Falklands", "Tristan", "Surtsey"], 1, "About 12,000 km²."),
    Q("What best predicts whether a small island is inhabited?", ["Size alone", "Access (landing, harbour, lagoon) and history", "Latitude", "Rock type"], 1, "Access and history matter more than area or fertility."),
],
"synthesis-1": [
    Q("Where does the General Dynamic Model NOT apply well?", ["Surtsey", "The Pitcairn chain", "Continental fragments like Socotra", "Hawaiian islands"], 2, "Continental fragments inherit their biota and have different histories."),
    Q("Which island shows uplift rather than subsidence?", ["Funafuti", "Ducie", "Henderson", "Oeno"], 2, "Henderson was lifted on Pitcairn's flexural bulge."),
],
"synthesis-2": [
    M("Which must your capstone include? (choose all)", ["A map or terrain figure", "Critical review of 4+ papers", "A reflexive statement", "A photograph you took yourself"], [0, 1, 2], "Your own photo is welcome but not required."),
    Q("Why does Grydehøj urge study of Southeast Asian islands?", ["They are the largest", "Island studies has largely overlooked them, biasing generalisations", "They are easiest to reach", "They are all volcanic"], 1, "A sampling bias in the field itself."),
],
"intro": [
    Q("How many case-study islands does the course cover?", ["Four", "Six", "Eight", "Ten"], 1, "Funafuti, Pitcairn (with Henderson), the Falklands, Tristan da Cunha, Surtsey and Socotra."),
],
}

UNIT_QUIZ = {
"foundations": [
    Q("Which pairing of island and type is correct?", ["Surtsey: continental fragment", "Henderson: raised atoll", "Falklands: hotspot volcano", "Funafuti: continental shelf island"], 1, "Henderson is a former atoll lifted by flexure."),
    M("Which processes make old volcanic islands sink? (choose all)", ["Thermal subsidence of cooling plate", "Flexure under the volcano's weight", "Coral growth", "Glacial loading"], [0, 1], "Cooling plates sink and volcanoes bend the plate; coral growth responds to subsidence rather than causing it."),
    N("Using S = cA^z with z = 0.25, a 100-fold increase in area multiplies species by about…", 3.16, 0.2, "×", "100^0.25 = 3.16."),
    Q("In the General Dynamic Model, when is species richness highest?", ["At birth", "In mid-life", "When drowned", "It is constant"], 1, "Richness tracks area and relief, which peak in mid-life."),
    Q("The 'island rule' predicts that on islands…", ["All animals grow larger", "Small animals tend to grow larger and large ones smaller", "Plants become trees", "Birds always lose flight"], 1, "Foster 1964; Van Valen 1973."),
    Q("Baldacchino's main argument is that…", ["Only islanders should study islands", "Insider/outsider is too simple; both perspectives are needed", "Islands are not worth studying", "Mainland scholars are always wrong"], 1, "Hybridity is the norm, and both understandings are necessary."),
    Q("Grydehøj warns that generalising from Saint Helena or Nauru is like generalising from…", ["Greenland", "Manhattan", "Tasmania", "Malta"], 1, "A sampling problem: any single kind of island biases conclusions."),
    O("Order the five reading questions as taught.", ["Claim", "Method", "Evidence", "Uncertainty", "Scope"], "Claim → Method → Evidence → Uncertainty → Scope."),
],
"funafuti": [
    Q("Funafuti's reef sits on…", ["Continental granite", "A subsided volcano", "A glacier", "A sandbank only"], 1, "A Darwinian atoll on a drowned volcanic edifice."),
    N("Kench et al. found what percentage of Tuvalu's islands grew? (%)", 74, 2, "%", "About 74% grew and 27% shrank."),
    Q("Which islands were most likely to erode in Kench et al.'s data?", ["The largest reef-platform islands", "The smallest islands (<1 ha) and sand islands", "Inhabited islands", "None eroded"], 1, "Small and sandy islands were most prone to loss."),
    Q("Why do Kench et al. use the vegetation edge as the shoreline?", ["It is easy to see in every image and filters tides and waves", "It is legally defined", "It never changes", "Satellites cannot see sand"], 0, "A robust proxy, though it can lag beach change."),
    Q("Under which emissions scenario do Kench et al. say past island behaviour may NOT be a guide?", ["RCP2.6", "RCP8.5", "Both", "Neither"], 1, "Under RCP8.5 the rate of rise roughly doubles."),
    Q("Masselink et al. (2020) show gravel islands can keep pace with rising seas by…", ["Coral growth on land", "Wave overwash adding sediment on top", "People adding sand", "Tectonic uplift"], 1, "Overtopping moves sediment from the beach onto the island."),
    M("Which make an atoll islet's fresh water vulnerable? (choose all)", ["Drought", "Over-pumping", "Overwash by waves", "High mountains"], [0, 1, 2], "Thin lenses are easily salinised; atolls have no mountains."),
    Q("Why might seawalls be 'maladaptive' on reef islands?", ["They are too expensive only", "They block the natural sediment movement that lets islands adjust", "They attract tourists", "They raise sea level"], 1, "Fixing the shoreline can stop the overwash and migration that maintain islands."),
],
"pitcairn": [
    Q("Which Pitcairn island is a raised atoll?", ["Pitcairn", "Henderson", "Oeno", "Ducie"], 1, "Henderson."),
    Q("Why does Pitcairn have reefs dominated by algae and herbivorous fish?", ["Deep water", "Runoff from the high island and fishing pressure", "Cold currents only", "Plastic pollution"], 1, "Friedlander et al. link it to runoff (nutrients and iron) and fishing."),
    Q("Why is the correlation between island age and coral richness (r = 0.98) fragile?", ["It uses only four islands", "The r value is low", "It is from 1950", "Corals were not counted"], 0, "Four data points, with age, isolation and type all varying together."),
    Q("What did genetic data rule out as the cause of rats returning to Henderson?", ["Survival of a few rats", "Re-invasion from Pitcairn", "Poor bait timing", "Natural food"], 1, "The rats were Henderson rats, so survivors, not newcomers."),
    N("How many tonnes of debris did Lavers & Bond estimate on Henderson's beaches?", 17.6, 1, "t", "About 17.6 tonnes and 37.7 million items, a minimum estimate."),
    O("Order these Pitcairn events.", ["Carteret sights Pitcairn", "Bounty burned at Pitcairn", "Topaz finds the community", "Move to Norfolk Island"], "1767 → 1790 → 1808 → 1856."),
    Q("The Pitcairn Islands Marine Reserve is about…", ["8,000 km²", "83,000 km²", "834,000 km²", "8.3 million km²"], 2, "About 834,000 km², one of the world's largest."),
    Q("Which concept from Baldacchino best describes Pitcairn's political status?", ["Full sovereignty", "Autonomy without sovereignty", "Terra nullius", "Federalism"], 1, "A self-governing UK Overseas Territory."),
],
"falklands": [
    Q("Which rocks correlate the Falklands with South Africa?", ["Recent basalts", "The Cape and Karoo sequences, including a glacial tillite", "Coral limestone", "Granite only"], 1, "The match includes the late Palaeozoic glacial deposits."),
    Q("Cosmogenic exposure ages suggest the largest stone runs…", ["Formed in 1833", "Built up over several cold stages, perhaps over 700,000 years", "Formed only at the Last Glacial Maximum", "Are man-made"], 1, "Wilson et al. 2008."),
    Q("In Hamley et al. 2021, why is Mount Usborne's charcoal record important?", ["It has the most charcoal", "It is the control: a site unlikely to be visited by people", "It is the oldest", "It is on New Island"], 1, "It represents the natural fire regime."),
    Q("Austin et al. 2013 dated the split between the warrah and its mainland relative to about…", ["7 million years", "330,000 years", "16,000 years", "500 years"], 2, "About 16 ka (8–31 ka), during the last glacial phase."),
    Q("What is the main weakness in the bone-pile evidence?", ["No dates", "No cut marks were found", "The bones were modern", "They were on the mainland"], 1, "The authors explain the absence by bone and shell tools, but it means they rely on context."),
    N("Use the 3D model: at −125 m sea level, the Falklands land area becomes much larger. Roughly what multiple of today's area does the model show? (×)", 2.8, 0.4, "×", "In this model about 14,400 km² rises to about 40,400 km² within the frame, about 2.8 times. Try it with the sea-level slider."),
    Q("Why are there no native trees?", ["Too hot", "Cool, windy climate, isolation and history", "Too much rain", "Volcanic soils"], 1, "Wind, cool temperatures and isolation; the islands have lacked trees since at least the Pliocene."),
    Q("The 2013 referendum result was…", ["50.5% to stay British", "99.8% to stay British", "A vote for independence", "Not held"], 1, "99.8%."),
],
"tristan": [
    N("Tristan is about how many km east of the Mid-Atlantic Ridge?", 450, 60, "km", "About 450 km (Geissler et al. 2020)."),
    Q("Geissler et al. infer that some lava fields are younger than 60,000 years because…", ["They were dated by radiocarbon", "No sediment drapes them, given a known sedimentation rate", "Islanders remember them", "They are hot"], 1, "Sediment-drape reasoning, assuming a constant rate of 3.33 m/Myr."),
    Q("What is the main limitation of the seafloor interpretation?", ["No sonar data", "No rock samples (no ground truth)", "Too many samples", "It was done from space"], 1, "Interpretation rests on shape and backscatter."),
    Q("Which flood basalt province marks the plume's birth?", ["Deccan", "Siberian", "Etendeka–Paraná", "Columbia River"], 2, "About 132 Ma, as the South Atlantic opened."),
    Q("Why are mice so damaging on Gough?", ["They spread disease", "Seabirds evolved without mammal predators and have no defences", "They eat the grass", "They compete for fish"], 1, "Naïve prey."),
    O("Order Tristan events.", ["Tristão da Cunha sights the island", "British garrison", "Lifeboat disaster", "Volcanic eruption and evacuation"], "1506 → 1816 → 1885 → 1961."),
    N("Using the 3D model's west–east profile through Queen Mary's Peak, what is the summit height in the model? (m)", 2016, 60, "m", "The model peak is about 2,016 m; the surveyed height is about 2,060 m."),
    Q("Tristan's community is sometimes studied as a 'genetic isolate'. Baldacchino's challenge is…", ["Whether genes matter", "What a community gains or gives up by becoming a research site", "Whether the data are correct", "Whether Tristan is an island"], 1, "A 'whose terms' question."),
],
"surtsey": [
    Q("Surtsey's tectonic setting is…", ["An intraplate hotspot like Tristan", "The propagating tip of Iceland's rift zone", "A subduction zone", "A continental fragment"], 1, "Jackson et al. 2019."),
    Q("Why do Magnússon et al. (173 m) and Jackson et al. (150 m) give different heights?", ["One is wrong", "They probably refer to different dates or measures", "Different islands", "Units differ"], 1, "Always check what and when a number refers to."),
    N("By 2013, how many vascular plant species had ever been recorded on Surtsey?", 69, 0, "", "69 recorded; 59 present; 39 viable."),
    Q("Roughly what share of Surtsey's plant species arrived with birds?", ["10%", "25%", "50%", "75%"], 3, "About 75% bird, 15% wind, 10% sea."),
    Q("Why did wind-dispersed species colonise only after about 1990?", ["Less wind before", "They needed soil improved by gulls (and fungi)", "They were planted", "Volcanic gases"], 1, "Light seeds need ameliorated sites."),
    Q("A design limitation of the permanent plots is that…", ["They were placed randomly", "They were placed subjectively where plants were already growing", "There were too many", "They were on Heimaey"], 1, "Not a random sample of the island."),
    Q("The SUSTAIN drilling found that temperature at about 100 m depth had…", ["Risen", "Fallen from 141 °C (1980) to 124 °C (2017)", "Stayed at 141 °C", "Reached 500 °C"], 1, "The island is slowly cooling."),
    Q("Which statement best fits the General Dynamic Model?", ["Surtsey will keep growing", "Surtsey's area peaked early and is declining", "Surtsey has no species", "Surtsey is a continental fragment"], 1, "Ontogeny in fast motion."),
],
"socotra": [
    N("Socotra island's area is about how many km²?", 3625, 200, "km²", "3,625 km² (Garcia-Porta et al. 2016)."),
    Q("Why is Socotra's biota a mix of ancient relicts and later colonists?", ["It is a young volcano", "It is a continental fragment that later received overwater colonists", "It was joined to India", "Humans brought everything"], 1, "Continental inheritance plus overwater dispersal."),
    Q("In Garcia-Porta et al., the island signal appeared in…", ["Mean body size", "Disparity and rates of body-size evolution", "Head shape", "Colour"], 1, "Means did not differ; extremes and rates did."),
    Q("Why might Abd al Kuri have a giant gecko while Socotra has a dwarf?", ["Different climates", "Snakes on Socotra may limit large size", "Different rock", "Random"], 1, "A plausible, untested hypothesis from the paper."),
    Q("Maděra et al. note a slip in their dating of the Periplus. What is the conventional date?", ["Mid-1st century BC", "Mid-1st century AD", "5th century AD", "12th century"], 1, "Mid-first century AD."),
    N("A remote-sensing census counted about how many dragon's blood trees below 1,100 m?", 80134, 3000, "trees", "80,134 (Maděra et al. 2020)."),
    Q("What is the main barrier to dragon's blood tree regeneration?", ["Fire", "Goat grazing", "Logging", "Too much rain"], 1, "Seedlings need fencing."),
    Q("Who controls Socotra since 2020?", ["Oman", "The UAE-backed Southern Transitional Council", "The UK", "UNESCO"], 1, "Raising serious concerns for biodiversity and local self-determination."),
],
"synthesis": [
    M("Which islands in this course are volcanic? (choose all)", ["Tristan da Cunha", "Pitcairn", "Surtsey", "Socotra", "Falklands"], [0, 1, 2], "Socotra and the Falklands are continental."),
    Q("Seabirds on Surtsey effectively…", ["Lowered immigration", "Moved the equilibrium by adding nutrients and seeds", "Had no effect", "Caused extinction"], 1, "A subsidy that shifts both curves."),
    Q("Which paper's central finding challenges a 'sinking islands' narrative?", ["Lavers & Bond 2017", "Kench et al. 2018", "Austin et al. 2013", "Jackson et al. 2019"], 1, "Tuvalu's islands mostly grew."),
    Q("Which pair of papers disagree in a published exchange?", ["Hamley et al. 2021 and a comment by Clark et al.", "Kench and Masselink", "Magnússon and Jackson", "Amos and Friedlander"], 0, "The 2022 comment and reply in Science Advances."),
    O("Order these islands by area, smallest first.", ["Surtsey", "Funafuti (land)", "Pitcairn", "Tristan da Cunha", "Socotra", "Falklands"], "1.3, 2.6, 4.5, 98, 3,625, ≈12,000 km²."),
    Q("What does 'on whose terms' ask of your own capstone?", ["To use only island sources", "To reflect on whose perspectives and interests your account represents", "To avoid outsiders", "To write in an island language"], 1, "A reflexive statement."),
],
}

TASKS = {
"funafuti": [
    dict(title="Measure the edifice", steps=["Open the 3D model and choose a west–east cross-section through the middle of the atoll.", "Read the deepest point on the profile and the width of the flat top."],
         check=N("How tall is Funafuti's volcanic edifice from the deep sea floor to sea level, according to the model profile? (m, to the nearest 500)", 5000, 500, "m", "The profile drops to about −5,000 m, so the edifice is roughly 5 km tall.")),
],
"pitcairn": [
    dict(title="Compare two islands", steps=["Use the island switch to view Henderson, then Pitcairn.", "Note the 'highest' value in each model's statistics panel."],
         check=N("What is the difference in maximum height between Pitcairn and Henderson in the models? (m)", 287, 25, "m", "About 321 m − 34 m = 287 m.")),
],
"falklands": [
    dict(title="The ice-age Falklands", steps=["Set the sea level slider to −125 m.", "Read 'land above sea level' in the statistics panel and compare with 0 m."],
         check=N("How much land (km²) does the model show at −125 m? (to the nearest 2,000)", 40000, 3000, "km²", "About 40,400 km² within the model frame, nearly three times today's 14,400 km².")),
],
"tristan": [
    dict(title="The hidden volcano", steps=["Turn off the sea surface and set exaggeration to 1×.", "Draw a west–east profile through the summit (latitude ≈ −37.11°)."],
         check=N("What is the total relief along that profile, from deepest point to summit? (m, nearest 500)", 4000, 500, "m", "From about −2,000 m at the frame edge to about 2,000 m: about 4 km within this frame. The real base is deeper still.")),
],
"surtsey": [
    dict(title="Sea-level sensitivity", steps=["Raise the sea level slider to +10 m.", "Note how the land area changes compared with 0 m."],
         check=Q("Which happens at +10 m in the model?", ["Surtsey disappears", "Land area falls by about a third; the high ground remains", "Land area grows", "No change"], 1, "In the model, land within the frame falls from about 29 to 19 km²: low ground floods, but the cones and cliffs remain.")),
],
"socotra": [
    dict(title="Cross the island", steps=["Choose a north–south cross-section with the slider in the middle.", "Read the highest point on the profile, then look for flatter benches either side of it."],
         check=N("What is the highest elevation on that north–south profile? (m, nearest 100)", 900, 150, "m", "About 900 m in the model, with lower plateau benches at roughly 300–700 m.")),
],
}
