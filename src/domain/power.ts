import type { BuildParts } from "../types";
export function estimatePower(parts: BuildParts) {
  if (!parts.cpu && !parts.gpu)
    return { estimatedPower: 0, recommendedPsuWattage: 0 };
  const estimatedPower =
    (parts.cpu?.tdp || 0) + (parts.gpu?.boardPower || 0) + 70;
  return {
    estimatedPower,
    recommendedPsuWattage: Math.max(
      450,
      Math.ceil((estimatedPower * 1.25) / 50) * 50,
      parts.gpu?.recommendedPsu || 0,
    ),
  };
}
