import { Crosshair, TriangleAlert } from 'lucide-react';
import type { BuildParts, CompatibilityIssue } from '../../types';
import { money } from '../../domain/pricing';
import { componentSpecs } from '../../utils/catalog';
import { issuesForPart, PART_LABELS, showcasePart } from '../../domain/three/part-map';
import type { ModelManifest, PreviewPart } from '../../domain/three/scene-types';

export function SelectedPartPanel({ part, parts, issues, manifest, ready, onFocus, onEdit }: {
  part: PreviewPart | null; parts: BuildParts; issues: CompatibilityIssue[]; manifest: ModelManifest | null;
  ready: boolean; onFocus: () => void; onEdit: (part: PreviewPart) => void;
}) {
  if (!part) return <section className="pc3d-details" aria-label="Selected 3D part">
    <span className="eyebrow">A CLOSER LOOK</span><h3>Inspect your build.</h3>
    <p>Select hardware in the model or the component list to see its details.</p>
  </section>;
  const component = parts[part];
  const notices = issuesForPart(part, issues);
  const shown = manifest ? showcasePart(manifest, part) : null;
  return <section className="pc3d-details" aria-label="Selected 3D part" aria-live="polite">
    <div className="pc3d-detail-heading"><span className="eyebrow">{PART_LABELS[part]}</span>
      <button onClick={onFocus} disabled={!ready} aria-label={`Focus ${PART_LABELS[part]}`}><Crosshair size={14} />Focus</button>
    </div>
    <h3>{component?.name ?? `No ${PART_LABELS[part].toLowerCase()} selected`}</h3>
    {component && <><p className="pc3d-selected-label">{component.brand} · Selected in your build</p>
      <p className="pc3d-specs">{componentSpecs(component)}</p>
      <dl className="pc3d-detail-stats"><div><dt>Price</dt><dd>{money(component.price)}</dd></div>
        <div><dt>Compatibility</dt><dd className={notices.length ? 'warning-text' : 'status-success'}>
          {notices.length ? 'Needs review' : 'No notices'}</dd></div></dl>
    </>}
    {notices.map(notice => <div className="pc3d-notice" key={notice.code}><TriangleAlert size={15} />
      <div><strong>{notice.title}</strong><p>{notice.message}</p></div></div>)}
    {component && !notices.length && <p className="pc3d-check-note">No compatibility notices from the existing builder checks.</p>}
    {shown && <div className="pc3d-representation"><span>SHOWN IN 3D</span><p>{shown.displayName}</p>
      </div>}
    <button className="button outline pc3d-edit" onClick={() => onEdit(part)}>{component ? 'Change' : 'Choose'} {PART_LABELS[part]}</button>
    {notices.some(notice => ['gpu-length', 'cooler-height', 'radiator', 'form-factor'].includes(notice.code)) && part !== 'case' &&
      <button className="button outline pc3d-edit" onClick={() => onEdit('case')}>Change Case</button>}
  </section>;
}
