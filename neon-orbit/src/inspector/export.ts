import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { ModelKind } from '../sat/types';
import { buildModel } from './models';

const cache = new Map<string, ArrayBuffer>();

/** Export a procedural model as GLB so Cesium can fly it on the globe. */
export async function buildGlbUrl(kind: ModelKind, accent: string): Promise<string> {
  const key = `${kind}|${accent}`;
  let buf = cache.get(key);
  if (!buf) {
    const { root } = buildModel(kind, accent);
    const out = await new GLTFExporter().parseAsync(root, { binary: true });
    buf = out as ArrayBuffer;
    cache.set(key, buf);
  }
  return URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
}
