import type { CompatibilityIssue } from '../../types';
import type { ModelManifest, PreviewPart } from './scene-types';

export const PREVIEW_PARTS: readonly PreviewPart[] = ['case', 'motherboard', 'gpu', 'memory', 'cooling', 'psu', 'storage'];
export const PART_LABELS: Record<PreviewPart, string> = {
  case: 'Case', motherboard: 'Motherboard', gpu: 'GPU', memory: 'Memory', cooling: 'Cooling', psu: 'PSU', storage: 'Storage',
};
const CATEGORY_MAP: Record<string, PreviewPart> = {
  case: 'case', 'case-panel': 'case', motherboard: 'motherboard', gpu: 'gpu',
  memory: 'memory', cooling: 'cooling', 'cooling-fan': 'cooling', 'cooling-tube': 'cooling',
  'case-fan': 'case', psu: 'psu', storage: 'storage',
};
export const FOCUS_OBJECTS: Record<PreviewPart, readonly string[]> = {
  case: ['Case_Chassis'], motherboard: ['Motherboard'], gpu: ['GPU'], memory: ['RAM_01', 'RAM_02'],
  cooling: ['AIO_Pump'], psu: ['PSU'], storage: ['SSD_M2'],
};
const SHADOW_ROOTS = new Set(['Case_Chassis', 'Motherboard', 'GPU', 'RAM_01', 'RAM_02', 'AIO_Radiator', 'AIO_Pump']);
export function castsPreviewShadow(object: { name: string; parent: unknown }) {
  let current: typeof object | null = object;
  while (current) {
    if (current.name.includes('Fan')) return false;
    if (SHADOW_ROOTS.has(current.name)) return true;
    current = current.parent as typeof current;
  }
  return false;
}

// Resolve actual glTF primitive children through their named selectable ancestor.
export function logicalPart(object: { name: string; parent: { name: string; parent: unknown } | null }, manifest: ModelManifest): PreviewPart | null {
  let current: { name: string; parent: unknown } | null = object;
  while (current) {
    const entry = manifest.parts[current.name];
    if (entry && CATEGORY_MAP[entry.category]) return CATEGORY_MAP[entry.category];
    current = current.parent as typeof current;
  }
  return null;
}

export function showcasePart(manifest: ModelManifest, part: PreviewPart) {
  return manifest.parts[FOCUS_OBJECTS[part][0]];
}

// Route existing engine messages to both affected parts, without new fit rules.
const RELATED_ISSUES: Record<string, readonly PreviewPart[]> = {
  'gpu-length': ['gpu', 'case'], 'form-factor': ['motherboard', 'case'],
  'cooler-height': ['cooling', 'case'], radiator: ['cooling', 'case'],
};
export function issuesForPart(part: PreviewPart, issues: CompatibilityIssue[]) {
  return issues.filter(issue => issue.category === part || RELATED_ISSUES[issue.code]?.includes(part));
}
