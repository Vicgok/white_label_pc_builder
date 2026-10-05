import { resolveParts } from '../data/components';
import type { SelectedComponents } from '../types';

// Specification text is application data, never part of the product image.
export function ProductCallouts({ selectedComponents }: { selectedComponents: SelectedComponents }) {
  const { cpu, gpu, memory, cooling } = resolveParts(selectedComponents);
  const callouts = [
    { key: 'cpu', label: 'CPU', value: cpu?.name },
    { key: 'gpu', label: 'GPU', value: gpu?.name.replace(/^GeForce /, '').replace(/ (\d+)GB$/, ' · $1GB') },
    { key: 'memory', label: 'Memory', value: memory ? `${memory.capacityGb}GB ${memory.memoryType}` : undefined },
    { key: 'cooling', label: 'Cooling', value: cooling ? cooling.type === 'liquid' ? `${cooling.radiatorMm}mm AIO` : `${cooling.name} · air` : undefined },
  ];

  return <dl className="product-callouts" aria-label="Build specification labels">
    {callouts.filter(callout => callout.value).map(callout => <div className={`technical-callout callout-${callout.key}`} key={callout.key}>
      <div className="callout-label"><dt>{callout.label}</dt><dd>{callout.value}</dd></div>
      <span className="callout-rule" aria-hidden="true" />
    </div>)}
  </dl>;
}
