import type { Component, ComponentCategory, UseCase } from "../types";
export const categoryLabels: Record<ComponentCategory, string> = {
  cpu: "CPU",
  gpu: "GPU",
  motherboard: "Motherboard",
  memory: "Memory",
  storage: "Storage",
  cooling: "Cooling",
  psu: "Power Supply",
  case: "Case",
};
export const categoryTitles: Record<ComponentCategory, string> = {
  cpu: "Processors",
  gpu: "Graphics cards",
  motherboard: "Motherboards",
  memory: "Memory kits",
  storage: "Storage",
  cooling: "CPU cooling",
  psu: "Power supplies",
  case: "Cases",
};
export const useCaseLabels: Record<UseCase, string> = {
  gaming: "Gaming",
  editing: "Video Editing",
  rendering: "3D & Rendering",
  streaming: "Streaming",
  ai: "AI / Machine Learning",
  office: "Office / Productivity",
};
export const useCaseDescriptions: Record<UseCase, string> = {
  gaming: "More immersion. Fewer compromises.",
  editing: "Keep your timeline moving.",
  rendering: "Bring complex ideas to life.",
  streaming: "Play, create and go live.",
  ai: "Space for your next experiment.",
  office: "A smoother everyday workflow.",
};
export const useCases = Object.keys(useCaseLabels) as UseCase[];
export function componentSpecs(part: Component): string {
  switch (part.category) {
    case "cpu":
      return `${part.cores} cores / ${part.threads} threads · ${part.socket} · ${part.tdp}W`;
    case "gpu":
      return `${part.vramGb}GB VRAM · ${part.lengthMm}mm · ${part.chip}`;
    case "motherboard":
      return `${part.socket} · ${part.memoryType} · ${part.formFactor}${part.wifi ? " · Wi-Fi" : ""}`;
    case "memory":
      return `${part.capacityGb}GB · ${part.memoryType} · ${part.speed} MT/s · ${part.kit}`;
    case "storage":
      return `${part.capacityGb >= 1000 ? `${part.capacityGb / 1000}TB` : `${part.capacityGb}GB`} · ${part.interface}`;
    case "psu":
      return `${part.wattage}W · ${part.efficiency}`;
    case "case":
      return `${part.supportedFormFactors.join(" / ")} · GPU up to ${part.maxGpuLengthMm}mm`;
    case "cooling":
      return `${part.type === "air" ? `${part.heightMm}mm tower` : `${part.radiatorMm}mm liquid`} · ${part.supportedSockets.join(" / ")}`;
  }
}
