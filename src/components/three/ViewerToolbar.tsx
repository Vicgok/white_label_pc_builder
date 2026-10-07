import { Expand, Eye, EyeOff, Layers3, Minimize, RotateCcw } from 'lucide-react';

export function ViewerToolbar({ ready, explode, hideGlass, fullscreen, fullscreenAvailable, onExplode, onGlass, onReset, onFullscreen }: {
  ready: boolean; explode: number; hideGlass: boolean; fullscreen: boolean; fullscreenAvailable: boolean;
  onExplode: (progress: number) => void; onGlass: () => void; onReset: () => void; onFullscreen: () => void;
}) {
  return <div className="pc3d-toolbar" role="group" aria-label="3D preview controls">
    <button disabled={!ready} onClick={onReset}><RotateCcw size={15} />Reset View</button>
    <button disabled={!ready} onClick={onGlass} aria-pressed={hideGlass}>
      {hideGlass ? <Eye size={15} /> : <EyeOff size={15} />}{hideGlass ? 'Show Glass' : 'Hide Glass'}
    </button>
    <div className="pc3d-explode">
      <button disabled={!ready} onClick={() => onExplode(explode > 0 ? 0 : 1)} aria-pressed={explode > 0}>
        <Layers3 size={15} />{explode > 0 ? 'Assemble' : 'Explode'}
      </button>
      <label>
        <span className="sr-only">Explode amount</span>
        <input type="range" min="0" max="100" step="1" value={Math.round(explode * 100)}
          disabled={!ready} onChange={event => onExplode(Number(event.target.value) / 100)} aria-valuetext={`${Math.round(explode * 100)}% exploded`} />
      </label>
      <output>{Math.round(explode * 100)}%</output>
    </div>
    {fullscreenAvailable && <button className="pc3d-fullscreen-button" onClick={onFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
      {fullscreen ? <Minimize size={15} /> : <Expand size={15} />}<span>{fullscreen ? 'Exit' : 'Fullscreen'}</span>
    </button>}
  </div>;
}
