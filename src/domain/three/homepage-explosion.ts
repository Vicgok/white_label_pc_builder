import { Mesh, Vector3, type BufferGeometry } from 'three';
import type { ModelInstance } from './model-scene';
import type { Vec3 } from './scene-types';

export type HeroScrollState = { progress: number; active: boolean; invalidate?: () => void };
type Stage = { start: number; end: number; factor?: number; offset?: Vec3; followsBoard?: boolean };

// Hero-only choreography in metres, +Y up, -X glass side, -Z front.
// Most directions come from the manifest; shorter travel keeps this composition
// compact. Overrides lift DIMMs and stagger the panes in depth for readability.
// The interactive builder continues to use the unmodified manifest offsets.
export const homepageExplosionConfig: Record<string, Stage> = {
  Case_SideGlass: { start: .06, end: .24, offset: [-.185, 0, .035] },
  Case_FrontGlass: { start: .16, end: .32, factor: .55 },
  Case_TopPanel: { start: .19, end: .36, factor: .65 },
  Case_RearPanel: { start: .21, end: .37, factor: .22 },
  GPU: { start: .32, end: .49, factor: .85 },
  Motherboard: { start: .43, end: .58, factor: .55 },
  AIO_Radiator: { start: .54, end: .69, factor: .6 },
  AIO_Fan_01: { start: .54, end: .69, factor: .6 },
  AIO_Fan_02: { start: .54, end: .69, factor: .6 },
  AIO_Fan_03: { start: .54, end: .69, factor: .6 },
  AIO_Pump: { start: .54, end: .69, factor: .25, followsBoard: true },
  RAM_01: { start: .63, end: .76, offset: [-.035, .045, -.007], followsBoard: true },
  RAM_02: { start: .63, end: .76, offset: [-.035, .045, -.007], followsBoard: true },
  PSU: { start: .71, end: .81, factor: .5 },
  SSD_M2: { start: .75, end: .85, factor: .25, followsBoard: true },
};

export const heroCameraConfig = {
  assembled: [-.78, .62, -.87] as Vec3,
  exploded: [-1.06, .73, -1.09] as Vec3,
  target: [-.025, .265, 0] as Vec3,
  finalTarget: [-.065, .31, 0] as Vec3,
};

export function heroStageProgress(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

type Hose = { geometry: BufferGeometry; original: Float32Array; weights: Float32Array; pumpDelta: Vector3; radiatorDelta: Vector3 };
export type HeroAnimation = { model: ModelInstance; hoses: Hose[]; boardDelta: Vector3 };

export function createHeroAnimation(model: ModelInstance): HeroAnimation {
  const hoses: Hose[] = [];
  model.scene.updateMatrixWorld(true);
  const vertex = new Vector3();
  // Only these two flexible meshes own geometry in the hero. The cache and
  // builder stay untouched. Smooth endpoint blending keeps the AIO connected
  // while the pump and top radiator separate; this is presentation, not physics.
  for (const part of model.parts.filter(part => part.object.name.startsWith('AIO_Tube_'))) {
    part.object.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const geometry = object.geometry.clone();
      object.geometry = geometry;
      const positions = geometry.getAttribute('position');
      const original = Float32Array.from(positions.array);
      const weights = new Float32Array(positions.count);
      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
        // Both reference hoses run from the pump at +Z to the front top tank at -Z.
        weights[i] = heroStageProgress(-vertex.z, -.08, .175);
      }
      hoses.push({ geometry, original, weights, pumpDelta: new Vector3(), radiatorDelta: new Vector3() });
    });
  }
  return { model, hoses, boardDelta: new Vector3() };
}

export function animateHero(animation: HeroAnimation, progress: number, mobile: boolean, tablet: boolean) {
  const { model, boardDelta } = animation;
  const distance = mobile ? .6 : tablet ? .8 : 1;
  const board = model.parts.find(part => part.object.name === 'Motherboard');
  boardDelta.set(0, 0, 0);
  if (board && !mobile) {
    const stage = homepageExplosionConfig.Motherboard;
    boardDelta.copy(board.offset).multiplyScalar((stage.factor ?? 1) * distance * heroStageProgress(progress, stage.start, stage.end));
  }
  for (const part of model.parts) {
    const stage = homepageExplosionConfig[part.object.name];
    part.object.position.copy(part.position);
    part.object.quaternion.copy(part.quaternion);
    part.object.scale.copy(part.scale);
    if (!stage) continue;
    // Mobile retains the motherboard, memory, PSU and SSD in the chassis.
    const moving = !mobile || ['Case_SideGlass', 'Case_FrontGlass', 'Case_TopPanel', 'GPU', 'AIO_Radiator', 'AIO_Fan_01', 'AIO_Fan_02', 'AIO_Fan_03'].includes(part.object.name);
    const amount = moving ? heroStageProgress(progress, stage.start, stage.end) * distance : 0;
    if (stage.offset) model.scratch.set(...stage.offset);
    else model.scratch.copy(part.offset).multiplyScalar(stage.factor ?? 1);
    part.object.position.addScaledVector(model.scratch, amount);
    if (stage.followsBoard) part.object.position.add(boardDelta);
  }
  const pump = model.parts.find(part => part.object.name === 'AIO_Pump');
  const radiator = model.parts.find(part => part.object.name === 'AIO_Radiator');
  if (pump && radiator) for (const hose of animation.hoses) {
    hose.pumpDelta.copy(pump.object.position).sub(pump.position);
    hose.radiatorDelta.copy(radiator.object.position).sub(radiator.position);
    const positions = hose.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const w = hose.weights[i], j = i * 3;
      positions.setXYZ(i,
        hose.original[j] + hose.pumpDelta.x * (1 - w) + hose.radiatorDelta.x * w,
        hose.original[j + 1] + hose.pumpDelta.y * (1 - w) + hose.radiatorDelta.y * w,
        hose.original[j + 2] + hose.pumpDelta.z * (1 - w) + hose.radiatorDelta.z * w);
    }
    positions.needsUpdate = true;
    hose.geometry.computeVertexNormals();
    hose.geometry.computeBoundingSphere();
  }
  // Rigid power cables stop at their installed sockets. Avoid dangling cables
  // once the GPU unseats, while retaining them during the panel-opening stage.
  for (const cable of model.cables) cable.visible = progress <= homepageExplosionConfig.GPU.start;
}
