import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Mesh, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cloneModel, disposeModel } from './model-scene';
import { animateHero, createHeroAnimation } from './homepage-explosion';
import { parseModelManifest } from './model-manifest';
import type { ModelManifest } from './scene-types';

let source: Object3D, manifest: ModelManifest;
beforeAll(async () => {
  manifest = parseModelManifest(JSON.parse(readFileSync(new URL('../../../public/assets/3d/rigpilot-demo-pc.manifest.json', import.meta.url), 'utf8')));
  const bytes = readFileSync(new URL('../../../public/assets/3d/rigpilot-demo-pc.glb', import.meta.url));
  source = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
});

function fixture() {
  const model = cloneModel(source, manifest);
  const animation = createHeroAnimation(model);
  const displacement = (name: string) => {
    const part = model.parts.find(part => part.object.name === name)!;
    return part.object.position.clone().sub(part.position);
  };
  const dispose = () => { animation.hoses.forEach(hose => hose.geometry.dispose()); disposeModel(model); };
  return { model, animation, displacement, dispose };
}

describe('homepage cinematic choreography on the existing GLB', () => {
  it('opens panels before unseating hardware, keeping the chassis fixed', () => {
    const { animation, displacement, dispose } = fixture();
    animateHero(animation, .25, false, false);
    expect(displacement('Case_SideGlass').x).toBeLessThan(-.1);
    expect(displacement('Case_TopPanel').y).toBeGreaterThan(0);
    for (const name of ['GPU', 'Motherboard', 'RAM_01', 'AIO_Radiator', 'PSU', 'SSD_M2', 'Case_Chassis']) {
      expect(displacement(name).length()).toBe(0);
    }
    animateHero(animation, 1, false, false);
    expect(displacement('Case_Chassis').length()).toBe(0);
    expect(displacement('GPU').x).toBeLessThan(0);
    expect(displacement('Case_TopPanel').y).toBeGreaterThan(displacement('AIO_Radiator').y);
    expect(displacement('AIO_Fan_01').toArray()).toEqual(displacement('AIO_Radiator').toArray());
    dispose();
  });

  it('carries seated RAM, pump and SSD with the board until their own stage', () => {
    const { animation, displacement, dispose } = fixture();
    animateHero(animation, .53, false, false);
    const boardDelta = displacement('Motherboard');
    expect(boardDelta.length()).toBeGreaterThan(0);
    for (const name of ['RAM_01', 'RAM_02', 'AIO_Pump', 'SSD_M2']) {
      expect(displacement(name).distanceTo(boardDelta)).toBeLessThan(1e-12);
    }
    dispose();
  });

  it('keeps the AIO connected, isolates geometry and restores every original transform without drift', () => {
    const { model, animation, dispose } = fixture();
    const originalHoses: Mesh[] = [];
    for (const name of ['AIO_Tube_A', 'AIO_Tube_B']) source.getObjectByName(name)!.traverse(o => { if (o instanceof Mesh) originalHoses.push(o); });
    const cached = originalHoses.map(mesh => Array.from(mesh.geometry.getAttribute('position').array));
    const materials = model.surfaces.map(surface => surface.material.uuid);
    for (let repeat = 0; repeat < 3; repeat++) {
      animateHero(animation, 1, false, false);
      expect(animation.hoses).toHaveLength(2);
      expect(animation.hoses.every((hose, i) => hose.geometry !== originalHoses[i].geometry)).toBe(true);
      expect(model.scene.getObjectByName('AIO_Tube_A')!.visible).toBe(true);
      expect(model.cables.every(cable => !cable.visible)).toBe(true);
      animateHero(animation, 0, false, false);
      for (const part of model.parts) {
        expect(part.object.position.toArray()).toEqual(part.position.toArray());
        expect(part.object.quaternion.toArray()).toEqual(part.quaternion.toArray());
        expect(part.object.scale.toArray()).toEqual(part.scale.toArray());
      }
      for (const hose of animation.hoses) expect(Array.from(hose.geometry.getAttribute('position').array)).toEqual(Array.from(hose.original));
      expect(model.cables.every(cable => cable.visible)).toBe(true);
    }
    expect(originalHoses.map(mesh => Array.from(mesh.geometry.getAttribute('position').array))).toEqual(cached);
    expect(model.surfaces.map(surface => surface.material.uuid)).toEqual(materials);
    dispose();
  });

  it('simplifies mobile motion and holds the final composition', () => {
    const { model, animation, displacement, dispose } = fixture();
    animateHero(animation, .9, true, false);
    for (const name of ['Motherboard', 'RAM_01', 'RAM_02', 'PSU', 'SSD_M2', 'AIO_Pump']) expect(displacement(name).length()).toBe(0);
    expect(displacement('GPU').length()).toBeGreaterThan(0);
    const held = model.parts.map(part => part.object.position.toArray());
    animateHero(animation, 1, true, false);
    expect(model.parts.map(part => part.object.position.toArray())).toEqual(held);
    dispose();
  });
});
