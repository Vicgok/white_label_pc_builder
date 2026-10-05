export const categories = [
  "cpu",
  "gpu",
  "motherboard",
  "memory",
  "storage",
  "cooling",
  "psu",
  "case",
] as const;
export type ComponentCategory = (typeof categories)[number];
export type Socket = "AM5" | "AM4" | "LGA1700";
export type MemoryType = "DDR4" | "DDR5";
export type FormFactor = "ATX" | "mATX" | "ITX";
export type UseCase =
  "gaming" | "editing" | "rendering" | "streaming" | "ai" | "office";
export type Resolution = "1080p" | "1440p" | "4K";

type Base = {
  id: string;
  brand: string;
  name: string;
  price: number;
  tags: string[];
  image?: string;
};
export type Cpu = Base & {
  category: "cpu";
  socket: Socket;
  cores: number;
  threads: number;
  tdp: number;
  memoryType: MemoryType[];
  integratedGraphics: boolean;
  tier: number;
};
export type Motherboard = Base & {
  category: "motherboard";
  socket: Socket;
  memoryType: MemoryType;
  formFactor: FormFactor;
  wifi: boolean;
};
export type Gpu = Base & {
  category: "gpu";
  recommendedPsu: number;
  boardPower: number;
  lengthMm: number;
  vramGb: number;
  performanceTier: number;
  chip: "NVIDIA" | "AMD";
};
export type Memory = Base & {
  category: "memory";
  memoryType: MemoryType;
  capacityGb: number;
  speed: number;
  kit: string;
};
export type Storage = Base & {
  category: "storage";
  capacityGb: number;
  interface: "NVMe PCIe 4.0";
};
export type Psu = Base & {
  category: "psu";
  wattage: number;
  efficiency: string;
};
export type Case = Base & {
  category: "case";
  supportedFormFactors: FormFactor[];
  maxGpuLengthMm: number;
  maxCoolerHeightMm: number;
  maxRadiatorMm: number;
};
export type Cooler = Base & {
  category: "cooling";
  supportedSockets: Socket[];
  heightMm: number;
  type: "air" | "liquid";
  radiatorMm?: number;
  maxTdp: number;
};
export type Component =
  Cpu | Motherboard | Gpu | Memory | Storage | Psu | Case | Cooler;
export type SelectedComponents = Partial<Record<ComponentCategory, string>>;
export type BuildParts = {
  cpu?: Cpu;
  motherboard?: Motherboard;
  gpu?: Gpu;
  memory?: Memory;
  storage?: Storage;
  psu?: Psu;
  case?: Case;
  cooling?: Cooler;
};
export type BuildSnapshot = {
  buildId: string;
  useCase: UseCase;
  budget: number;
  resolution: Resolution;
  selectedComponents: SelectedComponents;
  savedAt: string | null;
};
export type CompatibilityIssue = {
  severity: "error" | "warning";
  code: string;
  title: string;
  message: string;
  category: ComponentCategory;
};
export type ReadyBuild = {
  slug: string;
  name: string;
  class: string;
  description: string;
  useCases: UseCase[];
  resolution: Resolution;
  components: SelectedComponents;
  accent: string;
  upgrade: string;
};
