/**
 * Personalise the deck here — this is the only file you *need* to edit.
 */
export const SITE = {
  title: 'NEON//ORBIT',
  tagline: 'live orbital traffic + earth observation deck',
  /** Shown in the About panel. */
  owner: 'your name here',
  links: [
    { label: 'GitHub', href: 'https://github.com/jvi-44' },
  ] as { label: string; href: string }[],
  /** Where the camera starts (defaults to Singapore). */
  home: { lon: 103.82, lat: 1.35, heightM: 24_000_000 },
  /** Observer location for "overhead now" (same as home by default). */
  observer: { lon: 103.82, lat: 1.35, label: 'Singapore' },
};
