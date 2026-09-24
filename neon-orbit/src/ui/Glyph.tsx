import type { Glyph as GlyphName } from '../sat/types';

/** Inline SVG version of the globe marker shapes — the secondary identity channel. */
export function Glyph({ glyph, color, size = 12 }: { glyph: GlyphName; color: string; size?: number }) {
  const s = 12;
  const m = 6;
  let shape;
  switch (glyph) {
    case 'dot':
      shape = <circle cx={m} cy={m} r={3.2} />;
      break;
    case 'ring':
      shape = <circle cx={m} cy={m} r={3.6} fill="none" stroke={color} strokeWidth={2} />;
      break;
    case 'square':
      shape = <rect x={2.5} y={2.5} width={7} height={7} />;
      break;
    case 'diamond':
      shape = <polygon points="6,1 11,6 6,11 1,6" />;
      break;
    case 'triangle':
      shape = <polygon points="6,1.2 11,10 1,10" />;
      break;
    case 'hex':
      shape = <polygon points="6,1 10.5,3.5 10.5,8.5 6,11 1.5,8.5 1.5,3.5" />;
      break;
    case 'plus':
      shape = <path d="M4.5 1h3v3.5H11v3H7.5V11h-3V7.5H1v-3h3.5z" />;
      break;
    case 'cross':
      shape = <path d="M4.5 1h3v3.5H11v3H7.5V11h-3V7.5H1v-3h3.5z" transform="rotate(45 6 6)" />;
      break;
    case 'star':
      shape = <polygon points="6,0.5 7.5,4.3 11.5,4.5 8.4,7 9.4,11 6,8.8 2.6,11 3.6,7 0.5,4.5 4.5,4.3" />;
      break;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${s} ${s}`} fill={color} aria-hidden style={{ flex: 'none', filter: `drop-shadow(0 0 3px ${color})` }}>
      {shape}
    </svg>
  );
}
