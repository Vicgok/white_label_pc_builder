import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FrontSide, Mesh, MeshPhysicalMaterial, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { animateModel, cloneModel, disposeModel, highlightModel } from './model-scene';
import { issuesForPart, logicalPart } from './part-map';
import { parseModelManifest } from './model-manifest';
import type { ModelManifest } from './scene-types';

let source: Object3D;
let manifest: ModelManifest;
beforeAll(async () => {
  manifest = parseModelManifest(JSON.parse(readFileSync(new URL('../../../public/assets/3d/rigpilot-demo-pc.manifest.json', import.meta.url), 'utf8')));
  const bytes = readFileSync(new URL('../../../public/assets/3d/rigpilot-demo-pc.glb', import.meta.url));
  const loaded = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  source = loaded.scene;
});

describe('actual RigPilot GLB interactions', () => {
  it('clones the hierarchy and materials while sharing immutable geometry', () => {
    const model = cloneModel(source, manifest);
    const originalMeshes: Mesh[] = [], clonedMeshes: Mesh[] = [];
    source.traverse(o => { if (o instanceof Mesh) originalMeshes.push(o); });
    model.scene.traverse(o => { if (o instanceof Mesh) clonedMeshes.push(o); });
    originalMeshes.forEach((o, i) => {
      expect(clonedMeshes[i]).not.toBe(o);
      expect(clonedMeshes[i].geometry).toBe(o.geometry);
      expect(clonedMeshes[i].material).not.toBe(o.material);
    });
    const originalMaterials = originalMeshes.map(o => JSON.stringify(o.material));
    highlightModel(model, 'gpu', new Set(['memory']));
    animateModel(model, 1, true, 1, true);
    expect(originalMeshes.map(o => JSON.stringify(o.material))).toEqual(originalMaterials);
    disposeModel(model);
  });

  it('uses manifest offsets without drift and assembles back to exact transforms', () => {
    const model = cloneModel(source, manifest);
    for (let repeat = 0; repeat < 3; repeat++) {
      for (let frame = 0; frame < 100; frame++) animateModel(model, 1, true, 1 / 60);
      for (const part of model.parts) {
        const expected = part.position.clone().add(part.object.name === 'Case_Chassis' ? part.offset.clone().set(0, 0, 0) : part.offset);
        expect(part.object.position.toArray()).toEqual(expected.toArray());
      }
      expect(model.scene.getObjectByName('Case_SideGlass')?.visible).toBe(false);
      for (let frame = 0; frame < 100; frame++) animateModel(model, 0, false, 1 / 60);
      for (const part of model.parts) {
        expect(part.object.position.toArray()).toEqual(part.position.toArray());
        expect(part.object.quaternion.toArray()).toEqual(part.quaternion.toArray());
        expect(part.object.scale.toArray()).toEqual(part.scale.toArray());
        expect(part.object.visible).toBe(true);
      }
      expect(model.cables.every(c => c.visible)).toBe(true);
    }
    disposeModel(model);
  });

  it('moves only the side glass when hiding glass', () => {
    const model = cloneModel(source, manifest);
    animateModel(model, 0, true, 1, true);
    for (const part of model.parts) if (part.object.name !== 'Case_SideGlass') {
      expect(part.object.position.toArray()).toEqual(part.position.toArray());
    }
    expect(model.surfaces.filter(s => s.glass).every(s => s.material.opacity < s.opacity)).toBe(true);
    animateModel(model, 0, false, 1, true);
    expect(model.surfaces.every(s => s.material.opacity === s.opacity && s.material.transparent === s.transparent)).toBe(true);
    disposeModel(model);
  });

  it('overrides only the two glass panes and keeps their material through hide/show and explode', () => {
    const model = cloneModel(source, manifest);
    const panes = model.surfaces.filter(surface => surface.opticalGlass);
    expect(panes).toHaveLength(2);
    expect(panes[0].material).not.toBe(panes[1].material);
    const materials = panes.map(surface => surface.material);
    for (const material of materials) {
      expect(material).toBeInstanceOf(MeshPhysicalMaterial);
      const glass = material as MeshPhysicalMaterial;
      expect(glass.transmission).toBe(0);
      expect(glass.thickness).toBe(0);
      expect(glass.opacity).toBe(.14);
      expect(glass.normalMap).toBeNull();
      expect(glass.roughnessMap).toBeNull();
      expect(glass.depthWrite).toBe(false);
      expect(glass.depthTest).toBe(true);
      expect(glass.side).toBe(FrontSide);
    }
    const originalMeshes: Mesh[] = [], clonedMeshes: Mesh[] = [];
    source.traverse(object => { if (object instanceof Mesh) originalMeshes.push(object); });
    model.scene.traverse(object => { if (object instanceof Mesh) clonedMeshes.push(object); });
    originalMeshes.forEach((original, index) => {
      const originalMaterials = Array.isArray(original.material) ? original.material : [original.material];
      const clonedMaterial = clonedMeshes[index].material;
      const clonedMaterials = Array.isArray(clonedMaterial) ? clonedMaterial : [clonedMaterial];
      originalMaterials.forEach((material, materialIndex) => {
        if (material instanceof MeshPhysicalMaterial && material.transmission > 0) return;
        // All hardware and panel frames retain their original material values.
        const before = material.toJSON(), after = clonedMaterials[materialIndex].toJSON();
        expect(after).toEqual({ ...before, uuid: after.uuid });
      });
    });
    highlightModel(model, 'case', new Set(['case']));
    expect(materials.every(material => (material as MeshPhysicalMaterial).emissiveIntensity === 1 &&
      (material as MeshPhysicalMaterial).emissive.getHex() === 0)).toBe(true);
    animateModel(model, 0, true, 1, true);
    expect(panes.find(surface => !surface.glass)?.material.opacity).toBe(.14);
    animateModel(model, 1, false, 1, true);
    animateModel(model, 0, false, 1, true);
    panes.forEach((surface, index) => expect(surface.material).toBe(materials[index]));
    expect(panes.every(surface => surface.material.opacity === .14 && !surface.material.depthWrite)).toBe(true);
    disposeModel(model);
  });

  it('shows the reference chassis and only selected hardware for an incomplete build', () => {
    const model = cloneModel(source, manifest);
    animateModel(model, 0, false, 1, true, new Set(['case', 'gpu']), manifest);
    expect(model.scene.getObjectByName('Case_Chassis')?.visible).toBe(true);
    expect(model.scene.getObjectByName('GPU')?.visible).toBe(true);
    expect(model.scene.getObjectByName('Motherboard')?.visible).toBe(false);
    expect(model.scene.getObjectByName('AIO_Tube_A')?.visible).toBe(false);
    animateModel(model, 0, false, 1, true);
    expect(model.parts.every(part => part.object.visible)).toBe(true);
    disposeModel(model);
  });

  it('maps actual primitive children to logical hardware and permits missing optional fans', () => {
    for (const [name, expected] of [['GPU_Fan_01', 'gpu'], ['RAM_02', 'memory'], ['AIO_Tube_B', 'cooling'], ['SSD_M2', 'storage']]) {
      const object = source.getObjectByName(name)!;
      let mesh: Object3D | undefined;
      object.traverse(o => { if (o instanceof Mesh) mesh = o; });
      expect(logicalPart(mesh!, manifest)).toBe(expected);
    }
    const optional = source.clone(true);
    optional.getObjectByName('RearFan_01')?.removeFromParent();
    const model = cloneModel(optional, manifest);
    disposeModel(model);
    optional.getObjectByName('GPU')?.removeFromParent();
    expect(() => cloneModel(optional, manifest)).toThrow('Missing core model object: GPU');
  });

  it('routes existing clearance messages to the GPU and case without generating rules', () => {
    const issue = { code: 'gpu-length', category: 'case' as const, severity: 'error' as const,
      title: 'Graphics card is too long', message: 'The GPU is 340mm; this case allows 320mm.' };
    expect(issuesForPart('gpu', [issue])).toEqual([issue]);
    expect(issuesForPart('case', [issue])).toEqual([issue]);
    expect(issuesForPart('storage', [issue])).toEqual([]);
    expect(() => parseModelManifest({ ...manifest, parts: { ...manifest.parts, GPU: { ...manifest.parts.GPU, explodedOffset: [NaN, 0, 0] } } })).toThrow();
  });
});
