import { createContext, useContext } from 'react';
import { brands, type BrandConfig } from './brands';

export function resolveBrand(search: string, environmentBrand = import.meta.env.VITE_ACTIVE_BRAND): { brand: BrandConfig; missing: string | null } {
  const requested = new URLSearchParams(search).get('brand') || environmentBrand || 'byos';
  return { brand: brands[requested] || brands.byos, missing: brands[requested] ? null : requested };
}
export const BrandContext = createContext<BrandConfig>(brands.byos);
export const useBrand = () => useContext(BrandContext);
