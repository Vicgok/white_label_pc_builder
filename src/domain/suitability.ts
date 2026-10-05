import { resolveParts } from '../data/components';
import { validateBuild } from './compatibility';
import type { SelectedComponents } from '../types';
export function estimateSuitability(selected: SelectedComponents) {
  const parts = resolveParts(selected);
  const { gpu, cpu, memory } = parts;
  const validation = validateBuild(parts);
  const workloads = ['1080p gaming', '1440p gaming', '4K gaming', 'Video editing', 'Streaming', 'Local AI / ML'];
  if (!validation.complete || !validation.compatible) return workloads.map(label => [label, validation.complete ? 'Needs review' : 'Needs complete build']);
  const tier = gpu?.performanceTier || 0;
  const label = (value: number) => value >= 6 ? 'Excellent' : value >= 4 ? 'Very good' : value >= 2 ? 'Capable' : 'Limited';
  return [
    ['1080p gaming', label(gpu ? tier + 2 : 0)], ['1440p gaming', label(tier)], ['4K gaming', label(tier - 2)],
    ['Video editing', label(Math.min(cpu?.tier || 0, (memory?.capacityGb || 0) / 8))],
    ['Streaming', label(Math.min(tier, (cpu?.tier || 0) + 1))],
    ['Local AI / ML', gpu?.chip === 'NVIDIA' ? label(gpu.vramGb / 3) : 'Limited'],
  ];
}
