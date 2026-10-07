import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Vector3 } from 'three';
import { cloneModel, disposeModel } from '../../domain/three/model-scene';
import { animateHero, createHeroAnimation, heroCameraConfig, heroStageProgress, type HeroScrollState } from '../../domain/three/homepage-explosion';
import { MODEL_URL, type ModelManifest } from '../../domain/three/scene-types';
import { usePreviewAsset } from './usePreviewAsset';
import { AssetLoadingState } from './AssetLoadingState';
import { PreviewUnavailable } from './Loading3D';

// Module evaluation happens only after the visible hero activates its lazy chunk.
useGLTF.preload(MODEL_URL);

function CinematicBuild({ manifest, scroll, mobile, tablet, reducedMotion, onReady }: {
  manifest: ModelManifest; scroll: RefObject<HeroScrollState>; mobile: boolean; tablet: boolean;
  reducedMotion: boolean; onReady: (ready: boolean) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const animation = useMemo(() => createHeroAnimation(cloneModel(scene, manifest)), [scene, manifest]);
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

function available() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch { return false; }
}

function HeroStatus({ error, device, onRetry }: { error?: boolean; device?: boolean; onRetry?: () => void }) {
  return error || device ? <PreviewUnavailable compact device={device} onRetry={onRetry} returnHref="/builder"
    description={device ? 'Explore your build in 3D on a WebGL-enabled device.' : undefined} />
    : <AssetLoadingState compact label="Preparing interactive 3D…" />;
}

class SceneBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <HeroStatus error onRetry={this.props.onRetry} /> : this.props.children; }
}

export default function HeroPc3D({ scroll, mobile, tablet, reducedMotion, onReady }: {
  scroll: RefObject<HeroScrollState>; mobile: boolean; tablet: boolean; reducedMotion: boolean; onReady: (ready: boolean) => void;
}) {
  const { manifest, failed, attempt, ready, setReady, retry } = usePreviewAsset();
  const [supported] = useState(available);
  const [contextLost, setContextLost] = useState(false);
  useEffect(() => { onReady(ready); }, [ready, onReady]);
  if (!supported) return <HeroStatus device />;
  if (failed) return <HeroStatus error onRetry={retry} />;
  if (!manifest) return <HeroStatus />;
  const retryScene = () => { setContextLost(false); retry(); };
  return <SceneBoundary key={attempt} onRetry={retryScene}>
    {contextLost ? <HeroStatus error onRetry={retryScene} /> : <div className="hero-pc-canvas" data-ready={ready} aria-hidden="true">
      <Canvas shadows dpr={mobile ? [1, 1.15] : [1, 1.5]} frameloop="demand"
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        fallback={<HeroStatus device />}>
        <PerspectiveCamera makeDefault fov={34} near={.01} far={10} position={heroCameraConfig.assembled} />
        <ContextMonitor onLost={() => { setReady(false); setContextLost(true); }} />
        <ambientLight intensity={.5} />
        <directionalLight position={[-1.5, 2, -.8]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-.8} shadow-camera-right={.8} shadow-camera-top={1} shadow-camera-bottom={-.5}
          shadow-camera-near={.1} shadow-camera-far={5} shadow-bias={-.0002} shadow-normalBias={.0015} />
        <directionalLight position={[-.4, .9, -1.6]} intensity={1.1} />
        <directionalLight position={[1, 1.5, .7]} intensity={2} />
        <Environment resolution={128} frames={1} environmentIntensity={1.25}>
          <Lightformer position={[-2, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5, 1]} intensity={3} />
          <Lightformer position={[1, 3, -2]} rotation={[Math.PI / 3, 0, 0]} scale={[4, 3, 1]} intensity={2} />
          <Lightformer position={[2, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 4, 1]} intensity={3} />
        </Environment>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.004, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} /><shadowMaterial opacity={.16} />
        </mesh>
        <Suspense fallback={null}>
          <CinematicBuild manifest={manifest} scroll={scroll} mobile={mobile} tablet={tablet} reducedMotion={reducedMotion} onReady={setReady} />
        </Suspense>
      </Canvas>
    </div>}
    {!contextLost && <div className="hero-pc-load-overlay" aria-hidden={ready || undefined}>
      <AssetLoadingState compact label="Preparing interactive 3D…" complete={ready} />
    </div>}
  </SceneBoundary>;
}
