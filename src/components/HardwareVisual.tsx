import { Cpu, CircuitBoard, Fan, HardDrive, MemoryStick, Monitor, Zap } from 'lucide-react';
import type { Component } from '../types';
import { productImages, towerImage } from '../config/product-images';

// Navigation icons remain separate from photographic product imagery.
export const categoryIcons = { cpu: Cpu, gpu: CircuitBoard, motherboard: CircuitBoard, memory: MemoryStick, storage: HardDrive, cooling: Fan, psu: Zap, case: Monitor };

export function PcVisual({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return <img
    className={`pc-visual ${className}`}
    src={towerImage.src}
    alt={towerImage.alt}
    title="Representative build image; exact configuration may vary"
    width={1254}
    height={1254}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'}
    decoding="async"
  />;
}

export function PartVisual({ component }: { component: Component }) {
  const photo = component.category === 'cooling' && component.type === 'liquid' ? productImages['cooling-liquid'] : productImages[component.category];
  return <div className={`part-visual part-${component.category}`}>
    <img src={component.image || photo.src} alt={component.image ? `${component.brand} ${component.name}` : photo.alt} width={1254} height={1254} loading="lazy" decoding="async" />
    {!component.image && <span className="representative-image-label">Representative image</span>}
  </div>;
}
