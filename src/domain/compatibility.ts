import type {
  BuildParts,
  CompatibilityIssue,
  ComponentCategory,
} from "../types";
import { estimatePower } from "./power";
export { estimatePower } from "./power";

const issue = (
  code: string,
  title: string,
  message: string,
  category: ComponentCategory,
  severity: "error" | "warning" = "error",
): CompatibilityIssue => ({ code, title, message, category, severity });
export function checkCpuMotherboardCompatibility({
  cpu,
  motherboard,
}: BuildParts): CompatibilityIssue[] {
  return cpu && motherboard && cpu.socket !== motherboard.socket
    ? [
        issue(
          "socket",
          "CPU socket mismatch",
          `${cpu.name} uses ${cpu.socket}; this motherboard uses ${motherboard.socket}.`,
          "motherboard",
        ),
      ]
    : [];
}
export function checkMemoryCompatibility({
  cpu,
  motherboard,
  memory,
}: BuildParts): CompatibilityIssue[] {
  if (!memory) return [];
  if (motherboard && motherboard.memoryType !== memory.memoryType)
    return [
      issue(
        "memory",
        "Choose compatible memory",
        `This motherboard supports ${motherboard.memoryType}, but the selected kit is ${memory.memoryType}.`,
        "memory",
      ),
    ];
  return cpu && !cpu.memoryType.includes(memory.memoryType)
    ? [
        issue(
          "cpu-memory",
          "CPU memory mismatch",
          `This CPU does not support ${memory.memoryType}.`,
          "memory",
        ),
      ]
    : [];
}
export function checkCaseCompatibility({
  motherboard,
  gpu,
  case: enclosure,
}: BuildParts): CompatibilityIssue[] {
  if (!enclosure) return [];
  const issues: CompatibilityIssue[] = [];
  if (
    motherboard &&
    !enclosure.supportedFormFactors.includes(motherboard.formFactor)
  )
    issues.push(
      issue(
        "form-factor",
        "Motherboard does not fit",
        `This ${motherboard.formFactor} motherboard is not supported by ${enclosure.name}.`,
        "case",
      ),
    );
  if (gpu && gpu.lengthMm > enclosure.maxGpuLengthMm)
    issues.push(
      issue(
        "gpu-length",
        "Graphics card is too long",
        `The GPU is ${gpu.lengthMm}mm; this case allows ${enclosure.maxGpuLengthMm}mm.`,
        "case",
      ),
    );
  return issues;
}
export function checkCoolerCompatibility({
  cpu,
  cooling,
  case: enclosure,
}: BuildParts): CompatibilityIssue[] {
  if (!cooling) return [];
  const issues: CompatibilityIssue[] = [];
  if (cpu && !cooling.supportedSockets.includes(cpu.socket))
    issues.push(
      issue(
        "cooler-socket",
        "Cooler socket mismatch",
        `This cooler does not support ${cpu.socket}.`,
        "cooling",
      ),
    );
  if (
    enclosure &&
    cooling.type === "air" &&
    cooling.heightMm > enclosure.maxCoolerHeightMm
  )
    issues.push(
      issue(
        "cooler-height",
        "Cooler is too tall",
        `The cooler is ${cooling.heightMm}mm; the case allows ${enclosure.maxCoolerHeightMm}mm.`,
        "cooling",
      ),
    );
  if (
    enclosure &&
    cooling.type === "liquid" &&
    (cooling.radiatorMm || 0) > enclosure.maxRadiatorMm
  )
    issues.push(
      issue(
        "radiator",
        "Radiator does not fit",
        `The ${cooling.radiatorMm}mm radiator exceeds the case's modeled limit of ${enclosure.maxRadiatorMm}mm.`,
        "cooling",
      ),
    );
  if (cpu && cpu.tdp > cooling.maxTdp)
    issues.push(
      issue(
        "cooler-capacity",
        "More cooling headroom needed",
        `Modeled CPU power is ${cpu.tdp}W; this cooler is modeled for ${cooling.maxTdp}W.`,
        "cooling",
        "warning",
      ),
    );
  return issues;
}
export function checkPsuCompatibility(parts: BuildParts): CompatibilityIssue[] {
  if (!parts.psu || (!parts.cpu && !parts.gpu)) return [];
  const { estimatedPower, recommendedPsuWattage } = estimatePower(parts);
  if (parts.psu.wattage < estimatedPower)
    return [
      issue(
        "psu-insufficient",
        "Power supply is insufficient",
        `Estimated draw is ${estimatedPower}W, above the selected ${parts.psu.wattage}W PSU. Choose ${recommendedPsuWattage}W or greater.`,
        "psu",
      ),
    ];
  return parts.psu.wattage < recommendedPsuWattage
    ? [
        issue(
          "psu-headroom",
          "Allow more power headroom",
          `Estimated draw is ${estimatedPower}W. A ${recommendedPsuWattage}W or greater PSU is recommended.`,
          "psu",
          "warning",
        ),
      ]
    : [];
}
export function validateBuild(parts: BuildParts) {
  const issues = [
    ...checkCpuMotherboardCompatibility(parts),
    ...checkMemoryCompatibility(parts),
    ...checkCaseCompatibility(parts),
    ...checkCoolerCompatibility(parts),
    ...checkPsuCompatibility(parts),
  ];
  const missing: ComponentCategory[] = (
    [
      "cpu",
      "motherboard",
      "memory",
      "storage",
      "cooling",
      "psu",
      "case",
    ] as const
  ).filter((category) => !parts[category]);
  if (!parts.gpu && !parts.cpu?.integratedGraphics) missing.push("gpu");
  return {
    issues,
    missing,
    compatible: !issues.some((i) => i.severity === "error"),
    complete: missing.length === 0,
  };
}
