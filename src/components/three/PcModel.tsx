import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { animateModel, cloneModel, disposeModel, highlightModel, type ModelInstance } from '../../domain/three/model-scene';
import { logicalPart } from '../../domain/three/part-map';
import { MODEL_URL, type ModelManifest, type PreviewPart } from '../../domain/three/scene-types';

export function PcModel({ manifest, explode, hideGlass, selected, warnings, reducedMotion, onSelect, onReady, visibleParts }: {
  manifest: ModelManifest; explode: number; hideGlass: boolean; selected: PreviewPart | null;
  warnings: ReadonlySet<PreviewPart>; reducedMotion: boolean;
  onSelect: (part: PreviewPart) => void; onReady: (instance: ModelInstance | null) => void;
  visibleParts?: ReadonlySet<PreviewPart>;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => cloneModel(scene, manifest), [scene, manifest]);
  const invalidate = useThree(state => state.invalidate);
  const lastAnimationTime = useRef(performance.now());
  useEffect(() => {
    onReady(model);
    return () => { onReady(null); disposeModel(model); };
  }, [model, onReady]);
  useEffect(() => { highlightModel(model, selected, warnings); invalidate(); }, [model, selected, warnings, invalidate]);
  useEffect(() => { lastAnimationTime.current = performance.now(); invalidate(); }, [explode, hideGlass, visibleParts, invalidate]);
  useFrame(() => {
    const now = performance.now();
    const delta = (now - lastAnimationTime.current) / 1000;
    lastAnimationTime.current = now;
    animateModel(model, explode, hideGlass, delta, reducedMotion, visibleParts, manifest);
    if (model.explodeProgress !== explode || model.glassProgress !== (hideGlass ? 1 : 0)) invalidate();
  });
  const select = (event: ThreeEvent<MouseEvent>) => {
    // Orbit drags must not become component clicks.
    if (event.delta > 5) return;
    const part = logicalPart(event.object, manifest);
    if (part) { event.stopPropagation(); onSelect(part); }
  };
  return <primitive object={model.scene} dispose={null} onClick={select} />;
}
