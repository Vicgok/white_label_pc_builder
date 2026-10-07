import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useBuilderStore } from '../../store/builderStore';
import { resolveParts } from '../../data/components';
import { validateBuild } from '../../domain/compatibility';
import { issuesForPart, PREVIEW_PARTS, showcasePart } from '../../domain/three/part-map';
import { MODEL_URL, type CameraRequest, type PreviewPart } from '../../domain/three/scene-types';
import { emitPreviewEvent } from '../../domain/three/preview-events';
import { useMedia, usePreviewAsset } from './usePreviewAsset';
import { calculateBuildTotal, money } from '../../domain/pricing';
import { PREVIEW_MOBILE_QUERY, previewQuality } from '../../domain/three/render-quality';
import { PcCanvas } from './PcCanvas';
import { PartsPanel } from './PartsPanel';
import { SelectedPartPanel } from './SelectedPartPanel';
import { ViewerToolbar } from './ViewerToolbar';
import { PreviewErrorBoundary, PreviewUnavailable } from './Loading3D';
import { AssetLoadingState as Loading3D } from './AssetLoadingState';
import './Pc3DPreview.css';

// This module is imported only after tab activation; overlap model/manifest fetches.
useGLTF.preload(MODEL_URL);

export default function Pc3DPreview({ onEditPart, onParts, initialPart = null, onPartSelected }: {
  onEditPart: (part: PreviewPart) => void; onParts: () => void; initialPart?: PreviewPart | null;
  onPartSelected?: (part: PreviewPart) => void;
}) {
  const selectedComponents = useBuilderStore(state => state.selectedComponents);
  const parts = useMemo(() => resolveParts(selectedComponents), [selectedComponents]);
  const validation = useMemo(() => validateBuild(parts), [parts]);
  const warnings = useMemo(() => new Set(PREVIEW_PARTS.filter(part => issuesForPart(part, validation.issues).length > 0)), [validation]);
  const [selected, setSelected] = useState<PreviewPart | null>(initialPart);
  const pendingFocus = useRef(initialPart);
  const visibleParts = useMemo(() => new Set<PreviewPart>(['case', ...PREVIEW_PARTS.filter(part => !!parts[part])]), [parts]);
  const [explode, setExplode] = useState(0);
  const [hideGlass, setHideGlass] = useState(false);
  const { manifest, failed, attempt, ready, setReady, retry } = usePreviewAsset();
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const [request, setRequest] = useState<CameraRequest>({ sequence: 0, kind: 'reset' });
  const container = useRef<HTMLDivElement>(null);
  const quality = previewQuality(useMedia(PREVIEW_MOBILE_QUERY));
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  useEffect(() => { emitPreviewEvent({ name: '3d_preview_opened', source: 'builder' }); }, []);
  useEffect(() => {
    if (ready && pendingFocus.current) {
      const part = pendingFocus.current; pendingFocus.current = null;
      setRequest(value => ({ sequence: value.sequence + 1, kind: 'focus', part }));
    }
  }, [ready]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const changeExplode = (progress: number) => {
    setExplode(progress);
    if (progress === 0) setHideGlass(false);
    emitPreviewEvent({ name: '3d_explode_used', source: 'builder', progress });
  };
  const select = useCallback((part: PreviewPart) => {
    setSelected(part); onPartSelected?.(part);
    emitPreviewEvent({ name: '3d_part_selected', source: 'builder', part });
  }, [onPartSelected]);
  const edit = (part: PreviewPart) => {
    emitPreviewEvent({ name: '3d_to_configure_clicked', source: 'builder', part }); onEditPart(part);
  };
  const resetCamera = () => setRequest(value => ({ sequence: value.sequence + 1, kind: 'reset' }));
  const focus = () => { if (selected) setRequest(value => ({ sequence: value.sequence + 1, kind: 'focus', part: selected })); };
  const toggleFullscreen = async () => {
    try {
      setFullscreenError('');
      if (document.fullscreenElement === container.current) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch { setFullscreenError('Fullscreen is unavailable in this browser.'); }
  };
  const representative = !manifest || PREVIEW_PARTS.some(part => parts[part]?.id !== showcasePart(manifest, part)?.productId);
  return <div ref={container} className="pc3d-preview" aria-label="3D Preview">
    <div className="pc3d-heading">
      <div><h2>3D Preview <span>Beta</span></h2><p>Explore a representative visualization of your current build.</p></div>
      <div className="pc3d-build-state"><span>{Object.keys(parts).length} components selected</span>
        <strong className={validation.issues.length ? 'warning-text' : ''}>{validation.issues.length
          ? `${validation.issues.length} compatibility ${validation.issues.length === 1 ? 'notice' : 'notices'}`
          : validation.complete ? 'Compatibility checked' : 'Build in progress'}</strong></div>
    </div>
    <div className="pc3d-layout">
      <div className="pc3d-stage">
        <div className="pc3d-viewport">
          <PreviewErrorBoundary key={attempt} onRetry={retry} onParts={onParts}>
            {failed ? <PreviewUnavailable onRetry={retry} onParts={onParts} /> : !manifest ? <Loading3D /> :
              <PcCanvas manifest={manifest} explode={explode} hideGlass={hideGlass} selected={selected}
                warnings={warnings} reducedMotion={reducedMotion} quality={quality} request={request} ready={ready}
                visibleParts={visibleParts} onReady={setReady} onSelect={select} onRetry={retry} onParts={onParts} />}
          </PreviewErrorBoundary>
        </div>
        <ViewerToolbar ready={ready} explode={explode} hideGlass={hideGlass} fullscreen={fullscreen}
          fullscreenAvailable={!!document.fullscreenEnabled} onExplode={changeExplode} onGlass={() => {
            setHideGlass(!hideGlass); emitPreviewEvent({ name: '3d_glass_toggled', source: 'builder', hidden: !hideGlass });
          }}
          onReset={resetCamera} onFullscreen={toggleFullscreen} />
        {fullscreenError && <p className="pc3d-fullscreen-error" role="status">{fullscreenError}</p>}
        {!validation.complete && <div className="pc3d-taking-shape"><div><strong>Your build is taking shape.</strong>
          <p>Choose components to personalize the preview.</p></div><button className="button outline" onClick={onParts}>Continue Building</button></div>}
        <div className="pc3d-disclaimer"><strong>{representative ? 'Representative 3D preview' : '3D Preview · Beta'}</strong>
          <p>3D Preview is representative. Exact component appearance and placement may vary.</p></div>
      </div>
      <aside className="pc3d-sidebar">
        <div className="pc3d-build-overview"><span className="eyebrow">BUILD DETAILS</span>
          <strong>{money(calculateBuildTotal(selectedComponents))}</strong><p>{parts.cpu ? `CPU · ${parts.cpu.name}` : 'CPU · Not selected'}</p></div>
        <SelectedPartPanel part={selected} parts={parts} issues={validation.issues} manifest={manifest}
          ready={ready} onFocus={focus} onEdit={edit} />
        <PartsPanel parts={parts} issues={validation.issues} selected={selected} onSelect={select} />
      </aside>
    </div>
  </div>;
}
