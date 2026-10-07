import './ThreeDLoadingState.css';

export function RigPilotLoadingMark({ animated = true }: { animated?: boolean }) {
  return <span className={`three-d-loading-mark${animated ? ' three-d-loading-mark--animated' : ''}`} aria-hidden="true">
    <span /><span /><span />
  </span>;
}

// No Three.js import here: lazy bundle loading uses exactly the same UI.
export function ThreeDLoadingState({ progress, label = 'Preparing your 3D build', compact = false, complete = false }: {
  progress?: number; label?: string; compact?: boolean; complete?: boolean;
}) {
  const known = typeof progress === 'number' && Number.isFinite(progress);
  const percentage = known ? Math.round(Math.max(0, Math.min(100, progress))) : undefined;
  return <div className={`three-d-loading${compact ? ' three-d-loading--compact' : ''}`} data-complete={complete}
    role={complete ? undefined : 'status'} aria-hidden={complete || undefined} inert={complete}>
    <div className="three-d-loading-content">
      <RigPilotLoadingMark animated={!complete} />
      <strong>{label}</strong>
      {!compact && <p>Loading case, components and materials…</p>}
      <div className={`three-d-loading-progress${known ? '' : ' three-d-loading-progress--indeterminate'}`}
        role="progressbar" aria-label="3D asset loading" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={percentage} aria-valuetext={known ? `${percentage}% of 3D assets loaded` : 'Loading 3D assets'}>
        <span style={known ? { width: `${percentage}%` } : undefined} />
      </div>
      {known ? <span className="three-d-loading-caption">Loading 3D assets · {percentage}%</span>
        : !compact && <span className="three-d-loading-caption">3D Preview · Beta</span>}
    </div>
  </div>;
}
