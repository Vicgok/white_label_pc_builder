import { Check, Circle, TriangleAlert } from 'lucide-react';
import type { BuildParts, CompatibilityIssue } from '../../types';
import { issuesForPart, PART_LABELS, PREVIEW_PARTS } from '../../domain/three/part-map';
import type { PreviewPart } from '../../domain/three/scene-types';

export function PartsPanel({ parts, issues, selected, onSelect }: {
  parts: BuildParts; issues: CompatibilityIssue[]; selected: PreviewPart | null; onSelect: (part: PreviewPart) => void;
}) {
  return <section className="pc3d-parts" aria-label="3D parts list">
    <div className="pc3d-panel-heading"><h3>Your components</h3><span>SELECT TO INSPECT</span></div>
    {PREVIEW_PARTS.map(part => {
      const warnings = issuesForPart(part, issues);
      const component = parts[part];
      const status = warnings.length ? `${warnings.length} compatibility ${warnings.length === 1 ? 'notice' : 'notices'}`
        : component ? 'No compatibility notices' : 'Not selected';
      return <button key={part} className={`pc3d-part-row${selected === part ? ' is-selected' : ''}`}
        aria-pressed={selected === part} aria-label={`Inspect ${PART_LABELS[part]}`} onClick={() => onSelect(part)}>
        <span><strong>{PART_LABELS[part]}</strong><small>{component?.name ?? 'Not selected in your build'}</small></span>
        <span className={warnings.length ? 'warning-text' : component ? 'status-success' : ''} role="img" aria-label={status}>
          {warnings.length ? <TriangleAlert size={15} /> : component ? <Check size={15} /> : <Circle size={12} />}
        </span>
      </button>;
    })}
  </section>;
}
