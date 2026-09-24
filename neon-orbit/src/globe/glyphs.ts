import type { Glyph } from '../sat/types';

const cache = new Map<string, string>();

/**
 * Neon marker sprites: a soft glow in the group colour with a crisp shape on top.
 * Returned as data URLs so Cesium's texture atlas de-duplicates identical sprites.
 */
export function glyphUrl(glyph: Glyph, color: string, size = 32): string {
  const key = `${glyph}|${color}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const m = size / 2;
  const glow = g.createRadialGradient(m, m, 0, m, m, m);
  glow.addColorStop(0, `${color}cc`);
  glow.addColorStop(0.35, `${color}55`);
  glow.addColorStop(1, `${color}00`);
  g.fillStyle = glow;
  g.fillRect(0, 0, size, size);

  const r = size * 0.2;
  g.fillStyle = color;
  g.strokeStyle = '#ffffff';
  g.lineWidth = Math.max(1, size / 24);
  g.beginPath();
  switch (glyph) {
    case 'dot':
      g.arc(m, m, r * 0.8, 0, Math.PI * 2);
      break;
    case 'ring':
      g.arc(m, m, r, 0, Math.PI * 2);
      g.lineWidth = size / 10;
      g.strokeStyle = color;
      g.stroke();
      g.beginPath();
      g.arc(m, m, r * 0.35, 0, Math.PI * 2);
      break;
    case 'square':
      g.rect(m - r, m - r, r * 2, r * 2);
      break;
    case 'diamond':
      g.moveTo(m, m - r * 1.3);
      g.lineTo(m + r * 1.3, m);
      g.lineTo(m, m + r * 1.3);
      g.lineTo(m - r * 1.3, m);
      g.closePath();
      break;
    case 'triangle':
      g.moveTo(m, m - r * 1.3);
      g.lineTo(m + r * 1.2, m + r * 0.9);
      g.lineTo(m - r * 1.2, m + r * 0.9);
      g.closePath();
      break;
    case 'hex':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        g.lineTo(m + Math.cos(a) * r * 1.2, m + Math.sin(a) * r * 1.2);
      }
      g.closePath();
      break;
    case 'plus':
      g.rect(m - r * 1.3, m - r * 0.4, r * 2.6, r * 0.8);
      g.rect(m - r * 0.4, m - r * 1.3, r * 0.8, r * 2.6);
      break;
    case 'cross': {
      g.translate(m, m);
      g.rotate(Math.PI / 4);
      g.rect(-r * 1.3, -r * 0.35, r * 2.6, r * 0.7);
      g.rect(-r * 0.35, -r * 1.3, r * 0.7, r * 2.6);
      g.setTransform(1, 0, 0, 1, 0, 0);
      break;
    }
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 ? r * 0.6 : r * 1.5;
        g.lineTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr);
      }
      g.closePath();
      break;
  }
  g.fill();
  // White core makes markers read as "lit" against any basemap.
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(m, m, Math.max(1, size / 22), 0, Math.PI * 2);
  g.fill();
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

/** Pulsing selection reticle. */
export function reticleUrl(color: string, size = 96): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const m = size / 2;
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(m, m, size * 0.3, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    g.beginPath();
    g.arc(m, m, size * 0.42, a - 0.35, a + 0.35);
    g.stroke();
  }
  return c.toDataURL();
}
