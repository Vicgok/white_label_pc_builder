import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { partBounds, type ModelInstance } from '../../domain/three/model-scene';
import type { CameraRequest, ModelManifest, PreviewPart } from '../../domain/three/scene-types';
import { PcModel } from './PcModel';
import { PreviewUnavailable } from './Loading3D';
import { AssetLoadingState } from './AssetLoadingState';

export function webGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

type CameraTween = { from: Vector3; to: Vector3; targetFrom: Vector3; targetTo: Vector3; started: number };
function CameraRig({ model, request, reducedMotion }: {
  model: React.RefObject<ModelInstance | null>; request: CameraRequest; reducedMotion: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const animation = useRef<CameraTween | null>(null);
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    orbit.enableDamping = false;
    orbit.update();
    const targetTo = new Vector3(0, .255, 0);
    let to = new Vector3(-.74, .64, -.90);
    const aspect = size.width / size.height;
    if (aspect < .9) to.sub(targetTo).multiplyScalar(.9 / Math.max(.6, aspect)).add(targetTo);
    if (request.kind === 'focus' && request.part && model.current) {
      const bounds = partBounds(model.current, request.part);
      if (!bounds.isEmpty()) {
        bounds.getCenter(targetTo);
        const dimensions = bounds.getSize(new Vector3());
        const distance = Math.max(.48, dimensions.length() * 1.65 / Math.min(1, aspect));
        const direction = camera.position.clone().sub(orbit.target).normalize();
        if (request.part === 'psu') direction.set(1, .25, .35).normalize();
        to = direction.multiplyScalar(Math.min(1.6, distance)).add(targetTo);
      }
    }
    animation.current = { from: camera.position.clone(), to, targetFrom: orbit.target.clone(), targetTo, started: performance.now() };
    if (reducedMotion) { camera.position.copy(to); orbit.target.copy(targetTo); orbit.update(); animation.current = null; }
    invalidate();
  }, [camera, size.width, size.height, request, reducedMotion, model, invalidate]);
  useFrame(() => {
    const move = animation.current, orbit = controls.current;
    if (!move || !orbit) return;
    const elapsed = Math.min(1, (performance.now() - move.started) / 650);
    const t = elapsed * elapsed * (3 - 2 * elapsed);
    camera.position.lerpVectors(move.from, move.to, t);
    orbit.target.lerpVectors(move.targetFrom, move.targetTo, t);
    orbit.update();
    if (elapsed === 1) { animation.current = null; orbit.enableDamping = !reducedMotion; }
    else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault target={[0, .255, 0]} enablePan={false}
    enableDamping={!reducedMotion} dampingFactor={.09} minDistance={.48} maxDistance={2.5}
    minPolarAngle={Math.PI / 9} maxPolarAngle={Math.PI * .52} rotateSpeed={.65} zoomSpeed={.75}
    onStart={() => { animation.current = null; if (controls.current) controls.current.enableDamping = !reducedMotion; }} />;
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

export function PcCanvas({ manifest, explode, hideGlass, selected, warnings, reducedMotion, mobile,
  request, ready, onReady, onSelect, onRetry, onParts, visibleParts, returnLabel, errorDescription }: {
  manifest: ModelManifest; explode: number; hideGlass: boolean; selected: PreviewPart | null;
  warnings: ReadonlySet<PreviewPart>; reducedMotion: boolean; mobile: boolean; request: CameraRequest;
  ready: boolean; onReady: (ready: boolean) => void; onSelect: (part: PreviewPart) => void;
  onRetry: () => void; onParts: () => void;
  visibleParts?: ReadonlySet<PreviewPart>;
  returnLabel?: string; errorDescription?: string;
}) {
  const [available] = useState(webGLAvailable);
  const [contextLost, setContextLost] = useState(false);
  const model = useRef<ModelInstance | null>(null);
  const modelReady = useCallback((instance: ModelInstance | null) => { model.current = instance; onReady(!!instance); }, [onReady]);
  const lost = useCallback(() => { setContextLost(true); onReady(false); }, [onReady]);
  if (!available) return <PreviewUnavailable device onParts={onParts} returnLabel={returnLabel} description={errorDescription} />;
  if (contextLost) return <PreviewUnavailable onRetry={onRetry} onParts={onParts} returnLabel={returnLabel} description={errorDescription} />;
  return <div className="pc3d-canvas" data-ready={ready} aria-label="Interactive PC model">
    <div className="pc3d-render">
    <Canvas dpr={mobile ? [1, 1.25] : [1, 1.5]} shadows frameloop="demand"
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.transmissionResolutionScale = mobile ? .5 : .75; }}
      fallback={<PreviewUnavailable device onParts={onParts} returnLabel={returnLabel} description={errorDescription} />}>
      <color attach="background" args={['#0B0C0F']} />
      <PerspectiveCamera makeDefault fov={40} near={.01} far={12} position={[-.74, .64, -.90]} />
      <CameraRig model={model} request={request} reducedMotion={reducedMotion} />
      <ContextMonitor onLost={lost} />
      <ambientLight intensity={.35} />
      <directionalLight position={[-1.2, 1.8, -.8]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-.8} shadow-camera-right={.8} shadow-camera-top={.9} shadow-camera-bottom={-.4}
        shadow-camera-near={.1} shadow-camera-far={5} shadow-bias={-.0002} shadow-normalBias={.002} />
      <directionalLight position={[.4, .8, -1.5]} intensity={.8} />
      <directionalLight position={[.8, 1, 1]} intensity={1.4} />
      {/* Local procedural studio environment; no remote HDR/CDN request. */}
      <Environment resolution={128} frames={1} environmentIntensity={1.1}>
        <Lightformer position={[-2, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5, 1]} intensity={3} />
        <Lightformer position={[1, 3, -2]} rotation={[Math.PI / 3, 0, 0]} scale={[4, 3, 1]} intensity={2} />
        <Lightformer position={[2, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 4, 1]} intensity={2} />
      </Environment>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.018, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} /><shadowMaterial opacity={.25} />
      </mesh>
      <Suspense fallback={null}>
        <PcModel manifest={manifest} explode={explode} hideGlass={hideGlass} selected={selected}
          warnings={warnings} visibleParts={visibleParts} reducedMotion={reducedMotion} onSelect={onSelect} onReady={modelReady} />
      </Suspense>
    </Canvas>
    </div>
    <div className="pc3d-load-overlay" aria-hidden={ready || undefined} inert={ready}><AssetLoadingState complete={ready} /></div>
    {ready && <div className="pc3d-canvas-hint" aria-hidden="true">{mobile ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom'}</div>}
  </div>;
}
