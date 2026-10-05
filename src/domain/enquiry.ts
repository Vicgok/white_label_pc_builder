import type { BrandConfig } from "../config/brands";
import type { BuildSnapshot } from "../types";
import { resolveParts } from "../data/components";
import { calculateBuildTotal, money } from "./pricing";
import { categoryLabels, useCaseLabels } from "../utils/catalog";
export function buildText(build: BuildSnapshot, brand: BrandConfig) {
  const rows = Object.entries(resolveParts(build.selectedComponents)).map(
    ([category, part]) =>
      `${categoryLabels[category as keyof typeof categoryLabels]}: ${part.brand} ${part.name}`,
  );
  return [
    `Hi ${brand.name},`,
    "",
    "I'm interested in this PC build.",
    "",
    `Build reference: ${build.buildId}`,
    ...rows,
    "",
    `Estimated total (sample pricing): ${money(calculateBuildTotal(build.selectedComponents))}`,
    `Usage: ${useCaseLabels[build.useCase]}`,
    `Target: ${build.resolution}`,
    "",
    "Can you confirm availability and final quotation?",
  ].join("\n");
}
export function whatsappUrl(
  brand: BrandConfig,
  message: string,
): string | null {
  const number = brand.contact.whatsapp?.replace(/[^0-9]/g, "");
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}
