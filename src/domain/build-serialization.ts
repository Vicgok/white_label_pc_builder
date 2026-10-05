import { componentById } from "../data/components";
import { categories, type BuildSnapshot } from "../types";

export function isBuildSnapshot(value: unknown): value is BuildSnapshot {
  if (!value || typeof value !== "object") return false;
  const b = value as BuildSnapshot;
  return (
    typeof b.buildId === "string" &&
    /^PC-[A-Z0-9]{4,12}$/.test(b.buildId) &&
    ["gaming", "editing", "rendering", "streaming", "ai", "office"].includes(
      b.useCase,
    ) &&
    Number.isFinite(b.budget) &&
    b.budget >= 10000 &&
    b.budget <= 1000000 &&
    ["1080p", "1440p", "4K"].includes(b.resolution) &&
    (b.savedAt === null ||
      (typeof b.savedAt === "string" &&
        Number.isFinite(Date.parse(b.savedAt)))) &&
    !!b.selectedComponents &&
    typeof b.selectedComponents === "object" &&
    !Array.isArray(b.selectedComponents) &&
    Object.entries(b.selectedComponents).every(
      ([category, id]) =>
        categories.includes(category as (typeof categories)[number]) &&
        typeof id === "string" &&
        componentById.get(id)?.category === category,
    )
  );
}
export function serializeBuild(build: BuildSnapshot): string {
  return btoa(JSON.stringify({ version: 1, ...build }));
}
export function deserializeBuild(encoded: string): BuildSnapshot | null {
  try {
    if (encoded.length > 10000) return null;
    const parsed = JSON.parse(atob(encoded));
    if (parsed.version !== 1 || !isBuildSnapshot(parsed)) return null;
    const {
      buildId,
      useCase,
      budget,
      resolution,
      selectedComponents,
      savedAt,
    } = parsed;
    return {
      buildId,
      useCase,
      budget,
      resolution,
      selectedComponents,
      savedAt,
    };
  } catch {
    return null;
  }
}
