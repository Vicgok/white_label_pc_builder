import type { CompatibilityIssue, ComponentCategory } from '../../types';

export type PreviewPart = Exclude<ComponentCategory, 'cpu'>;
export type Vec3 = [number, number, number];
export type PartManifest = {
  category: string;
  productId: string;
  displayName: string;
  explodedOffset: Vec3;
};
export type ModelManifest = {
  version: 1;
  asset: string;
  units: 'meters';
  parts: Record<string, PartManifest>;
  cableObjects: string[];
};
export type PartStatus = { issues: CompatibilityIssue[]; label: string };
export type CameraRequest = { sequence: number; kind: 'reset' | 'focus'; part?: PreviewPart };
export const MODEL_URL = '/assets/3d/rigpilot-demo-pc.glb';
export const MANIFEST_URL = '/assets/3d/rigpilot-demo-pc.manifest.json';
export const CRITICAL_OBJECTS = ['Case_Chassis', 'Case_SideGlass', 'Motherboard', 'GPU',
  'RAM_01', 'RAM_02', 'AIO_Radiator', 'AIO_Pump', 'PSU', 'SSD_M2'] as const;
