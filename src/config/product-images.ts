import type { ComponentCategory } from "../types";

type ProductImage = { src: string; alt: string };
// Generated representative category images. Exact SKU photos can override these in catalog data.
export const towerImage: ProductImage = {
  src: "/images/products/pc-tower.jpg",
  alt: "Representative studio image of a graphite custom desktop PC with tempered glass, neatly routed cables and subtle white interior lighting",
};
export const productImages: Record<
  ComponentCategory | "cooling-liquid",
  ProductImage
> = {
  cpu: {
    src: "/images/products/cpu.jpg",
    alt: "Representative studio image of a desktop processor with a brushed metal heat spreader",
  },
  gpu: {
    src: "/images/products/gpu.jpg",
    alt: "Representative studio image of a black three-fan graphics card with metal heatsink and PCIe connector",
  },
  motherboard: {
    src: "/images/products/motherboard.jpg",
    alt: "Representative studio image of a motherboard showing its socket, memory slots, PCIe slots and metal heatsinks",
  },
  memory: {
    src: "/images/products/memory.jpg",
    alt: "Representative studio image of two black memory modules with brushed aluminum heat spreaders",
  },
  storage: {
    src: "/images/products/storage.jpg",
    alt: "Representative studio image of an M.2 solid-state drive with visible controller and memory chips",
  },
  psu: {
    src: "/images/products/psu.jpg",
    alt: "Representative studio image of a textured black power supply with fan grille and sleeved cables",
  },
  case: {
    src: "/images/products/case.jpg",
    alt: "Representative studio image of an empty graphite PC case with mesh ventilation and tempered glass",
  },
  cooling: {
    src: "/images/products/cooling.jpg",
    alt: "Representative studio image of an air CPU cooler with aluminum fins, copper heat pipes and black fan",
  },
  "cooling-liquid": {
    src: "/images/products/cooling-liquid.jpg",
    alt: "Representative studio image of a liquid CPU cooler with a two-fan radiator, pump and braided tubes",
  },
};
