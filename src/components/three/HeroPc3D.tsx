import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { cloneModel, disposeModel } from '../../domain/three/model-scene';
import { animateHero, createHeroAnimation, heroCameraConfig, heroStageProgress, type HeroScrollState } from '../../domain/three/homepage-explosion';
import { MODEL_URL, type ModelManifest } from '../../domain/three/scene-types';
import { usePreviewAsset } from './usePreviewAsset';
import { AssetLoadingState } from './AssetLoadingState';
import { PreviewUnavailable } from './Loading3D';
import { previewQuality, type PreviewQuality } from '../../domain/three/render-quality';
import { createPreviewRenderer, type PreviewRendererDefaults } from './createPreviewRenderer';

// Module evaluation happens only after the visible hero activates its lazy chunk.
useGLTF.preload(MODEL_URL);

function CinematicBuild({ manifest, scroll, mobile, tablet, reducedMotion, onReady, quality }: {
  manifest: ModelManifest; scroll: RefObject<HeroScrollState>; mobile: boolean; tablet: boolean;
  reducedMotion: boolean; onReady: (ready: boolean) => void;
  quality: PreviewQuality;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const animation = useMemo(() => createHeroAnimation(cloneModel(scene, manifest, quality)), [scene, manifest, quality]);
  const model = animation.model;
  const { camera, size, invalidate } = useThree();
  const progress = useRef(0);
  const previous = useRef(-1);
  const lastTime = useRef(performance.now());
  const view = useMemo(() => ({ from: new Vector3(...heroCameraConfig.assembled), to: new Vector3(...heroCameraConfig.exploded),
    target: new Vector3(...heroCameraConfig.target), finalTarget: new Vector3(...heroCameraConfig.finalTarget), scratch: new Vector3() }), []);
  useEffect(() => {
    onReady(true);
    return () => { onReady(false); animation.hoses.forEach(hose => hose.geometry.dispose()); disposeModel(model); };
  }, [model, animation, onReady]);
  useEffect(() => {
    const state = scroll.current;
    state.invalidate = invalidate;
    previous.current = -1;
    lastTime.current = performance.now();
    invalidate();
    return () => { if (state.invalidate === invalidate) delete state.invalidate; };
  }, [scroll, invalidate, mobile, tablet, reducedMotion, size.width, size.height]);
  useFrame(() => {
    const target = reducedMotion ? 0 : scroll.current.progress;
    const now = performance.now();
    const delta = Math.min(.06, (now - lastTime.current) / 1000);
    lastTime.current = now;
    const difference = target - progress.current;
    progress.current = reducedMotion || Math.abs(difference) < .00015 ? target : progress.current + difference * (1 - Math.exp(-16 * delta));
    if (previous.current !== progress.current) {
      animateHero(animation, progress.current, mobile, tablet);
      const t = heroStageProgress(progress.current, .18, .85);
      view.scratch.lerpVectors(view.target, view.finalTarget, t);
      camera.position.lerpVectors(view.from, view.to, t);
      // Fit the full composition in narrow tablet viewports without rescaling the PC.
      const aspect = size.width / size.height;
      const fit = Math.max(1, .84 / Math.max(.4, aspect));
      camera.position.sub(view.scratch).multiplyScalar(fit).add(view.scratch);
      camera.lookAt(view.scratch);
      previous.current = progress.current;
    }
    if (scroll.current.active && progress.current !== target) invalidate();
  });
  return <primitive object={model.scene} dispose={null} />;
}

function ContextMonitor({ onLost }: { onLost: () => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return null;
}

function HeroStatus({ error, device, paused, onRetry }: { error?: boolean; device?: boolean; paused?: boolean; onRetry?: () => void }) {
  return error || device || paused ? <PreviewUnavailable compact device={device} paused={paused} onRetry={onRetry} returnHref="/builder"
    description={device ? 'Explore your build in 3D on a WebGL-enabled device.' : undefined} />
    : <AssetLoadingState compact label="Preparing interactive 3D…" />;
}

class SceneBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean; device: boolean; paused: boolean }> {
  state = { failed: false, device: false, paused: false };
  static getDerivedStateFromError(error: Error) { return { failed: true, device: error.name === 'PreviewWebGLInitializationError', paused: error.name === 'PreviewWebGLContextLostError' }; }
  render() { return this.state.failed ? <HeroStatus error device={this.state.device} paused={this.state.paused} onRetry={this.props.onRetry} /> : this.props.children; }
}

export default function HeroPc3D({ scroll, mobile, tablet, reducedMotion, onReady }: {
  scroll: RefObject<HeroScrollState>; mobile: boolean; tablet: boolean; reducedMotion: boolean; onReady: (ready: boolean) => void;
}) {
  const { manifest, failed, attempt, ready, setReady, retry } = usePreviewAsset();
  const quality = previewQuality(mobile, 'hero');
  const renderer = useCallback((defaults: PreviewRendererDefaults) => createPreviewRenderer(defaults, quality, true), [quality]);
  const [contextLost, setContextLost] = useState(false);
  useEffect(() => { onReady(ready); }, [ready, onReady]);
  if (failed) return <HeroStatus error onRetry={retry} />;
  if (!manifest) return <HeroStatus />;
  const retryScene = () => { setContextLost(false); retry(); };
  return <SceneBoundary key={attempt} onRetry={retryScene}>
    {contextLost ? <HeroStatus paused onRetry={retryScene} /> : <div className="hero-pc-canvas" data-ready={ready} data-quality={quality.mode} aria-hidden="true">
      <Canvas key={quality.mode} shadows={quality.shadows} dpr={quality.dpr} frameloop="demand"
        gl={renderer}
        fallback={<HeroStatus device onRetry={retryScene} />}>
        <PerspectiveCamera makeDefault fov={mobile ? 40 : 34} near={.01} far={10} position={heroCameraConfig.assembled} />
        <ContextMonitor onLost={() => { setReady(false); setContextLost(true); }} />
        <ambientLight intensity={mobile ? .7 : .5} />
        <directionalLight position={[-1.5, 2, -.8]} intensity={2.5} castShadow={quality.shadows} shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-.8} shadow-camera-right={.8} shadow-camera-top={1} shadow-camera-bottom={-.5}
          shadow-camera-near={.1} shadow-camera-far={5} shadow-bias={-.0002} shadow-normalBias={.0015} />
        <directionalLight position={[-.4, .9, -1.6]} intensity={1.1} />
        {!mobile && <directionalLight position={[1, 1.5, .7]} intensity={2} />}
        <Environment resolution={quality.environmentResolution} frames={1} environmentIntensity={1.25}>
          <Lightformer position={[-2, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5, 1]} intensity={3} />
          <Lightformer position={[1, 3, -2]} rotation={[Math.PI / 3, 0, 0]} scale={[4, 3, 1]} intensity={2} />
          {!mobile && <Lightformer position={[2, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 4, 1]} intensity={3} />}
        </Environment>
        {quality.shadows ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.004, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} /><shadowMaterial opacity={.16} />
        </mesh> : <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.004, 0]} scale={[.23, .32, 1]}>
          <circleGeometry args={[1, 32]} /><meshBasicMaterial color="#000000" transparent opacity={.06} depthWrite={false} />
        </mesh>}
        <Suspense fallback={null}>
          <CinematicBuild manifest={manifest} scroll={scroll} mobile={mobile} tablet={tablet} reducedMotion={reducedMotion} quality={quality} onReady={setReady} />
        </Suspense>
      </Canvas>
    </div>}
    {!contextLost && <div className="hero-pc-load-overlay" aria-hidden={ready || undefined}>
      <AssetLoadingState compact label="Preparing interactive 3D…" complete={ready} />
    </div>}
  </SceneBoundary>;
}
