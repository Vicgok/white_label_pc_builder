import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { MODEL_URL, type CameraRequest, type PreviewPart } from '../../domain/three/scene-types';
import { PART_LABELS } from '../../domain/three/part-map';
import { emitPreviewEvent } from '../../domain/three/preview-events';
import { useMedia, usePreviewAsset } from './usePreviewAsset';
import { PcCanvas } from './PcCanvas';
import { ViewerToolbar } from './ViewerToolbar';
import { PreviewErrorBoundary, PreviewUnavailable } from './Loading3D';
import { AssetLoadingState as Loading3D } from './AssetLoadingState';
import './Pc3DPreview.css';

useGLTF.preload(MODEL_URL);
const noWarnings = new Set<PreviewPart>();

export default function PcDemo({ onClose }: { onClose: () => void }) {
  const { manifest, failed, attempt, ready, setReady, retry } = usePreviewAsset();
  const [explode, setExplode] = useState(0);
  const [glass, setGlass] = useState(false);
  const [selected, setSelected] = useState<PreviewPart | null>(null);
  const [request, setRequest] = useState<CameraRequest>({ sequence: 0, kind: 'reset' });
  const mobile = useMedia('(max-width: 767px)');
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  useEffect(() => { emitPreviewEvent({ name: '3d_preview_opened', source: 'homepage' }); }, []);
  const select = (part: PreviewPart) => {
    setSelected(part); emitPreviewEvent({ name: '3d_part_selected', source: 'homepage', part });
  };
  return <div className="pc3d-preview pc3d-demo">
    <div className="pc3d-viewport">
      <PreviewErrorBoundary key={attempt} onRetry={retry} onParts={onClose} returnLabel="Back to demo" description="You can continue configuring your PC in the builder.">
        {failed ? <PreviewUnavailable onRetry={retry} description="You can continue configuring your PC in the builder." /> : !manifest ? <Loading3D /> :
          <PcCanvas manifest={manifest} explode={explode} hideGlass={glass} selected={selected} warnings={noWarnings}
            reducedMotion={reducedMotion} mobile={mobile} request={request} ready={ready} onReady={setReady}
            onSelect={select} onRetry={retry} onParts={onClose} returnLabel="Back to demo" errorDescription="You can continue configuring your PC in the builder." />}
      </PreviewErrorBoundary>
      {selected && <div className="pc3d-demo-selection" role="status">Inspecting {PART_LABELS[selected]}</div>}
    </div>
    <ViewerToolbar ready={ready} explode={explode} hideGlass={glass} fullscreen={false} fullscreenAvailable={false}
      onReset={() => setRequest(value => ({ sequence: value.sequence + 1, kind: 'reset' }))}
      onGlass={() => { setGlass(!glass); emitPreviewEvent({ name: '3d_glass_toggled', source: 'homepage', hidden: !glass }); }}
      onExplode={progress => {
        setExplode(progress); if (progress === 0) setGlass(false);
        emitPreviewEvent({ name: '3d_explode_used', source: 'homepage', progress });
      }} onFullscreen={() => {}} />
  </div>;
}
