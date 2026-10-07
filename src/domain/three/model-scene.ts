import { Box3, Color, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import { castsPreviewShadow, FOCUS_OBJECTS, logicalPart } from './part-map';
import { CRITICAL_OBJECTS, type ModelManifest, type PreviewPart } from './scene-types';
import { createClearPcGlassMaterial } from './pc-glass-material';

type Transform = { object: Object3D; position: Vector3; quaternion: Quaternion; scale: Vector3; offset: Vector3 };
type Surface = {
  material: Material; part: PreviewPart | null; glass: boolean; opticalGlass: boolean;
  opacity: number; transparent: boolean; depthWrite: boolean; color?: Color; emissive?: Color; emissiveIntensity?: number;
};
export type ModelInstance = {
  scene: Object3D; parts: Transform[]; surfaces: Surface[]; cables: Object3D[];
  explodeProgress: number; glassProgress: number; scratch: Vector3;
};

export function cloneModel(source: Object3D, manifest: ModelManifest): ModelInstance {
  for (const name of CRITICAL_OBJECTS) {
    if (!source.getObjectByName(name)) throw new Error(`Missing core model object: ${name}`);
  }
  const scene = source.clone(true);
  const parts: Transform[] = [];
  for (const [name, entry] of Object.entries(manifest.parts)) {
    const object = scene.getObjectByName(name);
    if (!object) continue; // Optional geometry is allowed to be absent.
    parts.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(),
      scale: object.scale.clone(), offset: new Vector3(...entry.explodedOffset) });
  }
  const surfaces: Surface[] = [];
  scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const part = logicalPart(object, manifest);
    const glass = hasAncestor(object, 'Case_SideGlass');
    const glassPanel = glass || hasAncestor(object, 'Case_FrontGlass');
    let hasOpticalGlass = false;
    const clone = (material: Material) => {
      // These named groups also contain metal frames; override only their panes.
      const opticalGlass = glassPanel && material instanceof MeshPhysicalMaterial && material.transmission > 0;
      hasOpticalGlass ||= opticalGlass;
      const owned = opticalGlass ? createClearPcGlassMaterial() : material.clone();
      const pbr = owned instanceof MeshStandardMaterial ? owned : null;
      surfaces.push({ material: owned, part, glass, opticalGlass, opacity: owned.opacity, transparent: owned.transparent,
        depthWrite: owned.depthWrite, color: pbr?.color.clone(), emissive: pbr?.emissive.clone(), emissiveIntensity: pbr?.emissiveIntensity });
      return owned;
    };
    object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    object.castShadow = castsPreviewShadow(object);
    object.receiveShadow = !hasOpticalGlass;
    // Transmissive surfaces should not cast solid black shadows.
    if (hasOpticalGlass || (Array.isArray(object.material) ? object.material : [object.material]).some(m => 'transmission' in m && Number(m.transmission) > 0)) object.castShadow = false;
  });
  return { scene, parts, surfaces, cables: manifest.cableObjects.flatMap(name => {
    const object = scene.getObjectByName(name); return object ? [object] : [];
  }), explodeProgress: 0, glassProgress: 0, scratch: new Vector3() };
}

function hasAncestor(object: Object3D, name: string) {
  for (let parent: Object3D | null = object; parent; parent = parent.parent) if (parent.name === name) return true;
  return false;
}

export function highlightModel(model: ModelInstance, selected: PreviewPart | null, warnings: ReadonlySet<PreviewPart>) {
  for (const surface of model.surfaces) {
    const material = surface.material;
    if (!(material instanceof MeshStandardMaterial) || !surface.color || !surface.emissive) continue;
    material.color.copy(surface.color);
    material.emissive.copy(surface.emissive);
    material.emissiveIntensity = surface.emissiveIntensity ?? 0;
    if (surface.opticalGlass || ('transmission' in material && Number(material.transmission) > 0)) continue;
    if (surface.part && (selected === surface.part || warnings.has(surface.part))) {
      const warning = warnings.has(surface.part);
      material.emissive.set(warning ? '#B88746' : '#B7C5CE');
      material.emissiveIntensity = selected === surface.part ? .06 : .025;
      if (selected === surface.part) material.color.lerp(new Color('#8B959E'), .04);
    }
  }
}

const approach = (current: number, target: number, delta: number, immediate: boolean) => {
  const next = immediate ? target : current + (target - current) * (1 - Math.exp(-12 * Math.min(delta, .25)));
  return Math.abs(next - target) < .0001 ? target : next;
};

export function animateModel(model: ModelInstance, explode: number, hideGlass: boolean, delta: number, immediate = false,
  visibleParts?: ReadonlySet<PreviewPart>, manifest?: ModelManifest) {
  model.explodeProgress = approach(model.explodeProgress, explode, delta, immediate);
  model.glassProgress = approach(model.glassProgress, hideGlass ? 1 : 0, delta, immediate);
  const progress = model.explodeProgress;
  for (const part of model.parts) {
    // Chassis is the fixed anchor. Glass removal uses its own manifest offset.
    const amount = part.object.name === 'Case_Chassis' ? 0 : part.object.name === 'Case_SideGlass'
      ? Math.max(progress, model.glassProgress) : progress;
    part.object.position.copy(part.position).addScaledVector(part.offset, amount);
    part.object.quaternion.copy(part.quaternion);
    part.object.scale.copy(part.scale);
    const category = manifest ? logicalPart(part.object, manifest) : null;
    part.object.visible = !category || !visibleParts || visibleParts.has(category);
    if (part.object.name === 'Case_SideGlass') part.object.visible = part.object.visible && model.glassProgress < .9999;
  }
  for (const surface of model.surfaces) {
    if (!surface.glass) continue;
    const fade = model.glassProgress;
    const transparent = fade > 0 || surface.transparent;
    if (surface.material.transparent !== transparent) {
      surface.material.transparent = transparent;
      surface.material.needsUpdate = true;
    }
    surface.material.opacity = surface.opacity * (1 - fade * .85);
    surface.material.depthWrite = fade === 0 ? surface.depthWrite : false;
  }
  // Rigid cables and coolant tubes cannot stretch to separated hardware.
  for (const cable of model.cables) cable.visible = progress < .015 && (!visibleParts || ['gpu', 'motherboard'].every(part => visibleParts.has(part as PreviewPart)));
  for (const part of model.parts) if (part.object.name.startsWith('AIO_Tube_')) part.object.visible = part.object.visible && progress < .015;
}

export function partBounds(model: ModelInstance, part: PreviewPart) {
  model.scene.updateMatrixWorld(true);
  const bounds = new Box3();
  for (const name of FOCUS_OBJECTS[part]) {
    const object = model.scene.getObjectByName(name);
    if (object) bounds.expandByObject(object);
  }
  return bounds;
}

export function disposeModel(model: ModelInstance) {
  // Geometry and textures are shared with the immutable loader cache.
  model.surfaces.forEach(surface => surface.material.dispose());
}
