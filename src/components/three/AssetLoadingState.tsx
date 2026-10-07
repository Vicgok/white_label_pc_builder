import { useProgress } from '@react-three/drei';
import { ThreeDLoadingState } from './ThreeDLoadingState';

// Subscribe only inside the lazy Three.js bundle. This is Drei's existing
// LoadingManager progress, not estimated bytes or a separate loading system.
export function AssetLoadingState({ label, compact, complete }: { label?: string; compact?: boolean; complete?: boolean }) {
  const { progress, active, loaded, total } = useProgress();
  const available = active && total > 0 && loaded <= total;
  return <ThreeDLoadingState progress={available ? progress : undefined} label={label} compact={compact} complete={complete} />;
}
