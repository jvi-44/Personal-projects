/** CelesTrak OMM (Orbit Mean-elements Message) JSON record. */
export interface OMM {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE?: number;
  CLASSIFICATION_TYPE?: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH?: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

export type ModelKind = 'iss' | 'station' | 'starlink' | 'gnss' | 'eo' | 'hubble' | 'geo' | 'cubesat' | 'generic';

export type Glyph = 'dot' | 'star' | 'square' | 'triangle' | 'diamond' | 'hex' | 'plus' | 'ring' | 'cross';

export interface Sat {
  /** Index into the propagation buffer. */
  idx: number;
  norad: number;
  name: string;
  intlDes: string;
  /** Group ids this object belongs to (in catalogue order). */
  groups: string[];
  /** Sub-constellation (e.g. GPS / Galileo inside GNSS). */
  sub?: string;
  kind: ModelKind;
  omm: OMM;
}
