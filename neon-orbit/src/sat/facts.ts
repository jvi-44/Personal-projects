import type { Sat } from './types';

export interface Profile {
  operator?: string;
  launched?: string;
  mission: string;
  notes?: string[];
}

/** Hand-written profiles for well-known objects (by NORAD id). */
const BY_ID: Record<number, Profile> = {
  25544: {
    operator: 'NASA · Roscosmos · ESA · JAXA · CSA',
    launched: '1998-11-20 (first module, Zarya)',
    mission: 'Crewed microgravity laboratory',
    notes: ['Continuously crewed since November 2000', 'Truss span ≈ 109 m — about a football pitch', 'Laps Earth roughly every 92 minutes'],
  },
  48274: {
    operator: 'China Manned Space Agency',
    launched: '2021-04-29 (Tianhe core)',
    mission: 'Crewed space station',
    notes: ['T-shaped: Tianhe core + Wentian and Mengtian labs (2022)', 'Crews rotate on Shenzhou spacecraft'],
  },
  20580: {
    operator: 'NASA / ESA',
    launched: '1990-04-24 · STS-31, Space Shuttle Discovery',
    mission: 'Ultraviolet / visible / near-IR space telescope',
    notes: ['2.4 m primary mirror', 'Serviced by five Shuttle missions (1993–2009)'],
  },
  49260: {
    operator: 'NASA / USGS',
    launched: '2021-09-27 · Atlas V, Vandenberg',
    mission: 'Land imaging — OLI-2 and TIRS-2 instruments',
    notes: ['705 km sun-synchronous orbit', '16-day repeat; 8 days combined with Landsat 8'],
  },
  39084: {
    operator: 'NASA / USGS',
    launched: '2013-02-11 · Atlas V, Vandenberg',
    mission: 'Land imaging — OLI and TIRS instruments',
    notes: ['Paired with Landsat 9 for an 8-day revisit'],
  },
  40697: {
    operator: 'ESA / EU Copernicus',
    launched: '2015-06-23 · Vega, Kourou',
    mission: 'Multispectral imaging (MSI: 13 bands, 10–60 m)',
    notes: ['290 km swath', 'Data free and open through Copernicus'],
  },
  43013: {
    operator: 'NOAA / NASA',
    launched: '2017-11-18 · Delta II, Vandenberg',
    mission: 'Polar-orbiting weather satellite (JPSS-1)',
    notes: ['Instruments: VIIRS, CrIS, ATMS, OMPS, CERES'],
  },
  25994: {
    operator: 'NASA',
    launched: '1999-12-18 · Atlas IIAS, Vandenberg',
    mission: 'Earth system science flagship',
    notes: ['Instruments: MODIS, ASTER, MISR, CERES, MOPITT'],
  },
};

/** Family-level profiles matched on the catalogue name. */
const FAMILIES: [RegExp, Profile][] = [
  [/^STARLINK/, { operator: 'SpaceX', mission: 'Broadband internet mega-constellation', notes: ['Shells between ~340 and ~570 km', 'Laser inter-satellite links'] }],
  [/^GPS|NAVSTAR/, { operator: 'U.S. Space Force', mission: 'Global Positioning System', notes: ['~20,200 km altitude, 55° inclination', 'Orbits twice per sidereal day'] }],
  [/^COSMOS|GLONASS/, { operator: 'Roscosmos', mission: 'GLONASS navigation', notes: ['~19,100 km altitude, 64.8° inclination', 'Three orbital planes'] }],
  [/^GSAT0|GALILEO/, { operator: 'EU (EUSPA) · ESA', mission: 'Galileo navigation', notes: ['~23,222 km altitude, 56° inclination', 'Carries search-and-rescue transponders'] }],
  [/^BEIDOU/, { operator: 'China Satellite Navigation Office', mission: 'BeiDou navigation (BDS)', notes: ['Mix of MEO, inclined-GEO and GEO satellites'] }],
  [/^SENTINEL-1/, { operator: 'ESA / EU Copernicus', mission: 'C-band radar imaging — sees through cloud, day and night' }],
  [/^SENTINEL-2/, { operator: 'ESA / EU Copernicus', mission: 'Multispectral land imaging (10 m)' }],
  [/^SENTINEL-3/, { operator: 'ESA / EUMETSAT', mission: 'Ocean & land colour, sea-surface temperature and altimetry' }],
  [/^SENTINEL-5P/, { operator: 'ESA / EU Copernicus', mission: 'TROPOMI atmospheric chemistry — NO₂, O₃, CH₄, CO, SO₂, aerosols' }],
  [/^SENTINEL-6/, { operator: 'ESA · EUMETSAT · NASA · NOAA', mission: 'Sea-level radar altimetry' }],
  [/^SWARM/, { operator: 'ESA', mission: 'Three-satellite survey of Earth’s magnetic field' }],
  [/^CRYOSAT/, { operator: 'ESA', mission: 'Radar altimetry of ice-sheet and sea-ice thickness' }],
  [/^PROBA/, { operator: 'ESA', mission: 'Technology demonstration / small Earth-observation mission' }],
  [/^EARTHCARE/, { operator: 'ESA / JAXA', mission: 'Clouds, aerosols and radiation' }],
  [/^BIOMASS/, { operator: 'ESA', mission: 'P-band radar measuring forest biomass' }],
  [/^TELEOS/, { operator: 'Singapore (ST Engineering)', mission: 'Earth observation — TeLEOS-2 carries a synthetic-aperture radar' }],
  [/^(DS-EO|DS-SAR|NEUSAR)/, { operator: 'Singapore (DSTA / ST Engineering)', mission: 'Earth observation (optical / radar)' }],
  [/^(VELOX|X-SAT|GALASSIA|KENT RIDGE|SCOOB|NULION|LUMELITE|ATHENOXAT)/, { operator: 'Singapore universities & industry', mission: 'Research / technology demonstration small satellite' }],
  [/^(NOAA|GOES|METOP|HIMAWARI|METEOSAT|FENGYUN|FY-)/, { mission: 'Meteorology — imagery and soundings for weather forecasting' }],
  [/^LANDSAT/, { operator: 'NASA / USGS', mission: 'Land imaging — the longest continuous record of Earth’s surface from space (since 1972)' }],
];

export function profileFor(sat: Sat): Profile | null {
  if (BY_ID[sat.norad]) return BY_ID[sat.norad];
  const hit = FAMILIES.find(([re]) => re.test(sat.name));
  return hit ? hit[1] : null;
}

/** "1998-067A" → launch year 1998. */
export function launchYear(intlDes: string): number | null {
  const m = /^(\d{4})-/.exec(intlDes);
  return m ? Number(m[1]) : null;
}
