import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { animateModel, cloneModel, disposeModel, highlightModel, type ModelInstance } from '../../domain/three/model-scene';
import { logicalPart } from '../../domain/three/part-map';
import { MODEL_URL, type ModelManifest, type PreviewPart } from '../../domain/three/scene-types';
import type { PreviewQuality } from '../../domain/three/render-quality';

export function PcModel({ manifest, explode, hideGlass, selected, warnings, reducedMotion, onSelect, onReady, visibleParts, quality }: {
  manifest: ModelManifest; explode: number; hideGlass: boolean; selected: PreviewPart | null;
  warnings: ReadonlySet<PreviewPart>; reducedMotion: boolean;
  onSelect: (part: PreviewPart) => void; onReady: (instance: ModelInstance | null) => void;
  visibleParts?: ReadonlySet<PreviewPart>;
  quality: PreviewQuality;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => cloneModel(scene, manifest, quality), [scene, manifest, quality]);
  const invalidate = useThree(state => state.invalidate);
  const lastAnimationTime = useRef(performance.now());
  const dirty = useRef(true);
  useEffect(() => {
    onReady(model);
    return () => { onReady(null); disposeModel(model); };
  }, [model, onReady]);
  useEffect(() => { highlightModel(model, selected, warnings); invalidate(); }, [model, selected, warnings, invalidate]);
  useEffect(() => { dirty.current = true; lastAnimationTime.current = performance.now(); invalidate(); }, [model, explode, hideGlass, visibleParts, invalidate]);
  useFrame(() => {
    if (!dirty.current) return; // Orbit movement only redraws; it needn't update every part.
    const now = performance.now();
    const delta = (now - lastAnimationTime.current) / 1000;
    lastAnimationTime.current = now;
    animateModel(model, explode, hideGlass, delta, reducedMotion, visibleParts, manifest);
    dirty.current = model.explodeProgress !== explode || model.glassProgress !== (hideGlass ? 1 : 0);
    if (dirty.current) invalidate();
  });
  const select = (event: ThreeEvent<MouseEvent>) => {
    // Orbit drags must not become component clicks.
    if (event.delta > 5) return;
    const part = logicalPart(event.object, manifest);
    if (part) { event.stopPropagation(); onSelect(part); }
  };
  return <primitive object={model.scene} dispose={null} onClick={select} />;
}
