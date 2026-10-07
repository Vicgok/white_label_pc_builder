import { CRITICAL_OBJECTS, type ModelManifest } from './scene-types';

export function parseModelManifest(value: unknown): ModelManifest {
  if (!value || typeof value !== 'object') throw new Error('Invalid model manifest');
  const manifest = value as ModelManifest;
  if (manifest.version !== 1 || manifest.units !== 'meters' || manifest.asset !== 'rigpilot-demo-pc.glb' || !manifest.parts) {
    throw new Error('Unsupported model manifest');
  }
  for (const name of CRITICAL_OBJECTS) {
    if (!manifest.parts[name]) throw new Error(`Missing manifest part: ${name}`);
  }
  for (const part of Object.values(manifest.parts)) {
    if (!part || typeof part.category !== 'string' || typeof part.productId !== 'string' ||
        typeof part.displayName !== 'string' || !Array.isArray(part.explodedOffset) ||
        part.explodedOffset.length !== 3 || !part.explodedOffset.every(Number.isFinite)) {
      throw new Error('Invalid part metadata');
    }
  }
  return { ...manifest, cableObjects: Array.isArray(manifest.cableObjects) ? manifest.cableObjects : [] };
}
