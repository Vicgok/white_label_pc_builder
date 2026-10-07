import { productConfig } from "../config/product";
import { categories, type BuildSnapshot } from "../types";
import { resolveParts } from "../data/components";
import { calculateBuildTotal, money } from "./pricing";
import { validateBuild } from "./compatibility";
import { estimatePower } from "./power";
import { serializeBuild } from "./build-serialization";
import { categoryLabels, useCaseLabels } from "../utils/catalog";

export function buildText(build: BuildSnapshot) {
  const parts = resolveParts(build.selectedComponents);
  const validation = validateBuild(parts);
  const power = estimatePower(parts);
  const rows = categories.map((category) => {
    const part = parts[category];
    const name = part
      ? `${part.name.startsWith(part.brand + " ") ? "" : part.brand + " "}${part.name}`
      : category === "gpu" && parts.cpu?.integratedGraphics
        ? "Integrated graphics"
        : "Not selected";
    return `${category === "psu" ? "PSU" : categoryLabels[category]}: ${name}`;
  });
  return [
    `${productConfig.name} Build`,
    `Build ID: ${build.buildId}`,
    "",
    `Use case: ${useCaseLabels[build.useCase]}`,
    `Target: ${build.resolution}`,
    "",
    ...rows,
    "",
    `Estimated total: ${money(calculateBuildTotal(build.selectedComponents))}`,
    "",
    `Estimated system power: ${power.estimatedPower}W`,
    `Recommended PSU: ${power.recommendedPsuWattage ? `${power.recommendedPsuWattage}W+` : "Select components first"}`,
    "",
    "Compatibility:",
    ...(validation.complete && validation.issues.length === 0
      ? ["All selected components are compatible."]
      : [
          ...validation.missing.map((category) => `Missing: ${categoryLabels[category]}.`),
          ...validation.issues.map((issue) => `${issue.title}: ${issue.message}`),
        ]),
    "Checks cover modeled properties; confirm BIOS support, connectors and exact fit with your retailer.",
    "",
    productConfig.pricingDisclaimer,
    "",
    `Generated with ${productConfig.name}.`,
  ].join("\n");
}

export function buildShareUrl(build: BuildSnapshot, origin: string) {
  const url = new URL("/builder", origin);
  url.searchParams.set("shared", serializeBuild(build));
  return url.toString();
}
