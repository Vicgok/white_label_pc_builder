import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { RigPilotLoadingMark } from './ThreeDLoadingState';
export { ThreeDLoadingState as Loading3D } from './ThreeDLoadingState';

export function PreviewUnavailable({ device = false, onRetry, onParts, returnLabel = 'Back to Configure', description, compact = false, returnHref }: {
  device?: boolean; onRetry?: () => void; onParts?: () => void; returnLabel?: string; description?: string;
  compact?: boolean; returnHref?: string;
}) {
  return <div className={`three-d-unavailable${compact ? ' three-d-unavailable--compact' : ''}`} role="status">
    <RigPilotLoadingMark animated={false} />
    <strong>{device ? "3D Preview isn't available on this device." : "3D preview couldn't load"}</strong>
    <span>{description ?? 'The rest of your build is still available.'}</span>
    <div className="three-d-unavailable-actions">
      {!device && onRetry && <button className="button outline" onClick={onRetry}>Retry</button>}
      {onParts && <button className="button outline" onClick={onParts}>{returnLabel}</button>}
      {returnHref && <Link className="button outline" to={returnHref}>{returnLabel}</Link>}
    </div>
  </div>;
}

// Kept independent of Three.js so even chunk/renderer failures stay inside the tab.
export class PreviewErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void; onParts?: () => void; returnLabel?: string; description?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <PreviewUnavailable onRetry={this.props.onRetry} onParts={this.props.onParts} returnLabel={this.props.returnLabel} description={this.props.description} />
      : this.props.children;
  }
}
