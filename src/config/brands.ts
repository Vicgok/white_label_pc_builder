export type BrandConfig = {
  id: string; name: string; shortName: string; tagline?: string; logo?: string;
  theme: { primary: string; primaryHover: string; primarySoft: string };
  contact: { phone?: string; whatsapp?: string; email?: string; instagram?: string; address?: string };
  hero: { eyebrow?: string; title: string; description: string };
  trustPoints: string[]; services?: string[]; locations?: { name: string; address: string }[];
};

// Retailer names are supplied by the brief. Contacts and service claims must be verified by the retailer.
const createBrand = (id: string, name: string, shortName: string, primary: string, primaryHover: string, primarySoft: string, title = 'Build the machine\nyou actually need.'): BrandConfig => ({
  id, name, shortName, tagline: 'A better way to build.',
  theme: { primary, primaryHover, primarySoft }, contact: {},
  hero: { eyebrow: 'CUSTOM PC BUILDING, SIMPLIFIED', title, description: 'Your games. Your work. Your budget. Find a balanced PC that fits all three, without getting lost in hundreds of components.' },
  trustPoints: ['Compatibility guidance', 'Balanced configurations', 'Upgrade planning', 'A clear quotation'],
  services: ['Build consultation', 'Component advice', 'Upgrade planning'],
});

export const brands: Record<string, BrandConfig> = {
  byos: createBrand('byos', 'BYOS Computer Store', 'BYOS', '#B54524', '#97371B', '#F7E8E1'),
  satnam: createBrand('satnam', 'Satnam Computers', 'Satnam', '#2454B3', '#1B4190', '#E8EEFA', 'Your next PC.\nBuilt around you.'),
  jaicomputech: createBrand('jaicomputech', 'Jai Computech', 'Jai Computech', '#237355', '#18583F', '#E5F1EB', 'Make room for\nyour next big idea.'),
  microcenter: createBrand('microcenter', 'Microcenter India', 'Microcenter', '#A53939', '#822626', '#F8E8E8', 'More possibilities.\nOne balanced PC.'),
  computergarage360: createBrand('computergarage360', 'Computer Garage 360', 'Computer Garage 360', '#835224', '#643D19', '#F4EBE0', 'Your ambition.\nYour configuration.'),
  itfixer: createBrand('itfixer', 'IT Fixer', 'IT Fixer', '#6B45A5', '#533181', '#EFE9F7', 'A smarter start\nfor your next PC.'),
};
