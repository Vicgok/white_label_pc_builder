import { FrontSide, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';

export function createClearPcGlassMaterial(physical = true) {
  // Alpha blending keeps hardware in the main render target, avoiding the
  // filtered transmission buffer that softened this model's small components.
  // The exported panes are closed, bevelled 4mm solids: render the front faces.
  // Each pane owns an instance so hiding the side cannot fade the front pane.
  if (!physical) return new MeshStandardMaterial({
    name: 'RigPilot_MobileClearGlass', color: '#10161A', metalness: 0,
    roughness: .08, envMapIntensity: .25, transparent: true, opacity: .14,
    depthWrite: false, depthTest: true, side: FrontSide,
  });
  return new MeshPhysicalMaterial({
    name: 'RigPilot_ClearTemperedGlass',
    color: '#10161A',
    metalness: 0,
    roughness: .06,
    transmission: 0,
    thickness: 0,
    ior: 1.45,
    clearcoat: .4,
    clearcoatRoughness: .015,
    specularIntensity: .4,
    envMapIntensity: .25,
    transparent: true,
    opacity: .14,
    depthWrite: false,
    depthTest: true,
    side: FrontSide,
  });
}
