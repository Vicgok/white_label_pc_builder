import type { Component, ComponentCategory, SelectedComponents, BuildParts } from '../types';

// Illustrative catalog only. Prices, specifications and availability require retailer verification.
export const components: Component[] = [
  { id: 'r5-5600', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 5600', price: 10490, socket: 'AM4', cores: 6, threads: 12, tdp: 65, memoryType: ['DDR4'], integratedGraphics: false, tier: 2, tags: ['Value'] },
  { id: 'r5-5600g', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 5600G', price: 11990, socket: 'AM4', cores: 6, threads: 12, tdp: 65, memoryType: ['DDR4'], integratedGraphics: true, tier: 2, tags: ['Integrated graphics'] },
  { id: 'r5-7600', category: 'cpu', brand: 'AMD', name: 'Ryzen 5 7600', price: 18990, socket: 'AM5', cores: 6, threads: 12, tdp: 65, memoryType: ['DDR5'], integratedGraphics: true, tier: 3, tags: ['Balanced'] },
  { id: 'r7-7700', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 7700', price: 26990, socket: 'AM5', cores: 8, threads: 16, tdp: 65, memoryType: ['DDR5'], integratedGraphics: true, tier: 4, tags: ['Multitasking'] },
  { id: 'r7-9700x', category: 'cpu', brand: 'AMD', name: 'Ryzen 7 9700X', price: 31990, socket: 'AM5', cores: 8, threads: 16, tdp: 65, memoryType: ['DDR5'], integratedGraphics: true, tier: 5, tags: ['Recommended'] },
  { id: 'r9-9900x', category: 'cpu', brand: 'AMD', name: 'Ryzen 9 9900X', price: 42990, socket: 'AM5', cores: 12, threads: 24, tdp: 120, memoryType: ['DDR5'], integratedGraphics: true, tier: 7, tags: ['Creator'] },
  { id: 'i5-12400', category: 'cpu', brand: 'Intel', name: 'Core i5-12400', price: 13490, socket: 'LGA1700', cores: 6, threads: 12, tdp: 117, memoryType: ['DDR4', 'DDR5'], integratedGraphics: true, tier: 3, tags: ['Value'] },
  { id: 'i7-14700k', category: 'cpu', brand: 'Intel', name: 'Core i7-14700K', price: 36990, socket: 'LGA1700', cores: 20, threads: 28, tdp: 253, memoryType: ['DDR4', 'DDR5'], integratedGraphics: true, tier: 7, tags: ['Creator', 'Power limit modeled'] },
  { id: 'b550m', category: 'motherboard', brand: 'MSI', name: 'B550M PRO-VDH WiFi', price: 9490, socket: 'AM4', memoryType: 'DDR4', formFactor: 'mATX', wifi: true, tags: ['Wi-Fi'] },
  { id: 'b550', category: 'motherboard', brand: 'ASUS', name: 'TUF Gaming B550-Plus', price: 12990, socket: 'AM4', memoryType: 'DDR4', formFactor: 'ATX', wifi: false, tags: [] },
  { id: 'b650m', category: 'motherboard', brand: 'Gigabyte', name: 'B650M DS3H', price: 12490, socket: 'AM5', memoryType: 'DDR5', formFactor: 'mATX', wifi: false, tags: ['Value'] },
  { id: 'b650-wifi', category: 'motherboard', brand: 'MSI', name: 'B650 Gaming Plus WiFi', price: 16990, socket: 'AM5', memoryType: 'DDR5', formFactor: 'ATX', wifi: true, tags: ['Wi-Fi'] },
  { id: 'b650i', category: 'motherboard', brand: 'ASUS', name: 'ROG Strix B650E-I', price: 26990, socket: 'AM5', memoryType: 'DDR5', formFactor: 'ITX', wifi: true, tags: ['Compact'] },
  { id: 'b660-d4', category: 'motherboard', brand: 'MSI', name: 'PRO B660M-A DDR4', price: 10990, socket: 'LGA1700', memoryType: 'DDR4', formFactor: 'mATX', wifi: false, tags: [] },
  { id: 'b760-d5', category: 'motherboard', brand: 'Gigabyte', name: 'B760M DS3H DDR5', price: 12490, socket: 'LGA1700', memoryType: 'DDR5', formFactor: 'mATX', wifi: false, tags: [] },
  { id: 'z790', category: 'motherboard', brand: 'MSI', name: 'PRO Z790-A WiFi', price: 24990, socket: 'LGA1700', memoryType: 'DDR5', formFactor: 'ATX', wifi: true, tags: ['Wi-Fi'] },
  { id: 'rtx-3050', category: 'gpu', brand: 'MSI', name: 'GeForce RTX 3050 6GB', price: 15990, chip: 'NVIDIA', recommendedPsu: 450, boardPower: 70, lengthMm: 189, vramGb: 6, performanceTier: 1, tags: ['Entry'] },
  { id: 'rx-6600', category: 'gpu', brand: 'ASUS', name: 'Radeon RX 6600 8GB', price: 19490, chip: 'AMD', recommendedPsu: 500, boardPower: 132, lengthMm: 243, vramGb: 8, performanceTier: 2, tags: ['1080p'] },
  { id: 'rtx-4060', category: 'gpu', brand: 'Gigabyte', name: 'GeForce RTX 4060 8GB', price: 27990, chip: 'NVIDIA', recommendedPsu: 550, boardPower: 115, lengthMm: 272, vramGb: 8, performanceTier: 3, tags: ['1080p'] },
  { id: 'rtx-5060', category: 'gpu', brand: 'MSI', name: 'GeForce RTX 5060 8GB', price: 31990, chip: 'NVIDIA', recommendedPsu: 550, boardPower: 145, lengthMm: 250, vramGb: 8, performanceTier: 4, tags: ['1080p'] },
  { id: 'rx-7800xt', category: 'gpu', brand: 'ASUS', name: 'Radeon RX 7800 XT 16GB', price: 45990, chip: 'AMD', recommendedPsu: 700, boardPower: 263, lengthMm: 320, vramGb: 16, performanceTier: 5, tags: ['1440p'] },
  { id: 'rtx-5070', category: 'gpu', brand: 'Gigabyte', name: 'GeForce RTX 5070 12GB', price: 59990, chip: 'NVIDIA', recommendedPsu: 650, boardPower: 250, lengthMm: 282, vramGb: 12, performanceTier: 6, tags: ['Recommended', '1440p'] },
  { id: 'rtx-5070ti', category: 'gpu', brand: 'MSI', name: 'GeForce RTX 5070 Ti 16GB', price: 85990, chip: 'NVIDIA', recommendedPsu: 750, boardPower: 300, lengthMm: 330, vramGb: 16, performanceTier: 7, tags: ['Creator'] },
  { id: 'rtx-5090', category: 'gpu', brand: 'ASUS', name: 'GeForce RTX 5090 32GB', price: 224990, chip: 'NVIDIA', recommendedPsu: 1000, boardPower: 575, lengthMm: 358, vramGb: 32, performanceTier: 10, tags: ['Workstation'] },
  { id: 'd4-16', category: 'memory', brand: 'Kingston', name: 'Fury Beast 16GB DDR4', price: 3490, memoryType: 'DDR4', capacityGb: 16, speed: 3200, kit: '2 × 8GB', tags: [] },
  { id: 'd4-32', category: 'memory', brand: 'Corsair', name: 'Vengeance LPX 32GB DDR4', price: 5990, memoryType: 'DDR4', capacityGb: 32, speed: 3200, kit: '2 × 16GB', tags: [] },
  { id: 'd5-16', category: 'memory', brand: 'Crucial', name: 'Pro 16GB DDR5', price: 5490, memoryType: 'DDR5', capacityGb: 16, speed: 5600, kit: '2 × 8GB', tags: [] },
  { id: 'd5-32', category: 'memory', brand: 'G.Skill', name: 'Flare X5 32GB DDR5', price: 8990, memoryType: 'DDR5', capacityGb: 32, speed: 6000, kit: '2 × 16GB', tags: ['Recommended'] },
  { id: 'd5-64', category: 'memory', brand: 'Kingston', name: 'Fury Beast 64GB DDR5', price: 16990, memoryType: 'DDR5', capacityGb: 64, speed: 6000, kit: '2 × 32GB', tags: ['Creator'] },
  { id: 'd5-96', category: 'memory', brand: 'Corsair', name: 'Vengeance 96GB DDR5', price: 26990, memoryType: 'DDR5', capacityGb: 96, speed: 5600, kit: '2 × 48GB', tags: ['Workstation'] },
  { id: 'nvme-500', category: 'storage', brand: 'Crucial', name: 'P3 Plus 500GB', price: 2990, capacityGb: 500, interface: 'NVMe PCIe 4.0', tags: [] },
  { id: 'nvme-1', category: 'storage', brand: 'Kingston', name: 'NV3 1TB', price: 4990, capacityGb: 1000, interface: 'NVMe PCIe 4.0', tags: ['Value'] },
  { id: 'sn770-1', category: 'storage', brand: 'Western Digital', name: 'Black SN770 1TB', price: 6490, capacityGb: 1000, interface: 'NVMe PCIe 4.0', tags: [] },
  { id: '980-1', category: 'storage', brand: 'Samsung', name: '990 EVO 1TB', price: 8490, capacityGb: 1000, interface: 'NVMe PCIe 4.0', tags: [] },
  { id: 'nvme-2', category: 'storage', brand: 'Crucial', name: 'P3 Plus 2TB', price: 10490, capacityGb: 2000, interface: 'NVMe PCIe 4.0', tags: ['Creator'] },
  { id: '990-2', category: 'storage', brand: 'Samsung', name: '990 PRO 2TB', price: 15990, capacityGb: 2000, interface: 'NVMe PCIe 4.0', tags: ['Performance'] },
  { id: 'psu-450', category: 'psu', brand: 'Cooler Master', name: 'MWE 450 Bronze', price: 3490, wattage: 450, efficiency: '80+ Bronze', tags: [] },
  { id: 'psu-550', category: 'psu', brand: 'Corsair', name: 'CX550', price: 4490, wattage: 550, efficiency: '80+ Bronze', tags: [] },
  { id: 'psu-650', category: 'psu', brand: 'Cooler Master', name: 'MWE 650 Gold', price: 6490, wattage: 650, efficiency: '80+ Gold', tags: [] },
  { id: 'psu-750', category: 'psu', brand: 'Corsair', name: 'RM750e', price: 8990, wattage: 750, efficiency: '80+ Gold', tags: ['Recommended'] },
  { id: 'psu-850', category: 'psu', brand: 'MSI', name: 'MAG A850GL', price: 10490, wattage: 850, efficiency: '80+ Gold', tags: [] },
  { id: 'psu-1000', category: 'psu', brand: 'Corsair', name: 'RM1000e', price: 14990, wattage: 1000, efficiency: '80+ Gold', tags: ['Workstation'] },
  { id: 'case-compact', category: 'case', brand: 'Cooler Master', name: 'MasterBox Q300L', price: 3990, supportedFormFactors: ['mATX', 'ITX'], maxGpuLengthMm: 280, maxCoolerHeightMm: 159, maxRadiatorMm: 240, tags: ['Compact'] },
  { id: 'case-air', category: 'case', brand: 'DeepCool', name: 'CC560', price: 4490, supportedFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 370, maxCoolerHeightMm: 163, maxRadiatorMm: 360, tags: ['Airflow'] },
  { id: 'case-flow', category: 'case', brand: 'NZXT', name: 'H5 Flow', price: 6990, supportedFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 365, maxCoolerHeightMm: 165, maxRadiatorMm: 280, tags: ['Recommended'] },
  { id: 'case-corsair', category: 'case', brand: 'Corsair', name: '4000D Airflow', price: 7990, supportedFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 170, maxRadiatorMm: 360, tags: [] },
  { id: 'case-lian', category: 'case', brand: 'Lian Li', name: 'Lancool 216', price: 9490, supportedFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 392, maxCoolerHeightMm: 180, maxRadiatorMm: 360, tags: ['Airflow'] },
  { id: 'case-north', category: 'case', brand: 'Fractal Design', name: 'North', price: 13990, supportedFormFactors: ['ATX', 'mATX', 'ITX'], maxGpuLengthMm: 355, maxCoolerHeightMm: 170, maxRadiatorMm: 360, tags: ['Studio'] },
  { id: 'cool-basic', category: 'cooling', brand: 'DeepCool', name: 'AG400', price: 1790, supportedSockets: ['AM4', 'AM5', 'LGA1700'], heightMm: 150, type: 'air', maxTdp: 130, tags: ['Value'] },
  { id: 'cool-212', category: 'cooling', brand: 'Cooler Master', name: 'Hyper 212 Black', price: 2990, supportedSockets: ['AM4', 'AM5', 'LGA1700'], heightMm: 159, type: 'air', maxTdp: 150, tags: [] },
  { id: 'cool-ak400', category: 'cooling', brand: 'DeepCool', name: 'AK400', price: 2490, supportedSockets: ['AM4', 'AM5', 'LGA1700'], heightMm: 155, type: 'air', maxTdp: 150, tags: [] },
  { id: 'cool-ak620', category: 'cooling', brand: 'DeepCool', name: 'AK620', price: 5490, supportedSockets: ['AM4', 'AM5', 'LGA1700'], heightMm: 160, type: 'air', maxTdp: 240, tags: ['Creator'] },
  { id: 'cool-240', category: 'cooling', brand: 'Corsair', name: 'Nautilus 240', price: 7990, supportedSockets: ['AM4', 'AM5', 'LGA1700'], heightMm: 0, type: 'liquid', radiatorMm: 240, maxTdp: 260, tags: [] },
  { id: 'cool-360', category: 'cooling', brand: 'NZXT', name: 'Kraken 360', price: 16990, supportedSockets: ['AM5', 'LGA1700'], heightMm: 0, type: 'liquid', radiatorMm: 360, maxTdp: 300, tags: ['Workstation'] },
];

export const componentById = new Map(components.map(component => [component.id, component]));
export function resolveParts(selected: SelectedComponents): BuildParts {
  const result: Record<string, Component> = {};
  for (const [category, id] of Object.entries(selected)) {
    const component = componentById.get(id!);
    if (component?.category === category) result[category] = component;
  }
  return result as BuildParts;
}
export const getComponents = <C extends ComponentCategory>(category: C) => components.filter((c): c is Extract<Component, { category: C }> => c.category === category);
